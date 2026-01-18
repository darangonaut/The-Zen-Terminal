# The Zen Terminal v1.0

Minimalistický správca úloh inšpirovaný retro terminálovou estetikou a filozofiou hlbokej práce (Deep Work). Aplikácia poskytuje "zenové" prostredie pre organizáciu myšlienok bez rušivých elementov.

## Funkcionalita

The Zen Terminal funguje ako webová simulácia príkazového riadku. Všetky interakcie prebiehajú prostredníctvom textových príkazov.

### Hlavné vlastnosti

*   **Autentický zážitok:** Postavené na knižnici `xterm.js` s retro vizuálom.
*   **Focus Mód (Matrix):** Špeciálny režim sústredenia s efektom padajúcich znakov (Matrix dážď) a odpočítavaním času.
*   **Vizuálne témy:** Možnosť prepínať medzi klasickou **Zelenou**, **Jantárovou** (Amber) a **Azúrovou** (Cyan) farbou.
*   **História príkazov:** Listovanie v predchádzajúcich príkazoch pomocou šípok Hore/Dole.
*   **Perzistencia dát:** Úlohy a nastavenia sa automaticky ukladajú do prehliadača (LocalStorage).
*   **Hromadné akcie:** Podpora pridávania viacerých úloh naraz.

## Príkazy

Na ovládanie aplikácie sú dostupné nasledujúce príkazy:

### Správa úloh

*   **`do [text]`**
    *   Pridá novú úlohu.
    *   Podporuje viac úloh naraz oddelených bodkočiarkou.
    *   *Príklad:* `do Kúpiť mlieko; Vyniesť smeti`

*   **`list`**
    *   Zobrazí zoznam všetkých úloh.

*   **`done [id]`**
    *   Označí úlohu ako splnenú (uvoľní dopamín).
    *   *Príklad:* `done 1`

*   **`del [id]`** alebo **`del all`**
    *   Vymaže konkrétnu úlohu alebo celý zoznam.
    *   Zoznam sa po vymazaní automaticky prečísluje.

*   **`undo`**
    *   Vráti späť poslednú zmenu (záchrana pri omylom zmazanej úlohe).

### Produktivita & Vizuál

*   **`focus [minúty] [voliteľné_id_úlohy]`**
    *   Spustí režim hlbokého sústredenia.
    *   Celá obrazovka sa prepne do **Matrix efektu**.
    *   Ak zadáte ID úlohy (napr. `focus 25 3`), jej názov sa zobrazí nad časovačom.
    *   Režim ukončíte stlačením klávesu **`q`** alebo **`Esc`**.
    *   *Príklad:* `focus 25` (Pomodoro) alebo `focus 45 1` (Práca na úlohe č. 1)

*   **`theme [názov]`**
    *   Zmení farebnú schému.
    *   Ak napíšete len `theme`, spustí sa interaktívne menu (výber šípkami).
    *   Dostupné farby: `green`, `amber`, `cyan`.
    *   *Príklad:* `theme amber`

*   **`sound [on/off]`**
    *   Zapne alebo vypne zvukové efekty (písanie na klávesnici, splnenie úlohy).
    *   *Príklad:* `sound on`

*   **`stats`**
    *   Zobrazí celkový počet splnených úloh (dlhodobá štatistika).

### Ostatné

*   **`clear`**
    *   Vyčistí obrazovku terminálu.

*   **`help`**
    *   Zobrazí rýchly prehľad príkazov.

## Klávesové skratky

*   **Tab:** Automatické dopĺňanie príkazov (Autocomplete).
*   **Šípka Hore / Dole:** Listovanie v histórii zadaných príkazov.
*   **Šípky (v menu Theme):** Výber témy.
*   **q / Esc:** Ukončenie Focus módu alebo výberu témy.