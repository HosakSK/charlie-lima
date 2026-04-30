"use client";

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

export default function AircraftChecklistPage() {
  const params = useParams();
  const aircraft = (params.aircraft as string) || 'b738';
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const scriptsRef = useRef<HTMLScriptElement[]>([]);

  useEffect(() => {
    if (loaded) return;

    // Build the full original HTML body content
    if (containerRef.current) {
      containerRef.current.innerHTML = getOriginalHTML(aircraft);

      const loadScript = (src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = src;
          s.async = false;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error(`Failed to load ${src}`));
          document.body.appendChild(s);
          scriptsRef.current.push(s);
        });
      };

      (async () => {
        try {
          await loadScript('/data/data_index.js');
          const savedDs = localStorage.getItem('b738_dataset') || 'data/europe_style.js';
          await loadScript('/' + savedDs);
          await loadScript('/lang.js');
          await loadScript('/script.js');
          setLoaded(true);
        } catch (e) {
          console.error('Script load error:', e);
          try {
            await loadScript('/data/europe_style.js');
            await loadScript('/lang.js');
            await loadScript('/script.js');
            setLoaded(true);
          } catch (e2) { console.error('Fallback failed:', e2); }
        }
      })();
    }

    return () => {
      scriptsRef.current.forEach(s => s.remove());
      scriptsRef.current = [];
    };
  }, [aircraft, loaded]);

  return <div ref={containerRef} id="app-root" />;
}

