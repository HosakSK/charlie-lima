// ============================================================
// STATE
// ============================================================
let checklistData = [];
let currentPageIndex = 0;

const NATO_ALPHABET = {
    'A': 'Alpha', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta', 'E': 'Echo',
    'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel', 'I': 'India', 'J': 'Juliett',
    'K': 'Kilo', 'L': 'Lima', 'M': 'Mike', 'N': 'November', 'O': 'Oscar',
    'P': 'Papa', 'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
    'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray', 'Y': 'Yankee', 'Z': 'Zulu',
    '9': 'Niner'
};

const CLASSIC_SPELL_EXCEPTIONS = new Set([
    'V', 'V1', 'VR', 'V2', 'N1', 'N2', 'QNH', 'QHN',
    'APU', 'APY', 'IRS', 'FMC', 'MCP', 'ILS', 'RTO',
    'SID', 'VOR', 'LOC', 'RWY', 'FL', 'NM', 'MA',
    'TA', 'RA', 'GND', 'STD', 'WX', 'REQ', 'TR',
    'HDG', 'ALT', 'AC', 'DC', 'ELT', 'GPS', 'GLS', 'EEC',
    'ATC', 'IDG', 'FPV', 'MTR', 'PFD', 'ND', 'RMI', 'GPU',
    'GAU', 'CDU', 'FMA', 'OFP', 'ADI', 'SOP', 'AAE', 'VPT',
    'GPWS', 'HZ', 'LE', 'PSEU', 'PSI', 'ADF', 'ISFD', 'IAS', 'SPD', 'AGL', 'PTH'
]);

// DOM – checklist
const pageTitleElem = document.getElementById('page-title');
const containerElem = document.getElementById('checklist-container');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const currentPageElem = document.getElementById('current-page');
const totalPagesElem = document.getElementById('total-pages');
const progressFill = document.getElementById('progress');
const globalProgressFill = document.getElementById('global-progress-fill');

// DOM – Top global bar & settings
const globalTitleElem = document.getElementById('global-title');
const globalFlightInfoElem = document.getElementById('global-flight-info');
const topHamburgerBtn = document.getElementById('top-settings-btn');
const topSettingsDropdown = document.getElementById('top-settings');

const themeToggleBtn = document.getElementById('top-theme-toggle');
const fontToggleBtn = document.getElementById('top-font-toggle');
const maleVoiceToggleBtn = document.getElementById('top-male-voice-toggle');
const muteToggleBtn = document.getElementById('top-mute-toggle');
const checklistOnlyContainer = document.getElementById('top-checklist-toggle-container');
const checklistOnlyToggle = document.getElementById('top-checklist-only-toggle');
const briefingToggleBtn = document.getElementById('top-briefing-toggle');
const resetSettingsBtn = document.getElementById('reset-settings-btn');
const briefingInfoOverlay = document.getElementById('briefing-info-overlay');
const briefingInfoClose = document.getElementById('briefing-info-close');
const briefingInfoDontShow = document.getElementById('briefing-info-dont-show');
const fakeAtcToggleBtn = document.getElementById('top-fake-atc-toggle');
const fakeAtcInfoOverlay = document.getElementById('fake-atc-info-overlay');
const fakeAtcInfoClose = document.getElementById('fake-atc-info-close');
const fakeAtcInfoDontShow = document.getElementById('fake-atc-info-dont-show');

// DOM – overlay & voice
const fabBtn = document.getElementById('fab-btn');
const overlay = document.getElementById('overlay');
const overlayClose = document.getElementById('overlay-close');
const hamburgerBtn = document.getElementById('hamburger-btn');
const quickNavDropdown = document.getElementById('quick-nav-dropdown');
const briefClear = document.getElementById('brief-clear');
const micBtn = document.getElementById('mic-btn');
const voiceBar = document.getElementById('voice-bar');
const voiceEqualizer = document.getElementById('voice-equalizer');
const voiceStopBtn = document.getElementById('voice-stop-btn');
const resetPhaseBtn = document.getElementById('reset-phase-btn');
const turnaroundPhaseBtn = document.getElementById('turnaround-phase-btn');

// DOM – Audio & Help
const helpToggleBtn = document.getElementById('help-footer-btn');
const helpOverlay = document.getElementById('help-overlay');
const helpCloseBtn = document.getElementById('help-close');
const helpContentContainer = document.getElementById('help-content-container');
const helpLangSelect = document.getElementById('help-lang-select');
const audioClick = document.getElementById('audio-click');

// DOM - Action Timer
const actionTimerOverlay = document.getElementById('action-timer-overlay');
const actionTimerCircle = document.getElementById('action-timer-circle');
const actionTimerTime = document.getElementById('action-timer-time');
const actionTimerLabel = document.getElementById('action-timer-label');

// AUDIO VOLUMES
if (audioClick) { audioClick.volume = 0.1; console.log("AudioClick initialized at 10%"); }

let isMuted = localStorage.getItem('b738_muted') === 'true';

const BRIEF_FIELDS = [
    'b-simbrief-id',
    'b-callsign', 'b-origin', 'b-dest',
    'b-dep-atis', 'b-dep-qnh', 'b-dep-rwy', 'b-dep-rwy-hdg', 'b-sid', 'b-dep-gate', 'b-initial-alt', 'b-init-alt', 'b-dep-tl', 'b-squawk',
    'b-dep-dewpt', 'b-dep-temp', 'b-dep-wind', 'b-dep-flaps', 'b-dep-assumed',
    'b-total-fuel', 'b-trip-fuel', 'b-reserve-fuel',
    'b-v1', 'b-vr', 'b-v2', 'b-trim', 'b-taxi-out',
    'b-arr-atis', 'b-arr-qnh', 'b-arr-rwy', 'b-landing-type', 'b-arr-ta', 'b-star',
    'b-arr-dewpt', 'b-arr-temp', 'b-arr-wind',
    'b-ils-freq', 'b-course', 'b-minima', 'b-ga-alt', 'b-vref', 'b-arr-flaps', 'b-autobrake',
    'b-taxi-in', 'b-gate', 'b-notes'
];
const BRIEF_STORAGE_KEY = 'b738_briefing_v2';

// ============================================================
// AUDIO & MUTE
// ============================================================
// ============================================================
// AUDIO & MUTE
// ============================================================
// AUDIO & MUTE
// ============================================================
function updateMuteState() {
    if (muteToggleBtn) muteToggleBtn.checked = isMuted;
    if (audioClick) audioClick.muted = isMuted;

    // Completely mute speech synthesis if activated
    if (isMuted) {
        window.speechSynthesis.cancel();
    }
}
updateMuteState();

if (muteToggleBtn) {
    muteToggleBtn.addEventListener('change', (e) => {
        isMuted = e.target.checked;
        localStorage.setItem('b738_muted', isMuted);
        updateMuteState();
    });
}

// ============================================================
// NIGHT MODE & FONT
// ============================================================
function applyTheme(dark) {
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');

    // Update browser theme color meta
    const themeColor = dark ? '#242627' : '#F5F7F7';
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        // If we have multiple (light/dark media), we can just update all of them or set the content
        document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
            meta.setAttribute('content', themeColor);
        });
    }
}

const isDarkInit = localStorage.getItem('b738_theme') === 'dark';
applyTheme(isDarkInit);

if (themeToggleBtn) {
    themeToggleBtn.checked = isDarkInit;
    themeToggleBtn.addEventListener('change', (e) => {
        const dark = e.target.checked;
        applyTheme(dark);
        localStorage.setItem('b738_theme', dark ? 'dark' : 'light');
    });
}

let isMono = localStorage.getItem('b738_mono') === 'true';

function applyFontState() {
    if (isMono) {
        document.body.style.fontFamily = "'IBM Plex Mono', monospace";
    } else {
        document.body.style.fontFamily = "'Inter', -apple-system, sans-serif";
    }
}
applyFontState();

if (fontToggleBtn) {
    fontToggleBtn.checked = isMono;
    fontToggleBtn.addEventListener('change', (e) => {
        isMono = e.target.checked;
        localStorage.setItem('b738_mono', isMono);
        applyFontState();
    });
}

let isTimerDisabled = localStorage.getItem('b738_disable_timer') === 'true';
const disableTimerToggleBtn = document.getElementById('top-disable-timer-toggle');

if (disableTimerToggleBtn) {
    disableTimerToggleBtn.checked = isTimerDisabled;
    disableTimerToggleBtn.addEventListener('change', (e) => {
        isTimerDisabled = e.target.checked;
        localStorage.setItem('b738_disable_timer', isTimerDisabled);
    });
}

let isReadCLOnly = localStorage.getItem('b738_read_cl_only') === 'true';
const readCLOnlyToggleBtn = document.getElementById('top-read-cl-only-toggle');

if (readCLOnlyToggleBtn) {
    readCLOnlyToggleBtn.checked = isReadCLOnly;
    readCLOnlyToggleBtn.addEventListener('change', (e) => {
        isReadCLOnly = e.target.checked;
        localStorage.setItem('b738_read_cl_only', isReadCLOnly);
    });
}

let isHideTests = localStorage.getItem('b738_hide_tests') === 'true';
const hideTestsToggleBtn = document.getElementById('top-hide-tests-toggle');
if (hideTestsToggleBtn) {
    hideTestsToggleBtn.checked = isHideTests;
    hideTestsToggleBtn.addEventListener('change', (e) => {
        isHideTests = e.target.checked;
        localStorage.setItem('b738_hide_tests', isHideTests);
        renderPage(false);
    });
}

let isSimplify = localStorage.getItem('b738_simplify') === 'true';
const simplifyToggleBtn = document.getElementById('top-simplify-toggle');
if (simplifyToggleBtn) {
    simplifyToggleBtn.checked = isSimplify;
    simplifyToggleBtn.addEventListener('change', (e) => {
        isSimplify = e.target.checked;
        localStorage.setItem('b738_simplify', isSimplify);
        renderPage(false);
    });
}

let isMaleVoice = localStorage.getItem('b738_male_voice') === 'true';

if (maleVoiceToggleBtn) {
    maleVoiceToggleBtn.checked = isMaleVoice;
    maleVoiceToggleBtn.addEventListener('change', (e) => {
        isMaleVoice = e.target.checked;
        localStorage.setItem('b738_male_voice', isMaleVoice);
        window.dispatchEvent(new Event('b738_voice_changed'));
    });
}



let isChecklistOnly = false;
let isBriefingEnabled = localStorage.getItem('b738_briefing_enabled') === 'true';
if (briefingToggleBtn) {
    briefingToggleBtn.checked = isBriefingEnabled;
    briefingToggleBtn.addEventListener('change', (e) => {
        isBriefingEnabled = e.target.checked;
        localStorage.setItem('b738_briefing_enabled', isBriefingEnabled.toString());
        if (isBriefingEnabled) {
            const popupSeen = localStorage.getItem('b738_briefing_popup_seen') === 'true';
            if (!popupSeen && briefingInfoOverlay) {
                briefingInfoOverlay.classList.remove('hidden');
            }
        }
        renderPage(false);
    });
}

if (briefingInfoClose) {
    briefingInfoClose.onclick = () => {
        if (briefingInfoDontShow && briefingInfoDontShow.checked) {
            localStorage.setItem('b738_briefing_popup_seen', 'true');
        }
        briefingInfoOverlay.classList.add('hidden');
    };
}

let isFakeAtcEnabled = localStorage.getItem('b738_fake_atc_enabled') === 'true';
if (fakeAtcToggleBtn) {
    fakeAtcToggleBtn.checked = isFakeAtcEnabled;
    fakeAtcToggleBtn.addEventListener('change', (e) => {
        isFakeAtcEnabled = e.target.checked;
        localStorage.setItem('b738_fake_atc_enabled', isFakeAtcEnabled.toString());
        if (isFakeAtcEnabled) {
            const popupSeen = localStorage.getItem('b738_fake_atc_popup_seen') === 'true';
            if (!popupSeen && fakeAtcInfoOverlay) {
                fakeAtcInfoOverlay.classList.remove('hidden');
            }
        }
        renderPage(false);
    });
}

if (fakeAtcInfoClose) {
    fakeAtcInfoClose.onclick = () => {
        if (fakeAtcInfoDontShow && fakeAtcInfoDontShow.checked) {
            localStorage.setItem('b738_fake_atc_popup_seen', 'true');
        }
        fakeAtcInfoOverlay.classList.add('hidden');
    };
}

if (resetSettingsBtn) {
    resetSettingsBtn.onclick = () => {
        if (confirm("Reset completely to defaults? This will erase all your settings including the help guide preferences.")) {
            localStorage.removeItem('b738_theme');
            localStorage.removeItem('b738_mono');
            localStorage.removeItem('b738_disable_timer');
            localStorage.removeItem('b738_male_voice');
            localStorage.removeItem('b738_muted');
            localStorage.removeItem('b738_briefing_enabled');
            localStorage.removeItem('b738_briefing_popup_seen');
            localStorage.removeItem('b738_fake_atc_enabled');
            localStorage.removeItem('b738_fake_atc_popup_seen');
            localStorage.removeItem('b738_dataset');
            localStorage.removeItem('b738_read_cl_only');
            location.reload();
        }
    };
}
const dTrigger = document.getElementById('dataset-dropdown-trigger');
const dOptions = document.getElementById('dataset-dropdown-options');
const dInput = document.getElementById('b-dataset-type');
const dTriggerText = document.getElementById('dataset-trigger-text');

