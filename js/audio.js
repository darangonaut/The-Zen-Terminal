// AUDIO ENGINE
import { state } from './state.js';

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

export function playKeySound() {
    if (!state.soundEnabled) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = 600 + Math.random() * 200; 
    
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

export function playSuccessSound() {
    if (!state.soundEnabled) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    
    // Osc 1
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); 
    osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.1);
    
    gain1.gain.setValueAtTime(0.1, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(now + 0.5);

    // Osc 2
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now); 
    
    gain2.gain.setValueAtTime(0.05, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start();
    osc2.stop(now + 0.5);
}

export function toggleSound(args, term) {
    if (args === 'on') {
        state.soundEnabled = true;
        localStorage.setItem('zen_sound', 'true');
        term.writeln('[SYSTEM]: Audio modul aktivovany.');
        playSuccessSound();
    } else if (args === 'off') {
        state.soundEnabled = false;
        localStorage.setItem('zen_sound', 'false');
        term.writeln('[SYSTEM]: Audio modul deaktivovany (tichy rezim).');
    } else {
        term.writeln(`[SYSTEM]: Zvuk je aktualne ${state.soundEnabled ? 'ZAPNUTY' : 'VYPNUTY'}.`);
        term.writeln('Pouzite "sound on" alebo "sound off".');
    }
}