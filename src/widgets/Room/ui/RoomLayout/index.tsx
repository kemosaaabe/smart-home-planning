import { type FC, useState, useRef, useCallback, useLayoutEffect, useEffect, useMemo, Fragment } from 'react';
import { Stage, Layer, Rect, Line, Transformer, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import { ToolbarTools, ToolbarObjects } from '@/features/Room';
import { FurnitureListModal } from '@/features/Furniture';
import { DeviceListModal } from '@/features/Device';
import { furnitureList, type FurnitureItem } from '@/entities/Furniture';
import { deviceList, type DeviceItem } from '@/entities/Device';
import type { DrawingTool, DrawnRect, DrawnLine, DrawnShape, ShapeGroup, RoomLayoutProps } from '../../types';
import {
  defaultColor,
  maxUndoHistory,
  snapThreshold,
  lineHitPadding,
  arrowStep,
  arrowStepShift,
  stageWidth,
  stageHeight,
  viewportViewOnlyMax,
  eraserBrushRadius,
} from '../../constants';
import {
  loadRoomLayoutState,
  saveRoomLayoutState,
  parseHexColor,
  getSnapTargets,
  snapToTargets,
  nextId,
  nextGroupId,
  initCountersFromLoaded,
  applyEraserToShapes,
  cleanupGroupsAfterEraser,
  computeGroupBounds,
} from '../../lib';
import styles from './styles.module.scss';

export type { DrawingTool, DrawnRect, DrawnLine, DrawnShape, ShapeGroup, RoomLayoutProps, RoomLayoutPersistedState } from '../../types';

export const RoomLayout: FC<RoomLayoutProps> = ({
  projectId,
  roomId,
  onRectangleCreated,
  onFurnitureAdded,
  onDeviceAdded,
  forcedTool,
  openFurnitureSignal,
  openDevicesSignal,
}) => {
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

  const scaleX = containerSize.width / stageWidth;
  const scaleY = containerSize.height / stageHeight;

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
  const [drawColor, setDrawColor] = useState(defaultColor);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [hexInputValue, setHexInputValue] = useState(drawColor);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const [shapes, setShapes] = useState<DrawnShape[]>([]);
  const [groups, setGroups] = useState<ShapeGroup[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draggingLineId, setDraggingLineId] = useState<string | null>(null);
  const [furnitureModalOpen, setFurnitureModalOpen] = useState(false);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);

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
  const furnitureImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const deviceImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  useLayoutEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  const furnitureById = useMemo(() => {
    const map = new Map<string, FurnitureItem>();
    furnitureList.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, []);

  const deviceById = useMemo(() => {
    const map = new Map<string, DeviceItem>();
    deviceList.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, []);

  const getFurnitureImage = useCallback(
    (item: FurnitureItem): HTMLImageElement => {
      let img = furnitureImagesRef.current.get(item.id);
      if (!img) {
        img = new window.Image();
        img.src = item.imagePath;
        furnitureImagesRef.current.set(item.id, img);
      }
      return img;
    },
    []
  );

  const getDeviceImage = useCallback(
    (item: DeviceItem): HTMLImageElement => {
      let img = deviceImagesRef.current.get(item.id);
      if (!img) {
        img = new window.Image();
        img.src = item.imagePath;
        deviceImagesRef.current.set(item.id, img);
      }
      return img;
    },
    []
  );

  useEffect(() => {
    if (containerSize.width <= viewportViewOnlyMax) setSelectedIds([]);
  }, [containerSize.width]);

  useEffect(() => {
    if (forcedTool == null) return;
    setTool(forcedTool);
  }, [forcedTool]);

  useEffect(() => {
    if (openFurnitureSignal == null || openFurnitureSignal <= 0) return;
    setFurnitureModalOpen(true);
  }, [openFurnitureSignal]);

  useEffect(() => {
    if (openDevicesSignal == null || openDevicesSignal <= 0) return;
    setDeviceModalOpen(true);
  }, [openDevicesSignal]);

  const canPersist = Number.isFinite(projectId) && roomId != null && Number.isFinite(roomId);

  useEffect(() => {
    historyRef.current = [];
    setTool('cursor');
    setSnapEnabled(true);
    setDrawColor(defaultColor);
    setHexInputValue(defaultColor);
    setColorPickerOpen(false);
    if (!Number.isFinite(projectId) || roomId == null || !Number.isFinite(roomId)) {
      setShapes([]);
      setGroups([]);
      setSelectedIds([]);
      return;
    }
    const state = loadRoomLayoutState(projectId!, roomId!);
    if (state) {
      setShapes(state.shapes);
      setGroups(state.groups);
      setSelectedIds([]);
      initCountersFromLoaded(state.shapes, state.groups);
    } else {
      setShapes([]);
      setGroups([]);
      setSelectedIds([]);
    }
  }, [projectId, roomId]);

  useEffect(() => {
    if (!canPersist) return;
    saveRoomLayoutState(projectId!, roomId!, { shapes, groups });
  }, [canPersist, projectId, roomId, shapes, groups]);

  // Синхронизируем цвет палитры с выбранной фигурой только при смене выделения,
  // не при каждом изменении shapes (иначе краш при перетаскивании якорей линии).
  useLayoutEffect(() => {
    if (selectedIds.length === 1) {
      const shape = shapesRef.current.find((s) => s.id === selectedIds[0]);
      if (shape && 'color' in shape) setDrawColor(shape.color);
    }
  }, [selectedIds]);

  useEffect(() => {
    if (colorPickerOpen) setHexInputValue(drawColor);
  }, [colorPickerOpen, drawColor]);

  const pushToHistory = useCallback((current: DrawnShape[]) => {
    const snapshot: DrawnShape[] = current.map((s) =>
      s.type === 'rect' ? { ...s } : { ...s, points: [...s.points] }
    );
    historyRef.current.push(snapshot);
    if (historyRef.current.length > maxUndoHistory) {
      historyRef.current.shift();
    }
  }, []);

  const handleAddFurniture = useCallback(
    (item: FurnitureItem) => {
      const width = 56;
      const height = 56;
      const x = (stageWidth - width) / 2;
      const y = (stageHeight - height) / 2;
      setShapes((prev) => {
        pushToHistory(prev);
        return [
          ...prev,
          {
            type: 'rect',
            id: nextId(),
            x,
            y,
            width,
            height,
            color: defaultColor,
            objectType: 'furniture',
            objectId: item.id,
          },
        ];
      });
      onFurnitureAdded?.();
    },
    [pushToHistory, onFurnitureAdded]
  );

  const handleAddDevice = useCallback(
    (item: DeviceItem) => {
      const width = 56;
      const height = 56;
      const x = (stageWidth - width) / 2;
      const y = (stageHeight - height) / 2;
      setShapes((prev) => {
        pushToHistory(prev);
        return [
          ...prev,
          {
            type: 'rect',
            id: nextId(),
            x,
            y,
            width,
            height,
            color: defaultColor,
            objectType: 'device',
            objectId: item.id,
          },
        ];
      });
      onDeviceAdded?.();
    },
    [pushToHistory, onDeviceAdded]
  );

  const handleColorChange = useCallback(
    (color: string) => {
      setDrawColor(color);
      setHexInputValue(color);
      if (selectedIds.length > 0) {
        pushToHistory(shapesRef.current);
        setShapes((prev) =>
          prev.map((s) => (selectedIds.includes(s.id) ? { ...s, color } : s))
        );
      }
    },
    [selectedIds, pushToHistory]
  );

  const handleHexBlur = useCallback(
    (rawValue: string) => {
      const color = parseHexColor(rawValue);
      if (color) {
        handleColorChange(color);
      } else {
        setHexInputValue(drawColor);
      }
    },
    [drawColor, handleColorChange]
  );

  const closeColorPickerAndSave = useCallback(() => {
    const input = colorPickerRef.current?.querySelector<HTMLInputElement>('input[type="text"]');
    const raw = input?.value?.trim() ?? '';
    const color = parseHexColor(raw);
    if (color) {
      handleColorChange(color);
    }
    setColorPickerOpen(false);
  }, [handleColorChange]);

  useEffect(() => {
    if (!colorPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !colorPickerRef.current ||
        colorPickerRef.current.contains(e.target as Node)
      ) {
        return;
      }
      closeColorPickerAndSave();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [colorPickerOpen, closeColorPickerAndSave]);

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

      if (tool === 'eraser') {
        setSelectedIds([]);
        startRef.current = { x, y };
        pushToHistory(shapesRef.current);
        const next = applyEraserToShapes(shapesRef.current, x, y, eraserBrushRadius);
        setShapes(next);
        setGroups((prev) => cleanupGroupsAfterEraser(prev, new Set(next.map((s) => s.id))));
        return;
      }

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
    [tool, drawColor, pushToHistory]
  );

  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const { x: sx, y: sy } = startRef.current ?? { x: pos.x, y: pos.y };

      if (tool === 'eraser' && startRef.current !== null) {
        const next = applyEraserToShapes(shapesRef.current, pos.x, pos.y, eraserBrushRadius);
        setShapes(next);
        setGroups((prev) => cleanupGroupsAfterEraser(prev, new Set(next.map((s) => s.id))));
        return;
      }

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
    [tool, draft, selectionBox]
  );

  const handleStageMouseUp = useCallback(() => {
    if (tool === 'eraser' && startRef.current !== null) {
      startRef.current = null;
      return;
    }
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
    if (draft.type === 'rect' && draft.objectType == null) {
      onRectangleCreated?.();
    }
    setDraft(null);
    startRef.current = null;
  }, [tool, draft, pushToHistory, selectionBox, shapes, onRectangleCreated]);

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
      if (tool === 'eraser') {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (pos) {
          pushToHistory(shapesRef.current);
          const next = applyEraserToShapes(shapesRef.current, pos.x, pos.y, eraserBrushRadius);
          setShapes(next);
          setGroups((prev) => cleanupGroupsAfterEraser(prev, new Set(next.map((s) => s.id))));
        }
        return;
      }
      const group = getGroupContaining(id);
      if (group) {
        setSelectedIds([...group.childIds]);
      } else {
        setSelectedIds([id]);
      }
    },
    [tool, getGroupContaining, pushToHistory]
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
      const target = e.target as Node | null;
      if (
        target &&
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          (target instanceof HTMLElement && target.isContentEditable))
      ) {
        return;
      }
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
      const step = e.shiftKey ? arrowStepShift : arrowStep;
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
      const newX = snapToTargets(node.x(), targets.x, snapThreshold, [0, width, width / 2]);
      const newY = snapToTargets(node.y(), targets.y, snapThreshold, [0, height, height / 2]);
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
      const snapX1 = snapToTargets(curX1, targets.x, snapThreshold, [0]);
      const snapX2 = snapToTargets(curX2, targets.x, snapThreshold, [0]);
      const snapY1 = snapToTargets(curY1, targets.y, snapThreshold, [0]);
      const snapY2 = snapToTargets(curY2, targets.y, snapThreshold, [0]);
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
      setDraggingLineId(null);
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
            rotation: rect.rotation(),
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
      data-tutorial="tutorial-canvas"
      aria-label="Область проектирования"
    >
      <div ref={containerRef} className={styles.canvasWrap}>
        <ToolbarTools
          tool={tool}
          setTool={(t) => setTool(t as DrawingTool)}
          snapEnabled={snapEnabled}
          setSnapEnabled={setSnapEnabled}
          drawColor={drawColor}
          hexInputValue={hexInputValue}
          setHexInputValue={setHexInputValue}
          onColorChange={handleColorChange}
          onHexBlur={handleHexBlur}
          colorPickerOpen={colorPickerOpen}
          setColorPickerOpen={setColorPickerOpen}
          colorPickerRef={colorPickerRef}
          closeColorPickerAndSave={closeColorPickerAndSave}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
        />
        <ToolbarObjects
          onOpenFurniture={() => setFurnitureModalOpen(true)}
          onOpenDevices={() => setDeviceModalOpen(true)}
        />
        <FurnitureListModal
          open={furnitureModalOpen}
          onOpenChange={setFurnitureModalOpen}
          onSelect={handleAddFurniture}
        />
        <DeviceListModal
          open={deviceModalOpen}
          onOpenChange={setDeviceModalOpen}
          onSelect={handleAddDevice}
        />
        <div className={styles.stageScaleWrap}>
          <div
            className={styles.stageScaleInner}
            style={
              containerSize.width <= viewportViewOnlyMax
                ? { width: stageWidth, height: stageHeight }
                : {
                    width: stageWidth,
                    height: stageHeight,
                    transform: `scale(${scaleX}, ${scaleY})`,
                  }
            }
          >
            <Stage
              width={stageWidth}
              height={stageHeight}
              listening={containerSize.width > viewportViewOnlyMax}
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
                const isFurniture = shape.objectType === 'furniture' && !!shape.objectId;
                const isDevice = shape.objectType === 'device' && !!shape.objectId;
                const furnitureItem =
                  isFurniture && shape.objectId ? furnitureById.get(shape.objectId) : undefined;
                const deviceItem =
                  isDevice && shape.objectId ? deviceById.get(shape.objectId) : undefined;
                const isPlacedObject = isFurniture || isDevice;

                return (
                  <Fragment key={shape.id}>
                    <Rect
                      name={shape.id}
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={shape.height}
                      rotation={shape.rotation ?? 0}
                      fill={undefined}
                      stroke={
                        isSelected
                          ? themeColors.selection
                          : isPlacedObject
                          ? 'transparent'
                          : shape.color
                      }
                      strokeWidth={isSelected ? 4 : isPlacedObject ? 0 : 4}
                      dash={isSelected ? [8, 4] : undefined}
                      listening={tool !== 'eraser'}
                      draggable={isSelected}
                      ref={(node) => {
                        if (node) nodeRefsMap.current.set(shape.id, node);
                        else nodeRefsMap.current.delete(shape.id);
                      }}
                      onClick={(e) => handleShapeClick(e, shape.id)}
                      onTap={(e) => handleShapeClick(e, shape.id)}
                      onDragMove={(e) =>
                        handleRectDragMove(e, shape.id, shape.width, shape.height)
                      }
                      onDragEnd={(e) => handleRectDragEnd(e, shape.id)}
                    />
                    {furnitureItem && (
                      <KonvaImage
                        key={`${shape.id}-img`}
                        x={shape.x}
                        y={shape.y}
                        width={shape.width}
                        height={shape.height}
                        rotation={shape.rotation ?? 0}
                        image={getFurnitureImage(furnitureItem)}
                        listening={false}
                      />
                    )}
                    {deviceItem && (
                      <KonvaImage
                        key={`${shape.id}-device-img`}
                        x={shape.x}
                        y={shape.y}
                        width={shape.width}
                        height={shape.height}
                        rotation={shape.rotation ?? 0}
                        image={getDeviceImage(deviceItem)}
                        listening={false}
                      />
                    )}
                  </Fragment>
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
                  hitStrokeWidth={lineHitPadding}
                  dash={isSelected ? [8, 4] : undefined}
                  lineCap="round"
                  lineJoin="round"
                  listening={tool !== 'eraser'}
                  draggable={isSelected}
                  onClick={(e) => { e.cancelBubble = true; handleShapeClick(e, shape.id); }}
                  onTap={(e) => { e.cancelBubble = true; handleShapeClick(e, shape.id); }}
                  onDragStart={() => setDraggingLineId(shape.id)}
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
            {/* Якоря для выбранной линии (только при единственной выбранной линии, не в группе; скрыты при перетаскивании линии) */}
            {selectedIds.length === 1 && !selectedGroupId && !draggingLineId &&
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