if (dTrigger && dOptions && dInput) {
    const safeDataSets = typeof availableDataSets !== 'undefined' ? availableDataSets : [
        { title: "Europe style list", file: "data/europe_style.js" }
    ];

    // Generate options dynamically
    dOptions.innerHTML = '';
    safeDataSets.forEach(dataset => {
        const opt = document.createElement('div');
        opt.className = 'dataset-option-unique';
        opt.setAttribute('data-val', dataset.file);
        opt.textContent = dataset.title;
        opt.style.padding = '10px';
        opt.style.borderBottom = '1px solid rgba(128,128,128,0.1)';
        opt.style.cursor = 'pointer';
        opt.style.transition = 'background 0.15s, color 0.15s';

        opt.onmouseenter = () => { opt.style.backgroundColor = 'var(--color-primary-accent)'; opt.style.color = '#fff'; };
        opt.onmouseleave = () => { opt.style.backgroundColor = 'transparent'; opt.style.color = 'inherit'; };

        opt.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const val = dataset.file;
            dInput.value = val;
            dTrigger.value = dataset.title;
            dOptions.classList.remove('show');
            dOptions.style.visibility = 'hidden';
            dOptions.style.opacity = '0';
            dOptions.style.pointerEvents = 'none';
            localStorage.setItem('b738_dataset', val);
            setTimeout(() => {
                location.reload();
            }, 100);
        };

        dOptions.appendChild(opt);
    });

    dTrigger.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const isOpen = dOptions.style.visibility === 'visible';
        if (isOpen) {
            dOptions.classList.remove('show');
            dOptions.style.visibility = 'hidden';
            dOptions.style.opacity = '0';
            dOptions.style.pointerEvents = 'none';
        } else {
            dOptions.classList.add('show');
            dOptions.style.display = 'flex';
            dOptions.style.visibility = 'visible';
            dOptions.style.opacity = '1';
            dOptions.style.pointerEvents = 'auto';
            dOptions.style.zIndex = '999999';
        }
    };

    document.addEventListener('click', (e) => {
        if (!dOptions.contains(e.target) && e.target !== dTrigger && !dTrigger.contains(e.target)) {
            dOptions.classList.remove('show');
            dOptions.style.visibility = 'hidden';
            dOptions.style.opacity = '0';
            dOptions.style.pointerEvents = 'none';
        }
    });

    // Set initial from localStorage
    const savedDataset = localStorage.getItem('b738_dataset') || safeDataSets[0].file;
    const selectedOpt = document.querySelector(`.dataset-option-unique[data-val="${savedDataset}"]`);
    if (selectedOpt) {
        dTrigger.value = selectedOpt.textContent;
        dInput.value = savedDataset;
    } else {
        dTrigger.value = safeDataSets[0].title;
        dInput.value = safeDataSets[0].file;
    }
}

function hasFlow() {
    return checklistData.some(page => page.items.some(i => i.type === 'flow'));
}

const AIRLINE_CALLSIGNS = {
    'RYR': 'Ryanair', 'DLH': 'Lufthansa', 'AFR': 'Air France', 'BAW': 'Speedbird', 'BA': 'Speedbird',
    'EZY': 'EasyJet', 'WZZ': 'Wizz Air', 'KLM': 'K L M', 'TVQ': 'Smartwings', 'AUA': 'Austrian',
    'SWR': 'Swiss', 'EXS': 'Channex', 'FIN': 'Finnair', 'IBE': 'Iberia', 'EIN': 'Shamrock',
    'SAS': 'Scandinavian', 'TAP': 'Air Portugal', 'PGT': 'Sunturk', 'BTI': 'Air Baltic',
    'LOT': 'LOT', 'CSA': 'CSA', 'VLG': 'Vueling', 'THY': 'Turkish Airlines', 'BEE': 'Jersey',
    'SXS': 'SunExpress', 'NAX': 'Norwegian', 'AEA': 'Europa', 'AZA': 'Alitalia', 'CTN': 'Croatia',
    'ROT': 'Tarom', 'AEE': 'Aegean', 'AAL': 'American', 'DAL': 'Delta', 'UAL': 'United',
    'SWA': 'Southwest', 'JBU': 'JetBlue', 'NKS': 'Spirit', 'ASA': 'Alaska', 'ACA': 'Air Canada',
    'WJA': 'WestJet', 'UAE': 'Emirates', 'QTR': 'Qatari', 'ETD': 'Etihad', 'SIA': 'Singapore',
    'CPA': 'Cathay', 'JAL': 'Japan Air', 'ANA': 'All Nippon', 'QFA': 'Qantas', 'ANZ': 'New Zealand',
    'THAI': 'Thai'
};

function formatRunway(val) {
    if (!val) return val;
    return val.toUpperCase()
        .replace(/L$/g, ' Left')
        .replace(/R$/g, ' Right')
        .replace(/C$/g, ' Center');
}

function formatCallsign(val) {
    if (!val) return val;
    let match = val.trim().match(/^([a-zA-Z]+)(.*)$/);
    if (match) {
        let prefix = match[1].toUpperCase();
        if (AIRLINE_CALLSIGNS[prefix]) {
            let suffix = match[2].trim();
            return AIRLINE_CALLSIGNS[prefix] + (suffix ? ' ' + suffix : '');
        }
    }
    return val;
}

function isItemChecked(itemName) {
    if (!itemName) return false;
    const searchName = itemName.trim().toLowerCase();
    for (const page of checklistData) {
        const found = page.items.find(i => i.name.trim().toLowerCase().includes(searchName));
        if (found) return found.checked;
    }
    return false;
}

function getBriefingValidSentences(item, forSpeech = false) {
    let validSentences = [];
    let hasSentenceWithVar = false;
    for (let sentence of item.text) {
        // Handle conditional IF tags: [IF some item name] text [/IF]
        const ifMatch = sentence.match(/\[IF\s+(.*?)\](.*?)\[\/IF\]/i);
        if (ifMatch) {
            const conditionItemName = ifMatch[1];
            const innerText = ifMatch[2];
            if (isItemChecked(conditionItemName)) {
                sentence = innerText; // Use the inner text if checked
            } else {
                continue; // Skip this sentence if not checked
            }
        }

        let hasVar = false;
        let allVarsFilled = true;
        let parsedSentence = sentence;

        BRIEF_FIELDS.forEach(id => {
            const varName = id.replace(/^b-/, '').replace(/-/g, '_');
            const placeholder = `%${varName}%`;

            if (sentence.toLowerCase().includes(placeholder.toLowerCase())) {
                hasVar = true;
                const el = document.getElementById(id);
                let val = el ? el.value.trim() : '';

                if (id === 'b-landing-type') {
                    if (val === '3' || val === '') val = forSpeech ? 'ILS Cat 3' : 'ILS Cat. 3';
                    else if (val === '2') val = 'ILS';
                    else if (val === '1') val = 'RNAV';
                }

                if (id === 'b-callsign' && forSpeech) {
                    val = formatCallsign(val);
                }

                if ((id === 'b-dep-rwy' || id === 'b-arr-rwy') && forSpeech) {
                    val = formatRunway(val);
                }

                if (!val) {
                    allVarsFilled = false;
                } else {
                    parsedSentence = parsedSentence.replace(new RegExp(placeholder, 'gi'), val);
                }
            }
        });

        if (hasVar) {
            if (allVarsFilled) {
                validSentences.push(parsedSentence);
                hasSentenceWithVar = true;
            }
        } else {
            validSentences.push(parsedSentence);
        }
    }
    return hasSentenceWithVar ? validSentences : [];
}

let atcData = { airports: null, firs: null, greetings: null };
let atcVariables = {};

async function loadAtcData() {
    try {
        const [airportsRes, firsRes, greetingsRes] = await Promise.all([
            fetch('/data/atc/airports_atc.json'),
            fetch('/data/atc/firs_atc.json'),
            fetch('/data/atc/greetings_atc.json')
        ]);
        atcData.airports = await airportsRes.json();
        atcData.firs = await firsRes.json();
        atcData.greetings = await greetingsRes.json();
        updateAtcVariables();
    } catch (e) {
        console.error('Failed to load ATC data:', e);
    }
}

function updateAtcVariables() {
    atcVariables = {};
    if (!atcData.airports || !atcData.firs) return;
    
    const originEl = document.getElementById('b-origin');
    const destEl = document.getElementById('b-dest');
    const origin = originEl ? originEl.value.trim().toUpperCase() : '';
    const dest = destEl ? destEl.value.trim().toUpperCase() : '';

    // Pseudo-FIR mapping for missing airports (Global Fallback)
    const PSEUDO_FIR = {
        'LZ': 'LZBB', // Slovakia -> Bratislava
        'LK': 'LKAA', // Czechia -> Praha
        'LO': 'LOVV', // Austria -> Wien
        'ED': 'EDGG', // Germany -> Langen
        'ET': 'EDGG', // Germany Mil -> Langen
        'EB': 'EBBU', // Belgium -> Brussels
        'EL': 'EBBU', // Luxembourg -> Brussels
        'EH': 'EHAA', // Netherlands -> Amsterdam
        'EG': 'EGTT', // UK -> London
        'LF': 'LFFF', // France -> Paris
        'EP': 'EPWW', // Poland -> Warsaw
        'LH': 'LHCC', // Hungary -> Budapest
        'LE': 'LECB', // Spain -> Barcelona
        'LP': 'LPPC', // Portugal -> Lisboa
        'LI': 'LIMM', // Italy -> Milano
        'LS': 'LSAS', // Switzerland -> Swiss
        'LG': 'LGGG', // Greece -> Athinai
        'LT': 'LTBB', // Turkey -> Istanbul
        'ES': 'ESAA', // Sweden -> Stockholm
        'EN': 'ENOR', // Norway -> Oslo
        'EK': 'EKDK', // Denmark -> Kobenhavn
        'EF': 'EFIN', // Finland -> Helsinki
        'EY': 'EYVL', // Lithuania -> Vilnius
        'EV': 'EVRR', // Latvia -> Riga
        'EE': 'EETT', // Estonia -> Tallinn
        'UK': 'UKBV', // Ukraine -> Kyiv
        'KJ': 'KZNY', // USA East -> New York
        'KL': 'KZLA', // USA West -> Los Angeles
        'KO': 'KZAU', // USA Central -> Chicago
        'OM': 'OMAE', // UAE -> Emirates
    };

    const processAirport = (icao, isDep) => {
        if (!icao) return;
        let apt = atcData.airports[icao];
        
        // If airport missing, create a skeleton
        if (!apt) {
            const prefix = icao.substring(0, 2);
            apt = {
                icao: icao,
                name: icao,
                city: icao,
                country: '',
                fir: PSEUDO_FIR[prefix] || '',
                frequencies: []
            };
        }
        
        let cityVar = isDep ? 'city_dep' : 'city_arr';
        atcVariables[cityVar] = apt.city || apt.name || icao;
        
        // Greetings
        if (atcData.greetings) {
            let country = apt.country;
            let continent = apt.continent;
            let hello = 'Hello';
            let bye = 'Goodbye';
            
            if (country && atcData.greetings.countries && atcData.greetings.countries[country]) {
                hello = atcData.greetings.countries[country].hello;
                bye = atcData.greetings.countries[country].bye;
            } else if (continent && atcData.greetings.continents && atcData.greetings.continents[continent]) {
                hello = atcData.greetings.continents[continent].hello;
                bye = atcData.greetings.continents[continent].bye;
            }
            
            if (isDep) {
                atcVariables['hello_dep'] = hello;
                atcVariables['bye_dep'] = bye;
            } else {
                atcVariables['hello_arr'] = hello;
                atcVariables['bye_arr'] = bye;
            }
        }

        // Frequencies logic
        const freqs = apt.frequencies || [];
        const getFreq = (type, role) => {
            let found = freqs.find(f => f.type === type && (!role || f.role === role || !f.role));
            if (!found) found = freqs.find(f => f.type === type);
            return found;
        };

        const setVar = (key, val, freqVal) => {
            if (val) atcVariables[key] = val;
            if (freqVal) atcVariables[key + '_freq'] = freqVal;
        };

        const isRadarRegion = ['CZ', 'SK', 'DE', 'AT', 'HU'].includes(apt.country);
        const isCenterRegion = ['US', 'CA', 'AU'].includes(apt.country);

        // Fallback hierarchy logic (DEL -> GND -> TWR -> APP -> FIR)
        const del = getFreq('DEL');
        const gnd = getFreq('GND');
        const twr = getFreq('TWR');
        const app = getFreq('APP', isDep ? 'DEP' : 'ARR') || getFreq('APP');
        
        if (isDep) {
            if (del) setVar('delivery_dep', del.callsign, del.frequency);
            else if (gnd) setVar('delivery_dep', gnd.callsign, gnd.frequency);
            else if (twr) setVar('delivery_dep', twr.callsign, twr.frequency);
            else if (app) setVar('delivery_dep', app.callsign, app.frequency);
            
            if (gnd) setVar('ground_dep', gnd.callsign, gnd.frequency);
            else if (twr) setVar('ground_dep', twr.callsign, twr.frequency);
            else if (app) setVar('ground_dep', app.callsign, app.frequency);
            
            if (twr) setVar('tower_dep', twr.callsign, twr.frequency);
            else if (app) setVar('tower_dep', app.callsign, app.frequency);
            
            if (app) {
                let callsign = app.callsign;
                if (isRadarRegion) callsign = callsign.replace(/Approach/i, 'Radar');
                setVar('approach_dep', callsign, app.frequency);
            }
        } else {
            if (app) {
                let callsign = app.callsign;
                if (isRadarRegion) callsign = callsign.replace(/Approach/i, 'Radar');
                setVar('approach_arr', callsign, app.frequency);
            } else if (twr) {
                setVar('approach_arr', twr.callsign, twr.frequency);
            }
            
            if (twr) setVar('tower_arr', twr.callsign, twr.frequency);
            else if (app) setVar('tower_arr', app.callsign, app.frequency);
            
            if (gnd) setVar('ground_arr', gnd.callsign, gnd.frequency);
            else if (twr) setVar('ground_arr', twr.callsign, twr.frequency);
        }

        // FIR logic (Global Fallback)
        let firCode = apt.fir;
        if (firCode && atcData.firs[firCode]) {
            let fir = atcData.firs[firCode];
            let callsign = isCenterRegion ? fir.callsign.replace(/(Radar|Control)/i, 'Center') : fir.callsign;
            
            if (isDep) {
                setVar('fir_dep', callsign, fir.frequency);
                if (!atcVariables['approach_dep']) setVar('approach_dep', callsign, fir.frequency);
                if (!atcVariables['tower_dep']) setVar('tower_dep', callsign, fir.frequency);
                if (!atcVariables['ground_dep']) setVar('ground_dep', callsign, fir.frequency);
                if (!atcVariables['delivery_dep']) setVar('delivery_dep', callsign, fir.frequency);
            } else {
                setVar('fir_arr', callsign, fir.frequency);
                if (!atcVariables['approach_arr']) setVar('approach_arr', callsign, fir.frequency);
                if (!atcVariables['tower_arr']) setVar('tower_arr', callsign, fir.frequency);
                if (!atcVariables['ground_arr']) setVar('ground_arr', callsign, fir.frequency);
            }
        }
    };

    processAirport(origin, true);
    processAirport(dest, false);
}

// Call on load
loadAtcData();
// Listen for changes on origin and dest
// Listen for changes on origin and dest removed - handled in saveBriefing()


