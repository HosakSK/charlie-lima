import json
import csv
import urllib.request
import os
import unicodedata
import re

def normalize_string(text):
    if not text: return ""
    normalized = unicodedata.normalize('NFD', text)
    return "".join(c for c in normalized if unicodedata.category(c) != 'Mn')

def clean_callsign(desc, base_callsign, label_suffix):
    if not desc: return f"{base_callsign} {label_suffix}"
    clean = desc.split('/')[0].strip()
    junk_words = ["Rollkontrolle", "Turm", "Piste", "Approach", "Departure", "Ground", "Tower", "Delivery", "Radar", "Director", "Clearance", "Information", "Stefanik", "Ruzyne", "Wien", "Warsaw", "Keflavik"]
    pattern = re.compile(r'\b(' + '|'.join(junk_words) + r')\b', re.IGNORECASE)
    clean = pattern.sub('', clean).strip()
    final_prefix = clean if len(clean) > 2 else base_callsign
    return f"{final_prefix} {label_suffix}"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AIRPORTS_URL = "https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv"
FREQUENCIES_URL = "https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airport-frequencies.csv"

AIRPORTS_JSON = os.path.join(BASE_DIR, "airports_atc.json")
TEMP_AIRPORTS = os.path.join(BASE_DIR, "airports.csv")
TEMP_FREQUENCIES = os.path.join(BASE_DIR, "frequencies.csv")

# --- EXPERT OVERRIDES (Top 50+ Hubs with Standard Altitudes) ---
EXPERT_OVERRIDES = {
    # -- Home Region --
    "LZIB": {"initial_climb": 5000, "ta": 10000, "freqs": [
        {"type": "APP", "role": "ARR", "callsign": "Stefanik Radar", "frequency": "134.930"},
        {"type": "TWR", "role": "", "callsign": "Stefanik Tower", "frequency": "118.305"},
        {"type": "GND", "role": "", "callsign": "Stefanik Ground", "frequency": "120.905"},
        {"type": "DEL", "role": "", "callsign": "Stefanik Ground", "frequency": "120.905"}
    ]},
    "LKPR": {"initial_climb": 5000, "ta": 5000, "freqs": [
        {"type": "DEL", "role": "", "callsign": "Ruzyne Delivery", "frequency": "120.055"},
        {"type": "GND", "role": "", "callsign": "Ruzyne Ground", "frequency": "121.905"},
        {"type": "TWR", "role": "", "callsign": "Ruzyne Tower", "frequency": "118.105"},
        {"type": "APP", "role": "DEP", "callsign": "Praha Radar", "frequency": "120.530"},
        {"type": "APP", "role": "ARR", "callsign": "Praha Radar", "frequency": "127.580"}
    ]},
    "LOWW": {"initial_climb": 5000, "ta": 10000, "freqs": [
        {"type": "DEL", "role": "", "callsign": "Wien Delivery", "frequency": "122.130"},
        {"type": "GND", "role": "", "callsign": "Wien Ground", "frequency": "121.730"},
        {"type": "TWR", "role": "", "callsign": "Wien Tower", "frequency": "119.405"},
        {"type": "APP", "role": "ARR", "callsign": "Wien Director", "frequency": "123.805"},
        {"type": "APP", "role": "ARR", "callsign": "Wien Radar", "frequency": "134.680"}
    ]},
    # -- Major Europe --
    "EDDF": {"initial_climb": 5000, "ta": 5000},
    "EDDM": {"initial_climb": 5000, "ta": 5000},
    "EDDK": {"initial_climb": 5000, "ta": 5000},
    "LFPG": {"initial_climb": 5000, "ta": 5000},
    "LFPO": {"initial_climb": 5000, "ta": 5000},
    "EHAM": {"initial_climb": 6000, "ta": 3000},
    "EBBR": {"initial_climb": 5000, "ta": 3000},
    "LSZH": {"initial_climb": 5000, "ta": 5000},
    "LSGG": {"initial_climb": 7000, "ta": 7000},
    "LEMD": {"initial_climb": 5000, "ta": 6000},
    "LEBL": {"initial_climb": 5000, "ta": 6000},
    "LIRF": {"initial_climb": 5000, "ta": 5000},
    "LIMC": {"initial_climb": 5000, "ta": 5000},
    "EGLL": {"initial_climb": 6000, "ta": 6000},
    "EGKK": {"initial_climb": 6000, "ta": 6000},
    "EGSS": {"initial_climb": 6000, "ta": 6000},
    "EGCC": {"initial_climb": 5000, "ta": 5000},
    "ESSA": {"initial_climb": 5000, "ta": 5000},
    "EKCH": {"initial_climb": 3000, "ta": 3000},
    "EPWA": {"initial_climb": 5000, "ta": 6500},
    "LTFM": {"initial_climb": 5000, "ta": 5000},
    "BIKF": {"initial_climb": 5000, "ta": 7000},
    # -- US/Canada --
    "KJFK": {"initial_climb": 5000, "ta": 18000},
    "KEWR": {"initial_climb": 5000, "ta": 18000},
    "KLAX": {"initial_climb": 5000, "ta": 18000},
    "KSFO": {"initial_climb": 5000, "ta": 18000},
    "KORD": {"initial_climb": 5000, "ta": 18000},
    "KATL": {"initial_climb": 5000, "ta": 18000},
    "KMIA": {"initial_climb": 3000, "ta": 18000},
    "KSEA": {"initial_climb": 5000, "ta": 18000},
    "CYYZ": {"initial_climb": 5000, "ta": 18000},
    "CYVR": {"initial_climb": 5000, "ta": 18000},
}

