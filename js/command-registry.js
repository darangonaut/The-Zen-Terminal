import * as Logic from './commands-logic.js';
import { startFocus } from './focus.js';
import { startBreak } from './break.js';
import { applyTheme, themes, startThemeSelection } from './theme.js';
import { toggleSound } from './audio.js';
import { term } from './terminal.js'; // Needed for direct UI commands (sound/clear)
import { loginUser, logoutUser, getCurrentUser, manualSync } from './auth.js';
import { toggleNotifications, areNotificationsEnabled } from './notifications.js';
import { state } from './state.js';

// Helper for UI-only commands that don't return logic objects
const uiSuccess = (msg) => ({ success: true, message: msg });
const uiError = (msg) => ({ success: false, message: msg });

export const commandRegistry = [
    // --- TASK MANAGEMENT ---
    {
        name: 'add',
        description: 'Add task(s) to the matrix',
        usage: 'add <text> [; <text>...]',
        execute: (args) => Logic.logicAdd(args)
    },
    {
        name: 'list',
        description: 'Show tasks (all, active, or by tag)',
        usage: 'list [tags | @tag]',
        execute: (args) => Logic.logicList(args)
    },
    {
        name: 'done',
        description: 'Mark a task as completed',
        usage: 'done <id>',
        execute: (args) => Logic.logicDone(args)
    },
    {
        name: 'rm',
        description: 'Remove task(s) (specific, all, or done)',
        usage: 'rm <id> | all | done',
        execute: (args) => Logic.logicRm(args)
    },
    {
        name: 'undo',
        description: 'Revert the last change',
        usage: 'undo',
        execute: () => Logic.logicUndo()
    },

    // --- FOCUS & VISUALS ---
    {
        name: 'focus',
        description: 'Enter Deep Work mode (Matrix rain)',
        usage: 'focus [minutes] [task_id]',
        execute: (args) => {
            const focusArgs = args.split(' ').filter(a => a.length > 0);
            let minutes = 25;
            let taskId = null;

            if (focusArgs.length > 0) {
                minutes = parseInt(focusArgs[0]);
                if (focusArgs.length > 1) taskId = parseInt(focusArgs[1]);
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
                return null; // UI is handled by startFocus
            } else {
                return uiError('Specify valid minutes (e.g., focus 25).');
            }
        }
    },
    {
        name: 'break',
        description: 'Start a breathing break',
        usage: 'break [minutes]',
        execute: (args) => {
            let minutes = 5;
            if (args) {
                const parsed = parseInt(args);
                if (!isNaN(parsed) && parsed > 0) minutes = parsed;
            }
            startBreak(minutes);
            return null;
        }
    },
    {
        name: 'theme',
        description: 'Change color scheme',
        usage: 'theme [green|amber|cyan]',
        execute: (args) => {
            if (args) {
                if (themes[args]) {
                    applyTheme(args);
                    return uiSuccess(`Theme changed to "${args}".`);
                } else {
                    return uiError('Unknown theme. Try "theme" to select one.');
                }
            } else {
                startThemeSelection();
                return null;
            }
        }
    },
    {
        name: 'sound',
        description: 'Toggle sound effects',
        usage: 'sound [on/off]',
        execute: (args) => {
            toggleSound(args, term);
            return null; // toggleSound writes to term
        }
    },
    {
        name: 'notify',
        description: 'Toggle browser notifications',
        usage: 'notify [on/off]',
        execute: async (args) => {
            const result = await toggleNotifications(args);
            if (result.success) {
                const status = areNotificationsEnabled() ? 'ON' : 'OFF';
                return { success: true, message: `${result.message} Status: ${status}` };
            }
            return result;
        }
    },

    // --- CLOUD & DATA ---
    {
        name: 'login',
        description: 'Sync with Google Cloud',
        usage: 'login',
        execute: async () => {
            if (getCurrentUser()) return uiSuccess(`Already logged in as ${getCurrentUser().email}`);
            await loginUser();
            return null;
        }
    },
    {
        name: 'logout',
        description: 'Disconnect from cloud',
        usage: 'logout',
        execute: async () => {
            if (getCurrentUser()) {
                await logoutUser();
                return null;
            }
            return uiSuccess('Not logged in.');
        }
    },
    {
        name: 'sync',
        description: 'Manually sync data to cloud',
        usage: 'sync',
        execute: async () => {
            term.writeln('[SYSTEM]: Syncing to cloud...');
            const result = await manualSync();
            return result;
        }
    },
    {
        name: 'whoami',
        description: 'Show current user info',
        usage: 'whoami',
        execute: () => {
            const user = getCurrentUser();
            if (user) {
                term.writeln(`Logged in as: ${user.email}`);
                term.writeln(`UID: ${user.uid}`);
            } else {
                term.writeln('Guest (Local Mode)');
            }
            return null;
        }
    },

    // --- SYSTEM ---
    {
        name: 'stats',
        description: 'Show productivity statistics',
        usage: 'stats',
        execute: () => {
            term.writeln('=== STATISTICS ===');
            term.writeln(`Total completed tasks: ${state.totalCompleted}`);
            term.writeln(`Currently in list:     ${state.tasks.length}`);
            return null;
        }
    },
    {
        name: 'review',
        description: 'Show achievements from last 24h',
        usage: 'review',
        execute: () => {
            const now = Date.now();
            const past24h = now - (24 * 60 * 60 * 1000);
            
            const recentlyDone = [
                ...state.tasks.filter(t => t.done && t.completedAt > past24h),
                ...state.archive.filter(t => t.completedAt > past24h)
            ];

            if (recentlyDone.length === 0) {
                return uiSuccess('No tasks completed in the last 24 hours. Get back to work.');
            } else {
                term.writeln('=== 24-HOUR RETROSPECTIVE ===');
                recentlyDone.sort((a, b) => a.completedAt - b.completedAt).forEach(t => {
                    const date = new Date(t.completedAt);
                    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    term.writeln(`[${time}] ✅ ${t.text}`);
                });
                term.writeln(`\r\n[SYSTEM]: Total: ${recentlyDone.length} achievements detected.`);
                return null;
            }
        }
    },
    {
        name: 'clear',
        description: 'Clear terminal screen',
        usage: 'clear',
        execute: () => {
            term.clear();
            return null;
        }
    }
    // Note: 'help' is handled dynamically in commands.js using this registry
];