function getOriginalHTML(aircraft: string): string {
  return `
  <div id="global-progress-bar" class="global-progress-bar"><div id="global-progress-fill" class="global-progress-fill"></div></div>
  <div id="top-bar" class="top-bar">
    <div class="top-bar-left">
      <svg class="top-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="var(--color-accent)"/><path d="M20.5,15.5v-2l-7-4v-5c0-.83-.67-1.5-1.5-1.5-1.04,0-1.5.85-1.5,1.5v5l-7,4v2l7-2.2v4.7l-2,1.5v1.5l3.2-1,3.3,1v-1.5l-2-1.5v-4.7l7,2.2h.5Z" fill="#fff"/></svg>
      <span class="top-subtitle">Charlie-Lima.eu</span>
      <span id="global-title" class="global-title">${aircraft.toUpperCase()} Normal Procedure Checklist</span>
      <span id="global-flight-info" class="global-flight-info"></span>
    </div>
    <button id="top-settings-btn" class="top-hamburger" title="Settings"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg></button>
  </div>
  <div id="top-settings" class="top-settings">
    <div class="toggle-group" style="padding-bottom:15px;border-bottom:1px solid rgba(128,128,128,0.2);margin-bottom:5px;">
      <span class="toggle-label">Profile</span>
      <div class="custom-select-wrapper" style="width:260px;z-index:9999;">
        <input type="text" class="brief-input custom-select-trigger" id="dataset-dropdown-trigger" tabindex="0" readonly value="Selecting..." style="cursor:pointer;width:100%;">
        <div class="custom-select-options" id="dataset-dropdown-options" style="width:100%;"></div>
        <input type="hidden" id="b-dataset-type" value="">
      </div>
    </div>
    <div class="toggle-group"><span class="toggle-label">Day/Night</span><label class="switch"><input type="checkbox" id="top-theme-toggle"><span class="slider round"></span></label></div>
    <div class="toggle-group"><span class="toggle-label">Mute</span><label class="switch"><input type="checkbox" id="top-mute-toggle"><span class="slider round"></span></label></div>
    <div class="toggle-group"><span class="toggle-label">Male Voice</span><label class="switch"><input type="checkbox" id="top-male-voice-toggle"><span class="slider round"></span></label></div>
    <div class="toggle-group"><span class="toggle-label">Mono Font</span><label class="switch"><input type="checkbox" id="top-font-toggle"><span class="slider round"></span></label></div>
    <div class="toggle-group"><span class="toggle-label">Disable Timer</span><label class="switch"><input type="checkbox" id="top-disable-timer-toggle"><span class="slider round"></span></label></div>
    <div class="toggle-group" id="top-read-cl-only-container"><span class="toggle-label">Read CL Only</span><label class="switch"><input type="checkbox" id="top-read-cl-only-toggle"><span class="slider round"></span></label></div>
    <div class="toggle-group" id="top-checklist-toggle-container" style="display:none;"><span class="toggle-label">Hide Flow</span><label class="switch"><input type="checkbox" id="top-checklist-only-toggle"><span class="slider round"></span></label></div>
    <div class="toggle-group" id="top-briefing-toggle-container"><span class="toggle-label">Show Briefing</span><label class="switch"><input type="checkbox" id="top-briefing-toggle"><span class="slider round"></span></label></div>
    <div class="toggle-group" id="top-hide-tests-container" style="display:none;"><span class="toggle-label">Hide Tests</span><label class="switch"><input type="checkbox" id="top-hide-tests-toggle"><span class="slider round"></span></label></div>
    <div class="toggle-group" id="top-simplify-container" style="display:none;"><span class="toggle-label">Simplify</span><label class="switch"><input type="checkbox" id="top-simplify-toggle"><span class="slider round"></span></label></div>
    <div class="toggle-group" style="margin-top:10px;width:100%;justify-content:center;border-top:1px dashed rgba(128,128,128,0.2);padding-top:20px;flex-direction:column;">
      <button id="help-footer-btn" class="help-link" style="width:100%;text-align:center;text-transform:uppercase;">Help Guide</button>
      <button id="reset-settings-btn" class="help-link" style="width:100%;text-align:center;text-transform:uppercase;">Reset Settings</button>
    </div>
  </div>
  <div id="quick-nav-dropdown" class="quick-nav-dropdown hidden"></div>
  <div class="fab-group">
    <button id="fab-btn" class="fab fab-briefing" title="Flight Briefing"></button>
    <button id="mic-btn" class="fab fab-mic" title="Voice Mode"></button>
  </div>
  <audio id="audio-click" src="/knock.wav" preload="auto"></audio>
  <div id="voice-bar" class="voice-bar hidden">
    <div class="voice-bar-inner">
      <span class="voice-dot"></span>
      <div id="voice-equalizer" class="equalizer"><span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span></div>
      <button id="voice-stop-btn" class="voice-stop">&#9658; Start</button>
    </div>
  </div>
  <div id="overlay" class="overlay hidden">
    <div id="overlay-panel" class="overlay-panel">
      <button id="overlay-close" class="overlay-close">&#10005;</button>
      <section class="overlay-section">
        <div class="overlay-panel-header" id="overlay-drag-handle"><h3 class="overlay-section-title">Flight Briefing</h3></div>
        <div class="brief-row brief-flight-row">
          <div class="brief-flight">
            <input type="text" id="b-callsign" class="brief-input brief-short callsign-input" placeholder="RYR123" maxlength="8">
            <span class="brief-arrow">|</span>
            <input type="text" id="b-origin" class="brief-input brief-short" placeholder="ICAO" maxlength="4">
            <span class="brief-arrow">&#10145;</span>
            <input type="text" id="b-dest" class="brief-input brief-short" placeholder="ICAO" maxlength="4">
          </div>
        </div>
        <div class="brief-group-label accordion-label" id="label-dep">DEPARTURE <span class="accordion-icon">&#9660;</span></div>
        <div id="content-dep" class="brief-accordion">
          <div class="brief-row"><div class="brief-field"><label>ATIS</label><input type="text" id="b-dep-atis" class="brief-input brief-xs" maxlength="1" placeholder="A"></div><div class="brief-field"><label>QNH</label><input type="text" id="b-dep-qnh" class="brief-input brief-sm" maxlength="4" placeholder="1013"></div><div class="brief-field"><label>RWY</label><input type="text" id="b-dep-rwy" class="brief-input brief-xs2" maxlength="3" placeholder="36L"></div><div class="brief-field"><label>RWY HDG</label><input type="text" id="b-dep-rwy-hdg" class="brief-input brief-sm" maxlength="3" placeholder="358"></div><div class="brief-field brief-grow"><label>SID</label><input type="text" id="b-sid" class="brief-input" maxlength="9" placeholder="EVIVI1A"></div></div>
          <div class="brief-row"><div class="brief-field"><label>INIT ALT</label><input type="text" id="b-init-alt" class="brief-input brief-med" maxlength="5" placeholder="5000"></div><div class="brief-field"><label>TA</label><input type="text" id="b-dep-tl" class="brief-input brief-xs2" maxlength="3" placeholder="60"></div><div class="brief-field"><label>SQUAWK</label><input type="text" id="b-squawk" class="brief-input brief-sm" maxlength="4" placeholder="2200"></div><div class="brief-field"><label>DEW PT</label><input type="text" id="b-dep-dewpt" class="brief-input brief-sm" maxlength="4" placeholder="12"></div><div class="brief-field"><label>TEMP</label><input type="text" id="b-dep-temp" class="brief-input brief-sm" maxlength="4" placeholder="18"></div><div class="brief-field"><label>WIND</label><input type="text" id="b-dep-wind" class="brief-input brief-med" maxlength="7" placeholder="270/12"></div><div class="brief-field"><label>TOTAL FUEL</label><input type="text" id="b-total-fuel" class="brief-input brief-med" maxlength="6" placeholder="15000"></div><div class="brief-field"><label>TRIP FUEL</label><input type="text" id="b-trip-fuel" class="brief-input brief-med" maxlength="6" placeholder="10000"></div><div class="brief-field"><label>RESERVE</label><input type="text" id="b-reserve-fuel" class="brief-input brief-med" maxlength="6" placeholder="3000"></div></div>
          <div class="brief-row"><div class="brief-field"><label>V1</label><input type="text" id="b-v1" class="brief-input brief-xs2" maxlength="3" placeholder="138"></div><div class="brief-field"><label>VR</label><input type="text" id="b-vr" class="brief-input brief-xs2" maxlength="3" placeholder="142"></div><div class="brief-field"><label>V2</label><input type="text" id="b-v2" class="brief-input brief-xs2" maxlength="3" placeholder="148"></div><div class="brief-field"><label>TRIM</label><input type="text" id="b-trim" class="brief-input brief-xs2" maxlength="3" placeholder="5.0"></div><div class="brief-field"><label>FLAPS</label><input type="text" id="b-dep-flaps" class="brief-input brief-xs2" maxlength="2" placeholder="5"></div><div class="brief-field"><label>ASS.T</label><input type="text" id="b-dep-assumed" class="brief-input brief-xs2" maxlength="3" placeholder="50"></div></div>
          <div class="brief-row"><div class="brief-field brief-fullwidth"><label>TAXI OUT</label><input type="text" id="b-taxi-out" class="brief-input" placeholder="e.g. A3 → B → RWY 36L"></div></div>
        </div>
        <div class="brief-group-label accordion-label" id="label-arr">ARRIVAL <span class="accordion-icon">&#9660;</span></div>
        <div id="content-arr" class="brief-accordion">
          <div class="brief-row"><div class="brief-field"><label>ATIS</label><input type="text" id="b-arr-atis" class="brief-input brief-xs" maxlength="1" placeholder="B"></div><div class="brief-field"><label>QNH</label><input type="text" id="b-arr-qnh" class="brief-input brief-sm" maxlength="4" placeholder="1010"></div><div class="brief-field"><label>RWY</label><input type="text" id="b-arr-rwy" class="brief-input brief-xs2" maxlength="3" placeholder="28R"></div><div class="brief-field" style="width:120px;"><label>APPR.</label><div class="custom-select-wrapper"><input type="text" class="brief-input custom-select-trigger unfilled" id="landing-dropdown-trigger" tabindex="0" readonly value="ILS Cat.III" style="cursor:pointer;"><div class="custom-select-options" id="landing-dropdown-options"><div class="custom-option" data-val="3">ILS Cat.III</div><div class="custom-option" data-val="2">ILS Cat.I/II</div><div class="custom-option" data-val="1">RNAV</div></div><input type="hidden" id="b-landing-type" value=""></div></div><div class="brief-field"><label>TL</label><input type="text" id="b-arr-ta" class="brief-input brief-sm" maxlength="5" placeholder="5000"></div><div class="brief-field brief-grow"><label>STAR</label><input type="text" id="b-star" class="brief-input" maxlength="9" placeholder="BALTU2B"></div></div>
          <div class="brief-row"><div class="brief-field"><label>DEW PT</label><input type="text" id="b-arr-dewpt" class="brief-input brief-sm" maxlength="4" placeholder="10"></div><div class="brief-field"><label>TEMP</label><input type="text" id="b-arr-temp" class="brief-input brief-sm" maxlength="4" placeholder="15"></div><div class="brief-field"><label>WIND</label><input type="text" id="b-arr-wind" class="brief-input brief-med" maxlength="7" placeholder="180/08"></div></div>
          <div class="brief-row"><div class="brief-field"><label>ILS FREQ</label><input type="text" id="b-ils-freq" class="brief-input brief-med" maxlength="6" placeholder="110.30"></div><div class="brief-field"><label>COURSE</label><input type="text" id="b-course" class="brief-input brief-xs2" maxlength="3" placeholder="280"></div><div class="brief-field"><label>MINIMA</label><input type="text" id="b-minima" class="brief-input brief-sm" maxlength="4" placeholder="320"></div><div class="brief-field"><label>GA ALT</label><input type="text" id="b-ga-alt" class="brief-input brief-med" maxlength="5" placeholder="3000"></div></div>
          <div class="brief-row"><div class="brief-field"><label>VREF</label><input type="text" id="b-vref" class="brief-input brief-xs2" maxlength="3" placeholder="136"></div><div class="brief-field"><label>FLAPS</label><input type="text" id="b-arr-flaps" class="brief-input brief-xs2" maxlength="2" placeholder="30"></div><div class="brief-field"><label>AUTOBRK</label><input type="text" id="b-autobrake" class="brief-input brief-xs2" maxlength="1" placeholder="2"></div></div>
          <div class="brief-row"><div class="brief-field brief-grow"><label>TAXI IN</label><input type="text" id="b-taxi-in" class="brief-input" placeholder="e.g. A → B2 → GATE C14"></div><div class="brief-field"><label>GATE</label><input type="text" id="b-gate" class="brief-input brief-sm" maxlength="5" placeholder="C14"></div></div>
        </div>
        <div class="brief-group-label">NOTES</div>
        <textarea id="b-notes" class="brief-textarea" placeholder="Additional notes..."></textarea>
        <div class="brief-actions"><button id="brief-clear" class="brief-btn-clear">Clear All</button></div>
      </section>
    </div>
  </div>
  <div id="help-overlay" class="help-overlay hidden">
    <div class="help-panel">
      <div class="help-header-flex">
        <h2 class="help-title">📋 B738 Checklist Guide</h2>
        <div class="help-lang-switch"><select id="help-lang-select"><option value="en" selected>EN</option><option value="de">DE</option><option value="it">IT</option><option value="es">ES</option><option value="cz">CZ</option><option value="pl">PL</option><option value="hu">HU</option><option value="fr">FR</option></select></div>
        <button id="help-close" class="overlay-close">&#10005;</button>
      </div>
      <div id="help-content-container"></div>
    </div>
  </div>
  <div id="briefing-info-overlay" class="help-overlay hidden">
    <div class="help-panel" style="max-width:400px;text-align:center;">
      <h2 class="help-title" style="margin-bottom:20px;">Flight Briefing</h2>
      <p style="margin:15px 0;font-size:1rem;line-height:1.5;">To use the dynamic Flight Briefing feature, you must fill in your flight variables using the Notepad (FAB button). The briefing sentences will automatically adapt to your inputs and hide if information is missing.</p>
      <p style="font-size:0.9rem;color:#888;margin-bottom:25px;">Examples to fill: QNH (1013), RWY (36L), V2 (148)</p>
      <label style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:20px;cursor:pointer;font-size:0.9rem;"><input type="checkbox" id="briefing-info-dont-show"> Do not show again</label>
      <button id="briefing-info-close" class="header-btn" style="margin:auto;width:100px;">Got it</button>
    </div>
  </div>
  <div class="app-container">
    <header>
      <h2 id="page-title">Loading...</h2>
      <div class="header-actions">
        <button id="reset-phase-btn" class="header-btn" title="Reset Phase"><img src="/icons/reset.svg" width="24" height="24" alt="Reset"><span>RESET</span></button>
        <button id="turnaround-phase-btn" class="header-btn turnaround-header-btn hidden" title="Load Turnaround Flight"><img src="/icons/turnaround.svg" width="24" height="24" alt="Turnaround"><span>TURNAROUND</span></button>
        <button id="hamburger-btn" class="hamburger-btn" title="Quick Jump"><span></span><span></span><span></span></button>
      </div>
    </header>
    <main><div id="checklist-container" class="checklist"></div></main>
    <footer>
      <div class="progress-bar"><div id="progress" class="progress-fill"></div></div>
      <div class="controls"><button id="btn-prev" disabled>Prev</button><button id="btn-next" disabled>Next</button></div>
    </footer>
  </div>
  <div id="action-timer-overlay" class="action-timer-overlay hidden">
    <div class="action-timer-box">
      <button id="action-timer-close" class="action-timer-close">&#10005;</button>
      <svg class="action-timer-ring" width="160" height="160" viewBox="0 0 160 160"><circle class="ring-bg" cx="80" cy="80" r="72" stroke-width="8" fill="none"/><circle class="ring-fg" id="action-timer-circle" cx="80" cy="80" r="72" stroke-width="8" fill="none" stroke-linecap="round"/></svg>
      <div class="action-timer-content"><div class="action-timer-time" id="action-timer-time">02:00</div><div class="action-timer-label" id="action-timer-label">APU START</div></div>
    </div>
  </div>
  <div class="global-footer">
    <span class="version-info">v3.0.6</span>
    <span class="sim-warning">For flight simulation use only.<br>Not for real-world flight.</span>
  </div>`;
}
