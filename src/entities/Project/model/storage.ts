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

export function addProject(data: {
  name: string;
  description?: string;
}): Project {
  const projects = getProjects();
  const nextId =
    projects.length > 0
      ? Math.max(...projects.map((p) => p.id), 0) + 1
      : 1;
      
  const project: Project = {
    id: nextId,
    name: data.name,
    description: data.description,
    updatedAt: new Date().toISOString(),
  };

  saveProjects([project, ...projects]);

  return project;
}

export function updateProject(
  id: number,
  data: { name?: string; description?: string }
): Project | null {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === id);

  if (index === -1) {
    return null;
  }

  const updated: Project = {
    ...projects[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  const next = [...projects];
  next[index] = updated;
  saveProjects(next);

  return updated;
}

export function deleteProject(id: number): boolean {
  const projects = getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) {
    return false;
  }
  saveProjects(filtered);
  return true;
}
