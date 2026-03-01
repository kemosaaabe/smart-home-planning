import { type FC } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Project } from '@/entities/Project';
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
  onEdit: () => void;
  onDelete: () => void;
}

export const ProjectSettings: FC<ProjectSettingsProps> = ({
  open,
  onOpenChange,
  project,
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
