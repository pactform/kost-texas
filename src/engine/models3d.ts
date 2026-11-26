import * as THREE from 'three';
import { getOutfitDef } from './chibiRenderer';
import type { GameState, OwnerAppearance, Room } from '../types/game';
import type { WorldTextures } from './textures3d';

export function enableShadows(obj: THREE.Object3D, cast = true, receive = true) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = cast;
      child.receiveShadow = receive;
    }
  });
}

function makeBox(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/**
 * Builds an expressive 3D Chibi character (Owner / Tenant / Guest / NPC) with animated limbs!
 */
export function buildChibi3D(opts: {
  hairStyle: OwnerAppearance['hairStyle'];
  hairColor: string;
  skinTone: string;
  outfitId: string;
  label?: string;
}): {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
} {
  const outfit = getOutfitDef(opts.outfitId);
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: opts.skinTone, roughness: 0.72 });
  const topMat = new THREE.MeshStandardMaterial({ color: outfit.topColor, roughness: 0.75 });
  const botMat = new THREE.MeshStandardMaterial({ color: outfit.bottomColor, roughness: 0.8 });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: outfit.style === 'kos' ? '#8A5A3B' : '#FBF6EC',
    roughness: 0.7,
  });
  const hairMat = new THREE.MeshStandardMaterial({ color: opts.hairColor, roughness: 0.65 });

  // Legs (pivot at hip y = 0.55)
  const legGeo = new THREE.BoxGeometry(0.18, 0.52, 0.2);
  const leftLeg = new THREE.Mesh(legGeo, botMat);
  leftLeg.position.set(-0.12, 0.3, 0);
  leftLeg.add(makeBox(0.2, 0.12, 0.28, shoeMat, 0, -0.24, 0.04));

  const rightLeg = new THREE.Mesh(legGeo, botMat);
  rightLeg.position.set(0.12, 0.3, 0);
  rightLeg.add(makeBox(0.2, 0.12, 0.28, shoeMat, 0, -0.24, 0.04));
  group.add(leftLeg, rightLeg);

  // Torso
  const torso = makeBox(0.5, 0.58, 0.32, topMat, 0, 0.84, 0);
  group.add(torso);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.14, 0.44, 0.16);
  const leftArm = new THREE.Mesh(armGeo, topMat);
  leftArm.position.set(-0.34, 0.84, 0);
  leftArm.add(makeBox(0.12, 0.12, 0.12, skinMat, 0, -0.24, 0));

  const rightArm = new THREE.Mesh(armGeo, topMat);
  rightArm.position.set(0.34, 0.84, 0);
  rightArm.add(makeBox(0.12, 0.12, 0.12, skinMat, 0, -0.24, 0));
  group.add(leftArm, rightArm);

  // Chibi Head with cute painted face texture
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 128;
  faceCanvas.height = 128;
  const fctx = faceCanvas.getContext('2d')!;
  fctx.fillStyle = opts.skinTone;
  fctx.fillRect(0, 0, 128, 128);
  // Blush
  fctx.fillStyle = 'rgba(218, 108, 92, 0.34)';
  fctx.beginPath();
  fctx.ellipse(32, 74, 12, 6, 0, 0, Math.PI * 2);
  fctx.ellipse(96, 74, 12, 6, 0, 0, Math.PI * 2);
  fctx.fill();
  // Eyes
  fctx.fillStyle = '#1E2421';
  fctx.beginPath();
  fctx.arc(42, 58, 8, 0, Math.PI * 2);
  fctx.arc(86, 58, 8, 0, Math.PI * 2);
  fctx.fill();
  fctx.fillStyle = '#FFFFFF';
  fctx.beginPath();
  fctx.arc(39, 55, 3, 0, Math.PI * 2);
  fctx.arc(83, 55, 3, 0, Math.PI * 2);
  fctx.fill();
  // Smile
  fctx.strokeStyle = '#754634';
  fctx.lineWidth = 4;
  fctx.lineCap = 'round';
  fctx.beginPath();
  fctx.arc(64, 72, 12, 0.18 * Math.PI, 0.82 * Math.PI);
  fctx.stroke();

  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  const headMats = [
    skinMat,
    skinMat,
    hairMat,
    skinMat,
    new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.7 }), // +Z front face!
    hairMat,
  ];
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.54, 0.52), headMats);
  head.position.set(0, 1.42, 0);
  group.add(head);

  // Hair Crown & Style
  group.add(makeBox(0.62, 0.18, 0.58, hairMat, 0, 1.66, -0.02));
  if (opts.hairStyle === 'bob' || opts.hairStyle === 'bergelombang') {
    const hLen = opts.hairStyle === 'bergelombang' ? 0.54 : 0.36;
    group.add(makeBox(0.62, hLen, 0.16, hairMat, 0, 1.4 - hLen * 0.2, -0.26));
    group.add(makeBox(0.1, hLen * 0.8, 0.38, hairMat, -0.29, 1.42 - hLen * 0.15, -0.04));
    group.add(makeBox(0.1, hLen * 0.8, 0.38, hairMat, 0.29, 1.42 - hLen * 0.15, -0.04));
  } else if (opts.hairStyle === 'cepol') {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), hairMat);
    bun.position.set(0, 1.84, -0.06);
    group.add(bun);
  }

  // Optional floating crisp name tag sprite above head
  if (opts.label) {
    group.add(makeLabelSprite(opts.label, '#1D3C2E', '#FBF6EC', 2.18));
  }

  enableShadows(group, true, true);
  return { group, leftLeg, rightLeg, leftArm, rightArm };
}

