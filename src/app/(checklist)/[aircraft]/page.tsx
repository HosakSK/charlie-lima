"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useChecklistStore } from '@/hooks/store/useChecklistStore';
import { useSettingsStore } from '@/hooks/store/useSettingsStore';

export default function AircraftChecklistPage() {
  const params = useParams();
  const aircraft = params.aircraft as string;
  const [mounted, setMounted] = useState(false);

  // Stores
  const { data, loadDataset, currentPageIndex } = useChecklistStore();
  const { theme, datasetName } = useSettingsStore();

  useEffect(() => {
    setMounted(true);
    if (aircraft === 'b738') {
      loadDataset('b738', datasetName || 'europe');
    }
  }, [aircraft, datasetName, loadDataset]);

  useEffect(() => {
    if (mounted) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme, mounted]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {/* TopBar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
            {aircraft.substring(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide uppercase opacity-80">Charlie-Lima</h1>
            <h2 className="text-xl font-bold tracking-tight">{aircraft.toUpperCase()} Checklist</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {/* Settings button, Help button, etc. */}
           <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
           </button>
        </div>
      </header>

      {/* Main Checklist Container */}
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
         <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden">
            {data && data.length > 0 ? (
               <div className="p-6">
                  <h3 className="text-2xl font-bold mb-6 text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-4">
                     {data[currentPageIndex]?.title || 'Checklist'}
                  </h3>
                  
                  <div className="space-y-3">
                     {data[currentPageIndex]?.items.map((item: any, idx: number) => (
                        <div key={idx} className={`p-4 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer group ${item.checked ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500'}`}
                           onClick={() => {
                               const newData = [...data];
                               newData[currentPageIndex].items[idx].checked = !newData[currentPageIndex].items[idx].checked;
                               useChecklistStore.getState().setData(newData);
                           }}>
                           <div className="flex flex-col">
                              <span className={`font-bold text-lg ${item.checked ? 'text-green-700 dark:text-green-400 line-through opacity-70' : ''}`}>{item.name}</span>
                              {item.action && (
                                 <span className={`text-sm ${item.checked ? 'text-green-600 dark:text-green-500 opacity-70' : 'text-slate-500 dark:text-slate-400'}`}>{item.action}</span>
                              )}
                           </div>
                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.checked ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-blue-400'}`}>
                               {item.checked && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            ) : (
               <div className="p-12 text-center text-slate-500">Loading checklist data...</div>
            )}
         </div>
      </main>

      {/* Global Footer */}
      <footer className="sticky bottom-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4">
         <div className="flex items-center justify-between max-w-4xl mx-auto">
            <button 
               className="px-6 py-3 rounded-xl font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
               onClick={() => useChecklistStore.getState().setPage(Math.max(0, currentPageIndex - 1))}
               disabled={currentPageIndex === 0}
            >
               Previous
            </button>
            <div className="flex flex-col items-center">
               <div className="flex gap-1 mb-2">
                  {data?.map((_, idx) => (
                     <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentPageIndex ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  ))}
               </div>
               <span className="text-[10px] text-slate-400 font-mono">v3.0.1</span>
            </div>
            <button 
               className="px-6 py-3 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
               onClick={() => useChecklistStore.getState().setPage(Math.min((data?.length || 1) - 1, currentPageIndex + 1))}
               disabled={!data || currentPageIndex === data.length - 1}
            >
               Next
            </button>
         </div>
      </footer>
    </div>
  );
}
