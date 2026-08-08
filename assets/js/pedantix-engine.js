const WORD_PATTERN = /[\p{L}\p{M}]+/u;
const TOKEN_PATTERN = /[\p{L}\p{M}]+|[^\p{L}\p{M}]+/gu;

const STOP_WORDS = new Set([
  "alors", "avec", "avoir", "comme", "dans", "depuis", "elle", "elles", "entre", "etre",
  "faire", "leurs", "mais", "nous", "pour", "sans", "sont", "sous", "tout", "tous", "toute",
  "toutes", "une", "vers", "vous", "cette", "dont", "plus", "ainsi", "chez", "cela", "leur",
]);

export function normalizeWord(value) {
  return String(value ?? "")
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^a-z]/g, "");
}

export function normalizePhrase(value) {
  return String(value ?? "")
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^a-z]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function tokenizeText(text) {
  const matches = String(text ?? "").match(TOKEN_PATTERN) ?? [];
  return matches.map((value, index) => {
    const isWord = WORD_PATTERN.test(value);
    return {
      index,
      value,
      isWord,
      normalized: isWord ? normalizeWord(value) : "",
    };
  });
}

function lightStem(value) {
  const word = normalizeWord(value);
  if (word.length < 5) return word;
  const suffixes = [
    "issements", "issement", "atrices", "ateurs", "ations", "ements", "atrice", "ateur",
    "ation", "ement", "iques", "ique", "euses", "euse", "ives", "ive", "ifs", "aux",
    "eaux", "aient", "antes", "ents", "ante", "ées", "ee", "és", "es", "ons", "ez",
    "ait", "ent", "er", "ir", "re", "s", "x", "e",
  ];
  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 4) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

export function guessMatchesWord(guess, word) {
  const normalizedGuess = normalizeWord(guess);
  const normalizedWord = normalizeWord(word);
  if (!normalizedGuess || !normalizedWord) return false;
  if (normalizedGuess === normalizedWord) return true;
  if (normalizedGuess.length < 4 || normalizedWord.length < 4) return false;
  const guessStem = lightStem(normalizedGuess);
  const wordStem = lightStem(normalizedWord);
  return guessStem.length >= 4 && guessStem === wordStem;
}

export function selectDailyEntry(entries, dateString) {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  const exact = entries.find((entry) => entry.date === dateString);
  if (exact) return { entry: exact, exactDate: true, index: entries.indexOf(exact) };

  const timestamp = Date.parse(`${dateString}T00:00:00Z`);
  const dayNumber = Number.isFinite(timestamp) ? Math.floor(timestamp / 86_400_000) : 0;
  const index = ((dayNumber % entries.length) + entries.length) % entries.length;
  return { entry: entries[index], exactDate: false, index };
}

export function puzzleKey(entry) {
  return entry ? `${entry.date}:${normalizePhrase(entry.target).replace(/\s+/g, "-")}` : "pedantix:unknown";
}

export function applyGuess(entry, guess, revealedWords = []) {
  const cleanGuess = String(guess ?? "").trim();
  const normalizedPhrase = normalizePhrase(cleanGuess);
  if (!normalizedPhrase) return { valid: false, titleSolved: false, hits: 0, revealedWords: [...revealedWords] };

  const titleSolved = normalizedPhrase === normalizePhrase(entry.target);
  const revealed = new Set(revealedWords);
  let hits = 0;

  if (titleSolved) {
    tokenizeText(entry.text).forEach((token) => {
      if (token.isWord) revealed.add(token.normalized);
    });
  } else if (!normalizedPhrase.includes(" ")) {
    tokenizeText(entry.text).forEach((token) => {
      if (!token.isWord || !guessMatchesWord(cleanGuess, token.value)) return;
      hits += 1;
      revealed.add(token.normalized);
    });
  }

  return { valid: true, titleSolved, hits, revealedWords: [...revealed] };
}

export function puzzleProgress(entry, revealedWords = []) {
  const revealed = new Set(revealedWords);
  const words = tokenizeText(entry?.text).filter((token) => token.isWord);
  if (!words.length) return { revealed: 0, total: 0, percentage: 0 };
  const revealedCount = words.filter((token) => revealed.has(token.normalized)).length;
  return {
    revealed: revealedCount,
    total: words.length,
    percentage: Math.round((revealedCount / words.length) * 100),
  };
}

export function chooseHint(entry, revealedWords = [], random = Math.random) {
  const revealed = new Set(revealedWords);
  const candidates = tokenizeText(entry?.text)
    .filter((token) => token.isWord && token.normalized.length >= 5)
    .filter((token) => !revealed.has(token.normalized) && !STOP_WORDS.has(token.normalized));
  if (!candidates.length) return null;
  const unique = [...new Map(candidates.map((token) => [token.normalized, token])).values()];
  return unique[Math.floor(random() * unique.length)] ?? null;
}

export function titleSegments(target) {
  return String(target ?? "").match(/[\p{L}\p{M}]+|[^\p{L}\p{M}]+/gu) ?? [];
}
