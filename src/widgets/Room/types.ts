export type DrawingTool = 'cursor' | 'rectangle' | 'line' | 'eraser';

export interface DrawnRect {
  type: 'rect';
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  objectType?: 'furniture' | 'device';
  objectId?: string;
  rotation?: number;
}

export interface DrawnLine {
  type: 'line';
  id: string;
  points: number[];
  color: string;
}

export type DrawnShape = DrawnRect | DrawnLine;

export interface ShapeGroup {
  id: string;
  childIds: string[];
}

export interface RoomLayoutProps {
  projectId?: number;
  roomId?: number | null;
}

export interface RoomLayoutPersistedState {
  shapes: DrawnShape[];
  groups: ShapeGroup[];
}
