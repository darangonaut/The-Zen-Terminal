# The Zen Terminal v1.0

Minimalistický správca úloh inšpirovaný retro terminálovou estetikou. Aplikácia poskytuje "zenové" prostredie pre organizáciu myšlienok a úloh bez zbytočného vizuálneho šumu.

## Funkcionalita

The Zen Terminal funguje ako webová simulácia príkazového riadku. Všetky interakcie prebiehajú prostredníctvom textových príkazov, čo umožňuje rýchle a efektívne ovládanie.

### Hlavné vlastnosti

*   **Autentický zážitok:** Postavené na knižnici `xterm.js` s klasickou zeleno-čiernou farebnou schémou.
*   **Perzistencia dát:** Vaše úlohy sú automaticky ukladané do lokálneho úložiska prehliadača (LocalStorage), takže o ne neprídete ani po obnovení stránky.
*   **Zenová spätná väzba:** Systémové hlášky sú navrhnuté tak, aby podporovali pocit úspechu (napr. "Dopamín uvoľnený").

## Príkazy

Na ovládanie aplikácie sú dostupné nasledujúce príkazy:

*   **`do [text]`**
    *   Pridá novú úlohu do vašej "kognitívnej matice".
    *   *Príklad:* `do Kúpiť mlieko`

*   **`list`**
    *   Zobrazí zoznam všetkých evidovaných úloh aj s ich stavom (splnené/nesplnené).
    *   Ak je zoznam prázdny, systém vás na to upozorní.

*   **`done [id]`**
    *   Označí úlohu so zadaným číslom (ID) ako splnenú.
    *   *Príklad:* `done 1`

*   **`clear`**
    *   Vyčistí obrazovku terminálu, ak chcete začať s čistým štítom.

*   **`help`**
    *   Zobrazí rýchly prehľad všetkých dostupných príkazov.