function getFakeAtcValidSentences(item, forSpeech = true) {
    let validSentences = [];
    let hasSentenceWithVar = false;
    
    // Make sure we have latest briefing fields too
    for (let sentence of item.text) {
        let hasVar = false;
        let allVarsFilled = true;
        let parsedSentence = sentence;

        // Replace briefing fields first
        BRIEF_FIELDS.forEach(id => {
            const varName = id.replace(/^b-/, '').replace(/-/g, '_');
            const placeholder = `%${varName}%`;
            if (sentence.toLowerCase().includes(placeholder.toLowerCase())) {
                hasVar = true;
                const el = document.getElementById(id);
                let val = el ? el.value.trim() : '';
                
                if (id === 'b-callsign' && forSpeech) val = formatCallsign(val);
                if ((id === 'b-dep-rwy' || id === 'b-arr-rwy') && forSpeech) val = formatRunway(val);
                
                if (!val) allVarsFilled = false;
                else parsedSentence = parsedSentence.replace(new RegExp(placeholder, 'gi'), val);
            }
        });

        // Replace ATC variables
        const atcVarNames = [
            'delivery_dep', 'ground_dep', 'tower_dep', 'approach_dep', 'fir_dep',
            'delivery_dep_freq', 'ground_dep_freq', 'tower_dep_freq', 'approach_dep_freq', 'fir_dep_freq',
            'fir_arr', 'approach_arr', 'tower_arr', 'ground_arr',
            'fir_arr_freq', 'approach_arr_freq', 'tower_arr_freq', 'ground_arr_freq',
            'city_dep', 'city_arr', 'hello_dep', 'hello_arr', 'bye_dep', 'bye_arr'
        ];

        atcVarNames.forEach(varName => {
            const placeholder = `%${varName}%`;
            if (sentence.toLowerCase().includes(placeholder.toLowerCase())) {
                hasVar = true;
                let val = atcVariables[varName] || '';
                if (!val) allVarsFilled = false;
                else parsedSentence = parsedSentence.replace(new RegExp(placeholder, 'gi'), val);
            }
        });

        if (hasVar) {
            if (allVarsFilled) {
                validSentences.push(parsedSentence);
                hasSentenceWithVar = true;
            }
        } else {
            validSentences.push(parsedSentence);
        }
    }
    return hasSentenceWithVar ? validSentences : [];
}



function isItemVisible(item) {
    if (item.type === 'briefing') {
        if (!isBriefingEnabled) return false;
        if (getBriefingValidSentences(item).length === 0) return false;
    } else if (item.type === 'fake_atc') {
        if (!isFakeAtcEnabled) return false;
        if (getFakeAtcValidSentences(item).length === 0) return false;
    }

    if (isChecklistOnly && item.type === 'flow') return false;
    if (item.landingtype) {
        const el = document.getElementById('b-landing-type');
        const lType = (el && el.value) ? el.value : "3"; // Default = ILS Cat.III
        const allowedTypes = item.landingtype.split('+').map(t => t.trim());
        if (!allowedTypes.includes(lType)) return false;
    }
    if (isHideTests) {
        if (item.subtype === 'test' || (Array.isArray(item.subtype) && item.subtype.includes('test'))) return false;
        const testActions = ['test', 'verify'];
        const actionLower = (item.action || '').toLowerCase();
        if (testActions.some(t => actionLower === t || actionLower.startsWith(t + ' '))) return false;
    }
    if (isSimplify && (item.subtype === 'simplify' || (Array.isArray(item.subtype) && item.subtype.includes('simplify')))) return false;
    return true;
}
if (checklistOnlyToggle) {
    checklistOnlyToggle.onchange = (e) => {
        isChecklistOnly = e.target.checked;

        // Check if we need to skip pages when toggled
        if (isChecklistOnly) {
            // Find next valid page or stay
            const currentHasChecklist = checklistData[currentPageIndex].items.some(i => i.type !== 'flow');
            if (!currentHasChecklist) {
                // Find next page with checklist items
                for (let i = currentPageIndex + 1; i < checklistData.length; i++) {
                    if (checklistData[i].items.some(it => it.type !== 'flow')) {
                        currentPageIndex = i;
                        break;
                    }
                }
            }
        }

        buildQuickNav();
        renderPage(false);
    };
}

// ============================================================
// TURNAROUND & RESET
// ============================================================
function hasTurnaroundItems() {
    return checklistData.some(page => page.items.some(i => i.ifturnaround === 'skip'));
}

function loadAsTurnaround() {
    if (!confirm("Start new Turnaround flight? Current progress will be lost.")) return;
    checklistData.forEach(page => page.items.forEach(i => i.checked = false));
    checklistData.forEach(page => page.items.forEach(i => {
        if (i.ifturnaround === 'skip') i.checked = true;
    }));
    currentPageIndex = 0;
    renderPage(true);
    quickNavDropdown.classList.add('hidden');
    hamburgerBtn.classList.remove('open');
}

if (resetPhaseBtn) {
    resetPhaseBtn.onclick = () => {
        if (confirm("Reset current checklist page?")) {
            checklistData[currentPageIndex].items.forEach(i => i.checked = false);
            hasStartedReading = false;
            isTimerActivePause = false;
            window.speechSynthesis.cancel();
            renderPage(false);
        }
    };
}

if (turnaroundPhaseBtn) {
    turnaroundPhaseBtn.onclick = loadAsTurnaround;
}

// (Flight timer removed)

// ============================================================
// FAB + OVERLAY + HELPERS
// ============================================================
if (topHamburgerBtn) {
    topHamburgerBtn.onclick = (e) => {
        e.stopPropagation();
        topSettingsDropdown.classList.toggle('show');
    };
}
// ============================================================
// NOTEPAD ACCORDION
// ============================================================
const labelDep = document.getElementById('label-dep');
const contentDep = document.getElementById('content-dep');
const labelArr = document.getElementById('label-arr');
const contentArr = document.getElementById('content-arr');

function initNotepadAccordions() {
    if (!labelDep || !labelArr) return;
    if (window.innerWidth <= 700) {
        contentArr.classList.add('collapsed');
        labelArr.classList.add('collapsed');
        contentDep.classList.remove('collapsed');
        labelDep.classList.remove('collapsed');
    } else {
        contentArr.classList.remove('collapsed');
        labelArr.classList.remove('collapsed');
        contentDep.classList.remove('collapsed');
        labelDep.classList.remove('collapsed');
    }
}
initNotepadAccordions();

if (labelDep && labelArr) {
    labelDep.onclick = () => {
        const isCollapsed = contentDep.classList.contains('collapsed');
        if (isCollapsed) {
            contentDep.classList.remove('collapsed');
            labelDep.classList.remove('collapsed');
            if (window.innerWidth <= 700) {
                contentArr.classList.add('collapsed');
                labelArr.classList.add('collapsed');
            }
        } else {
            contentDep.classList.add('collapsed');
            labelDep.classList.add('collapsed');
        }
    };

    labelArr.onclick = () => {
        const isCollapsed = contentArr.classList.contains('collapsed');
        if (isCollapsed) {
            contentArr.classList.remove('collapsed');
            labelArr.classList.remove('collapsed');
            if (window.innerWidth <= 700) {
                contentDep.classList.add('collapsed');
                labelDep.classList.add('collapsed');
            }
        } else {
            contentArr.classList.add('collapsed');
            labelArr.classList.add('collapsed');
        }
    };
}

fabBtn.onclick = () => {
    const wasHidden = overlay.classList.contains('hidden');
    overlay.classList.toggle('hidden');
    if (wasHidden && overlayPanel) {
        // Reset to CSS centered defaults
        overlayPanel.style.left = '50%';
        overlayPanel.style.top = '50%';
        overlayPanel.style.right = 'auto';
        overlayPanel.style.bottom = 'auto';
        overlayPanel.style.transform = 'translate(-50%, -50%)';
        // On large desktop (FABs at right side), position panel so it doesn't overlap
        if (window.innerWidth > 1450) {
            const fabGroup = document.querySelector('.fab-group');
            if (fabGroup) {
                const fabLeft = fabGroup.getBoundingClientRect().left;
                const panelWidth = overlayPanel.offsetWidth;
                const desiredRight = fabLeft - 20; // 20px gap
                const desiredLeft = desiredRight - panelWidth;
                if (desiredLeft > 10) {
                    overlayPanel.style.left = desiredLeft + 'px';
                    overlayPanel.style.transform = 'translate(0, -50%)';
                }
            }
        } else if (window.innerWidth > 700) {
            // On tablet, place completely to the right
            overlayPanel.style.left = 'auto';
            overlayPanel.style.right = '20px';
            overlayPanel.style.transform = 'translate(0, -50%)';
        }
    }
};
overlayClose.onclick = () => overlay.classList.add('hidden');

// Help functions
function renderHelp(lang) {
    if (!helpContentContainer || typeof window.HELP_TRANSLATIONS === 'undefined') return;
    const data = window.HELP_TRANSLATIONS[lang] || window.HELP_TRANSLATIONS['en'];

    helpContentContainer.innerHTML = `
        <div class="help-section">
            <h3>${data.voice.title}</h3>
            <p>${data.voice.p1}</p>
            <ul>${data.voice.commands.map(c => `<li>${c}</li>`).join('')}</ul>
        </div>
        <div class="help-section">
            <h3>${data.modes.title}</h3>
            <p>${data.modes.p1}</p>
            <ul>${data.modes.ul.map(u => `<li>${u}</li>`).join('')}</ul>
        </div>
        <div class="help-section">
            <h3>${data.turnaround.title}</h3>
            <p>${data.turnaround.p1}</p>
            <ul>${data.turnaround.ul.map(u => `<li>${u}</li>`).join('')}</ul>
        </div>
        <div class="help-section">
            <h3>${data.timers.title}</h3>
            <p>${data.timers.p1}</p>
            <ul>${data.timers.ul.map(u => `<li>${u}</li>`).join('')}</ul>
        </div>
        <div class="help-section">
            <h3>${data.theme.title}</h3>
            <ul>${data.theme.ul.map(u => `<li>${u}</li>`).join('')}</ul>
        </div>
        <div class="help-section">
            <h3>${data.briefing.title}</h3>
            <p>${data.briefing.p1}</p>
            <ul>${data.briefing.ul.map(u => `<li>${u}</li>`).join('')}</ul>
            <p>${data.briefing.p2}</p>
        </div>
        <div class="help-section help-footer">
            <p>${data.footer}</p>
        </div>
    `;
}

if (helpToggleBtn) helpToggleBtn.onclick = () => {
    helpOverlay.classList.remove('hidden');
    if (helpLangSelect) {
        const savedLang = localStorage.getItem('b738_help_lang') || 'en';
        helpLangSelect.value = savedLang;
        renderHelp(savedLang);
    }
};
if (helpCloseBtn) helpCloseBtn.onclick = () => helpOverlay.classList.add('hidden');
if (helpLangSelect) {
    helpLangSelect.addEventListener('change', (e) => {
        localStorage.setItem('b738_help_lang', e.target.value);
        renderHelp(e.target.value);
    });
}

function autoScrollToItem(index) {
    const targetEl = document.querySelector(`.checklist-item[data-index="${index}"]`);
    if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Global Right Click -> Uncheck next item
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    currentPlayingBriefingIndex = -1;
    window.speechSynthesis.cancel(); // Stop anything currently playing immediately

    const items = checklistData[currentPageIndex].items;
    const nextItemIdx = items.findIndex(i => !i.checked && isItemVisible(i));
    const nextItem = nextItemIdx !== -1 ? items[nextItemIdx] : null;

    if (isListening) {
        if (!hasStartedReading) {
            // Read CL Only fix: If waiting on flow/briefing items or at the end of the page, right click just navigates or clicks
            if (isReadCLOnly && (!nextItem || nextItem.type === 'flow' || nextItem.type === 'briefing')) {
                if (nextItemIdx !== -1) {
                    toggleCheck(nextItemIdx);
                    autoScrollToItem(nextItemIdx);
                } else {
                    btnNext.click();
                }
                return;
            }
            if (isReadCLOnly) readCLOnlyChecklistPhaseActive = true;
            prepareChecklistReading();
        } else {
            simulateCheckAction();
        }
    } else {
        if (nextItemIdx !== -1) {
            toggleCheck(nextItemIdx);
            autoScrollToItem(nextItemIdx);
        } else {
            btnNext.click();
        }
    }
});

// Click on Checklist Title to start reading if in voice mode
pageTitleElem.onclick = () => {
    if (isListening && !hasStartedReading) {
        if (isReadCLOnly) readCLOnlyChecklistPhaseActive = true;
        prepareChecklistReading();
    }
};

// Draggable overlay physics
const overlayPanel = document.querySelector('.overlay-panel');
const overlayHandle = document.getElementById('overlay-drag-handle');
let isDragging = false, hasMoved = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

if (overlayPanel && overlayHandle) {
    overlayHandle.addEventListener('mousedown', dragStart);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('mousemove', drag);

    // Touch
    overlayHandle.addEventListener('touchstart', dragStart, { passive: true });
    document.addEventListener('touchend', dragEnd);
    document.addEventListener('touchmove', drag, { passive: false });

    function dragStart(e) {
        if (e.target.closest('.overlay-close')) return;
        const rect = overlayPanel.getBoundingClientRect();

        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - rect.left;
            initialY = e.touches[0].clientY - rect.top;
        } else {
            initialX = e.clientX - rect.left;
            initialY = e.clientY - rect.top;
        }

        isDragging = true;
        hasMoved = false;
    }

    function dragEnd(e) {
        isDragging = false;
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();

            // Convert to absolute positioning only on first actual movement
            if (!hasMoved) {
                hasMoved = true;
                const rect = overlayPanel.getBoundingClientRect();
                overlayPanel.style.transform = 'none';
                overlayPanel.style.bottom = 'auto';
                overlayPanel.style.right = 'auto';
                overlayPanel.style.left = rect.left + 'px';
                overlayPanel.style.top = rect.top + 'px';
            }

            let clientX, clientY;
            if (e.type === 'touchmove') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            overlayPanel.style.left = (clientX - initialX) + 'px';
            overlayPanel.style.top = (clientY - initialY) + 'px';
        }
    }
}