/**
 * Builds Janda — Owner's adorable 3D Tuxedo Cat (black fur, white chest, white sock paws, wagging tail!)
 */
export function buildJanda3D(): { group: THREE.Group; tail: THREE.Mesh } {
  const group = new THREE.Group();
  const blackMat = new THREE.MeshStandardMaterial({ color: '#1C201F', roughness: 0.65 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#FAF6EE', roughness: 0.72 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#F6CE6B', emissive: '#E9B44C', emissiveIntensity: 0.3 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: '#E5989B', roughness: 0.6 });

  // Body
  group.add(makeBox(0.32, 0.28, 0.56, blackMat, 0, 0.26, 0));
  // White tuxedo chest bib
  group.add(makeBox(0.24, 0.22, 0.08, whiteMat, 0, 0.24, 0.27));
  // 4 White sock paws!
  [
    [-0.1, 0.18],
    [0.1, 0.18],
    [-0.1, -0.18],
    [0.1, -0.18],
  ].forEach(([px, pz]) => {
    group.add(makeBox(0.09, 0.14, 0.09, whiteMat, px, 0.07, pz));
  });

  // Head
  group.add(makeBox(0.32, 0.28, 0.28, blackMat, 0, 0.44, 0.34));
  // White muzzle
  group.add(makeBox(0.18, 0.1, 0.06, whiteMat, 0, 0.37, 0.48));
  // Pink nose
  group.add(makeBox(0.05, 0.04, 0.04, pinkMat, 0, 0.41, 0.5));
  // Amber eyes
  group.add(makeBox(0.06, 0.06, 0.03, eyeMat, -0.08, 0.47, 0.48));
  group.add(makeBox(0.06, 0.06, 0.03, eyeMat, 0.08, 0.47, 0.48));
  // Pointed ears
  const earGeo = new THREE.ConeGeometry(0.065, 0.14, 4);
  const earL = new THREE.Mesh(earGeo, blackMat);
  earL.position.set(-0.11, 0.63, 0.34);
  const earR = new THREE.Mesh(earGeo, blackMat);
  earR.position.set(0.11, 0.63, 0.34);
  group.add(earL, earR);

  // Swaying Tail
  const tail = makeBox(0.06, 0.38, 0.06, blackMat, 0, 0.46, -0.32);
  tail.rotation.x = -0.45;
  group.add(tail);

  group.add(makeLabelSprite('🐾 Janda', '#C85A32', '#FBF6EC', 1.05));
  enableShadows(group, true, true);
  return { group, tail };
}

export function makeLabelSprite(text: string, bg: string, fg: string, yPos: number): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
  const tw = Math.min(240, ctx.measureText(text).width + 32);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect((256 - tw) / 2, 12, tw, 40, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 246, 236, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 33);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sp = new THREE.Sprite(mat);
  sp.position.set(0, yPos, 0);
  sp.scale.set(2.2, 0.55, 1);
  return sp;
}

/**
 * Builds a complete realistic 3D Kos Room (IMG_0801 Interior + IMG_0802 Exterior)!
 * Returns { group, frontFacade } so Exterior/Interior mode toggles smoothly with ZERO artifacts.
 */
export function buildRoomUnit3D(
  room: Room,
  tenantName: string | null,
  tex: WorldTextures,
  isNight: boolean
): { group: THREE.Group; frontFacade: THREE.Group } {
  const group = new THREE.Group();
  const frontFacade = new THREE.Group();
  const W = 4.2;
  const D = 4.0;
  const H = 3.1;

  const isPrem = room.tier === 'premium';
  const wallInMat = new THREE.MeshStandardMaterial({ map: tex.plasterCream, roughness: 0.88 });
  const wallOutMat = new THREE.MeshStandardMaterial({
    map: isPrem ? tex.plasterCream : tex.plasterMint,
    roughness: 0.86,
  });
  const woodMat = new THREE.MeshStandardMaterial({ map: tex.woodTeak, roughness: 0.72 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: '#5A3720', roughness: 0.75 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#F7F4EE', roughness: 0.7 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: room.lightOn && isNight ? '#FFE084' : '#A9CDD6',
    emissive: room.lightOn && isNight ? '#FFBE42' : '#000000',
    emissiveIntensity: room.lightOn && isNight ? 0.8 : 0,
    roughness: 0.2,
    metalness: 0.1,
  });

  // Constructing state: brick walls + wooden scaffolding!
  if (room.status === 'constructing') {
    const brickMat = new THREE.MeshStandardMaterial({ color: '#B86A4A', roughness: 0.92 });
    const slabMat = new THREE.MeshStandardMaterial({ color: '#C8C1B4', roughness: 0.9 });
    group.add(makeBox(W, 0.22, D + 1.4, slabMat, 0, 0.11, 0.7));
    group.add(makeBox(W - 0.1, 1.8, 0.16, brickMat, 0, 1.0, -D / 2));
    group.add(makeBox(0.16, 1.8, D, brickMat, -W / 2 + 0.08, 1.0, 0));
    group.add(makeBox(0.16, 1.8, D, brickMat, W / 2 - 0.08, 1.0, 0));
    const poleMat = new THREE.MeshStandardMaterial({ color: '#C69D57', roughness: 0.85 });
    [
      [-W / 2 + 0.2, D / 2],
      [W / 2 - 0.2, D / 2],
    ].forEach(([px, pz]) => {
      group.add(makeBox(0.1, 3.0, 0.1, poleMat, px, 1.5, pz));
    });
    group.add(makeBox(W, 0.1, 0.1, poleMat, 0, 2.2, D / 2));
    group.add(makeLabelSprite(`🚧 Proyek ${room.id} (${room.constructionDaysLeft}hr)`, '#244B3A', '#F6CE6B', 3.4));
    return { group, frontFacade };
  }

  // 1. Interior Floor (White ceramic for Standard, Warm Wood Parquet for Premium — exactly like IMG_0801!)
  const floorMat = new THREE.MeshStandardMaterial({
    map: isPrem ? tex.woodParquet : tex.ceramicWhite,
    roughness: 0.72,
  });
  group.add(makeBox(W, 0.18, D, floorMat, 0, 0.09, 0));

  // Front Porch Corridor Slab (terracotta tiles like IMG_0801!)
  const porchMat = new THREE.MeshStandardMaterial({ map: tex.porchTile, roughness: 0.82 });
  group.add(makeBox(W, 0.18, 1.5, porchMat, 0, 0.09, D / 2 + 0.75));

  // Slender white porch pillar + green balcony railing (IMG_0802 & IMG_0801!)
  const pillarMat = new THREE.MeshStandardMaterial({ color: '#F3EFE6', roughness: 0.8 });
  group.add(makeBox(0.22, H, 0.22, pillarMat, -W / 2 + 0.15, H / 2, D / 2 + 1.38));
  group.add(makeBox(0.22, H, 0.22, pillarMat, W / 2 - 0.15, H / 2, D / 2 + 1.38));

  if (room.floor > 1) {
    const railMat = new THREE.MeshStandardMaterial({ color: '#2B6449', roughness: 0.5, metalness: 0.25 });
    group.add(makeBox(W, 0.07, 0.07, railMat, 0, 1.05, D / 2 + 1.42));
    group.add(makeBox(W, 0.05, 0.05, railMat, 0, 0.55, D / 2 + 1.42));
    for (let rx = -W / 2 + 0.3; rx <= W / 2 - 0.3; rx += 0.45) {
      group.add(makeBox(0.04, 0.95, 0.04, railMat, rx, 0.58, D / 2 + 1.42));
    }
  }

  // 2. Back & Side Interior Walls
  group.add(makeBox(W, H, 0.16, wallInMat, 0, H / 2, -D / 2 + 0.08));
  group.add(makeBox(0.14, H, D, wallInMat, -W / 2 + 0.07, H / 2, 0));
  group.add(makeBox(0.14, H, D, wallInMat, W / 2 - 0.07, H / 2, 0));

  // Back Wall Wood-Mullion Window + Framed Wall Art (just like IMG_0801!)
  const winZ = -D / 2 + 0.17;
  group.add(makeBox(1.3, 1.05, 0.08, darkWoodMat, 0, 2.05, winZ));
  group.add(makeBox(1.12, 0.88, 0.09, glassMat, 0, 2.05, winZ + 0.01));
  group.add(makeBox(0.06, 0.92, 0.11, darkWoodMat, 0, 2.05, winZ + 0.02));
  group.add(makeBox(1.16, 0.06, 0.11, darkWoodMat, 0, 2.05, winZ + 0.02));

  // Wall painting beside window
  const artMat = new THREE.MeshStandardMaterial({
    map: Number(room.id) % 2 === 1 ? tex.wallArt1 : tex.wallArt2,
    roughness: 0.6,
  });
  group.add(makeBox(0.66, 0.76, 0.05, darkWoodMat, -1.25, 2.05, winZ));
  group.add(makeBox(0.56, 0.66, 0.06, artMat, -1.25, 2.05, winZ + 0.01));

  // 3. Detailed Interior Furniture (mapped crisply with ZERO clipping!)
  const hasQueen = room.furniture.some((f) => f.type === 'kasur_queen') || isPrem;
  const hasBigDesk = room.furniture.some((f) => f.type === 'meja_besar');
  const hasAC = room.furniture.some((f) => f.type === 'ac') || isPrem;
  const hasPlant = room.furniture.some((f) => f.type === 'tanaman') || room.status === 'occupied';
  const hasBlackout = room.furniture.some((f) => f.type === 'tirai_blackout');

  // Private Bathroom corner for Premium Rooms (glass-framed tiled shower & toilet — IMG_0801!)
  if (room.hasPrivateBath) {
    const bathWallMat = new THREE.MeshStandardMaterial({ color: '#F4F7F6', roughness: 0.4 });
    const showerGlassMat = new THREE.MeshStandardMaterial({
      color: '#D4EEF5',
      transparent: true,
      opacity: 0.42,
      roughness: 0.15,
    });
    group.add(makeBox(1.15, 0.05, 1.35, bathWallMat, -W / 2 + 0.68, 0.2, -D / 2 + 0.78));
    group.add(makeBox(0.08, 2.2, 1.35, showerGlassMat, -W / 2 + 1.25, 1.25, -D / 2 + 0.78));
    group.add(makeBox(1.15, 2.2, 0.08, bathWallMat, -W / 2 + 0.68, 1.25, -D / 2 + 1.44));
    // White toilet & sink inside bath
    group.add(makeBox(0.42, 0.46, 0.48, whiteMat, -W / 2 + 0.52, 0.42, -D / 2 + 0.56));
    group.add(makeBox(0.42, 0.36, 0.18, whiteMat, -W / 2 + 0.52, 0.78, -D / 2 + 0.36));
  }

  // Bed (Premium Queen with dark headboard + red/terracotta runner vs Standard wood bed + floral/striped sheet!)
  if (hasQueen) {
    const bx = room.hasPrivateBath ? 0.55 : -0.45;
    const bz = -0.68;
    const headbMat = new THREE.MeshStandardMaterial({ color: '#333447', roughness: 0.8 });
    const runnerMat = new THREE.MeshStandardMaterial({ color: '#D63E36', roughness: 0.75 });
    const quiltMat = new THREE.MeshStandardMaterial({ color: '#D8DCE0', roughness: 0.82 });
    group.add(makeBox(1.75, 0.34, 2.05, woodMat, bx, 0.34, bz));
    group.add(makeBox(1.8, 1.15, 0.14, headbMat, bx, 0.78, bz - 1.02));
    group.add(makeBox(1.66, 0.24, 1.95, whiteMat, bx, 0.58, bz));
    group.add(makeBox(1.68, 0.1, 1.32, quiltMat, bx, 0.72, bz + 0.28));
    group.add(makeBox(1.7, 0.12, 0.42, runnerMat, bx, 0.73, bz + 0.62));
    // Two plump pillows
    group.add(makeBox(0.68, 0.18, 0.38, whiteMat, bx - 0.4, 0.77, bz - 0.72));
    group.add(makeBox(0.68, 0.18, 0.38, whiteMat, bx + 0.4, 0.77, bz - 0.72));
  } else {
    const bx = 0.82;
    const bz = -0.62;
    const sheetMat = new THREE.MeshStandardMaterial({
      map: Number(room.id) % 2 === 1 ? tex.bedFloral : tex.bedStriped,
      roughness: 0.8,
    });
    group.add(makeBox(1.25, 0.34, 1.98, woodMat, bx, 0.34, bz));
    group.add(makeBox(1.3, 0.96, 0.12, darkWoodMat, bx, 0.66, bz - 0.98));
    group.add(makeBox(1.18, 0.24, 1.9, sheetMat, bx, 0.58, bz));
    group.add(makeBox(0.86, 0.16, 0.38, whiteMat, bx, 0.75, bz - 0.68));
    // Geometric Indonesian Rug on floor (IMG_0801!)
    const rugMat = new THREE.MeshStandardMaterial({ map: tex.rugIndo, roughness: 0.92 });
    group.add(makeBox(1.45, 0.02, 1.65, rugMat, -0.58, 0.19, 0.25));
  }

  // Study Desk + Chair + Laptop + Lamp
  const dx = hasQueen ? 0.95 : -1.25;
  const dz = hasQueen ? 1.1 : -0.95;
  const deskW = hasBigDesk ? 1.35 : 0.98;
  group.add(makeBox(deskW, 0.08, 0.62, woodMat, dx, 0.88, dz));
  group.add(makeBox(0.08, 0.72, 0.58, woodMat, dx - deskW / 2 + 0.06, 0.5, dz));
  group.add(makeBox(0.08, 0.72, 0.58, woodMat, dx + deskW / 2 - 0.06, 0.5, dz));
  // Open Laptop on desk
  const laptopMat = new THREE.MeshStandardMaterial({ color: '#2B3136', roughness: 0.4 });
  const screenMat = new THREE.MeshStandardMaterial({ color: '#78B6C4', emissive: '#3D7C8C', emissiveIntensity: 0.35 });
  group.add(makeBox(0.38, 0.03, 0.26, laptopMat, dx, 0.94, dz));
  const lid = makeBox(0.38, 0.25, 0.03, screenMat, dx, 1.06, dz - 0.12);
  lid.rotation.x = -0.18;
  group.add(lid);
  // Desk chair
  group.add(makeBox(0.44, 0.06, 0.44, darkWoodMat, dx, 0.56, dz + 0.44));
  group.add(makeBox(0.44, 0.48, 0.06, darkWoodMat, dx, 0.82, dz + 0.64));
  group.add(makeBox(0.06, 0.4, 0.06, darkWoodMat, dx - 0.18, 0.36, dz + 0.28));
  group.add(makeBox(0.06, 0.4, 0.06, darkWoodMat, dx + 0.18, 0.36, dz + 0.28));
  group.add(makeBox(0.06, 0.4, 0.06, darkWoodMat, dx - 0.18, 0.36, dz + 0.6));
  group.add(makeBox(0.06, 0.4, 0.06, darkWoodMat, dx + 0.18, 0.36, dz + 0.6));

  // Tall Teak Wardrobe against left wall
  const wx = -W / 2 + 0.48;
  const wz = 1.02;
  group.add(makeBox(0.68, 1.95, 1.05, woodMat, wx, 1.14, wz));
  const goldMat = new THREE.MeshStandardMaterial({ color: '#E9B44C', metalness: 0.6, roughness: 0.3 });
  group.add(makeBox(0.04, 0.14, 0.04, goldMat, wx + 0.35, 1.15, wz - 0.08));
  group.add(makeBox(0.04, 0.14, 0.04, goldMat, wx + 0.35, 1.15, wz + 0.08));

  // Split AC unit mounted high on back wall (IMG_0801!)
  if (hasAC) {
    const acMat = new THREE.MeshStandardMaterial({ color: '#F4F7F6', roughness: 0.35 });
    group.add(makeBox(1.1, 0.3, 0.26, acMat, 1.15, 2.7, -D / 2 + 0.28));
    group.add(makeBox(0.95, 0.04, 0.28, new THREE.MeshStandardMaterial({ color: '#39464A' }), 1.15, 2.59, -D / 2 + 0.29));
  }

  // Blackout curtain strips flanking back window
  if (hasBlackout) {
    const blkMat = new THREE.MeshStandardMaterial({ color: '#214235', roughness: 0.9 });
    group.add(makeBox(0.24, 1.25, 0.1, blkMat, -0.76, 2.02, winZ + 0.04));
    group.add(makeBox(0.24, 1.25, 0.1, blkMat, 0.76, 2.02, winZ + 0.04));
  }

  // Potted Plant on room/porch corner
  if (hasPlant) {
    const potMat = new THREE.MeshStandardMaterial({ color: '#C85A32', roughness: 0.8 });
    const leafMat = new THREE.MeshStandardMaterial({ color: '#2E7D4A', roughness: 0.75 });
    group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.28, 10), potMat)).position.set(-W / 2 + 0.45, 0.32, D / 2 + 0.95);
    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), leafMat);
    foliage.position.set(-W / 2 + 0.45, 0.62, D / 2 + 0.95);
    group.add(foliage);
  }

  // Blue Sandals or Blue Metal Shoe Rack outside porch door (IMG_0801 signature detail!)
  if (isPrem) {
    const rackMat = new THREE.MeshStandardMaterial({ color: '#3E65A3', roughness: 0.5, metalness: 0.3 });
    group.add(makeBox(0.74, 0.52, 0.28, rackMat, W / 2 - 0.65, 0.44, D / 2 + 0.35));
    const shoeRed = new THREE.MeshStandardMaterial({ color: '#C83E32', roughness: 0.7 });
    const shoeDark = new THREE.MeshStandardMaterial({ color: '#23282E', roughness: 0.7 });
    group.add(makeBox(0.22, 0.1, 0.22, shoeRed, W / 2 - 0.8, 0.5, D / 2 + 0.36));
    group.add(makeBox(0.22, 0.1, 0.22, shoeDark, W / 2 - 0.5, 0.74, D / 2 + 0.36));
  } else if (room.status === 'occupied') {
    const sandalMat = new THREE.MeshStandardMaterial({ color: '#2D88D9', roughness: 0.7 });
    group.add(makeBox(0.13, 0.04, 0.26, sandalMat, -0.35, 0.2, D / 2 + 0.55));
    group.add(makeBox(0.13, 0.04, 0.26, sandalMat, -0.15, 0.2, D / 2 + 0.55));
  }

  // Warm interior ceiling light bulb glow at night!
  if (room.lightOn && isNight) {
    const bulbMat = new THREE.MeshBasicMaterial({ color: '#FFE38E' });
    group.add(makeBox(0.14, 0.14, 0.14, bulbMat, 0, H - 0.28, 0));
  }

  // 4. FRONT FACADE GROUP (Hidden smoothly in Interior Cutaway Mode!)
  const fz = D / 2 - 0.08;
  // Exterior front wall panel
  frontFacade.add(makeBox(W, H, 0.16, wallOutMat, 0, H / 2, fz));
  // Teak entrance door (left side) + brass knob + room number plaque
  frontFacade.add(makeBox(1.06, 2.22, 0.2, darkWoodMat, -0.92, 1.18, fz + 0.02));
  frontFacade.add(makeBox(0.92, 2.1, 0.22, woodMat, -0.92, 1.15, fz + 0.03));
  frontFacade.add(makeBox(0.06, 0.06, 0.08, goldMat, -0.56, 1.12, fz + 0.15));
  // Front framed window (right side)
  frontFacade.add(makeBox(1.22, 1.12, 0.2, darkWoodMat, 0.88, 1.72, fz + 0.02));
  frontFacade.add(makeBox(1.06, 0.96, 0.22, glassMat, 0.88, 1.72, fz + 0.03));
  frontFacade.add(makeBox(0.06, 0.98, 0.24, darkWoodMat, 0.88, 1.72, fz + 0.04));

  group.add(frontFacade);

  // Room label pill above porch
  const lbl =
    room.status === 'occupied'
      ? `${room.id} · ${tenantName ?? 'Terisi'}${room.guestPresent ? ' ♥' : ''}`
      : `${room.id} · Kosong`;
  group.add(
    makeLabelSprite(
      lbl,
      room.status === 'occupied' ? 'rgba(29, 60, 46, 0.92)' : 'rgba(200, 90, 50, 0.92)',
      '#FBF6EC',
      H + 0.55
    )
  );

  // Store roomId metadata for 3D raycast clicking!
  group.userData = { interactType: 'room', roomId: room.id };
  group.traverse((c) => {
    c.userData = { interactType: 'room', roomId: room.id };
  });

  return { group, frontFacade };
}

