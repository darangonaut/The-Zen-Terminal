// PURE BUSINESS LOGIC FOR COMMANDS
import { state, saveStateSnapshot } from './state.js';

// Validation constants
const MAX_TASK_LENGTH = 200;
const MAX_TASKS_AT_ONCE = 20;

// Helper for responses
const success = (msg) => ({ success: true, message: msg });
const error = (msg) => ({ success: false, message: msg });
const info = (msg) => ({ success: true, message: msg, type: 'info' });

export function logicAdd(args) {
    const newTasks = args.split(';').map(t => t.trim()).filter(t => t.length > 0);

    if (newTasks.length === 0) {
        return error("You didn't enter any task text.");
    }

    // Validate: max tasks at once
    if (newTasks.length > MAX_TASKS_AT_ONCE) {
        return error(`Too many tasks at once. Maximum is ${MAX_TASKS_AT_ONCE}.`);
    }

    // Validate: task text length
    const tooLong = newTasks.filter(t => t.length > MAX_TASK_LENGTH);
    if (tooLong.length > 0) {
        return error(`Task text too long (max ${MAX_TASK_LENGTH} chars). Shorten: "${tooLong[0].substring(0, 30)}..."`);
    }

    saveStateSnapshot();
    const added = [];
    newTasks.forEach(taskText => {
        let priority = 0;
        let cleanText = taskText;

        // Detect priority (e.g., !!! Task or Task !!!)
        const priorityRegex = /^(!{1,3})\s+|\s+(!{1,3})$/;
        const match = cleanText.match(priorityRegex);
        if (match) {
            const marks = match[1] || match[2];
            priority = marks.length;
            cleanText = cleanText.replace(marks, '').trim();
        }

        const task = {
            id: state.tasks.length + 1,
            text: cleanText,
            priority: priority,
            done: false
        };
        state.tasks.push(task);
        added.push(cleanText + (priority > 0 ? ` [P${priority}]` : ''));
    });
    return success(`Task(s) added: "${added.join('", "')}"`);
}

export function logicList(args) {
    if (state.tasks.length === 0) {
        return info('Void. No tasks available.');
    }

    const sortTasks = (tasks) => {
        return [...tasks].sort((a, b) => {
            // Unfinished first
            if (a.done !== b.done) return a.done ? 1 : -1;
            // High priority first
            if (a.priority !== b.priority) return b.priority - a.priority;
            // Oldest first (by ID)
            return a.id - b.id;
        });
    };

    if (args === 'tags') {
        const tags = new Set();
        state.tasks.forEach(t => {
            const found = t.text.match(/@\w+/g);
            if (found) found.forEach(tag => tags.add(tag));
        });
        
        if (tags.size === 0) {
            return info('No tags found used in tasks.');
        }
        return { success: true, type: 'list_tags', data: Array.from(tags) };
    } 
    else if (args && args.startsWith('@')) {
        const filtered = state.tasks.filter(t => t.text.includes(args));
        if (filtered.length === 0) {
            return info(`No tasks found with tag ${args}`);
        }
        return { success: true, type: 'list_tasks', data: sortTasks(filtered), title: `TASKS [${args}]` };
    }
    else {
        return { success: true, type: 'list_tasks', data: sortTasks(state.tasks) };
    }
}

export function logicDone(args) {
    const id = parseInt(args, 10);
    if (isNaN(id)) {
        return error('Please enter a valid task ID (number).');
    }
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        saveStateSnapshot();
        task.done = true;
        task.completedAt = Date.now();
        state.totalCompleted++;
        // Force update for deep properties
        state.tasks = state.tasks;
        return success('Dopamine released. Task completed.');
    } else {
        return error(`Task with ID ${id} does not exist.`);
    }
}

export function logicEdit(args) {
    const parts = args.trim().split(' ');
    if (parts.length < 2) {
        return error('Usage: edit <id> <new text>');
    }

    const id = parseInt(parts[0], 10);
    if (isNaN(id)) {
        return error('Please enter a valid task ID (number).');
    }

    let newText = parts.slice(1).join(' ');
    if (newText.length > MAX_TASK_LENGTH) {
        return error(`Task text too long (max ${MAX_TASK_LENGTH} chars).`);
    }

    const task = state.tasks.find(t => t.id === id);
    if (!task) {
        return error(`Task with ID ${id} does not exist.`);
    }

    saveStateSnapshot();
    
    // Detect priority in new text
    let priority = 0;
    const priorityRegex = /^(!{1,3})\s+|\s+(!{1,3})$/;
    const match = newText.match(priorityRegex);
    if (match) {
        const marks = match[1] || match[2];
        priority = marks.length;
        newText = newText.replace(marks, '').trim();
    } else {
        // If no marks provided, we could either keep old priority or reset it.
        // Let's keep the old one if no marks are provided, 
        // OR reset it if we want full control. 
        // Standard CLI behavior: usually replaces the whole "field".
        // Let's reset it to 0 if no marks are present in the NEW text.
        priority = 0; 
    }

    task.text = newText;
    task.priority = priority;
    
    // Force update
    state.tasks = state.tasks;

    return success(`Task ${id} updated: "${newText}"${priority > 0 ? ` [P${priority}]` : ''}`);
}

