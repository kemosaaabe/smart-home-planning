import type { DrawnShape, ShapeGroup, RoomLayoutPersistedState, DrawnRect } from '../types';
import { roomLayoutStoragePrefix } from '../constants';

let shapeIdCounter = 0;
let groupIdCounter = 0;

export function nextId(): string {
  return `shape-${++shapeIdCounter}`;
}

export function nextGroupId(): string {
  return `group-${++groupIdCounter}`;
}

export function getRoomLayoutStorageKey(projectId: number, roomId: number): string {
  return `${roomLayoutStoragePrefix}:${projectId}:${roomId}`;
}

export function loadRoomLayoutState(
  projectId: number,
  roomId: number
): RoomLayoutPersistedState | null {
  try {
    const raw = localStorage.getItem(getRoomLayoutStorageKey(projectId, roomId));
    if (!raw) return null;
    const data = JSON.parse(raw) as RoomLayoutPersistedState;
    if (!Array.isArray(data.shapes) || !Array.isArray(data.groups)) return null;
    return { shapes: data.shapes, groups: data.groups };
  } catch {
    return null;
  }
}

export function saveRoomLayoutState(
  projectId: number,
  roomId: number,
  state: RoomLayoutPersistedState
): void {
  try {
    localStorage.setItem(getRoomLayoutStorageKey(projectId, roomId), JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

/** Парсит строку в hex-цвет #rrggbb или null если невалидно */
export function parseHexColor(input: string): string | null {
  const s = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`;
  if (/^[0-9a-fA-F]{3}$/.test(s))
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  return null;
}

export function getSnapTargets(
  shapes: DrawnShape[],
  excludeId: string
): { x: number[]; y: number[] } {
  const x: number[] = [];
  const y: number[] = [];
  shapes.forEach((s) => {
    if (s.id === excludeId) return;
    if (s.type === 'rect') {
      x.push(s.x, s.x + s.width, s.x + s.width / 2);
      y.push(s.y, s.y + s.height, s.y + s.height / 2);
    } else if (s.points.length >= 4) {
      const [x1, y1, x2, y2] = s.points;
      x.push(x1, x2, (x1 + x2) / 2);
      y.push(y1, y2, (y1 + y2) / 2);
    }
  });
  return { x, y };
}

export function snapToTargets(
  current: number,
  targets: number[],
  threshold: number,
  offsets: number[]
): number {
  let best = current;
  let bestDist = threshold + 1;
  for (const target of targets) {
    for (const offset of offsets) {
      const candidate = target - offset;
      const dist = Math.abs(candidate - current);
      if (dist <= threshold && dist < bestDist) {
        bestDist = dist;
        best = candidate;
      }
    }
  }
  return best;
}

export function initCountersFromLoaded(shapes: DrawnShape[], groups: ShapeGroup[]): void {
  const numFromId = (id: string, prefix: string) => {
    if (!id.startsWith(prefix)) return 0;
    const n = parseInt(id.slice(prefix.length), 10);
    return Number.isFinite(n) ? n : 0;
  };
  shapes.forEach((s) => {
    const n = numFromId(s.id, 'shape-');
    if (n > shapeIdCounter) shapeIdCounter = n;
  });
  groups.forEach((g) => {
    const n = numFromId(g.id, 'group-');
    if (n > groupIdCounter) groupIdCounter = n;
  });
}

/**
 * Пересечение отрезка (x1,y1)-(x2,y2) с кругом (cx,cy,r).
 * Возвращает интервалы t из [0,1], которые соответствуют частям отрезка ВНЕ круга (их оставляем).
 */
export function getSegmentPartsOutsideCircle(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cx: number,
  cy: number,
  r: number
): Array<[number, number]> {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const A = x1 - cx;
  const B = y1 - cy;
  const a = dx * dx + dy * dy;
  if (a < 1e-10) {
    const d2 = A * A + B * B;
    return d2 > r * r ? [[0, 1]] : [];
  }
  const b = 2 * (A * dx + B * dy);
  const c = A * A + B * B - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0) {
    return c > 0 ? [[0, 1]] : [];
  }
  const sqrtDisc = Math.sqrt(disc);
  const t1 = (-b - sqrtDisc) / (2 * a);
  const t2 = (-b + sqrtDisc) / (2 * a);
  const tMin = Math.max(0, Math.min(t1, t2));
  const tMax = Math.min(1, Math.max(t1, t2));
  if (tMin >= tMax) return c > 0 ? [[0, 1]] : [];
  const out: Array<[number, number]> = [];
  if (tMin > 0) out.push([0, tMin]);
  if (tMax < 1) out.push([tMax, 1]);
  return out;
}

/**
 * Стирает часть отрезка (x1,y1)-(x2,y2) кругом (cx,cy,r); добавляет оставшиеся отрезки в result.
 */
export function eraseSegment(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cx: number,
  cy: number,
  r: number,
  color: string,
  result: DrawnShape[]
): void {
  const parts = getSegmentPartsOutsideCircle(x1, y1, x2, y2, cx, cy, r);
  for (const [t0, t1] of parts) {
    const px0 = x1 + t0 * (x2 - x1);
    const py0 = y1 + t0 * (y2 - y1);
    const px1 = x1 + t1 * (x2 - x1);
    const py1 = y1 + t1 * (y2 - y1);
    if (Math.hypot(px1 - px0, py1 - py0) >= 2) {
      result.push({
        type: 'line',
        id: nextId(),
        points: [px0, py0, px1, py1],
        color,
      });
    }
  }
}

/**
 * Применяет ластик в точке (cx, cy): линии и рёбра прямоугольников разбиваются в местах пересечения с кругом.
 */
export function applyEraserToShapes(
  shapes: DrawnShape[],
  cx: number,
  cy: number,
  r: number
): DrawnShape[] {
  const result: DrawnShape[] = [];
  for (const s of shapes) {
    if (s.type === 'rect') {
      const rect = s as DrawnRect;
      if (rect.objectType === 'furniture' || rect.objectType === 'device') {
        result.push(rect);
        continue;
      }
      const { x, y, width, height, color } = rect;
      eraseSegment(x, y, x + width, y, cx, cy, r, color, result);
      eraseSegment(x + width, y, x + width, y + height, cx, cy, r, color, result);
      eraseSegment(x + width, y + height, x, y + height, cx, cy, r, color, result);
      eraseSegment(x, y + height, x, y, cx, cy, r, color, result);
      continue;
    }
    if (s.type === 'line' && s.points.length >= 4) {
      const [x1, y1, x2, y2] = s.points;
      eraseSegment(x1, y1, x2, y2, cx, cy, r, s.color, result);
      continue;
    }
    result.push(s);
  }
  return result;
}

export function cleanupGroupsAfterEraser(
  groups: ShapeGroup[],
  nextShapeIds: Set<string>
): ShapeGroup[] {
  return groups
    .map((g) => ({ ...g, childIds: g.childIds.filter((id) => nextShapeIds.has(id)) }))
    .filter((g) => g.childIds.length >= 2);
}

export function computeGroupBounds(
  shapes: DrawnShape[],
  childIds: string[]
): { x: number; y: number; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const idSet = new Set(childIds);
  shapes.forEach((s) => {
    if (!idSet.has(s.id)) return;
    if (s.type === 'rect') {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.width);
      maxY = Math.max(maxY, s.y + s.height);
    } else if (s.points.length >= 4) {
      const [x1, y1, x2, y2] = s.points;
      minX = Math.min(minX, x1, x2);
      minY = Math.min(minY, y1, y2);
      maxX = Math.max(maxX, x1, x2);
      maxY = Math.max(maxY, y1, y2);
    }
  });
  if (minX === Infinity) return { x: 0, y: 0, width: 100, height: 100 };
  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}