// Draggable Action Timer
let timerIsDragging = false, timerStartX, timerStartY;
if (actionTimerOverlay) {
    actionTimerOverlay.addEventListener('mousedown', timerDragStart);
    document.addEventListener('mouseup', timerDragEnd);
    document.addEventListener('mousemove', timerDrag);

    actionTimerOverlay.addEventListener('touchstart', timerDragStart, { passive: true });
    document.addEventListener('touchend', timerDragEnd);
    document.addEventListener('touchmove', timerDrag, { passive: false });

    function timerDragStart(e) {
        if (e.target.closest('.action-timer-close')) return;
        let left = parseFloat(window.getComputedStyle(actionTimerOverlay).left);
        let top = parseFloat(window.getComputedStyle(actionTimerOverlay).top);
        if (e.type === 'touchstart') {
            timerStartX = e.touches[0].clientX - left;
            timerStartY = e.touches[0].clientY - top;
        } else {
            timerStartX = e.clientX - left;
            timerStartY = e.clientY - top;
        }
        timerIsDragging = true;
        actionTimerOverlay.style.cursor = 'grabbing';
    }

    function timerDragEnd() { timerIsDragging = false; if (actionTimerOverlay) actionTimerOverlay.style.cursor = 'grab'; }

    function keepTimerInBounds() {
        if (!actionTimerOverlay || actionTimerOverlay.classList.contains('hidden') || !actionTimerOverlay.style.left) return;
        const rect = actionTimerOverlay.getBoundingClientRect();
        let newLeft = parseFloat(actionTimerOverlay.style.left);
        let newTop = parseFloat(actionTimerOverlay.style.top);
        let changed = false;

        if (rect.right > window.innerWidth) { newLeft += (window.innerWidth - rect.right); changed = true; }
        if (rect.bottom > window.innerHeight) { newTop += (window.innerHeight - rect.bottom); changed = true; }
        if (rect.left < 0) { newLeft -= rect.left; changed = true; }
        if (rect.top < 0) { newTop -= rect.top; changed = true; }

        if (changed) {
            actionTimerOverlay.style.left = newLeft + 'px';
            actionTimerOverlay.style.top = newTop + 'px';
        }
    }
    window.addEventListener('resize', keepTimerInBounds);

    function timerDrag(e) {
        if (timerIsDragging) {
            e.preventDefault();
            let clientX, clientY;
            if (e.type === 'touchmove') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            actionTimerOverlay.style.left = (clientX - timerStartX) + 'px';
            actionTimerOverlay.style.top = (clientY - timerStartY) + 'px';
            keepTimerInBounds();
        }
    }
}

function positionQuickNavDropdown() {
    const rect = hamburgerBtn.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    quickNavDropdown.style.top = (rect.bottom + scrollTop + 12) + 'px';
    quickNavDropdown.style.right = (document.documentElement.clientWidth - rect.right) + 'px';
    quickNavDropdown.style.left = 'auto';
}

hamburgerBtn.onclick = (e) => {
    e.stopPropagation();
    const isHidden = quickNavDropdown.classList.contains('hidden');
    if (isHidden) positionQuickNavDropdown();
    quickNavDropdown.classList.toggle('hidden');
    hamburgerBtn.classList.toggle('open', isHidden);
};

window.addEventListener('resize', () => {
    if (!quickNavDropdown.classList.contains('hidden')) {
        positionQuickNavDropdown();
    }
});
document.addEventListener('click', (e) => {
    if (!hamburgerBtn.contains(e.target) && !quickNavDropdown.contains(e.target)) {
        quickNavDropdown.classList.add('hidden');
        hamburgerBtn.classList.remove('open');
    }
    if (topHamburgerBtn && topSettingsDropdown && !topHamburgerBtn.contains(e.target) && !topSettingsDropdown.contains(e.target)) {
        topSettingsDropdown.classList.remove('show');
    }
});

function buildQuickNav() {
    quickNavDropdown.innerHTML = '';



    checklistData.forEach((page, idx) => {
        // Skip pages with only flow if filter is on
        const pageVisibleItems = page.items.filter(i => isItemVisible(i));
        if (pageVisibleItems.length === 0) return;

        const btn = document.createElement('button');
        btn.className = 'qnav-btn';
        btn.textContent = page.title;
        btn.onclick = () => {
            currentPageIndex = idx;
            renderPage(true);
            quickNavDropdown.classList.add('hidden');
            hamburgerBtn.classList.remove('open');
        };
        if (idx === currentPageIndex) {
            btn.classList.add('active');
        }
        quickNavDropdown.appendChild(btn);
    });

    // Option to load turnaround logic is removed from quick menu and handled via top button
}

function updateGlobalFlightInfo() {
    if (!globalFlightInfoElem) return;
    const cs = document.getElementById('b-callsign').value.trim();
    const orig = document.getElementById('b-origin').value.trim();
    const dest = document.getElementById('b-dest').value.trim();
    let text = [];
    if (cs) text.push(cs);
    if (orig && dest) text.push(`${orig} > ${dest}`);
    else if (orig) text.push(orig);
    else if (dest) text.push(dest);

    if (text.length > 0) {
        globalFlightInfoElem.textContent = text.join(' | ');
        globalFlightInfoElem.style.display = 'inline';
    } else {
        globalFlightInfoElem.style.display = 'none';
        globalFlightInfoElem.textContent = '';
    }
}

function loadBriefing() {
    try {
        const data = JSON.parse(localStorage.getItem(BRIEF_STORAGE_KEY) || '{}');
        BRIEF_FIELDS.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            // For landing type: only restore known valid values
            if (id === 'b-landing-type') {
                if (['1', '2', '3'].includes(data[id])) el.value = data[id];
                else el.value = '';
            } else if (data[id]) {
                el.value = data[id];
            }
        });
    } catch (e) { }
    updateGlobalFlightInfo();
    // Sync custom dropdown UI after values are restored
    const lInputEl = document.getElementById('b-landing-type');
    if (lInputEl) setTimeout(() => lInputEl.dispatchEvent(new Event('input')), 50);
}

function saveBriefing() {
    const data = {};
    BRIEF_FIELDS.forEach(id => { const el = document.getElementById(id); if (el) data[id] = el.value; });
    localStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify(data));
    updateGlobalFlightInfo();
    updateAtcVariables(); // Ensure ATC variables are fresh before rendering
    updateChecklistVariablesUI();

    // Automatically redraw the page to reflect potential briefing visibility changes
    renderPage(false);

}

briefClear.onclick = () => {
    if (confirm('Clear briefing?')) {
        BRIEF_FIELDS.forEach(id => document.getElementById(id).value = '');
        localStorage.removeItem(BRIEF_STORAGE_KEY);
        updateGlobalFlightInfo();
        updateChecklistVariablesUI();
        const lInput = document.getElementById('b-landing-type');
        if (lInput) lInput.dispatchEvent(new Event('input'));
    }
};
BRIEF_FIELDS.forEach(id => document.getElementById(id)?.addEventListener('input', saveBriefing));
// Custom Premium Dropdown Logic for APPR. TYPE
const lTrigger = document.getElementById('landing-dropdown-trigger');
const lOptions = document.getElementById('landing-dropdown-options');
const lInput = document.getElementById('b-landing-type');

if (lTrigger && lOptions && lInput) {
    lTrigger.onclick = (e) => {
        e.stopPropagation();
        lOptions.classList.toggle('show');
    };

    document.addEventListener('click', (e) => {
        if (!lOptions.contains(e.target) && e.target !== lTrigger) {
            lOptions.classList.remove('show');
        }
    });

    document.querySelectorAll('.custom-option').forEach(opt => {
        opt.onclick = () => {
            lInput.value = opt.getAttribute('data-val');
            lTrigger.value = opt.textContent;
            lTrigger.classList.remove('unfilled');
            lOptions.classList.remove('show');
            saveBriefing();
            renderPage(false);
        };
    });

    // Observer to reset trigger UI when briefing is cleared or updated from elsewhere
    const syncDropdownUI = () => {
        if (!lInput.value) {
            lTrigger.value = 'ILS Cat.III';
            lTrigger.classList.add('unfilled');
        } else {
            const selectedOpt = document.querySelector(`.custom-option[data-val="${lInput.value}"]`);
            if (selectedOpt) {
                lTrigger.value = selectedOpt.textContent;
                lTrigger.classList.remove('unfilled');
            }
        }
    };

    // We bind a custom event listener that updates UI when hidden input value changes externally
    lInput.addEventListener('input', syncDropdownUI);
    // Initial sync
    setTimeout(syncDropdownUI, 200);
}

// ============================================================
// SIMBRIEF INTEGRATION
// ============================================================
const simbriefFetchBtn = document.getElementById('b-simbrief-fetch');
const simbriefIdInput = document.getElementById('b-simbrief-id');

