# Top-2000 word lists

This folder supports a **hybrid** strategy:

- **Imported corpus lists** (preferred): `shared/data/top2000/imported/<lang>.json`
- **Derived fallback lists** (generated from Training Grounds): `shared/data/top2000/derived/<lang>.json`

## JSON format

Each file is an array of entries:

```json
[
  { "rank": 1, "token": "de", "count": 12345 },
  { "rank": 2, "token": "la", "count": 12001 }
]
```

Notes:
- “Mixed” unit: tokens are usually lemmas/surface forms depending on what we can derive/import.
- For languages requiring segmentation (zh/ja), derived fallbacks may be imperfect; imported corpus lists are recommended.

