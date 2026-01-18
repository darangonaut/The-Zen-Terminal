document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const terminalContainer = document.getElementById('terminal-container');
    const matrixCanvas = document.getElementById('matrix-canvas');
    const focusOverlay = document.getElementById('focus-overlay');
    const focusTaskEl = document.getElementById('focus-task');
    const focusTimerEl = document.getElementById('focus-timer');
    const focusHintEl = document.getElementById('focus-hint');
    const ctx = matrixCanvas.getContext('2d');

    const term = new Terminal({
        cursorBlink: true,
        theme: { background: '#000', foreground: '#00ff00' },
        fontFamily: 'Courier New, monospace',
        fontSize: 14
    });

    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalContainer);
    fitAddon.fit();

    window.addEventListener('resize', () => {
        fitAddon.fit();
        if (focusActive) resizeMatrix();
    });

    // ASCII Logo
    term.writeln('  ______              _______                  _             _ ');
    term.writeln(' |___  /             |__   __|                (_)           | |');
    term.writeln('    / /  ___ _ __       | | ___ _ __ _ __ ___  _ _ __   __ _| |');
    term.writeln('   / /  / _ \ \'_ \      | |/ _ \ \'__| \'_ ` _ \| | \'_ \ / _` | |');
    term.writeln('  / /__|  __/ | | |     | |  __/ |  | | | | | | | | | | (_| | |');
    term.writeln(' /_____|\___|_| |_|     |_|\___|_|  |_| |_| |_|_|_| |_|\__,_|_|');
    term.writeln('');
    term.writeln(' v1.0');
    term.writeln('');
    term.writeln('Zadaj "help" pre zoznam prikazov.');
    term.write('\r\n> ');

    // DATA & STATE
    let input = '';
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let previousTasks = null;
    let commandHistory = [];
    let historyIndex = 0;
    let totalCompleted = parseInt(localStorage.getItem('zen_total_completed')) || 0;
    let currentTheme = localStorage.getItem('zen_theme') || 'green';

    const themes = {
        green: { foreground: '#00ff00', background: '#000000', cursor: '#00ff00' },
        amber: { foreground: '#ffb000', background: '#000000', cursor: '#ffb000' },
        cyan:  { foreground: '#00ffff', background: '#000000', cursor: '#00ffff' }
    };

    // INITIAL THEME APPLICATION
    if (themes[currentTheme]) {
        term.options.theme = themes[currentTheme];
    }

    // MODES
    let focusActive = false;
    let focusInterval = null;
    let focusTimeLeft = 0;
    let matrixInterval = null;

    let themeSelectionActive = false;
    const themeList = ['green', 'amber', 'cyan'];
    let themeSelectionIndex = 0;

    // GLOBAL KEY LISTENER (For Focus Mode)
    window.addEventListener('keydown', (e) => {
        if (focusActive) {
            if (e.key === 'q' || e.key === 'Q' || e.key === 'Escape') {
                stopFocus();
            }
        }
    });

    // TERMINAL INPUT HANDLING
    term.onData(e => {
        if (focusActive) return; // Ignore terminal input during focus

        // THEME SELECTION MODE
        if (themeSelectionActive) {
            if (e === '\u001b[A' || e === '\u001b[D') { // Up/Left
                themeSelectionIndex = (themeSelectionIndex > 0) ? themeSelectionIndex - 1 : themeList.length - 1;
                renderThemeSelection();
            } else if (e === '\u001b[B' || e === '\u001b[C') { // Down/Right
                themeSelectionIndex = (themeSelectionIndex < themeList.length - 1) ? themeSelectionIndex + 1 : 0;
                renderThemeSelection();
            } else if (e === '\r') { // Enter
                applyTheme(themeList[themeSelectionIndex]);
                themeSelectionActive = false;
                term.writeln(`\r\n[SYSTEM]: Tema zmenena na "${themeList[themeSelectionIndex]}".`);
                term.write('\r\n> ');
            } else if (e === 'q' || e === 'Q' || e === '\u001b') { // q/Esc
                themeSelectionActive = false;
                term.writeln('\r\n[SYSTEM]: Zmena temy zrusena.');
                term.write('\r\n> ');
            }
            return;
        }

        // STANDARD MODE
        switch (e) {
            case '\r': // Enter
                if (input.trim().length > 0) {
                    commandHistory.push(input);
                    historyIndex = commandHistory.length;
                }
                handleCommand(input);
                input = '';
                if (!focusActive && !themeSelectionActive) term.write('\r\n> ');
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
        while (input.length > 0) {
            term.write('\b \b');
            input = input.slice(0, -1);
        }
        input = newInput;
        term.write(input);
    }

    // COMMAND LOGIC
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
                totalCompleted++;
                localStorage.setItem('zen_total_completed', totalCompleted);
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
        else if (action === 'focus') {
            // Split args: first part is minutes, optional second part is ID
            const focusArgs = args.split(' ').filter(a => a.length > 0);
            const minutes = parseInt(focusArgs[0]);
            
            if (!isNaN(minutes) && minutes > 0) {
                let taskName = "HLBOKÁ PRÁCA"; // Default fallback
                
                if (focusArgs.length > 1) {
                    // ID was provided: focus 25 3
                    const id = parseInt(focusArgs[1]);
                    const task = tasks.find(t => t.id === id);
                    if (task) {
                        taskName = task.text;
                    } else {
                        term.writeln(`[VAROVANIE]: Uloha s ID ${id} nenajdena. Pouzivam predvoleny text.`);
                    }
                } else {
                    // No ID provided: focus 25 -> Find first unfinished task
                    const firstUnfinished = tasks.find(t => !t.done);
                    if (firstUnfinished) {
                        taskName = firstUnfinished.text;
                    }
                }
                
                startFocus(minutes, taskName);
            } else {
                term.writeln('[CHYBA]: Zadajte pocet minut. (napr. focus 25)');
            }
        }
        else if (action === 'stats') {
            term.writeln('=== STATISTIKA ===');
            term.writeln(`Celkovo splnenych uloh: ${totalCompleted}`);
            term.writeln(`Aktualne v zozname:     ${tasks.length}`);
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
        else if (action === 'clear') {
            term.clear();
        }
        else if (action === 'help') {
            term.writeln('do [text]       - pridat ulohu (mozno oddelit ; pre viacero)');
            term.writeln('list            - zobrazit vsetko');
            term.writeln('done [id]       - splnit ulohu');
            term.writeln('del [id/all]    - vymazat ulohu alebo vsetko');
            term.writeln('undo            - vratit poslednu zmenu');
            term.writeln('focus [min] [id]- spustit casovac sustredenia (volitelne ID ulohy)');
            term.writeln('stats           - zobrazit statistiky');
            term.writeln('theme [nazov]   - zmenit farbu (alebo len "theme" pre menu)');
            term.writeln('clear           - vycistit obrazovku');
        }
        else {
            if (cmd.trim() !== '') {
                term.writeln(`[CHYBA]: Prikaz "${action}" nepoznam. Skuste "help".`);
            }
        }
    }

    // HELPERS
    function applyTheme(themeName) {
        currentTheme = themeName;
        term.options.theme = themes[themeName];
        localStorage.setItem('zen_theme', themeName);
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

    // THEME SELECTION LOGIC
    function startThemeSelection() {
        themeSelectionActive = true;
        themeSelectionIndex = themeList.indexOf(currentTheme);
        if (themeSelectionIndex === -1) themeSelectionIndex = 0;
        term.writeln('=== VYBER TEMY ===');
        term.writeln('Pouzite sipky (HORE/DOLE/VLAVO/VPRAVO) pre vyber, ENTER pre potvrdenie.');
        renderThemeSelection();
    }

    function renderThemeSelection() {
        const line = themeList.map((t, i) => {
            if (i === themeSelectionIndex) return `[ ${t.toUpperCase()} ]`;
            return `  ${t}  `;
        }).join('   ');
        term.write(`\r\x1b[K${line}`);
    }

    // ==========================================
    // FOCUS MODE & MATRIX EFFECT
    // ==========================================

    function startFocus(minutes, taskText) {
        focusActive = true;
        focusTimeLeft = minutes * 60;

        // Hide terminal, show canvas/overlay
        terminalContainer.style.display = 'none';
        matrixCanvas.style.display = 'block';
        focusOverlay.style.display = 'flex';

        // Apply theme color to overlay
        const color = themes[currentTheme].foreground;
        focusOverlay.style.color = color;
        focusTimerEl.style.textShadow = `0 0 20px ${color}`;
        focusTaskEl.style.textShadow = `0 0 10px ${color}`;

        // Set Task Text
        focusTaskEl.innerText = taskText;

        // Start Timer
        updateTimerDisplay();
        focusInterval = setInterval(() => {
            focusTimeLeft--;
            updateTimerDisplay();
            if (focusTimeLeft <= 0) stopFocus(true);
        }, 1000);

        // Start Matrix
        startMatrixEffect();
    }

    function updateTimerDisplay() {
        const min = Math.floor(focusTimeLeft / 60).toString().padStart(2, '0');
        const sec = (focusTimeLeft % 60).toString().padStart(2, '0');
        focusTimerEl.innerText = `${min}:${sec}`;
    }

    function stopFocus(finished = false) {
        focusActive = false;
        clearInterval(focusInterval);
        stopMatrixEffect();

        // Hide canvas/overlay, show terminal
        matrixCanvas.style.display = 'none';
        focusOverlay.style.display = 'none';
        terminalContainer.style.display = 'block';

        // Restore terminal focus
        term.focus();

        term.write('\r\n');
        if (finished) {
            term.writeln('[SYSTEM]: Cas vyprsal. Dobra praca.');
        } else {
            term.writeln('[SYSTEM]: Focus mode preruseny.');
        }
        term.write('\r\n> ');
    }

    // Matrix Logic
    let drops = [];
    const fontSize = 16;
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*\u0020";

    function startMatrixEffect() {
        resizeMatrix();
        // Initial draw loop
        function draw() {
            if (!focusActive) return; 
            
            // Translucent black background to create trail effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

            // Set text color based on theme
            ctx.fillStyle = themes[currentTheme].foreground;
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            requestAnimationFrame(draw);
        }
        draw();
    }

    function stopMatrixEffect() {
        // Nothing specific needed as loop checks focusActive
    }

    function resizeMatrix() {
        matrixCanvas.width = window.innerWidth;
        matrixCanvas.height = window.innerHeight;
        
        const columns = matrixCanvas.width / fontSize;
        drops = [];
        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }
    }
});
