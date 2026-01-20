// MAIN ENTRY POINT
import { term, fitAddon } from './terminal.js';
import { state } from './state.js';
import { initAuth } from './auth.js';
import { applyTheme, themes } from './theme.js';
import { initFocusModule } from './focus.js';
import { initBreakModule } from './break.js';
import { InputManager } from './input-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements Map
    const domElements = {
        terminalContainer: document.getElementById('terminal-container'),
        matrixCanvas: document.getElementById('matrix-canvas'),
        focusOverlay: document.getElementById('focus-overlay'),
        focusTaskEl: document.getElementById('focus-task'),
        focusTimerEl: document.getElementById('focus-timer'),
        focusHintEl: document.getElementById('focus-hint')
    };

    // Initialize Modules
    initFocusModule(domElements);
    initBreakModule(domElements);
    initAuth(); // Start Firebase Auth listener

    // Mount Terminal
    term.open(domElements.terminalContainer);
    fitAddon.fit();
    term.focus(); // Auto-focus on load

    // Initialize Input Manager
    const inputManager = new InputManager(term, fitAddon);
    inputManager.init();

    // Initial Setup
    if (themes[state.currentTheme]) {
        applyTheme(state.currentTheme);
    }

    // ASCII Logo
    term.writeln(`   ______            _______                  _             _ `);
    term.writeln(`  |___  /           |__   __|                (_)           | |`);
    term.writeln(`     / / ___ _ __      | | ___ _ __ _ __ ___  _ _ __   __ _| |`);
    term.writeln(`    / / / _ \\ '_ \\     | |/ _ \\ '__| '_ \` _ \\| | '_ \\ / _\` | |`);
    term.writeln(`   / /_|  __/ | | |    | |  __/ |  | | | | | | | | | | (_| | |`);
    term.writeln(`  /_____\\___|_| |_|    |_|\\___|_|  |_| |_| |_|_|_| |_|\\__,_|_|`);
    term.writeln('');
    term.writeln(' v2.0');
    term.writeln('');
    term.writeln('Type "help" for a list of commands.');
    term.write(`
${state.prompt}`);
});