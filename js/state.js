// REACTIVE STATE MANAGEMENT

let saveTimeout = null;
let isSyncing = false; // Internal flag to suppress saves during cloud hydration
let cloudDataLoaded = false; // Flag to track if we've loaded from cloud

// Safe JSON parse helper
function safeJsonParse(key, fallback = []) {
    try {
        const data = localStorage.getItem(key);
        if (data === null) return fallback;
        return JSON.parse(data);
    } catch (e) {
        console.warn(`Failed to parse localStorage key "${key}":`, e);
        return fallback;
    }
}

// Initial Data Loading
const cachedEmail = localStorage.getItem('zen_user_email');
const initialPrompt = cachedEmail ? `${cachedEmail.split('@')[0]}@zen > ` : '> ';

const initialData = {
    tasks: safeJsonParse('tasks', []),
    previousTasks: null, // Undo buffer
    memos: safeJsonParse('zen_memos', []),
    archive: safeJsonParse('zen_archive', []),
    commandHistory: safeJsonParse('zen_command_history', []),
    historyIndex: 0,
    totalCompleted: parseInt(localStorage.getItem('zen_total_completed'), 10) || 0,
    currentTheme: localStorage.getItem('zen_theme') || 'green',
    soundEnabled: localStorage.getItem('zen_sound') === 'true',
    prompt: initialPrompt
};

// Ensure history index is correct on load
initialData.historyIndex = initialData.commandHistory.length;

// --- INTERNAL HELPERS ---

function persist() {
    if (isSyncing) return; // Never save back if we are currently loading from cloud
    // 1. Re-index tasks automatically (Auto-maintenance)
    // We do this here so business logic doesn't have to worry about IDs
    initialData.tasks.forEach((t, i) => t.id = i + 1);

    // 2. Save to Local Storage only (cloud sync is manual via 'sync' command)
    localStorage.setItem('tasks', JSON.stringify(initialData.tasks));
    localStorage.setItem('zen_memos', JSON.stringify(initialData.memos));
    localStorage.setItem('zen_archive', JSON.stringify(initialData.archive));
    localStorage.setItem('zen_total_completed', initialData.totalCompleted);
    localStorage.setItem('zen_theme', initialData.currentTheme);
    localStorage.setItem('zen_sound', initialData.soundEnabled);
    localStorage.setItem('zen_command_history', JSON.stringify(initialData.commandHistory));
}

// Debounce: Prevents hammering storage on rapid changes (e.g., bulk add)
function scheduleSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        persist();
    }, 200); // 200ms delay
}

// --- PROXY HANDLERS ---

const arrayHandler = {
    set(target, property, value, receiver) {
        // Use Reflect to ensure default behavior (like updating length) works correctly
        const result = Reflect.set(target, property, value, receiver);
        
        // Trigger save if operation was successful and modified content
        if (result && (property === 'length' || !isNaN(property))) {
            scheduleSave();
        }
        return result;
    }
};

const stateHandler = {
    set(target, property, value, receiver) {
        const result = Reflect.set(target, property, value, receiver);
        // Only save if the property is NOT ephemeral (like historyIndex)
        if (result && property !== 'historyIndex') {
            scheduleSave();
        }
        return result;
    },
    get(target, property, receiver) {
        const value = Reflect.get(target, property, receiver);
        
        // Deep Proxy for Arrays to detect .push(), .splice(), etc.
        if ((property === 'tasks' || property === 'memos' || property === 'archive' || property === 'commandHistory') && Array.isArray(value)) {
            return new Proxy(value, arrayHandler);
        }
        return value;
    }
};

// --- EXPORTS ---

// 1. The Reactive State Object
export const state = new Proxy(initialData, stateHandler);

// 2. Helper for Prompt Updates
export function updatePrompt(user) {
    if (user) {
        localStorage.setItem('zen_user_email', user.email);
        const name = user.email.split('@')[0];
        state.prompt = `${name}@zen > `;
    } else {
        localStorage.removeItem('zen_user_email');
        state.prompt = '> ';
    }
}

// 4. Check if user was previously logged in (cached email exists)
export function hasCachedLogin() {
    return localStorage.getItem('zen_user_email') !== null;
}

// 5. Check if cloud data has been loaded
export function isCloudDataLoaded() {
    return cloudDataLoaded;
}

// 6. Cloud Data Hydration
export function loadTasksFromCloud(data) {
    isSyncing = true; // Block write-back
    cloudDataLoaded = true; // Mark that we've received cloud data

    try {
        // Always overwrite local with cloud data when logged in
        state.tasks = data.tasks || [];
        state.memos = data.memos || [];
        state.archive = data.archive || [];
        state.totalCompleted = data.totalCompleted ?? 0;
        if (data.theme) state.currentTheme = data.theme;
        if (data.commandHistory) {
            // Check if user was at the "end" (inputting new command) before update
            const wasAtEnd = state.historyIndex >= state.commandHistory.length;

            state.commandHistory = data.commandHistory;

            if (wasAtEnd) {
                // Keep at end
                state.historyIndex = state.commandHistory.length;
            } else {
                // User was browsing. Keep index, but clamp it if history shrank.
                if (state.historyIndex > state.commandHistory.length) {
                    state.historyIndex = state.commandHistory.length;
                }
            }

            // Update local cache of history from cloud
            localStorage.setItem('zen_command_history', JSON.stringify(state.commandHistory));
        }
    } finally {
        // Use a small timeout to ensure all proxy-triggered microtasks are finished
        setTimeout(() => {
            isSyncing = false;
        }, 50);
    }
}

// 7. Reset cloud loaded flag (on logout)
export function resetCloudState() {
    cloudDataLoaded = false;
}

// 5. Utility: Save Snapshot (for Undo)
// This remains manual because "when to snapshot" is a business decision
export function saveStateSnapshot() {
    state.previousTasks = JSON.parse(JSON.stringify(state.tasks));
}

// 6. Utility: Add to History
export function addToHistory(cmd) {
    state.commandHistory.push(cmd);
    if (state.commandHistory.length > 50) {
        state.commandHistory.shift();
    }
    state.historyIndex = state.commandHistory.length;
    // Proxies handle saving automatically
}

// Note: manual saveTasks() and reindexTasks() are no longer needed/exported.