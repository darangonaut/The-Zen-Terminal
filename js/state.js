// REACTIVE STATE MANAGEMENT

let cloudSaver = null;
let saveTimeout = null;
let isSyncing = false; // Internal flag to suppress saves during cloud hydration

// Initial Data Loading
const cachedEmail = localStorage.getItem('zen_user_email');
const initialPrompt = cachedEmail ? `${cachedEmail.split('@')[0]}@zen > ` : '> ';

const initialData = {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    previousTasks: null, // Undo buffer
    archive: JSON.parse(localStorage.getItem('zen_archive')) || [],
    commandHistory: JSON.parse(localStorage.getItem('zen_command_history')) || [],
    historyIndex: 0,
    totalCompleted: parseInt(localStorage.getItem('zen_total_completed')) || 0,
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

    // 2. Save to Local Storage
    localStorage.setItem('tasks', JSON.stringify(initialData.tasks));
    localStorage.setItem('zen_archive', JSON.stringify(initialData.archive));
    localStorage.setItem('zen_total_completed', initialData.totalCompleted);
    localStorage.setItem('zen_theme', initialData.currentTheme);
    localStorage.setItem('zen_sound', initialData.soundEnabled);
    localStorage.setItem('zen_command_history', JSON.stringify(initialData.commandHistory));

    // 3. Cloud Sync (if connected)
    if (cloudSaver) cloudSaver();
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
        if ((property === 'tasks' || property === 'archive' || property === 'commandHistory') && Array.isArray(value)) {
            return new Proxy(value, arrayHandler);
        }
        return value;
    }
};

// --- EXPORTS ---

// 1. The Reactive State Object
export const state = new Proxy(initialData, stateHandler);

// 2. Helper for Cloud Auth (Dependency Injection)
export function setCloudSaver(fn) {
    cloudSaver = fn;
}

// 3. Helper for Prompt Updates
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

// 4. Cloud Data Hydration
export function loadTasksFromCloud(data) {
    isSyncing = true; // Block write-back

    try {
        if (data.tasks) state.tasks = data.tasks;
        if (data.archive) state.archive = data.archive;
        if (data.totalCompleted !== undefined) state.totalCompleted = data.totalCompleted;
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