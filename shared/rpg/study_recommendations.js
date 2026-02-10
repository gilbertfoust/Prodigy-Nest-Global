// Study recommendations and derivative language suggestions

// Map skill tags to human-readable study targets
export const skillToStudy = {
  greeting: 'Greetings + polite openers',
  question_words: 'Who/What/Where/When + word order',
  negation: 'Negation patterns',
  directions: 'Left/right/straight + "to" + landmarks',
  connectors: 'Because/so/but + sentence building',
  numbers: 'Numbers 1-100 + counting',
  time: 'Time expressions + days/months',
  identity: 'Name/from/nationality + "to be"',
  needs: 'Want/need + basic verbs',
  politeness: 'Please/thank you + formal forms',
  past_tense: 'Past tense verbs + time markers',
  future_tense: 'Future expressions + planning',
  word_order: 'Sentence structure + placement',
  pronouns: 'Subject/object pronouns',
  adjectives: 'Adjective agreement + placement',
  prepositions: 'In/on/at + location words',
};

// Derivative language suggestions (for boosting learning through related languages)
export const derivativeBoost = {
  es: ['it', 'pt', 'fr'],  // Spanish -> Italian, Portuguese, French
  fr: ['es', 'it'],         // French -> Spanish, Italian
  it: ['es', 'pt'],         // Italian -> Spanish, Portuguese
  pt: ['es', 'it'],         // Portuguese -> Spanish, Italian
  de: ['en'],               // German -> English
  ar: ['he'],               // Arabic -> Hebrew
  zh: ['ja'],               // Chinese -> Japanese
  ja: ['zh'],               // Japanese -> Chinese
  ru: [],                   // Russian -> (none yet, could add Ukrainian/Polish later)
  el: ['it'],               // Greek -> Italian (shared roots)
};

// Get study recommendations from wrongBySkill object
export function getRecommendedStudy(wrongBySkill) {
  if (!wrongBySkill || typeof wrongBySkill !== 'object') return [];
  
  // Sort skills by wrong count (descending)
  const entries = Object.entries(wrongBySkill)
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 3); // Top 3
  
  return entries.map(([skill, _]) => skillToStudy[skill] || skill);
}

// Get derivative language suggestions for a given language key
export function getRecommendedLangs(langKey) {
  return derivativeBoost[langKey] || [];
}
