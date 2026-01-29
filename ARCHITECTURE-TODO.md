# Polyglot Heaven: Architecture Roadmap

This document outlines the planned multi-page "cathedral architecture" for the Polyglot Heaven codebase. The current `polyglot-unified.html` is a working prototype that demonstrates all features in a single page. Future development will break this into separate, focused pages while maintaining shared components and state management.

## Planned Wings (Pages)

### 1. Heaven Hub (Main Lobby)
**File:** `index.html`

**Purpose:** Central navigation point with "pearly gates" into each specialized wing. Provides:
- Overview dashboard of progress across all wings
- Quick access to recent activities
- Language selection
- User profile and settings
- Navigation cards/portals to each wing

**Layout: Celestial Map with Pearly Gates**

The Heaven Hub presents a "celestial map" layout with the following structure:

**Header Section:**
- App branding: "Polyglot Heaven" with tagline
- User profile summary (avatar, level, total XP)
- Daily streak indicator
- Quick language selector dropdown

**Languages Overview Strip:**
- Horizontal scrollable strip showing all active languages
- Each language tile displays:
  - Flag emoji and language name
  - Progress bar (XP/level)
  - Quick stats (words learned, streak days)
  - **Chinese-specific tile shows:**
    - Characters learned count (汉字)
    - Pinyin proficiency percentage
    - Tone accuracy score
    - High-frequency vocabulary coverage
    - Traditional/Simplified indicator

**Pearly Gates Grid:**
8 gate cards arranged in a responsive grid (2-4 columns):

1. **Heaven Universe Gate**
   - Icon: 🌌 (spiral galaxy)
   - Title: "Heaven Universe"
   - Description: "Track your cosmic progress across all languages"
   - Stats: Total XP, Global Level, Languages Active
   - Link: `/heaven/index.html`

2. **Reader Gate**
   - Icon: 📖 (open book)
   - Title: "Reader Wing"
   - Description: "Deep reading and listening practice"
   - Stats: Sentences Read, Words Learned, Reading Streak
   - Link: `/reader/index.html`

3. **Speaking Gate**
   - Icon: 🎤 (microphone)
   - Title: "Speaking Lab"
   - Description: "Pronunciation and speech practice"
   - Stats: Recordings Made, Accuracy Score, Last Practice
   - Link: `/speak/index.html`

4. **Game Gate**
   - Icon: 🎮 (game controller)
   - Title: "Language Shooter"
   - Description: "Gamified vocabulary learning"
   - Stats: High Score, Games Played, Combo Record
   - Link: `/game/index.html`

5. **TSI Analytics Gate**
   - Icon: 📊 (chart)
   - Title: "TSI Analytics"
   - Description: "Learning efficiency and coverage metrics"
   - Stats: Coverage %, Words Known, Efficiency Score
   - Link: `/tsi/index.html`

6. **Flashcards Gate**
   - Icon: 🎴 (playing cards)
   - Title: "Flashcards"
   - Description: "Spaced repetition system"
   - Stats: Cards Due, Total Cards, Review Streak
   - Link: `/cards/index.html`

7. **Vocabulary Gate**
   - Icon: 🧠 (brain)
   - Title: "Vocabulary Lab"
   - Description: "Word lists and phrase comparison"
   - Stats: Words Saved, Phrases Compared, Export Count
   - Link: `/vocab/index.html`

8. **Settings Gate**
   - Icon: ⚙️ (gear)
   - Title: "Settings & Store"
   - Description: "App settings and content downloads"
   - Stats: Content Packs Installed, Theme, Cloud Status
   - Link: `#settings` (modal or dedicated page)

**Gate Card Design:**
- Card background with subtle gradient
- Hover effect: slight scale and glow
- Click/tap navigates to wing
- Responsive: stacks on mobile, grid on desktop
- Each card shows "last activity" timestamp if available

**Chinese Progress Integration:**
- Chinese language tile in Languages Overview shows:
  - Character count (e.g., "1,234 汉字")
  - Pinyin milestones (e.g., "Tones: 85% accurate")
  - Vocabulary coverage (e.g., "Top 1,000: 67%")
  - Visual progress indicators for each metric

---

### 2. Heaven Universe Wing
**File:** `/heaven/index.html`