/**
 * Builds a realistic 3D Indonesian Scooter (Beat/Scoopy/Vario style)
 */
export function buildScooter3D(color: string): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.2 });
  const tireMat = new THREE.MeshStandardMaterial({ color: '#1F2224', roughness: 0.85 });
  const seatMat = new THREE.MeshStandardMaterial({ color: '#2B2E30', roughness: 0.8 });
  const lampMat = new THREE.MeshStandardMaterial({ color: '#FFF4BF', emissive: '#F6CE6B', emissiveIntensity: 0.4 });

  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.14, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const wFront = new THREE.Mesh(wheelGeo, tireMat);
  wFront.position.set(0, 0.24, 0.56);
  const wBack = new THREE.Mesh(wheelGeo, tireMat);
  wBack.position.set(0, 0.24, -0.52);
  g.add(wFront, wBack);

  g.add(makeBox(0.38, 0.34, 0.92, bodyMat, 0, 0.44, -0.08));
  g.add(makeBox(0.34, 0.56, 0.24, bodyMat, 0, 0.68, 0.44));
  g.add(makeBox(0.34, 0.14, 0.62, seatMat, 0, 0.66, -0.18));
  g.add(makeBox(0.68, 0.06, 0.08, seatMat, 0, 1.0, 0.42));
  g.add(makeBox(0.18, 0.12, 0.08, lampMat, 0, 0.84, 0.56));
  enableShadows(g, true, true);
  return g;
}

