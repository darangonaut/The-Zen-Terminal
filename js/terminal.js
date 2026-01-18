// TERMINAL INSTANCE SINGLETON
// Toto spristupni terminal pre ostatne moduly

const term = new Terminal({
    cursorBlink: true,
    theme: { background: '#000', foreground: '#00ff00' },
    fontFamily: 'Courier New, monospace',
    fontSize: 14
});

const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);

export { term, fitAddon };