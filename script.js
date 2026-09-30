const characters = {
  white: { label: 'White', avatar: 'assets/imgBotAva.png' },
  asian: { label: 'Asian', avatar: 'assets/imgBotAva1.png' },
  ebony: { label: 'Ebony', avatar: 'assets/imgBotAva2.png' },
  latina: { label: 'Latina', avatar: 'assets/imgBotAva3.png' },
};

const phone = document.querySelector('#phone');
const choiceSection = document.querySelector('.choices');
const choices = [...document.querySelectorAll('.choice')];
const videos = [...document.querySelectorAll('.hero-video')];
const ageSlider = document.querySelector('#ageSlider');
const ageRange = document.querySelector('#ageRange');
const ageValue = document.querySelector('#ageValue');
const ageFrames = [...document.querySelectorAll('.age-frame')];
const ageStops = ageFrames.map(frame => Number(frame.dataset.age));
const ageMarks = [...document.querySelectorAll('.age-mark')];
const progressBar = document.querySelector('.progress');
const confirmation = document.querySelector('#confirmation');
const menu = document.querySelector('#menu');
const moreButton = document.querySelector('#moreButton');
const toast = document.querySelector('#toast');
let selected = 'white';
let screen = 'ethnicity';
let age = 18;
let ageAnimation = null;
let ageAnimationRun = 0;
let toastTimer;

