import { create } from 'zustand';
import type { Room } from '@/entities/Room';

interface RoomFormState {
  isOpen: boolean;
  editRoom: Room | null;
  createProjectId: number | null;
  roomsVersion: number;
  openForCreate: (projectId: number) => void;
  openForEdit: (room: Room) => void;
  close: () => void;
  setOpen: (open: boolean) => void;
  bumpRoomsVersion: () => void;
}

export const useRoomFormStore = create<RoomFormState>((set) => ({
  isOpen: false,
  editRoom: null,
  createProjectId: null,
  roomsVersion: 0,

  openForCreate: (projectId) => {
    set({ isOpen: true, editRoom: null, createProjectId: projectId });
  },

  openForEdit: (room) => {
    set({ isOpen: true, editRoom: room, createProjectId: null });
  },

  close: () => {
    set({ isOpen: false, editRoom: null, createProjectId: null });
  },

  setOpen: (isOpen) => {
    set((state) => ({
      isOpen,
      editRoom: isOpen ? state.editRoom : null,
      createProjectId: isOpen ? state.createProjectId : null,
    }));
  },

  bumpRoomsVersion: () => {
    set((state) => ({ roomsVersion: state.roomsVersion + 1 }));
  },
}));