/**
 * Builds the iconic Mango Tree + family wooden bench!
 */
export function buildMangoTree3D(): THREE.Group {
  const g = new THREE.Group();
  const barkMat = new THREE.MeshStandardMaterial({ color: '#6E482C', roughness: 0.92 });
  const leafDark = new THREE.MeshStandardMaterial({ color: '#235E3C', roughness: 0.82 });
  const leafBright = new THREE.MeshStandardMaterial({ color: '#398253', roughness: 0.8 });
  const mangoMat = new THREE.MeshStandardMaterial({ color: '#F0B642', roughness: 0.5 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 2.7, 10), barkMat);
  trunk.position.set(0, 1.35, 0);
  g.add(trunk);

  [
    [0, 3.2, 0, 1.45, leafDark],
    [-0.95, 2.65, 0.4, 1.05, leafBright],
    [0.95, 2.7, -0.3, 1.1, leafDark],
    [0.15, 3.85, 0.2, 0.95, leafBright],
  ].forEach(([x, y, z, r, m]) => {
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(r as number, 1), m as THREE.Material);
    s.position.set(x as number, y as number, z as number);
    g.add(s);
  });

  // Hanging Golden Mangoes
  [
    [-0.75, 2.05, 0.65],
    [0.72, 2.1, 0.55],
    [0.12, 2.35, 0.95],
  ].forEach(([mx, my, mz]) => {
    const mg = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mangoMat);
    mg.position.set(mx, my, mz);
    g.add(mg);
  });

  enableShadows(g, true, true);
  return g;
}

