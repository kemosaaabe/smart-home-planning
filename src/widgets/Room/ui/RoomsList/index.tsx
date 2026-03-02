import { type FC } from 'react';
import { DoorOpen } from 'lucide-react';
import { RoomCard, type Room } from '@/entities/Room';
import { Button } from '@/shared/ui';
import styles from './styles.module.scss';

export interface RoomsListProps {
  rooms: Room[];
  projectId: number;
  selectedRoomId: number | null;
  onSelectRoom: (roomId: number) => void;
  onAddRoom?: () => void;
}

export const RoomsList: FC<RoomsListProps> = ({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onAddRoom,
}) => {
  if (rooms.length === 0) {
    return (
      <div className={styles.empty}>
        <DoorOpen className={styles.emptyIcon} aria-hidden />
        <p className={styles.emptyText}>У вас пока нет комнат</p>
        <Button type="button" onClick={onAddRoom}>
          Добавить комнату
        </Button>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {rooms.map((room) => (
        <li key={room.id}>
          <RoomCard
            room={room}
            isActive={room.id === selectedRoomId}
            onClick={() => onSelectRoom(room.id)}
          />
        </li>
      ))}
    </ul>
  );
};
