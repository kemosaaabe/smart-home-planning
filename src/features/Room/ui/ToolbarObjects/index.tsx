import type { FC } from 'react';
import { Sofa, Smartphone } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';
import styles from './styles.module.scss';

export interface ToolbarObjectsProps {
  onOpenFurniture: () => void;
  onOpenDevices: () => void;
}

export const ToolbarObjects: FC<ToolbarObjectsProps> = ({
  onOpenFurniture,
  onOpenDevices,
}) => {
  return (
    <div className={styles.toolbarRight}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={onOpenFurniture}
            aria-label="Мебель"
            data-tutorial="tutorial-open-furniture"
          >
            <Sofa size={20} strokeWidth={2} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Мебель</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={onOpenDevices}
            aria-label="Умные устройства"
            data-tutorial="tutorial-open-devices"
          >
            <Smartphone size={20} strokeWidth={2} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Умные устройства</TooltipContent>
      </Tooltip>
    </div>
  );
};
