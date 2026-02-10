export const hall3dLayout = {
  // Rotunda geometry parameters
  rotunda: {
    gateCount: 9,           // circular layout (supports all current wings)
    gateRadius: 18.5,       // where gates sit
    hostOffset: 2.4,        // host stands this far in front of gate (toward center)
    crowdRadius: 7.5,       // ambient crowd ring
  },

  // Gates placed evenly around the rotunda
  gates: [
    { id: 'training', label: 'Training Grounds', emoji: '📚', href: 'training/index.html', hostId: 'host_training' },
    { id: 'town', label: 'Town Day', emoji: '🏘️', href: 'town/index.html', hostId: 'host_town' },
    { id: 'game', label: 'Shooter', emoji: '🎮', href: 'game/index.html', hostId: 'host_game' },
    { id: 'reader', label: 'Reader', emoji: '📖', href: 'reader/index.html', hostId: 'host_reader' },
    { id: 'speak', label: 'Speaking', emoji: '🎤', href: 'speak/index.html', hostId: 'host_speak' },
    { id: 'heaven', label: 'Heaven Universe', emoji: '🌌', href: 'heaven/index.html', hostId: 'host_heaven' },
    { id: 'tsi', label: 'TSI Analytics', emoji: '📊', href: 'tsi/index.html', hostId: 'host_tsi' },
    { id: 'cards', label: 'Flashcards', emoji: '🎴', href: 'cards/index.html', hostId: 'host_cards' },
    { id: 'vocab', label: 'Vocabulary', emoji: '🧠', href: 'vocab/index.html', hostId: 'host_vocab' },
  ],

  // Ambient crowd clusters (School of Athens vibe): a few conversation “islands”
  crowdClusters: [
    { id: 'cluster_a', center: { x: -3.0, z: -2.0 }, count: 4 },
    { id: 'cluster_b', center: { x: 3.5, z: 1.0 }, count: 4 },
    { id: 'cluster_c', center: { x: 0.0, z: 4.0 }, count: 3 },
  ],

  // Conversational NPC roster (v1: 20 total = 9 hosts + 11 crowd)
  // - hosts speak English or the user-selected target language
  // - crowd have fixed languages (as many unique languages as possible)
  people: [
    // Hosts (one per gate)
    { id: 'host_training', role: 'host', languagePolicy: 'selectedOrEnglish', topicId: 'topic_host_training', gateId: 'training' },
    { id: 'host_town', role: 'host', languagePolicy: 'selectedOrEnglish', topicId: 'topic_host_town', gateId: 'town' },
    { id: 'host_game', role: 'host', languagePolicy: 'selectedOrEnglish', topicId: 'topic_host_game', gateId: 'game' },
    { id: 'host_reader', role: 'host', languagePolicy: 'selectedOrEnglish', topicId: 'topic_host_reader', gateId: 'reader' },
    { id: 'host_speak', role: 'host', languagePolicy: 'selectedOrEnglish', topicId: 'topic_host_speak', gateId: 'speak' },
    { id: 'host_heaven', role: 'host', languagePolicy: 'selectedOrEnglish', topicId: 'topic_host_heaven', gateId: 'heaven' },
    { id: 'host_tsi', role: 'host', languagePolicy: 'selectedOrEnglish', topicId: 'topic_host_tsi', gateId: 'tsi' },
    { id: 'host_cards', role: 'host', languagePolicy: 'selectedOrEnglish', topicId: 'topic_host_cards', gateId: 'cards' },
    { id: 'host_vocab', role: 'host', languagePolicy: 'selectedOrEnglish', topicId: 'topic_host_vocab', gateId: 'vocab' },

    // Crowd (one topic per NPC). 11 NPCs mapped 1:1 onto crowdClusters (4+4+3)
    { id: 'crowd_01', role: 'crowd', languagePolicy: 'fixed', langKey: 'es', topicId: 'topic_crowd_es' },
    { id: 'crowd_02', role: 'crowd', languagePolicy: 'fixed', langKey: 'fr', topicId: 'topic_crowd_fr' },
    { id: 'crowd_03', role: 'crowd', languagePolicy: 'fixed', langKey: 'de', topicId: 'topic_crowd_de' },
    { id: 'crowd_04', role: 'crowd', languagePolicy: 'fixed', langKey: 'it', topicId: 'topic_crowd_it' },

    { id: 'crowd_05', role: 'crowd', languagePolicy: 'fixed', langKey: 'pt', topicId: 'topic_crowd_pt' },
    { id: 'crowd_06', role: 'crowd', languagePolicy: 'fixed', langKey: 'ru', topicId: 'topic_crowd_ru' },
    { id: 'crowd_07', role: 'crowd', languagePolicy: 'fixed', langKey: 'ar', topicId: 'topic_crowd_ar' },
    { id: 'crowd_08', role: 'crowd', languagePolicy: 'fixed', langKey: 'he', topicId: 'topic_crowd_he' },

    { id: 'crowd_09', role: 'crowd', languagePolicy: 'fixed', langKey: 'ja', topicId: 'topic_crowd_ja' },
    { id: 'crowd_10', role: 'crowd', languagePolicy: 'fixed', langKey: 'zh', topicId: 'topic_crowd_zh' },
    { id: 'crowd_11', role: 'crowd', languagePolicy: 'fixed', langKey: 'el', topicId: 'topic_crowd_el' },
  ],

  interactRadius: {
    npc: 2.2,
    gate: 2.8,
    host: 2.3,
  },
};

export function getPersonById(id) {
  return hall3dLayout.people.find((p) => p.id === id) || null;
}