**Purpose:** Meta-layer for progress tracking, XP system, and big-picture learning visualization.

**Layout: Multi-Panel Dashboard**

**Panel 1: Universe Map Visualization**
- Canvas or SVG-based visualization showing languages as:
  - Constellations (each language = constellation)
  - Orbits (languages orbiting around user's native language)
  - Star brightness = progress level
  - Connection lines = language relationships
- Interactive: click language to focus
- Chinese appears as distinct constellation with:
  - Character count as star density
  - Pinyin proficiency as brightness
  - Tone accuracy as color hue

**Panel 2: Progress Overview**
- Grid of language progress cards
- Each card shows:
  - Language name and flag
  - XP bar and level
  - Days active streak
  - Words learned count
  - Last activity timestamp
- Chinese card includes:
  - Characters learned (汉字 count)
  - Pinyin proficiency percentage
  - Tone accuracy score
  - Vocabulary coverage percentage

**Panel 3: XP Timeline Chart**
- Chart.js line chart showing:
  - XP over time (last 30 days)
  - Multiple lines for each language
  - Chinese line includes character learning milestones
- X-axis: Date
- Y-axis: Cumulative XP
- Interactive tooltips showing daily breakdown

**Panel 4: Chinese-Specific Progress Panel**
- Dedicated section for Chinese metrics:
  - **Character Learning:**
    - Characters learned: X / 3,500 (common characters)
    - Radicals mastered: X / 214
    - Stroke order accuracy: X%
  - **Pinyin Proficiency:**
    - Tone recognition: X%
    - Pronunciation accuracy: X%
    - Tone pair mastery: X / 16 (4 tones × 4 tones)
  - **Vocabulary Coverage:**
    - High-frequency words: X / 1,000
    - Coverage percentage: X%
    - Traditional vs Simplified: X% / Y%
- Visual progress bars for each metric
- Mini charts showing trends over time

**Panel 5: Milestones & Achievements**
- List of unlocked achievements
- Progress toward next milestones
- Chinese-specific achievements:
  - "First 100 Characters"
  - "Tone Master" (100% tone accuracy)
  - "Pinyin Pro" (mastered all pinyin combinations)
  - "Character Collector" (learned 1,000+ characters)

**Panel 6: Goal Setting**
- Input fields for:
  - Daily XP goal
  - Weekly character learning goal (Chinese)
  - Focus language selection
  - Target coverage percentage
- Saves to shared state via `/shared/core.js`

**State Management Integration:**
- Reads from `shared/core.js`:
  - `app.xp` (total XP)
  - `app.level` (global level)
  - `app.daily` (daily goals and streaks)
  - `app.stats` (per-language statistics)
  - `app.langProgress` (language-specific progress objects)
- Writes back to shared state:
  - Updated daily goals
  - Focus language changes
  - Custom milestone settings
- Uses `localStorage` for persistence
- Optional cloud sync via Supabase hooks

**Charts to Render:**
1. **XP Over Time** (Line Chart)
   - Multiple datasets (one per language)
   - Chinese dataset includes character milestones

2. **Vocabulary Coverage Curve** (Line Chart)
   - Coverage % vs words known
   - Separate curve for Chinese with character count

3. **Chinese Character Coverage** (Bar Chart)
   - Characters learned by frequency rank
   - Grouped by radical families

4. **Tone Accuracy Over Sessions** (Line Chart)
   - Tone recognition accuracy trend
   - Separate lines for each tone (1-4)

5. **Language Comparison** (Radar Chart)
   - Compare progress across languages
   - Chinese includes character/pinyin/tone metrics

**Chinese Support:** Full support for tracking Chinese (Mandarin) progress, including character recognition milestones, pinyin mastery, and vocabulary coverage metrics.

---

### 3. Reader Wing
**File:** `reader.html` or `reader/index.html`

**Purpose:** Deep reading and listening experience with interactive text analysis.

**Features:**
- Interactive text reader with word-by-word selection
- Text-to-speech playback with adjustable rate
- Word definitions and translations on click
- Sentence library management
- Bookmarking and notes
- Reading progress tracking
- Import text/articles for study

**Chinese Support:** 
- Full support for Chinese characters (汉字)
- Pinyin display and pronunciation
- Character decomposition and stroke order
- Traditional and Simplified character variants
- Tone markers and pronunciation guides

---

### 4. Speaking Wing
**File:** `/speak/index.html`

**Purpose:** Pronunciation lab and speech practice.

**Features:**
- Voice recording and playback
- Speech recognition for accuracy scoring
- Pronunciation comparison (native vs. learner)
- Phonetic breakdowns
- Minimal pair practice
- Speaking challenges and drills
- Progress tracking for pronunciation accuracy

**Chinese Support:**
- Tone recognition and practice
- Pinyin pronunciation drills
- Character pronunciation with audio
- Tone pair exercises
- Native speaker audio comparisons

---

### 5. Game Wing
**File:** `game.html` or `game/index.html`

**Purpose:** Gamified learning experiences including Language Shooter and future games.

**Features:**
- Language Shooter (falling word translation game)
- Multiple difficulty levels
- Combo scoring system
- Power-ups and special effects
- Leaderboards (local/cloud)
- Future game modes (word matching, sentence building, etc.)

**Chinese Support:**
- Chinese words included in game word pools
- Pinyin input support
- Character recognition mini-games
- Tone-based challenges

---

### 6. TSI Analytics Wing
**File:** `/tsi/index.html`

**Purpose:** TSI Method analytics lab with charts, tables, and learning efficiency metrics.

**Features:**
- Vocabulary coverage curves
- Frequency-based learning insights
- Coverage vs. word count visualizations
- Marginal returns charts
- Zipf distribution demonstrations
- Heaps-style discovery curves
- Transfer boost calculations
- Learning efficiency recommendations

**Chinese Support:**
- Chinese-specific frequency lists
- Character frequency analysis
- Pinyin coverage metrics
- Coverage calculations for Chinese corpora
- Traditional vs. Simplified coverage tracking

---

### 7. Flashcards / SRS Wing
**File:** `cards.html` or `cards/index.html`

**Purpose:** Spaced Repetition System for vocabulary and phrase memorization.

**Features:**
- Card creation and editing
- SRS algorithm (SM-2 variant)
- Card rating system (Again/Hard/Good/Easy)
- Deck management
- Card import/export
- Study sessions with progress tracking
- Custom scheduling options

**Chinese Support:**
- Chinese character flashcards
- Pinyin + character + English triple-sided cards
- Tone practice cards
- Character decomposition cards
- Radical and component cards

---

### 8. Vocabulary / Phrase Comparison Wing
**File:** `/vocab/index.html`

**Purpose:** Comprehensive vocabulary management and cross-language phrase comparison.

**Features:**
- Vocabulary list management
- Word definitions and notes
- Phrase comparison across languages
- Verb conjugation tables
- Alphabet/script comparison tools
- Number systems comparison
- Kanji/Hanzi analysis tools
- CSV/JSON export

**Chinese Support:**
- Chinese vocabulary database
- Pinyin + characters + English entries
- Verb conjugation patterns (if applicable)
- Character etymology and radicals
- Phrase comparison with Chinese translations
- Number system (一, 二, 三, etc.)
- Measure words (量词) reference

---

## Shared Components & Infrastructure

### Common Files
- `shared/styles.css` - Shared CSS themes and components
- `shared/utils.js` - Utility functions (localStorage, state management, etc.)
- `shared/api.js` - API abstraction layer (Supabase integration, offline fallback)
- `shared/components.js` - Reusable UI components (modals, toasts, buttons, etc.)

### State Management
- Centralized state management (localStorage + optional cloud sync)
- User preferences and settings
- Progress data (XP, levels, streaks)
- Vocabulary and flashcard data
- Cross-wing data sharing

### Language Support
**All wings will fully support Chinese (Mandarin) including:**
- Chinese characters (汉字) - Traditional and Simplified
- Pinyin romanization
- Tone markers and pronunciation
- Character decomposition and radicals
- Measure words (量词)
- Verb patterns and grammar structures
- Cultural context and usage notes

---

## Migration Strategy

1. **Phase 1:** Stabilize current prototype (`polyglot-unified.html`)
   - Ensure all functions work offline with demo data
   - Fix any bugs or missing implementations
   - Document current features

2. **Phase 2:** Extract shared components
   - Create `shared/` directory structure
   - Move common CSS, JS, and utilities
   - Establish state management patterns

3. **Phase 3:** Create Heaven Hub
   - Build main navigation page
   - Implement routing/navigation system
   - Add progress overview dashboard

4. **Phase 4:** Migrate wings one by one
   - Start with simplest wing (e.g., Stats/Universe)
   - Extract module code into separate page
   - Test integration with shared components
   - Repeat for each wing

5. **Phase 5:** Polish and optimize
   - Performance optimization
   - Mobile responsiveness
   - Accessibility improvements
   - Documentation

---

## Technical Considerations

- **Routing:** Consider using a lightweight router or hash-based navigation
- **Build System:** May eventually need a build step for optimization (but keep simple for now)
- **Offline-First:** All wings must work offline with localStorage fallback
- **Cloud Sync:** Optional Supabase integration for multi-device sync
- **Internationalization:** Prepare for future i18n of UI (currently English UI, multilingual content)

---

## Open Questions

1. **Routing Strategy:** Hash-based (#wing) vs. path-based (/wing) vs. single-page with modules?
2. **State Sharing:** How to share state between wings? Global state object? Event system?
3. **Navigation:** Sidebar always visible? Hamburger menu? Breadcrumbs?
4. **Mobile:** Separate mobile views or responsive design?
5. **Authentication:** User accounts? Or keep local-only with optional cloud backup?

---

## Chinese Data Model

**Data Structure:**

```javascript
{
  // Chinese-specific entry
  lang: "zh",
  type: "word" | "character" | "phrase",
  
  // For characters
  character: "人",                    // Traditional/Simplified
  simplified: "人",                   // Simplified variant
  traditional: "人",                  // Traditional variant
  pinyin: "rén",                     // Pinyin with tone marks
  pinyinPlain: "ren",                // Pinyin without tones
  tone: 2,                           // Tone number (1-4, 0 for neutral)
  radicals: ["人"],                  // Radical components
  strokeCount: 2,                    // Number of strokes
  frequencyRank: 15,                 // Frequency rank in corpus
  englishGloss: "person, people",    // English translation
  hskLevel: 1,                       // HSK level (1-6)
  
  // For words/phrases
  pinyin: "ni hao",
  characters: "你好",
  tonePattern: [3, 3],               // Tone pattern for multi-character
  measureWord: "个",                 // Associated measure word (量词)
  
  // Common fields
  notes: "...",                      // User notes
  known: false,                      // User knows this
  lastReviewed: timestamp,           // Last review time
  reviewCount: 0,                    // Times reviewed
  difficulty: 0.5                    // Difficulty score (0-1)
}
```

**Usage by Wing:**

- **Game Wing:** Uses `character`, `pinyinPlain`, `englishGloss`, `frequencyRank`
- **TSI Analytics:** Uses `frequencyRank`, `hskLevel`, `coverage` calculations
- **Heaven Universe:** Uses aggregate stats: `character` count, `tone` accuracy, `frequencyRank` coverage
- **Reader Wing:** Uses `character`, `pinyin`, `englishGloss`, `radicals`
- **Speaking Wing:** Uses `pinyin`, `tone`, `tonePattern`, pronunciation audio
- **Flashcards:** Uses all fields for card creation
- **Vocabulary Wing:** Uses all fields for comparison and analysis

**Storage:**
- Stored in `app.notes` with key format: `zh:character` or `zh:pinyin`
- Chinese-specific stats in `app.langProgress.zh`:
  ```javascript
  {
    charactersLearned: 234,
    pinyinProficiency: 0.85,
    toneAccuracy: 0.78,
    vocabularyCoverage: 0.67,
    hskLevel: 2,
    traditionalCount: 50,
    simplifiedCount: 184
  }
  ```

## Notes

- Chinese language support is confirmed for **all wings** listed above
- The current prototype demonstrates all features working together
- Future architecture will maintain feature parity while improving organization
- Each wing should be independently usable but benefit from shared infrastructure
- All paths use relative URLs (e.g., `../shared/styles.css`)
- Shared state accessed via global `app` object from `shared/core.js`
- Components loaded from `shared/components.js` (toast, modal, gateCard, etc.)
