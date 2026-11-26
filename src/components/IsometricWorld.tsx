import React, { useEffect, useMemo, useRef, useState } from 'react';
import { soundEngine } from '../engine/audio';
import { drawChibiCanvas, drawJandaCanvas } from '../engine/chibiRenderer';
import { MAP_COLS, MAP_ROWS, findPath, isTileWalkable } from '../engine/pathfinding';
import type { GameAction } from '../engine/store';
import type { FloorNumber, GameState } from '../types/game';

interface IsometricWorldProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const TILE_W = 58;
const TILE_H = 29;

function isoToScreen(gx: number, gy: number, originX: number, originY: number) {
  return {
    x: originX + (gx - gy) * (TILE_W / 2),
    y: originY + (gx + gy) * (TILE_H / 2),
  };
}

function screenToIso(sx: number, sy: number, originX: number, originY: number) {
  const dx = sx - originX;
  const dy = sy - originY;
  const gx = (dx / (TILE_W / 2) + dy / (TILE_H / 2)) / 2;
  const gy = (dy / (TILE_H / 2) - dx / (TILE_W / 2)) / 2;
  return { x: gx, y: gy };
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  fill: string,
  stroke?: string,
  scaleW = 1,
  scaleH = 1
) {
  const hw = (TILE_W / 2) * scaleW;
  const hh = (TILE_H / 2) * scaleH;
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}

