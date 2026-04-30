"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useChecklistStore } from '@/hooks/store/useChecklistStore';
import { useSettingsStore } from '@/hooks/store/useSettingsStore';
import { useVoiceEngine } from '@/hooks/useVoiceEngine';

export default function AircraftChecklistPage() {
  const params = useParams();
  const aircraft = params.aircraft as string;
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickNavOpen, setQuickNavOpen] = useState(false);

  // Stores
  const { data, loadDataset, currentPageIndex, setPage, setData } = useChecklistStore();
  const { theme, datasetName, setTheme, turnaroundMode, setTurnaroundMode } = useSettingsStore();
  const { isListening, toggleListening } = useVoiceEngine();

  useEffect(() => {
    setMounted(true);
    if (aircraft === 'b738') {
      loadDataset('b738', datasetName || 'europe');
    }
  }, [aircraft, datasetName, loadDataset]);

  useEffect(() => {
    if (mounted) {
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
  }, [theme, mounted]);

  if (!mounted) return null;

  const currentPage = data ? data[currentPageIndex] : null;
  const isLastPage = data && currentPageIndex === data.length - 1;

  const visibleItems = currentPage?.items.filter((item: any) => {
    if (turnaroundMode && item.ifturnaround === 'skip') return false;
    return true;
  }) || [];

  const allItemsChecked = visibleItems.every((i: any) => i.checked || i.type === 'briefing') || false;
  
  const handleItemToggle = (idx: number) => {
    if (!data) return;
    const newData = [...data];
    const actualIdx = newData[currentPageIndex].items.findIndex((x: any) => x.name === visibleItems[idx].name);
    if(actualIdx !== -1) {
      const item = newData[currentPageIndex].items[actualIdx];
      item.checked = !item.checked;
      setData(newData);
    }
  };

  // Progress logic
  const totalItems = visibleItems.length;
  const checkedItems = visibleItems.filter((i: any) => i.checked || i.type === 'briefing').length;
  const progressPercent = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;
  
  const allVisibleItems = data?.flatMap(p => p.items.filter((item: any) => !(turnaroundMode && item.ifturnaround === 'skip'))) || [];
  const checkedAllItems = allVisibleItems.filter((i: any) => i.checked || i.type === 'briefing').length;
  const globalProgressPercent = allVisibleItems.length > 0 ? (checkedAllItems / allVisibleItems.length) * 100 : 0;

  return (
    <>
      <div className="global-progress-bar">
        <div className="global-progress-fill" style={{ width: `${globalProgressPercent}%` }}></div>
      </div>

      <header className="top-bar">
          <div className="top-bar-left">
              <img src="/icons/favicon.svg" alt="Charlie-Lima Logo" className="top-logo" />
              <div className="top-subtitle">Charlie-Lima</div>
              <div className="global-title" id="global-title">{aircraft.toUpperCase()} Normal Procedure Checklist</div>
              <div className="global-flight-info" id="global-flight-info">v3.0.4</div>
          </div>
          <button className={`hamburger-btn ${settingsOpen ? 'open' : ''}`} onClick={() => setSettingsOpen(!settingsOpen)}>
              <span></span><span></span><span></span>
          </button>
      </header>

      <div className={`top-settings ${settingsOpen ? 'show' : ''}`}>
          <div className="toggle-group">
              <span className="toggle-label">Dark Mode</span>
              <label className="switch">
                  <input type="checkbox" checked={theme === 'dark'} onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')} />
                  <span className="slider round"></span>
              </label>
          </div>
      </div>

      <div className="app-container">
          <header style={{ position: 'relative' }}>
              <button className={`header-btn ${quickNavOpen ? 'active' : ''}`} onClick={() => setQuickNavOpen(!quickNavOpen)}>
                  <span>Quick Nav</span>
              </button>
              
              <div className={`quick-nav-dropdown ${quickNavOpen ? '' : 'hidden'}`}>
                 {data?.map((page, idx) => (
                    <button key={idx} className={`qnav-btn ${idx === currentPageIndex ? 'active' : ''}`} onClick={() => { setPage(idx); setQuickNavOpen(false); }}>
                       {page.title}
                    </button>
                 ))}
              </div>

              <div className="header-actions">
                  <button className={`header-btn ${turnaroundMode ? 'active' : ''}`} onClick={() => setTurnaroundMode(!turnaroundMode)}>
                      <span>Turnaround</span>
                  </button>
              </div>
          </header>

          <h2 id="page-title">{currentPage?.title || 'Loading...'}</h2>
          
          <main id="checklist-container">
             <div className="checklist animate">
                {visibleItems.map((item: any, idx: number) => (
                   <div key={idx} className={`checklist-item ${item.checked ? 'checked' : ''} ${item.type === 'briefing' ? 'briefing-item' : ''}`} onClick={() => handleItemToggle(idx)}>
                      <div className="item-text">
                         <span className="item-name">{item.name}</span>
                         {item.type !== 'briefing' && <span className="dots"></span>}
                         {item.type !== 'briefing' && <span className="item-action">{item.action}</span>}
                      </div>
                      <div className="custom-checkbox"></div>
                   </div>
                ))}
             </div>
          </main>
          
          <footer>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progressPercent}%` }}></div></div>
              <div className="controls">
                  <button id="btn-prev" onClick={() => setPage(Math.max(0, currentPageIndex - 1))} disabled={currentPageIndex === 0}>
                     Previous
                  </button>
                  <button id="btn-next" className={!allItemsChecked ? 'next-tooltip-active' : ''} onClick={() => setPage(Math.min((data?.length || 1) - 1, currentPageIndex + 1))} disabled={!data || isLastPage || !allItemsChecked}>
                     Next
                  </button>
              </div>
          </footer>
      </div>

      <div className="global-footer">
          <div className="version-info">v3.0.5 - Next.js Rewrite</div>
          <div className="sim-warning">NOT FOR REAL WORLD AVIATION. FOR FLIGHT SIMULATION USE ONLY.</div>
          <button className="help-link">View Documentation</button>
      </div>

      <div className="fab-group">
          <button className="fab fab-timer" title="Open Timer"></button>
          <button className="fab fab-briefing" title="Open Briefing" onClick={() => {
              alert("Briefing Panel: Coming soon in full Next.js components");
          }}></button>
          <button className={`fab fab-mic ${isListening ? 'active' : ''}`} title="Voice Assistant" onClick={toggleListening}></button>
      </div>

      <div id="briefing-overlay" className="overlay hidden">
          <div className="overlay-panel">
              <div className="overlay-panel-header"><h2>Flight Briefing</h2></div>
              {/* Briefing form will go here */}
              <button className="btn-primary mt-4" onClick={() => document.getElementById('briefing-overlay')?.classList.add('hidden')}>Close</button>
          </div>
      </div>
    </>
  );
}
