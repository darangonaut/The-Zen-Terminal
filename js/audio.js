// AUDIO ENGINE
import { state } from './state.js';

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

// Lazy initialization of AudioContext
function getAudioContext() {
    if (!audioCtx && AudioContext) {
        try {
            audioCtx = new AudioContext();
        } catch (e) {
            console.warn('AudioContext not available:', e);
            return null;
        }
    }
    return audioCtx;
}

export function playKeySound() {
    if (!state.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = 600 + Math.random() * 200;

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
}

export function playSuccessSound() {
    if (!state.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;

    // Osc 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.1);

    gain1.gain.setValueAtTime(0.1, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(now + 0.5);

    // Osc 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now);

    gain2.gain.setValueAtTime(0.05, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start();
    osc2.stop(now + 0.5);
}

export function toggleSound(args, term) {
    if (args === 'on') {
        state.soundEnabled = true;
        localStorage.setItem('zen_sound', 'true');
        term.writeln('[SYSTEM]: Audio module activated.');
        playSuccessSound();
    } else if (args === 'off') {
        state.soundEnabled = false;
        localStorage.setItem('zen_sound', 'false');
        term.writeln('[SYSTEM]: Audio module deactivated (silent mode).');
    } else {
        term.writeln(`[SYSTEM]: Sound is currently ${state.soundEnabled ? 'ON' : 'OFF'}.`);
        term.writeln('Use "sound on" or "sound off".');
    }
}