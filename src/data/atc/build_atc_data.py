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

# --- EXPERT OVERRIDES (Tip-Top Hubs) ---
EXPERT_OVERRIDES = {
    "LZIB": [
        {"type": "APP", "role": "ARR", "callsign": "Stefanik Radar", "frequency": "134.930"},
        {"type": "TWR", "role": "", "callsign": "Stefanik Tower", "frequency": "118.305"},
        {"type": "GND", "role": "", "callsign": "Stefanik Ground", "frequency": "120.905"},
        {"type": "DEL", "role": "", "callsign": "Stefanik Ground", "frequency": "120.905"}
    ],
    "LKPR": [
        {"type": "DEL", "role": "", "callsign": "Ruzyne Delivery", "frequency": "120.055"},
        {"type": "GND", "role": "", "callsign": "Ruzyne Ground", "frequency": "121.905"},
        {"type": "TWR", "role": "", "callsign": "Ruzyne Tower", "frequency": "118.105"},
        {"type": "APP", "role": "DEP", "callsign": "Praha Radar", "frequency": "120.530"},
        {"type": "APP", "role": "ARR", "callsign": "Praha Radar", "frequency": "127.580"}
    ],
    "LOWW": [
        {"type": "DEL", "role": "", "callsign": "Wien Delivery", "frequency": "122.130"},
        {"type": "GND", "role": "", "callsign": "Wien Ground", "frequency": "121.730"},
        {"type": "TWR", "role": "", "callsign": "Wien Tower", "frequency": "119.405"},
        {"type": "APP", "role": "ARR", "callsign": "Wien Director", "frequency": "123.805"},
        {"type": "APP", "role": "ARR", "callsign": "Wien Radar", "frequency": "134.680"}
    ],
    "EDDK": [
        {"type": "DEL", "role": "", "callsign": "Koeln Delivery", "frequency": "121.855"},
        {"type": "GND", "role": "", "callsign": "Koeln Ground", "frequency": "121.730"},
        {"type": "TWR", "role": "", "callsign": "Koeln Tower", "frequency": "124.980"},
        {"type": "APP", "role": "ARR", "callsign": "Koeln Director", "frequency": "121.050"}
    ],
    "EPWA": [
        {"type": "DEL", "role": "", "callsign": "Warsaw Delivery", "frequency": "121.905"},
        {"type": "GND", "role": "", "callsign": "Warsaw Ground", "frequency": "121.780"},
        {"type": "TWR", "role": "", "callsign": "Warsaw Tower", "frequency": "118.305"},
        {"type": "APP", "role": "ARR", "callsign": "Warsaw Radar", "frequency": "128.805"}
    ],
    "BIKF": [
        {"type": "DEL", "role": "", "callsign": "Keflavik Delivery", "frequency": "121.000"},
        {"type": "TWR", "role": "", "callsign": "Keflavik Tower", "frequency": "118.100"},
        {"type": "APP", "role": "ARR", "callsign": "Keflavik Radar", "frequency": "119.300"}
    ]
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
                airports[icao] = {"name": row['name'], "city": city, "base_callsign": base_callsign, "country": row['iso_country'], "continent": row['continent'], "frequencies": []}
                airports[icao]["_freq_map"] = {}

    print("Processing frequencies (Primary only)...")
    with open(TEMP_FREQUENCIES, mode='r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        for row in reader:
            icao = row['airport_ident']
            if icao in airports:
                if icao in EXPERT_OVERRIDES: continue
                
                f_type = row['type'].upper()
                desc = row['description'].strip().upper()
                freq = row['frequency_mhz']
                
                label = ""; suffix = ""
                if any(x in f_type for x in ["GND", "GROUND"]) or "GROUND" in desc: label = "GND"; suffix = "Ground"
                elif any(x in f_type for x in ["TWR", "TOWER"]) or "TOWER" in desc: label = "TWR"; suffix = "Tower"
                elif any(x in f_type for x in ["APP", "APPROACH", "DIR", "RDR"]) or "RADAR" in desc: 
                    label = "APP"
                    suffix = "Director" if any(x in f_type for x in ["DIR", "DIRECTOR"]) or "DIRECTOR" in desc else "Approach"
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

    for icao in airports:
        if icao in EXPERT_OVERRIDES:
            airports[icao]["frequencies"] = EXPERT_OVERRIDES[icao]
        else:
            for key, f_data in airports[icao]["_freq_map"].items():
                airports[icao]["frequencies"].append(f_data)
        if "_freq_map" in airports[icao]: del airports[icao]["_freq_map"]

    with open(AIRPORTS_JSON, 'w', encoding='utf-8') as f: json.dump(airports, f, indent=2, ensure_ascii=False)
    print(f"Success! Created clean {AIRPORTS_JSON}")

if __name__ == "__main__":
    build_data()
