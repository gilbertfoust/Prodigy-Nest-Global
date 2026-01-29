# Polyglot Heaven: Development Notes

## Project Overview

Polyglot Heaven is a comprehensive language learning platform that combines multiple learning modalities into a unified experience. The current prototype (`polyglot-unified.html`) demonstrates all features in a single-page application, which will eventually be refactored into a multi-page "cathedral architecture."

## Current Status

### Working Features
- ✅ Reading & Listening module with interactive text
- ✅ Speaking Lab with voice recording and accuracy scoring
- ✅ Dictation Quiz with hints and answer checking
- ✅ Language Shooter game (gamified vocabulary learning)
- ✅ Flashcards with Spaced Repetition System (SRS)
- ✅ Vocabulary management and export
- ✅ TSI Analytics dashboard with charts
- ✅ Statistics and progress tracking
- ✅ Content Store for language pack downloads
- ✅ Multiple themes (Professional, Light, Cyberpunk)
- ✅ Offline-first architecture with optional cloud sync

### Language Support
- Spanish 🇪🇸
- French 🇫🇷
- German 🇩🇪
- Italian 🇮🇹
- Portuguese 🇧🇷
- Russian 🇷🇺
- Japanese 🇯🇵
- **Chinese 🇨🇳 (Mandarin)** - Fully integrated
- Arabic 🇸🇦
- Korean 🇰🇷

### Chinese Language Integration

Chinese (Mandarin) is fully supported throughout the application:

1. **Content Packs:** Includes 15+ sentences and 20+ vocabulary words with pinyin
2. **Game Mode:** Chinese words included in Language Shooter word database
3. **Reader:** Supports Chinese characters with proper text direction
4. **Speaking Lab:** Voice recognition and pronunciation practice for Chinese
5. **Flashcards:** Chinese vocabulary cards with pinyin and English
6. **TSI Analytics:** Coverage calculations work for Chinese vocabulary
7. **Language Selector:** Chinese option available in all modules

## Technical Implementation

### Data Storage
- **Primary:** localStorage for offline-first operation
- **Optional:** Supabase for cloud sync (when configured)
- **Format:** JSON serialization of app state

### Key Functions
All JavaScript functions are defined in a single `<script>` block at the bottom of `polyglot-unified.html`. Functions work with in-memory demo data and localStorage persistence.

### Demo Data
The app includes built-in content packs for all supported languages, allowing full functionality without external data sources.

## Known Limitations

1. **Supabase Integration:** Currently has hooks for cloud sync but works fully offline
2. **Game Input Handler:** Event listener attached in gameLoop - may need optimization
3. **Voice Recognition:** Browser-dependent (Chrome recommended)
4. **Chart.js:** Requires CDN connection for TSI Analytics charts
5. **Export Features:** CSV export is placeholder (shows toast)

## Future Enhancements

See `ARCHITECTURE-TODO.md` for planned multi-page architecture.

## Development Notes

- All functions are implemented with basic functionality
- Cloud integration points are marked with comments/logging
- App works completely offline with demo content
- Chinese language support is comprehensive across all modules
