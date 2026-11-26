import React, { useEffect, useMemo, useRef, useState } from 'react';
import { soundEngine } from '../engine/audio';
import { drawChibiCanvas, drawJandaCanvas } from '../engine/chibiRenderer';
import {
  TILE_H,
  TILE_W,
  drawArchitecturalRoom,
  drawIsoScooter,
  drawPrism,
  drawSWWallQuad,
  drawStatusPill,
  drawTerracottaRoof,
  fillPoly,
  iso,
  screenToIsoCoords,
} from '../engine/isoArchitecture';
import { MAP_COLS, MAP_ROWS, findPath, isTileWalkable } from '../engine/pathfinding';
import type { GameAction } from '../engine/store';
import type { FloorNumber, GameState } from '../types/game';

interface IsometricWorldProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const IsometricWorld: React.FC<IsometricWorldProps> = ({ state, dispatch }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const posRef = useRef({ x: state.ownerPos.x, y: state.ownerPos.y, floor: state.ownerPos.floor });
  const pathRef = useRef<{ x: number; y: number }[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const facingRef = useRef<'left' | 'right'>('right');
  const camRef = useRef({ x: 0, y: 0, initialized: false });
  const lastSyncRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const [nearbyPromptTick, setNearbyPromptTick] = useState(0);

  // Sync external teleports (Chat "Ke Lokasi" / Floor switch)
  useEffect(() => {
    const dist = Math.hypot(posRef.current.x - state.ownerPos.x, posRef.current.y - state.ownerPos.y);
    if (posRef.current.floor !== state.ownerPos.floor || dist > 1.8) {
      posRef.current = { x: state.ownerPos.x, y: state.ownerPos.y, floor: state.ownerPos.floor };
      pathRef.current = [];
    }
  }, [state.ownerPos.x, state.ownerPos.y, state.ownerPos.floor]);

  // Keyboard WASD + Arrow keys
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        keysRef.current.add(k);
        pathRef.current = [];
      }
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Main 60fps Canvas Render & Movement Loop
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      const st = stateRef.current;
      const timeSec = st.reducedMotion ? 0 : now / 1000;
      const currentZoom = zoomRef.current;

      // 1. Movement update
      let moving = false;
      const speed = 3.8;
      let vx = 0;
      let vy = 0;
      const keys = keysRef.current;
      if (keys.has('w') || keys.has('arrowup')) {
        vx -= 0.7;
        vy -= 0.7;
      }
      if (keys.has('s') || keys.has('arrowdown')) {
        vx += 0.7;
        vy += 0.7;
      }
      if (keys.has('a') || keys.has('arrowleft')) {
        vx -= 0.7;
        vy += 0.7;
      }
      if (keys.has('d') || keys.has('arrowright')) {
        vx += 0.7;
        vy -= 0.7;
      }

      if (vx !== 0 || vy !== 0) {
        const len = Math.hypot(vx, vy);
        const nx = posRef.current.x + (vx / len) * speed * dt;
        const ny = posRef.current.y + (vy / len) * speed * dt;
        facingRef.current = vx - vy < 0 ? 'left' : 'right';
        if (isTileWalkable(nx, ny, st.activeFloor)) {
          posRef.current.x = nx;
          posRef.current.y = ny;
          moving = true;
        } else if (isTileWalkable(nx, posRef.current.y, st.activeFloor)) {
          posRef.current.x = nx;
          moving = true;
        } else if (isTileWalkable(posRef.current.x, ny, st.activeFloor)) {
          posRef.current.y = ny;
          moving = true;
        }
      } else if (pathRef.current.length > 0) {
        const target = pathRef.current[0];
        const dx = target.x - posRef.current.x;
        const dy = target.y - posRef.current.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.14) {
          posRef.current.x = target.x;
          posRef.current.y = target.y;
          pathRef.current.shift();
        } else {
          posRef.current.x += (dx / dist) * speed * dt;
          posRef.current.y += (dy / dist) * speed * dt;
          facingRef.current = dx - dy < 0 ? 'left' : 'right';
          moving = true;
        }
      }

      if (now - lastSyncRef.current > 240) {
        lastSyncRef.current = now;
        const d = Math.hypot(posRef.current.x - st.ownerPos.x, posRef.current.y - st.ownerPos.y);
        if (d > 0.25) {
          dispatch({
            type: 'SET_OWNER_POS',
            x: Number(posRef.current.x.toFixed(2)),
            y: Number(posRef.current.y.toFixed(2)),
            floor: st.activeFloor,
          });
        }
        setNearbyPromptTick((t) => (t + 1) % 10000);
      }

      // 2. Canvas setup
      const canvas = canvasRef.current;
      const wrap = containerRef.current;
      if (!canvas || !wrap) {
        rafId = requestAnimationFrame(render);
        return;
      }
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const targetW = Math.max(300, Math.floor(rect.width));
      const targetH = Math.max(260, Math.floor(rect.height));
      if (canvas.width !== Math.floor(targetW * dpr) || canvas.height !== Math.floor(targetH * dpr)) {
        canvas.width = Math.floor(targetW * dpr);
        canvas.height = Math.floor(targetH * dpr);
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafId = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Warm atmospheric backdrop gradient per TimeSlot
      const skyColors: Record<string, [string, string]> = {
        pagi: ['#DCECE0', '#F7EED8'],
        siang: ['#CEE4D5', '#F3E9D2'],
        sore: ['#DFB48C', '#F2CFA0'],
        malam: ['#152328', '#223539'],
      };
      const [c1, c2] = skyColors[st.slot] ?? skyColors.pagi;
      const bgGrad = ctx.createLinearGradient(0, 0, 0, targetH);
      bgGrad.addColorStop(0, c1);
      bgGrad.addColorStop(1, c2);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, targetW, targetH);

      // Camera follows owner cleanly
      const ownerIsoRaw = iso(posRef.current.x, posRef.current.y, 0, 0);
      const desiredCamX = targetW / 2 - ownerIsoRaw.x * currentZoom;
      const desiredCamY = targetH / 2 - ownerIsoRaw.y * currentZoom + 24;
      if (!camRef.current.initialized) {
        camRef.current = { x: desiredCamX, y: desiredCamY, initialized: true };
      } else {
        const lerp = st.reducedMotion ? 1 : Math.min(1, dt * 6);
        camRef.current.x += (desiredCamX - camRef.current.x) * lerp;
        camRef.current.y += (desiredCamY - camRef.current.y) * lerp;
      }

      ctx.save();
      ctx.translate(camRef.current.x, camRef.current.y);
      ctx.scale(currentZoom, currentZoom);

      const ox = 0;
      const oy = 0;
      const isNight = st.slot === 'malam';
      const isDusk = st.slot === 'sore';
      const isRaining = st.weather === 'hujan' || st.weather === 'hujan_deras';

      // 3. Draw Crisp Ground Platform Slab & Tiled Zones
      if (st.activeFloor === 1) {
        // Subtle elevated earth foundation under entire lot for crisp architectural edges
        drawPrism(ctx, ox, oy, 0, 0, MAP_COLS, MAP_ROWS, 10, {
          top: '#7E9F70',
          left: '#5F7753',
          right: '#4C6143',
          stroke: 'rgba(30,45,36,0.2)',
        }, -10);

        for (let gy = 0; gy < MAP_ROWS; gy++) {
          for (let gx = 0; gx < MAP_COLS; gx++) {
            const p0 = iso(gx, gy, ox, oy);
            const p1 = iso(gx + 1, gy, ox, oy);
            const p2 = iso(gx + 1, gy + 1, ox, oy);
            const p3 = iso(gx, gy + 1, ox, oy);
            const checker = (gx + gy) % 2 === 0;

            let tileFill = checker ? '#89AC78' : '#83A572'; // Lush tropical yard grass
            let strokeCol = 'rgba(36, 75, 58, 0.06)';

            if (gy >= 11 && gy <= 12) {
              // Indonesian asphalt gang road
              tileFill = checker ? '#6C6B68' : '#676663';
              strokeCol = 'rgba(255,255,255,0.03)';
            } else if (gy >= 13) {
              // Opposite sidewalk concrete paving
              tileFill = checker ? '#B7AEA0' : '#AFA697';
              strokeCol = 'rgba(50, 44, 36, 0.1)';
            } else if (gy === 10) {
              // Fence border / stone entry walkway at gate (x=7..9)
              tileFill = gx >= 7 && gx <= 9 ? (checker ? '#DFCFAF' : '#D5C3A2') : '#7A9A6B';
            } else if (gy >= 4 && gy <= 5 && gx >= 2 && gx <= 14) {
              // Kost corridor ceramic tiles
              tileFill = checker ? '#EFE3CE' : '#E8D9BF';
              strokeCol = 'rgba(120, 96, 68, 0.15)';
            } else if (gy >= 6 && gy <= 9 && gx >= 10 && gx <= 13) {
              // Conblock motorbike parking lot
              tileFill = st.facilities.petak_motor
                ? checker
                  ? '#B7B0A4'
                  : '#ADA69A'
                : checker
                  ? '#A19B8F'
                  : '#989286';
              strokeCol = 'rgba(55, 50, 44, 0.12)';
            } else if (gy >= 6 && gy <= 8 && gx >= 3 && gx <= 8) {
              // Warm terracotta-cream terrace patio
              tileFill = checker ? '#E6D4B8' : '#DFC9A8';
              strokeCol = 'rgba(138, 96, 58, 0.14)';
            } else if (gy >= 1 && gy <= 3 && gx >= 2 && gx <= 14) {
              // Building concrete plinth pad
              tileFill = '#DDD1BC';
            }

            fillPoly(ctx, [p0, p1, p2, p3], tileFill, strokeCol, 0.7);

            // White painted motorbike parking bays when upgraded
            if (st.facilities.petak_motor && gy >= 6 && gy <= 8 && gx >= 10 && gx <= 12) {
              const a = iso(gx + 0.15, gy + 0.1, ox, oy, 0.5);
              const b = iso(gx + 0.15, gy + 0.9, ox, oy, 0.5);
              ctx.strokeStyle = 'rgba(251, 246, 236, 0.78)';
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }

            // Rain puddles on yard & asphalt
            if (isRaining && (gx * 5 + gy * 7) % 13 === 0 && gy >= 6 && gy <= 12) {
              const c = iso(gx + 0.5, gy + 0.5, ox, oy, 0.5);
              ctx.fillStyle = 'rgba(130, 178, 200, 0.34)';
              ctx.beginPath();
              ctx.ellipse(c.x, c.y, 13, 6, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Road curb & subtle center dashed lines along the Indonesian alley (y=11..13)
        ctx.save();
        const curbTop0 = iso(0, 11, ox, oy, 1);
        const curbTop1 = iso(MAP_COLS, 11, ox, oy, 1);
        const curbBot0 = iso(0, 13, ox, oy, 1);
        const curbBot1 = iso(MAP_COLS, 13, ox, oy, 1);
        ctx.strokeStyle = '#CFC6B6';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(curbTop0.x, curbTop0.y);
        ctx.lineTo(curbTop1.x, curbTop1.y);
        ctx.moveTo(curbBot0.x, curbBot0.y);
        ctx.lineTo(curbBot1.x, curbBot1.y);
        ctx.stroke();

        // Subtle dashed alley centerline
        ctx.strokeStyle = 'rgba(246, 236, 214, 0.36)';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([10, 10]);
        const mid0 = iso(0.5, 12, ox, oy, 1);
        const mid1 = iso(MAP_COLS - 0.5, 12, ox, oy, 1);
        ctx.beginPath();
        ctx.moveTo(mid0.x, mid0.y);
        ctx.lineTo(mid1.x, mid1.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      } else {
        // UPPER FLOOR ARCHITECTURAL DECK (Lantai 2 / 3) with visible ground depth below!
        // Subtle shadow silhouette of yard below
        const g0 = iso(1, 0, ox, oy, -44);
        const g1 = iso(15, 0, ox, oy, -44);
        const g2 = iso(15, 10, ox, oy, -44);
        const g3 = iso(1, 10, ox, oy, -44);
        fillPoly(ctx, [g0, g1, g2, g3], isNight ? 'rgba(30,48,42,0.35)' : 'rgba(130, 165, 120, 0.25)');

        // Elevated concrete floor slab
        drawPrism(ctx, ox, oy, 1.8, 1.2, 12.6, 5.4, 8, {
          top: '#EFE2CB',
          left: '#C8BA9F',
          right: '#B3A48A',
          stroke: 'rgba(36, 75, 58, 0.22)',
        }, -8);

        for (let gy = 2; gy <= 6; gy++) {
          for (let gx = 2; gx <= 13; gx++) {
            const p0 = iso(gx, gy, ox, oy);
            const p1 = iso(gx + 1, gy, ox, oy);
            const p2 = iso(gx + 1, gy + 1, ox, oy);
            const p3 = iso(gx, gy + 1, ox, oy);
            const fill = gy >= 4 ? ((gx + gy) % 2 === 0 ? '#EFE3CE' : '#E7D8BE') : '#DFD2BC';
            fillPoly(ctx, [p0, p1, p2, p3], fill, 'rgba(120, 96, 68, 0.14)', 0.7);
          }
        }
      }

      // Active walk-to-destination ripple ring
      if (pathRef.current.length > 0) {
        const end = pathRef.current[pathRef.current.length - 1];
        const pt = iso(end.x + 0.5, end.y + 0.5, ox, oy, 1);
        ctx.strokeStyle = '#E9B44C';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y, 13 + Math.sin(timeSec * 6) * 2, 6.5 + Math.sin(timeSec * 6), 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Draw Architecturally Crisp Rooms on Active Floor!
      const floorRooms = st.rooms.filter((r) => r.floor === st.activeFloor);
      for (const room of floorRooms) {
        const ownerNearDoor =
          posRef.current.floor === room.floor &&
          Math.abs(posRef.current.x - room.doorX) < 1.5 &&
          posRef.current.y <= room.doorY + 0.6;
        const showCutaway = st.cutaway || ownerNearDoor;
        const tenant = room.tenantId ? st.tenants[room.tenantId] : null;
        drawArchitecturalRoom(ctx, ox, oy, room, tenant?.name ?? null, showCutaway, st.slot, timeSec);
      }

      // Crisp Architectural Concrete Staircase to Lantai 2 / 3 (x=13..14.2, y=3.6..5.2)
      if (st.facilities.pondasi_lantai2) {
        for (let step = 0; step < 5; step++) {
          drawPrism(ctx, ox, oy, 12.9, 3.6 + step * 0.3, 1.35, 0.32, 4 + (4 - step) * 4, {
            top: '#DFD2BA',
            left: '#BEB098',
            right: '#A89B84',
          });
        }
        // Dark-green iron stair handrail
        const rBot = iso(12.9, 5.15, ox, oy, 16);
        const rTop = iso(12.9, 3.65, ox, oy, 34);
        ctx.strokeStyle = '#244B3A';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(rBot.x, rBot.y);
        ctx.lineTo(rTop.x, rTop.y);
        ctx.stroke();

        drawStatusPill(
          ctx,
          iso(13.55, 4.3, ox, oy, 42),
          st.activeFloor === 1 ? 'Naik Lt 2' : st.activeFloor === 2 && st.facilities.lantai3_lounge ? 'Tangga Lt 3/1' : 'Turun Lt 1',
          '#244B3A',
          '#F6CE6B'
        );
      }

      // Upper floor balcony safety railing (railing besi hijau tua)
      if (st.activeFloor > 1) {
        ctx.save();
        ctx.strokeStyle = '#244B3A';
        ctx.lineWidth = 2.2;
        const railL = iso(1.8, 6.6, ox, oy, 14);
        const railR = iso(14.4, 6.6, ox, oy, 14);
        const railTopR = iso(14.4, 1.2, ox, oy, 14);
        ctx.beginPath();
        ctx.moveTo(railL.x, railL.y);
        ctx.lineTo(railR.x, railR.y);
        ctx.lineTo(railTopR.x, railTopR.y);
        ctx.stroke();
        // Vertical iron balusters
        ctx.lineWidth = 1.2;
        for (let bx = 2; bx <= 14; bx += 1.2) {
          const b0 = iso(bx, 6.6, ox, oy, 0);
          const b1 = iso(bx, 6.6, ox, oy, 14);
          ctx.beginPath();
          ctx.moveTo(b0.x, b0.y);
          ctx.lineTo(b1.x, b1.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5. FLOOR 1 ARCHITECTURAL PROPS: Owner Room, Terrace, Mango Tree, Gate, Scooters, Alley Shops!
      if (st.activeFloor === 1) {
        // Owner's Private Room (x=0.6..2.6, y=5.6..7.9)
        if (st.facilities.kamar_owner) {
          drawPrism(ctx, ox, oy, 0.6, 5.6, 2.0, 2.3, st.cutaway ? 12 : 38, {
            top: '#EFE2C9',
            left: isNight ? '#CFC2AA' : '#F4E8D2',
            right: isNight ? '#B8AB94' : '#E2D2B6',
          }, 3);
          if (!st.cutaway) {
            drawSWWallQuad(ctx, ox, oy, 7.9, 1.0, 1.65, 3, 29, '#7C4B2D', '#4E2E1A', 0.9);
            drawSWWallQuad(ctx, ox, oy, 7.9, 1.85, 2.4, 15, 29, isNight ? '#FFD76E' : '#9CC0C6', '#4E2E1A', 0.9);
            drawTerracottaRoof(ctx, ox, oy, 0.6, 5.6, 2.0, 2.3, 41, 16, {
              front: '#244B3A',
              side: '#1B3A2C',
              ridge: '#142B21',
              trim: '#E9B44C',
            });
          }
          drawStatusPill(ctx, iso(1.6, 6.7, ox, oy, 64), 'Ruang Owner', '#244B3A', '#F6CE6B');
        }

        // Terrace Slatted Teak Bench (moves near mango tree when bangku_geser built)
        const benchX = st.facilities.bangku_geser ? 4.2 : 5.2;
        const benchY = st.facilities.bangku_geser ? 8.1 : 6.7;
        drawPrism(ctx, ox, oy, benchX, benchY, 1.35, 0.48, 7, { top: '#B67D4F', left: '#8C5B35', right: '#704626' }, 2);
        // Backrest
        drawPrism(ctx, ox, oy, benchX, benchY, 1.35, 0.1, 8, { top: '#A87043', left: '#82522E', right: '#6B4223' }, 9);

        // Naya's Preloved Display Table & Garment Rack
        if (st.facilities.rak_preloved_teras) {
          drawPrism(ctx, ox, oy, 6.9, 6.7, 1.15, 0.55, 11, { top: '#F0CA6E', left: '#C85A32', right: '#A44320' }, 1);
          drawStatusPill(ctx, iso(7.45, 7.0, ox, oy, 24), 'Lapak Preloved Naya', '#C85A32', '#FBF6EC');
        }

        // Drying Rack (Area Jemur)
        if (st.facilities.area_jemur) {
          const jL = iso(2.9, 6.3, ox, oy, 16);
          const jR = iso(4.1, 6.3, ox, oy, 16);
          ctx.strokeStyle = '#6E7A74';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(jL.x, jL.y + 16);
          ctx.lineTo(jL.x, jL.y);
          ctx.lineTo(jR.x, jR.y);
          ctx.lineTo(jR.x, jR.y + 16);
          ctx.stroke();
          // Hanging clothes
          ['#C85A32', '#FBF6EC', '#3B6E56'].forEach((col, i) => {
            const cx = jL.x + ((jR.x - jL.x) * (i + 1)) / 4;
            const cy = jL.y + ((jR.y - jL.y) * (i + 1)) / 4;
            ctx.fillStyle = col;
            ctx.fillRect(cx - 4, cy + 1, 8, 9);
          });
        }

        // Package Drop-Off Rack & Pending Packages
        if (st.facilities.rak_paket) {
          drawPrism(ctx, ox, oy, 8.6, 8.2, 0.9, 0.6, 17, { top: '#C48D5D', left: '#946239', right: '#784E2C' }, 1);
        }
        const pendingPkgs = st.packages.filter((p) => !p.delivered);
        if (pendingPkgs.length > 0) {
          drawPrism(ctx, ox, oy, 8.7, 8.5, 0.5, 0.5, 9, { top: '#DDB078', left: '#BA8B53', right: '#9C713E' }, 1);
          drawStatusPill(ctx, iso(8.95, 8.75, ox, oy, 22), `Paket (${pendingPkgs.length})`, '#C85A32', '#FBF6EC');
        }

        // Janda's Bowl & Favorite Cardboard Box
        if (st.janda.bowlPlaced) {
          const bx = st.janda.bowlSpot === 'kamar_owner' ? 2.8 : st.janda.bowlSpot === 'teras' ? 4.9 : 4.1;
          const by = st.janda.bowlSpot === 'kamar_owner' ? 7.6 : st.janda.bowlSpot === 'teras' ? 7.5 : 8.8;
          const pb = iso(bx, by, ox, oy, 1);
          ctx.fillStyle = '#C85A32';
          ctx.beginPath();
          ctx.ellipse(pb.x, pb.y, 6.5, 3.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#E9B44C';
          ctx.beginPath();
          ctx.ellipse(pb.x, pb.y - 1, 4.2, 2.1, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        if (st.janda.cardboardPlaced) {
          drawPrism(ctx, ox, oy, 8.0, 8.0, 0.55, 0.55, 7, { top: '#D2A46D', left: '#AC7F4B', right: '#8F673B' }, 1);
        }

        // Detailed Parked Motorbikes (Scooters!)
        const activeTenants = st.contracts.filter((c) => c.status === 'active').length;
        const parkedCount = Math.min(4, Math.max(st.bikes.length, activeTenants > 0 ? 1 : 0));
        for (let i = 0; i < parkedCount; i++) {
          const b = st.bikes[i];
          if (b && b.status !== 'tersedia') continue;
          const sx = 10.6 + (i % 2) * 1.45;
          const sy = 6.9 + Math.floor(i / 2) * 1.45;
          drawIsoScooter(ctx, ox, oy, sx, sy, b?.color ?? '#2E5B45');
        }

        // Terrace Pergola Canopy & Warm String Lights (rendered softly translucent above terrace)
        if (st.facilities.kanopi_teras) {
          const c0 = iso(4.4, 6.1, ox, oy, 38);
          const c1 = iso(8.2, 6.1, ox, oy, 38);
          const c2 = iso(8.2, 7.8, ox, oy, 34);
          const c3 = iso(4.4, 7.8, ox, oy, 34);
          fillPoly(ctx, [c0, c1, c2, c3], 'rgba(200, 90, 50, 0.22)', 'rgba(130, 62, 34, 0.45)', 1.2);
          // Warm cafe string lights at dusk/night
          if (isNight || isDusk) {
            for (let i = 0; i <= 5; i++) {
              const t = i / 5;
              const lx = c3.x + (c2.x - c3.x) * t;
              const ly = c3.y + (c2.y - c3.y) * t + 2;
              ctx.fillStyle = '#FFE082';
              ctx.beginPath();
              ctx.arc(lx, ly, 2.8, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Lush Botanical Mango Tree (x=3.1, y=8.9)
        const pTree = iso(3.1, 8.9, ox, oy, 0);
        const sway = Math.sin(timeSec * 1.6) * 2;
        // Dappled ground shadow
        ctx.fillStyle = 'rgba(20, 40, 28, 0.24)';
        ctx.beginPath();
        ctx.ellipse(pTree.x + 6, pTree.y + 4, 34, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        // Tapered bark trunk & branches
        ctx.fillStyle = '#6B442A';
        ctx.beginPath();
        ctx.moveTo(pTree.x - 7, pTree.y + 2);
        ctx.lineTo(pTree.x - 4, pTree.y - 44);
        ctx.lineTo(pTree.x + 4, pTree.y - 44);
        ctx.lineTo(pTree.x + 7, pTree.y + 2);
        ctx.closePath();
        ctx.fill();
        // Multi-toned foliage canopy clusters
        ctx.fillStyle = '#1E4A35';
        ctx.beginPath();
        ctx.arc(pTree.x - 19 + sway, pTree.y - 52, 22, 0, Math.PI * 2);
        ctx.arc(pTree.x + 19 + sway, pTree.y - 49, 20, 0, Math.PI * 2);
        ctx.arc(pTree.x + sway, pTree.y - 68, 27, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2F6B4C';
        ctx.beginPath();
        ctx.arc(pTree.x - 9 + sway, pTree.y - 64, 18, 0, Math.PI * 2);
        ctx.arc(pTree.x + 12 + sway, pTree.y - 57, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#458A63';
        ctx.beginPath();
        ctx.arc(pTree.x - 4 + sway, pTree.y - 74, 11, 0, Math.PI * 2);
        ctx.fill();
        // Individual golden mangoes (separate beginPath per mango!)
        ctx.fillStyle = '#E9B44C';
        [
          [pTree.x - 15 + sway, pTree.y - 47, 3.8],
          [pTree.x + 13 + sway, pTree.y - 45, 3.6],
          [pTree.x + 2 + sway, pTree.y - 56, 4.0],
        ].forEach(([mx, my, mr]) => {
          ctx.beginPath();
          ctx.arc(mx, my, mr, 0, Math.PI * 2);
          ctx.fill();
        });

        // === FRONT PERIMETER FENCE, GATE PILLAR LAMPS & KOST TEXAS ARCHWAY ===
        for (let gx = 0.5; gx <= 14.5; gx += 1) {
          if (gx >= 6.8 && gx <= 9.2) continue; // Wide clean gate opening
          drawPrism(ctx, ox, oy, gx, 9.85, 0.96, 0.18, 16, {
            top: '#EFE2C9',
            left: '#E4D4B7',
            right: '#CEBD9F',
          });
          // Sleek dark green iron fence slats on top
          drawPrism(ctx, ox, oy, gx + 0.08, 9.9, 0.8, 0.08, 6, {
            top: '#244B3A',
            left: '#1B3A2C',
            right: '#152E23',
          }, 16);
        }

        // Concrete Gate Pillars (left & right of open gate)
        drawPrism(ctx, ox, oy, 6.75, 9.75, 0.36, 0.36, 30, { top: '#F4E8D2', left: '#DFCEB0', right: '#C9B798' });
        drawPrism(ctx, ox, oy, 9.25, 9.75, 0.36, 0.36, 30, { top: '#F4E8D2', left: '#DFCEB0', right: '#C9B798' });
        // Warm Gate Pillar Lanterns!
        [6.93, 9.43].forEach((px) => {
          const pl = iso(px, 9.93, ox, oy, 33);
          ctx.fillStyle = isNight || isDusk ? '#FFE082' : '#E9B44C';
          ctx.beginPath();
          ctx.arc(pl.x, pl.y, 4, 0, Math.PI * 2);
          ctx.fill();
          if (isNight || isDusk) {
            const g = ctx.createRadialGradient(pl.x, pl.y, 2, pl.x, pl.y, 24);
            g.addColorStop(0, 'rgba(255, 224, 130, 0.42)');
            g.addColorStop(1, 'rgba(255, 224, 130, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(pl.x, pl.y, 24, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Iconic KOST TEXAS Overhead Gate Archway Signboard
        if (st.signboardPlaced) {
          const pSign = iso(8.18, 9.9, ox, oy, 44);
          const postL = iso(6.93, 9.9, ox, oy, 30);
          const postR = iso(9.43, 9.9, ox, oy, 30);
          const topL = iso(6.93, 9.9, ox, oy, 46);
          const topR = iso(9.43, 9.9, ox, oy, 46);
          ctx.strokeStyle = '#244B3A';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(postL.x, postL.y);
          ctx.lineTo(topL.x, topL.y);
          ctx.lineTo(topR.x, topR.y);
          ctx.lineTo(postR.x, postR.y);
          ctx.stroke();

          ctx.fillStyle = '#1D3C2E';
          ctx.strokeStyle = '#E9B44C';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(pSign.x - 42, pSign.y - 11, 84, 21, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#F6CE6B';
          ctx.font = '900 10px "Nunito", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('KOST TEXAS', pSign.x, pSign.y - 0.5);
        }
      }

      // 6. DEPTH-SORTED ACTORS (Owner, Janda, World NPCs) + ACROSS-THE-ALLEY BUILDINGS (so front shops properly layer!)
      type Drawable = { depth: number; draw: () => void };
      const drawables: Drawable[] = [];

      // Owner
      if (st.activeFloor === posRef.current.floor) {
        const pOw = iso(posRef.current.x, posRef.current.y, ox, oy, 0);
        drawables.push({
          depth: posRef.current.x + posRef.current.y,
          draw: () =>
            drawChibiCanvas(ctx, {
              x: pOw.x,
              y: pOw.y,
              hairStyle: st.owner.hairStyle,
              hairColor: st.owner.hairColor,
              skinTone: st.owner.skinTone,
              outfitId: st.owner.outfitId,
              facing: facingRef.current,
              anim: moving ? 'walk' : 'idle',
              timeSec,
              isRaining,
              label: `${st.owner.name} (Kamu)`,
              highlight: true,
            }),
        });
      }

      // Janda Tuxedo Cat!
      if (st.janda.floor === st.activeFloor) {
        const pJ = iso(st.janda.x, st.janda.y, ox, oy, 0);
        drawables.push({
          depth: st.janda.x + st.janda.y,
          draw: () => drawJandaCanvas(ctx, pJ.x, pJ.y, st.janda.pose, timeSec, 1.08, true),
        });
      }

      // World NPCs (limit speech bubbles to max 2 crisp ones so canvas stays clean!)
      let speechShownCount = 0;
      for (const npc of st.worldNpcs) {
        if (npc.floor !== st.activeFloor) continue;
        const pN = iso(npc.x, npc.y, ox, oy, 0);
        const allowSpeech = npc.speech && speechShownCount < 2;
        if (allowSpeech) speechShownCount += 1;
        drawables.push({
          depth: npc.x + npc.y,
          draw: () =>
            drawChibiCanvas(ctx, {
              x: pN.x,
              y: pN.y,
              hairStyle: npc.hairStyle,
              hairColor: npc.hairColor,
              skinTone: npc.skinTone,
              outfitId: npc.outfitId,
              facing: npc.facing,
              anim: npc.anim,
              timeSec,
              isRaining: isRaining && npc.anim !== 'sit',
              label: npc.name,
              speech: allowSpeech ? npc.speech : undefined,
            }),
        });
      }

      // Across-the-alley neighborhood buildings (Floor 1, south sidewalk gy = 13.3..14.6)
      if (st.activeFloor === 1) {
        // 1. Coffee Cart Arka (x=1.2..2.8, y=13.3..14.4)
        drawables.push({
          depth: 2.0 + 13.9,
          draw: () => {
            drawPrism(ctx, ox, oy, 1.2, 13.3, 1.6, 1.1, 18, { top: '#DFCEB0', left: '#945F39', right: '#784A2A' });
            drawTerracottaRoof(ctx, ox, oy, 1.15, 13.25, 1.7, 1.2, 30, 8, {
              front: '#244B3A',
              side: '#1B3A2C',
              ridge: '#E9B44C',
              trim: '#F6CE6B',
            });
            // Support posts
            [
              [1.25, 13.35],
              [2.75, 13.35],
              [1.25, 14.35],
              [2.75, 14.35],
            ].forEach(([px, py]) => {
              const a = iso(px, py, ox, oy, 18);
              const b = iso(px, py, ox, oy, 30);
              ctx.strokeStyle = '#5C3921';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            });
            drawStatusPill(ctx, iso(2.0, 13.8, ox, oy, 46), 'Coffee Cart Arka', '#244B3A', '#F6CE6B');
          },
        });

        // 2. Warung / Restoran Kost Texas (x=4.6..7.2, y=13.3..14.6)
        drawables.push({
          depth: 5.9 + 14.0,
          draw: () => {
            const h = st.warung.level === 2 ? 36 : 28;
            drawPrism(ctx, ox, oy, 4.6, 13.3, 2.6, 1.3, h, {
              top: '#EFE2C9',
              left: st.warung.unlocked ? '#F4E8D2' : '#D5CFC5',
              right: st.warung.unlocked ? '#E0D0B4' : '#C2BBB0',
            });
            // Serving window & glass food etalase on front NW edge
            if (st.warung.unlocked) {
              drawSWWallQuad(ctx, ox, oy, 14.6, 5.1, 6.7, 10, 22, isNight ? '#FFE084' : '#B7D4D8', '#6B4226', 1);
            }
            drawTerracottaRoof(ctx, ox, oy, 4.6, 13.3, 2.6, 1.3, h, 14, {
              front: st.warung.unlocked ? '#C85A32' : '#7E7970',
              side: st.warung.unlocked ? '#A44420' : '#66625A',
              ridge: '#7D3216',
              trim: '#F4E8D2',
            });
            drawStatusPill(
              ctx,
              iso(5.9, 13.9, ox, oy, h + 21),
              st.warung.level === 2 ? 'Resto Kost Texas' : st.warung.unlocked ? 'Warung Kost Texas' : 'Lahan Warung',
              st.warung.unlocked ? '#C85A32' : '#5E5A54',
              '#FBF6EC'
            );
          },
        });

        // 3. Bengkel Mas Eko (x=9.6..11.9, y=13.3..14.6)
        drawables.push({
          depth: 10.7 + 14.0,
          draw: () => {
            drawPrism(ctx, ox, oy, 9.6, 13.3, 2.3, 1.3, 29, {
              top: '#DCE3E6',
              left: '#E4EAEB',
              right: '#CBD4D8',
            });
            // Garage shutter door
            drawSWWallQuad(ctx, ox, oy, 14.6, 10.1, 11.4, 2, 22, '#4A6270', '#2E404A', 1);
            drawTerracottaRoof(ctx, ox, oy, 9.6, 13.3, 2.3, 1.3, 29, 11, {
              front: '#345466',
              side: '#263F4D',
              ridge: '#1E323D',
              trim: '#E9B44C',
            });
            drawStatusPill(ctx, iso(10.75, 13.9, ox, oy, 47), 'Bengkel Mas Eko', '#263F4D', '#F6CE6B');
          },
        });

        // 4. Rumah Kontrakan (x=12.6..14.8, y=13.2..14.6)
        drawables.push({
          depth: 13.7 + 14.0,
          draw: () => {
            drawPrism(ctx, ox, oy, 12.6, 13.2, 2.2, 1.4, 31, {
              top: '#EFE2C9',
              left: '#F2E6D0',
              right: '#DDD0B6',
            });
            drawSWWallQuad(ctx, ox, oy, 14.6, 13.0, 13.6, 2, 23, '#7A4B2E', '#4F2F1C', 0.9);
            drawSWWallQuad(ctx, ox, oy, 14.6, 13.9, 14.5, 12, 23, isNight && st.kontrakan.tenantFamilyName ? '#FFE084' : '#9CC0C6', '#4F2F1C', 0.9);
            drawTerracottaRoof(ctx, ox, oy, 12.6, 13.2, 2.2, 1.4, 31, 14, {
              front: st.kontrakan.owned ? '#2A634A' : '#856C5A',
              side: st.kontrakan.owned ? '#1F4B38' : '#6A5445',
              ridge: '#163829',
              trim: '#F4E8D2',
            });
            drawStatusPill(
              ctx,
              iso(13.7, 13.9, ox, oy, 52),
              st.kontrakan.tenantFamilyName ? 'Kontrakan (Terisi)' : st.kontrakan.owned ? 'Kontrakan Milikmu' : 'Rumah Kontrakan',
              st.kontrakan.owned ? '#244B3A' : '#635952',
              '#FBF6EC'
            );
          },
        });
      }

      drawables.sort((a, b) => a.depth - b.depth);
      drawables.forEach((d) => d.draw());

      // Pinned mission waypoint beacon
      const pinned = st.missions.find((m) => m.id === st.pinnedMissionId && m.status === 'active');
      if (pinned?.mapTarget && pinned.mapTarget.floor === st.activeFloor) {
        const pPin = iso(pinned.mapTarget.x, pinned.mapTarget.y, ox, oy, 56 + Math.sin(timeSec * 4) * 3.5);
        ctx.fillStyle = '#E9B44C';
        ctx.strokeStyle = '#1D3C2E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pPin.x, pPin.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#1D3C2E';
        ctx.font = '900 11px "Nunito", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', pPin.x, pPin.y);
      }

      ctx.restore(); // end zoom/camera transform

      // 7. Screen-space Rain Particles
      if (isRaining && !st.reducedMotion) {
        const count = st.weather === 'hujan_deras' ? 95 : 50;
        ctx.strokeStyle = 'rgba(218, 238, 248, 0.52)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          const rx = ((i * 73 + timeSec * 190) % (targetW + 80)) - 40;
          const ry = (i * 47 + timeSec * 480) % (targetH + 40);
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 6, ry + 14);
        }
        ctx.stroke();
      }

      // 8. Atmospheric Dusk / Night Tint
      if (st.slot === 'sore') {
        ctx.fillStyle = 'rgba(220, 128, 60, 0.09)';
        ctx.fillRect(0, 0, targetW, targetH);
      } else if (st.slot === 'malam') {
        ctx.fillStyle = 'rgba(14, 24, 34, 0.24)';
        ctx.fillRect(0, 0, targetW, targetH);
      }

      ctx.restore();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [dispatch]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left - camRef.current.x) / zoomRef.current;
    const sy = (e.clientY - rect.top - camRef.current.y) / zoomRef.current;
    const pt = screenToIsoCoords(sx, sy, 0, 0);

    // 1. Tap Janda
    if (state.janda.floor === state.activeFloor && Math.hypot(pt.x - state.janda.x, pt.y - state.janda.y) < 1.3) {
      soundEngine.playMeow();
      dispatch({ type: 'OPEN_MODAL', modal: { type: 'janda_interact' } });
      return;
    }

    // 2. Tap Room
    const tappedRoom = state.rooms.find(
      (r) => r.floor === state.activeFloor && r.status !== 'locked' && Math.hypot(pt.x - (r.mapX + 0.8), pt.y - (r.mapY + 0.8)) < 1.65
    );
    if (tappedRoom) {
      soundEngine.playKnock();
      dispatch({ type: 'OPEN_MODAL', modal: { type: 'room_detail', roomId: tappedRoom.id } });
      return;
    }

    // 3. Tap NPC
    const tappedNpc = state.worldNpcs.find(
      (n) => n.floor === state.activeFloor && Math.hypot(pt.x - n.x, pt.y - n.y) < 1.2
    );
    if (tappedNpc) {
      soundEngine.playClick();
      if (tappedNpc.role === 'guest' && state.slot === 'malam' && !state.firstNightGuestsGreeted) {
        dispatch({ type: 'GREET_FIRST_NIGHT_GUESTS' });
        return;
      }
      if (tappedNpc.role === 'romance' || tappedNpc.role === 'adik' || tappedNpc.role === 'neighbor') {
        const cleanId = tappedNpc.id.replace('npc_', '');
        if (state.relationships[cleanId]) {
          dispatch({ type: 'OPEN_MODAL', modal: { type: 'npc_interact', npcId: cleanId } });
          return;
        }
      }
    }

    // 4. Tap Owner Room / Warung / Bengkel / Kontrakan / Stairs
    if (state.activeFloor === 1 && state.facilities.kamar_owner && Math.hypot(pt.x - 1.6, pt.y - 6.7) < 1.5) {
      dispatch({ type: 'OPEN_MODAL', modal: { type: 'owner_room' } });
      return;
    }
    if (state.activeFloor === 1 && Math.hypot(pt.x - 5.9, pt.y - 13.9) < 1.7) {
      dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'warung' });
      return;
    }
    if (state.activeFloor === 1 && Math.hypot(pt.x - 10.75, pt.y - 13.9) < 1.7) {
      dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'rental' });
      return;
    }
    if (state.activeFloor === 1 && Math.hypot(pt.x - 13.7, pt.y - 13.9) < 1.7) {
      dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'properti' });
      return;
    }
    if (state.facilities.pondasi_lantai2 && Math.hypot(pt.x - 13.5, pt.y - 4.4) < 1.5) {
      const nextFloor: FloorNumber = state.activeFloor === 1 ? 2 : state.activeFloor === 2 && state.facilities.lantai3_lounge ? 3 : 1;
      dispatch({ type: 'SET_FLOOR', floor: nextFloor });
      return;
    }

    // 5. Walk via A* pathfinding
    const path = findPath(
      { x: posRef.current.x, y: posRef.current.y },
      { x: Math.round(pt.x), y: Math.round(pt.y) },
      state.activeFloor
    );
    if (path.length > 0) {
      pathRef.current = path;
      soundEngine.playClick();
    }
  };

  // Context-sensitive proximity interactions
  const contextActions = useMemo(() => {
    void nearbyPromptTick;
    const px = posRef.current.x;
    const py = posRef.current.y;
    const floor = state.activeFloor;
    const actions: { id: string; label: string; accent?: boolean; onClick: () => void }[] = [];

    if (state.activeTourApplicantId) {
      const app = state.applicants.find((a) => a.id === state.activeTourApplicantId);
      if (app) {
        const prof = state.tenants[app.tenantId];
        actions.push({
          id: 'finish_tour',
          label: `✅ Selesaikan Tur Kamar ${app.targetRoomId} bersama ${prof?.name}`,
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

    if (state.janda.floor === floor && Math.hypot(px - state.janda.x, py - state.janda.y) < 3.4) {
      actions.push({
        id: 'act_janda',
        label: '🐾 Main / Rawat Janda',
        accent: true,
        onClick: () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'janda_interact' } }),
      });
    }

    const pendingPkg = state.packages.find((p) => !p.delivered);
    if (floor === 1 && pendingPkg && Math.hypot(px - 8.8, py - 8.6) < 3.6) {
      actions.push({
        id: 'act_pkg',
        label: `📦 Ambil & Antar Paket (${pendingPkg.recipientName})`,
        accent: true,
        onClick: () => dispatch({ type: 'DELIVER_PACKAGE', packageId: pendingPkg.id }),
      });
    }

    const nearRoom = state.rooms.find(
      (r) => r.floor === floor && r.status !== 'locked' && Math.hypot(px - r.doorX, py - r.doorY) < 2.6
    );
    if (nearRoom) {
      actions.push({
        id: `room_${nearRoom.id}`,
        label: nearRoom.status === 'occupied' ? `🚪 Ketuk Pintu ${nearRoom.name}` : `🔑 Kelola ${nearRoom.name}`,
        onClick: () => {
          soundEngine.playKnock();
          dispatch({ type: 'OPEN_MODAL', modal: { type: 'room_detail', roomId: nearRoom.id } });
        },
      });
    }

    if (floor === 1 && state.facilities.kamar_owner && Math.hypot(px - 2.2, py - 7.5) < 3.0) {
      actions.push({
        id: 'owner_room',
        label: '🏠 Masuk Ruang Owner (Tidur/Ganti Baju)',
        onClick: () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'owner_room' } }),
      });
    } else if (floor === 1 && !state.facilities.kamar_owner && Math.hypot(px - 8, py - 9.8) < 3.4) {
      actions.push({
        id: 'gate_sleep',
        label: '🌙 Pulang & Tidur (Lanjut Hari)',
        onClick: () => dispatch({ type: 'ADVANCE_DAY', expectedDay: state.day }),
      });
    }

    const openIssue = state.issues.find((i) => !i.resolved);
    if (openIssue && floor === 1 && py <= 6.5) {
      actions.push({
        id: 'check_router',
        label: `🔧 Cek & Tangani: ${openIssue.title}`,
        onClick: () => dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'properti' }),
      });
    }

    if (floor === 1 && state.bikes.length > 0 && Math.hypot(px - 11.2, py - 7.5) < 3.0) {
      actions.push({
        id: 'inspect_bike',
        label: '🛵 Inspeksi Motor Rental',
        onClick: () =>
          dispatch({
            type: 'OPEN_MODAL',
            modal: { type: 'bike_inspect', bikeId: state.bikes[0].id, kind: 'awal' },
          }),
      });
    }

    const nearNpc = state.worldNpcs.find(
      (n) =>
        n.floor === floor &&
        (n.role === 'adik' || n.role === 'romance' || n.role === 'neighbor') &&
        Math.hypot(px - n.x, py - n.y) < 3.0
    );
    if (nearNpc) {
      const relId = nearNpc.id.replace('npc_', '');
      if (state.relationships[relId]) {
        actions.push({
          id: `talk_${relId}`,
          label: `💬 Sapa ${nearNpc.name}`,
          accent: nearNpc.role === 'adik',
          onClick: () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'npc_interact', npcId: relId } }),
        });
      }
    }

    if (actions.length === 0) {
      actions.push({
        id: 'quick_janda',
        label: '🐾 Panggil Janda',
        onClick: () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'janda_interact' } }),
      });
    }

    return actions.slice(0, 3);
  }, [state, dispatch, nearbyPromptTick]);

  // Unused TILE_W/TILE_H reference check
  void TILE_W;
  void TILE_H;

  return (
    <div ref={containerRef} className="iso-world-container">
      <canvas
        ref={canvasRef}
        className="iso-canvas"
        onClick={handleCanvasClick}
        aria-label="Peta Isometrik Kost Texas"
      />

      {/* Floor, Cutaway Interior & Zoom Controls */}
      <div className="map-floating-controls">
        <div className="floor-switcher" role="group" aria-label="Pilih Lantai">
          {([1, 2, 3] as FloorNumber[]).map((fl) => {
            const locked =
              (fl === 2 && !state.facilities.pondasi_lantai2) ||
              (fl === 3 && !state.facilities.lantai3_lounge);
            return (
              <button
                key={fl}
                id={`btn-floor-${fl}`}
                className={`chip-btn ${state.activeFloor === fl ? 'active' : ''} ${locked ? 'locked' : ''}`}
                onClick={() => dispatch({ type: 'SET_FLOOR', floor: fl })}
                title={locked ? `Lantai ${fl} belum dibangun` : `Pindah ke Lantai ${fl}`}
              >
                Lt {fl} {locked ? '🔒' : ''}
              </button>
            );
          })}
        </div>

        <button
          id="btn-cutaway"
          className={`chip-btn ${state.cutaway ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_CUTAWAY' })}
          title="Lihat interior tata perabot setiap kamar"
        >
          {state.cutaway ? '🏠 Tampil Atap' : '🛋️ Lihat Interior'}
        </button>

        <div className="floor-switcher" role="group" aria-label="Zoom Peta">
          <button
            id="btn-zoom-out"
            className="chip-btn"
            onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.15).toFixed(2))))}
            title="Perkecil Peta"
          >
            −
          </button>
          <button
            id="btn-zoom-reset"
            className="chip-btn"
            onClick={() => setZoom(1)}
            title="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            id="btn-zoom-in"
            className="chip-btn"
            onClick={() => setZoom((z) => Math.min(1.45, Number((z + 0.15).toFixed(2))))}
            title="Perbesar Peta"
          >
            +
          </button>
        </div>
      </div>

      {/* Pinned Mission Banner */}
      {(() => {
        const pinned = state.missions.find((m) => m.id === state.pinnedMissionId && m.status === 'active');
        if (!pinned) return null;
        return (
          <div className="pinned-mission-pill" onClick={() => dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'misi' })}>
            <span className="pinned-dot" />
            <div>
              <strong>{pinned.title}</strong>
              <small>{pinned.nextStep}</small>
            </div>
          </div>
        );
      })()}

      {/* Proximity Context Interaction Buttons */}
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

      <div className="map-hint-bar">
        WASD / Panah atau Tap peta untuk berjalan · Klik “Lihat Interior” untuk melihat tata kamar 3D
      </div>
    </div>
  );
};
