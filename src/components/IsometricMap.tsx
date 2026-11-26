import React, { useEffect, useRef } from 'react';
import { MAP_SPOTS, OUTFITS } from '../data/catalog';
import type { GameState, JandaSpotId, MapSpotId } from '../types/game';

interface IsometricMapProps {
  state: GameState;
  walkCommand: { spotId: MapSpotId; nonce: number } | null;
  onOwnerMoveCommit: (x: number, y: number, floor?: 1 | 2 | 3) => void;
  onSelectSpot: (spotId: MapSpotId) => void;
  onSelectJanda: () => void;
}

const GRID_W = 16;
const GRID_H = 16;
const TILE_W = 68;
const TILE_H = 34;

function isoToScreen(gx: number, gy: number): { sx: number; sy: number } {
  return {
    sx: (gx - gy) * (TILE_W / 2),
    sy: (gx + gy) * (TILE_H / 2),
  };
}

function screenToIso(sx: number, sy: number): { gx: number; gy: number } {
  const gx = (sx / (TILE_W / 2) + sy / (TILE_H / 2)) / 2;
  const gy = (sy / (TILE_H / 2) - sx / (TILE_W / 2)) / 2;
  return { gx, gy };
}

function isTileWalkable(x: number, y: number, floor: 1 | 2 | 3): boolean {
  if (x < 1 || y < 2 || x > 14 || y > 14) return false;
  if (floor > 1) {
    // Upper floor corridor + balconies + stairs
    return x >= 3 && x <= 12 && y >= 4 && y <= 8;
  }
  // Floor 1: keep building back walls solid, allow corridor, doors, terrace, yard, gate, alley
  if (y < 4 && x >= 3 && x <= 11) return false;
  return true;
}

function findPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  floor: 1 | 2 | 3
): { x: number; y: number }[] {
  const startX = Math.round(sx);
  const startY = Math.round(sy);
  const goalX = Math.max(1, Math.min(14, Math.round(tx)));
  const goalY = Math.max(2, Math.min(14, Math.round(ty)));

  if (!isTileWalkable(goalX, goalY, floor)) return [];

  const key = (x: number, y: number) => `${x},${y}`;
  const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
  const visited = new Set<string>([key(startX, startY)]);
  const parent = new Map<string, { x: number; y: number }>();

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.x === goalX && cur.y === goalY) {
      const path: { x: number; y: number }[] = [];
      let p: { x: number; y: number } | undefined = cur;
      while (p && !(p.x === startX && p.y === startY)) {
        path.unshift(p);
        p = parent.get(key(p.x, p.y));
      }
      return path;
    }
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const nk = key(nx, ny);
      if (!visited.has(nk) && isTileWalkable(nx, ny, floor)) {
        visited.add(nk);
        parent.set(nk, cur);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return [];
}

function getJandaCoords(spot: JandaSpotId): { x: number; y: number; floor: 1 | 2 | 3 } {
  switch (spot) {
    case 'bangku_mangga':
      return { x: 4.3, y: 10.2, floor: 1 };
    case 'teras':
      return { x: 7.4, y: 8.2, floor: 1 };
    case 'rak_sepatu':
      return { x: 6.2, y: 7.6, floor: 1 };
    case 'kardus_paket':
      return { x: 9.2, y: 8.1, floor: 1 };
    case 'ruang_owner':
      return { x: 3.4, y: 6.1, floor: 1 };
    case 'lantai_2':
      return { x: 6.8, y: 6.5, floor: 2 };
    case 'warung':
      return { x: 12.6, y: 11.2, floor: 1 };
  }
}

