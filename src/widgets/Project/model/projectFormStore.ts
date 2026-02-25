import { create } from 'zustand';
import type { Project } from '@/entities/Project';

interface ProjectFormState {
  isOpen: boolean;
  editProject: Project | null;
  projectsVersion: number;
  open: () => void;
  close: () => void;
  openForEdit: (project: Project) => void;
  setOpen: (open: boolean) => void;
  bumpProjectsVersion: () => void;
}

export const useProjectFormStore = create<ProjectFormState>((set) => ({
  isOpen: false,
  editProject: null,
  projectsVersion: 0,

  open: () => {
    set({ isOpen: true, editProject: null });
  },

  close: () => {
    set({ isOpen: false, editProject: null });
  },

  openForEdit: (project) => {
    set({ isOpen: true, editProject: project });
  },

  setOpen: (isOpen) => {
    set((state) => ({
      isOpen,
      editProject: isOpen ? state.editProject : null,
    }));
  },

  bumpProjectsVersion: () => {
    set((state) => ({ projectsVersion: state.projectsVersion + 1 }));
  },
}));