export function logicRm(args) {
    if (args === 'all') {
        saveStateSnapshot();
        state.tasks = [];
        return success('Cognitive matrix cleared.');
    } else if (args === 'done') {
        const completedTasks = state.tasks.filter(t => t.done);
        if (completedTasks.length > 0) {
            saveStateSnapshot();
            completedTasks.forEach(t => {
                if (!t.completedAt) t.completedAt = Date.now();
                state.archive.push(t);
            });
            if (state.archive.length > 100) state.archive = state.archive.slice(-100);
            
            state.tasks = state.tasks.filter(t => !t.done);
            return success(`Archived ${completedTasks.length} completed tasks. Focus restored.`);
        } else {
            return info('No completed tasks to remove.');
        }
    } else {
        const id = parseInt(args, 10);
        if (isNaN(id)) {
            return error('Please enter a valid task ID (number), "all", or "done".');
        }
        const index = state.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            saveStateSnapshot();
            const task = state.tasks[index];
            if (task.done) {
                if (!task.completedAt) task.completedAt = Date.now();
                state.archive.push(task);
                if (state.archive.length > 100) state.archive = state.archive.slice(-100);
            }
            state.tasks.splice(index, 1);
            return success(`Task ${id} removed.`);
        } else {
            return error(`Task with ID ${id} does not exist.`);
        }
    }
}

export function logicUndo() {
    if (state.previousTasks) {
        state.tasks = JSON.parse(JSON.stringify(state.previousTasks));
        state.previousTasks = null;
        return success('Time loop closed. Last change reverted.');
    } else {
        return info('Nowhere to return to.');
    }
}

export function logicZenfetch() {
    const quotes = [
        "Focus on being productive instead of busy.",
        "The soul is the same in all living creatures, although the body of each is different.",
        "Simplicity is the ultimate sophistication.",
        "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.",
        "One today is worth two tomorrows.",
        "The path to Zen is through the keyboard.",
        "Order is the shape of freedom."
    ];

    const logo = [
        "  _____            ",
        " |__  /___ _ __    ",
        "   / // _ \\ '_ \\   ",
        "  / /|  __/ | | |  ",
        " /____\\___|_| |_|  "
    ];

    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    const completed = state.totalCompleted;
    const active = state.tasks.filter(t => !t.done).length;
    const theme = state.currentTheme.charAt(0).toUpperCase() + state.currentTheme.slice(1);

    return {
        success: true,
        type: 'zenfetch',
        data: {
            logo,
            info: [
                { label: "OS", value: "ZenOS v2.2 (Web)" },
                { label: "THEME", value: theme },
                { label: "TASKS", value: `${completed} done / ${active} active` },
                { label: "QUOTE", value: `"${quote}"` }
            ]
        }
    };
}

export function logicMemo(args) {
    if (!args) {
        // Default to list if no args
        return logicMemoList(); 
    }
    
    const trimmed = args.trim();
    if (trimmed === 'list') {
        return logicMemoList();
    }
    if (trimmed === 'clear') {
        state.memos = [];
        return success('Mind cleared. All memos deleted.');
    }
    
    // Otherwise add
    const memo = {
        id: Date.now(),
        text: trimmed,
        timestamp: Date.now()
    };
    state.memos.push(memo);
    return success('Thought recorded.');
}

function logicMemoList() {
    if (state.memos.length === 0) {
       return info('No thoughts recorded yet.');
    }
    
    // Sort by timestamp desc (newest first)
    const sorted = [...state.memos].sort((a, b) => b.timestamp - a.timestamp);
    
    const data = sorted.map(m => {
        const date = new Date(m.timestamp);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
            id: m.id,
            text: m.text,
            meta: `[${dateStr} ${timeStr}]`
        };
    });
    
    return { success: true, type: 'list_memos', data: data, title: 'MEMO LOG' };
}
