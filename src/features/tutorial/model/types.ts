export type TutorialStepId =
  | 'create-room'
  | 'toolbar-cursor'
  | 'toolbar-snap'
  | 'toolbar-rectangle'
  | 'toolbar-line'
  | 'toolbar-eraser'
  | 'toolbar-color'
  | 'toolbar-fullscreen'
  | 'toolbar-furniture'
  | 'toolbar-devices'
  | 'create-rectangle'
  | 'add-furniture'
  | 'place-device';

export interface TutorialContext {
  hasRoom: boolean;
  hasRectangle: boolean;
  hasAddedFurniture: boolean;
  hasAddedDevice: boolean;
}

export interface TutorialStep {
  id: TutorialStepId;
  title: string;
  description: string;
  selector?: string;
  condition: (ctx: TutorialContext) => boolean;
  requiresAction?: boolean;
}
