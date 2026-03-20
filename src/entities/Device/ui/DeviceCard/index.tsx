import { type FC } from 'react';
import { Info } from 'lucide-react';
import type { DeviceItem } from '../../model/types';
import styles from './styles.module.scss';

export interface DeviceCardProps {
  item: DeviceItem;
  onClick?: () => void;
  onInfoClick?: (item: DeviceItem) => void;
}

export const DeviceCard: FC<DeviceCardProps> = ({ item, onClick, onInfoClick }) => {
  return (
    <div
      className={styles.card}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {onInfoClick != null && (
        <button
          type="button"
          className={styles.infoButton}
          aria-label={`Информация об устройстве ${item.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onInfoClick(item);
          }}
        >
          <Info className={styles.infoIcon} />
        </button>
      )}
      <div className={styles.imageWrap}>
        <img
          src={item.imagePath}
          alt={item.name}
          className={styles.image}
          loading="lazy"
        />
      </div>
      <p className={styles.name}>{item.name}</p>
    </div>
  );
};
