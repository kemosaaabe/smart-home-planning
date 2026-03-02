import { z } from 'zod';
import type { RoomFormValues } from './types';

export const roomFormSchema = z.object({
  name: z.string().min(1, 'Заполните поле'),
  description: z.string().optional(),
}) satisfies z.ZodType<RoomFormValues>;

export const defaultRoomFormValues: RoomFormValues = {
  name: '',
  description: '',
};
