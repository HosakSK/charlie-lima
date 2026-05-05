# Dokumentácia: Fake ATC Dataset & Logika

Tento dokument popisuje štruktúru dát a programovú logiku pre funkciu "Fake ATC" v aplikácii Charlie-Lima.

## 1. Dátové zdroje a rozsah
*   **Airports (`airports_atc.json`)**: ~1900 letísk. Európa (Large + Medium), zvyšok sveta (iba Large huby).
*   **FIRs (`firs_atc.json`)**: ~1000 oblastných riadení (všetky svetové FIRy z VATSpy).
*   **Normalizácia**: Všetky volacie znaky sú v ASCII (bez diakritiky) pre 100% kompatibilitu s TTS (Text-to-Speech) modelmi.

## 2. Štruktúra frekvencií
Každé letisko obsahuje pole `frequencies` s nasledujúcimi atribútmi:
*   `type`: Typ stanice (DEL, GND, TWR, APP, DEP).
*   `role`: Špecifikácia pre veľké letiská (`ARR` pre prílety, `DEP` pre odlety).
*   `callsign`: Oficiálna volačka (napr. "Ruzyne Ground", "Praha Radar").
*   `frequency`: Kmitočet v MHz.

## 3. Logika pre programovanie (ATC Flow)

### A. Odletová sekvencia (Departure Flow)
Aplikácia postupuje podľa tejto hierarchie (zľava doprava):
**DEL -> GND -> TWR -> APP -> FIR**

1.  **Clearance**: Použi **DEL**. Ak chýba, skús **GND**. Ak chýba, skús **TWR**... atď.
2.  **Taxi**: Použi **GND**. Ak chýba, skús **TWR**. Ak chýba, skús **APP**... atď.
3.  **Takeoff**: Použi **TWR**. Ak chýba, skús **APP**. Ak chýba, skús **FIR**.
4.  **Departure/Radar**: Použi **DEP/APP** (prednostne s `role: DEP`). Ak chýba, skús **FIR**.

### B. Príletová sekvencia (Arrival Flow)
Hierarchia (zľava doprava):
**FIR -> APP -> TWR -> GND**

1.  **Initial Descent**: Použi **FIR**.
2.  **Approach**: Použi **APP** (prednostne s `role: ARR`). Ak chýba, zostaň na **FIR** alebo skús **TWR**.
3.  **Landing**: Použi **TWR**. Ak chýba, použi **APP**.
4.  **Taxi to Gate**: Použi **GND**. Ak chýba, použi **TWR**.

### C. Globálna Fallback logika (Princíp "Next Available Authority")
Táto logika zabezpečuje plynulý prechod komunikácie, aj keď chýbajú dáta:
1.  **Vyššia inštancia**: Vyššia zložka v hierarchii vždy preberá povinnosti všetkých chýbajúcich nižších zložiek. (Príklad: Ak letisko nemá DEL ani GND, pilot kontaktuje priamo TWR pre clearance aj taxi).
2.  **Skok o viac krokov**: Systém môže skočiť o ľubovoľný počet krokov vpred, až kým nenájde platnú frekvenciu.
3.  **FIR Fallback**: Ak letisko nemá definovanú **žiadnu** vlastnú frekvenciu, celú prevádzku (od clearance až po pristátie) riadi priradený **FIR** (Radar/Center).
4.  **Unicom**: Absolútny fallback. Ak zlyhá všetko ostatné, použi **122.800** ("Unicom").

## 4. Špecifické SOP pravidlá (Standard Operating Procedures)
*   **Región CZ/SK/DE/AT/HU**: Vždy používať volačku **Radar** namiesto "Approach" pre APP pozície.
*   **USA/Canada/Australia**: Vždy používať volačku **Center** pre FIR pozície.
*   **Praha (LKPR)**: Lokálne pozície sú vždy **Ruzyne**, približovacie sú **Praha Radar**.

## 5. Kultúrne pozdravy (Language Etiquette)
Aplikácia by mala pri komunikácii s lokálnym ATC používať zdvorilostné pozdravy zo súboru `greetings_atc.json`.

*   **Vstupné dáta**: Každé letisko/FIR má pole `country` (napr. `SK`) a `continent` (napr. `EU`).
*   **Logika Hello**: Pri prvom kontakte s novou frekvenciou (Check-in) pridaj k anglickej správe pole `hello`.
*   **Logika Fallback**: Aplikácia najprv hľadá v `greetings_atc.countries[country_code]`. Ak neexistuje, použije `greetings_atc.continents[continent_code]`.
*   **Logika Bye**: Pri rozlúčke a preladení na inú frekvenciu pridaj pole `bye`.
*   **Normalizácia**: Pozdravy sú písané bez diakritiky, aby ich TTS modely prečítali prirodzene (s miernym prízvukom).
