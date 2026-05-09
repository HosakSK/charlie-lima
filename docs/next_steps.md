# Next Steps - Charlie-Lima

---

## 🐞 Nahlásené chyby (Zadaj sem novú chybu)
> **Poznámka pre používateľa:** Ak nájdeš chybu, vpiš ju sem pod tento riadok. Stačí uviesť krátky popis.
- chyba v notepade vyska pociatocneho ils

---

## ✅ Vyriešené (Resolved)

### 1. Problém s aktualizáciou premenných vo Fake ATC
- **Oprava:** Funkcia `updateAtcVariables()` bola pridaná do `saveBriefing()`. Premenné sa teraz aktualizujú okamžite pri každej zmene v notepade bez nutnosti refreshu.

### 2. Fake ATC položky ignorujú filtre (ILS/RNAV)
- **Oprava:** Funkcia `isItemVisible()` bola upravená tak, aby pri type `fake_atc` nekončila predčasne, ale pokračovala na kontrolu `landingtype` a `subtype`.

### 3. Chrome Autofill CSS v notepade
- **Oprava:** Pridané `-webkit-autofill` pravidlá do `globals.css` aj `styles.css`. Všetky polia v notepade si teraz zachovávajú správnu farbu textu a pozadia aj pri použití automatického dopĺňania v prehliadači Chrome/Edge.


---

## 🛠 Rozpracované úlohy
- [x] Analýza a oprava aktualizácie premenných v `script.js`.
- [x] Implementácia kontroly `landingtype` pre položky typu `fake_atc` vo funkcii `isItemVisible()`.


---

*Naposledy aktualizované: 2026-05-09*