if (simbriefFetchBtn && simbriefIdInput) {
    simbriefFetchBtn.onclick = async (e) => {
        e.preventDefault();
        const userid = simbriefIdInput.value.trim();
        if (!userid) {
            alert('Please enter your SimBrief User ID first.');
            return;
        }

        simbriefFetchBtn.classList.add('loading');
        simbriefFetchBtn.disabled = true;
        const originalBtnHTML = simbriefFetchBtn.innerHTML;
        simbriefFetchBtn.innerHTML = '<span>Syncing...</span>';

        try {
            const response = await fetch(`/api/simbrief?userid=${userid}`);
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();

            if (data.error) {
                alert('SimBrief Error: ' + data.error);
            } else if (!data.atc || !data.atc.callsign) {
                 alert('No active flight plan found for this SimBrief ID.');
            } else {
                window.simbriefData = data;
                
                const fmt = (val) => {
                    if (val === undefined || val === null) return '';
                    const s = String(val);
                    return s.replace(/^0+(?=\d)/, '');
                };

                const getMetarTemp = (metar) => {
                    if (!metar) return null;
                    const match = metar.match(/(M?\d{2})\/(M?\d{2})/);
                    if (match) return match[1].replace('M', '-').replace(/^0+/, '');
                    return null;
                };

                const mapAutobrake = (val) => {
                    if (!val) return '';
                    const v = val.toUpperCase();
                    if (v.includes('MAX MAN')) return '3'; 
                    if (v.includes('MAX')) return 'MAX';
                    if (v.includes('MED')) return '3';
                    if (v.includes('MIN') || v.includes('LOW')) return '1';
                    const num = v.match(/\d+/);
                    return num ? num[0] : '';
                };

                const updateFromRwy = () => {
                    const d = window.simbriefData;
                    if (!d) return;
                    
                    const depRwy = document.getElementById('b-dep-rwy')?.value;
                    const arrRwy = document.getElementById('b-arr-rwy')?.value;
                    
                    const takeoff = d.tlr?.takeoff?.runway?.find(r => r.identifier === depRwy) || d.tlr?.takeoff?.runway?.[0] || {};
                    const landing = d.tlr?.landing?.runway?.find(r => r.identifier === arrRwy) || d.tlr?.landing?.runway?.[0] || {};
                    const landingPerf = d.tlr?.landing?.distance_dry || {};

                    const isWet = (d.tlr?.takeoff?.conditions?.surface_condition === 'wet');
                    
                    const perfFields = {
                        'b-v1': fmt(d.vspeeds?.v1 || takeoff.speeds_v1),
                        'b-vr': fmt(d.vspeeds?.vr || takeoff.speeds_vr),
                        'b-v2': fmt(d.vspeeds?.v2 || takeoff.speeds_v2),
                        'b-vref': fmt(d.vspeeds?.vref || landingPerf.speeds_vref),
                        'b-ils-freq': landing.ils_frequency,
                        'b-course': landing.magnetic_course,
                        'b-dep-rwy-hdg': takeoff.magnetic_course,
                        'b-dep-flaps': d.takeoff?.flaps || takeoff.flap_setting,
                        'b-arr-flaps': landing.flap_setting || '30',
                        'b-dep-assumed': d.takeoff?.flex || takeoff.flex_temperature
                    };

                    for (const [id, value] of Object.entries(perfFields)) {
                        const el = document.getElementById(id);
                        if (el && value) el.value = value;
                    }
                };
                
                window.updateBriefingFromRwy = updateFromRwy;

                const fields = {
                    'b-callsign': data.atc?.callsign,
                    'b-origin': data.origin?.icao_code,
                    'b-dest': data.destination?.icao_code,
                    'b-total-fuel': fmt(data.fuel?.plan_takeoff),
                    'b-trip-fuel': fmt(parseInt(data.fuel?.enroute_burn || 0) + parseInt(data.fuel?.taxi || 0)),
                    'b-reserve-fuel': fmt(parseInt(data.fuel?.reserve || 0) + parseInt(data.fuel?.alternate_burn || 0)),
                    'b-trim': data.takeoff?.trim,
                    'b-squawk': data.atc?.squawk,
                    'b-dep-qnh': fmt(data.weather?.origin?.qnh),
                    'b-arr-qnh': fmt(data.weather?.destination?.qnh),
                    'b-dep-temp': getMetarTemp(data.weather?.orig_metar) || data.tlr?.takeoff?.conditions?.temperature || data.weather?.origin?.temp,
                    'b-arr-temp': getMetarTemp(data.weather?.dest_metar) || data.tlr?.landing?.conditions?.temperature || data.weather?.destination?.temp,
                    'b-dep-wind': data.weather?.origin?.wind_dir ? `${data.weather.origin.wind_dir}/${data.weather.origin.wind_spd}` : '',
                    'b-arr-wind': data.weather?.destination?.wind_dir ? `${data.weather.destination.wind_dir}/${data.weather.destination.wind_spd}` : '',
                    'b-dep-dewpt': data.weather?.origin?.dewpoint,
                    'b-arr-dewpt': data.weather?.destination?.dewpoint,
                    'b-dep-rwy': data.origin?.plan_rwy,
                    'b-arr-rwy': data.destination?.plan_rwy,
                    'b-sid': data.general?.sid_ident || data.origin?.sid,
                    'b-star': data.general?.star_ident || data.destination?.star,
                    'b-initial-alt': '', 
                    'b-init-alt': fmt(data.general?.cruise_altitude || data.general?.initial_altitude),
                    'b-dep-tl': fmt(data.origin?.trans_alt),
                    'b-arr-ta': fmt(data.destination?.trans_level ? parseInt(data.destination.trans_level)/10 : ''),
                    'b-taxi-out': data.origin?.taxi_out_route,
                    'b-taxi-in': data.destination?.taxi_in_route,
                    'b-dep-gate': data.origin?.gate || ''
                };

                for (const [id, value] of Object.entries(fields)) {
                    const el = document.getElementById(id);
                    if (el && value) el.value = value;
                }
                
                updateFromRwy();
                
                saveBriefing();
                // Trigger METAR sync automatically after SimBrief
                const syncMetarBtn = document.getElementById('b-metar-sync');
                if (syncMetarBtn) syncMetarBtn.click();
                // We also trigger the landing type dropdown sync if it changed
                const lInput = document.getElementById('b-landing-type');
                if (lInput) lInput.dispatchEvent(new Event('input'));
                
                alert('SimBrief flight data imported successfully!');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            alert('Failed to connect to SimBrief. Please check your connection and User ID.');
        } finally {
            simbriefFetchBtn.classList.remove('loading');
            simbriefFetchBtn.disabled = false;
            simbriefFetchBtn.innerHTML = originalBtnHTML;
        }
    };
}

function parseVariables(text, forSpeech = false) {
    if (!text) return text;
    let result = text;
    BRIEF_FIELDS.forEach(id => {
        const varName = id.replace(/^b-/, '').replace(/-/g, '_');
        const placeholder = `%${varName}%`;

        if (result.includes(placeholder)) {
            const el = document.getElementById(id);
            let val = el ? el.value.trim() : '';

            if (id === 'b-landing-type') {
                if (val === '3' || val === '') val = forSpeech ? 'ILS Cat 3' : 'ILS Cat. 3';
                else if (val === '2') val = 'ILS';
                else if (val === '1') val = 'RNAV';
            }

            if (id === 'b-callsign' && forSpeech) {
                val = formatCallsign(val);
            }

            if ((id === 'b-dep-atis' || id === 'b-arr-atis') && forSpeech && val.length === 1) {
                const upper = val.toUpperCase();
                if (NATO_ALPHABET[upper]) val = NATO_ALPHABET[upper];
            }

            if ((id === 'b-dep-rwy' || id === 'b-arr-rwy') && forSpeech) {
                val = formatRunway(val);
            }

            if (val) {
                result = result.replace(new RegExp(placeholder, 'g'), val);
            } else {
                result = result.replace(new RegExp('\\s*' + placeholder, 'g'), '');
            }
        }
    });
    return result.trim();
}

function getParsedAction(item, forSpeech = false) {
    const action = parseVariables(item.action || "", forSpeech).trim();
    if (!action && item.type !== 'briefing') return 'Check';
    return action;
}

// Global state for briefing UI syncing
let currentPlayingBriefingIndex = -1;

function updateChecklistVariablesUI() {
    if (!containerElem) return;
    const page = checklistData[currentPageIndex];
    if (!page) return;

    const itemsDom = containerElem.querySelectorAll('.checklist-item');
    itemsDom.forEach(div => {
        const itemIdx = div.getAttribute('data-index');
        if (itemIdx === null) return;
        const item = page.items[itemIdx];
        if (!item) return;

        if (item.type === 'briefing') {
            const validSentences = getBriefingValidSentences(item);
            const briefingText = validSentences.join(' ');
            const nameSpan = div.querySelector('.item-name');
            if (nameSpan && nameSpan.textContent !== briefingText) {
                nameSpan.textContent = briefingText;
            }
            return;
        }

        const displayName = parseVariables(item.name);
        const displayAction = getParsedAction(item, false);

        const nameSpan = div.querySelector('.item-name');
        const actionSpan = div.querySelector('.item-action');

        if (nameSpan && nameSpan.textContent !== displayName) {
            nameSpan.textContent = displayName;
        }
        if (actionSpan && actionSpan.textContent !== displayAction) {
            actionSpan.textContent = displayAction;
        }
    });
}
// ============================================================
// CHECKLIST ENGINE
// ============================================================
function init() {
    console.log("Initializing app...");
    
    // Check if initialChecklistData exists and has items
    if (!window.initialChecklistData || !Array.isArray(window.initialChecklistData) || window.initialChecklistData.length === 0) {
        console.warn("No checklist data found! Using emergency fallback.");
        checklistData = [{
            title: "Error Loading Data",
            items: [{ name: "Please check your internet connection or dataset settings.", action: "RETRY", type: "checklist item" }]
        }];
    } else {
        checklistData = initialChecklistData;
    }
    
    checklistData.forEach(p => p.items.forEach(i => { if (i.checked === undefined) i.checked = false; }));

    if (hasFlow()) {
        if (checklistOnlyContainer) checklistOnlyContainer.style.display = 'flex';
    } else {
        if (checklistOnlyContainer) {
            checklistOnlyContainer.style.display = 'none';
            isChecklistOnly = false;
        }
    }

    const hideTestsContainer = document.getElementById('top-hide-tests-container');
    if (hideTestsContainer) {
        const hasTests = checklistData.some(p => p.items.some(i => i.type === 'test'));
        hideTestsContainer.style.display = hasTests ? 'flex' : 'none';
    }

    // Dynamically show/hide Simplify toggle based on whether this dataset has simplify items
    const simplifyContainer = document.getElementById('top-simplify-container');
    if (simplifyContainer) {
        const hasSimplify = checklistData.some(p => p.items.some(i => i.subtype === 'simplify'));
        simplifyContainer.style.display = hasSimplify ? 'flex' : 'none';
    }

    buildQuickNav(); loadBriefing(); loadAtcData(); initMetarAutoSync(); renderPage(true);
}

function renderPage(isNewPage = false) {
    const page = checklistData[currentPageIndex];
    let isShutdownChecklist = page.title.toUpperCase().includes('SHUTDOWN');
    let displayTitle = page.title;
    pageTitleElem.textContent = displayTitle;
    if (globalTitleElem) {
        globalTitleElem.textContent = `B738 Normal Procedure Checklist | ${displayTitle}`;
    }
    containerElem.innerHTML = '';

    // Draw continuous unbroken line setup
    let gapIndexes = [];

    // Find first unfinished item for bolding
    const firstUnfinishedIdx = page.items.findIndex(item =>
        !item.checked && isItemVisible(item)
    );

    // Visibility logic for Turnaround button (controlled by turnaround: "yes" flag)
    if (turnaroundPhaseBtn) {
        if (page.turnaround === "yes" && hasTurnaroundItems()) {
            turnaroundPhaseBtn.classList.remove('hidden');
        } else {
            turnaroundPhaseBtn.classList.add('hidden');
        }
    }

    let currentType = null;

    page.items.forEach((item, index) => {
        if (!isItemVisible(item)) return;

        if (item.type && !isChecklistOnly && item.type !== currentType) {
            currentType = item.type;
            const subtitle = document.createElement('div');
            subtitle.className = 'checklist-subtitle';
            subtitle.textContent = (item.type === 'flow') ? 'Flow' : (item.type === 'briefing' ? 'Briefing' : (item.type === 'fake_atc' ? 'ATC' : 'Checklist items'));
            containerElem.appendChild(subtitle);
        }

        const div = document.createElement('div');
        const isActive = (index === firstUnfinishedIdx);
        div.className = `checklist-item ${item.checked ? 'checked' : ''} ${isActive ? 'active' : ''}`;
        if (item.type === 'briefing') div.classList.add('briefing-item');
        if (item.type === 'fake_atc') div.classList.add('atc-item');
        div.setAttribute('data-index', index);

        // Disable click styling for visual-only items
        div.onclick = () => toggleCheck(index);

        if (item.type === 'briefing' || item.type === 'fake_atc') {
            let displayOutput = '';
            if (item.type === 'fake_atc') {
                const validSentences = getFakeAtcValidSentences(item, false);
                let currentRole = null;
                let htmlParts = [];
                let currentBlock = [];
                let currentBlockRole = 'pm';

                validSentences.forEach(sentence => {
                    let role = 'pm';
                    let cleanSentence = sentence;
                    if (sentence.toLowerCase().startsWith('#atc')) {
                        role = 'atc';
                        cleanSentence = sentence.substring(4).trim();
                    } else if (sentence.toLowerCase().startsWith('#pm')) {
                        role = 'pm';
                        cleanSentence = sentence.substring(3).trim();
                    }

                    if (currentRole !== null && currentRole !== role) {
                        htmlParts.push({ text: currentBlock.join(' '), role: currentBlockRole });
                        currentBlock = [];
                    }
                    currentRole = role;
                    currentBlockRole = role;
                    currentBlock.push(cleanSentence);
                });
                if (currentBlock.length > 0) {
                    htmlParts.push({ text: currentBlock.join(' '), role: currentBlockRole });
                }
                displayOutput = htmlParts.map(part =>
                    part.role === 'atc'
                        ? `<span class="atc-voice-text">${part.text}</span>`
                        : `<span>${part.text}</span>`
                ).join('<div style="margin-top: 8px;"></div>');
            } else {
                displayOutput = getBriefingValidSentences(item).join(' ');
            }

            const svgPlay = `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="margin-left: 2px;"><path d="M8 5v14l11-7z"/></svg>`;
            const svgStop = `<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M6 6h12v12H6z"/></svg>`;
            const isPlaying = (currentPlayingBriefingIndex === index);

            const isCheckedVisual = item.checked || isPlaying;
            // Use correct CSS class name regardless of item.type value
            const atcTypeClass = item.type === 'fake_atc' ? 'atc-item' : 'briefing-item';
            div.className = `checklist-item ${isCheckedVisual ? 'checked' : ''} ${isActive ? 'active' : ''} ${atcTypeClass}`;

            const iconLabel = isPlaying ? svgStop : svgPlay;

            div.innerHTML = `<div class="item-text" style="display:block;"><div class="item-name" style="white-space: normal; line-height: 1.5; padding-right: 0;">${displayOutput}</div></div><div class="custom-checkbox">${iconLabel}</div>`;
        } else {
            const displayName = parseVariables(item.name);
            const displayAction = getParsedAction(item, false);

            div.innerHTML = `<div class="item-text"><span class="item-name">${displayName}</span><span class="dots"></span><span class="item-action">${displayAction}</span></div><div class="custom-checkbox"></div>`;
        }
        containerElem.appendChild(div);
    });

    if (isNewPage) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Trigger animation only on new page
        containerElem.classList.remove('animate');
        void containerElem.offsetWidth;
        containerElem.classList.add('animate');
        buildQuickNav();
    }
    updateControls();
}

function toggleCheck(itemIndex, silent = false) {
    const item = checklistData[currentPageIndex].items[itemIndex];
    const isUnchecking = item.checked;
    item.checked = !item.checked;

    if (item.type === 'briefing' || item.type === 'fake_atc') {
        if (isUnchecking || currentPlayingBriefingIndex === itemIndex) {
            currentPlayingBriefingIndex = -1;
            window.speechSynthesis.cancel();
            window.currentSpeechSession = (window.currentSpeechSession || 0) + 1; // Kill current queue
        }
    }

    if (item.checked && !isMuted) {
        try { if (window.navigator.vibrate) window.navigator.vibrate(25); } catch (e) { }
        if (audioClick) { audioClick.currentTime = 0; audioClick.play().catch(() => { }); }
    }
    renderPage(false);

    // Handle manual checking (silent=false)
    if (!silent && item.checked) {
        if (item.type === 'briefing' || item.type === 'fake_atc') {
            if (!isListening) return; // Ak je hlasový režim vypnutý, položku len zaškrtneme (stalo sa vyššie) a nepúšťame zvuk

            // Uncheck the item so speakCurrentItem finds it and reads it.
            // simulateCheckAction will check it automatically when finished.
            item.checked = false;
            renderPage(false);
            
            window.manualBriefingPlay = true;

            hasStartedReading = true;
            isListening = true; // Ensure it can speak
            
            speakCurrentItem(true); 
            return; // Stop further processing
        }
 else if (item.timer && !isTimerDisabled) {
            if (isListening && hasStartedReading && typeof processTimerItem === 'function') {
                processTimerItem(item);
            } else {
                const isContinuous = item.timerContinuous === "yes";
                startActionTimer(parseVariables(item.timerLabel || item.name), parseInt(item.timer), null, isContinuous, item.timerWarning);
            }
        } else if (typeof speakCurrentItem === 'function') {
            if (isListening && hasStartedReading) {
                speakCurrentItem();
            }
        }
    }
}

function updateControls() {
    let targetPageIndex = currentPageIndex;

    // Find next valid page considering the filter
    let nextValidPageIndex = -1;
    for (let i = currentPageIndex + 1; i < checklistData.length; i++) {
        const hasVisible = checklistData[i].items.some(it => isItemVisible(it));
        if (hasVisible) {
            nextValidPageIndex = i;
            break;
        }
    }

    let prevValidPageIndex = -1;
    for (let i = currentPageIndex - 1; i >= 0; i--) {
        const hasVisible = checklistData[i].items.some(it => isItemVisible(it));
        if (hasVisible) {
            prevValidPageIndex = i;
            break;
        }
    }

    const page = checklistData[currentPageIndex];
    const visibleItems = page.items.filter(i => isItemVisible(i));
    const allChecked = visibleItems.every(i => i.checked);

    document.querySelector('.controls').style.display = 'flex';

    const isMobile = window.innerWidth <= 700;

    if (prevValidPageIndex >= 0) {
        btnPrev.innerHTML = isMobile ? '« Prev' : `« ${checklistData[prevValidPageIndex].title}`;
        btnPrev.style.visibility = 'visible';
    } else {
        btnPrev.style.visibility = 'hidden';
    }
    btnPrev.disabled = (prevValidPageIndex < 0);

    if (nextValidPageIndex < 0) {
        btnNext.textContent = 'Finish';
    } else {
        let label = checklistData[nextValidPageIndex].title;
        // Dynamically change next label to hide flow pages 
        if (isChecklistOnly && checklistData[nextValidPageIndex].items.some(i => i.type === 'flow') && !checklistData[nextValidPageIndex].items.every(i => i.type === 'flow')) {
            label = checklistData[nextValidPageIndex].title;
        }
        btnNext.innerHTML = isMobile ? 'Next »' : `${label} »`;
    }

    // Toggle disabled class & tooltip for next button
    if (visibleItems.length > 0 && !allChecked) {
        btnNext.disabled = true;
        btnNext.classList.add('next-tooltip-active');
    } else {
        btnNext.disabled = false;
        btnNext.classList.remove('next-tooltip-active');
    }

    // Display next button logic: hide entirely on final page
    if (nextValidPageIndex < 0) {
        btnNext.style.display = 'none';
        btnNext.style.visibility = 'hidden';
    } else {
        btnNext.style.display = 'block';
        btnNext.style.visibility = 'visible';
    }

    const checkedLength = visibleItems.filter(i => i.checked).length;
    progressFill.style.width = visibleItems.length > 0 ? `${(checkedLength / visibleItems.length) * 100}%` : '100%';

    // Update global progress bar (overall progress across all pages)
    if (globalProgressFill) {
        let totalItemsGlobal = 0;
        let totalCheckedGlobal = 0;
        checklistData.forEach(p => {
            const vis = p.items.filter(i => isItemVisible(i));
            totalItemsGlobal += vis.length;
            totalCheckedGlobal += vis.filter(i => i.checked).length;
        });
        globalProgressFill.style.width = totalItemsGlobal > 0 ? `${(totalCheckedGlobal / totalItemsGlobal) * 100}%` : '0%';
    }
}

btnPrev.onclick = () => {
    let prevValidPageIndex = -1;
    for (let i = currentPageIndex - 1; i >= 0; i--) {
        if (checklistData[i].items.some(it => isItemVisible(it))) {
            prevValidPageIndex = i;
            break;
        }
    }
    if (prevValidPageIndex >= 0) {
        currentPageIndex = prevValidPageIndex;
        hasStartedReading = false;
        readCLOnlyChecklistPhaseActive = false;
        isTimerActivePause = false;
        renderPage(true);
    }
};

btnNext.onclick = () => {
    let nextValidPageIndex = -1;
    for (let i = currentPageIndex + 1; i < checklistData.length; i++) {
        if (checklistData[i].items.some(it => isItemVisible(it))) {
            nextValidPageIndex = i;
            break;
        }
    }
    if (nextValidPageIndex >= 0) {
        currentPageIndex = nextValidPageIndex;
        hasStartedReading = false;
        readCLOnlyChecklistPhaseActive = false;
        isTimerActivePause = false;
        renderPage(true);
    }
};

