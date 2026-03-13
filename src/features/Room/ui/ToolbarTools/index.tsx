import type { FC, RefObject } from 'react';
import { MousePointer2, Magnet, Square, Minus, Eraser, Palette, Maximize2, Minimize2 } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';
import styles from './styles.module.scss';

export interface ToolbarToolsProps {
  tool: string;
  setTool: (t: string) => void;
  snapEnabled: boolean;
  setSnapEnabled: (v: boolean | ((prev: boolean) => boolean)) => void;
  drawColor: string;
  hexInputValue: string;
  setHexInputValue: (v: string) => void;
  onColorChange: (color: string) => void;
  onHexBlur: (rawValue: string) => void;
  colorPickerOpen: boolean;
  setColorPickerOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  colorPickerRef: RefObject<HTMLDivElement | null>;
  closeColorPickerAndSave: () => void;
  isFullscreen: boolean;
  setIsFullscreen: (v: boolean | ((prev: boolean) => boolean)) => void;
}

export const ToolbarTools: FC<ToolbarToolsProps> = ({
  tool,
  setTool,
  snapEnabled,
  setSnapEnabled,
  drawColor,
  hexInputValue,
  setHexInputValue,
  onColorChange,
  onHexBlur,
  colorPickerOpen,
  setColorPickerOpen,
  colorPickerRef,
  closeColorPickerAndSave,
  isFullscreen,
  setIsFullscreen,
}) => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarEdit}>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">Курсор — выделение</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={styles.toolBtn}
              data-active={snapEnabled}
              onClick={() => setSnapEnabled((v) => !v)}
              aria-label={snapEnabled ? 'Привязка включена' : 'Привязка выключена'}
              aria-pressed={snapEnabled}
            >
              <Magnet size={20} strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Привязка</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">Прямоугольник</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">Линия</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={styles.toolBtn}
              data-active={tool === 'eraser'}
              onClick={() => setTool('eraser')}
              aria-label="Ластик"
              aria-pressed={tool === 'eraser'}
            >
              <Eraser size={20} strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Ластик</TooltipContent>
        </Tooltip>
        <div className={styles.colorPickerWrap} ref={colorPickerRef}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={styles.colorBtn}
                onClick={() =>
                  colorPickerOpen ? closeColorPickerAndSave() : setColorPickerOpen(true)
                }
                aria-label="Цвет"
                aria-expanded={colorPickerOpen}
                aria-haspopup="dialog"
              >
                <Palette size={20} strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Цвет</TooltipContent>
          </Tooltip>
          {colorPickerOpen && (
            <div className={styles.colorPickerPopover} role="dialog" aria-label="Выбор цвета">
              <div className={styles.colorPickerPopoverHeader}>Цвет</div>
              <HexColorPicker
                color={drawColor}
                onChange={onColorChange}
                className={styles.colorPickerReactColorful}
              />
              <input
                type="text"
                className={styles.colorPickerHexInput}
                value={hexInputValue}
                onChange={(e) => setHexInputValue(e.target.value)}
                onBlur={(e) => onHexBlur(e.currentTarget.value.trim())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
                placeholder="#000000"
                aria-label="Hex-код цвета"
              />
            </div>
          )}
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => setIsFullscreen((v) => !v)}
            aria-label={isFullscreen ? 'Выйти из полноэкранного режима' : 'На весь экран'}
          >
            {isFullscreen ? (
              <Minimize2 size={20} strokeWidth={2} />
            ) : (
              <Maximize2 size={20} strokeWidth={2} />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isFullscreen ? 'Свернуть' : 'Полный экран'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