function sizePhone() {
  const scale = Math.min(1, window.innerWidth / 402, window.innerHeight / 874);
  phone.style.setProperty('--phone-scale', scale);
  phone.style.setProperty('--phone-top', `${Math.max(0, (window.innerHeight - 874 * scale) / 2)}px`);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function closeMenu() {
  menu.hidden = true;
  moreButton.setAttribute('aria-expanded', 'false');
}

function updateProgress() {
  const step = screen === 'ethnicity' ? 1 : confirmation.hidden ? 2 : 3;
  phone.style.setProperty('--builder-progress', `${step * 12.5}%`);
  progressBar.setAttribute('aria-valuenow', String(step));
}

function selectCharacter(key) {
  if (!characters[key]) return;
  selected = key;
  choices.forEach(button => {
    const active = button.dataset.choice === key;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  videos.forEach(video => {
    const active = video.dataset.ethnicity === key;
    video.classList.toggle('active', active);
    if (active) video.play().catch(() => {});
  });
  closeMenu();
}

function setAge(index) {
  const selectedIndex = Math.max(0, Math.min(ageStops.length - 1, Math.round(index)));
  const progress = selectedIndex / (ageStops.length - 1);
  age = ageStops[selectedIndex];
  ageRange.value = String(selectedIndex);
  ageRange.setAttribute('aria-valuetext', `${age} years`);
  ageValue.textContent = `${age}s`;
  ageSlider.style.setProperty('--age-thumb', `${progress * 212}px`);
  ageSlider.style.setProperty('--age-fill', `${25 + progress * 212}px`);
  ageSlider.style.setProperty('--age-tooltip', `${25 + progress * 212}px`);
  ageFrames.forEach((frame, frameIndex) => { frame.style.opacity = String(frameIndex === selectedIndex ? 1 : 0); });
  ageMarks.forEach((mark, markIndex) => mark.setAttribute('aria-pressed', String(markIndex === selectedIndex)));
}

function stopAgeAnimation() {
  ageAnimationRun += 1;
  if (ageAnimation !== null) cancelAnimationFrame(ageAnimation);
  ageAnimation = null;
}

function animateAgeIntro() {
  stopAgeAnimation();
  const run = ageAnimationRun;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setAge(3);
    return;
  }
  setAge(0);
  let start;
  const duration = 1450;
  function frame(time) {
    if (run !== ageAnimationRun) return;
    if (start === undefined) start = time;
    const t = Math.min(1, (time - start) / duration);
    const eased = t * t * (3 - 2 * t);
    setAge(Math.min(3, Math.floor(eased * 4)));
    ageAnimation = t < 1 ? requestAnimationFrame(frame) : null;
  }
  ageAnimation = requestAnimationFrame(frame);
}

function setScreen(next) {
  if (screen === next) return;
  screen = next;
  phone.classList.toggle('age-mode', next === 'age');
  phone.setAttribute('aria-label', next === 'age' ? 'Select Age prototype' : 'Select Ethnicity prototype');
  document.querySelector('#headerTitle').textContent = next === 'age' ? 'Select Age' : 'Select Ethnicity';
  ageSlider.setAttribute('aria-hidden', String(next !== 'age'));
  ageSlider.inert = next !== 'age';
  ageRange.disabled = next !== 'age';
  choiceSection.inert = next === 'age';
  document.querySelector('#backButton').setAttribute('aria-label', next === 'age' ? 'Back to ethnicity' : 'Back to first choice');
  document.querySelector('#reloadButton').setAttribute('aria-label', next === 'age' ? 'Replay age transition' : 'Replay video');
  document.querySelector('#replayMenuButton').textContent = next === 'age' ? 'Replay age transition' : 'Replay video';
  confirmation.hidden = true;
  updateProgress();
  closeMenu();
  if (next === 'age') {
    videos.forEach(video => video.pause());
    stopAgeAnimation();
    setAge(0);
  } else {
    stopAgeAnimation();
    videos.forEach(video => video.play().catch(() => {}));
  }
}

function replay() {
  if (screen === 'age') {
    animateAgeIntro();
  } else {
    const video = videos.find(item => item.dataset.ethnicity === selected);
    video.currentTime = 0;
    video.play().catch(() => {});
    showToast('Video restarted');
  }
  closeMenu();
}

choices.forEach(button => button.addEventListener('click', () => selectCharacter(button.dataset.choice)));
ageMarks.forEach(mark => mark.addEventListener('click', () => {
  stopAgeAnimation();
  setAge(Number(mark.dataset.index));
}));
ageRange.addEventListener('pointerdown', stopAgeAnimation);
ageRange.addEventListener('keydown', stopAgeAnimation);
ageRange.addEventListener('input', () => {
  stopAgeAnimation();
  setAge(Number(ageRange.value));
});

document.querySelector('#continueButton').addEventListener('click', () => {
  if (screen === 'ethnicity') {
    setScreen('age');
    return;
  }
  stopAgeAnimation();
  document.querySelector('#confirmationEyebrow').textContent = 'Character ready';
  document.querySelector('#confirmationTitle').textContent = `${characters[selected].label} · ${age}`;
  document.querySelector('#confirmationDescription').textContent = 'Your character and age have been selected.';
  document.querySelector('#confirmationImage').src = characters[selected].avatar;
  confirmation.hidden = false;
  updateProgress();
  document.querySelector('#chooseAgain').focus();
});

document.querySelector('#chooseAgain').addEventListener('click', () => {
  confirmation.hidden = true;
  updateProgress();
  ageRange.focus();
});
confirmation.addEventListener('click', event => {
  if (event.target === confirmation) {
    confirmation.hidden = true;
    updateProgress();
  }
});

function goBack() {
  if (screen === 'age') setScreen('ethnicity');
  else { selectCharacter('white'); showToast('Back to first choice'); }
}

document.querySelector('#backButton').addEventListener('click', goBack);
document.querySelector('#browserBack').addEventListener('click', goBack);
document.querySelector('#closeButton').addEventListener('click', () => {
  if (screen === 'age') setScreen('ethnicity');
  else { selectCharacter('white'); showToast('Selection reset'); }
});
document.querySelector('#reloadButton').addEventListener('click', replay);
document.querySelector('#replayMenuButton').addEventListener('click', replay);
document.querySelector('#resetMenuButton').addEventListener('click', () => {
  if (screen === 'age') setScreen('ethnicity');
  selectCharacter('white');
  showToast('Selection reset');
});
moreButton.addEventListener('click', () => {
  menu.hidden = !menu.hidden;
  moreButton.setAttribute('aria-expanded', String(!menu.hidden));
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { confirmation.hidden = true; updateProgress(); closeMenu(); }
  if (screen === 'ethnicity' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
    if (!confirmation.hidden) return;
    const keys = Object.keys(characters);
    const index = keys.indexOf(selected);
    selectCharacter(keys[(index + (event.key === 'ArrowRight' ? 1 : -1) + keys.length) % keys.length]);
  }
});
document.addEventListener('click', event => {
  if (!menu.hidden && !menu.contains(event.target) && event.target !== moreButton) closeMenu();
});
window.addEventListener('resize', sizePhone);
sizePhone();
setAge(0);
updateProgress();
videos.forEach(video => video.play().catch(() => {}));
