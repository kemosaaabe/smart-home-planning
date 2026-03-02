import { type FC } from 'react';
import { DoorOpen, Pencil, Trash2 } from 'lucide-react';
import type { Project } from '@/entities/Project';
import type { Room } from '@/entities/Room';
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
}

export const ProjectSettings: FC<ProjectSettingsProps> = ({
  open,
  onOpenChange,
  project,
  rooms = [],
  onEdit,
  onDelete,
}) => {
  const handleEdit = () => {
    onOpenChange(false);
    onEdit();
  };

  const handleDelete = () => {
    onOpenChange(false);
    onDelete();
  };

  if (project == null) return null;

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>Действия с проектом</DialogTitle>
        </DialogHeader>
        {rooms.length > 0 && (
          <div className={styles.roomsSection}>
            <h3 className={styles.roomsTitle}>Комнаты</h3>
            <ul className={styles.roomsList}>
              {rooms.map((room) => (
                <li key={room.id} className={styles.roomItem}>
                  <DoorOpen className={styles.roomIcon} aria-hidden />
                  <span className={styles.roomName}>{room.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
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
