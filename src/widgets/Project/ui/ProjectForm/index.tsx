import { type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  addProject,
  updateProject,
  type Project,
} from '@/entities/Project';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
} from '@/shared/ui';
import type { ProjectFormValues } from '../../types';
import {
  projectFormSchema,
  defaultProjectFormValues,
} from '../../constants';

export interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
}

export const ProjectForm: FC<ProjectFormProps> = ({
  open,
  onOpenChange,
  project,
}) => {
  const navigate = useNavigate();
  const isEdit = project != null;

  const defaultValues: ProjectFormValues = project
    ? {
        name: project.name,
        description: project.description ?? '',
      }
    : defaultProjectFormValues;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
  });

  const onSubmit = (data: ProjectFormValues) => {
    if (isEdit) {
      updateProject(project.id, {
        name: data.name,
        description: data.description || undefined,
      });
      onOpenChange(false);

      return;
    }

    addProject({
      name: data.name,
      description: data.description || undefined,
    });

    onOpenChange(false);
    navigate('/projects');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Редактировать проект' : 'Новый проект'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Название проекта</Label>
            <Input
              id="project-name"
              placeholder="Название проекта"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Описание проекта</Label>
            <Input
              id="project-description"
              placeholder="Описание"
              {...register('description')}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Закрыть
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