function drawIsoBox(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  gx: number,
  gy: number,
  wTiles: number,
  dTiles: number,
  heightPx: number,
  topColor: string,
  leftColor: string,
  rightColor: string,
  alpha = 1
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const pTop = isoToScreen(gx, gy, originX, originY);
  const pRight = isoToScreen(gx + wTiles, gy, originX, originY);
  const pBottom = isoToScreen(gx + wTiles, gy + dTiles, originX, originY);
  const pLeft = isoToScreen(gx, gy + dTiles, originX, originY);

  // Left (SW) wall
  ctx.fillStyle = leftColor;
  ctx.beginPath();
  ctx.moveTo(pLeft.x, pLeft.y);
  ctx.lineTo(pBottom.x, pBottom.y);
  ctx.lineTo(pBottom.x, pBottom.y - heightPx);
  ctx.lineTo(pLeft.x, pLeft.y - heightPx);
  ctx.closePath();
  ctx.fill();

  // Right (SE) wall
  ctx.fillStyle = rightColor;
  ctx.beginPath();
  ctx.moveTo(pRight.x, pRight.y);
  ctx.lineTo(pBottom.x, pBottom.y);
  ctx.lineTo(pBottom.x, pBottom.y - heightPx);
  ctx.lineTo(pRight.x, pRight.y - heightPx);
  ctx.closePath();
  ctx.fill();

  // Roof / Top
  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(pTop.x, pTop.y - heightPx);
  ctx.lineTo(pRight.x, pRight.y - heightPx);
  ctx.lineTo(pBottom.x, pBottom.y - heightPx);
  ctx.lineTo(pLeft.x, pLeft.y - heightPx);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(30, 45, 36, 0.16)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

export const IsometricWorld: React.FC<IsometricWorldProps> = ({ state, dispatch }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Live smooth owner position & path ref for 60fps animation without re-rendering React every frame
  const posRef = useRef({ x: state.ownerPos.x, y: state.ownerPos.y, floor: state.ownerPos.floor });
  const pathRef = useRef<{ x: number; y: number }[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const facingRef = useRef<'left' | 'right'>('right');
  const camRef = useRef({ x: 0, y: 0, initialized: false });
  const lastSyncRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [nearbyPromptTick, setNearbyPromptTick] = useState(0);

  // Sync external teleports (e.g., from Chat "Ke Lokasi" or Floor switch)
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

      // 1. Update owner movement (WASD or tap-to-walk path)
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
        if (vx - vy < 0) facingRef.current = 'left';
        else facingRef.current = 'right';
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

      // Periodically sync position to React state (for proximity prompts & persistence)
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

      // 2. Prepare canvas
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

      // Sky / Background gradient based on TimeSlot
      const skyColors: Record<string, [string, string]> = {
        pagi: ['#D8EBD8', '#F8EED8'],
        siang: ['#C9E2CF', '#F3E9D2'],
        sore: ['#DFB48E', '#F3D19C'],
        malam: ['#17252A', '#263B3D'],
      };
      const [c1, c2] = skyColors[st.slot] ?? skyColors.pagi;
      const bgGrad = ctx.createLinearGradient(0, 0, 0, targetH);
      bgGrad.addColorStop(0, c1);
      bgGrad.addColorStop(1, c2);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, targetW, targetH);

      // Camera follows owner smoothly
      const ownerIsoRaw = isoToScreen(posRef.current.x, posRef.current.y, 0, 0);
      const desiredCamX = targetW / 2 - ownerIsoRaw.x;
      const desiredCamY = targetH / 2 - ownerIsoRaw.y + 32;
      if (!camRef.current.initialized) {
        camRef.current = { x: desiredCamX, y: desiredCamY, initialized: true };
      } else {
        const lerp = st.reducedMotion ? 1 : Math.min(1, dt * 6);
        camRef.current.x += (desiredCamX - camRef.current.x) * lerp;
        camRef.current.y += (desiredCamY - camRef.current.y) * lerp;
      }

      const originX = camRef.current.x;
      const originY = camRef.current.y;
      const isNight = st.slot === 'malam';
      const isRaining = st.weather === 'hujan' || st.weather === 'hujan_deras';

      // 3. Draw Isometric Ground Tiles
      for (let gy = 0; gy < MAP_ROWS; gy++) {
        for (let gx = 0; gx < MAP_COLS; gx++) {
          const { x, y } = isoToScreen(gx, gy, originX, originY);
          if (st.activeFloor > 1) {
            if (gy >= 1 && gy <= 6 && gx >= 2 && gx <= 13) {
              const fill = gy <= 3 ? '#EFE4CE' : '#DFCFAF';
              drawDiamond(ctx, x, y, fill, 'rgba(36,75,58,0.12)');
            }
            continue;
          }

          let tileFill = '#8FB27E'; // lush tropical grass
          if (gy >= 11 && gy <= 12) {
            tileFill = '#7E7A72'; // Indonesian alley asphalt
          } else if (gy >= 13) {
            tileFill = '#9F9684'; // Opposite alley sidewalk / shops
          } else if (gy === 10) {
            tileFill = gx >= 7 && gx <= 9 ? '#D7C3A1' : '#7C9B6D'; // gate path
          } else if (gy >= 4 && gy <= 5 && gx >= 2 && gx <= 13) {
            tileFill = '#E7D8BE'; // kos corridor tiles
          } else if (gy >= 6 && gy <= 9 && gx >= 10 && gx <= 13) {
            tileFill = st.facilities.petak_motor ? '#B8B0A0' : '#9E9A8B'; // parking paving
          } else if (gy >= 6 && gy <= 8 && gx >= 3 && gx <= 8) {
            tileFill = '#DFCCB0'; // warm terracotta-cream terrace
          } else if (gy >= 1 && gy <= 3 && gx >= 2 && gx <= 13) {
            tileFill = '#F3E7D2'; // room footprint
          }

          drawDiamond(ctx, x, y, tileFill, 'rgba(36, 75, 58, 0.08)');

          // Parking bay lines when upgraded
          if (st.facilities.petak_motor && gy >= 6 && gy <= 8 && gx >= 10 && gx <= 12) {
            ctx.strokeStyle = 'rgba(251, 246, 236, 0.72)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(x - 12, y - 6);
            ctx.lineTo(x + 12, y + 6);
            ctx.stroke();
          }

          // Rain puddles
          if (isRaining && (gx + gy * 3) % 11 === 0 && gy >= 6 && gy <= 12) {
            ctx.fillStyle = 'rgba(130, 175, 195, 0.36)';
            ctx.beginPath();
            ctx.ellipse(x, y, 13, 6, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw active walking target indicator
      if (pathRef.current.length > 0) {
        const end = pathRef.current[pathRef.current.length - 1];
        const pt = isoToScreen(end.x, end.y, originX, originY);
        ctx.strokeStyle = '#E9B44C';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y, 12 + Math.sin(timeSec * 6) * 2, 6 + Math.sin(timeSec * 6), 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Draw Kos Rooms on Active Floor
      const floorRooms = st.rooms.filter((r) => r.floor === st.activeFloor);
      for (const room of floorRooms) {
        if (room.status === 'locked') {
          // Empty plot outline / future room pad
          const p = isoToScreen(room.mapX + 0.8, room.mapY + 1, originX, originY);
          drawDiamond(ctx, p.x, p.y, 'rgba(36, 75, 58, 0.09)', 'rgba(36, 75, 58, 0.25)', 2.2, 2.2);
          ctx.fillStyle = isNight ? '#D4DFD5' : '#3C5949';
          ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`+ Lahan ${room.id}`, p.x, p.y + 3);
          continue;
        }

        const ownerBehind =
          posRef.current.floor === room.floor &&
          Math.abs(posRef.current.x - room.doorX) < 2.2 &&
          posRef.current.y <= room.doorY + 0.8;
        const showCutaway = st.cutaway || ownerBehind;

        if (room.status === 'constructing') {
          // Construction scaffolding & tarp!
          drawIsoBox(ctx, originX, originY, room.mapX - 0.5, room.mapY - 0.5, 2.4, 2.4, 34, '#D9A96A', '#C88E4B', '#B07B3C', 0.88);
          const pLbl = isoToScreen(room.mapX + 0.7, room.mapY + 0.7, originX, originY);
          ctx.fillStyle = '#244B3A';
          ctx.beginPath();
          ctx.roundRect(pLbl.x - 42, pLbl.y - 54, 84, 20, 8);
          ctx.fill();
          ctx.fillStyle = '#F6CE6B';
          ctx.font = '800 10px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`🚧 Proyek ${room.id}`, pLbl.x, pLbl.y - 41);
          continue;
        }

        const wallH = showCutaway ? 14 : 46;
        const roofColor = room.tier === 'premium' ? '#B24727' : '#C85A32';
        const leftWall = '#EFE2C9';
        const rightWall = '#E0CFAF';

        drawIsoBox(
          ctx,
          originX,
          originY,
          room.mapX - 0.5,
          room.mapY - 0.5,
          2.4,
          2.4,
          wallH,
          showCutaway ? '#F8F0DF' : roofColor,
          leftWall,
          rightWall,
          ownerBehind && !st.cutaway ? 0.52 : 1
        );

        // Interior mini furniture preview when cutaway!
        if (showCutaway) {
          const pIn = isoToScreen(room.mapX + 0.4, room.mapY + 0.5, originX, originY);
          // Bed
          ctx.fillStyle = room.tier === 'premium' ? '#244B3A' : '#C85A32';
          ctx.beginPath();
          ctx.roundRect(pIn.x - 20, pIn.y - 20, 22, 12, 3);
          ctx.fill();
          ctx.fillStyle = '#FBF6EC';
          ctx.fillRect(pIn.x - 19, pIn.y - 19, 7, 10);
          // Desk if furnished
          if (room.furniture.some((f) => f.type === 'meja_besar' || f.type === 'meja_kecil')) {
            ctx.fillStyle = '#8C5332';
            ctx.fillRect(pIn.x + 8, pIn.y - 16, 14, 9);
          }
        } else {
          // Door & Warm Window on front wall
          const pDoor = isoToScreen(room.mapX + 0.6, room.mapY + 1.9, originX, originY);
          ctx.fillStyle = '#7C4B2D';
          ctx.fillRect(pDoor.x - 6, pDoor.y - 26, 12, 24);
          // Sandals in front of occupied room door!
          if (room.status === 'occupied') {
            ctx.fillStyle = '#C85A32';
            ctx.fillRect(pDoor.x + 8, pDoor.y + 1, 5, 3);
            ctx.fillRect(pDoor.x + 14, pDoor.y + 2, 5, 3);
          }
          // Glowing Window at night!
          const pWin = isoToScreen(room.mapX + 1.5, room.mapY + 1.9, originX, originY);
          ctx.fillStyle = room.lightOn ? '#FFD56B' : isNight ? '#354A4C' : '#9DC2C9';
          ctx.fillRect(pWin.x - 7, pWin.y - 30, 14, 12);
          if (room.lightOn && isNight) {
            ctx.fillStyle = 'rgba(255, 213, 107, 0.25)';
            ctx.beginPath();
            ctx.arc(pWin.x, pWin.y - 24, 18, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Room status pill above roof
        const pTag = isoToScreen(room.mapX + 0.7, room.mapY + 0.6, originX, originY);
        const tenant = room.tenantId ? st.tenants[room.tenantId] : null;
        const tagText =
          room.status === 'occupied'
            ? `${room.id} · ${tenant?.name ?? 'Terisi'}${room.guestPresent ? ' ♥' : ''}`
            : `${room.id} · Kosong`;
        ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
        const tw = ctx.measureText(tagText).width + 12;
        ctx.fillStyle = room.status === 'occupied' ? 'rgba(36, 75, 58, 0.92)' : 'rgba(200, 90, 50, 0.92)';
        ctx.beginPath();
        ctx.roundRect(pTag.x - tw / 2, pTag.y - wallH - 22, tw, 17, 8);
        ctx.fill();
        ctx.fillStyle = '#FBF6EC';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, pTag.x, pTag.y - wallH - 13.5);
      }

      // Stairs to Lantai 2 / 3 (x=13, y=4.5)
      if (st.facilities.pondasi_lantai2) {
        const pSt = isoToScreen(13.2, 4.5, originX, originY);
        drawIsoBox(ctx, originX, originY, 12.8, 3.8, 1.3, 1.6, 22, '#D2BA94', '#A68860', '#8A6F4B');
        ctx.fillStyle = '#244B3A';
        ctx.beginPath();
        ctx.roundRect(pSt.x - 28, pSt.y - 42, 56, 17, 8);
        ctx.fill();
        ctx.fillStyle = '#F6CE6B';
        ctx.font = '800 9.5px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(st.activeFloor === 1 ? '⬆ Tangga' : '⬇ Tangga', pSt.x, pSt.y - 31);
      }

      // 5. Floor 1 Props: Mango Tree, Bench, Terrace Canopy, Owner Room, Signboard, Bikes, Alley Shops!
      if (st.activeFloor === 1) {
        // Owner's Private Room (x=0.8..2.3, y=6..8)
        if (st.facilities.kamar_owner) {
          drawIsoBox(ctx, originX, originY, 0.7, 5.8, 2.0, 2.2, st.cutaway ? 12 : 40, '#244B3A', '#F3E7D2', '#E2D0B1');
          const pOw = isoToScreen(1.7, 6.9, originX, originY);
          ctx.fillStyle = '#244B3A';
          ctx.beginPath();
          ctx.roundRect(pOw.x - 40, pOw.y - 54, 80, 17, 8);
          ctx.fill();
          ctx.fillStyle = '#F6CE6B';
          ctx.font = '800 9.5px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🏠 Ruang Owner', pOw.x, pOw.y - 45);
        }

        // Terrace Canopy & Warm String Lights
        if (st.facilities.kanopi_teras) {
          const pCan = isoToScreen(5.5, 6.8, originX, originY);
          ctx.save();
          ctx.fillStyle = 'rgba(200, 90, 50, 0.24)';
          ctx.beginPath();
          ctx.ellipse(pCan.x, pCan.y - 30, 74, 30, 0, 0, Math.PI * 2);
          ctx.fill();
          if (isNight || st.slot === 'sore') {
            for (let i = -3; i <= 3; i++) {
              ctx.fillStyle = '#FFE082';
              ctx.beginPath();
              ctx.arc(pCan.x + i * 18, pCan.y - 26 + Math.abs(i) * 1.5, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
        }

        // Terrace wooden bench (moves near tree if bangku_geser built!)
        const benchX = st.facilities.bangku_geser ? 4.3 : 5.4;
        const benchY = st.facilities.bangku_geser ? 8.3 : 7.0;
        drawIsoBox(ctx, originX, originY, benchX, benchY, 1.2, 0.5, 8, '#A97149', '#7D4F2F', '#684024');

        // Naya's Preloved Table & Rack
        if (st.facilities.rak_preloved_teras) {
          drawIsoBox(ctx, originX, originY, 6.6, 7.2, 1.1, 0.6, 11, '#E9B44C', '#C85A32', '#A64422');
          const pPr = isoToScreen(7.1, 7.5, originX, originY);
          ctx.fillStyle = '#FBF6EC';
          ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('👗 Preloved', pPr.x, pPr.y - 18);
        }

        // Package Rack + Unclaimed Packages
        const pPkg = isoToScreen(8.9, 8.6, originX, originY);
        if (st.facilities.rak_paket) {
          drawIsoBox(ctx, originX, originY, 8.5, 8.2, 0.9, 0.7, 16, '#B88355', '#8C5B32', '#704725');
        }
        const pendingPkgs = st.packages.filter((p) => !p.delivered);
        if (pendingPkgs.length > 0) {
          drawIsoBox(ctx, originX, originY, 8.6, 8.6, 0.55, 0.55, 10, '#D8A66D', '#B6834B', '#986B3A');
          ctx.fillStyle = '#C85A32';
          ctx.beginPath();
          ctx.roundRect(pPkg.x - 28, pPkg.y - 30, 56, 16, 7);
          ctx.fill();
          ctx.fillStyle = '#FBF6EC';
          ctx.font = '800 9px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`📦 Paket (${pendingPkgs.length})`, pPkg.x, pPkg.y - 19);
        }

        // Janda's Bowl & Cardboard Box
        if (st.janda.bowlPlaced) {
          const bx = st.janda.bowlSpot === 'kamar_owner' ? 2.4 : st.janda.bowlSpot === 'teras' ? 5.1 : 4.2;
          const by = st.janda.bowlSpot === 'kamar_owner' ? 7.6 : st.janda.bowlSpot === 'teras' ? 7.4 : 8.7;
          const pb = isoToScreen(bx, by, originX, originY);
          ctx.fillStyle = '#C85A32';
          ctx.beginPath();
          ctx.ellipse(pb.x, pb.y, 7, 4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        if (st.janda.cardboardPlaced) {
          drawIsoBox(ctx, originX, originY, 8.1, 8.1, 0.55, 0.55, 7, '#CFA16B', '#A97B48', '#8F6538');
        }

        // Parked Rental & Tenant Motorbikes in Parking Area (x=10.5..12.5, y=6.5..8.5)
        const visibleBikes = Math.max(st.bikes.length, st.contracts.filter((c) => c.status === 'active').length > 0 ? 1 : 0);
        for (let i = 0; i < Math.min(4, visibleBikes); i++) {
          const b = st.bikes[i];
          if (b && b.status !== 'tersedia') continue;
          const pb = isoToScreen(10.8 + (i % 2) * 1.4, 6.8 + Math.floor(i / 2) * 1.5, originX, originY);
          ctx.fillStyle = 'rgba(20,30,24,0.22)';
          ctx.beginPath();
          ctx.ellipse(pb.x, pb.y + 2, 13, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = b?.color ?? '#2F5E48';
          ctx.beginPath();
          ctx.roundRect(pb.x - 10, pb.y - 11, 20, 10, 4);
          ctx.fill();
          ctx.fillStyle = '#1F2421';
          ctx.beginPath();
          ctx.arc(pb.x - 7, pb.y, 4, 0, Math.PI * 2);
          ctx.arc(pb.x + 7, pb.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Fence & Gate + Iconic KOST TEXAS Signboard!
        for (let gx = 1; gx <= 14; gx++) {
          if (gx >= 7 && gx <= 9) continue; // open gate!
          drawIsoBox(ctx, originX, originY, gx, 9.8, 0.9, 0.2, 16, '#EFE4CE', '#D9CAAE', '#C3B193');
        }
        if (st.signboardPlaced) {
          const pSign = isoToScreen(8, 9.7, originX, originY);
          ctx.strokeStyle = '#5C3A21';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(pSign.x - 36, pSign.y + 4);
          ctx.lineTo(pSign.x - 36, pSign.y - 36);
          ctx.moveTo(pSign.x + 36, pSign.y + 4);
          ctx.lineTo(pSign.x + 36, pSign.y - 36);
          ctx.stroke();
          ctx.fillStyle = '#244B3A';
          ctx.strokeStyle = '#E9B44C';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(pSign.x - 44, pSign.y - 46, 88, 22, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#F6CE6B';
          ctx.font = '900 10.5px "Nunito", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('KOST TEXAS', pSign.x, pSign.y - 35);
        }

        // Lush Tropical Mango Tree (x=3, y=9)
        const pTree = isoToScreen(3.1, 9.0, originX, originY);
        const sway = Math.sin(timeSec * 1.8) * 2.5;
        ctx.fillStyle = 'rgba(20, 38, 28, 0.25)';
        ctx.beginPath();
        ctx.ellipse(pTree.x, pTree.y + 4, 28, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6B442A';
        ctx.beginPath();
        ctx.roundRect(pTree.x - 6, pTree.y - 42, 12, 44, 4);
        ctx.fill();
        ctx.fillStyle = '#23533C';
        ctx.beginPath();
        ctx.arc(pTree.x - 16 + sway, pTree.y - 52, 22, 0, Math.PI * 2);
        ctx.arc(pTree.x + 16 + sway, pTree.y - 48, 20, 0, Math.PI * 2);
        ctx.arc(pTree.x + sway, pTree.y - 66, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#367554';
        ctx.beginPath();
        ctx.arc(pTree.x - 6 + sway, pTree.y - 68, 16, 0, Math.PI * 2);
        ctx.arc(pTree.x + 12 + sway, pTree.y - 56, 14, 0, Math.PI * 2);
        ctx.fill();
        // Hanging Golden Mangoes!
        ctx.fillStyle = '#E9B44C';
        [
          [pTree.x - 14 + sway, pTree.y - 46, 4],
          [pTree.x + 12 + sway, pTree.y - 44, 3.8],
          [pTree.x + 1 + sway, pTree.y - 56, 4.2],
        ].forEach(([mx, my, mr]) => {
          ctx.beginPath();
          ctx.arc(mx, my, mr, 0, Math.PI * 2);
          ctx.fill();
        });

        // Across the Alley: Coffee Cart, Warung/Restoran, Bengkel, Kontrakan!
        // 1. Coffee Cart Arka (x=1.5, y=13)
        drawIsoBox(ctx, originX, originY, 1.3, 12.8, 1.4, 1.1, 22, '#6D4534', '#E9B44C', '#C89232');
        const pCof = isoToScreen(2.0, 13.2, originX, originY);
        ctx.fillStyle = '#244B3A';
        ctx.beginPath();
        ctx.roundRect(pCof.x - 35, pCof.y - 42, 70, 16, 7);
        ctx.fill();
        ctx.fillStyle = '#FBF6EC';
        ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('☕ Coffee Cart', pCof.x, pCof.y - 31);

        // 2. Warung / Restoran Kost Texas (x=5..7, y=13)
        drawIsoBox(
          ctx,
          originX,
          originY,
          4.8,
          12.8,
          2.2,
          1.3,
          st.warung.level === 2 ? 34 : 26,
          st.warung.unlocked ? '#C85A32' : '#8A8378',
          '#F3E7D2',
          '#DFCAA8'
        );
        const pWar = isoToScreen(5.9, 13.4, originX, originY);
        ctx.fillStyle = st.warung.unlocked ? '#C85A32' : '#57534E';
        ctx.beginPath();
        ctx.roundRect(pWar.x - 42, pWar.y - 48, 84, 17, 7);
        ctx.fill();
        ctx.fillStyle = '#FBF6EC';
        ctx.font = '800 9.5px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(st.warung.level === 2 ? '🍲 Resto Texas' : st.warung.unlocked ? '🍜 Warung Gang' : '🍜 Lahan Warung', pWar.x, pWar.y - 37);

        // 3. Bengkel Mas Eko (x=10.5..12.2, y=13)
        drawIsoBox(ctx, originX, originY, 10.2, 12.8, 2.0, 1.3, 28, '#3B5868', '#DDE4E8', '#C3CDD4');
        const pBen = isoToScreen(11.2, 13.4, originX, originY);
        ctx.fillStyle = '#263B47';
        ctx.beginPath();
        ctx.roundRect(pBen.x - 40, pBen.y - 48, 80, 17, 7);
        ctx.fill();
        ctx.fillStyle = '#F6CE6B';
        ctx.font = '800 9.5px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔧 Bengkel Eko', pBen.x, pBen.y - 37);

        // 4. Rumah Kontrakan (x=13.2, y=12.8)
        drawIsoBox(
          ctx,
          originX,
          originY,
          13.0,
          12.6,
          1.8,
          1.5,
          30,
          st.kontrakan.owned ? '#2B6E52' : '#7D6E62',
          '#EFE2C9',
          '#DAC6A6'
        );
        const pKon = isoToScreen(13.9, 13.3, originX, originY);
        ctx.fillStyle = st.kontrakan.owned ? '#244B3A' : '#5E564F';
        ctx.beginPath();
        ctx.roundRect(pKon.x - 36, pKon.y - 50, 72, 17, 7);
        ctx.fill();
        ctx.fillStyle = '#FBF6EC';
        ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏡 Kontrakan', pKon.x, pKon.y - 39);
      }

      // 6. Depth-sorted Actors: Owner, Janda, and all NPCs on Active Floor!
      type Drawable = { depth: number; draw: () => void };
      const drawables: Drawable[] = [];

      // Owner
      if (st.activeFloor === posRef.current.floor) {
        const pOw = isoToScreen(posRef.current.x, posRef.current.y, originX, originY);
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
        const pJ = isoToScreen(st.janda.x, st.janda.y, originX, originY);
        drawables.push({
          depth: st.janda.x + st.janda.y,
          draw: () => drawJandaCanvas(ctx, pJ.x, pJ.y, st.janda.pose, timeSec, 1.05, true),
        });
      }

      // World NPCs
      for (const npc of st.worldNpcs) {
        if (npc.floor !== st.activeFloor) continue;
        const pN = isoToScreen(npc.x, npc.y, originX, originY);
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
              speech: npc.speech,
            }),
        });
      }

      drawables.sort((a, b) => a.depth - b.depth);
      drawables.forEach((d) => d.draw());

      // Pinned mission waypoint marker
      const pinned = st.missions.find((m) => m.id === st.pinnedMissionId && m.status === 'active');
      if (pinned?.mapTarget && pinned.mapTarget.floor === st.activeFloor) {
        const pPin = isoToScreen(pinned.mapTarget.x, pinned.mapTarget.y, originX, originY);
        const bob = Math.sin(timeSec * 4) * 4;
        ctx.fillStyle = '#E9B44C';
        ctx.strokeStyle = '#244B3A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pPin.x, pPin.y - 52 + bob, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#244B3A';
        ctx.font = '900 11px "Nunito", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', pPin.x, pPin.y - 52 + bob);
      }

      // 7. Rain Particles Overlay
      if (isRaining && !st.reducedMotion) {
        const count = st.weather === 'hujan_deras' ? 95 : 50;
        ctx.strokeStyle = 'rgba(215, 236, 245, 0.55)';
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

      // 8. Evening/Night Ambient Tint
      if (st.slot === 'sore') {
        ctx.fillStyle = 'rgba(220, 128, 60, 0.11)';
        ctx.fillRect(0, 0, targetW, targetH);
      } else if (st.slot === 'malam') {
        ctx.fillStyle = 'rgba(14, 24, 34, 0.28)';
        ctx.fillRect(0, 0, targetW, targetH);
      }

      ctx.restore();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [dispatch]);

  // Handle tap / click on isometric map to walk or directly interact with clicked object!
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const iso = screenToIso(sx, sy, camRef.current.x, camRef.current.y);

    // Check if user tapped directly on Janda
    if (state.janda.floor === state.activeFloor && Math.hypot(iso.x - state.janda.x, iso.y - state.janda.y) < 1.3) {
      soundEngine.playMeow();
      dispatch({ type: 'OPEN_MODAL', modal: { type: 'janda_interact' } });
      return;
    }

    // Check if user tapped directly on a Room
    const tappedRoom = state.rooms.find(
      (r) => r.floor === state.activeFloor && r.status !== 'locked' && Math.hypot(iso.x - (r.mapX + 0.6), iso.y - (r.mapY + 0.6)) < 1.6
    );
    if (tappedRoom) {
      soundEngine.playKnock();
      dispatch({ type: 'OPEN_MODAL', modal: { type: 'room_detail', roomId: tappedRoom.id } });
      return;
    }

    // Check if user tapped an NPC
    const tappedNpc = state.worldNpcs.find(
      (n) => n.floor === state.activeFloor && Math.hypot(iso.x - n.x, iso.y - n.y) < 1.2
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

    // Check Owner Room tap
    if (state.activeFloor === 1 && state.facilities.kamar_owner && Math.hypot(iso.x - 1.7, iso.y - 6.9) < 1.5) {
      dispatch({ type: 'OPEN_MODAL', modal: { type: 'owner_room' } });
      return;
    }

    // Check Warung / Bengkel / Stairs tap
    if (state.activeFloor === 1 && Math.hypot(iso.x - 5.9, iso.y - 13.4) < 1.7) {
      dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'warung' });
      return;
    }
    if (state.activeFloor === 1 && Math.hypot(iso.x - 11.2, iso.y - 13.4) < 1.7) {
      dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'rental' });
      return;
    }
    if (state.facilities.pondasi_lantai2 && Math.hypot(iso.x - 13.2, iso.y - 4.5) < 1.5) {
      const nextFloor: FloorNumber = state.activeFloor === 1 ? 2 : state.activeFloor === 2 && state.facilities.lantai3_lounge ? 3 : 1;
      dispatch({ type: 'SET_FLOOR', floor: nextFloor });
      return;
    }

    // Otherwise compute A* path and walk!
    const path = findPath(
      { x: posRef.current.x, y: posRef.current.y },
      { x: Math.round(iso.x), y: Math.round(iso.y) },
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

    // 1. Active Room Tour completion!
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

    // 2. First night Kos Bebas greeting!
    if (state.slot === 'malam' && state.contracts.some((c) => c.status === 'active') && !state.firstNightGuestsGreeted) {
      actions.push({
        id: 'greet_first_night',
        label: '👋 Sapa Penghuni & Pasangan (Malam Pertama)',
        accent: true,
        onClick: () => dispatch({ type: 'GREET_FIRST_NIGHT_GUESTS' }),
      });
    }

    // 3. Nearby Janda
    if (state.janda.floor === floor && Math.hypot(px - state.janda.x, py - state.janda.y) < 3.4) {
      actions.push({
        id: 'act_janda',
        label: '🐾 Main / Rawat Janda',
        accent: true,
        onClick: () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'janda_interact' } }),
      });
    }

    // 4. Nearby Pending Packages
    const pendingPkg = state.packages.find((p) => !p.delivered);
    if (floor === 1 && pendingPkg && Math.hypot(px - 8.8, py - 8.6) < 3.6) {
      actions.push({
        id: 'act_pkg',
        label: `📦 Ambil & Antar Paket (${pendingPkg.recipientName})`,
        accent: true,
        onClick: () => dispatch({ type: 'DELIVER_PACKAGE', packageId: pendingPkg.id }),
      });
    }

    // 5. Nearby Room Door
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

    // 6. Nearby Owner Room or Gate Sleep
    if (floor === 1 && state.facilities.kamar_owner && Math.hypot(px - 2.2, py - 7.5) < 3.0) {
      actions.push({
        id: 'owner_room',
        label: '🏠 Masuk Ruang Owner (Tidur/Ganti Baju)',
        onClick: () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'owner_room' } }),
      });
    } else if (floor === 1 && !state.facilities.kamar_owner && Math.hypot(px - 8, py - 9.8) < 3.2) {
      actions.push({
        id: 'gate_sleep',
        label: '🌙 Pulang & Tidur (Lanjut Hari)',
        onClick: () => dispatch({ type: 'ADVANCE_DAY', expectedDay: state.day }),
      });
    }

    // 7. Nearby Unresolved Building Issue / Router
    const openIssue = state.issues.find((i) => !i.resolved);
    if (openIssue && floor === 1 && py <= 6.5) {
      actions.push({
        id: 'check_router',
        label: `🔧 Cek & Tangani: ${openIssue.title}`,
        onClick: () => dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'properti' }),
      });
    }

    // 8. Nearby Motorbike Parking
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

    // 9. Nearby Adik / Romance NPC
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

    // Always offer a quick Janda shortcut if nothing else is close so mobile users never hunt
    if (actions.length === 0) {
      actions.push({
        id: 'quick_janda',
        label: '🐾 Panggil Janda',
        onClick: () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'janda_interact' } }),
      });
    }

    return actions.slice(0, 3);
  }, [state, dispatch, nearbyPromptTick]);

  return (
    <div ref={containerRef} className="iso-world-container">
      <canvas
        ref={canvasRef}
        className="iso-canvas"
        onClick={handleCanvasClick}
        aria-label="Peta Isometrik Kost Texas"
      />

      {/* Floor & Cutaway Controls (Top-Left inside Map) */}
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
        >
          {state.cutaway ? '🧱 Dinding Utuh' : '✂️ Potong Dinding'}
        </button>
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

      {/* Subtle Controls Hint (Desktop) */}
      <div className="map-hint-bar">
        WASD / Panah atau Tap peta untuk berjalan · Tap objek/kamar/Janda untuk interaksi
      </div>
    </div>
  );
};
