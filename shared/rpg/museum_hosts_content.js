// Museum host dialogues for each heavenly gate.
// Each host gives:
// - a language-learning tip
// - a required riddle to unlock the gate (MC + typing supported by UI)

function host({ name, gate, intro, tip, riddle }) {
  return {
    name,
    gate,
    tip,
    riddle,
    messages: [
      {
        text: `${intro}\n\nTip: ${tip}`,
        options: [
          { text: 'Solve the riddle to unlock this gate.', action: 'startRiddle', gate },
          { text: 'Close', action: 'close' },
        ],
      },
      {
        text: `Riddle:\n${riddle.prompt}`,
        options: [
          { text: 'Answer now (MC or typing).', action: 'startRiddle', gate },
          { text: 'Back', next: 0 },
        ],
      },
    ],
  };
}

export const museumHostDialogues = {
  host_training: host({
    name: 'Museum Host (Training Grounds)',
    gate: 'training',
    intro:
      'Welcome to the Training Grounds — the source-of-truth library for phrases, verbs, alphabets, numbers, and kanji tools.',
    tip:
      'Don’t memorize randomly. Build a reference base, then immediately use it in lived scenarios. Reference → usage → review.',
    riddle: {
      prompt: 'I am the wing where you look things up, compare, and study the source data. What wing am I?',
      choices: ['Training Grounds', 'Town Day', 'Shooter Wing', 'Heaven Universe'],
      correctIndex: 0,
      acceptedAnswers: ['training', 'training grounds', 'the training grounds'],
    },
  }),

  host_town: host({
    name: 'Museum Host (Town Day)',
    gate: 'town',
    intro:
      'Beyond this gate is Town Day — a full-day sandbox where you progress by communicating correctly with people.',
    tip:
      'Use high-frequency words in many contexts. Repetition across situations beats one-time memorization.',
    riddle: {
      prompt: 'What should you learn first to unlock the most everyday conversations fast?',
      choices: ['Rare words', 'High-frequency words', 'Only grammar rules', 'Only slang'],
      correctIndex: 1,
      acceptedAnswers: ['high frequency', 'high-frequency words', 'common words', 'most common words', 'frequency'],
    },
  }),

  host_game: host({
    name: 'Museum Host (Shooter Wing)',
    gate: 'game',
    intro:
      'This gate leads to the Shooter Wing — fast reflex training for vocabulary recall.',
    tip:
      'Speed comes from retrieval practice: pulling words out of your brain, not staring at them.',
    riddle: {
      prompt: 'What is the study technique where you strengthen memory by trying to recall from scratch?',
      choices: ['Retrieval practice', 'Highlighting', 'Rereading', 'Copying notes'],
      correctIndex: 0,
      acceptedAnswers: ['retrieval practice', 'active recall', 'recall'],
    },
  }),

  host_reader: host({
    name: 'Museum Host (Reader Wing)',
    gate: 'reader',
    intro:
      'This gate opens the Reader Wing — deep reading with lookup, notes, and comprehension practice.',
    tip:
      'Aim for comprehensible input: material you mostly understand, with a small stretch. That’s where growth happens.',
    riddle: {
      prompt: 'What do we call input that is mostly understandable but slightly challenging?',
      choices: ['Comprehensible input', 'Random memorization', 'Noise', 'Only translation drills'],
      correctIndex: 0,
      acceptedAnswers: ['comprehensible input', 'input'],
    },
  }),

  host_speak: host({
    name: 'Museum Host (Speaking Lab)',
    gate: 'speak',
    intro:
      'This gate opens the Speaking Lab — pronunciation, repetition, and speech confidence.',
    tip:
      'Start with clarity, not speed. Speak slowly, then increase speed once accuracy is stable.',
    riddle: {
      prompt: 'In speaking practice, what should you prioritize first?',
      choices: ['Clarity/accuracy', 'Talking as fast as possible', 'Never making mistakes', 'Only silent study'],
      correctIndex: 0,
      acceptedAnswers: ['clarity', 'accuracy', 'clear', 'pronunciation'],
    },
  }),

  host_heaven: host({
    name: 'Museum Host (Heaven Universe)',
    gate: 'heaven',
    intro:
      'This gate leads to Heaven Universe — the cosmic dashboard for progress tracking across all wings.',
    tip:
      'Track a few metrics that matter (time, streaks, coverage). Measuring helps you steer your learning.',
    riddle: {
      prompt: 'Complete the idea: “What gets measured gets ____.”',
      choices: ['Managed', 'Forgotten', 'Ignored', 'Harder'],
      correctIndex: 0,
      acceptedAnswers: ['managed', 'improved', 'measured and managed'],
    },
  }),

  host_tsi: host({
    name: 'Museum Host (TSI Analytics)',
    gate: 'tsi',
    intro:
      'This gate opens TSI Analytics — frequency/coverage insights so your effort produces maximum return.',
    tip:
      'Learn structures + frequency together: grammar is the engine, frequency is the fuel.',
    riddle: {
      prompt: 'What does TSI stand for in this app?',
      choices: ['Target Structure Immersion', 'Total Study Intake', 'Tone & Sound Index', 'Text Search Interface'],
      correctIndex: 0,
      acceptedAnswers: ['target structure immersion', 'tsi'],
    },
  }),

  host_cards: host({
    name: 'Museum Host (Flashcards)',
    gate: 'cards',
    intro:
      'This gate leads to Flashcards — spaced repetition so you actually retain what you encounter.',
    tip:
      'Review right before you forget. That timing converts exposure into durable memory with minimal effort.',
    riddle: {
      prompt: 'What do we call the method of reviewing at increasing intervals to prevent forgetting?',
      choices: ['Spaced repetition', 'Cramming', 'Multitasking', 'Passive exposure'],
      correctIndex: 0,
      acceptedAnswers: ['spaced repetition', 'srs', 'spaced', 'repetition'],
    },
  }),

  host_vocab: host({
    name: 'Museum Host (Vocabulary Lab)',
    gate: 'vocab',
    intro:
      'This gate opens the Vocabulary Lab — lists, comparisons, and deep dives into word families and derivatives.',
    tip:
      'Learn word families. One root can unlock dozens of related words — that’s leverage.',
    riddle: {
      prompt: 'What do we call words built from the same root (family-based learning leverage)?',
      choices: ['Word family / derivatives', 'Random synonyms', 'False friends', 'Noise words'],
      correctIndex: 0,
      acceptedAnswers: ['derivatives', 'word family', 'word families', 'root words', 'family'],
    },
  }),
};