/**
 * Builds neighboring Indonesian alley buildings + power poles & wires + streetlamps (IMG_0802 vibe!)
 */
export function buildAlleyStreetscape3D(
  state: GameState,
  tex: WorldTextures,
  isNight: boolean
): THREE.Group {
  const g = new THREE.Group();
  const roofMat = new THREE.MeshStandardMaterial({ map: tex.roofTile, roughness: 0.78 });
  const creamMat = new THREE.MeshStandardMaterial({ map: tex.plasterCream, roughness: 0.85 });
  const blueMat = new THREE.MeshStandardMaterial({ color: '#3A5E72', roughness: 0.7 });
  const woodMat = new THREE.MeshStandardMaterial({ map: tex.woodTeak, roughness: 0.75 });
  const poleMat = new THREE.MeshStandardMaterial({ color: '#8F897E', roughness: 0.9 });
  const greenMetal = new THREE.MeshStandardMaterial({ color: '#245940', roughness: 0.55, metalness: 0.25 });
  const bushMat = new THREE.MeshStandardMaterial({ color: '#398A49', roughness: 0.85 });

  // 1. Warung / Restoran Kost Texas (right side along the same block, x = +12.5, z = -1.5)
  const warung = new THREE.Group();
  warung.position.set(12.2, 0, -0.5);
  const wH = state.warung.level === 2 ? 3.5 : 2.9;
  warung.add(makeBox(5.2, wH, 4.2, creamMat, 0, wH / 2, 0));
  const wRoof = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.26, 5.2), roofMat);
  wRoof.position.set(0, wH + 0.35, 0.2);
  wRoof.rotation.x = 0.22;
  warung.add(wRoof);
  // Glass food display counter
  warung.add(
    makeBox(
      2.6,
      1.1,
      0.7,
      new THREE.MeshStandardMaterial({
        color: state.warung.unlocked ? '#F4D58D' : '#8D8982',
        emissive: state.warung.unlocked && isNight ? '#E9B44C' : '#000000',
        emissiveIntensity: 0.5,
      }),
      0,
      1.05,
      2.15
    )
  );
  warung.add(
    makeLabelSprite(
      state.warung.level === 2 ? '🍲 Resto Texas' : state.warung.unlocked ? '🍜 Warung Texas' : '🍜 Lahan Warung',
      state.warung.unlocked ? '#C85A32' : '#57534E',
      '#FBF6EC',
      wH + 1.3
    )
  );
  warung.traverse((c) => (c.userData = { interactType: 'warung' }));
  g.add(warung);

  // 2. Bengkel Mas Eko (further down the alley, x = +18.2, z = -0.5)
  const bengkel = new THREE.Group();
  bengkel.position.set(18.2, 0, -0.5);
  bengkel.add(makeBox(4.8, 3.0, 4.0, new THREE.MeshStandardMaterial({ color: '#DDE4E6', roughness: 0.8 }), 0, 1.5, 0));
  bengkel.add(makeBox(2.8, 2.2, 0.16, blueMat, 0, 1.1, 2.02));
  const bRoof = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.24, 4.8), blueMat);
  bRoof.position.set(0, 3.25, 0.15);
  bRoof.rotation.x = 0.18;
  bengkel.add(bRoof);
  bengkel.add(makeLabelSprite('🔧 Bengkel Mas Eko', '#263F4D', '#F6CE6B', 4.3));
  bengkel.traverse((c) => (c.userData = { interactType: 'rental' }));
  g.add(bengkel);

  // 3. Rumah Kontrakan (left side of Kost Texas, x = -12.6, z = -0.2 — just like IMG_0802!)
  const kontrakan = new THREE.Group();
  kontrakan.position.set(-12.6, 0, -0.2);
  kontrakan.add(makeBox(5.2, 3.0, 4.4, new THREE.MeshStandardMaterial({ color: '#EFE8DB', roughness: 0.85 }), 0, 1.5, 0));
  const kRoof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.8, 4), roofMat);
  kRoof.rotation.y = Math.PI / 4;
  kRoof.position.set(0, 3.9, 0);
  kontrakan.add(kRoof);
  kontrakan.add(makeBox(1.0, 2.1, 0.14, woodMat, -1.0, 1.05, 2.22));
  kontrakan.add(
    makeBox(
      1.3,
      1.1,
      0.14,
      new THREE.MeshStandardMaterial({
        color: isNight && state.kontrakan.tenantFamilyName ? '#FFE084' : '#9CC0C6',
        emissive: isNight && state.kontrakan.tenantFamilyName ? '#FFB830' : '#000000',
        emissiveIntensity: 0.7,
      }),
      1.0,
      1.6,
      2.22
    )
  );
  kontrakan.add(
    makeLabelSprite(
      state.kontrakan.tenantFamilyName ? '🏡 Kontrakan (Terisi)' : state.kontrakan.owned ? '🏡 Kontrakan Milikmu' : '🏡 Rumah Kontrakan',
      state.kontrakan.owned ? '#244B3A' : '#635952',
      '#FBF6EC',
      5.1
    )
  );
  kontrakan.traverse((c) => (c.userData = { interactType: 'kontrakan' }));
  g.add(kontrakan);

  // 4. Coffee Cart Arka (front sidewalk left, x = -9.0, z = 4.6)
  const cart = new THREE.Group();
  cart.position.set(-9.2, 0, 4.3);
  cart.add(makeBox(2.2, 1.1, 1.2, woodMat, 0, 0.55, 0));
  [
    [-1.0, -0.5],
    [1.0, -0.5],
    [-1.0, 0.5],
    [1.0, 0.5],
  ].forEach(([px, pz]) => cart.add(makeBox(0.08, 1.4, 0.08, greenMetal, px, 1.8, pz)));
  const cTop = makeBox(2.5, 0.14, 1.5, greenMetal, 0, 2.55, 0);
  cTop.rotation.x = 0.12;
  cart.add(cTop);
  cart.add(makeLabelSprite('☕ Coffee Cart Arka', '#244B3A', '#F6CE6B', 3.2));
  cart.traverse((c) => (c.userData = { interactType: 'npc', npcId: 'arka' }));
  g.add(cart);

  // 5. Iconic Indonesian Utility Poles (Tiang Listrik) & Sagging Power Cables + Streetlamps (IMG_0802!)
  const poleXs = [-14, -5, 5, 14, 22];
  poleXs.forEach((px, idx) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 7.2, 8), poleMat);
    pole.position.set(px, 3.6, 5.4);
    g.add(pole);
    // Crossbar
    g.add(makeBox(1.1, 0.1, 0.1, poleMat, px, 6.6, 5.4));

    // Green streetlamp arm + bulb (IMG_0801 & IMG_0802!)
    if (idx % 2 === 1) {
      const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.8, 8), greenMetal);
      lampPost.position.set(px + 1.5, 2.4, 9.2);
      g.add(lampPost);
      const arm = makeBox(0.12, 0.12, 1.1, greenMetal, px + 1.5, 4.75, 8.75);
      g.add(arm);
      const head = makeBox(
        0.48,
        0.18,
        0.65,
        new THREE.MeshStandardMaterial({
          color: isNight ? '#FFE89E' : '#DCE2E0',
          emissive: isNight ? '#FFD166' : '#000000',
          emissiveIntensity: isNight ? 1.1 : 0,
        }),
        px + 1.5,
        4.68,
        8.25
      );
      g.add(head);
    }

    // Overhead sagging black cable to next pole
    if (idx < poleXs.length - 1) {
      const nx = poleXs[idx + 1];
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(px, 6.6, 5.4),
        new THREE.Vector3((px + nx) / 2, 5.95, 5.4),
        new THREE.Vector3(nx, 6.6, 5.4)
      );
      const wireGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(14));
      const wire = new THREE.Line(wireGeo, new THREE.LineBasicMaterial({ color: '#222629' }));
      g.add(wire);
    }
  });

  // 6. Lush green curb bushes along the far edge of the road (IMG_0802!)
  for (let bx = -14; bx <= 20; bx += 4.2) {
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 + (Math.abs(bx) % 0.25), 1), bushMat);
    bush.position.set(bx, 0.35, 9.7);
    bush.scale.set(1.2, 0.78, 1.0);
    g.add(bush);
  }

  enableShadows(g, true, true);
  return g;
}