// ============================================================
// VOICE RECOGNITION & SYNTHESIS
// ============================================================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let isListening = false;
let wakeLock = null;

async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) { }
    }
}
function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release().then(() => { wakeLock = null; });
    }
}
// ============================================================
// UI TIMER ACTION OVERLAY LOGIC
// ============================================================
let actionTimerInterval = null;
let actionTimerOnComplete = null;
let activeTimerWarning = null;

function startActionTimer(label, durationSecs, onComplete, isContinuous = false, warningTarget = null) {
    if (actionTimerInterval) clearInterval(actionTimerInterval);
    actionTimerOnComplete = onComplete;
    activeTimerWarning = warningTarget;

    actionTimerLabel.textContent = label;
    actionTimerOverlay.classList.remove('hidden');

    let remaining = durationSecs;
    const totalTime = durationSecs;

    // reset circle
    actionTimerCircle.style.transition = 'none';
    actionTimerCircle.style.strokeDashoffset = '0';
    actionTimerTime.style.fontSize = ''; // reset font size

    function updateDisplay(secs) {
        if (secs <= 0 && isContinuous) {
            actionTimerTime.innerHTML = `<span style="font-size: 1.1rem; letter-spacing: 0;">TIMER END</span>`;
        } else {
            const m = Math.floor(Math.max(0, secs) / 60).toString().padStart(2, '0');
            const s = (Math.max(0, secs) % 60).toString().padStart(2, '0');
            actionTimerTime.textContent = `${m}:${s}`;
        }

        // 452 is the circumference of r=72 circle (2 * PI * 72)
        // Smer hodinových ručičiek: offset ide od 452 (prázdne) k 0 (plné)
        const progress = Math.max(0, secs) / totalTime;
        const offset = 452 * progress;
        actionTimerCircle.style.strokeDashoffset = offset;
    }

    updateDisplay(remaining);

    // Re-enable transition for smooth circle
    setTimeout(() => { actionTimerCircle.style.transition = 'stroke-dashoffset 1s linear'; }, 50);

    actionTimerInterval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(actionTimerInterval);
            actionTimerInterval = null;
            activeTimerWarning = null;
            updateDisplay(0);

            if (isContinuous) {
                // Keep overlay visible, wait for user to close it.
                if (actionTimerOnComplete) { actionTimerOnComplete(); actionTimerOnComplete = null; }
            } else {
                setTimeout(() => {
                    actionTimerOverlay.classList.add('hidden');
                    if (actionTimerOnComplete) { actionTimerOnComplete(); actionTimerOnComplete = null; }
                }, 800);
            }
        } else {
            updateDisplay(remaining);
        }
    }, 1000);
}

// X tlačidlo na zatvorenie timera (funguje rovnako, ako keby odpocet dobehol)
const actionTimerCloseBtn = document.getElementById('action-timer-close');
if (actionTimerCloseBtn) {
    actionTimerCloseBtn.onclick = () => {
        if (actionTimerInterval) clearInterval(actionTimerInterval);
        actionTimerInterval = null;
        activeTimerWarning = null;
        actionTimerOverlay.classList.add('hidden');
        if (actionTimerOnComplete) { actionTimerOnComplete(); actionTimerOnComplete = null; }
    };
}

