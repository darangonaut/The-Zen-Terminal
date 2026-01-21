// INPUT MANAGER
// Handles all keyboard inputs and routes them to appropriate modules

import { state, addToHistory } from './state.js';
import { handleCommand, handleAutocomplete } from './commands.js';
import { playKeySound } from './audio.js';
import { themeSelectionActive, handleThemeInput } from './theme.js';
import { isFocusActive, handleFocusInput, resizeMatrix } from './focus.js';
import { isBreakActive, handleBreakInput } from './break.js';

export class InputManager {
    constructor(term, fitAddon) {
        this.term = term;
        this.fitAddon = fitAddon;
        this.inputBuffer = ''; // Local input state

        // Store listener references for cleanup
        this._resizeHandler = null;
        this._keydownHandler = null;
    }

    init() {
        this.setupGlobalListeners();
        this.setupTerminalHandlers();
    }

    setupGlobalListeners() {
        // Remove existing listeners if present (prevent duplicates)
        this.removeGlobalListeners();

        // Resize Listener
        this._resizeHandler = () => {
            this.fitAddon.fit();
            if (isFocusActive()) resizeMatrix();
        };
        window.addEventListener('resize', this._resizeHandler);

        // Global Keydown (Shortcuts & Escapes)
        this._keydownHandler = (e) => {
            // Prevent default Tab behavior globally
            if (e.key === 'Tab') {
                e.preventDefault();
            }

            // Handle Focus/Break Mode Exit (Global listener because terminal is hidden)
            if (isFocusActive()) {
                if (e.key === 'q' || e.key === 'Q' || e.key === 'Escape') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    handleFocusInput(e.key);
                }
            } else if (isBreakActive()) {
                if (e.key === 'q' || e.key === 'Q' || e.key === 'Escape') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    handleBreakInput(e.key);
                }
            }
        };
        window.addEventListener('keydown', this._keydownHandler, { capture: true });
    }

    removeGlobalListeners() {
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
        if (this._keydownHandler) {
            window.removeEventListener('keydown', this._keydownHandler, { capture: true });
            this._keydownHandler = null;
        }
    }

    dispose() {
        // Clean up global listeners
        this.removeGlobalListeners();

        // Clean up terminal listeners
        if (this.dataListener) {
            this.dataListener.dispose();
            this.dataListener = null;
        }

        this.inputBuffer = '';
    }

    setupTerminalHandlers() {
        // Dispose existing listeners if any (prevent duplication on re-init)
        if (this.dataListener) {
            this.dataListener.dispose();
        }

        // Custom Key Handler for Tab Autocomplete
        this.term.attachCustomKeyEventHandler((arg) => {
            // 1. Block input if in special modes
            if (isFocusActive() || isBreakActive()) {
                return false;
            }

            if (arg.key === 'Tab') {
                if (arg.type === 'keydown') {
                    arg.preventDefault();
                    arg.stopPropagation();
                    handleAutocomplete(this.inputBuffer, (newInput) => {
                        this.setInput(newInput);
                    });
                }
                return false;
            }
            return true;
        });

        // Main Data Handler
        this.dataListener = this.term.onData(async (e) => {
            if (isFocusActive() || isBreakActive()) return;

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
            await this.handleStandardInput(e);
        });
    }

    async handleStandardInput(e) {
        switch (e) {
            case '\r': // Enter
                playKeySound();
                if (this.inputBuffer.trim().length > 0) {
                    addToHistory(this.inputBuffer);
                }
                await handleCommand(this.inputBuffer);
                this.inputBuffer = '';
                // Check active modes again before printing prompt
                if (!isFocusActive() && !isBreakActive() && !themeSelectionActive) {
                    this.term.write(`\r\n${state.prompt}`);
                }
                break;
            case '\u007F': // Backspace
                playKeySound();
                if (this.inputBuffer.length > 0) {
                    this.inputBuffer = this.inputBuffer.slice(0, -1);
                    this.term.write('\b \b');
                }
                break;
            case '\u001b[A': // Arrow Up
                if (state.historyIndex > 0) {
                    state.historyIndex--;
                    const histCmd = state.commandHistory[state.historyIndex];
                    if (histCmd !== undefined) this.setInput(histCmd);
                }
                break;
            case '\u001b[B': // Arrow Down
                if (state.historyIndex < state.commandHistory.length - 1) {
                    state.historyIndex++;
                    const histCmd = state.commandHistory[state.historyIndex];
                    if (histCmd !== undefined) this.setInput(histCmd);
                } else {
                    state.historyIndex = state.commandHistory.length;
                    this.setInput('');
                }
                break;
            case '\t': // Tab handled by custom handler
                break;
            default:
                if (e >= ' ' && e <= '~') {
                    this.inputBuffer += e;
                    this.term.write(e);
                }
        }
    }

    setInput(newInput) {
        // Clear current line
        while (this.inputBuffer.length > 0) {
            this.term.write('\b \b');
            this.inputBuffer = this.inputBuffer.slice(0, -1);
        }
        this.inputBuffer = newInput;
        this.term.write(this.inputBuffer);
    }
}
