import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark';
  datasetName: string;
  turnaroundMode: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setDatasetName: (name: string) => void;
  setTurnaroundMode: (mode: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      datasetName: 'europe',
      turnaroundMode: false,
      setTheme: (theme) => set({ theme }),
      setDatasetName: (datasetName) => set({ datasetName }),
      setTurnaroundMode: (turnaroundMode) => set({ turnaroundMode })
    }),
    {
      name: 'b738-settings'
    }
  )
);
