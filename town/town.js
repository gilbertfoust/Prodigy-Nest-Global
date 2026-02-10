import { createRpgEngine, getTextByLang, getRomByLang } from '../shared/rpg/engine.js';
import { townDayContent, seedPhrases } from '../shared/rpg/town_day_content.js';

// Shared app state (from shared/core.js)
const langDisp = document.getElementById('langDisp');
const repDisp = document.getElementById('repDisp');
const energyDisp = document.getElementById('energyDisp');
const sceneBadge = document.getElementById('sceneBadge');

const npcName = document.getElementById('npcName');
const npcLine = document.getElementById('npcLine');
const taskTitle = document.getElementById('taskTitle');

const mcArea = document.getElementById('mcArea');
const mcOptions = document.getElementById('mcOptions');
const typeArea = document.getElementById('typeArea');
const typeInput = document.getElementById('typeInput');
const typeSubmit = document.getElementById('typeSubmit');
const resultBox = document.getElementById('resultBox');

const answerMode = document.getElementById('answerMode');
const showRoman = document.getElementById('showRoman');
const showEnglish = document.getElementById('showEnglish');
const scenePick = document.getElementById('scenePick');
const restartBtn = document.getElementById('restartBtn');

function getLangKey() {
  return (typeof app !== 'undefined' && app.lang) ? app.lang : 'es';
}

function getSettings() {
  return {
    answerMode: answerMode.value,
    showRoman: showRoman.checked,
    showEnglish: showEnglish.checked,
  };
}

// Populate scene picker
scenePick.innerHTML = townDayContent.scenes.map((s) => `<option value="${s.id}">${s.title}</option>`).join('');

function renderStatus(engineState) {
  const langKey = getLangKey();
  const langMeta = (typeof LANGS !== 'undefined') ? LANGS.find((l) => l.key === langKey) : null;
  langDisp.textContent = langMeta ? `${langMeta.flag} ${langMeta.label}` : langKey;

  repDisp.textContent = String(engineState.reputation);
  energyDisp.textContent = String(engineState.energy);

  const scene = engine.currentScene();
  sceneBadge.textContent = scene ? scene.title : 'Scene';
}

function renderStep(engineState) {
  const langKey = getLangKey();
  const settings = getSettings();
  const step = engine.currentStep();

  resultBox.style.display = 'none';
  resultBox.classList.remove('ok', 'bad');

  if (!step) {
    npcName.textContent = '';
    npcLine.textContent = 'Scene complete. Choose another scene from the right.';
    taskTitle.textContent = '';
    mcArea.style.display = 'none';
    typeArea.style.display = 'none';
    return;
  }

  npcName.textContent = step.npc || '';

  const seed = (step.id.startsWith('gm')) ? seedPhrases.goodMorning
    : (step.id.startsWith('gn')) ? seedPhrases.goodNight
    : null;

  const targetText = seed ? getTextByLang(seed, langKey) : '';
  const roman = seed ? getRomByLang(seed, langKey) : '';

  const english = seed ? seed.en : '';

  const bits = [];
  bits.push(step.line);
  if (settings.showEnglish && english) bits.push(`EN: ${english}`);
  if (targetText) bits.push(`Target: ${targetText}`);
  if (settings.showRoman && roman) bits.push(`Romanization: ${roman}`);
  npcLine.textContent = bits.join('  •  ');

  taskTitle.textContent = settings.answerMode === 'typing'
    ? 'Type your reply'
    : settings.answerMode === 'both'
      ? 'Choose or type your reply'
      : 'Choose the best reply';

  // MC
  if (step.task.type === 'mc' && (settings.answerMode === 'mc' || settings.answerMode === 'both')) {
    mcArea.style.display = '';
    const opts = step.task.options(langKey);
    mcOptions.innerHTML = '';
    opts.forEach((t, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'optBtn';
      b.textContent = t;
      b.addEventListener('click', () => engine.chooseOption(idx));
      mcOptions.appendChild(b);
    });
  } else {
    mcArea.style.display = 'none';
  }

  // Typing
  if (step.task.type === 'text' && (settings.answerMode === 'typing' || settings.answerMode === 'both')) {
    typeArea.style.display = '';
  } else if (step.task.type === 'mc' && settings.answerMode === 'both') {
    // allow typing even for MC steps as extra difficulty practice
    typeArea.style.display = '';
  } else {
    typeArea.style.display = 'none';
  }
}

function renderResult(engineState) {
  if (!engineState.lastResult) return;
  resultBox.style.display = '';
  if (engineState.lastResult.ok) {
    resultBox.classList.add('ok');
    resultBox.textContent = 'Correct. +1 reputation';
  } else {
    resultBox.classList.add('bad');
    resultBox.textContent = `${engineState.lastResult.message}  (-5 energy)`;
  }
}

const engine = createRpgEngine({
  content: townDayContent,
  getLangKey,
  getSettings,
  onProgress: (engineState) => {
    renderStatus(engineState);
    renderStep(engineState);
    renderResult(engineState);
  },
});

function startSelectedScene() {
  engine.start(scenePick.value);
}

scenePick.addEventListener('change', startSelectedScene);
restartBtn.addEventListener('click', startSelectedScene);

function submitTyping() {
  const v = typeInput.value;
  typeInput.value = '';
  engine.submitText(v);
}

typeSubmit.addEventListener('click', submitTyping);
typeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitTyping();
});

// If user changes difficulty toggles, rerender
[answerMode, showRoman, showEnglish].forEach((el) => el.addEventListener('change', () => engine.state && engine.start(engine.state.sceneId || scenePick.value)));

// Start
startSelectedScene();