def download_file(url, filename):
    print(f"Downloading {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response, open(filename, 'wb') as out_file:
        out_file.write(response.read())

def build_data():
    try:
        download_file(AIRPORTS_URL, TEMP_AIRPORTS)
        download_file(FREQUENCIES_URL, TEMP_FREQUENCIES)
    except Exception as e:
        print(f"Download failed: {e}"); return

    print("Processing airports...")
    airports = {}
    with open(TEMP_AIRPORTS, mode='r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        for row in reader:
            icao = row['ident'] or row['gps_code']
            if not icao: continue
            is_eu = row['continent'] == 'EU'
            if (is_eu and row['type'] in ['large_airport', 'medium_airport']) or row['type'] == 'large_airport':
                city = normalize_string(row['municipality'].split('/')[0].strip()) if row['municipality'] else ""
                base_callsign = normalize_string(row['name'].split('/')[0].split('(')[0].strip())
                
                # --- Regional Logic with new European Fallback ---
                initial_climb = 5000; ta = 5000
                if row['continent'] == 'EU':
                    ta = 10000 # New European standard fallback
                    # Specific country overrides
                    if row['iso_country'] == 'DE': ta = 5000
                    elif row['iso_country'] == 'GB': ta = 6000; initial_climb = 6000
                    elif row['iso_country'] in ['NL', 'BE']: ta = 3000
                elif row['continent'] == 'NA' or row['iso_country'] == 'US':
                    initial_climb = 3000; ta = 18000
                
                airports[icao] = {"name": row['name'], "city": city, "base_callsign": base_callsign, "country": row['iso_country'], "continent": row['continent'], "initial_climb": initial_climb, "transition_altitude": ta, "frequencies": []}
                airports[icao]["_freq_map"] = {}

    print("Processing frequencies...")
    with open(TEMP_FREQUENCIES, mode='r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        for row in reader:
            icao = row['airport_ident']
            if icao in airports:
                if icao in EXPERT_OVERRIDES and "freqs" in EXPERT_OVERRIDES[icao]: continue
                f_type = row['type'].upper()
                desc = row['description'].strip().upper()
                freq = row['frequency_mhz']
                label = ""; suffix = ""
                if any(x in f_type for x in ["GND", "GROUND"]) or "GROUND" in desc: label = "GND"; suffix = "Ground"
                elif any(x in f_type for x in ["TWR", "TOWER"]) or "TOWER" in desc: label = "TWR"; suffix = "Tower"
                elif any(x in f_type for x in ["APP", "APPROACH", "DIR", "RDR"]) or "RADAR" in desc: 
                    label = "APP"; suffix = "Director" if any(x in f_type for x in ["DIR", "DIRECTOR"]) or "DIRECTOR" in desc else "Approach"
                elif any(x in f_type for x in ["DEP", "DEPARTURE"]): label = "DEP"; suffix = "Departure"
                elif any(x in f_type for x in ["DEL", "DELIVERY", "CLNC", "CLD"]) or "DELIVERY" in desc: label = "DEL"; suffix = "Delivery"
                if label:
                    role = "ARR" if any(x in desc for x in ["ARR", "ARRIVAL", "DIRECTOR"]) or suffix == "Director" else ""
                    if any(x in desc for x in ["DEP", "DEPARTURE", "CLIMB"]): role = "DEP"
                    key = f"{label}_{role}"
                    if key not in airports[icao]["_freq_map"]:
                        final_callsign = clean_callsign(row['description'], airports[icao]["base_callsign"], suffix)
                        if suffix == "Approach" and airports[icao]["country"] in ["CZ", "SK", "DE", "AT", "HU"]:
                            final_callsign = final_callsign.replace("Approach", "Radar")
                        airports[icao]["_freq_map"][key] = {"type": label, "role": role, "callsign": normalize_string(final_callsign), "frequency": freq}

    # Finalize
    for icao in airports:
        if icao in EXPERT_OVERRIDES:
            airports[icao]["initial_climb"] = EXPERT_OVERRIDES[icao]["initial_climb"]
            airports[icao]["transition_altitude"] = EXPERT_OVERRIDES[icao].get("ta", airports[icao]["transition_altitude"])
            if "freqs" in EXPERT_OVERRIDES[icao]: airports[icao]["frequencies"] = EXPERT_OVERRIDES[icao]["freqs"]
        if not airports[icao]["frequencies"]:
            for key, f_data in airports[icao]["_freq_map"].items(): airports[icao]["frequencies"].append(f_data)
        if "_freq_map" in airports[icao]: del airports[icao]["_freq_map"]

    with open(AIRPORTS_JSON, 'w', encoding='utf-8') as f: json.dump(airports, f, indent=2, ensure_ascii=False)
    print(f"Success! Created {AIRPORTS_JSON} with 10k EU TA.")

if __name__ == "__main__":
    build_data()
