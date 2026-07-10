let allFlights = [];

const DOM = {
  grid: document.getElementById('flights-grid'),
  count: document.getElementById('results-count'),
  filterOrigin: document.getElementById('filter-origin'),
  filterDest: document.getElementById('filter-dest'),
  btnSwap: document.getElementById('btn-swap-route'),
  simFilters: document.getElementById('sim-filters'),
  liveFilters: document.getElementById('live-filters'),
  filterDay: document.getElementById('filter-day'),
  filterTimeFrom: document.getElementById('filter-time-from'),
  filterTimeTo: document.getElementById('filter-time-to'),
  filterHours: document.getElementById('filter-hours'),
  hoursLabel: document.getElementById('hours-label'),
  filterDuration: document.getElementById('filter-duration'),
  durationLabel: document.getElementById('duration-label'),
  filterDurationMin: document.getElementById('filter-duration-min'),
  durationMinLabel: document.getElementById('duration-min-label'),
  filterHomebase: document.getElementById('filter-homebase'),
  filterCallsign: document.getElementById('filter-callsign'),
  sortBy: document.getElementById('sort-by'),
  resetBtn: document.getElementById('reset-filters'),
  showUtc: document.getElementById('show-utc'),
  toast: document.getElementById('toast'),
  btnTheme: document.getElementById('theme-toggle')
};


async function init() {
  initTheme();
  try {
    const res = await fetch('/finder/ryanair_flights_lzib.json');
    allFlights = await res.json();
    setupListeners();
    applyFilters();
  } catch (err) {
    DOM.count.textContent = 'Error loading flights data.';
    console.error(err);
  }
}

function showToast(msg) {
  DOM.toast.textContent = msg;
  DOM.toast.classList.add('show');
  DOM.toast.classList.remove('hidden');
  setTimeout(() => {
    DOM.toast.classList.remove('show');
  }, 2000);
}

function initTheme() {
  const savedTheme = localStorage.getItem('finder-theme');
  const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
  const iconMoon = document.getElementById('theme-icon-moon');
  const iconSun = document.getElementById('theme-icon-sun');
  if (!iconMoon || !iconSun) return;
  
  if (isDark) {
    iconMoon.classList.add('hidden');
    iconSun.classList.remove('hidden');
  } else {
    iconSun.classList.add('hidden');
    iconMoon.classList.remove('hidden');
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('finder-theme', 'light');
    updateThemeIcon(false);
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('finder-theme', 'dark');
    updateThemeIcon(true);
  }
}

function setupListeners() {
  const inputs = [
    DOM.filterOrigin, DOM.filterDest,
    DOM.filterDay, DOM.filterTimeFrom, DOM.filterTimeTo,
    DOM.filterHours, DOM.filterDuration, DOM.filterDurationMin, DOM.filterHomebase,
    DOM.filterCallsign, DOM.sortBy, DOM.showUtc
  ];

  inputs.forEach(el => {
    if (el) {
      el.addEventListener('input', applyFilters);
    }
  });

  if (DOM.btnSwap) {
    DOM.btnSwap.addEventListener('click', () => {
      const temp = DOM.filterOrigin.value;
      DOM.filterOrigin.value = DOM.filterDest.value;
      DOM.filterDest.value = temp;
      applyFilters();
    });
  }

  if (DOM.btnTheme) {
    DOM.btnTheme.addEventListener('click', toggleTheme);
  }

  DOM.filterHours.addEventListener('input', (e) => {
    const v = e.target.value;
    DOM.hoursLabel.textContent = v === '168' ? 'Departing: Any time' : `Departing in next ${v} hours`;
  });

  DOM.filterDuration.addEventListener('input', (e) => {
    const v = parseInt(e.target.value);
    if (v >= 360) {
      DOM.durationLabel.textContent = 'Max Duration: Any';
    } else {
      const h = Math.floor(v / 60);
      const m = v % 60;
      DOM.durationLabel.textContent = `Max Duration: ${h}h ${m === 0 ? '00' : m}m`;
    }
  });

  DOM.filterDurationMin.addEventListener('input', (e) => {
    const v = parseInt(e.target.value);
    if (v === 0) {
      DOM.durationMinLabel.textContent = 'Min Duration: 0m';
    } else {
      const h = Math.floor(v / 60);
      const m = v % 60;
      DOM.durationMinLabel.textContent = `Min Duration: ${h}h ${m === 0 ? '00' : m}m`;
    }
  });

  DOM.resetBtn.addEventListener('click', () => {
    inputs.forEach(el => {
      if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else if (el.type === 'range') {
        if (el.id === 'filter-hours') el.value = 168;
        if (el.id === 'filter-duration') el.value = 360;
        if (el.id === 'filter-duration-min') el.value = 0;
      }
      else if (el.type === 'checkbox') el.checked = true;
      else el.value = '';
    });
    DOM.hoursLabel.textContent = 'Departing: Any time';
    DOM.durationLabel.textContent = 'Max Duration: Any';
    DOM.durationMinLabel.textContent = 'Min Duration: 0m';
    applyFilters();
  });
}

