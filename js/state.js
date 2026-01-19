// STATE MANAGEMENT

let cloudSaver = null; // Callback for cloud saving

// Optimistic Prompt Initialization
const cachedEmail = localStorage.getItem('zen_user_email');
const initialPrompt = cachedEmail ? `${cachedEmail.split('@')[0]}@zen > ` : '> ';

export const state = {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    previousTasks: null,
    archive: JSON.parse(localStorage.getItem('zen_archive')) || [],
    commandHistory: JSON.parse(localStorage.getItem('zen_command_history')) || [],
    historyIndex: 0, // Will be set correctly below
    totalCompleted: parseInt(localStorage.getItem('zen_total_completed')) || 0,
    currentTheme: localStorage.getItem('zen_theme') || 'green',
    soundEnabled: localStorage.getItem('zen_sound') === 'true',
    prompt: initialPrompt
};

// Initialize history index based on loaded history
state.historyIndex = state.commandHistory.length;

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

export function setCloudSaver(fn) {
    cloudSaver = fn;
}

export function addToHistory(cmd) {
    state.commandHistory.push(cmd);
    if (state.commandHistory.length > 50) {
        state.commandHistory.shift();
    }
    state.historyIndex = state.commandHistory.length;
    
    // Save locally immediately
    localStorage.setItem('zen_command_history', JSON.stringify(state.commandHistory));
    
    // Trigger cloud sync
    if (cloudSaver) cloudSaver();
}

export function loadTasksFromCloud(data) {
    if (data.tasks) state.tasks = data.tasks;
    if (data.archive) state.archive = data.archive;
    if (data.totalCompleted) state.totalCompleted = data.totalCompleted;
    if (data.theme) state.currentTheme = data.theme;
    if (data.commandHistory && Array.isArray(data.commandHistory)) {
        state.commandHistory = data.commandHistory;
        state.historyIndex = state.commandHistory.length;
        // Update local cache of history from cloud
        localStorage.setItem('zen_command_history', JSON.stringify(state.commandHistory));
    }
    
    // Ulozit aj do lokalneho storage ako zalohu/cache
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
    localStorage.setItem('zen_archive', JSON.stringify(state.archive));
    localStorage.setItem('zen_total_completed', state.totalCompleted);
}
export function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
    localStorage.setItem('zen_archive', JSON.stringify(state.archive));
    if (cloudSaver) cloudSaver();
}

export function saveStateSnapshot() {
    state.previousTasks = JSON.parse(JSON.stringify(state.tasks));
}

export function saveTotalCompleted() {
    localStorage.setItem('zen_total_completed', state.totalCompleted);
    if (cloudSaver) cloudSaver();
}

export function reindexTasks() {
    state.tasks.forEach((t, i) => t.id = i + 1);
}
