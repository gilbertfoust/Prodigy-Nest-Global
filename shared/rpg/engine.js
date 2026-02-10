// Shared lightweight RPG dialogue engine (used by Town Day and future experiences)

export function normalizeAnswer(s) {
  return (s || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function getTextByLang(entry, langKey) {
  if (!entry) return '';
  const v = entry[langKey];
  if (!v) return '';
  if (typeof v === 'object' && v) return v.t || '';
  return v;
}

export function getRomByLang(entry, langKey) {
  if (!entry) return '';
  const v = entry[langKey];
  if (!v) return '';
  if (typeof v === 'object' && v) return v.r || '';
  return '';
}

export function createRpgEngine({ content, getLangKey, getSettings, onProgress }) {
  const state = {
    sceneId: null,
    stepIndex: 0,
    reputation: 0,
    energy: 100,
    lastResult: null,
  };

  function currentScene() {
    return content.scenes.find((s) => s.id === state.sceneId) || null;
  }
  function currentStep() {
    const scene = currentScene();
    if (!scene) return null;
    return scene.steps[state.stepIndex] || null;
  }

  function start(sceneId) {
    state.sceneId = sceneId;
    state.stepIndex = 0;
    state.lastResult = null;
    emit();
  }

  function emit() {
    if (typeof onProgress === 'function') onProgress({ ...state, step: currentStep() });
  }

  function applySoftPenalty() {
    // soft penalty: reduce energy; never below 0
    state.energy = Math.max(0, state.energy - 5);
  }

  function markCorrect() {
    state.reputation += 1;
    state.lastResult = { ok: true };
  }

  function markWrong(msg) {
    applySoftPenalty();
    state.lastResult = { ok: false, message: msg || 'Not quite.' };
  }

  function nextStep() {
    state.stepIndex += 1;
    state.lastResult = null;
  }

  function chooseOption(optionIndex) {
    const step = currentStep();
    if (!step || !step.task || step.task.type !== 'mc') return;
    const correct = step.task.correctIndex === optionIndex;
    if (correct) {
      markCorrect();
      if (step.next === 'next') nextStep();
    } else {
      markWrong('Wrong choice.');
    }
    emit();
  }

  function submitText(input) {
    const step = currentStep();
    if (!step || !step.task || step.task.type !== 'text') return;
    const langKey = getLangKey();
    const expected = step.task.expected(langKey, getSettings());
    const normIn = normalizeAnswer(input);
    const ok = expected.some((ans) => normalizeAnswer(ans) === normIn);
    if (ok) {
      markCorrect();
      if (step.next === 'next') nextStep();
    } else {
      markWrong('Try again.');
    }
    emit();
  }

  function canAdvance() {
    const scene = currentScene();
    return !!scene && state.stepIndex >= scene.steps.length;
  }

  return {
    state,
    start,
    currentScene,
    currentStep,
    chooseOption,
    submitText,
    canAdvance,
  };
}

