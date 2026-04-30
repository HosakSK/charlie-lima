import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark';
  datasetName: string;
  setTheme: (theme: 'light' | 'dark') => void;
  setDatasetName: (name: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      datasetName: 'europe',
      setTheme: (theme) => set({ theme }),
      setDatasetName: (datasetName) => set({ datasetName })
    }),
    {
      name: 'b738-settings'
    }
  )
);
