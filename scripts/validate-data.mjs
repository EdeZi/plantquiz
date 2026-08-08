import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];

async function readJson(relativePath) {
  const content = await readFile(resolve(root, relativePath), "utf8");
  try {
    return JSON.parse(content);
  } catch (error) {
    errors.push(`${relativePath}: JSON invalide (${error.message})`);
    return null;
  }
}

function validateChoices(question, context) {
  if (!Array.isArray(question?.choices) || question.choices.length < 2) {
    errors.push(`${context}: au moins deux choix sont requis.`);
    return;
  }
  const identifiers = new Set();
  let correct = 0;
  question.choices.forEach((choice, index) => {
    if (!choice || typeof choice !== "object") errors.push(`${context}: choix ${index + 1} invalide.`);
    const id = String(choice?.id ?? "");
    if (!id) errors.push(`${context}: choix ${index + 1} sans identifiant.`);
    if (identifiers.has(id)) errors.push(`${context}: identifiant de choix dupliqué (${id}).`);
    identifiers.add(id);
    if (!String(choice?.text ?? "").trim()) errors.push(`${context}: choix ${id || index + 1} sans texte.`);
    if (choice?.correct === true) correct += 1;
  });
  if (!correct) errors.push(`${context}: aucune bonne réponse déclarée.`);
}

function validateQuestion(question, context) {
  if (!question || typeof question !== "object") {
    errors.push(`${context}: question invalide.`);
    return;
  }
  if (!String(question.id ?? "").trim()) errors.push(`${context}: identifiant manquant.`);
  if (!String(question.prompt ?? "").trim()) errors.push(`${context}: énoncé manquant.`);
  validateChoices(question, context);
}

const normal = await readJson("data/questions_normal.json");
if (normal && !Array.isArray(normal)) errors.push("questions_normal.json: un tableau est attendu.");
if (Array.isArray(normal)) {
  const ids = new Set();
  normal.forEach((question, index) => {
    validateQuestion(question, `normal[${index}]`);
    if (ids.has(question.id)) errors.push(`questions_normal.json: identifiant dupliqué ${question.id}.`);
    ids.add(question.id);
    const level = Number(question.level);
    if (!Number.isInteger(level) || level < 1 || level > 6) errors.push(`normal[${index}]: niveau hors plage 1–6.`);
  });
}

const revision = await readJson("data/questions_revision.json");
if (revision && !Array.isArray(revision.semesters)) errors.push("questions_revision.json: semesters doit être un tableau.");
const revisionQuestions = [];
if (Array.isArray(revision?.semesters)) {
  revision.semesters.forEach((semester, semesterIndex) => {
    if (!Array.isArray(semester.subjects)) {
      errors.push(`revision.semesters[${semesterIndex}]: subjects doit être un tableau.`);
      return;
    }
    semester.subjects.forEach((subject, subjectIndex) => {
      if (!Array.isArray(subject.questions)) {
        errors.push(`revision ${semester.sem}/${subject.id}: questions doit être un tableau.`);
        return;
      }
      subject.questions.forEach((question, questionIndex) => {
        validateQuestion(question, `revision ${semester.sem}/${subject.id}[${questionIndex}]`);
        revisionQuestions.push({ id: question.id, semester: semester.sem, subject: subject.id });
      });
    });
  });
}

const duplicateRevisionIds = [...Map.groupBy(revisionQuestions, (question) => question.id).entries()]
  .filter(([, questions]) => questions.length > 1);
duplicateRevisionIds.forEach(([id, questions]) => {
  warnings.push(`questions_revision.json: identifiant ${id} présent ${questions.length} fois (géré par un identifiant interne composite).`);
});

const pedantix = await readJson("data/pedantix_daily.json");
if (pedantix && !Array.isArray(pedantix)) errors.push("pedantix_daily.json: un tableau est attendu.");
if (Array.isArray(pedantix)) {
  const dates = new Set();
  pedantix.forEach((entry, index) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(entry?.date ?? ""))) errors.push(`pedantix[${index}]: date invalide.`);
    if (!String(entry?.target ?? "").trim()) errors.push(`pedantix[${index}]: titre manquant.`);
    if (!String(entry?.text ?? "").trim()) errors.push(`pedantix[${index}]: texte manquant.`);
    if (dates.has(entry.date)) errors.push(`pedantix_daily.json: date dupliquée ${entry.date}.`);
    dates.add(entry.date);
  });
}

warnings.forEach((warning) => console.warn(`AVERTISSEMENT: ${warning}`));
if (errors.length) {
  errors.forEach((error) => console.error(`ERREUR: ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Données valides : ${normal?.length ?? 0} questions Elo, ${revisionQuestions.length} questions de révision, ${pedantix?.length ?? 0} Pédantix.`);
}
