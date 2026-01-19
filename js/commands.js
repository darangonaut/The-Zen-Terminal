// COMMAND HANDLER
import { term } from './terminal.js';
import { state, saveTasks, saveStateSnapshot, reindexTasks, saveTotalCompleted } from './state.js';
import { playSuccessSound, toggleSound } from './audio.js';
import { applyTheme, themes, startThemeSelection } from './theme.js';
import { startFocus } from './focus.js';
import { loginUser, logoutUser, getCurrentUser } from './auth.js';

export const availableCommands = [
    'do', 'list', 'done', 'del', 'undo', 'focus', 
    'stats', 'theme', 'sound', 'help', 'clear',
    'login', 'logout', 'whoami'
];

export function handleCommand(cmd) {
    term.write('\r\n');
    const parts = cmd.trim().split(' ');
    const action = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    if (action === 'do') {
        const newTasks = args.split(';').map(t => t.trim()).filter(t => t.length > 0);
        if (newTasks.length > 0) {
            saveStateSnapshot();
            newTasks.forEach(taskText => {
                state.tasks.push({ id: state.tasks.length + 1, text: taskText, done: false });
                term.writeln(`[SYSTEM]: Task "${taskText}" added to the cognitive matrix.`);
            });
            saveTasks();
            reindexTasks();
        } else {
             term.writeln(`[ERROR]: You didn't enter any task text.`);
        }
    }
    else if (action === 'list') {
        if (state.tasks.length === 0) {
            term.writeln('[SYSTEM]: Void. No tasks available.');
            return;
        }

        if (args === 'tags') {
            // Extract unique tags
            const tags = new Set();
            state.tasks.forEach(t => {
                const found = t.text.match(/@\w+/g);
                if (found) found.forEach(tag => tags.add(tag));
            });
            
            if (tags.size === 0) {
                term.writeln('[SYSTEM]: No tags found used in tasks.');
            } else {
                term.writeln('=== ACTIVE TAGS ===');
                tags.forEach(tag => term.writeln(tag));
            }
        } 
        else if (args.startsWith('@')) {
            // Filter by tag
            const filtered = state.tasks.filter(t => t.text.includes(args));
            if (filtered.length === 0) {
                term.writeln(`[SYSTEM]: No tasks found with tag ${args}`);
            } else {
                term.writeln(`=== TASKS [${args}] ===`);
                filtered.forEach(t => term.writeln(`${t.id}. [${t.done ? 'X' : ' '}] ${t.text}`));
            }
        }
        else {
            // Show all
            state.tasks.forEach(t => term.writeln(`${t.id}. [${t.done ? 'X' : ' '}] ${t.text}`));
        }
    }
    else if (action === 'done') {
        const id = parseInt(args);
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            saveStateSnapshot();
            task.done = true;
            state.totalCompleted++;
            saveTotalCompleted();
            saveTasks();
            playSuccessSound();
            term.writeln('[SYSTEM]: Dopamine released. Task completed.');
        } else {
            term.writeln(`[ERROR]: Task with ID ${args} does not exist.`);
        }
    }
    else if (action === 'del') {
        if (args === 'all') {
            saveStateSnapshot();
            state.tasks = [];
            saveTasks();
            term.writeln('[SYSTEM]: Cognitive matrix cleared.');
        } else if (args === 'done') {
            const completedCount = state.tasks.filter(t => t.done).length;
            if (completedCount > 0) {
                saveStateSnapshot();
                state.tasks = state.tasks.filter(t => !t.done);
                reindexTasks();
                saveTasks();
                term.writeln(`[SYSTEM]: Removed ${completedCount} completed tasks. Focus restored.`);
            } else {
                term.writeln('[SYSTEM]: No completed tasks to remove.');
            }
        } else {
            const id = parseInt(args);
            const index = state.tasks.findIndex(t => t.id === id);
            if (index !== -1) {
                saveStateSnapshot();
                state.tasks.splice(index, 1);
                reindexTasks();
                saveTasks();
                term.writeln(`[SYSTEM]: Task ${id} removed.`);
            } else {
                term.writeln(`[ERROR]: Task with ID ${args} does not exist.`);
            }
        }
    }
    else if (action === 'undo') {
        if (state.previousTasks) {
            state.tasks = JSON.parse(JSON.stringify(state.previousTasks));
            state.previousTasks = null;
            saveTasks();
            term.writeln('[SYSTEM]: Time loop closed. Last change reverted.');
        } else {
            term.writeln('[SYSTEM]: Nowhere to return to.');
        }
    }
    else if (action === 'focus') {
        const focusArgs = args.split(' ').filter(a => a.length > 0);
        const minutes = parseInt(focusArgs[0]);
        
        if (!isNaN(minutes) && minutes > 0) {
            let taskName = "DEEP WORK"; 
            if (focusArgs.length > 1) {
                const id = parseInt(focusArgs[1]);
                const task = state.tasks.find(t => t.id === id);
                if (task) taskName = task.text;
            } else {
                const firstUnfinished = state.tasks.find(t => !t.done);
                if (firstUnfinished) taskName = firstUnfinished.text;
            }
            startFocus(minutes, taskName);
        } else {
            term.writeln('[ERROR]: Specify minutes (e.g., focus 25).');
        }
    }
    else if (action === 'stats') {
        term.writeln('=== STATISTICS ===');
        term.writeln(`Total completed tasks: ${state.totalCompleted}`);
        term.writeln(`Currently in list:     ${state.tasks.length}`);
    }
    else if (action === 'theme') {
        if (args) {
            if (themes[args]) {
                applyTheme(args);
                term.writeln(`[SYSTEM]: Theme changed to "${args}".`);
            } else {
                term.writeln('[ERROR]: Unknown theme. Try "theme" to select one.');
            }
        } else {
            startThemeSelection();
        }
    }
    else if (action === 'sound') {
        toggleSound(args, term);
    }
    else if (action === 'clear') {
        term.clear();
    }
    else if (action === 'login') {
        if (getCurrentUser()) {
            term.writeln(`[SYSTEM]: Already logged in as ${getCurrentUser().email}`);
        } else {
            loginUser();
        }
    }
    else if (action === 'logout') {
        if (getCurrentUser()) {
            logoutUser();
        } else {
            term.writeln('[SYSTEM]: Not logged in.');
        }
    }
    else if (action === 'whoami') {
        const user = getCurrentUser();
        if (user) {
            term.writeln(`Logged in as: ${user.email}`);
            term.writeln(`UID: ${user.uid}`);
        } else {
            term.writeln('Guest (Local Mode)');
        }
    }
    else if (action === 'help') {
        term.writeln('\r\n=== TASK MANAGEMENT ===');
        term.writeln('  do [text]       - add task(s)');
        term.writeln('  list            - show all tasks');
        term.writeln('  done [id]       - complete task');
        term.writeln('  del [id/all/done] - delete specific, all, or done');
        term.writeln('  undo            - revert last change');

        term.writeln('\r\n=== FOCUS & VISUALS ===');
        term.writeln('  focus [min]     - start Focus Mode (Matrix)');
        term.writeln('  theme [name]    - change color scheme');
        term.writeln('  sound [on/off]  - toggle sound effects');

        term.writeln('\r\n=== CLOUD & DATA ===');
        term.writeln('  login           - sync with Google Cloud');
        term.writeln('  logout          - disconnect from cloud');
        term.writeln('  whoami          - show user info');

        term.writeln('\r\n=== SYSTEM ===');
        term.writeln('  stats           - show productivity stats');
        term.writeln('  clear           - clear screen');
        term.writeln('  help            - show this menu');
    }
    else {
        if (cmd.trim() !== '') {
            term.writeln(`[ERROR]: Unknown command "${action}". Try "help".`);
        }
    }
}

