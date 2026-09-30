const characters = {
  white: { label: 'White', avatar: 'assets/imgBotAva.png' },
  asian: { label: 'Asian', avatar: 'assets/imgBotAva1.png' },
  ebony: { label: 'Ebony', avatar: 'assets/imgBotAva2.png' },
  latina: { label: 'Latina', avatar: 'assets/imgBotAva3.png' },
};

const phone = document.querySelector('#phone');
const genderSection = document.querySelector('.gender-choices');
const genderChoices = [...document.querySelectorAll('.gender-choice')];
const genderFrames = [...document.querySelectorAll('.gender-frame')];
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
const exitOverlay = document.querySelector('#exitOverlay');
const closeButton = document.querySelector('#closeButton');
const keepEditing = document.querySelector('#keepEditing');
const toast = document.querySelector('#toast');
const continueButton = document.querySelector('#continueButton');
let gender = 'female';
let selected = 'white';
let screen = 'gender';
let age = 18;
let toastTimer;
let currentVideo = videos[0];
let videoSwitchRun = 0;
let pauseOutgoingTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function updateProgress() {
  const step = screen === 'gender' ? 1 : screen === 'ethnicity' ? 2 : confirmation.hidden ? 3 : 4;
  phone.style.setProperty('--builder-progress', `${step * 12.5}%`);
  progressBar.setAttribute('aria-valuenow', String(step));
}

function selectGender(key) {
  if (key !== 'female' && key !== 'male') return;
  gender = key;
  genderChoices.forEach(button => {
    const active = button.dataset.gender === key;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  genderFrames.forEach(frame => frame.classList.toggle('active', frame.dataset.gender === key));
  continueButton.disabled = screen === 'gender' && key === 'male';
  continueButton.setAttribute('aria-label', continueButton.disabled ? 'Continue unavailable for male character' : 'Continue');
}

function updateChoiceState() {
  choices.forEach(button => {
    const active = button.dataset.choice === selected;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

async function switchVideo(key) {
  const next = videos.find(video => video.dataset.ethnicity === key);
  const run = ++videoSwitchRun;
  clearTimeout(pauseOutgoingTimer);

  // Keep the visible clip playing while the requested one buffers.
  videos.forEach(video => {
    if (video !== currentVideo && video !== next) {
      video.classList.remove('active');
      video.pause();
    }
  });

  if (next === currentVideo) {
    if (screen === 'ethnicity' && !document.hidden) next.play().catch(() => {});
    return;
  }

  try {
    await next.play();
  } catch {
    if (run !== videoSwitchRun || screen !== 'ethnicity') return;
    selected = currentVideo.dataset.ethnicity;
    updateChoiceState();
    showToast('Video could not play');
    return;
  }

  if (run !== videoSwitchRun || screen !== 'ethnicity' || document.hidden) {
    next.pause();
    return;
  }

  const outgoing = currentVideo;
  next.classList.add('active');
  outgoing.classList.remove('active');
  currentVideo = next;
  pauseOutgoingTimer = setTimeout(() => {
    if (outgoing !== currentVideo) outgoing.pause();
  }, 700);
}

function selectCharacter(key) {
  if (!characters[key]) return;
  selected = key;
  updateChoiceState();
  if (screen === 'ethnicity') switchVideo(key);
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

function setScreen(next) {
  if (screen === next) return;
  screen = next;
  phone.classList.toggle('gender-mode', next === 'gender');
  phone.classList.toggle('age-mode', next === 'age');
  const title = next === 'gender' ? 'Select Gender' : next === 'age' ? 'Select Age' : 'Select Ethnicity';
  phone.setAttribute('aria-label', `${title} prototype`);
  document.querySelector('#headerTitle').textContent = title;
  genderSection.setAttribute('aria-hidden', String(next !== 'gender'));
  genderSection.inert = next !== 'gender';
  ageSlider.setAttribute('aria-hidden', String(next !== 'age'));
  ageSlider.inert = next !== 'age';
  ageRange.disabled = next !== 'age';
  choiceSection.setAttribute('aria-hidden', String(next !== 'ethnicity'));
  choiceSection.inert = next !== 'ethnicity';
  continueButton.disabled = next === 'gender' && gender === 'male';
  continueButton.setAttribute('aria-label', continueButton.disabled ? 'Continue unavailable for male character' : 'Continue');
  document.querySelector('#backButton').setAttribute('aria-label', next === 'age' ? 'Back to ethnicity' : next === 'ethnicity' ? 'Back to gender' : 'Reset gender selection');
  confirmation.hidden = true;
  updateProgress();
  if (next !== 'ethnicity') {
    videoSwitchRun += 1;
    clearTimeout(pauseOutgoingTimer);
    videos.forEach(video => video.pause());
    if (next === 'age') setAge(0);
  } else {
    switchVideo(selected);
  }
}

genderChoices.forEach(button => button.addEventListener('click', () => selectGender(button.dataset.gender)));
choices.forEach(button => button.addEventListener('click', () => selectCharacter(button.dataset.choice)));
ageMarks.forEach(mark => mark.addEventListener('click', () => {
  setAge(Number(mark.dataset.index));
}));
ageRange.addEventListener('input', () => {
  setAge(Number(ageRange.value));
});

continueButton.addEventListener('click', () => {
  if (screen === 'gender') {
    if (gender === 'female') setScreen('ethnicity');
    return;
  }
  if (screen === 'ethnicity') {
    setScreen('age');
    return;
  }
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
  else if (screen === 'ethnicity') setScreen('gender');
  else selectGender('female');
}

document.querySelector('#backButton').addEventListener('click', goBack);
closeButton.addEventListener('click', () => {
  if (exitOverlay.open) return;
  if (screen === 'ethnicity') {
    videoSwitchRun += 1;
    clearTimeout(pauseOutgoingTimer);
    videos.forEach(video => video.pause());
  }
  exitOverlay.showModal();
  keepEditing.focus();
});
keepEditing.addEventListener('click', () => {
  exitOverlay.close();
  closeButton.focus();
  if (screen === 'ethnicity' && !document.hidden) switchVideo(selected);
});
exitOverlay.addEventListener('cancel', event => event.preventDefault());
document.addEventListener('keydown', event => {
  if (exitOverlay.open) return;
  if (event.key === 'Escape') { confirmation.hidden = true; updateProgress(); }
  if (screen === 'ethnicity' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
    if (!confirmation.hidden) return;
    const keys = Object.keys(characters);
    const index = keys.indexOf(selected);
    selectCharacter(keys[(index + (event.key === 'ArrowRight' ? 1 : -1) + keys.length) % keys.length]);
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    videoSwitchRun += 1;
    clearTimeout(pauseOutgoingTimer);
    videos.forEach(video => video.pause());
  } else if (screen === 'ethnicity' && !exitOverlay.open) {
    switchVideo(selected);
  }
});
setAge(0);
selectGender('female');
updateProgress();
videos.forEach(video => video.pause());
