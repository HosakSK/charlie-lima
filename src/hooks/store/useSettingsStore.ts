import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark';
  isMuted: boolean;
  isMaleVoice: boolean;
  isMonoFont: boolean;
  isTimerDisabled: boolean;
  isReadCLOnly: boolean;
  isChecklistOnly: boolean;
  showBriefing: boolean;
  hideTests: boolean;
  isSimplified: boolean;
  datasetFile: string;

  setTheme: (t: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setMuted: (v: boolean) => void;
  setMaleVoice: (v: boolean) => void;
  setMonoFont: (v: boolean) => void;
  setTimerDisabled: (v: boolean) => void;
  setReadCLOnly: (v: boolean) => void;
  setChecklistOnly: (v: boolean) => void;
  setShowBriefing: (v: boolean) => void;
  setHideTests: (v: boolean) => void;
  setSimplified: (v: boolean) => void;
  setDatasetFile: (f: string) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  theme: 'light' as const,
  isMuted: false,
  isMaleVoice: false,
  isMonoFont: false,
  isTimerDisabled: false,
  isReadCLOnly: false,
  isChecklistOnly: false,
  showBriefing: true,
  hideTests: false,
  isSimplified: false,
  datasetFile: 'data/europe_style.js',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setMuted: (v) => set({ isMuted: v }),
      setMaleVoice: (v) => set({ isMaleVoice: v }),
      setMonoFont: (v) => set({ isMonoFont: v }),
      setTimerDisabled: (v) => set({ isTimerDisabled: v }),
      setReadCLOnly: (v) => set({ isReadCLOnly: v }),
      setChecklistOnly: (v) => set({ isChecklistOnly: v }),
      setShowBriefing: (v) => set({ showBriefing: v }),
      setHideTests: (v) => set({ hideTests: v }),
      setSimplified: (v) => set({ isSimplified: v }),
      setDatasetFile: (f) => set({ datasetFile: f }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'b738-settings',
    }
  )
);
