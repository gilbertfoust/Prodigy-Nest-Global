// TSI Main Hall dialogue content (shared between 2D/3D halls)
export const tsiHallDialogues = {
  zipf: {
    name: "Zipf Scholar",
    messages: [
      {
        text:
          "Zipf's Law: in natural language, the most common word appears about twice as often as the 2nd most common, three times as often as the 3rd, and so on.",
        options: [
          { text: "How does that help me learn?", next: 1 },
          { text: "Give me the takeaway.", next: 2 },
          { text: "Close", action: "close" },
        ],
      },
      {
        text:
          "It means frequency is wildly uneven. If you learn the most frequent words first, you unlock huge coverage fast (and the Town Day uses that idea).",
        options: [
          { text: "Unlock Town Day", action: "unlockGate", gate: "town" },
          { text: "Back", next: 0 },
        ],
      },
      {
        text:
          "Takeaway: high-frequency first, then reinforce through real contexts. You’ll understand more sooner and your brain learns patterns faster.",
        options: [
          { text: "Unlock Town Day", action: "unlockGate", gate: "town" },
          { text: "Back", next: 0 },
        ],
      },
    ],
  },
  cognates: {
    name: "Cognate Master",
    messages: [
      {
        text:
          "Cognates are familiar-looking words shared across languages (e.g., hospital/hôpital/hospital). They’re a free boost to comprehension.",
        options: [
          { text: "How do I use cognates safely?", next: 1 },
          { text: "Show me the strategy.", next: 2 },
          { text: "Close", action: "close" },
        ],
      },
      {
        text:
          "Use cognates as hypotheses, not guarantees. Confirm with context. Over time you learn which endings and roots map reliably.",
        options: [
          { text: "Unlock Reader", action: "unlockGate", gate: "reader" },
          { text: "Back", next: 0 },
        ],
      },
      {
        text:
          "Strategy: scan for shared roots, then attach them to a high-frequency sentence pattern. That makes your brain generalize faster.",
        options: [
          { text: "Unlock Reader", action: "unlockGate", gate: "reader" },
          { text: "Back", next: 0 },
        ],
      },
    ],
  },
  clusters: {
    name: "Cluster Expert",
    messages: [
      {
        text:
          "Learn in clusters: words that appear together in real life (coffee, cup, milk, sugar, pay, receipt). Clusters stick better than isolated lists.",
        options: [
          { text: "Why do clusters work?", next: 1 },
          { text: "Give an example cluster.", next: 2 },
          { text: "Close", action: "close" },
        ],
      },
      {
        text:
          "Your memory strengthens with connections. Clusters create a web, so recall becomes easier and you get more usable speech sooner.",
        options: [
          { text: "Unlock Vocabulary", action: "unlockGate", gate: "vocab" },
          { text: "Back", next: 0 },
        ],
      },
      {
        text:
          "Example: Morning = good morning, wake up, breakfast, coffee, today, hurry. That’s a mini-world you can actually live inside.",
        options: [
          { text: "Unlock Vocabulary", action: "unlockGate", gate: "vocab" },
          { text: "Back", next: 0 },
        ],
      },
    ],
  },
  immersion: {
    name: "Immersion Guide",
    messages: [
      {
        text:
          "Immersion works best when it’s structured: high-frequency words, real scenarios, and feedback loops. That’s what the Town Day is for.",
        options: [
          { text: "What is structured immersion?", next: 1 },
          { text: "How does Town Day help?", next: 2 },
          { text: "Close", action: "close" },
        ],
      },
      {
        text:
          "Structured immersion means you repeatedly use the same high-value words across different contexts until they become automatic.",
        options: [
          { text: "Unlock Town Day", action: "unlockGate", gate: "town" },
          { text: "Back", next: 0 },
        ],
      },
      {
        text:
          "Town Day takes you from morning to night: greetings, errands, problem-solving, small talk. You progress by communicating correctly.",
        options: [
          { text: "Unlock Town Day", action: "unlockGate", gate: "town" },
          { text: "Back", next: 0 },
        ],
      },
    ],
  },
  srs: {
    name: "SRS Master",
    messages: [
      {
        text:
          "Spaced Repetition (SRS) schedules reviews right before you forget. It turns exposure into long-term memory efficiently.",
        options: [
          { text: "Why does it work?", next: 1 },
          { text: "How do I use it here?", next: 2 },
          { text: "Close", action: "close" },
        ],
      },
      {
        text:
          "Forgetting is normal. SRS uses timing to strengthen recall. Each successful recall makes the memory more durable.",
        options: [
          { text: "Unlock Flashcards", action: "unlockGate", gate: "cards" },
          { text: "Back", next: 0 },
        ],
      },
      {
        text:
          "Use the Flashcards wing to keep your high-frequency words and key phrases active. Town Day introduces; SRS retains.",
        options: [
          { text: "Unlock Flashcards", action: "unlockGate", gate: "cards" },
          { text: "Back", next: 0 },
        ],
      },
    ],
  },
};

