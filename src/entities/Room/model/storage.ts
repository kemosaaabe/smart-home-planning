import { type Room } from './types';
import { storageKey, defaultRoomsForApartment } from './constants';

function initRooms(): void {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw != null && raw !== '') {
      const parsed = JSON.parse(raw) as Room[];
      const hasNewFormat =
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        'updatedAt' in parsed[0];
      if (hasNewFormat) {
        return;
      }
    }
    localStorage.setItem(storageKey, JSON.stringify(defaultRoomsForApartment));
  } catch {
    localStorage.setItem(storageKey, JSON.stringify(defaultRoomsForApartment));
  }
}

export function getRooms(projectId: number): Room[] {
  initRooms();
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as Room[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((r) => r.projectId === projectId);
  } catch {
    return [];
  }
}
