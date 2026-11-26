import type { PlacedFurniture, Room, TimeSlot } from '../types/game';

export const TILE_W = 64;
export const TILE_H = 32;

export interface Pt {
  x: number;
  y: number;
}

export function iso(gx: number, gy: number, ox: number, oy: number, elevPx = 0): Pt {
  return {
    x: ox + (gx - gy) * (TILE_W / 2),
    y: oy + (gx + gy) * (TILE_H / 2) - elevPx,
  };
}

export function screenToIsoCoords(sx: number, sy: number, ox: number, oy: number): Pt {
  const dx = sx - ox;
  const dy = sy - oy;
  return {
    x: (dx / (TILE_W / 2) + dy / (TILE_H / 2)) / 2,
    y: (dy / (TILE_H / 2) - dx / (TILE_W / 2)) / 2,
  };
}

export function fillPoly(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  fill: string | CanvasGradient,
  stroke?: string,
  lineWidth = 1
) {
  ctx.beginPath();
  pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/**
 * Draw a crisp isometric 3D prism sitting from elevation baseZ to baseZ + hPx.
 */
export function drawPrism(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  gx: number,
  gy: number,
  w: number,
  d: number,
  hPx: number,
  colors: { top: string; left: string; right: string; stroke?: string },
  baseZ = 0,
  alpha = 1
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const t0 = iso(gx, gy, ox, oy, baseZ + hPx);
  const t1 = iso(gx + w, gy, ox, oy, baseZ + hPx);
  const t2 = iso(gx + w, gy + d, ox, oy, baseZ + hPx);
  const t3 = iso(gx, gy + d, ox, oy, baseZ + hPx);

  const b1 = iso(gx + w, gy, ox, oy, baseZ);
  const b2 = iso(gx + w, gy + d, ox, oy, baseZ);
  const b3 = iso(gx, gy + d, ox, oy, baseZ);

  const st = colors.stroke ?? 'rgba(26, 40, 32, 0.16)';
  // SW front-left wall (y = gy + d, x from gx to gx + w)
  fillPoly(ctx, [t3, t2, b2, b3], colors.left, st, 0.8);
  // SE front-right wall (x = gx + w, y from gy to gy + d)
  fillPoly(ctx, [t1, t2, b2, b1], colors.right, st, 0.8);
  // Top face
  fillPoly(ctx, [t0, t1, t2, t3], colors.top, st, 0.8);
  ctx.restore();
}

/**
 * Draw a quad projected strictly onto the SW front wall (constant y = wallY, x from x0..x1, z from z0..z1).
 */
export function drawSWWallQuad(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  wallY: number,
  x0: number,
  x1: number,
  z0: number,
  z1: number,
  fill: string,
  stroke?: string,
  lineWidth = 1
) {
  const p0 = iso(x0, wallY, ox, oy, z1);
  const p1 = iso(x1, wallY, ox, oy, z1);
  const p2 = iso(x1, wallY, ox, oy, z0);
  const p3 = iso(x0, wallY, ox, oy, z0);
  fillPoly(ctx, [p0, p1, p2, p3], fill, stroke, lineWidth);
}

/**
 * Draw a quad projected strictly onto the SE right wall (constant x = wallX, y from y0..y1, z from z0..z1).
 */
export function drawSEWallQuad(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  wallX: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  fill: string,
  stroke?: string,
  lineWidth = 1
) {
  const p0 = iso(wallX, y0, ox, oy, z1);
  const p1 = iso(wallX, y1, ox, oy, z1);
  const p2 = iso(wallX, y1, ox, oy, z0);
  const p3 = iso(wallX, y0, ox, oy, z0);
  fillPoly(ctx, [p0, p1, p2, p3], fill, stroke, lineWidth);
}

/**
 * Draw a realistic pitched Indonesian terracotta clay tile roof (atap limas/pelana) with overhang & tile ribs!
 */
export function drawTerracottaRoof(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  gx: number,
  gy: number,
  w: number,
  d: number,
  eaveZ: number,
  peakH: number,
  palette: { front: string; side: string; ridge: string; trim: string }
) {
  const ov = 0.14;
  const x0 = gx - ov;
  const y0 = gy - ov;
  const x1 = gx + w + ov;
  const y1 = gy + d + ov;
  const midY = (y0 + y1) / 2;

  const rLeft = iso(x0 + 0.35, midY, ox, oy, eaveZ + peakH);
  const rRight = iso(x1 - 0.35, midY, ox, oy, eaveZ + peakH);

  const cNW = iso(x0, y0, ox, oy, eaveZ);
  const cNE = iso(x1, y0, ox, oy, eaveZ);
  const cSE = iso(x1, y1, ox, oy, eaveZ);
  const cSW = iso(x0, y1, ox, oy, eaveZ);

  // Back slope (NW-NE)
  fillPoly(ctx, [cNW, cNE, rRight, rLeft], palette.side, 'rgba(60, 26, 14, 0.25)', 0.9);
  // Left hip
  fillPoly(ctx, [cNW, cSW, rLeft], palette.side, 'rgba(60, 26, 14, 0.28)', 0.9);
  // Right hip (visible SE)
  fillPoly(ctx, [cNE, cSE, rRight], palette.side, 'rgba(60, 26, 14, 0.3)', 1);
  // Front slope (SW-SE — main visible terracotta slope!)
  fillPoly(ctx, [cSW, cSE, rRight, rLeft], palette.front, 'rgba(72, 28, 12, 0.35)', 1);

  // Subtle clay tile horizontal & vertical lines on front slope
  ctx.save();
  ctx.strokeStyle = 'rgba(70, 26, 12, 0.18)';
  ctx.lineWidth = 0.8;
  for (let row = 1; row <= 3; row++) {
    const t = row / 4;
    const lx = cSW.x + (rLeft.x - cSW.x) * t;
    const ly = cSW.y + (rLeft.y - cSW.y) * t;
    const rx = cSE.x + (rRight.x - cSE.x) * t;
    const ry = cSE.y + (rRight.y - cSE.y) * t;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(rx, ry);
    ctx.stroke();
  }
  for (let col = 1; col <= 5; col++) {
    const t = col / 6;
    const bx = cSW.x + (cSE.x - cSW.x) * t;
    const by = cSW.y + (cSE.y - cSW.y) * t;
    const tx = rLeft.x + (rRight.x - rLeft.x) * t;
    const ty = rLeft.y + (rRight.y - rLeft.y) * t;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }

  // Fascia board (listplank krem/kayu) along front eave
  ctx.strokeStyle = palette.trim;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(cSW.x, cSW.y);
  ctx.lineTo(cSE.x, cSE.y);
  ctx.lineTo(cNE.x, cNE.y);
  ctx.stroke();

  // Ridge cap (nok genteng)
  ctx.strokeStyle = palette.ridge;
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(rLeft.x, rLeft.y);
  ctx.lineTo(rRight.x, rRight.y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw crisp isometric interior furniture inside a cutaway room!
 * Maps 5x4 room grid (gx: 0..4, gy: 0..3) accurately onto the room footprint!
 */
export function drawRoomInterior(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  room: Room,
  x0: number,
  y0: number,
  w: number,
  d: number,
  isNight: boolean
) {
  // 1. Interior warm wood-tile floor
  const f0 = iso(x0 + 0.08, y0 + 0.08, ox, oy, 3);
  const f1 = iso(x0 + w - 0.08, y0 + 0.08, ox, oy, 3);
  const f2 = iso(x0 + w - 0.08, y0 + d - 0.08, ox, oy, 3);
  const f3 = iso(x0 + 0.08, y0 + d - 0.08, ox, oy, 3);
  fillPoly(ctx, [f0, f1, f2, f3], isNight && room.lightOn ? '#F5E7C6' : '#EFE2C6', '#C8B594', 1);

  // Subtle floor parquet grid lines
  ctx.save();
  ctx.strokeStyle = 'rgba(130, 96, 62, 0.14)';
  ctx.lineWidth = 0.7;
  for (let i = 1; i <= 4; i++) {
    const a = iso(x0 + (w * i) / 5, y0 + 0.08, ox, oy, 3);
    const b = iso(x0 + (w * i) / 5, y0 + d - 0.08, ox, oy, 3);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  for (let j = 1; j <= 3; j++) {
    const a = iso(x0 + 0.08, y0 + (d * j) / 4, ox, oy, 3);
    const b = iso(x0 + w - 0.08, y0 + (d * j) / 4, ox, oy, 3);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Back walls (NW and NE) standing at cutaway height so interior feels enclosed & architectural!
  const wallH = 30;
  // NW back-left wall (y = y0)
  const nw0 = iso(x0, y0, ox, oy, 3);
  const nw1 = iso(x0 + w, y0, ox, oy, 3);
  const nw2 = iso(x0 + w, y0, ox, oy, 3 + wallH);
  const nw3 = iso(x0, y0, ox, oy, 3 + wallH);
  fillPoly(ctx, [nw0, nw1, nw2, nw3], '#E8DAC0', '#C4B192', 0.9);

  // NE back-right wall (x = x0)
  const ne0 = iso(x0, y0, ox, oy, 3);
  const ne1 = iso(x0, y0 + d, ox, oy, 3);
  const ne2 = iso(x0, y0 + d, ox, oy, 3 + wallH);
  const ne3 = iso(x0, y0, ox, oy, 3 + wallH);
  fillPoly(ctx, [ne0, ne1, ne2, ne3], '#DFCEB0', '#C4B192', 0.9);

  // Private bathroom corner tile for Premium rooms!
  if (room.hasPrivateBath) {
    const bx0 = x0 + w * 0.72;
    const by0 = y0 + d * 0.58;
    const bp0 = iso(bx0, by0, ox, oy, 3.5);
    const bp1 = iso(x0 + w - 0.1, by0, ox, oy, 3.5);
    const bp2 = iso(x0 + w - 0.1, y0 + d - 0.1, ox, oy, 3.5);
    const bp3 = iso(bx0, y0 + d - 0.1, ox, oy, 3.5);
    fillPoly(ctx, [bp0, bp1, bp2, bp3], '#D6E6E2', '#9BBAB2', 0.8);
  }

  // 3. Sort and draw EVERY placed furniture piece accurately inside the 5x4 room grid!
  const cellW = (w - 0.24) / 5;
  const cellD = (d - 0.24) / 4;
  const sortedFurn = [...room.furniture].sort((a, b) => a.gx + a.gy - (b.gx + b.gy));

  for (const item of sortedFurn) {
    drawFurniturePiece(ctx, ox, oy, item, x0 + 0.12, y0 + 0.12, cellW, cellD, isNight && room.lightOn);
  }

  // 4. Low front cutaway wall rim (8px tall) with open doorway gap so the room silhouette stays razor-sharp!
  const rimH = 8;
  // Front SW rim left of door
  drawSWWallQuad(ctx, ox, oy, y0 + d, x0, x0 + w * 0.34, 3, 3 + rimH, '#F3E7D2', '#C5B396', 0.8);
  // Front SW rim right of door
  drawSWWallQuad(ctx, ox, oy, y0 + d, x0 + w * 0.62, x0 + w, 3, 3 + rimH, '#F3E7D2', '#C5B396', 0.8);
  // Right SE rim
  drawSEWallQuad(ctx, ox, oy, x0 + w, y0, y0 + d, 3, 3 + rimH, '#E6D6BA', '#C5B396', 0.8);
}

function drawFurniturePiece(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  item: PlacedFurniture,
  rx: number,
  ry: number,
  cw: number,
  cd: number,
  warmLit: boolean
) {
  const fx = rx + item.gx * cw;
  const fy = ry + item.gy * cd;

  switch (item.type) {
    case 'kasur_standar':
    case 'kasur_queen': {
      const bw = cw * 1.9;
      const bd = item.type === 'kasur_queen' ? cd * 1.75 : cd * 1.05;
      // Wood bed frame
      drawPrism(ctx, ox, oy, fx, fy, bw, bd, 5, { top: '#8C5B38', left: '#75492B', right: '#633C22' }, 3);
      // Crisp white mattress
      drawPrism(ctx, ox, oy, fx + 0.04, fy + 0.04, bw - 0.08, bd - 0.08, 5, { top: '#FAF6EE', left: '#EAE1D0', right: '#DCD1BE' }, 7);
      // Folded duvet blanket (sage green for queen, terracotta for standard)
      const duvetTop = item.type === 'kasur_queen' ? '#366850' : '#C85A32';
      const duvetSide = item.type === 'kasur_queen' ? '#244B3A' : '#A44320';
      drawPrism(
        ctx,
        ox,
        oy,
        fx + bw * 0.34,
        fy + 0.04,
        bw * 0.62,
        bd - 0.08,
        2.5,
        { top: duvetTop, left: duvetSide, right: duvetSide },
        11.5
      );
      // Pillows at headboard
      drawPrism(ctx, ox, oy, fx + 0.08, fy + 0.09, bw * 0.22, bd * 0.38, 3, { top: '#FFFFFF', left: '#E9E2D4', right: '#DDD4C3' }, 12);
      if (item.type === 'kasur_queen') {
        drawPrism(ctx, ox, oy, fx + 0.08, fy + bd * 0.52, bw * 0.22, bd * 0.38, 3, { top: '#FFFFFF', left: '#E9E2D4', right: '#DDD4C3' }, 12);
      }
      break;
    }

    case 'meja_kecil':
    case 'meja_besar': {
      const tw = item.type === 'meja_besar' ? cw * 1.85 : cw * 0.95;
      const td = cd * 0.88;
      // Desk body / legs
      drawPrism(ctx, ox, oy, fx + 0.04, fy + 0.04, tw - 0.08, td - 0.08, 10, { top: '#A87148', left: '#845432', right: '#704426' }, 3);
      // Tabletop
      drawPrism(ctx, ox, oy, fx, fy, tw, td, 2.5, { top: '#C48B5E', left: '#9A663F', right: '#855532' }, 12.5);
      // Laptop on desk!
      drawPrism(ctx, ox, oy, fx + tw * 0.3, fy + td * 0.25, tw * 0.32, td * 0.42, 1.5, { top: '#323B40', left: '#202629', right: '#1B2022' }, 15);
      break;
    }

    case 'lemari': {
      drawPrism(ctx, ox, oy, fx + 0.04, fy + 0.04, cw * 0.92, cd * 0.85, 22, { top: '#9B6842', left: '#7D5030', right: '#663E23' }, 3);
      // Subtle cabinet door handles
      const pH = iso(fx + cw * 0.5, fy + cd * 0.89, ox, oy, 15);
      ctx.fillStyle = '#E9B44C';
      ctx.fillRect(pH.x - 2, pH.y, 1.8, 4);
      ctx.fillRect(pH.x + 1.5, pH.y, 1.8, 4);
      break;
    }

    case 'gorden_biasa':
    case 'tirai_blackout': {
      const col = item.type === 'tirai_blackout' ? '#244B3A' : '#EFE2C6';
      drawPrism(ctx, ox, oy, fx + 0.1, fy + 0.04, cw * 0.8, cd * 0.2, 19, { top: col, left: col, right: '#1B3A2C' }, 8);
      break;
    }

    case 'lampu_hangat': {
      const pL = iso(fx + cw * 0.5, fy + cd * 0.5, ox, oy, 4);
      ctx.fillStyle = '#6E4B2E';
      ctx.fillRect(pL.x - 1.5, pL.y - 12, 3, 12);
      ctx.fillStyle = '#F6CE6B';
      ctx.beginPath();
      ctx.arc(pL.x, pL.y - 13, 4.5, 0, Math.PI * 2);
      ctx.fill();
      if (warmLit) {
        ctx.fillStyle = 'rgba(246, 206, 107, 0.34)';
        ctx.beginPath();
        ctx.arc(pL.x, pL.y - 12, 15, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'tanaman': {
      const pT = iso(fx + cw * 0.5, fy + cd * 0.5, ox, oy, 4);
      // Terracotta pot
      ctx.fillStyle = '#C85A32';
      ctx.beginPath();
      ctx.roundRect(pT.x - 4.5, pT.y - 6, 9, 7, 2);
      ctx.fill();
      // Lush monstera leaves
      ctx.fillStyle = '#2E6F4E';
      ctx.beginPath();
      ctx.arc(pT.x - 4, pT.y - 10, 4, 0, Math.PI * 2);
      ctx.arc(pT.x + 4, pT.y - 10, 4, 0, Math.PI * 2);
      ctx.arc(pT.x, pT.y - 13, 4.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'rak_preloved': {
      drawPrism(ctx, ox, oy, fx + 0.05, fy + 0.05, cw * 0.88, cd * 0.72, 16, { top: '#C48E5E', left: '#9E6B40', right: '#80532F' }, 3);
      break;
    }

    case 'ac': {
      drawPrism(ctx, ox, oy, fx + 0.06, fy + 0.02, cw * 0.88, cd * 0.32, 6, { top: '#F7F8F7', left: '#E6EAE8', right: '#D2D8D5' }, 20);
      break;
    }
  }
}

/**
 * Draw a complete, architecturally crisp Indonesian Kos Room (Exterior or Cutaway)!
 */
export function drawArchitecturalRoom(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  room: Room,
  tenantName: string | null,
  showCutaway: boolean,
  slot: TimeSlot,
  timeSec: number
) {
  const x0 = room.mapX - 0.5;
  const y0 = room.mapY - 0.5;
  const w = 2.65;
  const d = 2.65;
  const isNight = slot === 'malam';

  // Locked empty plot: neat architectural blueprint pad
  if (room.status === 'locked') {
    const p0 = iso(x0, y0, ox, oy);
    const p1 = iso(x0 + w, y0, ox, oy);
    const p2 = iso(x0 + w, y0 + d, ox, oy);
    const p3 = iso(x0, y0 + d, ox, oy);
    fillPoly(ctx, [p0, p1, p2, p3], 'rgba(36, 75, 58, 0.07)', 'rgba(36, 75, 58, 0.24)', 1.2);
    const c = iso(x0 + w / 2, y0 + d / 2, ox, oy, 2);
    ctx.fillStyle = isNight ? '#BFD4C5' : '#355A48';
    ctx.font = '700 10.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Lahan Kamar ${room.id}`, c.x, c.y + 3);
    return;
  }

  // Foundation slab (pondasi beton rapi)
  drawPrism(ctx, ox, oy, x0 - 0.05, y0 - 0.05, w + 0.1, d + 0.1, 4, {
    top: '#D8CEBC',
    left: '#B4A997',
    right: '#9F9483',
  });

  // Constructing state: realistic brick wall + bamboo/wood scaffolding + safety tarp!
  if (room.status === 'constructing') {
    // Half-built red-terracotta brick walls
    drawPrism(ctx, ox, oy, x0, y0, w, d, 26, {
      top: '#C9B396',
      left: '#BA6D4E',
      right: '#A15A3E',
    }, 4);
    // Bamboo scaffolding poles along corners
    ctx.save();
    ctx.strokeStyle = '#C69D57';
    ctx.lineWidth = 2.4;
    [
      [x0 - 0.08, y0 + d + 0.08],
      [x0 + w + 0.08, y0 + d + 0.08],
      [x0 + w + 0.08, y0 - 0.08],
    ].forEach(([px, py]) => {
      const b = iso(px, py, ox, oy, 2);
      const t = iso(px, py, ox, oy, 46);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    });
    // Horizontal scaffold rail
    const sL = iso(x0 - 0.08, y0 + d + 0.08, ox, oy, 26);
    const sM = iso(x0 + w + 0.08, y0 + d + 0.08, ox, oy, 26);
    const sR = iso(x0 + w + 0.08, y0 - 0.08, ox, oy, 26);
    ctx.beginPath();
    ctx.moveTo(sL.x, sL.y);
    ctx.lineTo(sM.x, sM.y);
    ctx.lineTo(sR.x, sR.y);
    ctx.stroke();
    ctx.restore();

    drawStatusPill(ctx, iso(x0 + w / 2, y0 + d / 2, ox, oy, 48), `Proyek ${room.id} (${room.constructionDaysLeft} hr)`, '#244B3A', '#F6CE6B');
    return;
  }

  // CUTAWAY MODE: Show pristine furnished room interior!
  if (showCutaway) {
    drawRoomInterior(ctx, ox, oy, room, x0, y0, w, d, isNight);
    const tag = room.status === 'occupied' ? `${room.id} · ${tenantName ?? 'Terisi'}` : `${room.id} · Siap Sewa`;
    drawStatusPill(
      ctx,
      iso(x0 + w / 2, y0 + 0.2, ox, oy, 42),
      tag,
      room.status === 'occupied' ? '#244B3A' : '#C85A32',
      '#FBF6EC'
    );
    return;
  }

  // FULL EXTERIOR ARCHITECTURAL RENDER
  const wallH = 44;
  // Soft ground ambient shadow along right side
  const sh0 = iso(x0 + w, y0, ox, oy, 0);
  const sh1 = iso(x0 + w + 0.35, y0 + 0.25, ox, oy, 0);
  const sh2 = iso(x0 + w + 0.35, y0 + d + 0.25, ox, oy, 0);
  const sh3 = iso(x0 + w, y0 + d, ox, oy, 0);
  fillPoly(ctx, [sh0, sh1, sh2, sh3], 'rgba(24, 38, 30, 0.14)');

  // Main plaster cream building body
  drawPrism(
    ctx,
    ox,
    oy,
    x0,
    y0,
    w,
    d,
    wallH,
    {
      top: '#EFE2C9',
      left: isNight ? '#CFC3AB' : '#F4E8D2',
      right: isNight ? '#B8AC96' : '#E2D2B6',
      stroke: 'rgba(58, 46, 34, 0.22)',
    },
    4
  );

  // Architectural base plinth trim (lis bawah abu batu alam)
  drawSWWallQuad(ctx, ox, oy, y0 + d, x0, x0 + w, 4, 10, '#A79E90');
  drawSEWallQuad(ctx, ox, oy, x0 + w, y0, y0 + d, 4, 10, '#938A7C');

  // Corner pillar accents (pilar tipis hijau/krem modern tropis)
  drawSWWallQuad(ctx, ox, oy, y0 + d, x0, x0 + 0.12, 4, 4 + wallH, '#DFCEB0');
  drawSWWallQuad(ctx, ox, oy, y0 + d, x0 + w - 0.12, x0 + w, 4, 4 + wallH, '#DFCEB0');

  // === PROJECTED ISOMETRIC DOOR ON SW WALL ===
  const doorX0 = x0 + 0.36;
  const doorX1 = x0 + 1.04;
  // Dark wood door frame (kusen)
  drawSWWallQuad(ctx, ox, oy, y0 + d, doorX0 - 0.05, doorX1 + 0.05, 4, 34, '#563621');
  // Teak door leaf
  drawSWWallQuad(ctx, ox, oy, y0 + d, doorX0, doorX1, 4, 32, '#875534', '#5B3720', 0.8);
  // Subtle door panel inset
  drawSWWallQuad(ctx, ox, oy, y0 + d, doorX0 + 0.12, doorX1 - 0.12, 16, 28, '#7A4C2E');
  // Transom ventilation glass (bovenlicht) above door!
  drawSWWallQuad(
    ctx,
    ox,
    oy,
    y0 + d,
    doorX0,
    doorX1,
    35,
    39.5,
    room.lightOn ? '#FFE084' : isNight ? '#334648' : '#A9C7CB',
    '#563621',
    0.7
  );
  // Brass door knob
  const knob = iso(doorX1 - 0.1, y0 + d, ox, oy, 17);
  ctx.fillStyle = '#E9B44C';
  ctx.beginPath();
  ctx.arc(knob.x, knob.y, 1.7, 0, Math.PI * 2);
  ctx.fill();

  // Room number brass plaque beside door
  const plaque = iso(doorX0 - 0.18, y0 + d, ox, oy, 28);
  ctx.fillStyle = '#244B3A';
  ctx.beginPath();
  ctx.roundRect(plaque.x - 9, plaque.y - 5, 18, 10, 2.5);
  ctx.fill();
  ctx.fillStyle = '#F6CE6B';
  ctx.font = '800 7.5px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(room.id, plaque.x, plaque.y);

  // Welcome mat & neat pair of sandals in front of occupied room!
  const mat0 = iso(doorX0, y0 + d + 0.08, ox, oy, 1);
  const mat1 = iso(doorX1, y0 + d + 0.08, ox, oy, 1);
  const mat2 = iso(doorX1, y0 + d + 0.42, ox, oy, 1);
  const mat3 = iso(doorX0, y0 + d + 0.42, ox, oy, 1);
  fillPoly(ctx, [mat0, mat1, mat2, mat3], '#7A583E', '#573D2A', 0.6);
  if (room.status === 'occupied') {
    const sn = iso(doorX1 + 0.16, y0 + d + 0.26, ox, oy, 1);
    ctx.fillStyle = '#C85A32';
    ctx.beginPath();
    ctx.ellipse(sn.x, sn.y, 3.2, 1.7, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sn.x + 5, sn.y + 2.2, 3.2, 1.7, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // === PROJECTED ISOMETRIC WINDOW ON SW WALL ===
  const winX0 = x0 + 1.42;
  const winX1 = x0 + 2.28;
  // Wood window frame
  drawSWWallQuad(ctx, ox, oy, y0 + d, winX0 - 0.05, winX1 + 0.05, 17, 36, '#5C3B24');
  // Window glass (warm tungsten amber glow when lit at dusk/night!)
  const glassColor = room.lightOn
    ? '#FFD76E'
    : isNight
      ? '#2C4044'
      : '#9CC0C6';
  drawSWWallQuad(ctx, ox, oy, y0 + d, winX0, winX1, 18.5, 34.5, glassColor, '#5C3B24', 0.8);
  // Window center mullion bar
  const mBot = iso((winX0 + winX1) / 2, y0 + d, ox, oy, 18.5);
  const mTop = iso((winX0 + winX1) / 2, y0 + d, ox, oy, 34.5);
  ctx.strokeStyle = '#5C3B24';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(mBot.x, mBot.y);
  ctx.lineTo(mTop.x, mTop.y);
  ctx.stroke();

  // Soft warm night window light halo!
  if (room.lightOn && isNight) {
    const wc = iso((winX0 + winX1) / 2, y0 + d, ox, oy, 26);
    const rad = ctx.createRadialGradient(wc.x, wc.y, 3, wc.x, wc.y, 26 + Math.sin(timeSec * 2) * 1.5);
    rad.addColorStop(0, 'rgba(255, 218, 117, 0.42)');
    rad.addColorStop(1, 'rgba(255, 218, 117, 0)');
    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(wc.x, wc.y, 28, 0, Math.PI * 2);
    ctx.fill();
  }

  // Concrete rain awning ledge (topi-topi jendela tropis) above window!
  drawPrism(ctx, ox, oy, winX0 - 0.08, y0 + d, winX1 - winX0 + 0.16, 0.22, 2.5, {
    top: '#DFCEB0',
    left: '#C7B596',
    right: '#B5A385',
  }, 36);

  // Exterior AC compressor unit if room has AC!
  if (room.furniture.some((f) => f.type === 'ac')) {
    drawPrism(ctx, ox, oy, x0 + w, y0 + 0.8, 0.26, 0.65, 11, {
      top: '#ECEFEE',
      left: '#D6DCDA',
      right: '#C2C9C6',
    }, 24);
  }

  // === REALISTIC PITCHED TERRACOTTA ROOF ===
  const roofPalette =
    room.tier === 'premium'
      ? { front: '#A84223', side: '#8A3319', ridge: '#6E2610', trim: '#F4E8D2' }
      : { front: '#C85A32', side: '#A64624', ridge: '#863519', trim: '#F4E8D2' };
  drawTerracottaRoof(ctx, ox, oy, x0, y0, w, d, 4 + wallH, 20, roofPalette);

  // Clean crisp room status badge above roof
  const labelText =
    room.status === 'occupied'
      ? `${room.id} · ${tenantName ?? 'Terisi'}${room.guestPresent ? ' + Tamu' : ''}`
      : `${room.id} · Kosong`;
  drawStatusPill(
    ctx,
    iso(x0 + w / 2, y0 + d / 2, ox, oy, 4 + wallH + 26),
    labelText,
    room.status === 'occupied' ? 'rgba(29, 60, 46, 0.94)' : 'rgba(200, 90, 50, 0.94)',
    '#FBF6EC'
  );
}

/**
 * Draw a detailed realistic isometric Indonesian Scooter (Beat/Scoopy/Vario style)!
 */
export function drawIsoScooter(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  gx: number,
  gy: number,
  bodyColor: string
) {
  const p = iso(gx, gy, ox, oy, 0);
  ctx.save();
  ctx.translate(p.x, p.y);

  // Soft ground shadow
  ctx.fillStyle = 'rgba(20, 32, 26, 0.26)';
  ctx.beginPath();
  ctx.ellipse(0, 3, 15, 6.5, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Rear & Front Tires
  ctx.fillStyle = '#1E2221';
  ctx.beginPath();
  ctx.arc(-8, 1, 4.5, 0, Math.PI * 2);
  ctx.arc(8.5, -2.5, 4.3, 0, Math.PI * 2);
  ctx.fill();
  // Alloy rims
  ctx.fillStyle = '#B8C0BC';
  ctx.beginPath();
  ctx.arc(-8, 1, 1.8, 0, Math.PI * 2);
  ctx.arc(8.5, -2.5, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Scooter main body fairing
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(-12, -3);
  ctx.quadraticCurveTo(-5, -10, 2, -6);
  ctx.lineTo(10, -13);
  ctx.lineTo(12, -5);
  ctx.lineTo(4, -1);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(24, 34, 28, 0.3)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Black padded seat
  ctx.fillStyle = '#2A2F2D';
  ctx.beginPath();
  ctx.roundRect(-11, -11, 12, 4.2, 2);
  ctx.fill();

  // Handlebar & Headlight
  ctx.strokeStyle = '#333A37';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(5, -16);
  ctx.lineTo(11, -14);
  ctx.stroke();
  ctx.fillStyle = '#FFF5C2';
  ctx.beginPath();
  ctx.arc(11.5, -11.5, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw a crisp pill label on canvas.
 */
export function drawStatusPill(
  ctx: CanvasRenderingContext2D,
  pos: Pt,
  text: string,
  bg: string,
  fg: string
) {
  ctx.save();
  ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
  const tw = ctx.measureText(text).width + 14;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(pos.x - tw / 2, pos.y - 9, tw, 18, 9);
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 246, 236, 0.24)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, pos.x, pos.y);
  ctx.restore();
}
