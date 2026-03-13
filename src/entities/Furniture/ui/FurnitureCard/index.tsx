import { type FC } from 'react';
import type { FurnitureItem } from '../../model/types';
import styles from './styles.module.scss';

export interface FurnitureCardProps {
  item: FurnitureItem;
  onClick?: () => void;
}

export const FurnitureCard: FC<FurnitureCardProps> = ({ item, onClick }) => {
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
