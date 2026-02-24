import { type Project } from './types';
import { randomDateWithinDays } from '@/shared/lib';

export const storageKey = 'smart-home-projects';

export const defaultProjects: Project[] = [
  {
    id: 1,
    name: 'Квартира',
    description: 'Планировка и устройства для квартиры',
    updatedAt: randomDateWithinDays(7),
  },
  {
    id: 2,
    name: 'Загородный дом',
    description: 'Умный дом за городом',
    updatedAt: randomDateWithinDays(14),
  },
  {
    id: 3,
    name: 'Офис',
    description: 'Автоматизация офисного пространства',
    updatedAt: randomDateWithinDays(10),
  },
];
