import type { BreadcrumbItemType } from '@/shared/ui';

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
