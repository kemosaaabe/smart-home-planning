import { type FC } from 'react';
import dayjs from 'dayjs';
import { type Room } from '../../model/types';
import styles from './styles.module.scss';

interface RoomCardProps {
  room: Room;
  isActive?: boolean;
  onClick?: () => void;
}

export const RoomCard: FC<RoomCardProps> = ({
  room,
  isActive = false,
  onClick,
}) => {
  const formattedDate = dayjs(room.updatedAt).format('DD.MM.YYYY');

  return (
    <div
      className={styles.card + (isActive ? ' ' + styles.cardActive : '')}
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
      <div className={styles.nameRow}>
        <h3 className={styles.name}>{room.name}</h3>
        <p className={styles.updatedAt}>{formattedDate}</p>
      </div>
      {room.description != null && room.description !== '' ? (
        <p className={styles.description}>{room.description}</p>
      ) : (
        <div className={styles.spacer} />
      )}
    </div>
  );
};
