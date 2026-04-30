import { create } from 'zustand';

interface ChecklistItem {
  type: string;
  name: string;
  action?: string;
  checked: boolean;
  subtype?: string | string[];
}

interface ChecklistPage {
  title: string;
  items: ChecklistItem[];
}

interface ChecklistState {
  data: ChecklistPage[] | null;
  currentPageIndex: number;
  setData: (data: ChecklistPage[]) => void;
  setPage: (index: number) => void;
  loadDataset: (aircraft: string, datasetName: string) => Promise<void>;
}

export const useChecklistStore = create<ChecklistState>((set) => ({
  data: null,
  currentPageIndex: 0,
  setData: (data) => set({ data }),
  setPage: (currentPageIndex) => set({ currentPageIndex }),
  loadDataset: async (aircraft, datasetName) => {
    try {
      // Assuming we have static data for now
      const res = await fetch(`/data/${aircraft}/${datasetName}.json`);
      if (res.ok) {
        const data = await res.json();
        set({ data: data.pages || data, currentPageIndex: 0 });
      } else {
        // Fallback dummy data if fetch fails
        set({
           data: [
             {
               title: "PREFLIGHT",
               items: [
                 { type: "normal", name: "Oxygen", action: "TESTED, 100%", checked: false },
                 { type: "normal", name: "Navigation transfer and display switches", action: "NORMAL, AUTO", checked: false },
                 { type: "normal", name: "Window heat", action: "ON", checked: false }
               ]
             }
           ],
           currentPageIndex: 0
        });
      }
    } catch (e) {
      console.error("Failed to load dataset", e);
    }
  }
}));
