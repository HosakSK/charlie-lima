import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BriefingState {
  variables: Record<string, string>;
  setVariable: (key: string, value: string) => void;
  clearVariables: () => void;
}

export const useBriefingStore = create<BriefingState>()(
  persist(
    (set) => ({
      variables: {},
      setVariable: (key, value) => set((state) => ({
        variables: { ...state.variables, [key]: value }
      })),
      clearVariables: () => set({ variables: {} })
    }),
    {
      name: 'b738-briefing'
    }
  )
);