// ============================================================
// SPEECH RECOGNITION
// ============================================================
let hasStartedReading = false;
let readCLOnlyChecklistPhaseActive = false;
let isTimerActivePause = false;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let isSpeaking = false;
    let cachedVoiceType = null;
    let cachedVoice = null;
    let lastCheckedTime = 0;
    let processedMatchesCount = 0;

    let processedStopCount = 0;
    let processedRepeatCount = 0;
    let lastTranscriptLength = 0;

    window.addEventListener('b738_voice_changed', () => {
        cachedVoice = null;
    });

    // Warm up voices list as early as possible (Android needs this)
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; };
    }
    window.speechSynthesis.getVoices(); // trigger load

    let cachedVoiceMale = null;
    let cachedVoiceFemale = null;

    function getSelectedVoice(overrideRole = null) {
        let wantMale = isMaleVoice;
        if (overrideRole === 'pm') wantMale = isMaleVoice;
        else if (overrideRole === 'atc') wantMale = !isMaleVoice;

        if (wantMale && cachedVoiceMale) return cachedVoiceMale;
        if (!wantMale && cachedVoiceFemale) return cachedVoiceFemale;

        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return null;

        const normLang = v => v.lang.toLowerCase().replace(/_/g, '-');
        const engVoices = voices.filter(v => normLang(v).startsWith('en'));
        const searchList = engVoices.length > 0 ? engVoices : voices;

        const preferredFemale = ['samantha', 'google us english', 'zira', 'karen', 'moira', 'tessa', 'female', 'sfg', 'fis'];
        const preferredMale = [
            'google uk english male', 'daniel', 'en-gb-x-gbd', 'en-gb-x-gbm', 'en-gb-x',
            'david', 'mark', 'alex', 'male', 'rjs', 'iom', 'tpd', 'lee'
        ];

        const preferred = wantMale ? preferredMale : preferredFemale;
        let selectedVoice = null;

        for (const name of preferred) {
            const voice = searchList.find(v =>
                v.name.toLowerCase().includes(name) ||
                (v.voiceURI && v.voiceURI.toLowerCase().includes(name))
            );
            if (voice) { selectedVoice = voice; break; }
        }

        if (!selectedVoice) {
            if (wantMale) {
                const gbVoice = searchList.find(v => normLang(v).startsWith('en-gb'));
                if (gbVoice) selectedVoice = gbVoice;
                else {
                    const auVoice = searchList.find(v => normLang(v).startsWith('en-au'));
                    if (auVoice) selectedVoice = auVoice;
                }
            } else {
                const usVoice = searchList.find(v => normLang(v).startsWith('en-us'));
                if (usVoice) selectedVoice = usVoice;
            }
        }

        if (!selectedVoice && wantMale && searchList.length > 1) {
            selectedVoice = searchList[searchList.length - 1];
        }

        if (!selectedVoice) selectedVoice = searchList[0] || null;

        if (wantMale) cachedVoiceMale = selectedVoice;
        else cachedVoiceFemale = selectedVoice;

        return selectedVoice;
    }

    // Moved out: NATO_ALPHABET and CLASSIC_SPELL_EXCEPTIONS are now global

    const DONT_SPELL = new Set([
        'START', 'STOP', 'GO', 'AND', 'OR', 'ON', 'OFF', 'UP', 'DOWN',
        'CHECK', 'SET', 'ARM', 'AUTO', 'TAXI', 'SPEED', 'GEAR', 'FLAPS',
        'TRIM', 'LEFT', 'RIGHT', 'ATIS', 'VREF', 'I', 'TO', 'VIA',
        'BEFORE', 'AFTER', 'NORMAL', 'CHECKLIST', 'FLOW', 'ROUTING',
        'FLIGHT', 'DECK', 'DOOR', 'PASSENGER', 'SIGNS', 'MCP', 'MACH',
        'DESCEND', 'APPROACH', 'LANDING', 'SHUTDOWN', 'SECURE', 'CLEAN',
        'TAKE-OFF', 'TAKE', 'PREFLIGHT', 'NAV', 'YAW', 'ENGINE', 'PUSHBACK',
        'LINE', 'CRUISE', 'DESCENT', 'CAB', 'UTIL', 'BUS', 'BARO', 'EFIS',
        'TOGA', 'PACK', 'PACKS', 'LNAV', 'VNAV', 'SIDE', 'RNAV', 'BRATISLAVA', 'PRAGUE', 'VIENNA', 'WARSAW', 'BUDAPEST'
    ]);

    function spellAbbreviations(text, skipSpelling = false) {
        // Special phrase handling
        text = text.replace(/COMMAND A/gi, 'command ey')
            .replace(/COMMAND B/gi, 'command bee')
            .replace(/\bL\s+SIDE\b/gi, 'left side')
            .replace(/\bR\s+SIDE\b/gi, 'right side')
            .replace(/\bL\s*&\s*R\b/gi, 'left and right')
            .replace(/\bG\/S\b/gi, 'glide slope')
            .replace(/\bP-inhibit\b/gi, 'p inhibit')
            .replace(/(\d+(?:\.\d+)?)\s*l\b/gi, '$1 liters')
            .replace(/([-+]?\d+)\s*(?:°|degrees)?\s*c\b/gi, '$1 celsius')
            .replace(/°\s*C\b/gi, 'celsius')
            .replace(/\bIGN R\b/gi, 'ignition right')
            .replace(/\bWXR\b/gi, 'weather')
            .replace(/\bINIT ALT\b/gi, 'initial altitude')
            .replace(/100\s*%/g, 'one hundred percent')
            .replace(/\bGRD\b/gi, 'ground')
            .replace(/CDU DEP\/ARR, LEGS, DES pages/gi, 'CDU departure approach, legs and des pages')
            .replace(/\bDEP\/ARR\b/gi, 'departure approach')
            .replace(/\bP6\b/gi, 'p 6')
            .replace(/\bP18\b/gi, 'p 18');

        // Explicitly read decimal dots in numbers (e.g., trim 5.5 -> 5 dot 5)
        text = text.replace(/(\d+)\.(\d+)/g, '$1 dot $2');

        if (skipSpelling) {
            // Still process numbers but skip NATO/Classic spell logic
            let result = text.replace(/\b(\d{2,})\b/g, (match) => match.split('').join(' '));
            return result.replace(/0/g, 'zero');
        }

        // 1. NATO Hlaskovanie a vynimky
        let result = text.replace(/\b([a-zA-Z0-9]+)\b/g, (match) => {
            const upper = match.toUpperCase();

            if (CLASSIC_SPELL_EXCEPTIONS.has(upper)) {
                return upper.split('').join(' ');
            }

            // Special case for single letters (like ATIS code A)
            if (match.length === 1 && /^[A-Z]$/.test(match)) {
                if (DONT_SPELL.has(match)) return match;
                return NATO_ALPHABET[match] || match;
            }

            // Only spell if the ORIGINAL match was all uppercase and at least 2 chars long
            if (/^[A-Z0-9]{2,}$/.test(match)) {
                if (DONT_SPELL.has(match)) return match;
                return match.split('').map(char => {
                    if (/[A-Z]/.test(char)) return NATO_ALPHABET[char];
                    return char;
                }).join(' ');
            }

            return match;
        });

        // 2. Čísla s 2+ ciframi: čítaj po jednom (100 → "1 0 0")
        result = result.replace(/\b(\d{2,})\b/g, (match) => match.split('').join(' '));

        return result.replace(/0/g, 'zero').replace(/9/g, 'niner');
    }

    function prepareChecklistReading() {
        hasStartedReading = true;
        if (!isMuted) window.speechSynthesis.cancel();
        const page = checklistData[currentPageIndex];
        const pageTitle = page.title;

        // In Read CL Only mode, determine what type of content we're on
        if (isReadCLOnly) {
            const visibleItems = page.items.filter(i => isItemVisible(i));
            const hasChecklistItems = visibleItems.some(i => i.type === 'checklist item');
            const hasBriefing = visibleItems.some(i => i.type === 'briefing');
            const hasOnlyFlow = visibleItems.every(i => i.type === 'flow');

            if (hasOnlyFlow) {
                // Pure flow page in Read CL Only – ignore the 'checklist' voice command
                // Just pause the engine and return
                hasStartedReading = false;
                isSpeaking = false;
                if (isListening) {
                    try { recognition.start(); } catch (e) { }
                }
                return;
            }
        }

        // Chapter titles should NEVER be spelled out as NATO/abbreviations
        const firstVisibleItem = page.items.find(i => isItemVisible(i));
        const hasCLItems = page.items.some(i => i.type === 'checklist item');
        
        if (!hasCLItems) {
            speakCurrentItem();
            return;
        }

        let titleSuffix = " Checklist.";
        if (firstVisibleItem && firstVisibleItem.type !== 'checklist item' && !isReadCLOnly) {
            titleSuffix = ".";
        }

        const utterance = new SpeechSynthesisUtterance(spellAbbreviations(pageTitle, true) + titleSuffix);
        utterance.lang = 'en-US';
        utterance.rate = (isMaleVoice ? 1.28 : 1.09);
        utterance.voice = getSelectedVoice();

        isSpeaking = true;
        try { recognition.abort(); } catch (e) { }

        utterance.onstart = () => { isSpeaking = true; };
        utterance.onend = () => { speakCurrentItem(); };
        if (!isMuted) window.speechSynthesis.speak(utterance);
        else {
            setTimeout(() => { isSpeaking = false; speakCurrentItem(); }, 100);
        }
    }

    function simulateCheckAction() {
        if (!isListening || !hasStartedReading) return;
        const items = checklistData[currentPageIndex].items;
        const nextItemIdx = items.findIndex(i => !i.checked && isItemVisible(i));

        if (nextItemIdx !== -1) {
            // Use silent=true because simulateCheckAction handles its own reading/timer after 1120ms
            toggleCheck(nextItemIdx, true);
            voiceEqualizer.classList.add('success');
            micBtn.classList.add('success');
            setTimeout(() => {
                if (isListening) {
                    voiceEqualizer.classList.remove('success');
                    micBtn.classList.remove('success');
                }
            }, 1500);

            const activatedItem = items[nextItemIdx];
            
            if (window.manualBriefingPlay) {
                window.manualBriefingPlay = false;
                hasStartedReading = false;
                isSpeaking = false;
                if (isListening) {
                    try { recognition.start(); } catch (e) { }
                }
                return;
            }
            
            if (activatedItem && activatedItem.timer && !isTimerDisabled) processTimerItem(activatedItem);
            else setTimeout(() => { speakCurrentItem(); }, 1120);
        } else {
            btnNext.click();
        }
    }

    function processTimerItem(activatedItem) {
        const timerSecs = parseInt(activatedItem.timer);
        const isContinuous = activatedItem.timerContinuous === "yes";

        if (!isContinuous) {
            isTimerActivePause = true;
        }

        isSpeaking = true;
        try { recognition.abort(); } catch (e) { }

        const announcement = activatedItem.timerAnnouncement;

        const onCompleteCallback = () => {
            if (!isContinuous) {
                const doneUtterance = new SpeechSynthesisUtterance('Timer complete. We may continue.');
                doneUtterance.lang = 'en-US'; doneUtterance.rate = (isMaleVoice ? 1.28 : 1.09); doneUtterance.voice = getSelectedVoice();
                doneUtterance.onend = () => {
                    isTimerActivePause = false;
                    setTimeout(() => { speakCurrentItem(); }, 560);
                };
                if (!isMuted) window.speechSynthesis.speak(doneUtterance);
                else {
                    isTimerActivePause = false;
                    setTimeout(() => { speakCurrentItem(); }, 200);
                }
            } else {
                if (isTimerActivePause) {
                    isTimerActivePause = false;
                    speakCurrentItem();
                }
            }
        };

        if (announcement) {
            setTimeout(() => {
                startActionTimer(parseVariables(activatedItem.timerLabel || activatedItem.name), timerSecs, onCompleteCallback, isContinuous, activatedItem.timerWarning);

                if (!isMuted) {
                    const announcementUtterance = new SpeechSynthesisUtterance(spellAbbreviations(parseVariables(announcement, true)));
                    announcementUtterance.lang = 'en-US'; announcementUtterance.rate = (isMaleVoice ? 1.28 : 1.09); announcementUtterance.voice = getSelectedVoice();

                    if (isContinuous) {
                        announcementUtterance.onend = () => { setTimeout(() => { speakCurrentItem(); }, 560); };
                    }
                    window.speechSynthesis.speak(announcementUtterance);
                } else {
                    if (isContinuous) setTimeout(() => { speakCurrentItem(); }, 560);
                }
            }, 840);
        } else {
            setTimeout(() => {
                startActionTimer(parseVariables(activatedItem.timerLabel || activatedItem.name), timerSecs, onCompleteCallback, isContinuous, activatedItem.timerWarning);

                if (isContinuous) {
                    setTimeout(() => { speakCurrentItem(); }, 840);
                }
            }, 840);
        }
    }

    function speakCurrentItem(force = false) {
        if (!isListening || (!hasStartedReading && !force)) return;
        const items = checklistData[currentPageIndex].items;
        const nextItem = items.find(i => !i.checked && isItemVisible(i));

        window.speechSynthesis.cancel();

        if (nextItem) {
            // AUTOMATICKÉ SKROLOVANIE
            const nextItemIdx = items.indexOf(nextItem);
            autoScrollToItem(nextItemIdx);

            // === READ CL ONLY: Flow/Briefing/ATC items - no voice, no mic reaction ===
            if (isReadCLOnly && (nextItem.type === 'flow' || nextItem.type === 'briefing' || nextItem.type === 'fake_atc')) {
                // If we just finished a checklist phrase, announce "completed" before pausing!

                if (readCLOnlyChecklistPhaseActive) {
                    readCLOnlyChecklistPhaseActive = false; // Reset so it only fires once

                    // Only announce "Checklist completed" if the last checked visible item was actually a CL item.
                    // If it was a fake_atc, skip the announcement (prevents false "completed" after ATC dialogue).
                    const lastCheckedBeforeFlow = items.slice(0, nextItemIdx).reverse()
                        .find(i => isItemVisible(i) && i.checked);
                    const lastWasCL = lastCheckedBeforeFlow && lastCheckedBeforeFlow.type === 'checklist item';

                    if (lastWasCL) {
                        const page = checklistData[currentPageIndex];
                        const completeText = spellAbbreviations(page.title, true) + " Checklist completed.";
                        const utterance = new SpeechSynthesisUtterance(completeText);
                        utterance.lang = 'en-US';
                        utterance.rate = (isMaleVoice ? 1.28 : 1.09);
                        utterance.voice = getSelectedVoice();
                        isSpeaking = true;
                        try { recognition.abort(); } catch (e) { }

                        utterance.onstart = () => { isSpeaking = true; };
                        utterance.onend = () => {
                            isSpeaking = false;
                            hasStartedReading = false;
                            if (isListening) {
                                try { recognition.start(); } catch (e) { }
                            }
                        };
                        if (!isMuted) window.speechSynthesis.speak(utterance);
                        else { utterance.onend(); }
                        return;
                    }
                }

                // Do not auto-check. Just pause the voice engine and let the user manually click through.
                hasStartedReading = false;
                isSpeaking = false;
                if (isListening) {
                    try { recognition.start(); } catch (e) { }
                }
                return;
            }

            // === READ CL ONLY: When reaching a checklist item, pause and wait for "checklist" command ===
            if (isReadCLOnly && nextItem.type === 'checklist item' && !readCLOnlyChecklistPhaseActive) {
                // We've arrived at the checklist section – stop and wait for "checklist" voice command
                hasStartedReading = false;
                isSpeaking = false;
                if (isListening) {
                    try { recognition.start(); } catch (e) { }
                }
                return;
            }


            // === MID-PAGE TRANSITION LOGIC ===
            let transitionText = "";
            let nextItemIdxBackup = items.indexOf(nextItem);

            if (!isReadCLOnly) {
                let lastCheckedItem = null;
                for (let i = nextItemIdxBackup - 1; i >= 0; i--) {
                    if (items[i] && isItemVisible(items[i]) && items[i].checked) {
                        lastCheckedItem = items[i];
                        break;
                    }
                }

                if (lastCheckedItem) {
                    const isNextCL = nextItem.type === 'checklist item';
                    const isLastCL = lastCheckedItem.type === 'checklist item';
                    const isLastFlow = lastCheckedItem.type === 'flow';
                    const isNextATC = nextItem.type === 'fake_atc';
                    const isLastATC = lastCheckedItem.type === 'fake_atc';
                    
                    if (isLastFlow && isNextCL) {
                        transitionText = `${checklistData[currentPageIndex].title} Checklist. `;
                    } else if (isLastCL && !isNextCL) {
                        transitionText = `${checklistData[currentPageIndex].title} Checklist complete. `;
                    }

                }
            }

            let utterancesQueue = [];

            if (transitionText) {
                utterancesQueue.push({ text: transitionText, role: 'pm' });
            }

            if (nextItem.type === 'briefing') {
                currentPlayingBriefingIndex = nextItemIdxBackup;
                renderPage(false);
                utterancesQueue.push({ text: getBriefingValidSentences(nextItem, true).join(' '), role: 'pm' });
            } else if (nextItem.type === 'fake_atc') {
                currentPlayingBriefingIndex = nextItemIdxBackup;
                renderPage(false);
                let sentences = getFakeAtcValidSentences(nextItem, true);
                sentences.forEach(sentence => {
                    let role = 'pm';
                    let text = sentence;
                    if (text.toLowerCase().startsWith('#pause')) {
                        utterancesQueue.push({ text: "", role: 'pm', duration: 2000 });
                        return;
                    }
                    if (text.toLowerCase().startsWith('#atc')) {
                        role = 'atc';
                        text = text.substring(4).trim();
                    } else if (text.toLowerCase().startsWith('#pm')) {
                        role = 'pm';
                        text = text.substring(3).trim();
                    }
                    utterancesQueue.push({ text: text, role: role });
                });
            } else {
                utterancesQueue.push({ text: `${nextItem.name}. ${getParsedAction(nextItem, true)}`, role: 'pm' });
            }

            if (activeTimerWarning && actionTimerInterval) {
                const searchTarget = parseVariables(activeTimerWarning).toLowerCase();
                const matchedName = parseVariables(nextItem.name).toLowerCase();
                if (matchedName.includes(searchTarget)) {
                    const waitUtterance = new SpeechSynthesisUtterance("Wait for timer.");
                    waitUtterance.lang = 'en-US';
                    waitUtterance.rate = (isMaleVoice ? 1.28 : 1.09);
                    waitUtterance.voice = getSelectedVoice();
                    isSpeaking = true;
                    isTimerActivePause = true;
                    try { recognition.abort(); } catch (e) { }

                    waitUtterance.onstart = () => { isSpeaking = true; };
                    waitUtterance.onend = () => {
                        // Pause sequence here until the continuous timer finishes.
                    };
                    if (!isMuted) window.speechSynthesis.speak(waitUtterance);
                    else waitUtterance.onend();
                    return;
                }
            }

            isSpeaking = true; // Ochrana proti echa: nastavíme okamžite ešte pred prvou slabikou
            try { recognition.abort(); } catch (e) { } // Úplné fyzické odpojenie mikrofónu, kým čítame!

            window.currentSpeechSession = (window.currentSpeechSession || 0) + 1;
            const thisSession = window.currentSpeechSession;

            function playNextUtterance(idx) {
                if (idx >= utterancesQueue.length) {
                    if (window.currentSpeechSession !== thisSession) return;

                    if (currentPlayingBriefingIndex === nextItemIdx) {
                        currentPlayingBriefingIndex = -1;
                        renderPage(false);
                        if (isListening && hasStartedReading) {
                            setTimeout(() => {
                                if (window.currentSpeechSession === thisSession) {
                                    simulateCheckAction();
                                }
                            }, 500);
                            return;
                        }
                    }
                    // Znovu oživíme mikrofón
                    setTimeout(() => {
                        if (window.currentSpeechSession !== thisSession) return;
                        if (isTimerActivePause) return;
                        isSpeaking = false;
                        if (isListening) {
                            try { recognition.start(); } catch (e) { }
                        }
                    }, 175);
                    return;
                }

                let chunk = utterancesQueue[idx];
                let text = chunk.text;
                
                // Pause logic: if text contains '|', split it and play sequentially with delay
                if (text.includes('|')) {
                    const parts = text.split('|');
                    const subQueue = [];
                    parts.forEach((p, i) => {
                        subQueue.push({ text: p.trim(), role: chunk.role });
                        if (i < parts.length - 1) subQueue.push({ text: "", role: chunk.role, duration: 500 }); // Inject pause
                    });
                    utterancesQueue.splice(idx, 1, ...subQueue);
                    chunk = utterancesQueue[idx];
                }

                const utterance = new SpeechSynthesisUtterance(spellAbbreviations(parseVariables(chunk.text, true)).trim());
                utterance.lang = 'en-US';
                let wantMale = isMaleVoice;
                if (chunk.role === 'atc') wantMale = !isMaleVoice;
                utterance.rate = (wantMale ? 1.28 : 1.09);
                utterance.voice = getSelectedVoice(chunk.role);

                utterance.onstart = () => { isSpeaking = true; };
                utterance.onend = () => {
                    if (window.currentSpeechSession !== thisSession) return;
                    playNextUtterance(idx + 1);
                };
                
                if (!isMuted) {
                    if (chunk.text.trim() === "") {
                        // It's a pause segment
                        setTimeout(() => { playNextUtterance(idx + 1); }, chunk.duration || 500);
                    } else {
                        window.speechSynthesis.speak(utterance);
                    }
                } else {
                    setTimeout(() => { utterance.onend(); }, 175);
                }
            }

            playNextUtterance(0);
        } else {
            // If we were in a 'forced' state (e.g. manual click triggered ATC), 
            // and there are no more items to read, or the next item is a regular checklist item
            // while hasStartedReading is false, we should stop here.
            if (!hasStartedReading) {
                isSpeaking = false;
                if (isListening) {
                    try { recognition.start(); } catch (e) { }
                }
                return;
            }

            // === ALL items checked – page complete ===
            const page = checklistData[currentPageIndex];
            const pageTitle = page.title;

            window.currentSpeechSession = (window.currentSpeechSession || 0) + 1;
            const thisSession = window.currentSpeechSession;
            const isLastPage = (currentPageIndex === checklistData.length - 1);

            // Determine if this page had any checklist items (not just flow)
            const visibleItems = page.items.filter(i => isItemVisible(i));
            const hadChecklistItems = visibleItems.some(i => i.type === 'checklist item');
            const hadBriefing = visibleItems.some(i => i.type === 'briefing');
            const lastItem = visibleItems.length > 0 ? visibleItems[visibleItems.length - 1] : null;

            if (isReadCLOnly && !hadChecklistItems && !hadBriefing) {
                let nextValidPageIndex = -1;
                for (let i = currentPageIndex + 1; i < checklistData.length; i++) {
                    if (checklistData[i].items.some(it => isItemVisible(it))) {
                        nextValidPageIndex = i;
                        break;
                    }
                }
                if (nextValidPageIndex >= 0) {
                    setTimeout(() => { if (isListening) { hasStartedReading = false; readCLOnlyChecklistPhaseActive = false; btnNext.click(); } }, 300);
                }
                return;
            }

            let completeText = "";
            let skipCompleteVoice = false;

            if (lastItem && lastItem.type === 'fake_atc') {
                skipCompleteVoice = true;
            } else if (isReadCLOnly) {
                completeText = spellAbbreviations(pageTitle, true) + " Checklist completed.";
            } else {
                if (lastItem && lastItem.type === 'checklist item') {
                    completeText = spellAbbreviations(pageTitle, true) + " Checklist completed.";
                } else if (lastItem && lastItem.type === 'flow') {
                    completeText = spellAbbreviations(pageTitle, true) + " flow complete.";
                } else if (hadChecklistItems) {
                    completeText = spellAbbreviations(pageTitle, true) + " Checklist completed.";
                } else {
                    completeText = spellAbbreviations(pageTitle, true) + " flow complete.";
                }
            }

            if (!skipCompleteVoice && isLastPage) {
                completeText += ' And we can go home.';
            }

            const finishPageLogic = () => {
                if (window.currentSpeechSession !== thisSession) return;

                setTimeout(() => {
                    if (window.currentSpeechSession !== thisSession) return;
                    if (isTimerActivePause) return;
                    isSpeaking = false;
                    hasStartedReading = false; // Prevent TTS echo of "completed" from spuriously triggering simulateCheckAction
                    if (isListening) {
                        try { recognition.start(); } catch (e) { }
                    }
                }, 175);

                // AUTO-NEXT
                let nextValidPageIndex = -1;
                for (let i = currentPageIndex + 1; i < checklistData.length; i++) {
                    if (checklistData[i].items.some(it => isItemVisible(it))) {
                        nextValidPageIndex = i;
                        break;
                    }
                }

                if (nextValidPageIndex >= 0) {
                    if (isReadCLOnly) {
                        // In Read CL Only: auto-proceed, set hasStartedReading=false so next page
                        // will wait for "checklist" command again (if it has CL items), or auto-proceed (if only flow/briefing)
                        setTimeout(() => {
                            if (isListening) {
                                hasStartedReading = false;
                                readCLOnlyChecklistPhaseActive = false;
                                btnNext.click();
                                // After navigating, check if the new page needs auto-start
                                setTimeout(() => {
                                    if (isListening) readCLOnlyAutoStart();
                                }, 500);
                            }
                        }, 560);
                    } else {
                        setTimeout(() => { if (isListening) { hasStartedReading = false; btnNext.click(); } }, 560);
                    }
                }
            };

            isSpeaking = true;
            try { recognition.abort(); } catch (e) { }

            if (!skipCompleteVoice && completeText) {
                const utterance = new SpeechSynthesisUtterance(completeText);
                utterance.lang = 'en-US';
                utterance.rate = (isMaleVoice ? 1.28 : 1.09);
                utterance.voice = getSelectedVoice();
                utterance.onstart = () => { isSpeaking = true; };
                utterance.onend = finishPageLogic;
                
                if (!isMuted) window.speechSynthesis.speak(utterance);
                else utterance.onend();
            } else {
                finishPageLogic();
            }
        }
    }

    // Read CL Only: auto-start reading logic (forces pause so we wait for prompt)
    function readCLOnlyAutoStart() {
        if (!isListening || !isReadCLOnly || hasStartedReading) return;
        hasStartedReading = false;
    }

    // Zaistenie, že hlasy sú načítané
    window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };

    recognition.onstart = () => {
        isListening = true;
        // ODSTRANENÉ `hasStartedReading = false;` -> Kvôli tomuto predtým systém zabudol, že je v checkliste po každom reštarte mikrofónu!
        processedMatchesCount = 0;

        processedStopCount = 0;
        processedRepeatCount = 0;
        lastTranscriptLength = 0;
        voiceBar.classList.remove('hidden');
        document.body.classList.add('voice-active');
        voiceStopBtn.classList.remove('inactive');
        voiceStopBtn.innerHTML = '&#9632; Stop';
        voiceEqualizer.classList.remove('error');
        micBtn.classList.add('active');
    };

    recognition.onend = () => {
        if (!isListening) {
            voiceBar.classList.add('hidden');
            document.body.classList.remove('voice-active');
            voiceStopBtn.classList.add('inactive');
            voiceStopBtn.innerHTML = '&#9658; Start';
            micBtn.classList.remove('active');
            window.speechSynthesis.cancel();
        } else if (!isSpeaking) {
            // Rýchly reštart za chodu, IBA ak PC práve nečíta
            setTimeout(() => {
                if (isListening && !isSpeaking) {
                    try { recognition.start(); } catch (e) { }
                }
            }, 100);
        }
    };

    recognition.onerror = (event) => {
        // ZABRÁNENIE PREBLIKÁVANIU CHÝB V UI
        // Vyvoláme si tento error sami vždy, keď použijeme 'recognition.stop()' pre prečistenie zajakávania
        if (event.error === 'aborted' || event.error === 'no-speech') {
            return;
        }

        // Ak užívateľ zakáže HTTPS povolenie na mikrofón
        if (event.error === 'not-allowed') {
            isListening = false;
        }

        voiceEqualizer.classList.add('error');
        console.error("Speech Recognition Error:", event.error);
    };

    recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
            fullTranscript += event.results[i][0].transcript + ' ';
        }

        let transcript = fullTranscript.toLowerCase().trim();
        if (!transcript) return;

        // OCHRANA: Chrome niekedy zošalie a celú pamäť zresetuje. Vtedy prepíšeme počítadlá na nulu.
        if (transcript.length < lastTranscriptLength - 20) {
            processedMatchesCount = 0;

            processedStopCount = 0;
            processedRepeatCount = 0;
        }
        lastTranscriptLength = transcript.length;

        // Tichá vizuálna odozva – zrušenie prípadného erroru pri zachytení aktivity
        voiceEqualizer.classList.remove('error');

        // ZoznamRegex - slovo Check a Set, a brutálne defektné omyly + komplet všetky ACTION slová z checklistov!
        // UPOZORNENIE: Krátke slová (on, off, up, atď.) sú obalené v \b (word boundary), aby nám to nenašlo "on" uprostred slova "position" a nezarátalo dvakrát.
        const actionWordPattern = /(check|set|call|reset|start|steady|announcement|revoke|continuous|retract|auto|open|down|green|\bon\b|\boff\b|\bup\b|\barm\b|completed)/gi;

        // const stopWordPattern = /(stop|cancel)/gi;
        const repeatWordPattern = /(repeat|again)/gi;

        // 1. TRIGGER: Checklist start
        if (!hasStartedReading && (transcript.includes('checklist') || transcript.includes('craigslist'))) {

            if (isReadCLOnly) {
                // Ignore the microphone if user says 'checklist' but we are on flow/briefing items
                const currentItems = checklistData[currentPageIndex].items;
                const nextVisible = currentItems.find(i => !i.checked && isItemVisible(i));
                if (nextVisible && (nextVisible.type === 'flow' || nextVisible.type === 'briefing')) {
                    return;
                }
                readCLOnlyChecklistPhaseActive = true;
            }

            hasStartedReading = true;

            // Pred spustením si spočítame aktuálne omyly a "checky" v texte, aby sme ich hned po aktivácii ignorovali
            const initialMatches = transcript.match(actionWordPattern);
            if (initialMatches) processedMatchesCount = initialMatches.length;



            const initialRepeat = transcript.match(repeatWordPattern);
            if (initialRepeat) processedRepeatCount = initialRepeat.length;

            prepareChecklistReading();

            return;
        }

        // Read CL Only: ignore all voice commands when on flow items
        if (isReadCLOnly && hasStartedReading) {
            const currentItems = checklistData[currentPageIndex].items;
            const currentNextItem = currentItems.find(i => !i.checked && isItemVisible(i));
            if (currentNextItem && currentNextItem.type === 'flow') {
                return; // Ignore mic input for flow items
            }
        }

        if (!hasStartedReading) return;

        /*
        // 2. STOP COMMAND NAV
        const stopMatches = transcript.match(stopWordPattern);
        const currentStopCount = stopMatches ? stopMatches.length : 0;
        if (currentStopCount > processedStopCount) {
            processedStopCount = currentStopCount;
            isListening = false;
            recognition.stop();
            return;
        }
        */



        // 3.5 REPEAT COMMAND NAV
        const repeatMatches = transcript.match(repeatWordPattern);
        const currentRepeatCount = repeatMatches ? repeatMatches.length : 0;
        if (currentRepeatCount > processedRepeatCount) {
            processedRepeatCount = currentRepeatCount;
            speakCurrentItem();
            return;
        }

        // 4. CHECK A SET ODFJAKNUTIE: Count strategy
        const matches = transcript.match(actionWordPattern);
        const currentMatchesCount = matches ? matches.length : 0;

        // Ak zachytime viac povelov nez mame pamatanych odklikanych ukonov:
        if (currentMatchesCount > processedMatchesCount) {

            // ECHO BUG OCHRANA: Ak PC práve číta, alebo do 800ms len dočítalo, 
            // mikrofón to síce počul a zobral za regulárne slovo, no my ho tu pohltíme (zahodíme).
            if (isSpeaking) {
                processedMatchesCount = currentMatchesCount;
            } else {
                // DEBOUNCE OCHRANA proti dlhým vetám: Ak mikrofón chrlí slová ako "Standby power... Auto",
                // a obe slová sú aktivačné, Chrome ich pošle rýchlo za sebou s roztiahnutým interim resultom.
                // Ak sme pred menej ako 800ms už urobili úkon, tieto dodatočné slová z tej istej vety len zhltneme bez akcie.
                const now = Date.now();
                if (now - lastCheckedTime < 800) {
                    processedMatchesCount = currentMatchesCount;
                    return;
                }
                lastCheckedTime = now;

                // SKOK počítadla – zahodí prídavné heslá, vykoná vždy len 1 úkon.
                processedMatchesCount = currentMatchesCount;

                const items = checklistData[currentPageIndex].items;
                const nextItemIdx = items.findIndex(i => !i.checked && isItemVisible(i));

                let newlyChecked = false;
                let activatedItem = null;

                if (nextItemIdx !== -1) {
                    activatedItem = items[nextItemIdx];
                    // Užívateľské vylepšenie: posun samotného odškrtnutia, aby to nepôsobilo zbrklo roboticky.
                    setTimeout(() => { toggleCheck(nextItemIdx, true); }, 700);
                    newlyChecked = true;
                }

                if (newlyChecked) {
                    voiceEqualizer.classList.add('success');
                    micBtn.classList.add('success');
                    setTimeout(() => {
                        if (isListening) {
                            voiceEqualizer.classList.remove('success');
                            micBtn.classList.remove('success');
                        }
                    }, 1500);

                    if (activatedItem && activatedItem.timer && !isTimerDisabled) {
                        processTimerItem(activatedItem);
                    } else {
                        // NORMÁLNY PRIEBEH – pauza, kým sa znova nadýchne a začne čítať
                        setTimeout(() => { speakCurrentItem(); }, 1120);
                    }

                    // BRILANTNÝ ŤAH: Vypneme mikrofón. Zmaže sa tak pamäťová knižnica Chrome,
                    // ktorá inak zvykne filtrovať rovnaké slová ako "zajakávanie" (stutter filter).
                    try { recognition.stop(); } catch (e) { }
                }
            }
        }
    };

    micBtn.onclick = () => {
        if (isListening) {
            isListening = false;
            voiceBar.classList.add('hidden');
            document.body.classList.remove('voice-active');
            recognition.stop();
            readCLOnlyChecklistPhaseActive = false;
            releaseWakeLock();
        } else {
            hasStartedReading = false;
            readCLOnlyChecklistPhaseActive = false;
            requestWakeLock();
            try { recognition.start(); } catch (e) { recognition.stop(); alert("Mic error: " + e.message); }
            if (isReadCLOnly) {
                setTimeout(() => { readCLOnlyAutoStart(); }, 600);
            }
        }
    };

    voiceStopBtn.onclick = () => {
        if (isListening) {
            isListening = false;
            hasStartedReading = false;
            readCLOnlyChecklistPhaseActive = false;
            isTimerActivePause = false;
            voiceBar.classList.add('hidden');
            document.body.classList.remove('voice-active');
            window.speechSynthesis.cancel();
            try { recognition.abort(); } catch (e) { }
            voiceStopBtn.classList.add('inactive');
            voiceStopBtn.innerHTML = '&#9658; Start';
            micBtn.classList.remove('active');
        } else {
            micBtn.click();
        }
    };
} else {
    micBtn.style.display = 'none';
}

