import fs from "node:fs/promises";
import path from "node:path";
import ejdict from "ejdict";

const ROOT = process.cwd();
const OUTPUT_PATH = path.join(ROOT, "data", "vocab1000.js");

const OXFORD_URL = "https://raw.githubusercontent.com/winterdl/oxford-5000-vocabulary-audio-definition/main/data/oxford_5000.json";

const TARGET = {
  verb: 300,
  noun: 400,
  modifier: 300,
};

const CEFR_WEIGHT = {
  c2: 6,
  c1: 5,
  b2: 4,
  b1: 3,
  a2: 2,
  a1: 1,
};

function cleanWord(word) {
  return String(word || "").trim().toLowerCase();
}

function isSingleWord(word) {
  return /^[a-z]{3,20}$/.test(word);
}

function parsePart(typeRaw) {
  const type = String(typeRaw || "").toLowerCase();
  if (/\bverb\b/.test(type)) return "verb";
  if (/\bnoun\b/.test(type)) return "noun";
  if (/\badjective\b/.test(type) || /\badverb\b/.test(type)) return "modifier";
  return null;
}

function normalizeMeaningText(raw) {
  return String(raw || "")
    .replace(/[〈〉『』「」]/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/'を'/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitMeanings(raw) {
  const cleaned = normalizeMeaningText(raw);
  const parts = cleaned
    .split(/[;,/]/)
    .map((s) => s.replace(/^[\-・\s]+/, "").trim())
    .filter(Boolean)
    .filter((s) => !s.startsWith("="));

  const dedup = [];
  const seen = new Set();
  for (const p of parts) {
    if (p.length < 2) continue;
    if (seen.has(p)) continue;
    seen.add(p);
    dedup.push(p);
    if (dedup.length >= 4) break;
  }
  return dedup;
}

function lookupMeanings(word) {
  const hits = ejdict(word);
  if (!Array.isArray(hits) || hits.length === 0) return null;
  const exact = hits.find((h) => cleanWord(h.word) === word) || hits[0];
  const meanings = splitMeanings(exact?.mean || "");
  if (meanings.length === 0) return null;
  return meanings;
}

function cleanExample(exampleRaw, word) {
  const ex = String(exampleRaw || "").replace(/\s+/g, " ").trim();
  if (!ex) {
    return `The word "${word}" is often used in academic writing.`;
  }
  return ex.length > 180 ? `${ex.slice(0, 177)}...` : ex;
}

function makeUsage(definition, type, meanings) {
  return [
    `語義: ${meanings[0]}`,
    `Oxford定義: ${definition}`,
    `品詞: ${type}`,
  ];
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url} -> ${res.status}`);
  return res.json();
}

function toRankedRows(rawObj) {
  const rows = Object.values(rawObj).map((r) => {
    const word = cleanWord(r.word);
    const part = parsePart(r.type);
    const cefr = cleanWord(r.cefr);
    return {
      word,
      part,
      type: String(r.type || ""),
      cefr,
      definition: String(r.definition || "").trim(),
      example: String(r.example || "").trim(),
      weight: CEFR_WEIGHT[cefr] || 0,
    };
  });

  return rows
    .filter((r) => r.part)
    .filter((r) => isSingleWord(r.word))
    .sort((a, b) => b.weight - a.weight);
}

function pickByPart(rows, part, count) {
  const out = [];
  const seen = new Set();

  for (const r of rows) {
    if (r.part !== part) continue;
    if (seen.has(r.word)) continue;

    const meanings = lookupMeanings(r.word);
    if (!meanings) continue;

    const m = meanings.slice(0, 3);
    while (m.length < 2) m.push(`${m[0]}（文脈依存）`);

    out.push({
      word: r.word,
      part,
      rank: (r.cefr || "").toUpperCase(),
      meanings: m,
      usage: makeUsage(r.definition, r.type, m),
      example: {
        en: cleanExample(r.example, r.word),
        ja: `この例では「${r.word}」は「${m[0]}」の意味で使われます。`,
      },
    });

    seen.add(r.word);
    if (out.length >= count) break;
  }

  return out;
}

async function build() {
  const raw = await fetchJson(OXFORD_URL);
  const rows = toRankedRows(raw);

  const verbs = pickByPart(rows, "verb", TARGET.verb);
  const nouns = pickByPart(rows, "noun", TARGET.noun);
  const modifiers = pickByPart(rows, "modifier", TARGET.modifier);

  if (verbs.length !== TARGET.verb || nouns.length !== TARGET.noun || modifiers.length !== TARGET.modifier) {
    throw new Error(`Target unmet: verb=${verbs.length}, noun=${nouns.length}, modifier=${modifiers.length}`);
  }

  const entries = [...verbs, ...nouns, ...modifiers];
  const payload = `window.VOCAB_DATA = ${JSON.stringify(entries, null, 2)};\n`;
  await fs.writeFile(OUTPUT_PATH, payload, "utf8");

  console.log(`Generated ${entries.length} entries -> ${OUTPUT_PATH}`);
  console.log({ verb: verbs.length, noun: nouns.length, modifier: modifiers.length });
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
