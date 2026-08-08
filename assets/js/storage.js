import { DEFAULT_RATING, RATING_MAX, RATING_MIN, clamp } from "./quiz-engine.js";

const PROFILE_KEY = "plantquiz.profile.v3";
const PEDANTIX_KEY = "plantquiz.pedantix.v3";

export function createDefaultProfile() {
  return {
    rating: DEFAULT_RATING,
    normalAnswered: 0,
    normalCorrect: 0,
    revisionAnswered: 0,
    revisionCorrect: 0,
    bestStreak: 0,
    questionStats: {},
  };
}

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadProfile() {
  const defaults = createDefaultProfile();
  const stored = readJson(PROFILE_KEY, {});
  if (!stored || typeof stored !== "object") return defaults;
  return {
    rating: clamp(Math.round(Number(stored.rating) || DEFAULT_RATING), RATING_MIN, RATING_MAX),
    normalAnswered: Math.max(0, Number(stored.normalAnswered) || 0),
    normalCorrect: Math.max(0, Number(stored.normalCorrect) || 0),
    revisionAnswered: Math.max(0, Number(stored.revisionAnswered) || 0),
    revisionCorrect: Math.max(0, Number(stored.revisionCorrect) || 0),
    bestStreak: Math.max(0, Number(stored.bestStreak) || 0),
    questionStats: stored.questionStats && typeof stored.questionStats === "object" ? stored.questionStats : {},
  };
}

export function saveProfile(profile) {
  return writeJson(PROFILE_KEY, profile);
}

export function clearProfile() {
  try {
    window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    // La réinitialisation reste locale et peut échouer en navigation privée stricte.
  }
  return createDefaultProfile();
}

export function recordNormalAnswer(profile, question, correct, nextRating, streak) {
  const stat = profile.questionStats[question.uid] ?? { seen: 0, correct: 0, lastSeen: 0 };
  stat.seen += 1;
  stat.correct += correct ? 1 : 0;
  stat.lastSeen = Date.now();
  profile.questionStats[question.uid] = stat;
  profile.rating = nextRating;
  profile.normalAnswered += 1;
  profile.normalCorrect += correct ? 1 : 0;
  profile.bestStreak = Math.max(profile.bestStreak, streak);
  saveProfile(profile);
  return profile;
}

export function recordRevisionAnswer(profile, correct, streak) {
  profile.revisionAnswered += 1;
  profile.revisionCorrect += correct ? 1 : 0;
  profile.bestStreak = Math.max(profile.bestStreak, streak);
  saveProfile(profile);
  return profile;
}

export function loadPedantixState(key) {
  const allStates = readJson(PEDANTIX_KEY, {});
  const state = allStates?.[key];
  if (!state || typeof state !== "object") {
    return { guesses: [], revealedWords: [], hints: 0, won: false, gaveUp: false };
  }
  return {
    guesses: Array.isArray(state.guesses) ? state.guesses : [],
    revealedWords: Array.isArray(state.revealedWords) ? state.revealedWords : [],
    hints: Math.max(0, Number(state.hints) || 0),
    won: state.won === true,
    gaveUp: state.gaveUp === true,
  };
}

export function savePedantixState(key, state) {
  const allStates = readJson(PEDANTIX_KEY, {});
  allStates[key] = state;
  const entries = Object.entries(allStates)
    .sort(([, a], [, b]) => Number(b?.updatedAt || 0) - Number(a?.updatedAt || 0))
    .slice(0, 80);
  return writeJson(PEDANTIX_KEY, Object.fromEntries(entries));
}

export function clearPedantixState(key) {
  const allStates = readJson(PEDANTIX_KEY, {});
  delete allStates[key];
  writeJson(PEDANTIX_KEY, allStates);
}
