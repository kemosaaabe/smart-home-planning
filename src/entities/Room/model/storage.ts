import { type Room } from './types';
import { storageKey } from './constants';

function getAllRooms(): Room[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as Room[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRooms(rooms: Room[]): void {
  localStorage.setItem(storageKey, JSON.stringify(rooms));
}

export function getRooms(projectId: number): Room[] {
  return getAllRooms().filter((r) => r.projectId === projectId);
}

export function addRoom(
  projectId: number,
  data: { name: string; description?: string }
): Room {
  const all = getAllRooms();
  const nextId =
    all.length > 0 ? Math.max(...all.map((r) => r.id), 0) + 1 : 1;
  const room: Room = {
    id: nextId,
    name: data.name,
    description: data.description,
    projectId,
    updatedAt: new Date().toISOString(),
  };
  saveRooms([...all, room]);
  return room;
}

export function updateRoom(
  id: number,
  data: { name?: string; description?: string }
): Room | null {
  const all = getAllRooms();
  const index = all.findIndex((r) => r.id === id);
  if (index === -1) return null;
  const updated: Room = {
    ...all[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  const next = [...all];
  next[index] = updated;
  saveRooms(next);
  return updated;
}

export function deleteRoom(id: number): boolean {
  const all = getAllRooms();
  const filtered = all.filter((r) => r.id !== id);
  if (filtered.length === all.length) return false;
  saveRooms(filtered);
  return true;
}
