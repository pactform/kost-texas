import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { soundEngine } from '../engine/audio';
import {
  buildAlleyStreetscape3D,
  buildChibi3D,
  buildJanda3D,
  buildMangoTree3D,
  buildRoomUnit3D,
  buildScooter3D,
  enableShadows,
  makeLabelSprite,
} from '../engine/models3d';
import { createWorldTextures, type WorldTextures } from '../engine/textures3d';
import type { GameAction } from '../engine/store';
import type { FloorNumber, GameState } from '../types/game';

interface ThreeWorldProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const FLOOR_H = 3.2;
const ROOM_W = 4.2;

/**
 * Computes crisp 3D world position for each room id so all floors stack cleanly like IMG_0802 & IMG_0801!
 */
function getRoom3DPosition(roomId: string, floor: FloorNumber): { x: number; y: number; z: number } {
  const indexMap: Record<string, number> = {
    '101': 0,
    '102': 1,
    '103': 2,
    '104': 3,
    '201': 0,
    '202': 1,
    '203': 2,
    '301': 0,
    '302': 1,
  };
  const idx = indexMap[roomId] ?? 0;
  return {
    x: -6.3 + idx * ROOM_W,
    y: (floor - 1) * FLOOR_H,
    z: -1.6,
  };
}

export const ThreeWorld: React.FC<ThreeWorldProps> = ({ state, dispatch }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [sprint, setSprint] = useState(false);
  const sprintRef = useRef(false);
  sprintRef.current = sprint;

  // Interior Dollhouse camera horizontal pan offset (◀ / ▶ arrows like IMG_0801!)
  const [interiorPanX, setInteriorPanX] = useState(0);
  const interiorPanXRef = useRef(0);
  interiorPanXRef.current = interiorPanX;

  // Owner 3D position (x along alley -14..18, z depth 1.2..9.0)
  const owner3DRef = useRef({ x: -1.8, y: 0, z: 6.4, yaw: 0 });
  const keysRef = useRef<Set<string>>(new Set());
  const joyVecRef = useRef({ x: 0, y: 0 });
  const camOrbitRef = useRef({ panX: 0, zoomScale: 1 });
  const dragRef = useRef<{ active: boolean; startX: number; moved: boolean }>({
    active: false,
    startX: 0,
    moved: false,
  });

  // Scene refs for dynamic rebuild when state changes
  const sceneObjectsRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    textures: WorldTextures;
    dynamicGroup: THREE.Group;
    frontFacades: THREE.Group[];
    roofGroup: THREE.Group;
    ownerRig: ReturnType<typeof buildChibi3D> | null;
    jandaRig: ReturnType<typeof buildJanda3D> | null;
    npcRigs: {
      rig: ReturnType<typeof buildChibi3D>;
      baseX: number;
      baseZ: number;
      phase: number;
      interactId?: string;
      role: string;
    }[];
    sunLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    rainPoints: THREE.Points | null;
  } | null>(null);

  const [nearbyTick, setNearbyTick] = useState(0);

  // Keyboard WASD / Arrows
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) {
        keysRef.current.add(k);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // Initialize Three.js WebGLRenderer, Lights, Static Ground & Road ONCE
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#9EC5F2');
    scene.fog = new THREE.Fog('#BBD7F6', 36, 92);

    const camera = new THREE.PerspectiveCamera(
      40,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.5,
      140
    );
    camera.position.set(-14, 11.5, 20.5);
    camera.lookAt(0, 2.2, 1.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const textures = createWorldTextures();

    // Lighting: Warm tropical sunlight casting crisp dollhouse shadows (like IMG_0801 & IMG_0802!)
    const hemiLight = new THREE.HemisphereLight('#E6F4FF', '#998A72', 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#FFF5DF', 1.75);
    sunLight.position.set(16, 26, 18);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 75;
    sunLight.shadow.camera.left = -28;
    sunLight.shadow.camera.right = 28;
    sunLight.shadow.camera.top = 22;
    sunLight.shadow.camera.bottom = -22;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // === STATIC INDONESIAN GANG GROUND, COURTYARD, ROAD & PAVING ===
    // Lush surrounding tropical grass lawn
    const grass = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 90),
      new THREE.MeshStandardMaterial({ color: '#78A65E', roughness: 0.95 })
    );
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(2, -0.05, 4);
    grass.receiveShadow = true;
    scene.add(grass);

    // Kost Texas Conblock Yard (in front of kos building)
    const yard = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.14, 7.6),
      new THREE.MeshStandardMaterial({ map: textures.pavingBrick, roughness: 0.9 })
    );
    yard.position.set(0, -0.02, 1.4);
    yard.receiveShadow = true;
    scene.add(yard);

    // Main Indonesian Asphalt Alley Road (IMG_0802!)
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(72, 0.12, 4.6),
      new THREE.MeshStandardMaterial({ map: textures.asphaltRoad, roughness: 0.88 })
    );
    road.position.set(3, -0.02, 7.2);
    road.receiveShadow = true;
    scene.add(road);

    // Crisp White Concrete Sidewalk Curbs flanking the asphalt road
    const curbMat = new THREE.MeshStandardMaterial({ color: '#E3DED4', roughness: 0.85 });
    const curbN = new THREE.Mesh(new THREE.BoxGeometry(72, 0.22, 0.45), curbMat);
    curbN.position.set(3, 0.04, 4.85);
    curbN.receiveShadow = true;
    scene.add(curbN);
    const curbS = new THREE.Mesh(new THREE.BoxGeometry(72, 0.22, 0.45), curbMat);
    curbS.position.set(3, 0.04, 9.55);
    curbS.receiveShadow = true;
    scene.add(curbS);

    // Conblock plaza across the street (IMG_0802 foreground!)
    const plazaS = new THREE.Mesh(
      new THREE.BoxGeometry(72, 0.12, 14),
      new THREE.MeshStandardMaterial({ map: textures.pavingBrick, roughness: 0.92 })
    );
    plazaS.position.set(3, -0.02, 16.6);
    plazaS.receiveShadow = true;
    scene.add(plazaS);

    // Iconic Tropical Mango Tree + Old Family Teak Bench in Courtyard!
    const mangoTree = buildMangoTree3D();
    mangoTree.position.set(-8.6, 0, 2.2);
    scene.add(mangoTree);

    const benchWood = new THREE.MeshStandardMaterial({ map: textures.woodTeak, roughness: 0.8 });
    const bench = new THREE.Group();
    bench.position.set(-6.4, 0, 3.2);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.6), benchWood);
    seat.position.set(0, 0.48, 0);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.42, 0.1), benchWood);
    back.position.set(0, 0.78, -0.25);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.46, 0.5), benchWood);
    legL.position.set(-0.72, 0.23, 0);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.46, 0.5), benchWood);
    legR.position.set(0.72, 0.23, 0);
    bench.add(seat, back, legL, legR);
    enableShadows(bench, true, true);
    scene.add(bench);

    // Front Concrete Pillar Fence + Green Iron Railings + Open Gate (IMG_0802!)
    const fenceWallMat = new THREE.MeshStandardMaterial({ color: '#EAE2CE', roughness: 0.85 });
    const fenceRailMat = new THREE.MeshStandardMaterial({ color: '#275940', roughness: 0.5, metalness: 0.3 });
    for (let fx = -9.6; fx <= 8.6; fx += 2.6) {
      if (fx > -2.4 && fx < 1.2) continue; // Wide clean entrance gate!
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.35, 0.32), fenceWallMat);
      pillar.position.set(fx, 0.67, 4.75);
      scene.add(pillar);
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.52, 0.18), fenceWallMat);
      base.position.set(fx + 1.2, 0.26, 4.75);
      scene.add(base);
      const railTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), fenceRailMat);
      railTop.position.set(fx + 1.2, 1.18, 4.75);
      scene.add(railTop);
      for (let b = 0.2; b <= 2.2; b += 0.34) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.66, 0.04), fenceRailMat);
        bar.position.set(fx + b, 0.85, 4.75);
        scene.add(bar);
      }
    }

    // Dynamic World Group (rebuilt cleanly whenever buildings/tenants/time/weather change)
    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);

    const roofGroup = new THREE.Group();
    scene.add(roofGroup);

    // Rain particle system
    const rainCount = 420;
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 44;
      rainPositions[i * 3 + 1] = Math.random() * 16;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 28;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({ color: '#D4EEFF', size: 0.14, transparent: true, opacity: 0.72 });
    const rainPoints = new THREE.Points(rainGeo, rainMat);
    rainPoints.visible = false;
    scene.add(rainPoints);

    sceneObjectsRef.current = {
      scene,
      camera,
      renderer,
      textures,
      dynamicGroup,
      frontFacades: [],
      roofGroup,
      ownerRig: null,
      jandaRig: null,
      npcRigs: [],
      sunLight,
      hemiLight,
      rainPoints,
    };

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    // 60fps Animation Loop
    let raf = 0;
    let lastTs = performance.now();
    let syncTimer = 0;

    const animate = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      const st = stateRef.current;
      const objs = sceneObjectsRef.current;
      if (!objs) {
        raf = requestAnimationFrame(animate);
        return;
      }
      const tSec = st.reducedMotion ? 0 : now / 1000;

      // 1. Move Owner (WASD / Arrow keys / Virtual Joystick!)
      let mx = joyVecRef.current.x;
      let mz = joyVecRef.current.y;
      const ks = keysRef.current;
      if (ks.has('a') || ks.has('arrowleft')) mx -= 1;
      if (ks.has('d') || ks.has('arrowright')) mx += 1;
      if (ks.has('w') || ks.has('arrowup')) mz -= 1;
      if (ks.has('s') || ks.has('arrowdown')) mz += 1;

      const isSprinting = sprintRef.current || ks.has('shift');
      const moveSpeed = isSprinting ? 7.2 : 4.2;
      let ownerMoving = false;
      if (Math.hypot(mx, mz) > 0.08) {
        const len = Math.hypot(mx, mz);
        const nx = Math.max(-14, Math.min(18, owner3DRef.current.x + (mx / len) * moveSpeed * dt));
        const nz = Math.max(0.6, Math.min(9.0, owner3DRef.current.z + (mz / len) * moveSpeed * dt));
        owner3DRef.current.x = nx;
        owner3DRef.current.z = nz;
        owner3DRef.current.yaw = Math.atan2(mx, mz);
        ownerMoving = true;
      }

      const ownerFloorY = (st.activeFloor - 1) * FLOOR_H;
      if (objs.ownerRig) {
        objs.ownerRig.group.position.set(owner3DRef.current.x, ownerFloorY + 0.12, owner3DRef.current.z);
        objs.ownerRig.group.rotation.y = owner3DRef.current.yaw;
        const swing = ownerMoving ? Math.sin(tSec * (isSprinting ? 14 : 9)) * 0.65 : 0;
        objs.ownerRig.leftLeg.rotation.x = swing;
        objs.ownerRig.rightLeg.rotation.x = -swing;
        objs.ownerRig.leftArm.rotation.x = -swing * 0.7;
        objs.ownerRig.rightArm.rotation.x = swing * 0.7;
      }

      // 2. Animate Janda Tuxedo Cat gently roaming & wagging tail!
      if (objs.jandaRig) {
        const jAngle = tSec * 0.45;
        const jx = -5.4 + Math.cos(jAngle) * 1.1;
        const jz = 2.8 + Math.sin(jAngle) * 0.7;
        objs.jandaRig.group.position.set(jx, 0.08, jz);
        objs.jandaRig.group.rotation.y = -jAngle;
        objs.jandaRig.tail.rotation.z = Math.sin(tSec * 5) * 0.35;
      }

      // 3. Animate NPCs gently strolling along corridor & alley street!
      objs.npcRigs.forEach((n) => {
        const stroll = Math.sin(tSec * 0.55 + n.phase) * 1.4;
        const currX = n.baseX + stroll;
        const velX = Math.cos(tSec * 0.55 + n.phase);
        n.rig.group.position.x = currX;
        n.rig.group.position.z = n.baseZ;
        n.rig.group.rotation.y = velX >= 0 ? Math.PI / 2 : -Math.PI / 2;
        const sw = Math.sin(tSec * 7 + n.phase) * 0.45;
        n.rig.leftLeg.rotation.x = sw;
        n.rig.rightLeg.rotation.x = -sw;
        n.rig.leftArm.rotation.x = -sw * 0.6;
        n.rig.rightArm.rotation.x = sw * 0.6;
      });

      // 4. Toggle Front Facades & Roof smoothly for Exterior (`IMG_0802`) vs Interior Dollhouse (`IMG_0801`)!
      const isInterior = st.cutaway;
      objs.frontFacades.forEach((f) => {
        f.visible = !isInterior;
      });
      objs.roofGroup.visible = !isInterior;

      // 5. Smooth Camera Lerp between 3D Street Panorama (IMG_0802) & 3D Dollhouse Room Interior (IMG_0801)!
      const floorElev = (st.activeFloor - 1) * FLOOR_H;
      const targetPos = new THREE.Vector3();
      const targetLook = new THREE.Vector3();

      if (isInterior) {
        // IMG_0801 angle: Clean sunlit top-angled dollhouse cross-section looking straight into side-by-side rooms!
        const cx = -1.6 + interiorPanXRef.current;
        targetPos.set(cx, floorElev + 8.6 * camOrbitRef.current.zoomScale, 9.8 * camOrbitRef.current.zoomScale);
        targetLook.set(cx, floorElev + 1.0, -1.5);
      } else {
        // IMG_0802 angle: Dramatic 3/4 Indonesian street panorama showing stacked 1F/2F/3F kos + road + poles + neighbors!
        const focusX = owner3DRef.current.x * 0.35 + camOrbitRef.current.panX;
        const zScale = camOrbitRef.current.zoomScale;
        targetPos.set(focusX - 12.5 * zScale, floorElev + 9.2 * zScale, 17.8 * zScale);
        targetLook.set(focusX + 2.2, floorElev + 2.4, 0.8);
      }

      const camLerp = st.reducedMotion ? 1 : Math.min(1, dt * 5.5);
      objs.camera.position.lerp(targetPos, camLerp);
      objs.camera.lookAt(targetLook);

      // 6. Animate 3D Raindrops
      if (objs.rainPoints) {
        const raining = st.weather === 'hujan' || st.weather === 'hujan_deras';
        objs.rainPoints.visible = raining;
        if (raining && !st.reducedMotion) {
          const posAttr = objs.rainPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
          for (let i = 0; i < posAttr.count; i++) {
            let y = posAttr.getY(i) - 18 * dt;
            if (y < 0) y = 16;
            posAttr.setY(i, y);
          }
          posAttr.needsUpdate = true;
        }
      }

      // Sync nearby tick every 350ms
      syncTimer += dt;
      if (syncTimer > 0.35) {
        syncTimer = 0;
        setNearbyTick((t) => (t + 1) % 10000);
      }

      objs.renderer.render(objs.scene, objs.camera);
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
    };
  }, []);

  // Rebuild dynamic 3D world elements whenever buildings, rooms, tenants, bikes, outfit, slot, or weather change
  useEffect(() => {
    const objs = sceneObjectsRef.current;
    if (!objs) return;

    const { dynamicGroup, roofGroup, textures, scene, sunLight, hemiLight } = objs;
    dynamicGroup.clear();
    roofGroup.clear();
    objs.frontFacades = [];
    objs.npcRigs = [];

    const isNight = state.slot === 'malam';
    const isDusk = state.slot === 'sore';
    const isMorning = state.slot === 'pagi';

    // Update sky & sunlight mood!
    if (isNight) {
      scene.background = new THREE.Color('#132230');
      scene.fog = new THREE.Fog('#132230', 32, 85);
      sunLight.color.set('#7A9EC7');
      sunLight.intensity = 0.65;
      hemiLight.color.set('#3A5A78');
      hemiLight.groundColor.set('#1F2624');
      hemiLight.intensity = 0.55;
    } else if (isDusk) {
      scene.background = new THREE.Color('#E3B68B');
      scene.fog = new THREE.Fog('#E8C59E', 36, 90);
      sunLight.color.set('#FFBE78');
      sunLight.intensity = 1.65;
      sunLight.position.set(22, 16, 16);
      hemiLight.color.set('#FFE3BE');
      hemiLight.groundColor.set('#8F7256');
      hemiLight.intensity = 0.78;
    } else if (isMorning) {
      scene.background = new THREE.Color('#A8D2F5');
      scene.fog = new THREE.Fog('#C4E0F7', 38, 95);
      sunLight.color.set('#FFF5DF');
      sunLight.intensity = 1.75;
      sunLight.position.set(16, 26, 18);
      hemiLight.color.set('#EBF6FF');
      hemiLight.groundColor.set('#9C8F77');
      hemiLight.intensity = 0.88;
    } else {
      // Bright sunny Indonesian siang (IMG_0802 sky!)
      scene.background = new THREE.Color('#8FBFF0');
      scene.fog = new THREE.Fog('#B7D6F5', 40, 96);
      sunLight.color.set('#FFF9EC');
      sunLight.intensity = 1.95;
      sunLight.position.set(12, 30, 16);
      hemiLight.color.set('#F2F9FF');
      hemiLight.groundColor.set('#A59A84');
      hemiLight.intensity = 0.92;
    }

    // 1. Build ALL unlocked/constructing/occupied rooms across Floors 1, 2, 3 stacked cleanly!
    const builtRooms = state.rooms.filter((r) => r.status !== 'locked');
    let highestBuiltFloor = 1;
    let minBuiltX = 999;
    let maxBuiltX = -999;

    builtRooms.forEach((room) => {
      // In Interior mode, only show rooms up to activeFloor so upper floors never block the floor you're inspecting!
      if (state.cutaway && room.floor > state.activeFloor) return;

      const pos = getRoom3DPosition(room.id, room.floor);
      const tenant = room.tenantId ? state.tenants[room.tenantId] : null;
      const { group, frontFacade } = buildRoomUnit3D(room, tenant?.name ?? null, textures, isNight);
      group.position.set(pos.x, pos.y, pos.z);
      dynamicGroup.add(group);
      objs.frontFacades.push(frontFacade);

      if (room.floor > highestBuiltFloor) highestBuiltFloor = room.floor;
      minBuiltX = Math.min(minBuiltX, pos.x - ROOM_W / 2);
      maxBuiltX = Math.max(maxBuiltX, pos.x + ROOM_W / 2);
    });

    // Continuous Sloped Orange-Terracotta Roof sitting cleanly over the highest built Kos floor (IMG_0802!)
    if (builtRooms.length > 0 && maxBuiltX > minBuiltX) {
      const spanW = maxBuiltX - minBuiltX + 1.0;
      const centerX = (minBuiltX + maxBuiltX) / 2;
      const roofY = highestBuiltFloor * FLOOR_H + 0.45;
      const roofMat = new THREE.MeshStandardMaterial({ map: textures.roofTile, roughness: 0.78 });
      const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(spanW, 0.28, 6.4), roofMat);
      roofSlab.position.set(centerX, roofY, -0.75);
      roofSlab.rotation.x = 0.19;
      roofSlab.castShadow = true;
      roofSlab.receiveShadow = true;
      roofGroup.add(roofSlab);

      // Subtle triangular gable filler on left/right sides under roof slope
      const gableMat = new THREE.MeshStandardMaterial({ map: textures.plasterMint, roughness: 0.85 });
      const backWallTop = new THREE.Mesh(new THREE.BoxGeometry(spanW - 0.6, 0.85, 0.2), gableMat);
      backWallTop.position.set(centerX, roofY + 0.15, -3.55);
      roofGroup.add(backWallTop);
    }

    // 2. Real 3D Exterior Concrete Staircase on the left side when Lantai 2 / 3 is built (IMG_0802!)
    if (state.facilities.pondasi_lantai2) {
      const stairMat = new THREE.MeshStandardMaterial({ color: '#E2DAC9', roughness: 0.85 });
      const railMat = new THREE.MeshStandardMaterial({ color: '#2B6449', roughness: 0.5 });
      const flights = state.facilities.lantai3_lounge ? 2 : 1;
      for (let fl = 0; fl < flights; fl++) {
        const baseY = fl * FLOOR_H;
        for (let st = 0; st < 8; st++) {
          const step = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.45), stairMat);
          step.position.set(-9.1, baseY + 0.2 + st * 0.4, 2.2 - st * 0.36);
          step.castShadow = true;
          step.receiveShadow = true;
          dynamicGroup.add(step);
        }
        // Upper landing
        const landing = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.22, 1.8), stairMat);
        landing.position.set(-9.1, baseY + FLOOR_H, -0.8);
        dynamicGroup.add(landing);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 1.8), railMat);
        rail.position.set(-9.9, baseY + FLOOR_H + 0.55, -0.8);
        dynamicGroup.add(rail);
      }
    }

    // 3. Iconic KOST TEXAS Gate Signboard Archway (placed in roofGroup so Interior Cutaway view stays 100% unobstructed!)
    if (state.signboardPlaced) {
      const postMat = new THREE.MeshStandardMaterial({ color: '#244B3A', roughness: 0.6 });
      const pL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.18), postMat);
      pL.position.set(-2.3, 1.6, 4.75);
      const pR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.18), postMat);
      pR.position.set(1.1, 1.6, 4.75);
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 0.95, 0.18),
        new THREE.MeshStandardMaterial({ map: textures.signKostTexas, roughness: 0.5 })
      );
      board.position.set(-0.6, 3.15, 4.75);
      roofGroup.add(pL, pR, board);
    }

    // 4. Parked 3D Scooters in courtyard parking!
    const scooterCount = Math.min(4, Math.max(state.bikes.length, state.contracts.some((c) => c.status === 'active') ? 1 : 0));
    for (let i = 0; i < scooterCount; i++) {
      const b = state.bikes[i];
      if (b && b.status !== 'tersedia') continue;
      const sc = buildScooter3D(b?.color ?? '#C85A32');
      sc.position.set(4.5 + i * 1.45, 0.06, 2.8);
      sc.rotation.y = Math.PI * 0.85;
      sc.traverse((c) => (c.userData = { interactType: 'bike', bikeId: b?.id }));
      dynamicGroup.add(sc);
    }

    // 5. Pending Package Box near Gate!
    const pendingPkg = state.packages.find((p) => !p.delivered);
    if (pendingPkg) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.5, 0.65),
        new THREE.MeshStandardMaterial({ color: '#C99862', roughness: 0.85 })
      );
      box.position.set(1.8, 0.3, 3.8);
      box.castShadow = true;
      box.userData = { interactType: 'package', packageId: pendingPkg.id };
      dynamicGroup.add(box);
      const sp = makeLabelSprite(`📦 Paket ${pendingPkg.recipientName}`, '#C85A32', '#FBF6EC', 1.15);
      sp.position.set(1.8, 1.1, 3.8);
      dynamicGroup.add(sp);
    }

    // 6. Alley Streetscape (placed in roofGroup so utility poles never block Interior Cutaway camera!)
    roofGroup.add(buildAlleyStreetscape3D(state, textures, isNight));

    // 7. 3D Chibi Owner!
    const ownerRig = buildChibi3D({
      hairStyle: state.owner.hairStyle,
      hairColor: state.owner.hairColor,
      skinTone: state.owner.skinTone,
      outfitId: state.owner.outfitId,
      label: `${state.owner.name} (Kamu)`,
    });
    ownerRig.group.position.set(owner3DRef.current.x, (state.activeFloor - 1) * FLOOR_H + 0.12, owner3DRef.current.z);
    dynamicGroup.add(ownerRig.group);
    objs.ownerRig = ownerRig;

    // 8. 3D Janda Tuxedo Cat!
    const jandaRig = buildJanda3D();
    jandaRig.group.position.set(-5.4, 0.08, 2.8);
    jandaRig.group.traverse((c) => (c.userData = { interactType: 'janda' }));
    dynamicGroup.add(jandaRig.group);
    objs.jandaRig = jandaRig;

    // 9. 3D Living NPCs (Tenants, Guests, Adik, Romanceable NPCs, Kang Budi!)
    state.worldNpcs.slice(0, 10).forEach((npc, idx) => {
      const rig = buildChibi3D({
        hairStyle: npc.hairStyle,
        hairColor: npc.hairColor,
        skinTone: npc.skinTone,
        outfitId: npc.outfitId,
        label: npc.name,
      });
      const baseX = -7.5 + idx * 2.5;
      const baseZ = npc.role === 'romance' || npc.role === 'neighbor' ? 6.2 : npc.role === 'guest' ? 3.9 : 2.1;
      rig.group.position.set(baseX, (npc.floor - 1) * FLOOR_H + 0.12, baseZ);
      const cleanId = npc.id.replace('npc_', '');
      rig.group.traverse((c) => {
        c.userData = { interactType: 'npc', npcId: cleanId, role: npc.role };
      });
      dynamicGroup.add(rig.group);
      objs.npcRigs.push({
        rig,
        baseX,
        baseZ,
        phase: idx * 1.3,
        interactId: cleanId,
        role: npc.role,
      });
    });
  }, [
    state.rooms,
    state.facilities,
    state.signboardPlaced,
    state.bikes,
    state.packages,
    state.warung.unlocked,
    state.warung.level,
    state.kontrakan.owned,
    state.kontrakan.tenantFamilyName,
    state.owner,
    state.worldNpcs,
    state.slot,
    state.activeFloor,
    state.cutaway,
    state.contracts,
    state.tenants,
  ]);

  // Pointer drag-to-pan & 3D Raycast click-to-interact!
  const handlePointerDown = (e: React.PointerEvent) => {
    dragRef.current = { active: true, startX: e.clientX, moved: false };
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 6) {
      dragRef.current.moved = true;
      dragRef.current.startX = e.clientX;
      if (state.cutaway) {
        setInteriorPanX((prev) => Math.max(-7, Math.min(9, prev - dx * 0.025)));
      } else {
        camOrbitRef.current.panX = Math.max(-10, Math.min(12, camOrbitRef.current.panX - dx * 0.03));
      }
    }
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    const wasDrag = dragRef.current.moved;
    dragRef.current.active = false;
    if (wasDrag) return;

    const objs = sceneObjectsRef.current;
    const el = mountRef.current;
    if (!objs || !el) return;
    const rect = el.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, objs.camera);
    const targets = objs.roofGroup.visible
      ? [...objs.dynamicGroup.children, ...objs.roofGroup.children]
      : objs.dynamicGroup.children;
    const hits = ray.intersectObjects(targets, true);
    for (const h of hits) {
      const ud = h.object.userData;
      if (!ud?.interactType) continue;
      if (ud.interactType === 'janda') {
        soundEngine.playMeow();
        dispatch({ type: 'OPEN_MODAL', modal: { type: 'janda_interact' } });
        return;
      }
      if (ud.interactType === 'room' && ud.roomId) {
        soundEngine.playKnock();
        dispatch({ type: 'OPEN_MODAL', modal: { type: 'room_detail', roomId: ud.roomId } });
        return;
      }
      if (ud.interactType === 'package' && ud.packageId) {
        dispatch({ type: 'DELIVER_PACKAGE', packageId: ud.packageId });
        return;
      }
      if (ud.interactType === 'warung') {
        dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'warung' });
        return;
      }
      if (ud.interactType === 'rental') {
        dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'rental' });
        return;
      }
      if (ud.interactType === 'kontrakan') {
        dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'properti' });
        return;
      }
      if (ud.interactType === 'bike' && ud.bikeId) {
        dispatch({ type: 'OPEN_MODAL', modal: { type: 'bike_inspect', bikeId: ud.bikeId, kind: 'awal' } });
        return;
      }
      if (ud.interactType === 'npc') {
        if (ud.role === 'guest' && state.slot === 'malam' && !state.firstNightGuestsGreeted) {
          dispatch({ type: 'GREET_FIRST_NIGHT_GUESTS' });
          return;
        }
        if (ud.npcId && state.relationships[ud.npcId]) {
          dispatch({ type: 'OPEN_MODAL', modal: { type: 'npc_interact', npcId: ud.npcId } });
          return;
        }
      }
    }
  };

  // Context action buttons (matching existing E2E IDs!)
  const contextActions = useMemo(() => {
    void nearbyTick;
    const actions: { id: string; label: string; accent?: boolean; onClick: () => void }[] = [];

    if (state.activeTourApplicantId) {
      const app = state.applicants.find((a) => a.id === state.activeTourApplicantId);
      if (app) {
        const prof = state.tenants[app.tenantId];
        actions.push({
          id: 'finish_tour',
          label: `✅ Selesaikan Tur Kamar ${app.targetRoomId} (${prof?.name})`,
          accent: true,
          onClick: () => dispatch({ type: 'COMPLETE_ROOM_TOUR', applicantId: app.id }),
        });
      }
    }

    if (state.slot === 'malam' && state.contracts.some((c) => c.status === 'active') && !state.firstNightGuestsGreeted) {
      actions.push({
        id: 'greet_first_night',
        label: '👋 Sapa Penghuni & Pasangan (Malam Pertama)',
        accent: true,
        onClick: () => dispatch({ type: 'GREET_FIRST_NIGHT_GUESTS' }),
      });
    }

    const pendingPkg = state.packages.find((p) => !p.delivered);
    if (pendingPkg) {
      actions.push({
        id: 'act_pkg',
        label: `📦 Antar Paket (${pendingPkg.recipientName})`,
        accent: true,
        onClick: () => dispatch({ type: 'DELIVER_PACKAGE', packageId: pendingPkg.id }),
      });
    }

    actions.push({
      id: 'act_janda',
      label: '🐾 Rawat / Main Janda',
      onClick: () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'janda_interact' } }),
    });

    if (state.facilities.kamar_owner) {
      actions.push({
        id: 'owner_room',
        label: '🏠 Ruang Owner',
        onClick: () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'owner_room' } }),
      });
    }

    return actions.slice(0, 3);
  }, [state, dispatch, nearbyTick]);

  // Virtual touch joystick pointer handlers
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });
  const handleJoyMove = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    const base = joyBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 12;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setJoyKnob({ x: dx, y: dy });
    joyVecRef.current = { x: dx / maxR, y: dy / maxR };
  };
  const handleJoyEnd = () => {
    setJoyKnob({ x: 0, y: 0 });
    joyVecRef.current = { x: 0, y: 0 };
  };

  return (
    <div className="world-3d-shell">
      <div
        ref={mountRef}
        className="three-canvas-host"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label="Dunia 3D Kost Texas"
      />

      {/* Interior Dollhouse Left/Right Room Panning Arrows (IMG_0801!) */}
      {state.cutaway && (
        <>
          <button
            className="interior-arrow left"
            onClick={() => setInteriorPanX((x) => Math.max(-7, x - 3.8))}
            aria-label="Geser Kamar Kiri"
          >
            ◀
          </button>
          <button
            className="interior-arrow right"
            onClick={() => setInteriorPanX((x) => Math.min(9, x + 3.8))}
            aria-label="Geser Kamar Kanan"
          >
            ▶
          </button>
        </>
      )}

      {/* Bottom-Left Controls: Touch Joystick + Lari (Sprint) button like IMG_0802! */}
      <div className="hud-bottom-left">
        <div
          ref={joyBaseRef}
          className="virtual-joystick"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            handleJoyMove(e);
          }}
          onPointerMove={handleJoyMove}
          onPointerUp={handleJoyEnd}
          onPointerCancel={handleJoyEnd}
          aria-label="Joystick Gerak Owner"
        >
          <div
            className="joystick-knob"
            style={{ transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)` }}
          />
        </div>

        <button
          id="btn-sprint"
          className={`game-square-btn ${sprint ? 'active' : ''}`}
          onClick={() => {
            soundEngine.playClick();
            setSprint((s) => !s);
          }}
        >
          <span className="sq-icon">👟</span>
          <span className="sq-lbl">{sprint ? 'Lari ON' : 'Lari'}</span>
        </button>
      </div>

      {/* Bottom-Center Context Actions */}
      <div className="context-action-bar">
        {contextActions.map((act) => (
          <button
            key={act.id}
            id={`ctx-${act.id}`}
            className={`ctx-btn ${act.accent ? 'accent' : ''}`}
            onClick={act.onClick}
          >
            {act.label}
          </button>
        ))}
      </div>

      {/* Bottom-Right Controls: Floor Switcher + Zoom / Interior Dollhouse toggle (IMG_0802!) */}
      <div className="hud-bottom-right">
        <div className="floor-pill-group">
          {([1, 2, 3] as FloorNumber[]).map((fl) => {
            const locked =
              (fl === 2 && !state.facilities.pondasi_lantai2) ||
              (fl === 3 && !state.facilities.lantai3_lounge);
            return (
              <button
                key={fl}
                id={`btn-floor-${fl}`}
                className={`floor-btn-3d ${state.activeFloor === fl ? 'active' : ''} ${locked ? 'locked' : ''}`}
                onClick={() => dispatch({ type: 'SET_FLOOR', floor: fl })}
              >
                Lt {fl}
                {locked ? '🔒' : ''}
              </button>
            );
          })}
        </div>

        <button
          id="btn-cutaway"
          className={`game-square-btn ${state.cutaway ? 'active' : ''}`}
          onClick={() => {
            soundEngine.playClick();
            dispatch({ type: 'TOGGLE_CUTAWAY' });
          }}
          title="Beralih antara Tampilan Jalan 3D dan Interior Kamar Dollhouse"
        >
          <span className="sq-icon">{state.cutaway ? '🏘️' : '🔍'}</span>
          <span className="sq-lbl">{state.cutaway ? 'Jalan 3D' : 'Interior'}</span>
        </button>
      </div>
    </div>
  );
};
