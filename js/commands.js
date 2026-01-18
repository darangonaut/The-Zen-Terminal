// COMMAND HANDLER
import { term } from './terminal.js';
import { state, saveTasks, saveStateSnapshot, reindexTasks, saveTotalCompleted } from './state.js';
import { playSuccessSound, toggleSound } from './audio.js';
import { applyTheme, themes, startThemeSelection } from './theme.js';
import { startFocus } from './focus.js';

export const availableCommands = [
    'do', 'list', 'done', 'del', 'undo', 'focus', 
    'stats', 'theme', 'sound', 'help', 'clear',
    'export', 'import'
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
                term.writeln(`[SYSTEM]: Uloha "${taskText}" bola pridana do kognitivnej matice.`);
            });
            saveTasks();
            reindexTasks();
        } else {
             term.writeln(`[CHYBA]: Nezadali ste ziadny text ulohy.`);
        }
    }
    else if (action === 'list') {
        if (state.tasks.length === 0) term.writeln('[SYSTEM]: Prazdnota. Ziadne ulohy.');
        state.tasks.forEach(t => term.writeln(`${t.id}. [${t.done ? 'X' : ' '}] ${t.text}`));
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
            term.writeln('[SYSTEM]: Dopamin uvolneny. Uloha splnena.');
        } else {
            term.writeln(`[CHYBA]: Uloha s ID ${args} neexistuje.`);
        }
    }
    else if (action === 'del') {
        if (args === 'all') {
            saveStateSnapshot();
            state.tasks = [];
            saveTasks();
            term.writeln('[SYSTEM]: Kognitivna matica bola vycistena.');
        } else {
            const id = parseInt(args);
            const index = state.tasks.findIndex(t => t.id === id);
            if (index !== -1) {
                saveStateSnapshot();
                state.tasks.splice(index, 1);
                reindexTasks();
                saveTasks();
                term.writeln(`[SYSTEM]: Uloha ${id} bola odstranena.`);
            } else {
                term.writeln(`[CHYBA]: Uloha s ID ${args} neexistuje.`);
            }
        }
    }
    else if (action === 'undo') {
        if (state.previousTasks) {
            state.tasks = JSON.parse(JSON.stringify(state.previousTasks));
            state.previousTasks = null;
            saveTasks();
            term.writeln('[SYSTEM]: Casova slucka uzavreta. Posledna zmena bola vratena.');
        } else {
            term.writeln('[SYSTEM]: Niet sa kam vratit.');
        }
    }
    else if (action === 'focus') {
        const focusArgs = args.split(' ').filter(a => a.length > 0);
        const minutes = parseInt(focusArgs[0]);
        
        if (!isNaN(minutes) && minutes > 0) {
            let taskName = "HLBOKÁ PRÁCA"; 
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
            term.writeln('[CHYBA]: Zadajte pocet minut. (napr. focus 25)');
        }
    }
    else if (action === 'stats') {
        term.writeln('=== STATISTIKA ===');
        term.writeln(`Celkovo splnenych uloh: ${state.totalCompleted}`);
        term.writeln(`Aktualne v zozname:     ${state.tasks.length}`);
    }
    else if (action === 'theme') {
        if (args) {
            if (themes[args]) {
                applyTheme(args);
                term.writeln(`[SYSTEM]: Tema zmenena na "${args}".`);
            } else {
                term.writeln('[CHYBA]: Neznama tema. Skuste len "theme" pre vyber.');
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
    else if (action === 'export') {
        const dataToExport = {
            tasks: state.tasks,
            theme: state.currentTheme,
            totalCompleted: state.totalCompleted,
            version: '1.0'
        };
        try {
            // Bezpecne kodovanie Unicode znakov (diakritiky) pre Base64
            const json = JSON.stringify(dataToExport);
            const exportString = btoa(unescape(encodeURIComponent(json)));
            
            // Funkcia pre vypis do terminalu (pouzita v oboch pripadoch)
            const printToTerminal = () => {
                term.writeln('=== EXPORT DAT ===');
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    term.writeln('[SYSTEM]: Kod bol skopirovany do schranky.');
                } else {
                    term.writeln('Skopirujte nasledujuci kod:');
                }
                term.writeln('');
                term.writeln(exportString);
                term.writeln('');
                term.writeln('Pre obnovenie pouzite: import [kod]');
            };

            // Pokus o kopirovanie
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(exportString)
                    .then(() => printToTerminal())
                    .catch(() => printToTerminal());
            } else {
                printToTerminal();
            }

        } catch (e) {
            console.error(e); // Pre debugovanie v konzole
            term.writeln('[CHYBA]: Export zlyhal (pravdepodobne problem s kódovaním znakov).');
        }
    }
    else if (action === 'import') {
        if (!args) {
            term.writeln('[CHYBA]: Chyba importovaci kod. Pouzitie: import [kod]');
            return;
        }
        
        try {
            // Odstranenie bielych znakov
            const cleanArgs = args.replace(/\s+/g, '');
            // Dekodovanie Unicode znakov z Base64
            const jsonString = decodeURIComponent(escape(atob(cleanArgs)));
            const data = JSON.parse(jsonString);

            if (Array.isArray(data.tasks)) {
                saveStateSnapshot();
                
                state.tasks = data.tasks;
                if (data.totalCompleted) state.totalCompleted = data.totalCompleted;
                if (data.theme && themes[data.theme]) {
                    state.currentTheme = data.theme;
                    applyTheme(data.theme);
                }

                saveTasks();
                saveTotalCompleted();
                reindexTasks();

                term.writeln('[SYSTEM]: Data uspesne obnovene z importu.');
                term.writeln(`[INFO]: Nacitanych ${state.tasks.length} uloh.`);
            } else {
                throw new Error('Neplatna struktura dat');
            }
        } catch (e) {
            term.writeln('[CHYBA]: Nepodarilo sa spracovat importovaci kod.');
            term.writeln('Uistite sa, ze ste skopirovali cely kod spravne.');
        }
    }
    else if (action === 'help') {
        term.writeln('do [text]       - pridat ulohu');
        term.writeln('list            - zobrazit vsetko');
        term.writeln('done [id]       - splnit ulohu');
        term.writeln('del [id/all]    - vymazat ulohu/vsetko');
        term.writeln('undo            - vratit zmenu');
        term.writeln('focus [min] [id]- Focus mod (Matrix)');
        term.writeln('theme [nazov]   - zmena farby');
        term.writeln('sound [on/off]  - zapnut/vypnut zvuky');
        term.writeln('export          - exportovat data');
        term.writeln('import [kod]    - importovat data');
        term.writeln('clear           - vycistit');
    }
    else {
        if (cmd.trim() !== '') {
            term.writeln(`[CHYBA]: Prikaz "${action}" nepoznam. Skuste "help".`);
        }
    }
}

export function handleAutocomplete(input, setInputCallback) {
    const parts = input.split(' ');
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
            term.write('> ' + input);
        }
    }
}
