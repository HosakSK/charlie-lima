import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BriefingState {
  callsign: string;
  origin: string;
  dest: string;
  depAtis: string;
  depQnh: string;
  depRwy: string;
  depRwyHdg: string;
  sid: string;
  initAlt: string;
  depTl: string;
  squawk: string;
  depDewpt: string;
  depTemp: string;
  depWind: string;
  totalFuel: string;
  tripFuel: string;
  reserveFuel: string;
  v1: string;
  vr: string;
  v2: string;
  trim: string;
  depFlaps: string;
  depAssumed: string;
  taxiOut: string;
  arrAtis: string;
  arrQnh: string;
  arrRwy: string;
  landingType: string;
  arrTa: string;
  star: string;
  arrDewpt: string;
  arrTemp: string;
  arrWind: string;
  ilsFreq: string;
  course: string;
  minima: string;
  gaAlt: string;
  vref: string;
  arrFlaps: string;
  autobrake: string;
  taxiIn: string;
  gate: string;
  notes: string;

  setField: (field: string, value: string) => void;
  clearAll: () => void;
}

const defaultBriefing: Omit<BriefingState, 'setField' | 'clearAll'> = {
  callsign: '', origin: '', dest: '',
  depAtis: '', depQnh: '', depRwy: '', depRwyHdg: '', sid: '',
  initAlt: '', depTl: '', squawk: '', depDewpt: '', depTemp: '', depWind: '',
  totalFuel: '', tripFuel: '', reserveFuel: '',
  v1: '', vr: '', v2: '', trim: '', depFlaps: '', depAssumed: '',
  taxiOut: '',
  arrAtis: '', arrQnh: '', arrRwy: '', landingType: '', arrTa: '', star: '',
  arrDewpt: '', arrTemp: '', arrWind: '',
  ilsFreq: '', course: '', minima: '', gaAlt: '',
  vref: '', arrFlaps: '', autobrake: '',
  taxiIn: '', gate: '', notes: '',
};

export const useBriefingStore = create<BriefingState>()(
  persist(
    (set) => ({
      ...defaultBriefing,
      setField: (field, value) => set({ [field]: value }),
      clearAll: () => set(defaultBriefing),
    }),
    {
      name: 'b738-briefing',
    }
  )
);
