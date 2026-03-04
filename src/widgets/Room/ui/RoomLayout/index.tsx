import {
  type FC,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
  useEffect,
} from 'react';
import { Square, Minus, Palette } from 'lucide-react';
import { Stage, Layer, Rect, Line, Transformer } from 'react-konva';
import type Konva from 'konva';
import styles from './styles.module.scss';

export type DrawingTool = 'rectangle' | 'line';

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

let shapeIdCounter = 0;
const nextId = () => `shape-${++shapeIdCounter}`;

export const RoomLayout: FC<RoomLayoutProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 500 });
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
        setSize((prev) =>
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

  const [tool, setTool] = useState<DrawingTool>('rectangle');
  const [drawColor, setDrawColor] = useState(DEFAULT_COLOR);
  const [shapes, setShapes] = useState<DrawnShape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [draft, setDraft] = useState<DrawnRect | DrawnLine | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const selectedNodeRef = useRef<Konva.Rect | Konva.Line | null>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Сбрасываем выделение при начале рисования, чтобы не рисовать поверх выбранного
  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target !== e.target.getStage()) return;
      setSelectedId(null);
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const x = pos.x;
      const y = pos.y;
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
      if (!startRef.current || !draft) return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const { x: sx, y: sy } = startRef.current;
      const x = pos.x;
      const y = pos.y;
      if (draft.type === 'rect') {
        const w = x - sx;
        const h = y - sy;
        setDraft({
          ...draft,
          x: w >= 0 ? sx : x,
          y: h >= 0 ? sy : y,
          width: Math.abs(w),
          height: Math.abs(h),
        });
      } else {
        setDraft({ ...draft, points: [sx, sy, x, y] });
      }
    },
    [draft]
  );

  const handleStageMouseUp = useCallback(() => {
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
    setShapes((prev) => [...prev, draft]);
    setDraft(null);
    startRef.current = null;
  }, [draft]);

  const handleShapeClick = useCallback(
    (e: Konva.KonvaEventObject<Event>, id: string) => {
      e.cancelBubble = true;
      setSelectedId(id);
    },
    []
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        setSelectedId(null);
      }
    },
    []
  );

  // Привязка Transformer только к выбранному прямоугольнику (для линий — свои якоря)
  useEffect(() => {
    const tr = transformerRef.current;
    const node = selectedNodeRef.current;
    if (!tr) return;
    const shape = selectedId ? shapes.find((s) => s.id === selectedId) : null;
    const isRect = shape?.type === 'rect';
    if (!selectedId || !isRect || !node) {
      tr.nodes([]);
    } else {
      tr.nodes([node]);
    }
    tr.getLayer()?.batchDraw();
  }, [selectedId, shapes]);


  const handleRectDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
      const node = e.target;
      setShapes((prev) =>
        prev.map((s) =>
          s.id === id && s.type === 'rect'
            ? { ...s, x: node.x(), y: node.y() }
            : s
        )
      );
    },
    []
  );

  const handleLineDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
      const node = e.target as Konva.Line;
      const dx = node.x();
      const dy = node.y();
      setShapes((prev) =>
        prev.map((s) => {
          if (s.id !== id || s.type !== 'line') return s;
          return {
            ...s,
            points: s.points.map((p, i) => (i % 2 === 0 ? p + dx : p + dy)),
          };
        })
      );
      setTimeout(() => {
        node.position({ x: 0, y: 0 });
        node.getLayer()?.batchDraw();
      }, 0);
    },
    []
  );

  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      if (!selectedId) return;
      const node = e.target;
      const shape = shapes.find((s) => s.id === selectedId);
      if (!shape) return;

      if (shape.type === 'rect') {
        const rect = node as Konva.Rect;
        const scaleX = rect.scaleX();
        const scaleY = rect.scaleY();
        rect.scaleX(1);
        rect.scaleY(1);
        setShapes((prev) =>
          prev.map((s) =>
            s.id === selectedId && s.type === 'rect'
              ? {
                  ...s,
                  x: rect.x(),
                  y: rect.y(),
                  width: Math.max(5, rect.width() * scaleX),
                  height: Math.max(5, rect.height() * scaleY),
                }
              : s
          )
        );
      }
    },
    [selectedId, shapes]
  );

  const handleLineAnchorDrag = useCallback(
    (lineId: string, anchor: 'left' | 'right', x: number, y: number) => {
      setShapes((prev) =>
        prev.map((s) => {
          if (s.id !== lineId || s.type !== 'line' || s.points.length < 4) return s;
          const [x1, y1, x2, y2] = s.points;
          const newPoints = anchor === 'left' ? [x, y, x2, y2] : [x1, y1, x, y];
          return { ...s, points: newPoints };
        })
      );
    },
    []
  );

  return (
    <div className={styles.wrapper} aria-label="Область проектирования">
      <div ref={containerRef} className={styles.canvasWrap}>
        <div className={styles.toolbar}>
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
          <label className={styles.colorBtn} aria-label="Цвет рисования">
            <Palette size={20} strokeWidth={2} />
            <input
              type="color"
              value={drawColor}
              onChange={(e) => setDrawColor(e.target.value)}
              className={styles.colorInput}
            />
          </label>
        </div>
        <Stage
          width={size.width}
          height={size.height}
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
                const isSelected = selectedId === shape.id;
                return (
                  <Rect
                    key={shape.id}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    fill={undefined}
                    stroke={isSelected ? themeColors.selection : shape.color}
                    strokeWidth={4}
                    dash={isSelected ? [8, 4] : undefined}
                    draggable={isSelected}
                    ref={isSelected ? (node) => { selectedNodeRef.current = node; } : undefined}
                    onClick={(e) => handleShapeClick(e, shape.id)}
                    onTap={(e) => handleShapeClick(e, shape.id)}
                    onDragEnd={(e) => handleRectDragEnd(e, shape.id)}
                    onTransformEnd={handleTransformEnd}
                  />
                );
              }
              const isSelected = selectedId === shape.id;
              return (
                <Line
                  key={shape.id}
                  points={shape.points}
                  stroke={isSelected ? themeColors.selection : shape.color}
                  strokeWidth={4}
                  hitStrokeWidth={20}
                  dash={isSelected ? [8, 4] : undefined}
                  lineCap="round"
                  lineJoin="round"
                  draggable={isSelected}
                  onClick={(e) => { e.cancelBubble = true; handleShapeClick(e, shape.id); }}
                  onTap={(e) => { e.cancelBubble = true; handleShapeClick(e, shape.id); }}
                  onDragEnd={(e) => handleLineDragEnd(e, shape.id)}
                />
              );
            })}
            {/* Якоря для выбранной линии */}
            {selectedId &&
              (() => {
                const lineShape = shapes.find(
                  (s) => s.id === selectedId && s.type === 'line'
                ) as DrawnLine | undefined;
                if (!lineShape || lineShape.points.length < 4) return null;
                const [x1, y1, x2, y2] = lineShape.points;
                const anchorSize = 10;
                const anchorHalf = anchorSize / 2;
                return (
                  <>
                    <Rect
                      key={`line-${lineShape.id}-left-${x1}-${y1}`}
                      x={x1 - anchorHalf}
                      y={y1 - anchorHalf}
                      width={anchorSize}
                      height={anchorSize}
                      fill={themeColors.anchorFill}
                      stroke={themeColors.anchorStroke}
                      strokeWidth={2}
                      draggable
                      onDragMove={(e) => {
                        const pos = e.target.position();
                        handleLineAnchorDrag(
                          lineShape.id,
                          'left',
                          pos.x + anchorHalf,
                          pos.y + anchorHalf
                        );
                      }}
                      onDragEnd={(e) => {
                        const pos = e.target.position();
                        handleLineAnchorDrag(
                          lineShape.id,
                          'left',
                          pos.x + anchorHalf,
                          pos.y + anchorHalf
                        );
                      }}
                      onClick={(e) => { e.cancelBubble = true; }}
                      onTap={(e) => { e.cancelBubble = true; }}
                    />
                    <Rect
                      key={`line-${lineShape.id}-right-${x2}-${y2}`}
                      x={x2 - anchorHalf}
                      y={y2 - anchorHalf}
                      width={anchorSize}
                      height={anchorSize}
                      fill={themeColors.anchorFill}
                      stroke={themeColors.anchorStroke}
                      strokeWidth={2}
                      draggable
                      onDragMove={(e) => {
                        const pos = e.target.position();
                        handleLineAnchorDrag(
                          lineShape.id,
                          'right',
                          pos.x + anchorHalf,
                          pos.y + anchorHalf
                        );
                      }}
                      onDragEnd={(e) => {
                        const pos = e.target.position();
                        handleLineAnchorDrag(
                          lineShape.id,
                          'right',
                          pos.x + anchorHalf,
                          pos.y + anchorHalf
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
              boundBoxFunc={(_oldBox, newBox) => {
                if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) return _oldBox;
                return newBox;
              }}
            />
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
  );
};
