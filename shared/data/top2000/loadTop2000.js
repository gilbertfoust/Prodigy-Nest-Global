// Hybrid Top-2000 loader:
// - tries imported corpus list first
// - falls back to derived list generated from Training Grounds

export async function loadTop2000(langKey) {
  const candidates = [
    `../shared/data/top2000/imported/${langKey}.json`,
    `../shared/data/top2000/derived/${langKey}.json`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data) && data.length) return { source: url, list: data };
    } catch {
      // ignore; try next
    }
  }
  return { source: null, list: [] };
}

