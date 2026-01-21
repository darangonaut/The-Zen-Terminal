// MAIN ENTRY POINT
import { term, fitAddon } from './terminal.js';
import { state, hasCachedLogin } from './state.js';
import { initAuth, waitForCloudData, manualSync, getCurrentUser } from './auth.js';
import { initNotifications } from './notifications.js';
import { applyTheme, themes } from './theme.js';
import { initFocusModule } from './focus.js';
import { initBreakModule } from './break.js';
import { InputManager } from './input-manager.js';

document.addEventListener('DOMContentLoaded', async () => {
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
    initNotifications(); // Browser notifications
    initAuth(); // Start Firebase Auth listener

    // Mount Terminal
    term.open(domElements.terminalContainer);
    fitAddon.fit();
    term.focus(); // Auto-focus on load

    // Initialize Input Manager
    const inputManager = new InputManager(term, fitAddon);
    inputManager.init();

    // ASCII Logo
    term.writeln(`   ______            _______                  _             _ `);
    term.writeln(`  |___  /           |__   __|                (_)           | |`);
    term.writeln(`     / / ___ _ __      | | ___ _ __ _ __ ___  _ _ __   __ _| |`);
    term.writeln(`    / / / _ \\ '_ \\     | |/ _ \\ '__| '_ \` _ \\| | '_ \\ / _\` | |`);
    term.writeln(`   / /_|  __/ | | |    | |  __/ |  | | | | | | | | | | (_| | |`);
    term.writeln(`  /_____\\___|_| |_|    |_|\\___|_|  |_| |_| |_|_|_| |_|\\__,_|_|`);
    term.writeln('');
    term.writeln(' v2.1');
    term.writeln('');

    // If user was logged in, wait for cloud data before showing prompt
    if (hasCachedLogin()) {
        term.writeln('[SYSTEM]: Syncing with cloud...');
        await waitForCloudData();
        term.writeln('[SYSTEM]: Cloud data loaded.');
    }

    // Apply theme (may have been updated from cloud)
    if (themes[state.currentTheme]) {
        applyTheme(state.currentTheme);
    }

    term.writeln('Type "help" for a list of commands.');
    term.write(`\r\n${state.prompt}`);

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => {})
            .catch(() => {});
    }

    // Auto-sync when user leaves the page (tab switch, minimize, close)
    // Using visibilitychange instead of beforeunload for reliable async sync
    let lastSyncTime = 0;
    const SYNC_DEBOUNCE = 5000; // Don't sync more than once per 5 seconds

    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'hidden' && getCurrentUser()) {
            const now = Date.now();
            if (now - lastSyncTime > SYNC_DEBOUNCE) {
                lastSyncTime = now;
                await manualSync();
            }
        }
    });
});