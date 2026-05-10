# Next Steps — Bug Tracker & Roadmap

---

## 🐞 Nahlásené chyby (Zadaj sem novú chybu)
> **Poznámka:** Ak nájdeš chybu, vpiš ju sem pod tento riadok. Stačí uviesť krátky popis.
- 

---

## ✅ Vyriešené (Resolved)

### 1. Problém s aktualizáciou premenných vo Fake ATC
- **Oprava:** Funkcia `updateAtcVariables()` bola pridaná do `saveBriefing()`. Premenné sa teraz aktualizujú okamžite pri každej zmene v notepade bez nutnosti refreshu.

### 2. Fake ATC položky ignorujú filtre (ILS/RNAV)
- **Oprava:** Funkcia `isItemVisible()` bola upravená tak, aby pri type `fake_atc` nekončila predčasne, ale pokračovala na kontrolu `landingtype` a `subtype`.

### 3. Chrome Autofill CSS v notepade
- **Oprava:** Pridané `-webkit-autofill` pravidlá do `globals.css` aj `styles.css`. Všetky polia v notepade si teraz zachovávajú správnu farbu textu a pozadia aj pri použití automatického dopĺňania v prehliadači Chrome/Edge.

### 4. Implementácia FAP ALT premennej
- **Oprava:** Pridaná podpora pre `fap_alt` premennú v `updateAtcVariables()`. Hodnota sa načítava z `RWY{xx}_ILS.ALT` poľa v regionálnej databáze a automaticky sa dopĺňa do notepadu.

### 5. ATC Bye/Hello pozdravy
- **Oprava:** Implementované dynamické pozdravy (`hello_dep`, `bye_dep`, `hello_arr`, `bye_arr`) z `greetings_atc.json` s fallback hierarchiou (country → continent → default).

### 6. Speech loop pri prechode CL → ATC
- **Oprava:** Eliminované opakované "Checklist completed" hlásenia pri prechode medzi checklist fázami a ATC blokmi. Logika `speakCurrentItem()` správne rozpoznáva ATC/briefing prechody.

### 7. Frequency decimal výslovnosť
- **Oprava:** Frekvencie ako `121.5` sa teraz čítajú ako "one two one decimal five" namiesto "one two one point five".

---

## 🛠 Rozpracované úlohy
- [x] Analýza a oprava aktualizácie premenných v `script.js`.
- [x] Implementácia kontroly `landingtype` pre položky typu `fake_atc` vo funkcii `isItemVisible()`.
- [x] Implementácia FAP ALT auto-fill z regionálnej databázy.
- [x] Implementácia ATC bye/hello pozdravov.
- [x] Oprava speech loopov pri CL/ATC prechodoch.
- [x] Oprava desatinnej výslovnosti frekvencií.
- [x] Kompletná revízia technickej dokumentácie v `docs/`.

---

## 💡 Nápady na budúcnosť
- [ ] Podpora pre ďalšie lietadlá (A320, C172, ...)
- [ ] Offline mode (Service Worker pre full PWA)
- [ ] Export/Import briefing dát medzi zariadeniami
- [ ] Integrácia s ďalšími flight plan službami (PFPX, etc.)
- [ ] Lokalizácia checklistu (nie len Help Guide)

---

*Naposledy aktualizované: 2026-05-10*
