import type { FloorNumber } from '../types/game';

export const MAP_COLS = 16;
export const MAP_ROWS = 15;

export interface GridPoint {
  x: number;
  y: number;
}

/**
 * Walkable map layout (16x15):
 * Floor 1:
 *  - y = 1..3: Rooms 101..104 footprints (walkable only via door cells at y=4)
 *  - y = 4..5: Corridor in front of rooms & stairs at (13, 4..5)
 *  - y = 6..9: Yard, Terrace (x=2..7, y=6..8), Mango Tree & Bench (x=4..5, y=8..9), Parking (x=10..13, y=6..9), Owner Room (x=1..2, y=6..8)
 *  - y = 10: Fence & Gate opening at x=7..9
 *  - y = 11..14: Indonesian Alley Road, Coffee Cart (x=2, y=13), Warung (x=5..7, y=13), Bengkel (x=11..12, y=13), Rumah Kontrakan (x=14, y=13)
 * Floor 2 & 3:
 *  - y = 4..5: Upper corridor & balcony (x=2..13), stairs at x=13, y=4..5
 */
export function isTileWalkable(x: number, y: number, floor: FloorNumber): boolean {
  const gx = Math.round(x);
  const gy = Math.round(y);
  if (gx < 1 || gx >= MAP_COLS - 1 || gy < 1 || gy >= MAP_ROWS - 1) return false;

  if (floor === 1) {
    // Fence row y = 10: only gate at x=7,8,9 is walkable
    if (gy === 10) {
      return gx >= 7 && gx <= 9;
    }
    // Room interiors y = 1..3 are private, keep walking along corridor y >= 4
    if (gy <= 3) return false;
    // Mango tree trunk obstacle at (3, 9)
    if (gx === 3 && gy === 9) return false;
    return true;
  }

  // Floor 2 and Floor 3 corridor + balcony + stairs
  if (gy >= 4 && gy <= 6 && gx >= 2 && gx <= 13) return true;
  return false;
}

export function findPath(
  start: GridPoint,
  goal: GridPoint,
  floor: FloorNumber
): GridPoint[] {
  const sx = Math.max(1, Math.min(MAP_COLS - 2, Math.round(start.x)));
  const sy = Math.max(1, Math.min(MAP_ROWS - 2, Math.round(start.y)));
  let gx = Math.max(1, Math.min(MAP_COLS - 2, Math.round(goal.x)));
  let gy = Math.max(1, Math.min(MAP_ROWS - 2, Math.round(goal.y)));

  // If goal tile isn't directly walkable (e.g., clicked a room or tree), snap to nearest walkable neighbor
  if (!isTileWalkable(gx, gy, floor)) {
    const candidates: GridPoint[] = [];
    for (let r = 1; r <= 4; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = gx + dx;
          const ny = gy + dy;
          if (isTileWalkable(nx, ny, floor)) {
            candidates.push({ x: nx, y: ny });
          }
        }
      }
      if (candidates.length > 0) break;
    }
    if (candidates.length === 0) return [];
    candidates.sort(
      (a, b) =>
        Math.hypot(a.x - gx, a.y - gy) - Math.hypot(b.x - gx, b.y - gy)
    );
    gx = candidates[0].x;
    gy = candidates[0].y;
  }

  if (sx === gx && sy === gy) return [{ x: gx, y: gy }];

  const key = (p: GridPoint) => `${p.x},${p.y}`;
  const open: GridPoint[] = [{ x: sx, y: sy }];
  const cameFrom = new Map<string, GridPoint>();
  const gScore = new Map<string, number>([[key({ x: sx, y: sy }), 0]]);
  const fScore = new Map<string, number>([
    [key({ x: sx, y: sy }), Math.abs(gx - sx) + Math.abs(gy - sy)],
  ]);

  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  let safety = 0;
  while (open.length > 0 && safety < 400) {
    safety++;
    open.sort((a, b) => (fScore.get(key(a)) ?? 9999) - (fScore.get(key(b)) ?? 9999));
    const current = open.shift()!;
    if (current.x === gx && current.y === gy) {
      const path: GridPoint[] = [];
      let curr: GridPoint | undefined = current;
      while (curr && !(curr.x === sx && curr.y === sy)) {
        path.unshift(curr);
        curr = cameFrom.get(key(curr));
      }
      return path;
    }

    const currG = gScore.get(key(current)) ?? 9999;
    for (const d of dirs) {
      const nx = current.x + d.x;
      const ny = current.y + d.y;
      if (!isTileWalkable(nx, ny, floor)) continue;
      const nk = `${nx},${ny}`;
      const tentativeG = currG + 1;
      if (tentativeG < (gScore.get(nk) ?? 9999)) {
        cameFrom.set(nk, current);
        gScore.set(nk, tentativeG);
        fScore.set(nk, tentativeG + Math.abs(gx - nx) + Math.abs(gy - ny));
        if (!open.some((p) => p.x === nx && p.y === ny)) {
          open.push({ x: nx, y: ny });
        }
      }
    }
  }

  return [{ x: gx, y: gy }];
}
