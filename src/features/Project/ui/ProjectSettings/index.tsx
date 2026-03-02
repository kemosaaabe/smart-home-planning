import { type FC } from 'react';
import { DoorOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Project } from '@/entities/Project';
import type { Room } from '@/entities/Room';
import { useRoomFormStore } from '@/features/Room';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui';
import styles from './styles.module.scss';

export interface ProjectSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  rooms?: Room[];
  onEdit: () => void;
  onDelete: () => void;
  onDeleteRoom?: (room: Room) => void;
}

export const ProjectSettings: FC<ProjectSettingsProps> = ({
  open,
  onOpenChange,
  project,
  rooms = [],
  onEdit,
  onDelete,
  onDeleteRoom,
}) => {
  const handleEdit = () => {
    onOpenChange(false);
    onEdit();
  };

  const handleDelete = () => {
    onOpenChange(false);
    onDelete();
  };

  const openForCreate = useRoomFormStore((s) => s.openForCreate);
  const openForEdit = useRoomFormStore((s) => s.openForEdit);

  const handleCreateRoom = () => {
    if (project) openForCreate(project.id);
  };

  const handleEditRoom = (room: Room) => () => {
    openForEdit(room);
  };

  const handleDeleteRoom = (room: Room) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteRoom?.(room);
  };

  if (project == null) return null;

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>Действия с проектом</DialogTitle>
        </DialogHeader>
        <div className={styles.roomsSection}>
          <h3 className={styles.roomsTitle}>Комнаты</h3>
          {rooms.length > 0 ? (
            <ul className={styles.roomsList}>
              {rooms.map((room) => (
                <li key={room.id} className={styles.roomItem}>
                  <span className={styles.roomItemTitle}>
                    <DoorOpen className={styles.roomIcon} aria-hidden />
                    <span className={styles.roomName}>{room.name}</span>
                  </span>
                  <span className={styles.roomItemActions}>
                    <button
                      type="button"
                      className={styles.roomActionBtn}
                      onClick={handleEditRoom(room)}
                      aria-label="Редактировать комнату"
                    >
                      <Pencil className={styles.roomActionIcon} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={styles.roomActionBtn}
                      onClick={handleDeleteRoom(room)}
                      aria-label="Удалить комнату"
                    >
                      <Trash2 className={styles.roomActionIcon} aria-hidden />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            className={styles.createRoomTrigger}
            onClick={handleCreateRoom}
          >
            <Plus className={styles.createRoomIcon} aria-hidden />
            <span className={styles.createRoomLabel}>Создать комнату</span>
          </button>
        </div>
        <div className={styles.list}>
          <button
            type="button"
            className={styles.item}
            onClick={handleEdit}
          >
            <Pencil className={styles.icon} />
            Редактирование проекта
          </button>
          <button
            type="button"
            className={styles.item}
            onClick={handleDelete}
          >
            <Trash2 className={styles.icon} />
            Удаление проекта
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