function getNextDepartureMinutes(flightDayOps, departureTimeStr) {
  const now = new Date();
  let currentDay = now.getDay();
  if (currentDay === 0) currentDay = 7;
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [depH, depM] = departureTimeStr.split(':').map(Number);
  const depMinutes = depH * 60 + depM;

  let minWait = Infinity;

  for (const fDay of flightDayOps) {
    let daysDiff = fDay - currentDay;
    if (daysDiff < 0) daysDiff += 7;
    
    let totalWaitMinutes = (daysDiff * 24 * 60) + (depMinutes - currentMinutes);
    
    if (totalWaitMinutes < 0) {
      totalWaitMinutes += 7 * 24 * 60;
    }

    if (totalWaitMinutes < minWait) {
      minWait = totalWaitMinutes;
    }
  }
  return minWait;
}

function parseTime(timeStr) {
  if (!timeStr || timeStr === '--:--') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getOffsetString(localTime, utcTime) {
  if (!localTime || !utcTime || localTime === '--:--' || utcTime === '--:--') return '';
  const [lh, lm] = localTime.split(':').map(Number);
  const [uh, um] = utcTime.split(':').map(Number);
  
  let lMins = lh * 60 + lm;
  let uMins = uh * 60 + um;
  
  let diff = lMins - uMins;
  if (diff > 12 * 60) diff -= 24 * 60;
  if (diff < -12 * 60) diff += 24 * 60;
  
  const sign = diff >= 0 ? '+' : '-';
  const absDiff = Math.abs(diff);
  const h = Math.floor(absDiff / 60);
  const m = absDiff % 60;
  
  return `UTC${sign}${h}${m === 0 ? '' : ':' + m.toString().padStart(2, '0')}`;
}

function applyFilters() {
  const originStr = DOM.filterOrigin.value.toLowerCase();
  const origins = originStr ? originStr.split(',').map(s => s.trim()).filter(Boolean) : [];
  
  const destStr = DOM.filterDest.value.toLowerCase();
  const dests = destStr ? destStr.split(',').map(s => s.trim()).filter(Boolean) : [];
  
  const durationMax = parseInt(DOM.filterDuration.value);
  const durationMin = parseInt(DOM.filterDurationMin.value);
  const homebase = DOM.filterHomebase.value.toLowerCase();
  const callsign = DOM.filterCallsign.value.toLowerCase();
  const hVal = parseInt(DOM.filterHours.value);
  
  let results = allFlights.filter(f => {
    if (origins.length > 0) {
      const match = origins.some(o => 
        f.departure_icao.toLowerCase().includes(o) || 
        f.departure_city.toLowerCase().includes(o) || 
        (f.departure_country && f.departure_country.toLowerCase().includes(o))
      );
      if (!match) return false;
    }

    if (dests.length > 0) {
      const match = dests.some(d => 
        f.arrival_icao.toLowerCase().includes(d) || 
        f.arrival_city.toLowerCase().includes(d) ||
        (f.arrival_country && f.arrival_country.toLowerCase().includes(d))
      );
      if (!match) return false;
    }

    if (durationMax < 360 && f.duration_minutes > durationMax) return false;
    if (durationMin > 0 && f.duration_minutes < durationMin) return false;

    if (homebase && !(f.homebase && f.homebase.toLowerCase().includes(homebase))) return false;

    const fnNoSpace = (f.flight_number || '').replace(/\s+/g, '').toLowerCase();
    if (callsign) {
      const cs = (f.callsign || '').toLowerCase();
      if (!fnNoSpace.includes(callsign) && !cs.includes(callsign)) return false;
    }

    // Sim Filters
    const sDay = parseInt(DOM.filterDay.value);
    if (sDay && !f.days_of_operation.includes(sDay)) return false;

    const tFrom = parseTime(DOM.filterTimeFrom.value);
    const tTo = parseTime(DOM.filterTimeTo.value);
    const depTUtc = parseTime(f.departure_time_utc);

    if (DOM.filterTimeFrom.value && depTUtc < tFrom) return false;
    if (DOM.filterTimeTo.value && depTUtc > tTo) return false;

    // Live Filter
    const wait = getNextDepartureMinutes(f.days_of_operation, f.departure_time);
    if (hVal < 168) {
      const maxWaitMinutes = hVal * 60;
      if (wait > maxWaitMinutes) return false;
    }
    f._liveWait = wait;

    return true;
  });

  const sortVal = DOM.sortBy.value;
  results.sort((a, b) => {
    if (sortVal === 'duration-asc') return a.duration_minutes - b.duration_minutes;
    if (sortVal === 'duration-desc') return b.duration_minutes - a.duration_minutes;
    
    // Sort by absolute next departure wait time to make sorting reliable
    return (a._liveWait || 0) - (b._liveWait || 0);
  });

  render(results);
}

function render(flights) {
  DOM.count.textContent = `Found ${flights.length} flights`;

  if (flights.length === 0) {
    DOM.grid.innerHTML = `<div class="no-results">No flights match your criteria. Try adjusting the filters.</div>`;
    return;
  }

  const showUtc = DOM.showUtc.checked;

  const html = flights.map(f => {
    let daysHtml = '';
    for (let i = 1; i <= 7; i++) {
      const active = f.days_of_operation.includes(i) ? 'active' : '';
      const letter = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i-1];
      daysHtml += `<div class="day-dot ${active}">${letter}</div>`;
    }

    const depLocal = f.departure_time;
    const depUtc = f.departure_time_utc || '--:--';
    const arrLocal = f.arrival_time;
    const arrUtc = f.arrival_time_utc || '--:--';
    
    const depOffset = getOffsetString(depLocal, depUtc);
    const arrOffset = getOffsetString(arrLocal, arrUtc);

    const mainDep = showUtc ? depUtc : depLocal;
    const subDep = showUtc 
      ? `Local: ${depLocal} <span style="opacity: 0.6">(${depOffset})</span>` 
      : `UTC: ${depUtc} <span style="opacity: 0.6">(${depOffset})</span>`;

    const mainArr = showUtc ? arrUtc : arrLocal;
    const subArr = showUtc 
      ? `Local: ${arrLocal} <span style="opacity: 0.6">(${arrOffset})</span>` 
      : `UTC: ${arrUtc} <span style="opacity: 0.6">(${arrOffset})</span>`;
    
    const fnClean = (f.flight_number || '').replace(/\s+/g, '');

    return `
      <div class="flight-card">
        <div class="fc-header">
          <div class="fc-airline">${f.airline || 'RYANAIR'} • ${f.homebase ? 'BASE: '+f.homebase : 'AWAY'}</div>
          <div class="fc-identifiers">
            <span class="badge copy-click" data-copy="${fnClean}" title="Click to copy">${fnClean}</span>
            ${f.callsign ? `<span class="badge callsign copy-click" data-copy="${f.callsign}" title="Click to copy">${f.callsign}</span>` : ''}
          </div>
        </div>
        
        <div class="fc-route">
          <div class="fc-point">
            <div class="fc-time">${mainDep}</div>
            <div class="fc-time-sub">${subDep}</div>
            <div class="fc-icao copy-click" data-copy="${f.departure_icao}" title="Click to copy">${f.departure_icao}</div>
            <div class="fc-city">
              ${f.departure_city.length + f.departure_country.length > 22 
                ? `<marquee behavior="scroll" direction="left" scrollamount="3" scrolldelay="30"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.departure_city + ', ' + f.departure_country)}" target="_blank" class="city-link">${f.departure_city}, ${f.departure_country}</a></marquee>`
                : `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.departure_city + ', ' + f.departure_country)}" target="_blank" class="city-link">${f.departure_city}, ${f.departure_country}</a>`
              }
            </div>
          </div>
          
          <div class="fc-divider">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
          
          <div class="fc-point right">
            <div class="fc-time">${mainArr}</div>
            <div class="fc-time-sub">${subArr}</div>
            <div class="fc-icao copy-click" data-copy="${f.arrival_icao}" title="Click to copy">${f.arrival_icao}</div>
            <div class="fc-city">
              ${f.arrival_city.length + f.arrival_country.length > 22
                ? `<marquee behavior="scroll" direction="left" scrollamount="3" scrolldelay="30"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.arrival_city + ', ' + f.arrival_country)}" target="_blank" class="city-link">${f.arrival_city}, ${f.arrival_country}</a></marquee>`
                : `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.arrival_city + ', ' + f.arrival_country)}" target="_blank" class="city-link">${f.arrival_city}, ${f.arrival_country}</a>`
              }
            </div>
          </div>
        </div>
        
        <div class="fc-footer">
          <div class="fc-duration">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${Math.floor(f.duration_minutes / 60)}h ${f.duration_minutes % 60}m
          </div>
          <div class="fc-days">
            ${daysHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');

  DOM.grid.innerHTML = html;

  document.querySelectorAll('.copy-click').forEach(el => {
    el.addEventListener('click', (e) => {
      const text = e.target.dataset.copy;
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          showToast(`Copied ${text}`);
        });
      }
    });
  });

  document.querySelectorAll('.flight-card').forEach((el, index) => {
    el.addEventListener('click', (e) => {
      try {
        if (e.target.closest && (e.target.closest('.copy-click') || e.target.closest('a'))) return;
        openFlightModal(flights[index]);
      } catch (err) {
        alert("Error opening modal: " + err.message + "\n" + err.stack);
      }
    });
  });
}

