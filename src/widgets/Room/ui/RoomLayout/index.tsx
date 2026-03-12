import {
  type FC,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
  useEffect,
} from 'react';
import { Square, Minus, MousePointer2, Magnet, Palette, Maximize2, Minimize2 } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { Stage, Layer, Rect, Line, Transformer } from 'react-konva';
import type Konva from 'konva';
import styles from './styles.module.scss';

export type DrawingTool = 'cursor' | 'rectangle' | 'line';

export interface DrawnRect {
  type: 'rect';
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface DrawnLine {
  type: 'line';
  id: string;
  points: number[];
  color: string;
}

export type DrawnShape = DrawnRect | DrawnLine;

export interface RoomLayoutProps {
  projectId?: number;
}

const DEFAULT_COLOR = '#3b82f6';
const MAX_UNDO_HISTORY = 50;
const SNAP_THRESHOLD = 12;
const LINE_HIT_PADDING = 36;
const ARROW_STEP = 1;
const ARROW_STEP_SHIFT = 10;

/** Фиксированный размер холста в «логических» пикселях — пропорции сохраняются при масштабировании */
const STAGE_WIDTH = 1200;
const STAGE_HEIGHT = 800;

function getSnapTargets(shapes: DrawnShape[], excludeId: string): { x: number[]; y: number[] } {
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

function snapToTargets(
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

let shapeIdCounter = 0;
let groupIdCounter = 0;
const nextId = () => `shape-${++shapeIdCounter}`;
const nextGroupId = () => `group-${++groupIdCounter}`;

export interface ShapeGroup {
  id: string;
  childIds: string[];
}

function computeGroupBounds(shapes: DrawnShape[], childIds: string[]): { x: number; y: number; width: number; height: number } {
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

export const RoomLayout: FC<RoomLayoutProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 500 });
  const [themeColors, setThemeColors] = useState({
    selection: '#2854C5',
    anchorFill: '#ffffff',
    anchorStroke: '#2854C5',
  });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const { clientWidth, clientHeight } = el;
      if (clientWidth > 0 && clientHeight > 0) {
        setContainerSize((prev) =>
          prev.width === clientWidth && prev.height === clientHeight
            ? prev
            : { width: clientWidth, height: clientHeight }
        );
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scaleX = containerSize.width / STAGE_WIDTH;
  const scaleY = containerSize.height / STAGE_HEIGHT;

  useLayoutEffect(() => {
    const root = document.documentElement;
    const s = getComputedStyle(root);
    const primary = s.getPropertyValue('--primary').trim() || '#2854C5';
    const background = s.getPropertyValue('--background').trim() || '#ffffff';
    setThemeColors({
      selection: primary,
      anchorFill: background,
      anchorStroke: primary,
    });
  }, []);

  const [tool, setTool] = useState<DrawingTool>('cursor');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawColor, setDrawColor] = useState(DEFAULT_COLOR);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const [shapes, setShapes] = useState<DrawnShape[]>([]);
  const [groups, setGroups] = useState<ShapeGroup[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [draft, setDraft] = useState<DrawnRect | DrawnLine | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const nodeRefsMap = useRef<Map<string, Konva.Rect>>(new Map());
  const transformerRef = useRef<Konva.Transformer>(null);
  const groupBoundsRef = useRef<Konva.Rect>(null);
  const didMarqueeRef = useRef(false);
  const historyRef = useRef<DrawnShape[][]>([]);
  const shapesRef = useRef<DrawnShape[]>(shapes);

  useLayoutEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  // Синхронизируем цвет палитры с выбранной фигурой только при смене выделения,
  // не при каждом изменении shapes (иначе краш при перетаскивании якорей линии).
  useLayoutEffect(() => {
    if (selectedIds.length === 1) {
      const shape = shapesRef.current.find((s) => s.id === selectedIds[0]);
      if (shape && 'color' in shape) setDrawColor(shape.color);
    }
  }, [selectedIds]);

  useEffect(() => {
    if (!colorPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(e.target as Node)
      ) {
        setColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [colorPickerOpen]);

  const pushToHistory = useCallback((current: DrawnShape[]) => {
    const snapshot: DrawnShape[] = current.map((s) =>
      s.type === 'rect' ? { ...s } : { ...s, points: [...s.points] }
    );
    historyRef.current.push(snapshot);
    if (historyRef.current.length > MAX_UNDO_HISTORY) {
      historyRef.current.shift();
    }
  }, []);

  // Сбрасываем выделение при начале рисования; курсор — рамка выделения
  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target !== e.target.getStage()) return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const x = pos.x;
      const y = pos.y;

      if (tool === 'cursor') {
        setSelectedIds([]);
        startRef.current = { x, y };
        setSelectionBox({ x, y, width: 0, height: 0 });
        return;
      }

      setSelectedIds([]);
      startRef.current = { x, y };
      if (tool === 'rectangle') {
        setDraft({
          type: 'rect',
          id: nextId(),
          x,
          y,
          width: 0,
          height: 0,
          color: drawColor,
        });
      } else {
        setDraft({
          type: 'line',
          id: nextId(),
          points: [x, y, x, y],
          color: drawColor,
        });
      }
    },
    [tool, drawColor]
  );

  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const { x: sx, y: sy } = startRef.current ?? { x: pos.x, y: pos.y };

      if (selectionBox !== null) {
        const w = pos.x - sx;
        const h = pos.y - sy;
        setSelectionBox({
          x: w >= 0 ? sx : pos.x,
          y: h >= 0 ? sy : pos.y,
          width: Math.abs(w),
          height: Math.abs(h),
        });
        return;
      }

      if (!startRef.current || !draft) return;
      const shiftKey = e.evt.shiftKey;
      let x = pos.x;
      let y = pos.y;

      if (draft.type === 'rect') {
        let w = x - sx;
        let h = y - sy;
        if (shiftKey) {
          const side = Math.max(Math.abs(w), Math.abs(h));
          const signW = Math.sign(w) || Math.sign(h) || 1;
          const signH = Math.sign(h) || Math.sign(w) || 1;
          w = side * signW;
          h = side * signH;
        }
        setDraft({
          ...draft,
          x: w >= 0 ? sx : sx + w,
          y: h >= 0 ? sy : sy + h,
          width: Math.abs(w),
          height: Math.abs(h),
        });
      } else {
        if (shiftKey) {
          const dx = Math.abs(x - sx);
          const dy = Math.abs(y - sy);
          if (dx >= dy) {
            y = sy;
          } else {
            x = sx;
          }
        }
        setDraft({ ...draft, points: [sx, sy, x, y] });
      }
    },
    [draft, selectionBox]
  );

  const handleStageMouseUp = useCallback(() => {
    if (selectionBox !== null) {
      const { x: rx, y: ry, width: rw, height: rh } = selectionBox;
      const ids: string[] = [];
      shapes.forEach((s) => {
        if (s.type === 'rect') {
          const overlap =
            !(s.x + s.width < rx || rx + rw < s.x || s.y + s.height < ry || ry + rh < s.y);
          if (overlap) ids.push(s.id);
        } else {
          const [x1, y1, x2, y2] = s.points;
          const minX = Math.min(x1, x2);
          const maxX = Math.max(x1, x2);
          const minY = Math.min(y1, y2);
          const maxY = Math.max(y1, y2);
          const overlap =
            !(maxX < rx || rx + rw < minX || maxY < ry || ry + rh < minY);
          if (overlap) ids.push(s.id);
        }
      });
      setSelectedIds(ids);
      setSelectionBox(null);
      startRef.current = null;
      didMarqueeRef.current = true;
      return;
    }

    if (!draft) return;
    if (draft.type === 'rect' && (draft.width < 2 || draft.height < 2)) {
      setDraft(null);
      startRef.current = null;
      return;
    }
    if (draft.type === 'line') {
      const [x1, y1, x2, y2] = draft.points;
      if (Math.hypot(x2 - x1, y2 - y1) < 4) {
        setDraft(null);
        startRef.current = null;
        return;
      }
    }
    setShapes((prev) => {
      pushToHistory(prev);
      return [...prev, draft];
    });
    setDraft(null);
    startRef.current = null;
  }, [draft, pushToHistory, selectionBox, shapes]);

  const selectedGroupId =
    (selectedIds.length >= 2 &&
      groups.find(
        (g) =>
          g.childIds.length === selectedIds.length &&
          g.childIds.every((cid) => selectedIds.includes(cid))
      )?.id) ?? null;

  const getGroupContaining = useCallback(
    (shapeId: string): ShapeGroup | null =>
      groups.find((g) => g.childIds.includes(shapeId)) ?? null,
    [groups]
  );

  const handleShapeClick = useCallback(
    (e: Konva.KonvaEventObject<Event>, id: string) => {
      e.cancelBubble = true;
      const group = getGroupContaining(id);
      if (group) {
        setSelectedIds([...group.childIds]);
      } else {
        setSelectedIds([id]);
      }
    },
    [getGroupContaining]
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target !== e.target.getStage()) return;
      if (didMarqueeRef.current) {
        didMarqueeRef.current = false;
        return;
      }
      setSelectedIds([]);
    },
    []
  );

  // Удаление по Backspace, отмена по Ctrl+Z, перемещение стрелками
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        if (selectedIds.length === 0) return;
        e.preventDefault();
        const idsSet = new Set(selectedIds);
        pushToHistory(shapesRef.current);
        setShapes((prev) => prev.filter((s) => !idsSet.has(s.id)));
        setSelectedIds([]);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (historyRef.current.length === 0) return;
        const prev = historyRef.current.pop();
        if (prev) {
          setShapes(prev);
          setSelectedIds([]);
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          if (selectedGroupId) {
            setGroups((prev) => prev.filter((g) => g.id !== selectedGroupId));
            setSelectedIds([]);
          }
        } else if (selectedIds.length >= 2) {
          pushToHistory(shapesRef.current);
          setGroups((prev) => [
            ...prev,
            { id: nextGroupId(), childIds: [...selectedIds] },
          ]);
        }
        return;
      }
      const idsSet = new Set(selectedIds);
      if (idsSet.size === 0) return;
      const step = e.shiftKey ? ARROW_STEP_SHIFT : ARROW_STEP;
      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else return;
      e.preventDefault();
      pushToHistory(shapesRef.current);
      setShapes((prev) =>
        prev.map((s) => {
          if (!idsSet.has(s.id)) return s;
          if (s.type === 'rect') {
            return { ...s, x: s.x + dx, y: s.y + dy };
          }
          return {
            ...s,
            points: s.points.map((p, i) => (i % 2 === 0 ? p + dx : p + dy)),
          };
        })
      );
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, selectedGroupId, pushToHistory]);

  // Привязка Transformer к выбранным прямоугольникам или к группе
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    if (selectedGroupId && groupBoundsRef.current) {
      tr.nodes([groupBoundsRef.current]);
    } else {
      const rectIds = selectedIds.filter((id) => {
        const s = shapes.find((sh) => sh.id === id);
        return s?.type === 'rect';
      });
      const nodes = rectIds
        .map((id) => nodeRefsMap.current.get(id))
        .filter((n): n is Konva.Rect => n != null);
      tr.nodes(nodes);
    }
    tr.getLayer()?.batchDraw();
  }, [selectedIds, shapes, selectedGroupId]);


  const handleRectDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, id: string, width: number, height: number) => {
      if (!snapEnabled) return;
      const node = e.target;
      const targets = getSnapTargets(shapesRef.current, id);
      const newX = snapToTargets(node.x(), targets.x, SNAP_THRESHOLD, [0, width, width / 2]);
      const newY = snapToTargets(node.y(), targets.y, SNAP_THRESHOLD, [0, height, height / 2]);
      node.position({ x: newX, y: newY });
    },
    [snapEnabled]
  );

  const handleRectDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
      const node = e.target;
      setShapes((prev) => {
        pushToHistory(prev);
        return prev.map((s) =>
          s.id === id && s.type === 'rect'
            ? { ...s, x: node.x(), y: node.y() }
            : s
        );
      });
    },
    [pushToHistory]
  );

  const handleLineDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, id: string, points: number[]) => {
      if (!snapEnabled || points.length < 4) return;
      const node = e.target as Konva.Line;
      const dx = node.x();
      const dy = node.y();
      const targets = getSnapTargets(shapesRef.current, id);
      const [x1, y1, x2, y2] = points;
      const curX1 = x1 + dx;
      const curY1 = y1 + dy;
      const curX2 = x2 + dx;
      const curY2 = y2 + dy;
      const snapX1 = snapToTargets(curX1, targets.x, SNAP_THRESHOLD, [0]);
      const snapX2 = snapToTargets(curX2, targets.x, SNAP_THRESHOLD, [0]);
      const snapY1 = snapToTargets(curY1, targets.y, SNAP_THRESHOLD, [0]);
      const snapY2 = snapToTargets(curY2, targets.y, SNAP_THRESHOLD, [0]);
      const dx1 = snapX1 - x1;
      const dx2 = snapX2 - x2;
      const dy1 = snapY1 - y1;
      const dy2 = snapY2 - y2;
      const newDx = Math.abs(dx1 - dx) <= Math.abs(dx2 - dx) ? dx1 : dx2;
      const newDy = Math.abs(dy1 - dy) <= Math.abs(dy2 - dy) ? dy1 : dy2;
      node.position({ x: newDx, y: newDy });
    },
    [snapEnabled]
  );

  const handleLineDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
      const node = e.target as Konva.Line;
      const dx = node.x();
      const dy = node.y();
      setShapes((prev) => {
        pushToHistory(prev);
        return prev.map((s) => {
          if (s.id !== id || s.type !== 'line') return s;
          return {
            ...s,
            points: s.points.map((p, i) => (i % 2 === 0 ? p + dx : p + dy)),
          };
        });
      });
      node.position({ x: 0, y: 0 });
    },
    [pushToHistory]
  );

  const handleTransformEnd = useCallback(
    (_e: Konva.KonvaEventObject<Event>) => {
      const transformer = transformerRef.current;
      if (!transformer) return;
      const nodes = transformer.nodes();
      if (nodes.length === 0) return;

      if (selectedGroupId && groupBoundsRef.current && nodes[0] === groupBoundsRef.current) {
        const group = groups.find((g) => g.id === selectedGroupId);
        if (!group) return;
        const node = groupBoundsRef.current;
        const oldBounds = computeGroupBounds(shapesRef.current, group.childIds);
        const newWidth = node.width() * node.scaleX();
        const newHeight = node.height() * node.scaleY();
        const scaleX = newWidth / oldBounds.width;
        const scaleY = newHeight / oldBounds.height;
        node.scaleX(1);
        node.scaleY(1);
        node.width(newWidth);
        node.height(newHeight);
        node.x(node.x());
        node.y(node.y());
        setShapes((prev) => {
          pushToHistory(prev);
          const idSet = new Set(group.childIds);
          return prev.map((s) => {
            if (!idSet.has(s.id)) return s;
            if (s.type === 'rect') {
              return {
                ...s,
                x: oldBounds.x + (s.x - oldBounds.x) * scaleX,
                y: oldBounds.y + (s.y - oldBounds.y) * scaleY,
                width: Math.max(5, s.width * scaleX),
                height: Math.max(5, s.height * scaleY),
              };
            }
            return {
              ...s,
              points: s.points.map((p, i) =>
                i % 2 === 0
                  ? oldBounds.x + (p - oldBounds.x) * scaleX
                  : oldBounds.y + (p - oldBounds.y) * scaleY
              ),
            };
          });
        });
        return;
      }

      setShapes((prev) => {
        pushToHistory(prev);
        return prev.map((s) => {
          if (s.type !== 'rect') return s;
          const node = nodes.find((n) => n.name() === s.id);
          if (!node) return s;
          const rect = node as Konva.Rect;
          const scaleX = rect.scaleX();
          const scaleY = rect.scaleY();
          rect.scaleX(1);
          rect.scaleY(1);
          return {
            ...s,
            x: rect.x(),
            y: rect.y(),
            width: Math.max(5, rect.width() * scaleX),
            height: Math.max(5, rect.height() * scaleY),
          };
        });
      });
    },
    [pushToHistory, selectedGroupId, groups]
  );

  const handleLineAnchorDrag = useCallback(
    (
      lineId: string,
      anchor: 'left' | 'right',
      x: number,
      y: number,
      shiftKey?: boolean
    ) => {
      setShapes((prev) =>
        prev.map((s) => {
          if (s.id !== lineId || s.type !== 'line' || s.points.length < 4) return s;
          const [x1, y1, x2, y2] = s.points;
          let px = x;
          let py = y;
          if (shiftKey) {
            const otherX = anchor === 'left' ? x2 : x1;
            const otherY = anchor === 'left' ? y2 : y1;
            if (Math.abs(x - otherX) >= Math.abs(y - otherY)) {
              py = otherY;
            } else {
              px = otherX;
            }
          }
          const newPoints = anchor === 'left' ? [px, py, x2, y2] : [x1, y1, px, py];
          return { ...s, points: newPoints };
        })
      );
    },
    []
  );

  const handleLineAnchorDragStart = useCallback(() => {
    pushToHistory(shapesRef.current);
  }, [pushToHistory]);

  const handleGroupBoundsDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!selectedGroupId) return;
      const group = groups.find((g) => g.id === selectedGroupId);
      if (!group) return;
      const node = e.target;
      const bounds = computeGroupBounds(shapesRef.current, group.childIds);
      const dx = node.x() - bounds.x;
      const dy = node.y() - bounds.y;
      setShapes((prev) => {
        pushToHistory(prev);
        const idSet = new Set(group.childIds);
        return prev.map((s) => {
          if (!idSet.has(s.id)) return s;
          if (s.type === 'rect') {
            return { ...s, x: s.x + dx, y: s.y + dy };
          }
          return {
            ...s,
            points: s.points.map((p, i) => (i % 2 === 0 ? p + dx : p + dy)),
          };
        });
      });
      node.position({ x: bounds.x + dx, y: bounds.y + dy });
    },
    [selectedGroupId, groups, pushToHistory]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <div
      className={styles.wrapper}
      data-fullscreen={isFullscreen}
      aria-label="Область проектирования"
    >
      <div ref={containerRef} className={styles.canvasWrap}>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.toolBtn}
            data-active={tool === 'cursor'}
            onClick={() => setTool('cursor')}
            aria-label="Курсор — выделение"
            aria-pressed={tool === 'cursor'}
          >
            <MousePointer2 size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            data-active={snapEnabled}
            onClick={() => setSnapEnabled((v) => !v)}
            aria-label={snapEnabled ? 'Привязка включена' : 'Привязка выключена'}
            aria-pressed={snapEnabled}
            title={snapEnabled ? 'Привязка к объектам включена' : 'Включить привязку'}
          >
            <Magnet size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            data-active={tool === 'rectangle'}
            onClick={() => setTool('rectangle')}
            aria-label="Прямоугольник"
            aria-pressed={tool === 'rectangle'}
          >
            <Square size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            data-active={tool === 'line'}
            onClick={() => setTool('line')}
            aria-label="Линия"
            aria-pressed={tool === 'line'}
          >
            <Minus size={20} strokeWidth={2} />
          </button>
          <div className={styles.colorPickerWrap} ref={colorPickerRef}>
            <button
              type="button"
              className={styles.colorBtn}
              onClick={() => setColorPickerOpen((v) => !v)}
              aria-label="Цвет рисования"
              aria-expanded={colorPickerOpen}
              aria-haspopup="dialog"
            >
              <Palette size={20} strokeWidth={2} />
            </button>
            {colorPickerOpen && (
              <div className={styles.colorPickerPopover} role="dialog" aria-label="Выбор цвета">
                <div className={styles.colorPickerPopoverHeader}>Цвет</div>
                <HexColorPicker
                  color={drawColor}
                  onChange={(color) => {
                    setDrawColor(color);
                    if (selectedIds.length > 0) {
                      pushToHistory(shapesRef.current);
                      setShapes((prev) =>
                        prev.map((s) =>
                          selectedIds.includes(s.id) ? { ...s, color } : s
                        )
                      );
                    }
                  }}
                  className={styles.colorPickerReactColorful}
                />
                <div className={styles.colorPickerHex}>{drawColor}</div>
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => setIsFullscreen((v) => !v)}
            aria-label={isFullscreen ? 'Выйти из полноэкранного режима' : 'На весь экран'}
            title={isFullscreen ? 'Выйти из полноэкранного режима (Esc)' : 'На весь экран'}
          >
            {isFullscreen ? (
              <Minimize2 size={20} strokeWidth={2} />
            ) : (
              <Maximize2 size={20} strokeWidth={2} />
            )}
          </button>
        </div>
        <div className={styles.stageScaleWrap}>
          <div
            className={styles.stageScaleInner}
            style={{
              width: STAGE_WIDTH,
              height: STAGE_HEIGHT,
              transform: `scale(${scaleX}, ${scaleY})`,
            }}
          >
            <Stage
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
              onMouseDown={handleStageMouseDown}
              onMouseMove={handleStageMouseMove}
              onMouseUp={handleStageMouseUp}
              onMouseLeave={handleStageMouseUp}
              onClick={handleStageClick}
              className={styles.stage}
            >
          <Layer>
            {/* Нарисованные объекты */}
            {shapes.map((shape) => {
              if (shape.type === 'rect') {
                const isSelected = selectedIds.includes(shape.id);
                return (
                  <Rect
                    key={shape.id}
                    name={shape.id}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    fill={undefined}
                    stroke={isSelected ? themeColors.selection : shape.color}
                    strokeWidth={4}
                    dash={isSelected ? [8, 4] : undefined}
                    draggable={isSelected}
                    ref={(node) => {
                      if (node) nodeRefsMap.current.set(shape.id, node);
                      else nodeRefsMap.current.delete(shape.id);
                    }}
                    onClick={(e) => handleShapeClick(e, shape.id)}
                    onTap={(e) => handleShapeClick(e, shape.id)}
                    onDragMove={(e) => handleRectDragMove(e, shape.id, shape.width, shape.height)}
                    onDragEnd={(e) => handleRectDragEnd(e, shape.id)}
                  />
                );
              }
              const isSelected = selectedIds.includes(shape.id);
              return (
                <Line
                  key={shape.id}
                  x={0}
                  y={0}
                  points={shape.points}
                  stroke={isSelected ? themeColors.selection : shape.color}
                  strokeWidth={4}
                  hitStrokeWidth={LINE_HIT_PADDING}
                  dash={isSelected ? [8, 4] : undefined}
                  lineCap="round"
                  lineJoin="round"
                  draggable={isSelected}
                  onClick={(e) => { e.cancelBubble = true; handleShapeClick(e, shape.id); }}
                  onTap={(e) => { e.cancelBubble = true; handleShapeClick(e, shape.id); }}
                  onDragMove={(e) => handleLineDragMove(e, shape.id, shape.points)}
                  onDragEnd={(e) => handleLineDragEnd(e, shape.id)}
                />
              );
            })}
            {/* Рамка группы для трансформа (при выделенной группе) */}
            {selectedGroupId &&
              (() => {
                const group = groups.find((g) => g.id === selectedGroupId);
                if (!group) return null;
                const bounds = computeGroupBounds(shapes, group.childIds);
                return (
                  <Rect
                    ref={groupBoundsRef}
                    key={selectedGroupId}
                    x={bounds.x}
                    y={bounds.y}
                    width={bounds.width}
                    height={bounds.height}
                    fill="transparent"
                    stroke={themeColors.selection}
                    strokeWidth={2}
                    dash={[8, 4]}
                    draggable
                    onDragEnd={handleGroupBoundsDragEnd}
                  />
                );
              })()}
            {/* Якоря для выбранной линии (только при единственной выбранной линии, не в группе) */}
            {selectedIds.length === 1 && !selectedGroupId &&
              (() => {
                const lineShape = shapes.find(
                  (s) => s.id === selectedIds[0] && s.type === 'line'
                ) as DrawnLine | undefined;
                if (!lineShape || lineShape.points.length < 4) return null;
                const [x1, y1, x2, y2] = lineShape.points;
                const anchorSize = 10;
                const anchorHalf = anchorSize / 2;
                return (
                  <>
                    <Rect
                      key={`line-${lineShape.id}-left`}
                      x={x1 - anchorHalf}
                      y={y1 - anchorHalf}
                      width={anchorSize}
                      height={anchorSize}
                      fill={themeColors.anchorFill}
                      stroke={themeColors.anchorStroke}
                      strokeWidth={2}
                      draggable
                      onDragStart={handleLineAnchorDragStart}
                      onDragMove={(e) => {
                        const pos = e.target.position();
                        handleLineAnchorDrag(
                          lineShape.id,
                          'left',
                          pos.x + anchorHalf,
                          pos.y + anchorHalf,
                          e.evt.shiftKey
                        );
                      }}
                      onDragEnd={(e) => {
                        const pos = e.target.position();
                        handleLineAnchorDrag(
                          lineShape.id,
                          'left',
                          pos.x + anchorHalf,
                          pos.y + anchorHalf,
                          e.evt.shiftKey
                        );
                      }}
                      onClick={(e) => { e.cancelBubble = true; }}
                      onTap={(e) => { e.cancelBubble = true; }}
                    />
                    <Rect
                      key={`line-${lineShape.id}-right`}
                      x={x2 - anchorHalf}
                      y={y2 - anchorHalf}
                      width={anchorSize}
                      height={anchorSize}
                      fill={themeColors.anchorFill}
                      stroke={themeColors.anchorStroke}
                      strokeWidth={2}
                      draggable
                      onDragStart={handleLineAnchorDragStart}
                      onDragMove={(e) => {
                        const pos = e.target.position();
                        handleLineAnchorDrag(
                          lineShape.id,
                          'right',
                          pos.x + anchorHalf,
                          pos.y + anchorHalf,
                          e.evt.shiftKey
                        );
                      }}
                      onDragEnd={(e) => {
                        const pos = e.target.position();
                        handleLineAnchorDrag(
                          lineShape.id,
                          'right',
                          pos.x + anchorHalf,
                          pos.y + anchorHalf,
                          e.evt.shiftKey
                        );
                      }}
                      onClick={(e) => { e.cancelBubble = true; }}
                      onTap={(e) => { e.cancelBubble = true; }}
                    />
                  </>
                );
              })()}
            <Transformer
              ref={transformerRef}
              onTransformEnd={handleTransformEnd}
              boundBoxFunc={(_oldBox, newBox) => {
                if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) return _oldBox;
                return newBox;
              }}
            />
            {/* Рамка выделения области (инструмент «Курсор») */}
            {selectionBox && selectionBox.width > 0 && selectionBox.height > 0 && (
              <Rect
                x={selectionBox.x}
                y={selectionBox.y}
                width={selectionBox.width}
                height={selectionBox.height}
                fill="rgba(40, 84, 197, 0.1)"
                stroke={themeColors.selection}
                strokeWidth={2}
                dash={[6, 4]}
                listening={false}
              />
            )}
            {/* Черновик текущего объекта */}
            {draft?.type === 'rect' && (
              <Rect
                x={draft.x}
                y={draft.y}
                width={draft.width}
                height={draft.height}
                stroke={draft.color}
                strokeWidth={4}
                listening={false}
              />
            )}
            {draft?.type === 'line' && (
              <Line
                points={draft.points}
                stroke={draft.color}
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
                listening={false}
              />
            )}
          </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
};
