const DATA_FILES = {
  normal: new URL("../../data/questions_normal.json", import.meta.url),
  revision: new URL("../../data/questions_revision.json", import.meta.url),
  pedantix: new URL("../../data/pedantix_daily.json", import.meta.url),
};

async function fetchJson(url, label) {
  let response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (error) {
    throw new Error(`Impossible de charger ${label}. Ouvrez PlantQuiz depuis un serveur local ou GitHub Pages.`, { cause: error });
  }
  if (!response.ok) {
    throw new Error(`${label} est indisponible (${response.status}).`);
  }
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`${label} ne contient pas un JSON valide.`, { cause: error });
  }
}

function normalizeChoices(choices) {
  if (!Array.isArray(choices)) return [];
  return choices
    .filter((choice) => choice && typeof choice === "object")
    .map((choice, index) => ({
      id: String(choice.id ?? String.fromCharCode(97 + index)),
      text: String(choice.text ?? "").trim(),
      correct: choice.correct === true,
    }))
    .filter((choice) => choice.text);
}

function inferType(question, choices) {
  const declared = String(question.type ?? "").toUpperCase();
  if (["QCM", "QCU", "VF"].includes(declared)) return declared;
  if (choices.length === 2 && choices.every((choice) => /^(vrai|faux)$/i.test(choice.text))) return "VF";
  return choices.filter((choice) => choice.correct).length > 1 ? "QCM" : "QCU";
}

function normalizeQuestion(question, context, index) {
  const choices = normalizeChoices(question?.choices);
  const originalId = String(question?.id ?? `${context}_q${index + 1}`);
  return {
    uid: `${context}:${originalId}:${index}`,
    id: originalId,
    prompt: String(question?.prompt ?? "Question").trim(),
    explanation: String(question?.explanation ?? "").trim(),
    level: Math.min(6, Math.max(1, Number(question?.level) || 1)),
    theme: String(question?.theme ?? "Biologie végétale").trim(),
    type: inferType(question ?? {}, choices),
    choices,
  };
}

function normalizeNormal(payload) {
  const source = Array.isArray(payload) ? payload : payload?.questions;
  if (!Array.isArray(source)) throw new Error("La banque du Défi Elo n’a pas le format attendu.");
  return source.map((question, index) => normalizeQuestion(question, "normal", index));
}

function normalizeRevision(payload) {
  if (!Array.isArray(payload?.semesters)) throw new Error("La banque de révision n’a pas le format attendu.");
  const semesters = payload.semesters.map((semester, semesterIndex) => {
    const id = String(semester?.sem ?? semester?.id ?? `S${semesterIndex + 1}`);
    const subjects = (Array.isArray(semester?.subjects) ? semester.subjects : []).map((subject, subjectIndex) => {
      const subjectId = String(subject?.id ?? `${id}_subject_${subjectIndex + 1}`);
      const rawType = String(subject?.type ?? "core").toLowerCase();
      const type = rawType === "option" || rawType === "elective" ? "elective" : "core";
      const questions = (Array.isArray(subject?.questions) ? subject.questions : []).map((question, questionIndex) => ({
        ...normalizeQuestion(question, `revision:${id}:${subjectId}`, questionIndex),
        semesterId: id,
        subjectId,
      }));
      return {
        id: subjectId,
        label: String(subject?.label ?? subject?.name ?? subjectId),
        type,
        questions,
      };
    });
    return {
      id,
      label: String(semester?.label ?? `Semestre ${id.replace(/\D/g, "")}`),
      subjects,
    };
  });
  return semesters;
}

function normalizePedantix(payload) {
  if (!Array.isArray(payload)) throw new Error("La banque Pédantix n’a pas le format attendu.");
  return payload
    .filter((entry) => entry && entry.date && entry.target && entry.text)
    .map((entry, index) => ({
      uid: `pedantix:${entry.date}:${index}`,
      date: String(entry.date),
      target: String(entry.target).trim(),
      text: String(entry.text).trim(),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function loadPlantQuizData() {
  const [normalPayload, revisionPayload, pedantixPayload] = await Promise.all([
    fetchJson(DATA_FILES.normal, "la banque du Défi Elo"),
    fetchJson(DATA_FILES.revision, "la banque de révision"),
    fetchJson(DATA_FILES.pedantix, "la banque Pédantix"),
  ]);

  const normal = normalizeNormal(normalPayload);
  const semesters = normalizeRevision(revisionPayload);
  const pedantix = normalizePedantix(pedantixPayload);
  const revisionCount = semesters.reduce(
    (total, semester) => total + semester.subjects.reduce((sum, subject) => sum + subject.questions.length, 0),
    0,
  );

  return {
    normal,
    semesters,
    pedantix,
    counts: {
      normal: normal.length,
      revision: revisionCount,
      pedantix: pedantix.length,
      totalQuestions: normal.length + revisionCount,
    },
  };
}
