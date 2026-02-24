import { type Project } from './types';
import { storageKey, defaultProjects } from './constants';

export function getProjects(): Project[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(storageKey, JSON.stringify(projects));
}

export function initProjects(): Project[] {
  const existing = getProjects();
  if (existing.length > 0) {
    return existing;
  }

  saveProjects(defaultProjects);
  return getProjects();
}