export const IsometricMap: React.FC<IsometricMapProps> = ({
  state,
  walkCommand,
  onOwnerMoveCommit,
  onSelectSpot,
  onSelectJanda,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const posRef = useRef({ x: state.ownerPos.x, y: state.ownerPos.y, floor: state.ownerPos.floor });
  const pathRef = useRef<{ x: number; y: number }[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const cameraRef = useRef({ x: 0, y: 0 });
  const lastCommitRef = useRef(0);
  const tapRippleRef = useRef<{ x: number; y: number; t: number } | null>(null);

  // Sync external teleport / floor change
  useEffect(() => {
    const dx = Math.abs(posRef.current.x - state.ownerPos.x);
    const dy = Math.abs(posRef.current.y - state.ownerPos.y);
    if (posRef.current.floor !== state.ownerPos.floor || dx > 2.2 || dy > 2.2) {
      posRef.current = { x: state.ownerPos.x, y: state.ownerPos.y, floor: state.ownerPos.floor };
      pathRef.current = [];
    }
  }, [state.ownerPos.x, state.ownerPos.y, state.ownerPos.floor]);

  // Handle programmatic walk commands (e.g. from Peta Gang or Chat)
  useEffect(() => {
    if (!walkCommand) return;
    const target = MAP_SPOTS[walkCommand.spotId];
    if (!target) return;
    if (target.floor !== posRef.current.floor) {
      // Switch floor via stairs
      posRef.current = { x: target.x, y: target.y, floor: target.floor };
      pathRef.current = [];
      onOwnerMoveCommit(target.x, target.y, target.floor);
      return;
    }
    const path = findPath(posRef.current.x, posRef.current.y, target.x, target.y, posRef.current.floor);
    pathRef.current = path;
  }, [walkCommand, onOwnerMoveCommit]);

  // Keyboard listeners for WASD / Arrows
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        keysRef.current[k] = true;
        pathRef.current = [];
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Main Canvas2D animation & draw loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const drawDiamond = (
      ctx: CanvasRenderingContext2D,
      gx: number,
      gy: number,
      fill: string,
      stroke?: string
    ) => {
      const { sx, sy } = isoToScreen(gx, gy);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + TILE_W / 2, sy + TILE_H / 2);
      ctx.lineTo(sx, sy + TILE_H);
      ctx.lineTo(sx - TILE_W / 2, sy + TILE_H / 2);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const drawIsoBox = (
      ctx: CanvasRenderingContext2D,
      gx: number,
      gy: number,
      w: number,
      d: number,
      h: number,
      topColor: string,
      leftColor: string,
      rightColor: string,
      alpha = 1
    ) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      const p0 = isoToScreen(gx, gy);
      const p1 = isoToScreen(gx + w, gy);
      const p2 = isoToScreen(gx + w, gy + d);
      const p3 = isoToScreen(gx, gy + d);

      // Left face (south-west)
      ctx.beginPath();
      ctx.moveTo(p3.sx, p3.sy - h);
      ctx.lineTo(p2.sx, p2.sy - h);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.lineTo(p3.sx, p3.sy);
      ctx.closePath();
      ctx.fillStyle = leftColor;
      ctx.fill();

      // Right face (south-east)
      ctx.beginPath();
      ctx.moveTo(p1.sx, p1.sy - h);
      ctx.lineTo(p2.sx, p2.sy - h);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.lineTo(p1.sx, p1.sy);
      ctx.closePath();
      ctx.fillStyle = rightColor;
      ctx.fill();

      // Top face
      ctx.beginPath();
      ctx.moveTo(p0.sx, p0.sy - h);
      ctx.lineTo(p1.sx, p1.sy - h);
      ctx.lineTo(p2.sx, p2.sy - h);
      ctx.lineTo(p3.sx, p3.sy - h);
      ctx.closePath();
      ctx.fillStyle = topColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(20, 46, 33, 0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    const drawChibiSprite = (
      ctx: CanvasRenderingContext2D,
      gx: number,
      gy: number,
      opts: {
        label: string;
        hairColor: string;
        skinTone: string;
        outfitId: string;
        isOwner?: boolean;
        holdingUmbrella?: boolean;
        bobPhase?: number;
        badgeText?: string;
      }
    ) => {
      const { sx, sy } = isoToScreen(gx, gy);
      const outfit = OUTFITS.find((o) => o.id === opts.outfitId) || OUTFITS[0];
      const bob = opts.bobPhase ? Math.abs(Math.sin(opts.bobPhase)) * 3.5 : 0;
      const baseY = sy + TILE_H / 2 - bob;

      // Ground shadow
      ctx.fillStyle = 'rgba(15, 38, 26, 0.28)';
      ctx.beginPath();
      ctx.ellipse(sx, sy + TILE_H / 2 + 2, 11, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Owner highlight ring
      if (opts.isOwner) {
        ctx.strokeStyle = '#f5c85c';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(sx, sy + TILE_H / 2 + 2, 15, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Legs
      ctx.fillStyle = outfit.bottomColor;
      ctx.fillRect(sx - 5, baseY - 10, 4, 9);
      ctx.fillRect(sx + 1, baseY - 10, 4, 9);

      // Torso
      ctx.fillStyle = outfit.topColor;
      ctx.beginPath();
      ctx.roundRect(sx - 8, baseY - 24, 16, 15, 5);
      ctx.fill();

      // Head
      ctx.fillStyle = opts.skinTone;
      ctx.beginPath();
      ctx.arc(sx, baseY - 32, 10, 0, Math.PI * 2);
      ctx.fill();

      // Hair cap
      ctx.fillStyle = opts.hairColor;
      ctx.beginPath();
      ctx.arc(sx, baseY - 34, 10.4, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(sx - 10, baseY - 35, 3.5, 7);
      ctx.fillRect(sx + 6.5, baseY - 35, 3.5, 7);

      // Eyes
      ctx.fillStyle = '#1b1d20';
      ctx.beginPath();
      ctx.arc(sx - 3.3, baseY - 31.5, 1.4, 0, Math.PI * 2);
      ctx.arc(sx + 3.3, baseY - 31.5, 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Helmet if riding outfit
      if (outfit.hatOrProp === 'helm') {
        ctx.fillStyle = '#2a3d45';
        ctx.beginPath();
        ctx.arc(sx, baseY - 34, 11, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e6a632';
        ctx.fillRect(sx - 9, baseY - 35, 18, 2.5);
      }

      // Umbrella if raining
      if (opts.holdingUmbrella) {
        ctx.strokeStyle = '#3b2e26';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + 7, baseY - 18);
        ctx.lineTo(sx + 7, baseY - 46);
        ctx.stroke();
        ctx.fillStyle = '#c75a38';
        ctx.beginPath();
        ctx.arc(sx + 3, baseY - 45, 14, Math.PI, Math.PI * 2);
        ctx.fill();
      }

      // Name pill
      ctx.font = '700 10.5px "Plus Jakarta Sans", sans-serif';
      const tw = ctx.measureText(opts.label).width + 12;
      ctx.fillStyle = opts.isOwner ? 'rgba(29,78,56,0.92)' : 'rgba(255,253,248,0.92)';
      ctx.beginPath();
      ctx.roundRect(sx - tw / 2, baseY - 58, tw, 16, 7);
      ctx.fill();
      ctx.fillStyle = opts.isOwner ? '#fffdf8' : '#1d4e38';
      ctx.textAlign = 'center';
      ctx.fillText(opts.label, sx, baseY - 46.5);

      if (opts.badgeText) {
        ctx.font = '700 9.5px "Plus Jakarta Sans", sans-serif';
        const bw = ctx.measureText(opts.badgeText).width + 10;
        ctx.fillStyle = '#e6a632';
        ctx.beginPath();
        ctx.roundRect(sx - bw / 2, baseY - 74, bw, 14, 6);
        ctx.fill();
        ctx.fillStyle = '#231908';
        ctx.fillText(opts.badgeText, sx, baseY - 64);
      }
    };

    const drawJandaOnMap = (
      ctx: CanvasRenderingContext2D,
      gx: number,
      gy: number,
      t: number,
      anim: string,
      inBox: boolean
    ) => {
      const { sx, sy } = isoToScreen(gx, gy);
      const baseY = sy + TILE_H / 2;

      // Shadow
      ctx.fillStyle = 'rgba(15, 38, 26, 0.25)';
      ctx.beginPath();
      ctx.ellipse(sx, baseY + 2, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (inBox) {
        ctx.fillStyle = '#c99762';
        ctx.strokeStyle = '#82572d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(sx - 12, baseY - 12, 24, 14, 3);
        ctx.fill();
        ctx.stroke();
      }

      // Animated tail
      const wag = Math.sin(t * 0.004) * 4;
      ctx.strokeStyle = '#1b1d22';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx + 7, baseY - 6);
      ctx.quadraticCurveTo(sx + 15, baseY - 14 + wag, sx + 12, baseY - 19);
      ctx.stroke();

      // Tuxedo black body
      ctx.fillStyle = '#1b1d22';
      ctx.beginPath();
      ctx.ellipse(sx, baseY - 7, 9.5, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // White chest bib & white socks
      ctx.fillStyle = '#fffdf8';
      ctx.beginPath();
      ctx.ellipse(sx - 2, baseY - 6, 4.2, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx - 6, baseY - 1, 2.3, 0, Math.PI * 2);
      ctx.arc(sx + 3, baseY - 1, 2.3, 0, Math.PI * 2);
      ctx.fill();

      // Head + ears
      const headOffset = anim === 'sleep' ? 3 : 0;
      ctx.fillStyle = '#1b1d22';
      ctx.beginPath();
      ctx.arc(sx - 4, baseY - 14 + headOffset, 6.5, 0, Math.PI * 2);
      ctx.fill();
      // Ears
      ctx.beginPath();
      ctx.moveTo(sx - 9, baseY - 18 + headOffset);
      ctx.lineTo(sx - 10, baseY - 24 + headOffset);
      ctx.lineTo(sx - 5, baseY - 20 + headOffset);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx + 1, baseY - 18 + headOffset);
      ctx.lineTo(sx + 2, baseY - 24 + headOffset);
      ctx.lineTo(sx - 3, baseY - 20 + headOffset);
      ctx.fill();
      // Golden eyes
      if (anim !== 'sleep') {
        ctx.fillStyle = '#f4c95d';
        ctx.beginPath();
        ctx.arc(sx - 6.5, baseY - 14.5 + headOffset, 1.3, 0, Math.PI * 2);
        ctx.arc(sx - 2, baseY - 14.5 + headOffset, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Label
      ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
      const lbl = '🐾 Janda';
      const w = ctx.measureText(lbl).width + 10;
      ctx.fillStyle = 'rgba(28, 30, 34, 0.9)';
      ctx.beginPath();
      ctx.roundRect(sx - w / 2, baseY - 39, w, 15, 7);
      ctx.fill();
      ctx.fillStyle = '#f8e3a1';
      ctx.textAlign = 'center';
      ctx.fillText(lbl, sx, baseY - 28.5);
    };

    const drawMangoTree = (ctx: CanvasRenderingContext2D, gx: number, gy: number, t: number, reducedMotion: boolean) => {
      const { sx, sy } = isoToScreen(gx, gy);
      const sway = reducedMotion ? 0 : Math.sin(t * 0.0018) * 3;
      // Trunk
      ctx.fillStyle = '#6c4932';
      ctx.beginPath();
      ctx.roundRect(sx - 6, sy - 38, 12, 48, 4);
      ctx.fill();
      // Shadow
      ctx.fillStyle = 'rgba(18, 46, 32, 0.22)';
      ctx.beginPath();
      ctx.ellipse(sx + 4, sy + 16, 36, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      // Canopy blobs
      const blobs = [
        { ox: -18, oy: -48, r: 22, c: '#235e3f' },
        { ox: 18, oy: -46, r: 21, c: '#276a46' },
        { ox: 0, oy: -62, r: 26, c: '#307c52' },
        { ox: -6, oy: -40, r: 19, c: '#398b5c' },
      ];
      for (const b of blobs) {
        ctx.fillStyle = b.c;
        ctx.beginPath();
        ctx.arc(sx + b.ox + sway, sy + b.oy, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // Little warm mangoes
      ctx.fillStyle = '#eba934';
      ctx.beginPath();
      ctx.arc(sx - 10 + sway, sy - 44, 4, 0, Math.PI * 2);
      ctx.arc(sx + 12 + sway, sy - 50, 3.8, 0, Math.PI * 2);
      ctx.arc(sx + 2 + sway, sy - 64, 3.5, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawMotorbike = (ctx: CanvasRenderingContext2D, gx: number, gy: number, color: string) => {
      const { sx, sy } = isoToScreen(gx, gy);
      const y = sy + TILE_H / 2;
      ctx.fillStyle = 'rgba(15,35,25,0.25)';
      ctx.beginPath();
      ctx.ellipse(sx, y + 2, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wheels
      ctx.fillStyle = '#222428';
      ctx.beginPath();
      ctx.arc(sx - 8, y - 2, 4.5, 0, Math.PI * 2);
      ctx.arc(sx + 8, y - 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      // Scooter body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(sx - 10, y - 12, 20, 8, 4);
      ctx.fill();
      // Seat + handlebar
      ctx.fillStyle = '#2e2b29';
      ctx.fillRect(sx - 8, y - 14, 9, 3);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + 6, y - 12);
      ctx.lineTo(sx + 9, y - 19);
      ctx.stroke();
    };

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const st = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) {
        rafId = requestAnimationFrame(render);
        return;
      }

      // Movement logic (WASD/Arrows or Tap Path)
      const speed = 3.8;
      let moving = false;
      const k = keysRef.current;
      let vx = 0;
      let vy = 0;
      // Screen-aligned isometric WASD controls
      if (k['w'] || k['arrowup']) {
        vx -= 1;
        vy -= 1;
      }
      if (k['s'] || k['arrowdown']) {
        vx += 1;
        vy += 1;
      }
      if (k['a'] || k['arrowleft']) {
        vx -= 1;
        vy += 1;
      }
      if (k['d'] || k['arrowright']) {
        vx += 1;
        vy -= 1;
      }

      if (vx !== 0 || vy !== 0) {
        const len = Math.hypot(vx, vy);
        const nx = posRef.current.x + (vx / len) * speed * dt;
        const ny = posRef.current.y + (vy / len) * speed * dt;
        if (isTileWalkable(Math.round(nx), Math.round(ny), posRef.current.floor)) {
          posRef.current.x = nx;
          posRef.current.y = ny;
          moving = true;
        }
      } else if (pathRef.current.length > 0) {
        const wp = pathRef.current[0];
        const dx = wp.x - posRef.current.x;
        const dy = wp.y - posRef.current.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.14) {
          posRef.current.x = wp.x;
          posRef.current.y = wp.y;
          pathRef.current.shift();
        } else {
          posRef.current.x += (dx / dist) * speed * dt;
          posRef.current.y += (dy / dist) * speed * dt;
          moving = true;
        }
      }

      if (moving && now - lastCommitRef.current > 350) {
        lastCommitRef.current = now;
        onOwnerMoveCommit(
          Number(posRef.current.x.toFixed(2)),
          Number(posRef.current.y.toFixed(2)),
          posRef.current.floor
        );
      }

      // Canvas resize for crisp DPR
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafId = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Sky / Background tone by time of day
      const bgColors: Record<GameState['slot'], string> = {
        pagi: '#2c5b43',
        siang: '#2d6348',
        sore: '#4c4636',
        malam: '#162520',
      };
      ctx.fillStyle = bgColors[st.slot];
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Smooth camera follow owner
      const ownerScr = isoToScreen(posRef.current.x, posRef.current.y);
      const targetCamX = rect.width / 2 - ownerScr.sx;
      const targetCamY = rect.height / 2 - ownerScr.sy + 20;
      if (cameraRef.current.x === 0 && cameraRef.current.y === 0) {
        cameraRef.current.x = targetCamX;
        cameraRef.current.y = targetCamY;
      } else {
        cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.1;
        cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.1;
      }

      ctx.save();
      ctx.translate(cameraRef.current.x, cameraRef.current.y);

      const floor = st.activeFloorView;
      const isNight = st.slot === 'malam';
      const isRain = st.weather === 'hujan' || st.weather === 'hujan_deras';

      // 1. Draw Ground Grid
      for (let gx = 0; gx < GRID_W; gx++) {
        for (let gy = 0; gy < GRID_H; gy++) {
          if (floor === 1) {
            let fill = '#6fa16e'; // tropical lawn
            let stroke = 'rgba(29, 78, 56, 0.08)';
            if (gy >= 12) {
              // Main Gang asphalt / conblock alley
              fill = gy === 13 ? '#9a9387' : '#b2a999';
              stroke = 'rgba(40, 35, 30, 0.08)';
            } else if (gx >= 3 && gx <= 11 && gy >= 7 && gy <= 9) {
              // Terrace warm tiles
              fill = '#e6d6bc';
              stroke = 'rgba(130, 95, 60, 0.12)';
            } else if (gx >= 10 && gx <= 12 && gy >= 9 && gy <= 11) {
              // Parking concrete
              fill = st.facilities.parkingOrganized ? '#c9c5bc' : '#beb8ac';
              stroke = st.facilities.parkingOrganized ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.08)';
            } else if (gx >= 3 && gx <= 11 && gy >= 3 && gy <= 6) {
              // Building floor tiles
              fill = '#efe6d5';
              stroke = 'rgba(110, 90, 70, 0.12)';
            }
            drawDiamond(ctx, gx, gy, fill, stroke);
          } else {
            // Upper floor deck (Floor 2 or 3)
            if (gx >= 3 && gx <= 12 && gy >= 3 && gy <= 8) {
              const fill = gy >= 7 ? '#dcc9aa' : '#f2ead9';
              drawDiamond(ctx, gx, gy, fill, 'rgba(29,78,56,0.14)');
            }
          }
        }
      }

      // Tap ripple marker
      if (tapRippleRef.current) {
        const age = (now - tapRippleRef.current.t) / 600;
        if (age < 1) {
          const p = isoToScreen(tapRippleRef.current.x, tapRippleRef.current.y);
          ctx.strokeStyle = `rgba(245, 200, 92, ${1 - age})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(p.sx, p.sy + TILE_H / 2, 10 + age * 18, 5 + age * 9, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 2. Draw Floor-specific buildings & rooms
      const roomsOnFloor = st.rooms.filter((r) => r.floor === floor);
      const wallFade = st.cutawayEnabled || posRef.current.y < 6.4 ? 0.36 : 0.94;

      if (floor === 1) {
        // Fence & Gate Kost Texas
        drawIsoBox(ctx, 2, 11.7, 5, 0.3, 18, '#d9cbb3', '#b8a58c', '#9e8b74');
        drawIsoBox(ctx, 9, 11.7, 3, 0.3, 18, '#d9cbb3', '#b8a58c', '#9e8b74');

        // Signboard KOST TEXAS at Gate
        if (st.facilities.signBoardInstalled) {
          const gp = isoToScreen(7.5, 11.7);
          ctx.fillStyle = '#4c2f1d';
          ctx.fillRect(gp.sx - 34, gp.sy - 40, 68, 20);
          ctx.strokeStyle = '#e6a632';
          ctx.lineWidth = 2;
          ctx.strokeRect(gp.sx - 34, gp.sy - 40, 68, 20);
          ctx.fillStyle = '#fdf3d4';
          ctx.font = '800 9.5px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('KOST TEXAS', gp.sx, gp.sy - 26.5);
        }

        // Bangku Mangga
        drawIsoBox(ctx, 4.4, 10.1, 1.1, 0.5, 9, '#9e683d', '#7c4d29', '#673e20');

        // Movable Terrace Bench
        const benchX =
          st.facilities.benchPosition === 'dekat_gerbang'
            ? 8.5
            : st.facilities.benchPosition === 'tengah'
              ? 7.0
              : 5.5;
        const benchY = st.facilities.benchPosition === 'dekat_gerbang' ? 9.5 : 8.2;
        drawIsoBox(ctx, benchX, benchY, 1.4, 0.55, 10, '#a97142', '#82522b', '#69401f');

        // Package Rack & Waiting Parcel
        if (st.facilities.packageRack || st.packageWaitingForTenantId) {
          drawIsoBox(ctx, 9.2, 7.6, 0.9, 0.6, 18, '#7a5232', '#5b3c23', '#492f1a');
          if (st.packageWaitingForTenantId) {
            drawIsoBox(ctx, 9.3, 7.7, 0.55, 0.45, 11, '#d7a86e', '#b7864d', '#986d3b');
          }
        }

        // Terrace Canopy (translucent terracotta roof)
        if (st.facilities.terraceCanopy) {
          drawIsoBox(ctx, 4.5, 7.2, 5.8, 1.8, 42, 'rgba(199,90,56,0.58)', 'rgba(160,64,36,0.2)', 'rgba(140,54,28,0.2)', 0.55);
        }

        // Router Wi-Fi on corridor wall
        const rp = isoToScreen(6.2, 6.2);
        ctx.fillStyle = st.issues.some((i) => !i.resolved && i.kind === 'wifi_lemah') ? '#d94432' : '#26a96c';
        ctx.beginPath();
        ctx.arc(rp.sx, rp.sy - 14, 5, 0, Math.PI * 2);
        ctx.fill();

        // Owner Room (left wing of Floor 1)
        if (st.ownerRoom.built) {
          drawIsoBox(ctx, 2.2, 4.2, 2.2, 2.2, 40, '#c75a38', '#f2e6d0', '#dfd0b6', wallFade);
          const op = isoToScreen(3.3, 5.3);
          ctx.fillStyle = '#1d4e38';
          ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Ruang Owner', op.sx, op.sy - 46);
        } else if (st.ownerRoom.buildDaysLeft > 0) {
          drawIsoBox(ctx, 2.2, 4.2, 2.2, 2.2, 22, '#d8b46d', '#c4964f', '#ab7e3b', 0.85);
        }

        // Warung Kost Texas
        if (st.warung.unlocked) {
          drawIsoBox(
            ctx,
            12.3,
            9.5,
            2.1,
            2.1,
            34,
            st.warung.level === 2 ? '#b8492a' : '#286447',
            '#f4e7cf',
            '#e0d1b5',
            0.95
          );
          const wp = isoToScreen(13.3, 10.5);
          ctx.fillStyle = '#fffdf8';
          ctx.font = '800 10px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(st.warung.level === 2 ? 'RESTO TEXAS' : 'WARUNG TEXAS', wp.sx, wp.sy - 40);
        }

        // Bengkel Mas Agung across gang
        drawIsoBox(ctx, 11.4, 13.6, 2.2, 1.5, 30, '#445a6b', '#d9d5cc', '#c2beb4', 0.92);
        const bp = isoToScreen(12.5, 14.3);
        ctx.fillStyle = '#fffdf8';
        ctx.font = '700 9.5px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Bengkel Agung', bp.sx, bp.sy - 34);

        // Coffee Cart Bara across gang
        drawIsoBox(ctx, 3.2, 13.8, 1.5, 1.1, 22, '#c75a38', '#f5e7cf', '#dec9a6', 0.95);
        const cp = isoToScreen(3.9, 14.3);
        ctx.fillStyle = '#fffdf8';
        ctx.font = '700 9.5px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('☕ Coffee Bara', cp.sx, cp.sy - 26);

        // Rumah Kontrakan nearby
        drawIsoBox(
          ctx,
          0.6,
          12.4,
          2.0,
          1.6,
          30,
          st.kontrakan.owned ? '#c75a38' : '#7b7f7b',
          '#efe5d2',
          '#d8cbb4',
          0.9
        );
        const kp = isoToScreen(1.6, 13.2);
        ctx.fillStyle = '#fffdf8';
        ctx.font = '700 9.5px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(st.kontrakan.owned ? 'Kontrakan Milikmu' : 'Rumah Kontrakan', kp.sx, kp.sy - 34);

        // Parked Motorbikes in Parkiran
        const bikeColors = ['#c75a38', '#2c6b4f', '#355c7d', '#e6a632'];
        const parkedCount = Math.min(
          st.facilities.parkingSlots,
          st.tenants.filter((t) => t.status === 'menghuni').length +
            st.rental.motors.filter((m) => m.status === 'tersedia').length
        );
        for (let i = 0; i < parkedCount; i++) {
          drawMotorbike(ctx, 10.6 + (i % 2) * 0.9, 9.8 + Math.floor(i / 2) * 0.75, bikeColors[i % bikeColors.length]);
        }
      }

      // Draw Kost Rooms on current floor!
      roomsOnFloor.forEach((room, idx) => {
        const rx = 4.6 + idx * 3.1;
        const ry = 3.2;
        const isProyek = room.status === 'proyek' || room.status === 'renovasi';
        const roofCol = isProyek
          ? '#d3a556'
          : room.tier === 'premium'
            ? '#b64a2b'
            : '#2c6b4f';
        const wallL = room.lightsOn && isNight ? '#f8e6b8' : '#f4ead7';
        const wallR = room.lightsOn && isNight ? '#ead29d' : '#e2d4bc';
        const h = isProyek ? 24 : 46;

        drawIsoBox(ctx, rx, ry, 2.7, 2.4, h, roofCol, wallL, wallR, wallFade);

        // Door + warm glowing window
        const doorPt = isoToScreen(rx + 1.3, ry + 2.4);
        ctx.fillStyle = '#5c3c24';
        ctx.fillRect(doorPt.sx - 7, doorPt.sy - 20, 14, 20);
        // Little slippers outside occupied doors
        if (room.status === 'terisi') {
          ctx.fillStyle = '#c75a38';
          ctx.fillRect(doorPt.sx + 9, doorPt.sy - 2, 4, 2.5);
          ctx.fillRect(doorPt.sx + 14, doorPt.sy - 2, 4, 2.5);
        }
        // Glowing window at night
        if (room.lightsOn && isNight && !st.facilities.powerOutageActive) {
          ctx.fillStyle = 'rgba(255, 224, 130, 0.85)';
          ctx.fillRect(doorPt.sx - 22, doorPt.sy - 26, 11, 10);
          ctx.fillStyle = 'rgba(255, 214, 102, 0.18)';
          ctx.beginPath();
          ctx.arc(doorPt.sx - 16, doorPt.sy - 20, 26, 0, Math.PI * 2);
          ctx.fill();
        }

        // Room label badge floating above roof
        const topPt = isoToScreen(rx + 1.35, ry + 1.2);
        const tag = `Kamar ${room.code} · ${room.status === 'terisi' ? (room.guestStayingName ? '💕 Tamu' : 'Terisi') : room.statusLabel}`;
        ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
        const tw = ctx.measureText(tag).width + 14;
        ctx.fillStyle = room.status === 'kosong' ? 'rgba(29,78,56,0.92)' : 'rgba(255,253,248,0.94)';
        ctx.beginPath();
        ctx.roundRect(topPt.sx - tw / 2, topPt.sy - h - 22, tw, 18, 8);
        ctx.fill();
        ctx.fillStyle = room.status === 'kosong' ? '#fffdf8' : '#1d4e38';
        ctx.textAlign = 'center';
        ctx.fillText(tag, topPt.sx, topPt.sy - h - 9.5);
      });

      // Stairs marker when buildingStage >= 2 or floor 2 project active
      if (st.buildingStage >= 2 || st.projects.some((p) => p.id === 'proj_lantai_2' && p.status === 'berjalan')) {
        drawIsoBox(ctx, 10.6, 5.2, 1.3, 1.5, 28, '#9f7248', '#7d5634', '#694628', 0.92);
        const sp = isoToScreen(11.2, 5.9);
        ctx.fillStyle = '#fffdf8';
        ctx.font = '700 9.5px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Tangga Lt.' + (floor === 1 ? '2' : '1'), sp.sx, sp.sy - 32);
      }

      // Draw Mango Tree on Floor 1
      if (floor === 1) {
        drawMangoTree(ctx, 3.3, 9.6, now, st.settings.reducedMotion);
      }

      // 3. Draw Characters (depth-sorted by x+y)
      const entities: { depth: number; draw: () => void }[] = [];

      // Owner
      if (posRef.current.floor === floor) {
        entities.push({
          depth: posRef.current.x + posRef.current.y,
          draw: () =>
            drawChibiSprite(ctx, posRef.current.x, posRef.current.y, {
              label: st.owner.name,
              hairColor: st.owner.hairColor,
              skinTone: st.owner.skinTone,
              outfitId: st.owner.outfitId,
              isOwner: true,
              holdingUmbrella: isRain,
              bobPhase: moving ? now * 0.014 : 0,
            }),
        });
      }

      // Active Tenants & Visiting Guests on current floor
      st.tenants
        .filter((t) => t.status === 'menghuni' && t.roomId)
        .forEach((tenant, idx) => {
          const room = st.rooms.find((r) => r.id === tenant.roomId);
          if (!room) return;
          const loc = tenant.routine[st.slot];
          let tx = 6.5 + (idx % 3) * 1.4;
          let ty = 8.4;
          let tFloor: 1 | 2 | 3 = 1;

          if (st.facilities.powerOutageActive) {
            tx = 6.2 + idx * 1.1;
            ty = 8.6;
            tFloor = 1;
          } else if (loc === 'kamar') {
            const roomIdx = st.rooms.filter((r) => r.floor === room.floor).findIndex((r) => r.id === room.id);
            tx = 5.8 + Math.max(0, roomIdx) * 3.1;
            ty = 5.8;
            tFloor = room.floor;
          } else if (loc === 'warung' && st.warung.unlocked) {
            tx = 12.8;
            ty = 11.4;
            tFloor = 1;
          } else if (loc === 'parkiran') {
            tx = 10.7;
            ty = 10.6;
            tFloor = 1;
          } else if (loc === 'keluar') {
            // Away at work/campus unless night guest returned
            if (!room.guestStayingName) return;
            tx = 7.8;
            ty = 9.4;
            tFloor = 1;
          }

          if (tFloor === floor) {
            const activeOutfit = isRain
              ? tenant.outfitRain
              : st.slot === 'malam'
                ? tenant.outfitRest
                : tenant.outfitCasual;
            entities.push({
              depth: tx + ty,
              draw: () =>
                drawChibiSprite(ctx, tx, ty, {
                  label: tenant.name,
                  hairColor: tenant.hairColor,
                  skinTone: tenant.skinTone,
                  outfitId: activeOutfit,
                  holdingUmbrella: isRain && loc !== 'kamar',
                  badgeText: room.guestStayingName ? `+ ${room.guestStayingName}` : undefined,
                }),
            });

            // Show overnight partner guest right next to tenant at night!
            if (room.guestStayingName && st.slot === 'malam') {
              entities.push({
                depth: tx + 0.7 + ty + 0.2,
                draw: () =>
                  drawChibiSprite(ctx, tx + 0.75, ty + 0.25, {
                    label: `${room.guestStayingName} (Tamu)`,
                    hairColor: '#3a2b24',
                    skinTone: '#e6b894',
                    outfitId: 'baju_ngopi',
                  }),
              });
            }
          }
        });

      // Tukang Pak Slamet when construction running
      const hasConstruction =
        st.rooms.some((r) => r.status === 'proyek' || r.status === 'renovasi') ||
        st.projects.some((p) => p.status === 'berjalan');
      if (hasConstruction && floor === 1) {
        entities.push({
          depth: 6.5 + 6.9,
          draw: () =>
            drawChibiSprite(ctx, 6.5, 6.9, {
              label: 'Pak Slamet',
              hairColor: '#555',
              skinTone: '#b8835a',
              outfitId: 'kaus_sandal',
              badgeText: '🔨 Proyek',
            }),
        });
      }

      // Adik visiting at gate on Day 10
      if (st.adik.visitingToday && floor === 1) {
        entities.push({
          depth: 8.2 + 12.2,
          draw: () =>
            drawChibiSprite(ctx, 8.2, 12.2, {
              label: `${st.adik.name} (Adik)`,
              hairColor: '#3a2822',
              skinTone: st.owner.skinTone,
              outfitId: 'oversized_cargo',
              badgeText: '👋 Kunjungan',
            }),
        });
      }

      // Dating / Hangout NPCs available on Floor 1
      if (floor === 1) {
        st.relationships.forEach((npc) => {
          if (!npc.availableSlots.includes(st.slot)) return;
          const pt = MAP_SPOTS[npc.spotId];
          if (!pt || pt.floor !== 1) return;
          entities.push({
            depth: pt.x + pt.y,
            draw: () =>
              drawChibiSprite(ctx, pt.x + 0.4, pt.y + 0.2, {
                label: npc.name,
                hairColor: npc.hairColor,
                skinTone: npc.skinTone,
                outfitId: npc.outfitId,
                badgeText: npc.scheduledDateDay === st.day ? '☕ Janji!' : undefined,
              }),
          });
        });

        // Hired employees visibly working
        st.employees.forEach((emp, i) => {
          if (!emp.hired || !emp.workSlots.includes(st.slot)) return;
          const ex = emp.id === 'penjaga_warung' ? 13.0 : emp.id === 'admin_rental' ? 11.4 : 8.2;
          const ey = emp.id === 'penjaga_warung' ? 10.9 : emp.id === 'admin_rental' ? 10.6 : 8.7 + i * 0.2;
          entities.push({
            depth: ex + ey,
            draw: () =>
              drawChibiSprite(ctx, ex, ey, {
                label: emp.name,
                hairColor: emp.hairColor,
                skinTone: emp.skinTone,
                outfitId: emp.outfitId,
              }),
          });
        });
      }

      // Janda the Tuxedo Cat!
      const jPos = getJandaCoords(st.janda.currentSpot);
      if (jPos.floor === floor) {
        entities.push({
          depth: jPos.x + jPos.y,
          draw: () =>
            drawJandaOnMap(
              ctx,
              jPos.x,
              jPos.y,
              now,
              st.janda.animState,
              st.janda.currentSpot === 'kardus_paket'
            ),
        });
      }

      // Sort & render entities
      entities.sort((a, b) => a.depth - b.depth);
      for (const ent of entities) ent.draw();

      // Pinned Mission Beacon arrow
      const pinned = st.missions.find((m) => m.pinned && m.status === 'aktif' && m.targetSpot);
      if (pinned?.targetSpot) {
        const pt = MAP_SPOTS[pinned.targetSpot];
        if (pt && pt.floor === floor) {
          const scr = isoToScreen(pt.x, pt.y);
          const floatY = st.settings.reducedMotion ? 0 : Math.sin(now * 0.006) * 5;
          ctx.fillStyle = '#e6a632';
          ctx.beginPath();
          ctx.moveTo(scr.sx, scr.sy - 48 + floatY);
          ctx.lineTo(scr.sx - 8, scr.sy - 62 + floatY);
          ctx.lineTo(scr.sx + 8, scr.sy - 62 + floatY);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.restore(); // end camera transform

      // 4. Time-of-day atmospheric color wash
      if (st.slot === 'sore') {
        ctx.fillStyle = 'rgba(218, 128, 56, 0.14)';
        ctx.fillRect(0, 0, rect.width, rect.height);
      } else if (st.slot === 'malam') {
        ctx.fillStyle = st.facilities.powerOutageActive
          ? 'rgba(8, 16, 22, 0.56)'
          : 'rgba(13, 28, 36, 0.36)';
        ctx.fillRect(0, 0, rect.width, rect.height);
      }

      // 5. Rain streaks if raining
      if (isRain && !st.settings.reducedMotion) {
        ctx.strokeStyle = 'rgba(206, 232, 245, 0.42)';
        ctx.lineWidth = 1.3;
        const drops = st.weather === 'hujan_deras' ? 65 : 32;
        for (let i = 0; i < drops; i++) {
          const rx = ((i * 97 + now * 0.18) % (rect.width + 80)) - 40;
          const ry = (i * 61 + now * 0.42) % (rect.height + 40);
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 6, ry + 16);
          ctx.stroke();
        }
      }

      ctx.restore();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [onOwnerMoveCommit]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left - cameraRef.current.x;
    const cy = e.clientY - rect.top - cameraRef.current.y;
    const { gx, gy } = screenToIso(cx, cy);
    const floor = stateRef.current.activeFloorView;

    // Check if tapped Janda directly
    const jPos = getJandaCoords(stateRef.current.janda.currentSpot);
    if (jPos.floor === floor && Math.hypot(gx - jPos.x, gy - jPos.y) < 1.15) {
      onSelectJanda();
      return;
    }

    // Check if tapped a notable spot
    for (const [spotId, pt] of Object.entries(MAP_SPOTS) as [MapSpotId, typeof MAP_SPOTS[MapSpotId]][]) {
      if (pt.floor === floor && Math.hypot(gx - pt.x, gy - pt.y) < 1.1) {
        const path = findPath(posRef.current.x, posRef.current.y, pt.x, pt.y, floor);
        pathRef.current = path;
        tapRippleRef.current = { x: pt.x, y: pt.y, t: performance.now() };
        onSelectSpot(spotId);
        return;
      }
    }

    // Otherwise walk to tapped tile!
    const path = findPath(posRef.current.x, posRef.current.y, gx, gy, floor);
    if (path.length > 0) {
      pathRef.current = path;
      tapRippleRef.current = { x: Math.round(gx), y: Math.round(gy), t: performance.now() };
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      aria-label="Peta Isometrik Kost Texas"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        cursor: 'pointer',
        touchAction: 'manipulation',
      }}
    />
  );
};
