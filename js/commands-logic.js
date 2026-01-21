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
        const task = {
            id: state.tasks.length + 1,
            text: taskText,
            done: false
        };
        state.tasks.push(task);
        added.push(taskText);
    });
    return success(`Task(s) added: "${added.join('", "')}"`);
}

export function logicList(args) {
    if (state.tasks.length === 0) {
        return info('Void. No tasks available.');
    }

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
        return { success: true, type: 'list_tasks', data: filtered, title: `TASKS [${args}]` };
    }
    else {
        return { success: true, type: 'list_tasks', data: state.tasks };
    }
}

export function logicDone(args) {
    const id = parseInt(args, 10);
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
        return error(`Task with ID ${args} does not exist.`);
    }
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
            return error(`Task with ID ${args} does not exist.`);
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
