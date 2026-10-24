/* ================================================================
   ЗВУК — Web Audio API + управление громкостью
   ================================================================ */

let аудио = null;
let громкость = 0.7; // 0..1

export function инициализироватьАудио() {
    if (аудио) return;
    try {
        аудио = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        аудио = null;
    }
}

export function установитьГромкость(значение) {
    громкость = Math.max(0, Math.min(1, значение));
}

export function получитьГромкость() {
    return громкость;
}

function синтезироватьВыстрел(частота, длительность, громкостьБазовая) {
    if (!аудио) return;
    if (громкость <= 0) return;
    const сейчас = аудио.currentTime;
    const буфер = аудио.createBuffer(1, аудио.sampleRate * длительность, аудио.sampleRate);
    const данные = буфер.getChannelData(0);
    for (let i = 0; i < данные.length; i++) {
        данные[i] = (Math.random() * 2 - 1) * (1 - i / данные.length);
    }
    const источник = аудио.createBufferSource();
    источник.buffer = буфер;
    const фильтр = аудио.createBiquadFilter();
    фильтр.type = 'bandpass';
    фильтр.frequency.value = частота;
    фильтр.Q.value = 1.5;
    const усилок = аудио.createGain();
    усилок.gain.setValueAtTime(громкостьБазовая * громкость, сейчас);
    усилок.gain.exponentialRampToValueAtTime(0.001, сейчас + длительность);
    источник.connect(фильтр);
    фильтр.connect(усилок);
    усилок.connect(аудио.destination);
    источник.start(сейчас);
    источник.stop(сейчас + длительность);
}

export function звукВыстрелаПехоты() {
    if (!аудио) return;
    синтезироватьВыстрел(1800, 0.08, 0.15);
    синтезироватьВыстрел(400, 0.05, 0.1);
}

export function звукВыстрелаСнайпера() {
    if (!аудио) return;
    синтезироватьВыстрел(3000, 0.15, 0.35);
    синтезироватьВыстрел(600, 0.2, 0.25);
}

export function звукВзрываГранаты() {
    if (!аудио) return;
    if (громкость <= 0) return;
    const сейчас = аудио.currentTime;
    const длительность = 0.4;
    const буфер = аудио.createBuffer(1, аудио.sampleRate * длительность, аудио.sampleRate);
    const данные = буфер.getChannelData(0);
    for (let i = 0; i < данные.length; i++) {
        данные[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / данные.length, 2);
    }
    const источник = аудио.createBufferSource();
    источник.buffer = буфер;
    const фильтр = аудио.createBiquadFilter();
    фильтр.type = 'lowpass';
    фильтр.frequency.value = 400;
    const усилок = аудио.createGain();
    усилок.gain.setValueAtTime(0.4 * громкость, сейчас);
    усилок.gain.exponentialRampToValueAtTime(0.001, сейчас + длительность);
    источник.connect(фильтр);
    фильтр.connect(усилок);
    усилок.connect(аудио.destination);
    источник.start(сейчас);
}

export function звукСмертиБойца() {
    if (!аудио) return;
    синтезироватьВыстрел(600, 0.12, 0.06);
}