// STATE MANAGEMENT

export const state = {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    previousTasks: null,
    commandHistory: [],
    historyIndex: 0,
    totalCompleted: parseInt(localStorage.getItem('zen_total_completed')) || 0,
    currentTheme: localStorage.getItem('zen_theme') || 'green',
    soundEnabled: localStorage.getItem('zen_sound') === 'true'
};

export function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
}

export function saveStateSnapshot() {
    state.previousTasks = JSON.parse(JSON.stringify(state.tasks));
}

export function saveTotalCompleted() {
    localStorage.setItem('zen_total_completed', state.totalCompleted);
}

export function reindexTasks() {
    state.tasks.forEach((t, i) => t.id = i + 1);
}