import { create } from 'zustand';

export interface ChecklistItem {
  name: string;
  action: string;
  type: string;            // 'flow' | 'checklist item' | 'briefing'
  subtype?: string;        // 'test' | 'subtitle' etc.
  ifturnaround?: string;   // 'yes' | 'no'
  checked: boolean;
  timer?: string;
  timerContinuous?: string;
  timerLabel?: string;
  timerAnnouncement?: string;
  timerWarning?: string;
  briefing?: string[];
  [key: string]: unknown;
}

export interface ChecklistPage {
  title: string;
  items: ChecklistItem[];
}

interface DatasetInfo {
  title: string;
  file: string;
}

interface ChecklistState {
  aircraft: string;
  data: ChecklistPage[];
  currentPageIndex: number;
  availableDatasets: DatasetInfo[];
  isTurnaround: boolean;
  isDataLoaded: boolean;

  setAircraft: (a: string) => void;
  setData: (d: ChecklistPage[]) => void;
  setAvailableDatasets: (ds: DatasetInfo[]) => void;
  setPage: (i: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  toggleCheck: (itemIdx: number, silent?: boolean) => void;
  resetPhase: () => void;
  loadTurnaround: () => void;
  setTurnaround: (v: boolean) => void;
  setDataLoaded: (v: boolean) => void;
}

export const useChecklistStore = create<ChecklistState>((set, get) => ({
  aircraft: 'b738',
  data: [],
  currentPageIndex: 0,
  availableDatasets: [],
  isTurnaround: false,
  isDataLoaded: false,

  setAircraft: (a) => set({ aircraft: a }),
  setData: (d) => {
    // Ensure all items have `checked` field
    const withChecked = d.map(page => ({
      ...page,
      items: page.items.map(item => ({ ...item, checked: item.checked ?? false })),
    }));
    set({ data: withChecked, isDataLoaded: true });
  },
  setAvailableDatasets: (ds) => set({ availableDatasets: ds }),
  setPage: (i) => set({ currentPageIndex: i }),
  nextPage: () => {
    const { currentPageIndex, data } = get();
    if (currentPageIndex < data.length - 1) {
      set({ currentPageIndex: currentPageIndex + 1 });
    }
  },
  prevPage: () => {
    const { currentPageIndex } = get();
    if (currentPageIndex > 0) {
      set({ currentPageIndex: currentPageIndex - 1 });
    }
  },
  toggleCheck: (itemIdx) => {
    const { data, currentPageIndex } = get();
    const newData = data.map((page, pi) => {
      if (pi !== currentPageIndex) return page;
      return {
        ...page,
        items: page.items.map((item, ii) => {
          if (ii !== itemIdx) return item;
          return { ...item, checked: !item.checked };
        }),
      };
    });
    set({ data: newData });
  },
  resetPhase: () => {
    const { data, currentPageIndex } = get();
    const newData = data.map((page, pi) => {
      if (pi !== currentPageIndex) return page;
      return {
        ...page,
        items: page.items.map(item => ({ ...item, checked: false })),
      };
    });
    set({ data: newData });
  },
  loadTurnaround: () => {
    const { data } = get();
    // Reset all checks, find first turnaround page
    const newData = data.map(page => ({
      ...page,
      items: page.items.map(item => ({ ...item, checked: false })),
    }));
    // Find first page that has turnaround items
    let turnaroundStart = 0;
    for (let i = 0; i < newData.length; i++) {
      if (newData[i].items.some(it => it.ifturnaround === 'yes')) {
        turnaroundStart = i;
        break;
      }
    }
    set({ data: newData, isTurnaround: true, currentPageIndex: turnaroundStart });
  },
  setTurnaround: (v) => set({ isTurnaround: v }),
  setDataLoaded: (v) => set({ isDataLoaded: v }),
}));
