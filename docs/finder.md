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
V našom prostredí je vytvorený Agent skill (uložený ako `update_ryanair_flights`). Tento skill dokáže stiahnuť lety z Ryanair API na nasledujúcich 7 dní.
Pre aktualizáciu jednoducho požiadaj AI Agenta o aktualizáciu letov ("Update Ryanair flights pre LZIB").

### Krok 2: Algoritmus na opravu domovskej základne (Homebase)
**Toto je kritický krok pre celistvosť dát!**
Ryanair API nám automaticky nehovorí, či letisko LZIB je pre dané lietadlo domovskou základňou, alebo ide len o "otočku" lietadla z inej základne (away-base). Správny údaj o "base" je pritom pre virtuálnych pilotov kľúčový.

Preto po vygenerovaní letov **musí** nasledovať spustenie skriptu `scripts/fix_homebase.py`.

#### Ako funguje fix_homebase algoritmus?
Algoritmus načíta JSON súbor a matematicky spáruje všetky odlety s príletmi na rovnakej trase:
1. Nájde napríklad let **LZIB -> EPMO** a let **EPMO -> LZIB**.
2. Vypočíta takzvaný *turnaround time* (čas otočky).
3. Ak lietadlo odletí z LZIB, priletí do EPMO a po napr. 45 minútach letí späť z EPMO do LZIB, **znamená to, že lietadlo má základňu (Base) v LZIB** (svoj deň začalo v Bratislave).
4. Ak by odletelo ráno z EPMO do LZIB, počkalo v LZIB 30 minút a letelo späť, **jeho základňa je EPMO**.

Tento algoritmus iteruje cez všetkých 80+ letov a na základe časových rozdielov (do 120 minút pre turnaround) s absolútnou presnosťou určí domovskú základňu pre každý let.

- **Spustenie (z priečinka projektu)**: `python scripts/fix_homebase.py`
*(Tento skript automaticky upraví a prepíše JSON súbor `public/finder/ryanair_flights_lzib.json` so správne vypočítanými Base údajmi).*
