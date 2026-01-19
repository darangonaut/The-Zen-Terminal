// THEME MANAGER
import { term } from './terminal.js';
import { state } from './state.js';

export const themes = {
    green: { foreground: '#00ff00', background: '#000000', cursor: '#00ff00' },
    amber: { foreground: '#ffb000', background: '#000000', cursor: '#ffb000' },
    cyan:  { foreground: '#00ffff', background: '#000000', cursor: '#00ffff' }
};

export const themeList = ['green', 'amber', 'cyan'];

export function applyTheme(themeName) {
    if (themes[themeName]) {
        state.currentTheme = themeName;
        term.options.theme = themes[themeName];
        localStorage.setItem('zen_theme', themeName);
    }
}

// UI Selection Logic variables
export let themeSelectionActive = false;
export let themeSelectionIndex = 0;

export function startThemeSelection() {
    themeSelectionActive = true;
    themeSelectionIndex = themeList.indexOf(state.currentTheme);
    if (themeSelectionIndex === -1) themeSelectionIndex = 0;
    
    term.writeln('=== THEME SELECTION ===');
    term.writeln('Use Arrows to select, ENTER to confirm.');
    renderThemeSelection();
}

export function renderThemeSelection() {
    const line = themeList.map((t, i) => {
        if (i === themeSelectionIndex) return `[ ${t.toUpperCase()} ]`;
        return `  ${t}  `;
    }).join('   ');
    term.write(`\r\x1b[K${line}`);
}

export function handleThemeInput(e) {
    if (e === '\u001b[A' || e === '\u001b[D') { // Up/Left
        themeSelectionIndex = (themeSelectionIndex > 0) ? themeSelectionIndex - 1 : themeList.length - 1;
        renderThemeSelection();
    } else if (e === '\u001b[B' || e === '\u001b[C') { // Down/Right
        themeSelectionIndex = (themeSelectionIndex < themeList.length - 1) ? themeSelectionIndex + 1 : 0;
        renderThemeSelection();
    } else if (e === '\r') { // Enter
        applyTheme(themeList[themeSelectionIndex]);
        themeSelectionActive = false;
        term.writeln(`\r\n[SYSTEM]: Theme changed to "${themeList[themeSelectionIndex]}".`);
        term.write('\r\n> ');
    } else if (e === 'q' || e === 'Q' || e === '\u001b') { // q/Esc
        themeSelectionActive = false;
        term.writeln('\r\n[SYSTEM]: Theme change cancelled.');
        term.write('\r\n> ');
    }
}
