import { z } from 'zod';
import type { BreadcrumbItemType } from '@/shared/ui';
import type { ProjectFormValues } from './types';

export const projectsListBreadcrumbs: BreadcrumbItemType[] = [
  { label: 'Главная', href: '/' },
  { label: 'Мои проекты' },
];

export function getProjectBreadcrumbs(projectName: string): BreadcrumbItemType[] {
  return [
    { label: 'Главная', href: '/' },
    { label: 'Мои проекты', href: '/projects' },
    { label: projectName },
  ];
}

export const projectFormSchema = z.object({
  name: z.string().min(1, 'Заполните поле'),
  description: z.string().optional(),
}) satisfies z.ZodType<ProjectFormValues>;

export const defaultProjectFormValues: ProjectFormValues = {
  name: '',
  description: '',
};
