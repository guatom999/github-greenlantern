// This file is embedded into preview.html, so the viewer works offline.
const LOOP_DURATION_SECONDS = 16;

const viewer = requireElement('viewer', HTMLDivElement);
const timeSlider = requireElement('time', HTMLInputElement);
const clock = requireElement('clock', HTMLOutputElement);
const playButton = requireElement('play', HTMLButtonElement);
const themeSelect = requireElement('theme', HTMLSelectElement);
const phaseLabels = [...document.querySelectorAll<HTMLElement>('[data-start]')];
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let isPlaying = !prefersReducedMotion;
let currentSeconds = 0;
let previousTimestamp = performance.now();

function requireElement<T extends HTMLElement>(id: string, elementType: { new(): T }): T {
  const element = document.getElementById(id);
  if (!(element instanceof elementType)) {
    throw new Error(`Missing or invalid preview element: ${id}`);
  }
  return element;
}

function syncSvgAnimations(): void {
  const animationTimeMs = (currentSeconds % LOOP_DURATION_SECONDS) * 1000;

  for (const animation of viewer.getAnimations({ subtree: true })) {
    // A single clock drives every cell and both theme variants.
    animation.pause();
    animation.currentTime = animationTimeMs;
  }
}

function highlightCurrentPhase(): void {
  for (const [index, phase] of phaseLabels.entries()) {
    const startTime = Number(phase.dataset.start);
    const nextPhase = phaseLabels[index + 1];
    const beforeNextPhase = !nextPhase || currentSeconds < Number(nextPhase.dataset.start);
    const isActive = currentSeconds >= startTime && beforeNextPhase;

    phase.classList.toggle('active', isActive);
  }
}

function updatePlayer(): void {
  syncSvgAnimations();
  timeSlider.value = String(currentSeconds);
  clock.textContent = currentSeconds.toFixed(2) + ' s';
  highlightCurrentPhase();
}

timeSlider.addEventListener('input', () => {
  isPlaying = false;
  currentSeconds = Number(timeSlider.value);
  playButton.textContent = 'Play';
  updatePlayer();
});

playButton.addEventListener('click', () => {
  isPlaying = !isPlaying;
  previousTimestamp = performance.now();
  playButton.textContent = isPlaying ? 'Pause' : 'Play';
});

themeSelect.addEventListener('change', () => {
  for (const variant of viewer.querySelectorAll<HTMLElement>('.variant')) {
    variant.hidden = variant.dataset.theme !== themeSelect.value;
  }

  requestAnimationFrame(updatePlayer);
});

if (prefersReducedMotion) {
  requireElement('motion', HTMLParagraphElement).hidden = false;
  playButton.disabled = true;
  timeSlider.disabled = true;
  playButton.textContent = 'Still';
}

function tick(timestamp: number): void {
  if (isPlaying) {
    const elapsedSeconds = (timestamp - previousTimestamp) / 1000;
    currentSeconds = (currentSeconds + elapsedSeconds) % LOOP_DURATION_SECONDS;
  }

  previousTimestamp = timestamp;
  updatePlayer();
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
