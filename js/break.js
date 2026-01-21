// BREAK MODE & BREATHING ANIMATION
import { term } from './terminal.js';
import { state } from './state.js';
import { themes } from './theme.js';
import { playSuccessSound } from './audio.js';
import { notifyBreakComplete } from './notifications.js';

let breakActive = false;
let breakInterval = null;
let breakTimeLeft = 0;

// Breathing Logic
const breathCycle = {
    inhale: 4,
    hold: 4,
    exhale: 4,
    pause: 4
};
let breathState = 'inhale'; // inhale, hold, exhale, pause
let breathTimer = 0;
let animationId = null;

// DOM Elements
let elements = {};
let ctx = null;

export function initBreakModule(domElements) {
    elements = domElements;
    if (elements.matrixCanvas) {
        ctx = elements.matrixCanvas.getContext('2d');
    }
}

export function isBreakActive() {
    return breakActive;
}

export function handleBreakInput(key) {
    if (key === 'q' || key === 'Q' || key === 'Escape') {
        stopBreak();
    }
}

export function startBreak(minutes = 5) {
    breakActive = true;
    breakTimeLeft = minutes * 60;

    // UI Switch (Reuse Focus Overlay elements for simplicity, but change content)
    elements.terminalContainer.style.display = 'none';
    elements.matrixCanvas.style.display = 'block';
    elements.focusOverlay.style.display = 'flex';

    // Styling
    const color = themes[state.currentTheme].foreground;
    elements.focusOverlay.style.color = color;
    elements.focusTimerEl.style.textShadow = `0 0 20px ${color}`;
    elements.focusTaskEl.style.textShadow = `0 0 10px ${color}`;
    
    // Initial Text
    elements.focusTaskEl.innerText = "RELAX & BREATHE";
    updateTimerDisplay();

    // Timers
    breakInterval = setInterval(() => {
        try {
            breakTimeLeft--;
            updateTimerDisplay();
            if (breakTimeLeft <= 0) stopBreak(true);
        } catch (e) {
            console.error('Break timer error:', e);
            stopBreak(false);
        }
    }, 1000);

    startBreathingAnimation();
}

function updateTimerDisplay() {
    const min = Math.floor(breakTimeLeft / 60).toString().padStart(2, '0');
    const sec = (breakTimeLeft % 60).toString().padStart(2, '0');
    elements.focusTimerEl.innerText = `${min}:${sec}`;
}

export function stopBreak(finished = false) {
    breakActive = false;
    clearInterval(breakInterval);
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // Reset UI
    elements.matrixCanvas.style.display = 'none';
    elements.focusOverlay.style.display = 'none';
    elements.terminalContainer.style.display = 'block';

    // Clear canvas
    if (ctx && elements.matrixCanvas) {
        ctx.clearRect(0, 0, elements.matrixCanvas.width, elements.matrixCanvas.height);
    }

    term.focus();
    term.write('\r\n');
    if (finished) {
        playSuccessSound();
        notifyBreakComplete();
        term.writeln('[SYSTEM]: Break over. Ready to focus?');
    } else {
        term.writeln('[SYSTEM]: Break interrupted.');
    }
    term.write(`\r\n${state.prompt}`);
}

// VISUALS
function startBreathingAnimation() {
    if (!ctx) return;
    let startTime = Date.now();

    function draw() {
        if (!breakActive) {
            animationId = null;
            return;
        }

        const now = Date.now();
        const elapsed = (now - startTime) / 1000;

        // Cycle Logic
        const totalCycle = breathCycle.inhale + breathCycle.hold + breathCycle.exhale + breathCycle.pause;
        const currentPos = elapsed % totalCycle;

        let radius = 0;
        let text = "";

        if (currentPos < breathCycle.inhale) {
            breathState = 'inhale';
            const progress = currentPos / breathCycle.inhale;
            radius = 50 + (progress * 100);
            text = "INHALE";
        } else if (currentPos < breathCycle.inhale + breathCycle.hold) {
            breathState = 'hold';
            radius = 150;
            text = "HOLD";
        } else if (currentPos < breathCycle.inhale + breathCycle.hold + breathCycle.exhale) {
            breathState = 'exhale';
            const localPos = currentPos - (breathCycle.inhale + breathCycle.hold);
            const progress = localPos / breathCycle.exhale;
            radius = 150 - (progress * 100);
            text = "EXHALE";
        } else {
            breathState = 'pause';
            radius = 50;
            text = "WAIT";
        }

        // Render
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, elements.matrixCanvas.width, elements.matrixCanvas.height);

        // Draw Circle
        const centerX = elements.matrixCanvas.width / 2;
        const centerY = elements.matrixCanvas.height / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = themes[state.currentTheme].foreground;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Particles inside
        ctx.fillStyle = themes[state.currentTheme].foreground;
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * radius;
            ctx.fillRect(centerX + Math.cos(angle) * r, centerY + Math.sin(angle) * r, 2, 2);
        }

        // Update Overlay Text
        elements.focusTaskEl.innerText = text;

        animationId = requestAnimationFrame(draw);
    }

    animationId = requestAnimationFrame(draw);
}