init();

window.addEventListener('resize', () => updateControls());

// ========== Automated METAR Fetching ==========
async function fetchMetarData(icao) {
    if (!icao || icao.length !== 4) return null;
    try {
        const resp = await fetch(`https://metar.vatsim.net/metar.php?id=${icao.toUpperCase()}`);
        const text = await resp.text();
        if (!text || text.includes('not found') || text.length < 10) return null;
        
        const data = {};
        
        // Parse Wind: 27012KT or 27012G20KT
        const windMatch = text.match(/(\d{3})(\d{2,3})(G\d{2,3})?KT/);
        if (windMatch) {
            data.wind = `${windMatch[1]}/${windMatch[2]}`;
        }
        
        // Parse Temp/Dew Point: 18/12 or M02/M05
        const tempMatch = text.match(/\b(M?\d{2})\/(M?\d{2})\b/);
        if (tempMatch) {
            data.temp = tempMatch[1].replace('M', '-');
            data.dewpt = tempMatch[2].replace('M', '-');
        }
        
        // Parse QNH: Q1013 or A2992
        const qnhMatch = text.match(/\b([QA])(\d{4})\b/);
        if (qnhMatch) {
            data.qnh = qnhMatch[2];
        }
        
        try {
            const atisResp = await fetch(`/api/atis?icao=${icao.toUpperCase()}`);
            if (atisResp.ok) {
                const atisData = await atisResp.json();
                if (atisData.atis_code) data.atis = atisData.atis_code;
            }
        } catch (e) {
            console.error('ATIS Fetch Error', e);
        }
        
        return data;
    } catch (e) {
        console.error('METAR Fetch Error:', e);
        return null;
    }
}

function initMetarAutoSync() {
    const originInput = document.getElementById('b-origin');
    const destInput = document.getElementById('b-dest');
    
    const sync = async (icao, prefix, force = false) => {
        if (!icao || icao.length !== 4) return;
        const data = await fetchMetarData(icao);
        if (data) {
            if (data.atis) {
                const el = document.getElementById(`b-${prefix}-atis`);
                if (el && (force || !el.value)) el.value = data.atis;
            }
            if (data.qnh) {
                const el = document.getElementById(`b-${prefix}-qnh`);
                if (el && (force || !el.value)) el.value = data.qnh;
            }
            if (data.temp) {
                const el = document.getElementById(`b-${prefix}-temp`);
                if (el && (force || !el.value)) el.value = data.temp;
            }
            if (data.dewpt) {
                const el = document.getElementById(`b-${prefix}-dewpt`);
                if (el && (force || !el.value)) el.value = data.dewpt;
            }
            if (data.wind) {
                const el = document.getElementById(`b-${prefix}-wind`);
                if (el && (force || !el.value)) el.value = data.wind;
            }
            saveBriefing();
        }
    };
    
    if (originInput) {
        originInput.addEventListener('change', (e) => {
            sync(e.target.value, 'dep');
            updateInitAltPlaceholder(e.target.value);
        });
        originInput.addEventListener('blur', (e) => {
            sync(e.target.value, 'dep');
            updateInitAltPlaceholder(e.target.value);
        });
        // Initial load check
        if (originInput.value) updateInitAltPlaceholder(originInput.value);
    }
    
    // Add dynamic runway update listeners
    ['b-dep-rwy', 'b-arr-rwy'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                if (window.updateBriefingFromRwy) window.updateBriefingFromRwy();
            });
            el.addEventListener('input', () => {
                if (window.updateBriefingFromRwy) window.updateBriefingFromRwy();
            });
        }
    });
    if (destInput) {
        destInput.addEventListener('change', (e) => sync(e.target.value, 'arr'));
        destInput.addEventListener('blur', (e) => sync(e.target.value, 'arr'));
    }
    
    const metarSyncBtn = document.getElementById('b-metar-sync');
    if (metarSyncBtn) {
        metarSyncBtn.addEventListener('click', async () => {
            const o = document.getElementById('b-origin')?.value;
            const d = document.getElementById('b-dest')?.value;
            if (o) await sync(o, 'dep', true);
            if (d) await sync(d, 'arr', true);
        });
    }
    
    const squawkBtn = document.getElementById('b-squawk-gen');
    if (squawkBtn) {
        squawkBtn.addEventListener('click', () => {
            const forbidden = [7000, 7500, 7600, 7700, 1200, 2000, 0];
            let code = 0;
            do {
                // Generate 4-digit octal (each digit 0-7)
                code = 0;
                for (let i = 0; i < 4; i++) {
                    code += Math.floor(Math.random() * 8) * Math.pow(10, i);
                }
            } while (forbidden.includes(code));
            
            const el = document.getElementById('b-squawk');
            if (el) {
                el.value = code.toString().padStart(4, '0');
                saveBriefing();
            }
        });
    }
}

async function updateInitAltPlaceholder(icao) {
    if (!icao || icao.length !== 4) return;
    try {
        const res = await fetch(`/api/airports?icao=${icao}`);
        const data = await res.json();
        const el = document.getElementById('b-initial-alt');
        if (el && data && data.initial_climb) {
            el.placeholder = data.initial_climb;
        }
    } catch (e) {
        console.error('Placeholder Update Error:', e);
    }
}
