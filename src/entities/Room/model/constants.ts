import { randomDateWithinDays } from '@/shared/lib';
import type { Room } from './types';

export const storageKey = 'smart-home-rooms';

export const defaultRoomsForApartment: Room[] = [
  {
    id: 1,
    name: 'Кухня',
    description: 'Умное освещение, розетки и техника',
    projectId: 1,
    updatedAt: randomDateWithinDays(5),
  },
  {
    id: 2,
    name: 'Гостиная',
    description: 'Основная зона отдыха с медиа и светом',
    projectId: 1,
    updatedAt: randomDateWithinDays(7),
  },
  {
    id: 3,
    name: 'Спальня',
    description: 'Датчики и освещение для комфортного сна',
    projectId: 1,
    updatedAt: randomDateWithinDays(3),
  },
  {
    id: 4,
    name: 'Прихожая',
    description: 'Датчик движения и управление светом при входе',
    projectId: 1,
    updatedAt: randomDateWithinDays(2),
  },
];
