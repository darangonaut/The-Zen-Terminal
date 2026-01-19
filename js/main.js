// MAIN ENTRY POINT
import { term, fitAddon } from './terminal.js';
import { state } from './state.js';
import { handleCommand, handleAutocomplete } from './commands.js';
import { playKeySound } from './audio.js';
import { 
    themeSelectionActive, 
    handleThemeInput, 
    applyTheme, 
    themes 
} from './theme.js';
import { 
    initFocusModule, 
    isFocusActive, 
    handleFocusInput, 
    stopFocus, 
    resizeMatrix 
} from './focus.js';

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

    // Mount Terminal
    term.open(domElements.terminalContainer);
    fitAddon.fit();

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
    term.writeln(' v1.0');
    term.writeln('');
    term.writeln('Type "help" for a list of commands.');
    term.write('\r\n> ');

    // Local state for input handling
    let input = '';

    // Listeners
    window.addEventListener('resize', () => {
        fitAddon.fit();
        if (isFocusActive()) resizeMatrix();
    });

    window.addEventListener('keydown', (e) => {
        // Prevent default Tab behavior globally
        if (e.key === 'Tab') {
            e.preventDefault();
        }
        // Handle Focus Mode Exit
        if (isFocusActive()) {
            handleFocusInput(e.key);
        }
    }, { capture: true });

    // Custom Key Handler for Tab Autocomplete
    term.attachCustomKeyEventHandler((arg) => {
        if (arg.key === 'Tab') {
            if (arg.type === 'keydown') {
                arg.preventDefault();
                arg.stopPropagation();
                handleAutocomplete(input, (newInput) => {
                    input = newInput;
                });
            }
            return false;
        }
        return true;
    });

    // Terminal Data Handler
    term.onData(e => {
        if (isFocusActive()) return;

        // Sound Feedback
        if (e.length === 1 && e.charCodeAt(0) >= 32) {
            playKeySound();
        }

        // 1. Theme Selection Mode
        if (themeSelectionActive) {
            handleThemeInput(e);
            return;
        }

        // 2. Standard Mode
        switch (e) {
            case '\r': // Enter
                playKeySound();
                if (input.trim().length > 0) {
                    state.commandHistory.push(input);
                    state.historyIndex = state.commandHistory.length;
                }
                handleCommand(input);
                input = '';
                // Check active modes again before printing prompt
                if (!isFocusActive() && !themeSelectionActive) term.write('\r\n> ');
                break;
            case '\u007F': // Backspace
                playKeySound();
                if (input.length > 0) {
                    input = input.slice(0, -1);
                    term.write('\b \b');
                }
                break;
            case '\u001b[A': // Arrow Up
                if (state.historyIndex > 0) {
                    state.historyIndex--;
                    const histCmd = state.commandHistory[state.historyIndex];
                    setInput(histCmd);
                }
                break;
            case '\u001b[B': // Arrow Down
                if (state.historyIndex < state.commandHistory.length - 1) {
                    state.historyIndex++;
                    const histCmd = state.commandHistory[state.historyIndex];
                    setInput(histCmd);
                } else {
                    state.historyIndex = state.commandHistory.length;
                    setInput('');
                }
                break;
            case '\t': // Tab handled by custom handler
                break;
            default:
                if (e >= ' ' && e <= '~') {
                    input += e;
                    term.write(e);
                }
        }
    });

    // Helper to visually replace input line
    function setInput(newInput) {
        // Clear current line
        while (input.length > 0) {
            term.write('\b \b');
            input = input.slice(0, -1);
        }
        input = newInput;
        term.write(input);
    }
});
