import re
import json
from collections import Counter
from pathlib import Path

ROOT = Path(r"c:\Users\gilbe\Downloads\Apps-Games-Codes\Prodigy Nest Global\Polyglot Heaven")
TRAINING = ROOT / "training" / "index.html"
OUT_DIR = ROOT / "shared" / "data" / "top2000" / "derived"

LANG_KEYS = ["la","ro","it","fr","pt","es","de","arc","ar","he","ru","ja","zh","el"]

def extract_language_strings(text: str, lang: str):
  # Match lang:"..." or lang:'...'
  out = []
  out += re.findall(rf'{re.escape(lang)}\s*:\s*"(.*?)"', text)
  out += re.findall(rf"{re.escape(lang)}\s*:\s*'(.*?)'", text)
  # Match lang:P("text","rom") or lang:P('text','rom')
  out += re.findall(rf'{re.escape(lang)}\s*:\s*P\(\s*"(.*?)"\s*,\s*"(.*?)"\s*\)', text)
  out += re.findall(rf"{re.escape(lang)}\s*:\s*P\(\s*'(.*?)'\s*,\s*'(.*?)'\s*\)", text)
  # Flatten tuples
  flat = []
  for v in out:
    if isinstance(v, tuple):
      flat.extend([v[0], v[1]])
    else:
      flat.append(v)
  return flat

def tokenize(s: str):
  # Keep letters across scripts + apostrophes; split everything else
  # This is a compromise tokenizer for derived fallback lists.
  parts = re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿĀ-žΑ-ωА-я\u0590-\u05FF\u0600-\u06FF]+(?:'[A-Za-zÀ-ÖØ-öø-ÿĀ-žΑ-ωА-я]+)?", s)
  return [p.lower() for p in parts if p]

def main():
  text = TRAINING.read_text(encoding="utf-8", errors="replace")
  OUT_DIR.mkdir(parents=True, exist_ok=True)

  for lang in LANG_KEYS:
    strings = extract_language_strings(text, lang)
    c = Counter()
    for s in strings:
      for tok in tokenize(s):
        c[tok] += 1
    top = c.most_common(2000)
    out = [{"rank": i+1, "token": tok, "count": cnt} for i, (tok, cnt) in enumerate(top)]
    (OUT_DIR / f"{lang}.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(lang, len(out), "tokens")

if __name__ == "__main__":
  main()

