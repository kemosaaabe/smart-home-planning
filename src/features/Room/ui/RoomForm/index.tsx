import { type FC } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addRoom, updateRoom, type Room } from '@/entities/Room';
import { useRoomFormStore } from '../../model/roomFormStore';
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
import type { RoomFormValues } from '../../types';
import {
  roomFormSchema,
  defaultRoomFormValues,
} from '../../constants';

export interface RoomFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room | null;
  projectId?: number;
  /** Вызывается после успешного сохранения (создание или редактирование) */
  onSaved?: () => void;
}

export const RoomForm: FC<RoomFormProps> = ({
  open,
  onOpenChange,
  room,
  projectId,
  onSaved,
}) => {
  const isEdit = room != null;

  const defaultValues: RoomFormValues =
    room != null
      ? {
          name: room.name,
          description: room.description ?? '',
        }
      : defaultRoomFormValues;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues,
  });

  const bumpRoomsVersion = useRoomFormStore((s) => s.bumpRoomsVersion);

  const onSubmit = (data: RoomFormValues) => {
    if (isEdit && room) {
      updateRoom(room.id, {
        name: data.name,
        description: data.description || undefined,
      });
    } else if (projectId != null) {
      addRoom(projectId, {
        name: data.name,
        description: data.description || undefined,
      });
    }
    bumpRoomsVersion();
    reset(defaultRoomFormValues);
    onOpenChange(false);
    onSaved?.();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset(defaultRoomFormValues);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Редактировать комнату' : 'Новая комната'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Название комнаты</Label>
            <Input
              id="room-name"
              placeholder="Название комнаты"
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
            <Label htmlFor="room-description">Описание</Label>
            <Input
              id="room-description"
              placeholder="Описание"
              {...register('description')}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
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
