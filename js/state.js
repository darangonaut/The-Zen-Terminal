// STATE MANAGEMENT

let cloudSaver = null; // Callback for cloud saving

export const state = {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    previousTasks: null,
    commandHistory: [],
    historyIndex: 0,
    totalCompleted: parseInt(localStorage.getItem('zen_total_completed')) || 0,
    currentTheme: localStorage.getItem('zen_theme') || 'green',
    soundEnabled: localStorage.getItem('zen_sound') === 'true'
};

export function setCloudSaver(fn) {
    cloudSaver = fn;
}

export function loadTasksFromCloud(data) {
    if (data.tasks) state.tasks = data.tasks;
    if (data.totalCompleted) state.totalCompleted = data.totalCompleted;
    if (data.theme) state.currentTheme = data.theme;
    
    // Ulozit aj do lokalneho storage ako zalohu/cache
    // POZOR: Tu volame saveTasks, ktora vola cloudSaver. 
    // Aby sme predisli nekonecnemu cyklu (load -> save -> cloudSave -> load...), 
    // cloudSaver by mal byt volany len pri manualnej zmene, alebo si musime dat pozor.
    // Ale v saveTasks je cloudSaver.
    
    // RIESENIE: Pri loade z cloudu chceme len aktualizovat local storage, nie znova ukladat do cloudu.
    // Takze namiesto volania saveTasks() tu urobime update priamo.
    
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
    localStorage.setItem('zen_total_completed', state.totalCompleted);
    // theme riesi volajuci
}

export function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
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
