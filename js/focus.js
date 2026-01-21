// FOCUS MODE & MATRIX
import { term } from './terminal.js';
import { state } from './state.js';
import { themes } from './theme.js';
import { playSuccessSound } from './audio.js';
import { notifyFocusComplete } from './notifications.js';

let focusActive = false;
let focusInterval = null;
let focusTimeLeft = 0;
let currentTaskName = '';

// DOM Elements placeholders
let elements = {};
let ctx = null;

export function initFocusModule(domElements) {
    elements = domElements;
    ctx = elements.matrixCanvas.getContext('2d');
}

export function isFocusActive() {
    return focusActive;
}

export function handleFocusInput(key) {
    if (key === 'q' || key === 'Q' || key === 'Escape') {
        stopFocus();
    }
}

export function startFocus(minutes, taskText) {
    focusActive = true;
    focusTimeLeft = minutes * 60;
    currentTaskName = taskText;

    // UI Switch
    elements.terminalContainer.style.display = 'none';
    elements.matrixCanvas.style.display = 'block';
    elements.focusOverlay.style.display = 'flex';

    // Apply colors
    const color = themes[state.currentTheme].foreground;
    elements.focusOverlay.style.color = color;
    elements.focusTimerEl.style.textShadow = `0 0 20px ${color}`;
    elements.focusTaskEl.style.textShadow = `0 0 10px ${color}`;
    elements.focusTaskEl.innerText = taskText;

    updateTimerDisplay();
    focusInterval = setInterval(() => {
        focusTimeLeft--;
        updateTimerDisplay();
        if (focusTimeLeft <= 0) stopFocus(true);
    }, 1000);

    startMatrixEffect();
}

function updateTimerDisplay() {
    const min = Math.floor(focusTimeLeft / 60).toString().padStart(2, '0');
    const sec = (focusTimeLeft % 60).toString().padStart(2, '0');
    elements.focusTimerEl.innerText = `${min}:${sec}`;
}

export function stopFocus(finished = false) {
    focusActive = false;
    clearInterval(focusInterval);
    stopMatrixEffect();

    elements.matrixCanvas.style.display = 'none';
    elements.focusOverlay.style.display = 'none';
    elements.terminalContainer.style.display = 'block';
    term.focus();

    term.write('\r\n');
    if (finished) {
        playSuccessSound();
        notifyFocusComplete(currentTaskName);
        term.writeln('[SYSTEM]: Cas vyprsal. Dobra praca.');
    } else {
        term.writeln('[SYSTEM]: Focus mode interrupted.');
    }
    term.write(`\r\n${state.prompt}`);
}

// MATRIX LOGIC
let drops = [];
let lastFrameTime = 0;
const frameDelay = 50; 
const fontSize = 16;
const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*";
let animationId = null;

function startMatrixEffect() {
    resizeMatrix();
    lastFrameTime = 0;
    
    function draw(currentTime) {
        if (!focusActive) return;
        animationId = requestAnimationFrame(draw);

        if (currentTime - lastFrameTime < frameDelay) return;
        lastFrameTime = currentTime;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, elements.matrixCanvas.width, elements.matrixCanvas.height);

        ctx.fillStyle = themes[state.currentTheme].foreground;
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > elements.matrixCanvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    animationId = requestAnimationFrame(draw);
}

function stopMatrixEffect() {
    if (animationId) cancelAnimationFrame(animationId);
}

export function resizeMatrix() {
    if (!elements.matrixCanvas) return;
    elements.matrixCanvas.width = window.innerWidth;
    elements.matrixCanvas.height = window.innerHeight;
    const columns = elements.matrixCanvas.width / fontSize;
    drops = [];
    for (let x = 0; x < columns; x++) drops[x] = 1;
}
