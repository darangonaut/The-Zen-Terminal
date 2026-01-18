const term = new Terminal({
    cursorBlink: true,
    theme: { background: '#000', foreground: '#00ff00' },
    fontFamily: 'Courier New, monospace',
    fontSize: 18
});

const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);

term.open(document.getElementById('terminal-container'));
fitAddon.fit();

window.addEventListener('resize', () => fitAddon.fit());

term.writeln('=== ZEN TERMINAL v1.0 ===');
term.writeln('Zadaj "help" pre zoznam prikazov.');
term.write('\r\n> ');

let input = '';
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let previousTasks = null;
let commandHistory = [];
let historyIndex = 0;

term.onData(e => {
    switch (e) {
        case '\r': // Enter
            if (input.trim().length > 0) {
                commandHistory.push(input);
                historyIndex = commandHistory.length;
            }
            handleCommand(input);
            input = '';
            term.write('\r\n> ');
            break;
        case '\u007F': // Backspace
            if (input.length > 0) {
                input = input.slice(0, -1);
                term.write('\b \b');
            }
            break;
        case '\u001b[A': // Arrow Up
            if (historyIndex > 0) {
                historyIndex--;
                setInput(commandHistory[historyIndex]);
            }
            break;
        case '\u001b[B': // Arrow Down
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                setInput(commandHistory[historyIndex]);
            } else {
                historyIndex = commandHistory.length;
                setInput('');
            }
            break;
        default:
            if (e >= ' ' && e <= '~') {
                input += e;
                term.write(e);
            }
    }
});

function setInput(newInput) {
    // Vycisti aktualny riadok (visual backspace)
    while (input.length > 0) {
        term.write('\b \b');
        input = input.slice(0, -1);
    }
    input = newInput;
    term.write(input);
}

function handleCommand(cmd) {
    term.write('\r\n');
    const parts = cmd.trim().split(' ');
    const action = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    if (action === 'do') {
        const newTasks = args.split(';').map(t => t.trim()).filter(t => t.length > 0);
        
        if (newTasks.length > 0) {
            saveState();
            newTasks.forEach(taskText => {
                tasks.push({ id: tasks.length + 1, text: taskText, done: false });
                term.writeln(`[SYSTEM]: Uloha "${taskText}" bola pridana do kognitivnej matice.`);
            });
            save();
            reindex();
        } else {
             term.writeln(`[CHYBA]: Nezadali ste ziadny text ulohy.`);
        }
    }
    else if (action === 'list') {
        if (tasks.length === 0) term.writeln('[SYSTEM]: Prazdnota. Ziadne ulohy.');
        tasks.forEach(t => term.writeln(`${t.id}. [${t.done ? 'X' : ' '}] ${t.text}`));
    }
    else if (action === 'done') {
        const id = parseInt(args);
        const task = tasks.find(t => t.id === id);
        if (task) {
            saveState();
            task.done = true;
            save();
            term.writeln('[SYSTEM]: Dopamin uvolneny. Uloha splnena.');
        } else {
            term.writeln(`[CHYBA]: Uloha s ID ${args} neexistuje.`);
        }
    }
    else if (action === 'del') {
        if (args === 'all') {
            saveState();
            tasks = [];
            save();
            term.writeln('[SYSTEM]: Kognitivna matica bola vycistena.');
        } else {
            const id = parseInt(args);
            const index = tasks.findIndex(t => t.id === id);
            if (index !== -1) {
                saveState();
                tasks.splice(index, 1);
                reindex();
                save();
                term.writeln(`[SYSTEM]: Uloha ${id} bola odstranena.`);
            } else {
                term.writeln(`[CHYBA]: Uloha s ID ${args} neexistuje.`);
            }
        }
    }
    else if (action === 'undo') {
        if (previousTasks) {
            tasks = JSON.parse(JSON.stringify(previousTasks));
            previousTasks = null;
            save();
            term.writeln('[SYSTEM]: Casova slucka uzavreta. Posledna zmena bola vratena.');
        } else {
            term.writeln('[SYSTEM]: Niet sa kam vratit.');
        }
    }
    else if (action === 'clear') {
        term.clear();
    }
    else if (action === 'help') {
        term.writeln('do [text]       - pridat ulohu (mozno oddelit ; pre viacero)');
        term.writeln('list            - zobrazit vsetko');
        term.writeln('done [id]       - splnit ulohu');
        term.writeln('del [id/all]    - vymazat ulohu alebo vsetko');
        term.writeln('undo            - vratit poslednu zmenu');
        term.writeln('clear           - vycistit obrazovku');
    }
    else {
        term.writeln(`[CHYBA]: Prikaz "${action}" nepoznam. Skuste "help".`);
    }
}

function saveState() {
    previousTasks = JSON.parse(JSON.stringify(tasks));
}

function reindex() {
    tasks.forEach((t, i) => t.id = i + 1);
}

function save() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}