init();


// --- FLIGHT MODAL LOGIC ---

const modalDOM = {
  overlay: document.getElementById('flight-modal'),
  closeBtn: document.getElementById('modal-close'),
  loading: document.getElementById('modal-loading'),
  body: document.getElementById('modal-body'),
  
  flightNum: document.getElementById('m-flight-number'),
  callsign: document.getElementById('m-callsign'),
  dep: document.getElementById('m-dep'),
  arr: document.getElementById('m-arr'),
  
  depIcaoLbl: document.getElementById('m-dep-icao-lbl'),
  arrIcaoLbl: document.getElementById('m-arr-icao-lbl'),
  
  depMetarRaw: document.getElementById('m-dep-metar-raw'),
  arrMetarRaw: document.getElementById('m-arr-metar-raw'),
  depTafRaw: document.getElementById('m-dep-taf-raw'),
  arrTafRaw: document.getElementById('m-arr-taf-raw'),
  
  depMetarGraphic: document.getElementById('m-dep-metar-graphic'),
  arrMetarGraphic: document.getElementById('m-arr-metar-graphic'),
  
  vatsimAtc: document.getElementById('m-vatsim-atc'),
  
  simbriefBtn: document.getElementById('m-simbrief-btn'),
  skyvectorBtn: document.getElementById('m-skyvector-btn')
};

