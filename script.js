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
            newTasks.forEach(taskText => {
                tasks.push({ id: tasks.length + 1, text: taskText, done: false });
                term.writeln(`[SYSTEM]: Uloha "${taskText}" bola pridana do kognitivnej matice.`);
            });
            save();
        } else {
             term.writeln(`[CHYBA]: Nezadali ste ziadny text ulohy.`);
        }
    }
    else if (action === 'list') {
        if (tasks.length === 0) term.writeln('[SYSTEM]: Prazdnota. Ziadne ulohy.');
        tasks.forEach(t => term.writeln(`${t.id}. [${t.done ? 'X' : ' '}] ${t.text}`));
    }
    else if (action === 'done') {
        const id = parseInt(args) - 1;
        if (tasks[id]) {
            tasks[id].done = true;
            save();
            term.writeln('[SYSTEM]: Dopamin uvolneny. Uloha splnena.');
        }
    }
    else if (action === 'clear') {
        term.clear();
    }
    else if (action === 'help') {
        term.writeln('do [text]    - pridat ulohu (mozno oddelit ; pre viacero)');
        term.writeln('list         - zobrazit vsetko');
        term.writeln('done [id]    - splnit ulohu');
        term.writeln('clear        - vycistit obrazovku');
    }
    else {
        term.writeln(`[CHYBA]: Prikaz "${action}" nepoznam. Skuste "help".`);
    }
}

function save() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}