export function handleAutocomplete(input, setInputCallback) {
    const parts = input.split(' ');
    
    // 1. Doplnanie hlavnych prikazov
    if (parts.length === 1 && input.length > 0) {
        const matches = availableCommands.filter(cmd => cmd.startsWith(input));
        
        if (matches.length === 1) {
            const completed = matches[0];
            const remainder = completed.substring(input.length);
            const newInput = completed + ' ';
            term.write(remainder + ' ');
            setInputCallback(newInput);
        } else if (matches.length > 1) {
            term.writeln('\r\n' + matches.join('  '));
            term.write(`${state.prompt}${input}`);
        }
    } 
    // 2. Doplnanie argumentov pre specificke prikazy
    else if (parts.length === 2) {
        const action = parts[0].toLowerCase();
        const argPrefix = parts[1].toLowerCase();
        let subMatches = [];

        if (action === 'del') {
            subMatches = ['all', 'done'].filter(s => s.startsWith(argPrefix));
        } else if (action === 'sound') {
            subMatches = ['on', 'off'].filter(s => s.startsWith(argPrefix));
        } else if (action === 'theme') {
            subMatches = Object.keys(themes).filter(s => s.startsWith(argPrefix));
        } else if (action === 'list') {
            // Get unique tags from tasks
            const tags = new Set(['tags']);
            state.tasks.forEach(t => {
                const found = t.text.match(/@\w+/g);
                if (found) found.forEach(tag => tags.add(tag));
            });
            subMatches = Array.from(tags).filter(s => s.startsWith(argPrefix));
        }

        if (subMatches.length === 1) {
            const completed = subMatches[0];
            const remainder = completed.substring(argPrefix.length);
            const newInput = input + remainder;
            term.write(remainder);
            setInputCallback(newInput);
        } else if (subMatches.length > 1) {
            term.writeln('\r\n' + subMatches.join('  '));
            term.write(`${state.prompt}${input}`);
        }
    }
}
