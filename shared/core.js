/* =========================================
   POLYGLOT HEAVEN: SHARED CORE STATE
   ========================================= */

// Supported languages (source of truth)
const LANGS = [
  { key:"la",  label:"Latin",      flag:"🏛️", script:"Latin" },
  { key:"ro",  label:"Romanian",   flag:"🇷🇴", script:"Latin" },
  { key:"it",  label:"Italian",    flag:"🇮🇹", script:"Latin" },
  { key:"fr",  label:"French",     flag:"🇫🇷", script:"Latin" },
  { key:"pt",  label:"Portuguese", flag:"🇵🇹", script:"Latin" },
  { key:"es",  label:"Spanish",    flag:"🇪🇸", script:"Latin" },
  { key:"de",  label:"German",     flag:"🇩🇪", script:"Latin" },
  { key:"arc", label:"Aramaic (Syriac)", flag:"🕎", script:"Syriac" },
  { key:"ar",  label:"Arabic",     flag:"🇸🇦", script:"Arabic" },
  { key:"he",  label:"Hebrew",     flag:"🇮🇱", script:"Hebrew" },
  { key:"ru",  label:"Russian",    flag:"🇷🇺", script:"Cyrillic" },
  { key:"ja",  label:"Japanese",   flag:"🇯🇵", script:"Kana/Kanji" },
  { key:"zh",  label:"Chinese",    flag:"🇨🇳", script:"Hanzi/Pinyin" },
  { key:"el",  label:"Greek",      flag:"🇬🇷", script:"Greek" },
];

// Global app state object
const app = {
  lang: "es", // Selected language (affects all wings)
  xp: 0,
  level: 1,
  daily: { 
    date: new Date().toISOString().slice(0,10), 
    xp: 0, 
    streak: 0 
  },
  stats: {},
  langProgress: {},
  notes: {},
  srs: [],
  bookmarks: new Set(),
  known: new Set(),
  theme: "pro",
  isOffline: false,
  // Town Day RPG progress
  townDay: {
    completedScenes: [],
    currentScene: null,
    reputation: 0,
    unlockedGates: []
  },
  // Main Hall progress
  mainHall: {
    npcsTalkedTo: [],
    gatesUnlocked: []
  }
};

// Load state from localStorage
function loadState() {
  const saved = localStorage.getItem("poly_state");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(app, parsed);
      
      // Restore Sets
      if (parsed.bookmarks) app.bookmarks = new Set(parsed.bookmarks);
      if (parsed.known) app.known = new Set(parsed.known);
      
      // Reset daily if new day
      const today = new Date().toISOString().slice(0,10);
      if (app.daily.date !== today) {
        if (new Date(today) - new Date(app.daily.date) > 86400000) {
          app.daily.streak = 0;
        }
        app.daily.date = today;
        app.daily.xp = 0;
      }
    } catch(e) { 
      console.error("Save corrupted", e); 
    }
  }
}

// Save state to localStorage
function saveState() {
  localStorage.setItem("poly_state", JSON.stringify({
    ...app, 
    bookmarks: Array.from(app.bookmarks), 
    known: Array.from(app.known)
  }));
}

// Get current language info
function getCurrentLang() {
  return LANGS.find(l => l.key === app.lang) || LANGS[0];
}

// Initialize state on load
loadState();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { app, LANGS, loadState, saveState, getCurrentLang };
}
