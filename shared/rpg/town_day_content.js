// Town Day RPG content (v1 scaffold)
// Uses small seed phrases that exist in Training Grounds; will be expanded and mapped later.

const P = (t, r) => ({ t, r });

// Minimal seed phrase set (good morning / good night, etc.)
export const seedPhrases = {
  goodMorning: {
    en: 'Good morning',
    es: 'Buenos días',
    fr: 'Bonjour',
    pt: 'Bom dia',
    de: 'Guten Morgen',
    it: 'Buongiorno',
    ro: 'Bună dimineața',
    ru: 'Доброе утро',
    ja: P('おはようございます', 'ohayou gozaimasu'),
    zh: P('早上好', 'zǎoshang hǎo'),
    ar: P('صباح الخير', 'sabah al-khayr'),
    he: P('בוקר טוב', 'boker tov'),
    el: P('Καλημέρα', 'kaliméra'),
    arc: P('ܨܦܪܐ ܛܒܐ', 'safra taba'),
  },
  goodNight: {
    en: 'Good night',
    es: 'Buenas noches',
    fr: 'Bonne nuit',
    pt: 'Boa noite',
    de: 'Gute Nacht',
    it: 'Buonanotte',
    ro: 'Noapte bună',
    ru: 'Спокойной ночи',
    ja: P('おやすみなさい', 'oyasumi nasai'),
    zh: P('晚安', "wǎn'ān"),
    ar: P('تصبح على خير', 'tusbih ala khayr'),
    he: P('לילה טוב', 'laila tov'),
    el: P('Καληνύχτα', 'kalinýchta'),
    arc: P('ܠܠܝܐ ܛܒܐ', 'lelya taba'),
  },
};

export const townDayContent = {
  id: 'townDay',
  scenes: [
    {
      id: 'homeMorning',
      title: 'Morning at Home',
      steps: [
        {
          id: 'gm1',
          npc: 'Family Member',
          line: 'Say “Good morning”.',
          task: {
            type: 'mc',
            options: (langKey) => {
              const correct = seedPhrases.goodMorning[langKey];
              const wrong1 = seedPhrases.goodNight[langKey];
              const wrong2 = seedPhrases.goodMorning.es; // small distractor
              const t = (v) => (typeof v === 'object' ? v.t : v);
              return [t(correct), t(wrong1), t(wrong2)];
            },
            correctIndex: 0,
          },
          next: 'next',
          teach: {
            note: 'High-frequency greetings appear constantly. Master them early.',
          },
        },
        {
          id: 'gm2',
          npc: 'Family Member',
          line: 'Now type it (exact).',
          task: {
            type: 'text',
            expected: (langKey, settings) => {
              const v = seedPhrases.goodMorning[langKey];
              const t = (x) => (typeof x === 'object' ? x.t : x);
              const r = (x) => (typeof x === 'object' ? x.r : '');
              // Difficulty: if romanization is enabled, accept it too
              const out = [t(v)];
              if (settings?.showRoman && r(v)) out.push(r(v));
              return out;
            },
          },
          next: 'next',
          teach: {
            note: 'Typing forces recall. Romanization can be a bridge when needed.',
          },
        },
      ],
    },
    {
      id: 'bedNight',
      title: 'Bedtime',
      steps: [
        {
          id: 'gn1',
          npc: 'You',
          line: 'End the day: say “Good night”.',
          task: {
            type: 'mc',
            options: (langKey) => {
              const correct = seedPhrases.goodNight[langKey];
              const wrong1 = seedPhrases.goodMorning[langKey];
              const wrong2 = seedPhrases.goodNight.es;
              const t = (v) => (typeof v === 'object' ? v.t : v);
              return [t(correct), t(wrong1), t(wrong2)];
            },
            correctIndex: 0,
          },
          next: 'next',
          teach: {
            note: 'We’ll expand this into a full day loop (home → city → errands → home).',
          },
        },
      ],
    },
  ],
};

