import { create } from 'zustand';

interface MacGalleryState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const useAppStore = create<MacGalleryState>((set) => ({
  isDarkMode: true,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