if (modalDOM.closeBtn) modalDOM.closeBtn.addEventListener('click', closeFlightModal);
if (modalDOM.overlay) {
  modalDOM.overlay.addEventListener('click', (e) => {
    if (e.target === modalDOM.overlay) closeFlightModal();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalDOM.overlay && !modalDOM.overlay.classList.contains('hidden')) closeFlightModal();
});

function closeFlightModal() {
  modalDOM.overlay.classList.add('hidden');
}

async function openFlightModal(flight) {
  // Show modal, reset state
  modalDOM.overlay.classList.remove('hidden');
  modalDOM.loading.classList.remove('hidden');
  modalDOM.body.classList.add('hidden');
  
  // Populate Header
  const fn = (flight.flight_number || '').replace(/\s+/g, '');
  modalDOM.flightNum.textContent = flight.airline ? `${flight.airline} ${fn}` : fn;
  modalDOM.callsign.textContent = flight.callsign || fn;
  modalDOM.dep.textContent = flight.departure_icao;
  modalDOM.arr.textContent = flight.arrival_icao;
  
  modalDOM.depIcaoLbl.textContent = flight.departure_icao;
  modalDOM.arrIcaoLbl.textContent = flight.arrival_icao;
  
  // Populate Route Links
  modalDOM.simbriefBtn.href = `https://dispatch.simbrief.com/options/custom?orig=${flight.departure_icao}&dest=${flight.arrival_icao}&fltnum=${fn}`;
  modalDOM.skyvectorBtn.href = `https://skyvector.com/?fpl=${flight.departure_icao}%20${flight.arrival_icao}`;

  // Fetch Data concurrently
  try {
    const [depMetar, arrMetar, depTaf, arrTaf, vatsimData] = await Promise.allSettled([
      fetchMetar(flight.departure_icao),
      fetchMetar(flight.arrival_icao),
      fetchTaf(flight.departure_icao),
      fetchTaf(flight.arrival_icao),
      fetchVatsimData()
    ]);
    
    // Render Weather
    renderWeather(depMetar.value, modalDOM.depMetarRaw, modalDOM.depMetarGraphic);
    renderWeather(arrMetar.value, modalDOM.arrMetarRaw, modalDOM.arrMetarGraphic);
    renderTaf(depTaf.value, modalDOM.depTafRaw);
    renderTaf(arrTaf.value, modalDOM.arrTafRaw);
    
    // Render VATSIM
    renderVatsimATC(vatsimData.value, flight.departure_icao, flight.arrival_icao);
    
  } catch (err) {
    console.error('Error fetching live data:', err);
  } finally {
    // Hide loading, show content
    modalDOM.loading.classList.add('hidden');
    modalDOM.body.classList.remove('hidden');
  }
}

