# Virtual Flight Finder (vATC & X-Plane)

Toto je dedikovaná webová aplikácia navrhnutá pre virtuálnych pilotov (X-Plane, MSFS, VATSIM/IVAO), ktorá slúži na filtrovanie a vyhľadávanie reálnych letových plánov (aktuálne optimalizovaná pre sieť Ryanair a letisko LZIB).

Aplikácia je postavená tak, aby bola extrémne rýchla (všetko sa filtruje na strane klienta) a dizajnovo čistá.

## 🚀 Funkcie

- **Live & Sim Režimy**: Filter, ktorý umožňuje vyhľadať lety odlietajúce v najbližších hodinách vzhľadom na tvoj reálny čas, alebo plne manuálne filtrovanie podľa dňa a času v simulátore.
- **Konverzia UTC**: Automatický prepočet lokálnych časov odletu/príletu do UTC.
- **Jednoduché kopírovanie**: Kliknutím na ICAO kód, číslo letu alebo callsign sa údaj bez medzier okamžite skopíruje do schránky (ideálne pre vkladanie do FMC/MCDU).
- **Google Maps Integrácia**: Mestá sú klikateľné odkazy, ktoré ťa priamo odkážu na mapu.
- **Multifilter**: Možnosť zadávať viacero ICAO kódov do odletu/príletu naraz (oddelených čiarkou).
- **Swap Button**: Šikovné tlačidlo na rýchle prehodenie odletu a príletu pre hľadanie spiatočného letu.

## 🛠️ Technologický Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+). Nepoužívame žiadny ťažký framework typu React.
- **Dev Server**: Aplikácia je integrovaná priamo v zložke `public/finder/` projektu a môže byť načítaná staticky alebo cez vývojový server Next.js.
- **Dáta**: Statický `json` súbor umiestnený v priečinku `public/finder/ryanair_flights_lzib.json`.

## 🧠 Architektúra (Ako to funguje)

- `index.html`: Obsahuje celú štruktúru DOM a rozloženie bočného panelu s filtrami.
- `style.css`: Vlastný custom design systém.
- `main.js`: 
  - Po načítaní stiahne súbor `ryanair_flights_lzib.json`.
  - Počúva na eventy (`input`, `click`) zo všetkých filtrov.
  - Funkcia `applyFilters()` prebehne celé pole letov a vyfiltruje ich podľa zadaných kritérií.
  - Funkcia `render()` následne vygeneruje HTML kód pre kartičky letov a vloží ho do gridu.

---

## 🔄 Ako aktualizovať dáta (Pre developerov)

Dáta aplikácie pochádzajú z reálneho Ryanair API. Keďže sa letové plány menia, z času na čas je potrebné JSON súbor aktualizovať.

### Krok 1: Stiahnutie nových letov z API
V našom prostredí je vytvorený Agent skill (uložený ako `update_ryanair_flights`). Tento skill používa upravený skript `update_flights.py`.

**Nová, robustná (Systematic) logika stiahnutia:**
Pôvodné sťahovanie z Ryanair "Fare Finder" API narážalo na limit, kedy API vracalo len *jeden najlacnejší let za deň* a ignorovalo vypredané lety. Aby sme získali **kompletný letový poriadok**:
1. Skript skenuje obdobie **28 dní** dopredu (namiesto 7), aby s istotou zachytil aj lety, ktoré sú v najbližších dňoch plne vypredané.
2. Každý deň rozdeľuje na **4 časové okná** (00:00-06:00, 06:00-12:00, atď.). API sa tak dotazuje na každý segment dňa samostatne. Vďaka tomu zachytíme aj letiská, kam sa lieta dvakrát denne (napr. Stansted EGSS).
3. Skript je plne **Timezone Aware**. Pre všetky letiská vytiahne ich IANA timezone (napr. `Europe/London`) a okrem lokálnych časov matematicky presne prepočíta a uloží aj UTC časy (`departure_time_utc`, `arrival_time_utc`), ktoré následne číta webová apka.

Pre aktualizáciu jednoducho požiadaj AI Agenta o aktualizáciu letov ("Update Ryanair flights pre LZIB").

### Krok 2: Algoritmus na opravu domovskej základne (Homebase)
**Toto je kritický krok pre celistvosť dát!**
Ryanair API nám automaticky nehovorí, či letisko LZIB je pre dané lietadlo domovskou základňou, alebo ide len o "otočku" lietadla z inej základne (away-base). Správny údaj o "base" je pritom pre virtuálnych pilotov kľúčový.

Túto logiku už čiastočne prebral priamo hlavný skript `update_flights.py` počas sťahovania, ale pre istotu sa môže dodatočne spustiť aj samostatný algoritmus.

#### Ako funguje fix_homebase algoritmus?
Algoritmus načíta JSON súbor a matematicky spáruje všetky odlety s príletmi na rovnakej trase:
1. Nájde napríklad let **LZIB -> EPMO** a let **EPMO -> LZIB**.
2. Porovná, ktorý let z dvojice odlieta v daný deň z domovského letiska ako prvý.
3. Ak lietadlo letí prvé ráno z LZIB do EPMO, **znamená to, že lietadlo má základňu (Base) v LZIB** (svoj deň začalo v Bratislave a prenocovalo tam).
4. Ak by odletelo prvé ráno z EPMO do LZIB, **jeho základňa je EPMO**.

- **Spustenie (z priečinka projektu)**: Skript sa automaticky spúšťa v rámci agent skillu po stiahnutí dát.
*(Tento skript upraví a prepíše JSON súbor `public/finder/ryanair_flights_lzib.json` so správne vypočítanými Base a UTC údajmi).*
