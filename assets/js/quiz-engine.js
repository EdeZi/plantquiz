export const RATING_MIN = 800;
export const RATING_MAX = 1800;
export const DEFAULT_RATING = 1000;
export const LEVEL_RATINGS = Object.freeze({
  1: 800,
  2: 1000,
  3: 1200,
  4: 1400,
  5: 1600,
  6: 1800,
});

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function levelRating(level) {
  const safeLevel = clamp(Math.round(Number(level) || 1), 1, 6);
  return LEVEL_RATINGS[safeLevel];
}

export function ratingToLevel(rating) {
  const safeRating = clamp(Number(rating) || DEFAULT_RATING, RATING_MIN, RATING_MAX);
  return Object.entries(LEVEL_RATINGS).reduce(
    (closest, [level, target]) => Math.abs(target - safeRating) < Math.abs(LEVEL_RATINGS[closest] - safeRating) ? Number(level) : closest,
    1,
  );
}

export function ratingProgress(rating) {
  return ((clamp(rating, RATING_MIN, RATING_MAX) - RATING_MIN) / (RATING_MAX - RATING_MIN)) * 100;
}

export function expectedScore(playerRating, questionLevel) {
  const questionRating = levelRating(questionLevel);
  return 1 / (1 + (10 ** ((questionRating - playerRating) / 400)));
}

export function updateRating({ rating, questionLevel, correct, answered = 0 }) {
  const current = clamp(Math.round(Number(rating) || DEFAULT_RATING), RATING_MIN, RATING_MAX);
  const expected = expectedScore(current, questionLevel);
  const kFactor = answered < 12 ? 82 : 44;
  const rawDelta = Math.round(kFactor * ((correct ? 1 : 0) - expected));
  const delta = correct ? Math.max(3, rawDelta) : Math.min(-3, rawDelta);
  const next = clamp(current + delta, RATING_MIN, RATING_MAX);
  return { rating: next, delta: next - current, expected };
}

export function evaluateSelection(question, selectedIds) {
  const selected = new Set([...selectedIds].map(String));
  const correctIds = new Set(
    question.choices.filter((choice) => choice.correct).map((choice) => String(choice.id)),
  );
  const correct = selected.size === correctIds.size && [...selected].every((id) => correctIds.has(id));
  return { correct, selectedIds: selected, correctIds };
}

export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function weightedPick(candidates, random) {
  const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  if (total <= 0) return candidates[Math.floor(random() * candidates.length)]?.question ?? null;
  let cursor = random() * total;
  for (const candidate of candidates) {
    cursor -= candidate.weight;
    if (cursor <= 0) return candidate.question;
  }
  return candidates.at(-1)?.question ?? null;
}

export function chooseAdaptiveQuestion({ questions, rating, questionStats = {}, recentIds = [], random = Math.random }) {
  if (!Array.isArray(questions) || questions.length === 0) return null;
  const recent = new Set(recentIds);
  const playerRating = clamp(Number(rating) || DEFAULT_RATING, RATING_MIN, RATING_MAX);
  const weighted = questions.map((question) => {
    const stat = questionStats[question.uid] ?? {};
    const seen = Math.max(0, Number(stat.seen) || 0);
    const correct = Math.max(0, Number(stat.correct) || 0);
    const accuracy = seen ? correct / seen : 0.5;
    const distance = Math.abs(levelRating(question.level) - playerRating);
    const proximity = 1 / (1 + ((distance / 235) ** 2));
    const discovery = seen === 0 ? 1.75 : 1 / (1 + (seen * 0.035));
    const reinforcement = seen > 0 && accuracy < 0.65 ? 1.3 : 1;
    const recentPenalty = recent.has(question.uid) ? 0.025 : 1;
    return {
      question,
      weight: Math.max(0.0001, proximity * discovery * reinforcement * recentPenalty),
    };
  });
  return weightedPick(weighted, random);
}

export function createRevisionSet(questions, requestedLength, random = Math.random) {
  const shuffled = shuffle(questions, random);
  const parsedLength = Number(requestedLength);
  if (!Number.isFinite(parsedLength) || parsedLength <= 0 || parsedLength >= shuffled.length) return shuffled;
  return shuffled.slice(0, parsedLength);
}

export function percentage(correct, answered) {
  if (!answered) return 0;
  return Math.round((correct / answered) * 100);
}

export function questionTypeLabel(question) {
  const answerCount = question.choices.filter((choice) => choice.correct).length;
  if (question.type === "VF") return "Vrai ou faux";
  return answerCount > 1 ? `${answerCount} réponses` : "Une réponse";
}

export function sessionVerdict(score) {
  if (score >= 90) return { title: "Excellente récolte", message: "Les notions sont solidement installées." };
  if (score >= 75) return { title: "Très belle pousse", message: "Encore quelques détails et ce sera parfaitement maîtrisé." };
  if (score >= 55) return { title: "La progression est là", message: "Relisez les corrections puis tentez une nouvelle session." };
  return { title: "Les bases prennent racine", message: "Une courte révision ciblée vous fera vite progresser." };
}
