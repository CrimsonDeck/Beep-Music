const notesContainer = document.querySelector('.notes-container');
const gridResolutionSelect = document.getElementById('grid-resolution');
const playButton = document.getElementById('play-button');
const stopButton = document.getElementById('stop-button');
const waveformSelect = document.getElementById('waveform');
const attackControl = document.getElementById('attack');
const decayControl = document.getElementById('decay');
const sustainControl = document.getElementById('sustain');
const releaseControl = document.getElementById('release');
const exportButton = document.getElementById('export-button');

let gridResolution = parseInt(gridResolutionSelect.value);
let notes = []; // Array to store note data { start: timeStep, duration: steps, pitch: midiNote }
let audioContext;
let isPlaying = false;

// Basic frequency mapping (you'd need a more comprehensive one)
const noteFrequencies = {
    60: 261.63, // C4
    62: 293.66, // D4
    64: 329.63, // E4
    65: 349.23, // F4
    67: 392.00, // G4
    69: 440.00, // A4
    71: 493.88, // B4
};

function createGrid() {
    notesContainer.innerHTML = '';
    notesContainer.style.gridTemplateColumns = `repeat(${32 * (16 / gridResolution)}, 30px)`; // Adjust grid width

    for (let i = 0; i < 128 * (16 / gridResolution); i++) { // Example: 128 time steps
        const cell = document.createElement('div');
        cell.classList.add('grid-cell');
        cell.dataset.timeStep = i;
        notesContainer.appendChild(cell);

        cell.addEventListener('click', () => {
            // Basic note creation on click
            const existingNote = notes.find(note => note.start === i && note.pitch === 60); // Example pitch
            if (!existingNote) {
                const newNoteElement = document.createElement('div');
                newNoteElement.classList.add('note');
                newNoteElement.style.gridColumnStart = i + 1;
                newNoteElement.style.gridRowStart = 60 - 47; // Example row for C4
                newNoteElement.style.gridRowEnd = 60 - 46;
                newNoteElement.dataset.start = i;
                newNoteElement.dataset.duration = 2 * (16 / gridResolution); // Example duration
                newNoteElement.dataset.pitch = 60;
                notesContainer.appendChild(newNoteElement);
                notes.push({ start: i, duration: 2 * (16 / gridResolution), pitch: 60 });

                // Basic dragging to resize (very rudimentary)
                let isResizing = false;
                let startX;

                newNoteElement.addEventListener('mousedown', (e) => {
                    isResizing = true;
                    startX = e.clientX;
                    e.stopPropagation(); // Prevent grid click
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isResizing) return;
                    const moveX = e.clientX - startX;
                    const steps = Math.round(moveX / 30); // Approximate steps
                    newNoteElement.style.width = `${parseInt(getComputedStyle(newNoteElement).width) + steps * 30}px`;
                    newNoteElement.dataset.duration = Math.max(1, parseInt(newNoteElement.dataset.duration) + steps);
                });

                document.addEventListener('mouseup', () => {
                    if (isResizing) {
                        isResizing = false;
                        const updatedNoteIndex = notes.findIndex(n => n.start === parseInt(newNoteElement.dataset.start) && parseInt(n.pitch) === parseInt(newNoteElement.dataset.pitch));
                        if (updatedNoteIndex !== -1) {
                            notes[updatedNoteIndex].duration = parseInt(newNoteElement.dataset.duration);
                        }
                    }
                });
            }
        });
    }
}

gridResolutionSelect.addEventListener('change', () => {
    gridResolution = parseInt(gridResolutionSelect.value);
    createGrid();
});

function playNote(startTime, duration, frequency, waveform, attack, decay, sustain, release) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = waveform;
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(1, startTime + attack);
    gainNode.gain.exponentialRampToValueAtTime(sustain, startTime + attack + decay);
    gainNode.gain.setValueAtTime(sustain, startTime + attack + decay + duration);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + attack + decay + duration + release);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + attack + decay + duration + release);
}

playButton.addEventListener('click', () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (isPlaying) return;
    isPlaying = true;

    const startTime = audioContext.currentTime;
    const secondsPerStep = 0.25 * (gridResolution / 16); // Adjust tempo based on resolution

    notes.forEach(note => {
        const noteStartTime = startTime + note.start * secondsPerStep;
        const noteDuration = note.duration * secondsPerStep;
        const frequency = noteFrequencies[note.pitch] || 440; // Default to A4 if pitch not found

        playNote(noteStartTime, noteDuration, frequency, waveformSelect.value,
                 parseFloat(attackControl.value), parseFloat(decayControl.value),
                 parseFloat(sustainControl.value), parseFloat(releaseControl.value));
    });

    // Stop playback after the sequence (very basic)
    setTimeout(() => {
        isPlaying = false;
    }, (notes.reduce((max, note) => Math.max(max, note.start + note.duration), 0) + 2) * secondsPerStep * 1000);
});

stopButton.addEventListener('click', () => {
    if (audioContext) {
        audioContext.close().then(() => {
            audioContext = null;
            isPlaying = false;
        });
    }
});

exportButton.addEventListener('click', () => {
    alert("MP3 export functionality is not implemented in this basic example.");
    // Implementing MP3 export in the browser is complex and typically requires
    // using a dedicated JavaScript library for audio encoding (e.g., LAME.js, which
    // often involves Web Workers and can be resource-intensive).
});

// Initial grid creation
createGrid();
