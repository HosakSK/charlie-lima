Podme vytvorit novu funciu. Ako prve si velmi podrobne prestuduj co aplikacia robi. Uplne celu uplne na komplet. A potom vytvor plan podla ktoreho novu funciu napise tvoj kolega Gemini 3.1 Pro (Low) koli setreniu kreditom.

O aku funkciu ide. Ide o Fake ATC (ak ti napada slusnesi nazov tak navrhni)

AKo bude fungovat: Bude to velmi velmi podobne ako mame funkciu briefing. S par nasledujucimi rozdielmi:

- Bude mat samstntny gombikna zapnutie v nastaveni rovnako ako vsetko ostane
- Tak isto ako pri briefingu sa o zapnuti otvori uplne rovnaky popup ako pri briefigu s tym rozdielom ze na briefingovom popupe bude nezavisli takze ked zakliknem pri briefingu ze druhy krat ttoto upozonenie v popupe nezobrazovat bude to vypnutie zobrazovanie iba pre briefing a napopak ak to vypnem ze toto uz nezobrazovat pri fake atc tak sa to zasa netyuka pre popup v birefingu, ako relane aj tak vseti pri obich odkliknu ze druhy krat nezobrazovat a aj tak sa to nikomu zobrazovat nebude ale chcem tam ma to to upozornenei
-Fake ATC sa nebude zobrazovat ako text v liste bude sluzit iba ako podklad pre Voice model
-Citanie fake atc sa sputi automaticke po kliknuti na predchadzajucu polozku 
-rovnako ako pri briefingu budeme pouivat premenne a trvnako potrebujem ze ak nejaka premenna v konkretnom riadky chyba tak sa nebude citat cely riadok
-ak nebude vyplnena ziadna premenna z daneho okna Fake ATC tak sa nebude citat ta polozka vobec toto ale mam uz naprohramovane pri briefingu tak sa pozri na to ci je to pouzitelne aj tu aby sa tu zbytocne nehromadil zbytocny duplicitny kod, ale je mozne ze tym ze je to ina funkcia trocha mozu tam byt re tea nejake specifika a teda mozno to bude treba zvlast zvas to ty
- toto bude najvacia zmena a najvacsia vyzva, potrebujem tam mat dva rozne hlasi predstavijem si to tak ale mozno jajdes nejaky lepsi sposob ze ak riadok bude napriklad zacinat

#pm bla bla bla, a ja mam nastaveny zenksy hlas tak bla bla bla (#pm sa necitan nahlas) precita zensky hlas

ak riadok bude zacinat

#atc bla bla tak bla bla precita muzsky hlas (#atc sa necita)

a samozrejme akmam v nastaveniach zakliknute mala voice tak to bude presne naopak

- v zlozke docs najdes presnu specifikaciu ako budu myslene volacky atc
- ked si pozres aplikaciu poradne tak najdes ze mame vytvorene nejake premenne v notepade, tak tieto premenne budeme pouivat aj vo fake atc
- potrebujeme ale aj premenne nove specialne pre atc
 teda naprikad budem potrebovat premennu napriklad

odlet_ground, toto ked pozujem tak sa aplikacia pozre do notepadu ze odkial odlietam tam bude napriklad ze odlietam z LZIB

v dalsiom ktorku vyhlada v airports_atc.json LZIB a vyhlada v nim ground (lzib ho ma ale ak by ho nenasieltak postupoje podla ogiky popisanej v subere fake_atc_setup.md, ale kedze lzib ground ma tak to bude pre voice model znamenat ze precita Stefanik Ground, rovnako budem potrebovat vytvorit premenen aj pre frekvencie 

budem mat 5 zakadne premene na odlete

delivery_dep
ground_dep
tower_dep
approach_dep
fir_dep

a 4 pre prilet 

fir_arr
approach_arr
tower_arr
ground_arr

teda potom este dalsie 9 pre kazdy tento premennu vytvorit aj premennu freq

teda napriklad  ground_dep_freq

potom dalie premenne pre mesto odkial idem a kam idem teda

city_dep
city_arr

vsetky tieto premnne treba dorobit aj do creatora ale sprav im prosim zvlast okienko bude vyerat rovnako ako to pre premnee ktore uz mame vbude to vlastne duplikat tohoto okna akurat ze teda budu tam premenne ktore su pre fake atc

dalej vytvor aj premennu podla greetings_atc.json to je v podate jednoduchy pozran vytvore4 premenne premennu ktora bude 

napriklad hello_dep vtedy sa aplikacia pozre ze odklia vzlietam pozre ze LZIB to si opat v subore s letiskami najde ze je na slovensu tak vyhlada hello pozrav pre slovensko a recita potojne anglickym akccentom s tym sa trapit nemuss ze Dobry den

aj tieto premenne treba doplnit do creatoru do okna premennych atc

no a v poslednim rade treba v creatore okrem tlacidiel +flow + checklist a +briefing vytvorit teda aj tlacidlo +atc uplne rovnakym stylom a uplne rovnakym sporobom ako maem pridavanie briefingov teda jednoduche textove okno do ktoreho sa bude pisat text 

viem ze sme krvopotne vytvarali databazu pre TA a init altitude ale to zatial nechame lezat to budem ezrejme doplnat z notepadu takze tie premenne uz mame tie vytvarat nemusis, myslis ze som na nieco zabudol?

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

vzor priklad ked bude funkcia hotova mozes doplnit hned za polozku ATC | Clearance

#pm %delivery_dep% %hello_dep% %callsign%
#pm at stand %dep_gate%
#pm with information %dep_atis%
#pm requesting clearance to %city_arr%.
#atc %callsign% %delivery_dep% hello_dep% 
#atc cleared to %city_arr%
#atc via %sid%
#atc runway %dep_rwy%
#atc initial altitude %initial_alt%
#atc information %dep_atis% is correct
#atc squawk %squawk%.
#pm Cleared to %arr_city%,
#pm %sid%,
#pm runway %dep_rwy%,
#pm altitude %initial_alt%
#pm squawk %squawk%
#pm %callsign%
#atc %callsign% readback correct, report fully ready.
#pm %callsign%


to mi pripomenulo nemame premnennu %dep_gate% aj ked v  otepade tato odnota je tak ju vytvor aj do creatora do okna premennych