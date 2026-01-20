// COMMAND HANDLER & BUSINESS LOGIC
import { term } from './terminal.js';
import { state } from './state.js'; // Stale needed for autocomplete
import { playSuccessSound, toggleSound } from './audio.js';
import { applyTheme, themes, startThemeSelection } from './theme.js';
import { startFocus } from './focus.js';
import { startBreak } from './break.js';
import { loginUser, logoutUser, getCurrentUser } from './auth.js';
import { logicAdd, logicList, logicDone, logicRm, logicUndo } from './commands-logic.js';

// --- COMMAND IMPLEMENTATIONS ---

function handleLogicResult(result) {
    if (!result) return;

    if (result.type === 'list_tags') {
        term.writeln('=== ACTIVE TAGS ===');
        result.data.forEach(tag => term.writeln(tag));
    } 
    else if (result.type === 'list_tasks') {
        if (result.title) term.writeln(`=== ${result.title} ===`);
        result.data.forEach(t => term.writeln(`${t.id}. [${t.done ? 'X' : ' '}] ${t.text}`));
    }
    else {
        // Simple message
        const prefix = result.success ? '[SYSTEM]:' : '[ERROR]:';
        term.writeln(`${prefix} ${result.message}`);
    }
}

function cmdAdd(args) {
    const result = logicAdd(args);
    handleLogicResult(result);
}

function cmdList(args) {
    const result = logicList(args);
    handleLogicResult(result);
}

function cmdDone(args) {
    const result = logicDone(args);
    handleLogicResult(result);
    if (result.success) playSuccessSound();
}

function cmdRm(args) {
    const result = logicRm(args);
    handleLogicResult(result);
}

function cmdUndo() {
    const result = logicUndo();
    handleLogicResult(result);
}

function cmdFocus(args) {
    const focusArgs = args.split(' ').filter(a => a.length > 0);
    
    let minutes = 25; // Default value
    let taskId = null;

    if (focusArgs.length > 0) {
        minutes = parseInt(focusArgs[0]);
        if (focusArgs.length > 1) {
            taskId = parseInt(focusArgs[1]);
        }
    }
    
    if (!isNaN(minutes) && minutes > 0) {
        let taskName = "DEEP WORK"; 
        if (taskId !== null) {
            const task = state.tasks.find(t => t.id === taskId);
            if (task) taskName = task.text;
        } else {
            const firstUnfinished = state.tasks.find(t => !t.done);
            if (firstUnfinished) taskName = firstUnfinished.text;
        }
        startFocus(minutes, taskName);
    } else {
        term.writeln('[ERROR]: Specify valid minutes (e.g., focus 25).');
    }
}

function cmdBreak(args) {
    let minutes = 5;
    if (args) {
        const parsed = parseInt(args);
        if (!isNaN(parsed) && parsed > 0) {
            minutes = parsed;
        }
    }
    startBreak(minutes);
}

function cmdStats() {
    term.writeln('=== STATISTICS ===');
    term.writeln(`Total completed tasks: ${state.totalCompleted}`);
    term.writeln(`Currently in list:     ${state.tasks.length}`);
}

function cmdTheme(args) {
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

function cmdSound(args) {
    toggleSound(args, term);
}

function cmdClear() {
    term.clear();
}

function cmdLogin() {
    if (getCurrentUser()) {
        term.writeln(`[SYSTEM]: Already logged in as ${getCurrentUser().email}`);
    } else {
        loginUser();
    }
}

function cmdLogout() {
    if (getCurrentUser()) {
        logoutUser();
    } else {
        term.writeln('[SYSTEM]: Not logged in.');
    }
}

function cmdWhoami() {
    const user = getCurrentUser();
    if (user) {
        term.writeln(`Logged in as: ${user.email}`);
        term.writeln(`UID: ${user.uid}`);
    } else {
        term.writeln('Guest (Local Mode)');
    }
}

function cmdReview() {
    const now = Date.now();
    const past24h = now - (24 * 60 * 60 * 1000);
    
    const recentlyDone = [
        ...state.tasks.filter(t => t.done && t.completedAt > past24h),
        ...state.archive.filter(t => t.completedAt > past24h)
    ];

    if (recentlyDone.length === 0) {
        term.writeln('[SYSTEM]: No tasks completed in the last 24 hours. Get back to work.');
    } else {
        term.writeln('=== 24-HOUR RETROSPECTIVE ===');
        recentlyDone.sort((a, b) => a.completedAt - b.completedAt).forEach(t => {
            const date = new Date(t.completedAt);
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            term.writeln(`[${time}] ✅ ${t.text}`);
        });
        term.writeln(`\r\n[SYSTEM]: Total: ${recentlyDone.length} achievements detected.`);
    }
}

function cmdHelp() {
    term.writeln('\r\n=== TASK MANAGEMENT ===');
    term.writeln('  add [text]      - add task(s)');
    term.writeln('  list            - show all tasks');
    term.writeln('  done [id]       - complete task');
    term.writeln('  rm [id/all/done]- delete specific, all, or done');
    term.writeln('  undo            - revert last change');

    term.writeln('\r\n=== FOCUS & VISUALS ===');
    term.writeln('  focus [min]     - start Focus Mode (Matrix)');
    term.writeln('  break [min]     - start Breathing Break');
    term.writeln('  theme [name]    - change color scheme');
    term.writeln('  sound [on/off]  - toggle sound effects');

    term.writeln('\r\n=== CLOUD & DATA ===');
    term.writeln('  login           - sync with Google Cloud');
    term.writeln('  logout          - disconnect from cloud');
    term.writeln('  whoami          - show user info');

    term.writeln('\r\n=== SYSTEM ===');
    term.writeln('  stats           - show productivity stats');
    term.writeln('  review          - last 24h achievements');
    term.writeln('  clear           - clear screen');
    term.writeln('  help            - show this menu');
}

// --- COMMAND REGISTRY ---

const commands = {
    'add': cmdAdd,
    'list': cmdList,
    'done': cmdDone,
    'rm': cmdRm,
    'undo': cmdUndo,
    'focus': cmdFocus,
    'break': cmdBreak,
    'stats': cmdStats,
    'theme': cmdTheme,
    'sound': cmdSound,
    'clear': cmdClear,
    'login': cmdLogin,
    'logout': cmdLogout,
    'whoami': cmdWhoami,
    'review': cmdReview,
    'help': cmdHelp
};

export const availableCommands = Object.keys(commands);

// --- MAIN HANDLER ---

export function handleCommand(input) {
    term.write('\r\n');
    
    const parts = input.trim().split(' ');
    const action = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    if (commands[action]) {
        commands[action](args);
    } else {
        if (input.trim() !== '') {
            term.writeln(`[ERROR]: Unknown command "${action}". Try "help".`);
        }
    }
}

// --- AUTOCOMPLETE ---

export function handleAutocomplete(input, setInputCallback) {
    const parts = input.split(' ');
    
    // 1. Command Autocomplete
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
    // 2. Argument Autocomplete
    else if (parts.length === 2) {
        const action = parts[0].toLowerCase();
        const argPrefix = parts[1].toLowerCase();
        let subMatches = [];

        if (action === 'rm') {
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