// --- API FETCHERS ---

async function fetchMetar(icao) {
  const res = await fetch(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`);
  if (!res.ok) return null;
  const data = await res.json();
  return data && data.length > 0 ? data[0] : null;
}

async function fetchTaf(icao) {
  const res = await fetch(`https://aviationweather.gov/api/data/taf?ids=${icao}&format=json`);
  if (!res.ok) return null;
  const data = await res.json();
  return data && data.length > 0 ? data[0] : null;
}

async function fetchVatsimData() {
  const res = await fetch('https://data.vatsim.net/v3/vatsim-data.json');
  if (!res.ok) return null;
  return res.json();
}

// --- RENDERERS ---

function renderWeather(metar, rawEl, graphicEl) {
  if (!metar) {
    rawEl.textContent = 'No METAR available for this station.';
    graphicEl.innerHTML = '';
    return;
  }
  
  rawEl.textContent = metar.rawOb || 'No raw data.';
  
  const cat = (metar.fltCat || 'UNK').toLowerCase();
  const wdir = metar.wdir !== undefined ? metar.wdir : 0;
  const wspd = metar.wspd !== undefined ? metar.wspd : 0;
  
  graphicEl.innerHTML = `
    <div class="mg-category ${cat}" title="Flight Category: ${cat.toUpperCase()}">${cat.toUpperCase()}</div>
    <div class="mg-wind" title="Wind ${wdir}° at ${wspd} kts">
      <svg class="mg-wind-arrow" style="transform: rotate(${wdir}deg);" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="m17 7-5-5-5 5"/></svg>
      <span>${wspd}kt</span>
    </div>
    <div class="mg-temp" title="Temp / Dewpoint">
      ${metar.temp !== undefined ? metar.temp : '--'}°C
      <span>Dew ${metar.dewp !== undefined ? metar.dewp : '--'}°C</span>
    </div>
    <div class="mg-vis" title="Visibility">
      ${metar.visib !== undefined ? metar.visib : '--'}
      <span>Vis (SM)</span>
    </div>
  `;
}

function renderTaf(taf, rawEl) {
  if (!taf || !taf.rawTAF) {
    rawEl.textContent = 'No TAF available for this station.';
    return;
  }
  // format TAF to be readable (replace ' FM' or ' BECMG' with newlines)
  let t = taf.rawTAF;
  t = t.replace(/ (FM|BECMG|TEMPO|PROB)/g, '\n$1');
  rawEl.textContent = t;
}

function renderVatsimATC(vatsim, depIcao, arrIcao) {
  modalDOM.vatsimAtc.innerHTML = '';
  if (!vatsim || !vatsim.controllers) {
    modalDOM.vatsimAtc.innerHTML = '<div class="no-atc">Failed to fetch VATSIM data.</div>';
    return;
  }
  
  const prefixes = [depIcao, arrIcao, depIcao.substring(0, 2), arrIcao.substring(0, 2)];
  
  const atc = vatsim.controllers.filter(c => {
    // Ignore observers and ATIS if not needed, but ATIS is usually useful. We'll include it.
    if (c.facility === 0) return false; // observer
    
    // Check if callsign starts with ICAOs
    return prefixes.some(p => c.callsign.startsWith(p));
  });
  
  if (atc.length === 0) {
    modalDOM.vatsimAtc.innerHTML = '<div class="no-atc">No local ATC or Enroute Centers online. Unicom 122.800</div>';
    return;
  }
  
  // Sort: Centers first, then App, Twr, Gnd, Del, ATIS
  const facilityOrder = [1, 6, 5, 4, 3, 2]; // 1:CTR, 6:APP, 5:TWR, 4:GND, 3:DEL, 2:DEL? ATIS is facility 4 sometimes or separate. 
  // Let's just sort alphabetically for simplicity.
  atc.sort((a, b) => a.callsign.localeCompare(b.callsign));
  
  atc.forEach(c => {
    modalDOM.vatsimAtc.innerHTML += `
      <div class="vatsim-controller">
        <span class="cs">${c.callsign}</span>
        <span class="freq">${c.frequency}</span>
      </div>
    `;
  });
}
