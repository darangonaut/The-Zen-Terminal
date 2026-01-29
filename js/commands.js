// COMMAND HANDLER & BUSINESS LOGIC
import { term } from './terminal.js';
import { state } from './state.js';
import { playSuccessSound } from './audio.js';
import { themes } from './theme.js';
import { commandRegistry } from './command-registry.js';

// --- MAIN HANDLER ---

export async function handleCommand(input) {
    term.write('\r\n');

    const parts = input.trim().split(' ');
    const action = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    if (action === 'help') {
        cmdHelp();
        return;
    }

    const command = commandRegistry.find(cmd => cmd.name === action);

    if (command) {
        const result = await command.execute(args);
        handleLogicResult(result);
    } else {
        if (input.trim() !== '') {
            term.writeln(`[ERROR]: Unknown command "${action}". Try "help".`);
        }
    }
}

// --- OUTPUT HANDLER ---

function handleLogicResult(result) {
    if (!result) return; // Command handled its own output or had no output

    if (result.type === 'list_tags') {
        term.writeln('=== ACTIVE TAGS ===');
        result.data.forEach(tag => term.writeln(tag));
    } 
    else if (result.type === 'list_tasks') {
        if (result.title) term.writeln(`=== ${result.title} ===`);
        result.data.forEach(t => {
            const pMark = t.priority > 0 ? '!'.repeat(t.priority) + ' ' : '';
            term.writeln(`${t.id}. [${t.done ? 'X' : ' '}] ${pMark}${t.text}`);
        });
    }
    else if (result.type === 'list_memos') {
        if (result.title) term.writeln(`=== ${result.title} ===`);
        result.data.forEach(m => {
            term.writeln(`\x1b[2m${m.meta}\x1b[0m ${m.text}`);
        });
    }
    else if (result.type === 'zenfetch') {
        const { logo, info } = result.data;
        term.writeln('');
        logo.forEach((line, i) => {
            const infoLine = info[i] ? `  \x1b[1;32m${info[i].label}:\x1b[0m ${info[i].value}` : '';
            term.writeln(`${line}${infoLine}`);
        });
        // If there's more info than logo lines
        if (info.length > logo.length) {
            for (let i = logo.length; i < info.length; i++) {
                const padding = ' '.repeat(logo[0].length);
                term.writeln(`${padding}  \x1b[1;32m${info[i].label}:\x1b[0m ${info[i].value}`);
            }
        }
        term.writeln('');
    }
    else {
        // Simple message
        const prefix = result.success ? '[SYSTEM]:' : '[ERROR]:';
        term.writeln(`${prefix} ${result.message}`);
        
        // Play sound on success (generic rule, can be refined)
        if (result.success && result.type !== 'info') {
             playSuccessSound();
        }
    }
}

// --- DYNAMIC HELP ---

function cmdHelp() {
    term.writeln('\r\n=== AVAILABLE COMMANDS ===');
    
    // Determine max length for padding
    const maxLen = Math.max(...commandRegistry.map(c => c.name.length));
    
    commandRegistry.forEach(cmd => {
        const pad = ' '.repeat(maxLen - cmd.name.length + 2);
        term.writeln(`  ${cmd.name}${pad}- ${cmd.description}`);
    });
    
    term.writeln(`  help${' '.repeat(maxLen - 2)}- show this menu`);
    term.writeln('\r\nTip: Use TAB for autocomplete.');
}

// --- AUTOCOMPLETE ---

export function handleAutocomplete(input, setInputCallback) {
    const parts = input.split(' ');
    const availableCommands = [...commandRegistry.map(c => c.name), 'help'];
    
    // 1. Command Autocomplete
    if (parts.length === 1 && input.length > 0) {
        const matches = availableCommands.filter(cmd => cmd.startsWith(input));
        
        if (matches.length === 1) {
            const completed = matches[0];
            const newInput = completed + ' ';
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

        // Logic for specific commands
        if (action === 'rm') {
            subMatches = ['all', 'done'].filter(s => s.startsWith(argPrefix));
        } else if (action === 'sound' || action === 'notify') {
            subMatches = ['on', 'off'].filter(s => s.startsWith(argPrefix));
        } else if (action === 'memo') {
            subMatches = ['list', 'clear'].filter(s => s.startsWith(argPrefix));
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
            setInputCallback(newInput);
        } else if (subMatches.length > 1) {
            term.writeln('\r\n' + subMatches.join('  '));
            term.write(`${state.prompt}${input}`);
        }
    }
}