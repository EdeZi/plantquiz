import { loadPlantQuizData } from "./data.js";
import {
  chooseAdaptiveQuestion,
  createRevisionSet,
  evaluateSelection,
  percentage,
  questionTypeLabel,
  ratingProgress,
  ratingToLevel,
  sessionVerdict,
  updateRating,
} from "./quiz-engine.js";
import {
  applyGuess,
  chooseHint,
  normalizePhrase,
  puzzleKey,
  puzzleProgress,
  selectDailyEntry,
  titleSegments,
  tokenizeText,
} from "./pedantix-engine.js";
import {
  clearPedantixState,
  clearProfile,
  loadPedantixState,
  loadProfile,
  recordNormalAnswer,
  recordRevisionAnswer,
  savePedantixState,
} from "./storage.js";

const app = document.querySelector("#app");
const toastRegion = document.querySelector("#toast-region");

const state = {
  data: null,
  profile: loadProfile(),
  normalConfig: { theme: "all", length: 10 },
  normalSession: null,
  revisionConfig: { semesterId: "", subjectIds: new Set(), length: 10 },
  revisionSession: null,
  pedantixIndex: null,
  pedantixExactDate: false,
  teacher: {
    subjectId: "",
    id: "",
    prompt: "",
    explanation: "",
    choices: createTeacherChoices(4),
    output: [],
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function todayIso() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value, options = { dateStyle: "long" }) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", options).format(date);
}

function createTeacherChoices(count) {
  return Array.from({ length: count }, (_, index) => ({ id: String.fromCharCode(97 + index), text: "", correct: false }));
}

function currentRoute() {
  const route = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return ["home", "normal", "revision", "pedantix", "teacher"].includes(route) ? route : "home";
}

function navigate(route) {
  const nextHash = `#/${route}`;
  if (window.location.hash === nextHash) renderRoute({ focus: true });
  else window.location.hash = nextHash;
}

function setActiveNavigation(route) {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === route) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function setDocumentTitle(route) {
  const labels = {
    home: "PlantQuiz — Cultivez vos connaissances",
    normal: "Défi Elo — PlantQuiz",
    revision: "Révision — PlantQuiz",
    pedantix: "Pédantix — PlantQuiz",
    teacher: "Outil enseignant — PlantQuiz",
  };
  document.title = labels[route] ?? labels.home;
}

function renderRoute({ focus = false } = {}) {
  if (!state.data) return;
  const route = currentRoute();
  setActiveNavigation(route);
  setDocumentTitle(route);

  if (route === "normal") renderNormal();
  else if (route === "revision") renderRevision();
  else if (route === "pedantix") renderPedantix();
  else if (route === "teacher") renderTeacher();
  else renderHome();

  if (focus) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    requestAnimationFrame(() => app.focus({ preventScroll: true }));
  }
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastRegion.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function accuracyLabel(correct, answered) {
  return answered ? `${percentage(correct, answered)} %` : "—";
}

function renderHome() {
  const { counts } = state.data;
  const profile = state.profile;
  const totalAnswered = profile.normalAnswered + profile.revisionAnswered;
  const totalCorrect = profile.normalCorrect + profile.revisionCorrect;
  const level = ratingToLevel(profile.rating);

  app.innerHTML = `
    <div class="page">
      <section class="hero" aria-labelledby="home-title">
        <div class="hero__content">
          <p class="eyebrow" style="color:var(--lime)">Révisions de biologie végétale</p>
          <h1 id="home-title">Faites pousser vos <em>connaissances.</em></h1>
          <p class="lede">Des sessions courtes, un niveau qui s’adapte et une énigme végétale à déchiffrer. Choisissez votre rythme et commencez.</p>
          <div class="hero__actions">
            <a class="btn btn--lime" href="#/normal">Lancer le Défi Elo <span aria-hidden="true">→</span></a>
            <a class="btn btn--paper" href="#/revision">Réviser une UE</a>
          </div>
        </div>
        <div class="hero__aside" aria-label="Vos statistiques">
          <div class="hero-metric">
            <span class="hero-metric__value">${profile.rating}</span>
            <span>Votre Elo actuel<br>Niveau estimé ${level}/6</span>
          </div>
          <div class="hero-metric">
            <span class="hero-metric__value">${totalAnswered}</span>
            <span>Questions répondues<br>sur cet appareil</span>
          </div>
          <div class="hero-metric">
            <span class="hero-metric__value">${accuracyLabel(totalCorrect, totalAnswered)}</span>
            <span>Précision cumulée<br>tous modes confondus</span>
          </div>
        </div>
      </section>

      <section class="section-block" aria-labelledby="modes-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Trois façons d’apprendre</p>
            <h2 id="modes-title">Choisissez votre terrain.</h2>
          </div>
          <p>Le Défi Elo s’adapte à vos réponses, la Révision cible vos unités d’enseignement et le Pédantix transforme un texte en énigme.</p>
        </div>

        <div class="mode-grid">
          <article class="mode-card" data-index="1">
            <div class="mode-card__icon" aria-hidden="true">↗</div>
            <h3>Défi Elo</h3>
            <p>Une difficulté qui évolue question après question selon vos réussites.</p>
            <div class="mode-card__footer">
              <span class="mode-card__meta">${counts.normal} questions · 6 niveaux</span>
              <a class="arrow-link" href="#/normal" aria-label="Ouvrir le Défi Elo">→</a>
            </div>
          </article>

          <article class="mode-card" data-index="2">
            <div class="mode-card__icon" aria-hidden="true">✓</div>
            <h3>Révision ciblée</h3>
            <p>Sélectionnez un semestre, une ou plusieurs UE et la durée de votre session.</p>
            <div class="mode-card__footer">
              <span class="mode-card__meta">${counts.revision} questions · ${state.data.semesters.length} semestres</span>
              <a class="arrow-link" href="#/revision" aria-label="Ouvrir la révision">→</a>
            </div>
          </article>

          <article class="mode-card" data-index="3">
            <div class="mode-card__icon" aria-hidden="true">?</div>
            <h3>Pédantix végétal</h3>
            <p>Proposez des mots, révélez le texte et retrouvez le titre caché.</p>
            <div class="mode-card__footer">
              <span class="mode-card__meta">${counts.pedantix} énigmes disponibles</span>
              <a class="arrow-link" href="#/pedantix" aria-label="Ouvrir le Pédantix">→</a>
            </div>
          </article>
        </div>
      </section>

      <section class="section-block" aria-labelledby="library-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Banque pédagogique</p>
            <h2 id="library-title">Un contenu déjà riche.</h2>
          </div>
          <p>Les questions existantes restent intactes. PlantQuiz réorganise seulement la façon de les découvrir et de suivre votre progression.</p>
        </div>
        <div class="stat-ribbon">
          <div class="stat-ribbon__item"><strong>${counts.totalQuestions}</strong><span>questions au total</span></div>
          <div class="stat-ribbon__item"><strong>6</strong><span>niveaux adaptatifs</span></div>
          <div class="stat-ribbon__item"><strong>${state.data.semesters.length}</strong><span>semestres renseignés</span></div>
          <div class="stat-ribbon__item"><strong>${profile.bestStreak}</strong><span>meilleure série</span></div>
        </div>
      </section>
    </div>
  `;
}

function normalThemes() {
  return [...new Set(state.data.normal.map((question) => question.theme).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
}

function renderNormal() {
  if (state.normalSession?.complete) renderQuizSummary("normal", state.normalSession);
  else if (state.normalSession?.current) renderQuizQuestion("normal", state.normalSession);
  else renderNormalConfig();
}

function renderNormalConfig() {
  const themes = normalThemes();
  const profile = state.profile;
  const level = ratingToLevel(profile.rating);
  app.innerHTML = `
    <div class="page page--compact">
      <a class="back-link" href="#/home">← Retour à l’accueil</a>
      <div class="page-heading">
        <div>
          <p class="eyebrow">Mode adaptatif</p>
          <h1>Défi Elo</h1>
        </div>
        <p class="page-heading__side">Le moteur choisit des questions proches de votre niveau et réintroduit les notions qui méritent une seconde tentative.</p>
      </div>

      <form id="normal-config-form" class="config-layout">
        <section class="config-card">
          <h3>Préparer la session</h3>
          <p class="muted">Deux réglages, puis le quiz s’occupe du reste.</p>

          <label class="field">
            <span>Thème</span>
            <select name="theme">
              <option value="all"${state.normalConfig.theme === "all" ? " selected" : ""}>Mélange complet</option>
              ${themes.map((theme) => `<option value="${escapeAttribute(theme)}"${state.normalConfig.theme === theme ? " selected" : ""}>${escapeHtml(theme)}</option>`).join("")}
            </select>
          </label>

          <fieldset class="field" style="border:0;padding:0;margin:20px 0 0">
            <legend class="field-label" style="margin-bottom:8px">Durée</legend>
            <div class="segmented">
              ${[10, 20, 0].map((length) => `
                <label class="segment">
                  <input type="radio" name="length" value="${length}"${state.normalConfig.length === length ? " checked" : ""}>
                  <span>${length || "Libre"}${length ? " questions" : ""}</span>
                </label>
              `).join("")}
            </div>
          </fieldset>

          <div class="inline-actions inline-actions--mobile-stack" style="margin-top:26px">
            <button class="btn" type="submit">Commencer la session <span aria-hidden="true">→</span></button>
            <button class="btn btn--ghost btn--danger" type="button" data-action="reset-profile">Réinitialiser ma progression</button>
          </div>
        </section>

        <aside class="config-stack">
          <div class="config-card config-card--dark">
            <span class="eyebrow" style="color:var(--lime)">Position actuelle</span>
            <span class="config-card__number">${profile.rating}</span>
            <strong>Niveau estimé ${level} sur 6</strong>
            <div class="progress-track" style="--progress:${ratingProgress(profile.rating)}%"><span></span></div>
            <p class="muted" style="margin:16px 0 0">${profile.normalAnswered ? `${profile.normalAnswered} réponses enregistrées, ${accuracyLabel(profile.normalCorrect, profile.normalAnswered)} de réussite.` : "Votre niveau s’affinera rapidement pendant les 12 premières réponses."}</p>
          </div>
          <div class="config-card">
            <h3>Comment le score évolue</h3>
            <p class="muted" style="margin:0">Une bonne réponse difficile rapporte davantage. Une erreur sur une question facile ajuste plus fortement votre estimation. Votre score est conservé uniquement sur cet appareil.</p>
          </div>
        </aside>
      </form>
    </div>
  `;
}

function startNormalSession(theme, length) {
  const pool = theme === "all" ? state.data.normal : state.data.normal.filter((question) => question.theme === theme);
  if (!pool.length) {
    showToast("Aucune question disponible pour ce thème.");
    return;
  }
  state.normalConfig = { theme, length };
  state.normalSession = {
    pool,
    length,
    startRating: state.profile.rating,
    answered: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    recentIds: [],
    selectedIds: new Set(),
    locked: false,
    results: [],
    complete: false,
    current: null,
    lastDelta: 0,
  };
  advanceNormalQuestion();
}

function advanceNormalQuestion() {
  const session = state.normalSession;
  if (!session) return;
  if (session.length > 0 && session.answered >= session.length) {
    session.complete = true;
    renderNormal();
    return;
  }
  if (session.current) {
    session.recentIds.push(session.current.uid);
    if (session.recentIds.length > 40) session.recentIds.shift();
  }
  session.current = chooseAdaptiveQuestion({
    questions: session.pool,
    rating: state.profile.rating,
    questionStats: state.profile.questionStats,
    recentIds: session.recentIds,
  });
  session.selectedIds = new Set();
  session.locked = false;
  session.lastDelta = 0;
  renderNormal();
}

function currentSemester() {
  return state.data.semesters.find((semester) => semester.id === state.revisionConfig.semesterId) ?? state.data.semesters[0];
}

function initializeRevisionConfig() {
  const semester = state.data.semesters[0];
  state.revisionConfig.semesterId = semester?.id ?? "";
  state.revisionConfig.subjectIds = new Set(semester?.subjects.map((subject) => subject.id) ?? []);
}

function renderRevision() {
  if (state.revisionSession?.complete) renderQuizSummary("revision", state.revisionSession);
  else if (state.revisionSession?.current) renderQuizQuestion("revision", state.revisionSession);
  else renderRevisionConfig();
}

function renderRevisionConfig() {
  const semester = currentSemester();
  const selectedCount = semester?.subjects
    .filter((subject) => state.revisionConfig.subjectIds.has(subject.id))
    .reduce((sum, subject) => sum + subject.questions.length, 0) ?? 0;

  app.innerHTML = `
    <div class="page page--compact">
      <a class="back-link" href="#/home">← Retour à l’accueil</a>
      <div class="page-heading">
        <div>
          <p class="eyebrow">Sessions ciblées</p>
          <h1>Révision</h1>
        </div>
        <p class="page-heading__side">Composez une courte session à partir des UE existantes. Le score Elo ne change jamais dans ce mode.</p>
      </div>

      <form id="revision-config-form" class="config-layout">
        <section class="config-card">
          <label class="field">
            <span>Semestre</span>
            <select name="semester" data-action="revision-semester">
              ${state.data.semesters.map((entry) => `<option value="${escapeAttribute(entry.id)}"${entry.id === semester?.id ? " selected" : ""}>${escapeHtml(entry.label)}</option>`).join("")}
            </select>
          </label>

          <div class="field" style="margin-top:22px">
            <div class="inline-actions" style="justify-content:space-between">
              <span class="field-label">Unités d’enseignement</span>
              <span>
                <button class="btn btn--ghost btn--small" type="button" data-action="revision-select-all">Tout sélectionner</button>
                <button class="btn btn--ghost btn--small" type="button" data-action="revision-clear">Effacer</button>
              </span>
            </div>
            <div class="subject-list">
              ${(semester?.subjects ?? []).map((subject) => `
                <label class="subject-option">
                  <input type="checkbox" name="subjects" value="${escapeAttribute(subject.id)}"${state.revisionConfig.subjectIds.has(subject.id) ? " checked" : ""}>
                  <strong>${escapeHtml(subject.label)}</strong>
                  <small>${subject.questions.length} questions</small>
                </label>
              `).join("") || `<p class="muted">Aucune UE disponible pour ce semestre.</p>`}
            </div>
          </div>

          <fieldset class="field" style="border:0;padding:0;margin:22px 0 0">
            <legend class="field-label" style="margin-bottom:8px">Taille de la session</legend>
            <div class="segmented">
              ${[5, 10, 20, 0].map((length) => `
                <label class="segment">
                  <input type="radio" name="length" value="${length}"${state.revisionConfig.length === length ? " checked" : ""}>
                  <span>${length || "Toutes"}</span>
                </label>
              `).join("")}
            </div>
          </fieldset>

          <div class="inline-actions inline-actions--mobile-stack" style="margin-top:26px">
            <button class="btn" type="submit"${selectedCount ? "" : " disabled"}>Lancer la révision <span aria-hidden="true">→</span></button>
          </div>
        </section>

        <aside class="config-stack">
          <div class="config-card config-card--dark">
            <span class="eyebrow" style="color:var(--lime)">Sélection actuelle</span>
            <span class="config-card__number">${selectedCount}</span>
            <strong>questions disponibles</strong>
            <p class="muted" style="margin:16px 0 0">Les questions seront mélangées avant chaque nouvelle session.</p>
          </div>
          <div class="config-card">
            <h3>Réviser efficacement</h3>
            <p class="muted" style="margin:0">Commencez par 10 questions. Le bilan final rassemble les erreurs et leurs explications pour une seconde lecture rapide.</p>
          </div>
        </aside>
      </form>
    </div>
  `;
}

function startRevisionSession(subjectIds, length) {
  const semester = currentSemester();
  const pool = (semester?.subjects ?? [])
    .filter((subject) => subjectIds.has(subject.id))
    .flatMap((subject) => subject.questions);
  if (!pool.length) {
    showToast("Sélectionnez au moins une UE contenant des questions.");
    return;
  }
  state.revisionConfig.subjectIds = new Set(subjectIds);
  state.revisionConfig.length = length;
  const questions = createRevisionSet(pool, length);
  state.revisionSession = {
    questions,
    length: questions.length,
    index: 0,
    answered: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    selectedIds: new Set(),
    locked: false,
    results: [],
    complete: false,
    current: questions[0],
    lastDelta: 0,
  };
  renderRevision();
}

function advanceRevisionQuestion() {
  const session = state.revisionSession;
  if (!session) return;
  if (session.answered >= session.questions.length) {
    session.complete = true;
    renderRevision();
    return;
  }
  session.index = session.answered;
  session.current = session.questions[session.index];
  session.selectedIds = new Set();
  session.locked = false;
  renderRevision();
}

function renderQuizQuestion(mode, session) {
  const question = session.current;
  const isNormal = mode === "normal";
  const latestResult = session.results.at(-1);
  const answeredCurrent = session.locked && latestResult?.question.uid === question.uid;
  const correctIds = answeredCurrent ? latestResult.correctIds : new Set();
  const selectedIds = session.selectedIds;
  const total = session.length || null;
  const position = session.answered + (session.locked ? 0 : 1);
  const progress = total ? Math.min(100, Math.round((session.answered / total) * 100)) : 0;
  const score = percentage(session.correct, session.answered);

  const choicesHtml = question.choices.map((choice, index) => {
    const id = String(choice.id);
    const selected = selectedIds.has(id);
    const correct = answeredCurrent && correctIds.has(id);
    const wrong = answeredCurrent && selected && !correctIds.has(id);
    const classes = ["choice-button", selected ? "is-selected" : "", correct ? "is-correct" : "", wrong ? "is-wrong" : ""].filter(Boolean).join(" ");
    const stateIcon = correct ? "✓" : wrong ? "×" : selected ? "✓" : "";
    return `
      <button class="${classes}" type="button" data-action="select-choice" data-choice-id="${escapeAttribute(id)}"${session.locked ? " disabled" : ""} aria-pressed="${selected}">
        <span class="choice-button__key" aria-hidden="true">${index + 1}</span>
        <span>${escapeHtml(choice.text)}</span>
        <span class="choice-button__state" aria-hidden="true">${stateIcon}</span>
      </button>
    `;
  }).join("");

  let feedbackHtml = "";
  if (answeredCurrent) {
    const correctTexts = question.choices.filter((choice) => correctIds.has(String(choice.id))).map((choice) => choice.text).join(" · ");
    feedbackHtml = `
      <div class="answer-feedback${latestResult.correct ? "" : " is-wrong"}" aria-live="polite">
        <strong>${latestResult.correct ? "Bonne réponse." : "Pas cette fois."}</strong>
        ${latestResult.correct ? "" : `<p><b>Réponse attendue :</b> ${escapeHtml(correctTexts)}</p>`}
        ${question.explanation ? `<p>💡 ${escapeHtml(question.explanation)}</p>` : ""}
      </div>
    `;
  }

  app.innerHTML = `
    <div class="page">
      <a class="back-link" href="#/${mode}" data-action="quit-session">← Quitter la session</a>
      <div class="page-heading">
        <div>
          <p class="eyebrow">${isNormal ? "Mode adaptatif" : "Session ciblée"}</p>
          <h1>${isNormal ? "Défi Elo" : "Révision"}</h1>
        </div>
        <p class="page-heading__side">${isNormal ? escapeHtml(question.theme) : escapeHtml(subjectLabel(question.subjectId))}</p>
      </div>

      <div class="quiz-layout">
        <article class="quiz-card">
          <div class="quiz-card__top">
            <span class="question-number">Question ${position}${total ? ` / ${total}` : ""}</span>
            <span class="question-type">${escapeHtml(questionTypeLabel(question))}</span>
          </div>
          <div class="quiz-card__body">
            <h2 class="question-prompt">${escapeHtml(question.prompt)}</h2>
            <div class="choice-list">${choicesHtml}</div>
            ${feedbackHtml}
          </div>
          <div class="quiz-card__footer">
            <button class="btn btn--ghost btn--small" type="button" data-action="finish-session">${isNormal ? "Terminer et voir le bilan" : "Arrêter la session"}</button>
            <div class="inline-actions inline-actions--end">
              ${session.locked
                ? `<button class="btn" type="button" data-action="next-question">${total && session.answered >= total ? "Voir le bilan" : "Question suivante"} <span aria-hidden="true">→</span></button>`
                : `<button class="btn" type="button" data-action="validate-answer"${selectedIds.size ? "" : " disabled"}>Valider ma réponse</button>`}
            </div>
          </div>
        </article>

        <aside class="quiz-sidebar" aria-label="Progression de la session">
          ${isNormal ? `
            <div class="metric-card metric-card--dark">
              <span class="metric-card__label">Elo actuel</span>
              <strong class="metric-card__value">${state.profile.rating}</strong>
              ${session.lastDelta ? `<span class="metric-card__delta">${session.lastDelta > 0 ? "+" : ""}${session.lastDelta}</span>` : ""}
              <div class="progress-track" style="--progress:${ratingProgress(state.profile.rating)}%"><span></span></div>
            </div>
          ` : `
            <div class="metric-card metric-card--dark">
              <span class="metric-card__label">Avancement</span>
              <strong class="metric-card__value">${session.answered}/${session.length}</strong>
              <div class="progress-track" style="--progress:${progress}%"><span></span></div>
            </div>
          `}
          <div class="mini-stats">
            <div class="mini-stat"><strong>${session.correct}</strong><span>Bonnes</span></div>
            <div class="mini-stat"><strong>${session.streak}</strong><span>Série</span></div>
            <div class="mini-stat"><strong>${session.answered}</strong><span>Réponses</span></div>
            <div class="mini-stat"><strong>${session.answered ? `${score}%` : "—"}</strong><span>Précision</span></div>
          </div>
          <div class="metric-card">
            <span class="metric-card__label">Raccourcis</span>
            <p class="muted" style="margin:10px 0 0;font-size:13px">Touches 1 à 7 pour choisir, puis Entrée pour valider ou continuer.</p>
          </div>
        </aside>
      </div>
    </div>
  `;
}

function subjectLabel(subjectId) {
  for (const semester of state.data.semesters) {
    const subject = semester.subjects.find((entry) => entry.id === subjectId);
    if (subject) return subject.label;
  }
  return "Révision ciblée";
}

function selectChoice(mode, choiceId) {
  const session = mode === "normal" ? state.normalSession : state.revisionSession;
  if (!session || session.locked) return;
  const multiple = session.current.choices.filter((choice) => choice.correct).length > 1;
  if (!multiple) session.selectedIds = new Set([String(choiceId)]);
  else if (session.selectedIds.has(String(choiceId))) session.selectedIds.delete(String(choiceId));
  else session.selectedIds.add(String(choiceId));
  renderQuizQuestion(mode, session);
}

function validateAnswer(mode) {
  const isNormal = mode === "normal";
  const session = isNormal ? state.normalSession : state.revisionSession;
  if (!session || session.locked || !session.selectedIds.size) return;

  const evaluation = evaluateSelection(session.current, session.selectedIds);
  session.answered += 1;
  session.correct += evaluation.correct ? 1 : 0;
  session.streak = evaluation.correct ? session.streak + 1 : 0;
  session.bestStreak = Math.max(session.bestStreak, session.streak);
  session.locked = true;

  if (isNormal) {
    const ratingUpdate = updateRating({
      rating: state.profile.rating,
      questionLevel: session.current.level,
      correct: evaluation.correct,
      answered: state.profile.normalAnswered,
    });
    session.lastDelta = ratingUpdate.delta;
    recordNormalAnswer(state.profile, session.current, evaluation.correct, ratingUpdate.rating, session.streak);
  } else {
    recordRevisionAnswer(state.profile, evaluation.correct, session.streak);
  }

  session.results.push({
    question: session.current,
    correct: evaluation.correct,
    selectedIds: new Set(evaluation.selectedIds),
    correctIds: new Set(evaluation.correctIds),
    ratingDelta: session.lastDelta,
  });
  renderQuizQuestion(mode, session);
}

function renderQuizSummary(mode, session) {
  const isNormal = mode === "normal";
  const score = percentage(session.correct, session.answered);
  const verdict = sessionVerdict(score);
  const mistakes = session.results.filter((result) => !result.correct);
  const ratingDelta = state.profile.rating - (session.startRating ?? state.profile.rating);

  app.innerHTML = `
    <div class="page page--compact">
      <section class="summary-hero">
        <p class="eyebrow" style="color:var(--lime)">${isNormal ? "Défi Elo terminé" : "Session terminée"}</p>
        <h1 style="font-size:clamp(2.8rem,7vw,5.5rem)">${escapeHtml(verdict.title)}</h1>
        <div class="summary-score"><strong>${score}%</strong><span>${session.correct} bonnes réponses<br>sur ${session.answered}</span></div>
        <p class="lede" style="color:rgba(255,253,247,.72)">${escapeHtml(verdict.message)}</p>
        ${isNormal ? `<p><span class="pill">Elo ${state.profile.rating} · ${ratingDelta >= 0 ? "+" : ""}${ratingDelta} cette session</span></p>` : ""}
        <div class="inline-actions inline-actions--mobile-stack" style="margin-top:28px;position:relative;z-index:1">
          <button class="btn btn--lime" type="button" data-action="restart-session">Nouvelle session</button>
          <a class="btn btn--paper" href="#/home">Retour à l’accueil</a>
        </div>
      </section>

      <section class="section-block" aria-labelledby="review-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Bilan</p>
            <h2 id="review-title">${mistakes.length ? "À revoir tranquillement." : "Aucune erreur à revoir."}</h2>
          </div>
          <p>${mistakes.length ? `${mistakes.length} correction${mistakes.length > 1 ? "s" : ""} à relire avant la prochaine tentative.` : "Vous pouvez augmenter la durée ou changer de thème pour poursuivre."}</p>
        </div>
        ${mistakes.length ? `<div class="review-list">${mistakes.map((result) => renderReviewItem(result)).join("")}</div>` : ""}
      </section>
    </div>
  `;
}

function renderReviewItem(result) {
  const expected = result.question.choices.filter((choice) => result.correctIds.has(String(choice.id))).map((choice) => choice.text).join(" · ");
  return `
    <article class="review-item">
      <div class="review-item__meta">
        <span class="pill">${escapeHtml(result.question.type)}</span>
        <span class="muted">${escapeHtml(result.question.theme || subjectLabel(result.question.subjectId))}</span>
      </div>
      <h3>${escapeHtml(result.question.prompt)}</h3>
      <p><strong>Réponse attendue :</strong> ${escapeHtml(expected)}</p>
      ${result.question.explanation ? `<p class="muted">${escapeHtml(result.question.explanation)}</p>` : ""}
    </article>
  `;
}

function finishSession(mode) {
  const session = mode === "normal" ? state.normalSession : state.revisionSession;
  if (!session || !session.answered) {
    if (mode === "normal") state.normalSession = null;
    else state.revisionSession = null;
  } else {
    session.complete = true;
  }
  renderRoute();
}

function initializePedantix() {
  const daily = selectDailyEntry(state.data.pedantix, todayIso());
  state.pedantixIndex = daily?.index ?? 0;
  state.pedantixExactDate = daily?.exactDate ?? false;
}

function currentPedantixEntry() {
  return state.data.pedantix[state.pedantixIndex] ?? state.data.pedantix[0];
}

function pedantixRuntime() {
  const entry = currentPedantixEntry();
  const key = puzzleKey(entry);
  const saved = loadPedantixState(key);
  return { entry, key, saved };
}

function renderPedantix() {
  const { entry, saved } = pedantixRuntime();
  const solved = saved.won || saved.gaveUp;
  const progress = puzzleProgress(entry, saved.revealedWords);
  const isDailyIndex = selectDailyEntry(state.data.pedantix, todayIso())?.index === state.pedantixIndex;

  app.innerHTML = `
    <div class="page">
      <a class="back-link" href="#/home">← Retour à l’accueil</a>
      <div class="page-heading">
        <div>
          <p class="eyebrow">Texte à dévoiler</p>
          <h1>Pédantix</h1>
        </div>
        <p class="page-heading__side">Proposez un mot pour révéler toutes ses formes proches, puis trouvez le titre caché.</p>
      </div>

      <div class="pedantix-layout">
        <article class="puzzle-card">
          <header class="puzzle-card__header">
            <div class="inline-actions" style="justify-content:space-between">
              <span class="pill">${isDailyIndex ? (state.pedantixExactDate ? "Énigme du jour" : "Énigme du jour · archive") : `Archive du ${escapeHtml(formatDate(entry.date, { day: "numeric", month: "short", year: "numeric" }))}`}</span>
              <span>${progress.percentage}% révélé</span>
            </div>
            ${renderTitleMask(entry.target, solved)}
            ${solved ? `
              <div class="puzzle-result">
                <span>${saved.won ? "Bravo, titre trouvé !" : "Énigme révélée"}</span>
                <strong>${escapeHtml(entry.target)}</strong>
              </div>
            ` : ""}
          </header>
          <div class="puzzle-card__body">
            <div class="puzzle-text">${renderPuzzleText(entry, saved.revealedWords, solved)}</div>
            ${solved ? "" : `
              <form id="pedantix-guess-form" class="guess-form">
                <label class="sr-only" for="pedantix-guess">Votre proposition</label>
                <input id="pedantix-guess" name="guess" type="search" autocomplete="off" placeholder="Un mot ou le titre complet…" required>
                <button class="btn" type="submit">Proposer</button>
              </form>
            `}
          </div>
        </article>

        <aside class="quiz-sidebar">
          <div class="metric-card metric-card--dark">
            <span class="metric-card__label">Texte révélé</span>
            <strong class="metric-card__value">${progress.percentage}%</strong>
            <div class="progress-track" style="--progress:${progress.percentage}%"><span></span></div>
            <p style="margin:12px 0 0;color:rgba(255,253,247,.65);font-size:13px">${progress.revealed} mots visibles sur ${progress.total}</p>
          </div>
          <div class="mini-stats">
            <div class="mini-stat"><strong>${saved.guesses.length}</strong><span>Essais</span></div>
            <div class="mini-stat"><strong>${saved.hints}</strong><span>Indices</span></div>
          </div>
          <div class="metric-card">
            <label class="field">
              <span>Explorer les archives</span>
              <select data-action="pedantix-archive">
                ${state.data.pedantix.map((item, index) => `<option value="${index}"${index === state.pedantixIndex ? " selected" : ""}>${escapeHtml(formatDate(item.date, { day: "2-digit", month: "long", year: "numeric" }))}</option>`).join("")}
              </select>
            </label>
            <button class="btn btn--ghost btn--small" type="button" data-action="pedantix-today" style="margin-top:10px">Revenir à l’énigme du jour</button>
          </div>
          ${solved ? `
            <button class="btn btn--outline" type="button" data-action="pedantix-reset">Recommencer cette énigme</button>
          ` : `
            <div class="inline-actions">
              <button class="btn btn--outline btn--small" type="button" data-action="pedantix-hint">Révéler un indice</button>
              <button class="btn btn--ghost btn--danger btn--small" type="button" data-action="pedantix-give-up">Abandonner</button>
            </div>
          `}
          <div class="metric-card">
            <span class="metric-card__label">Vos propositions</span>
            ${saved.guesses.length ? `
              <ol class="guess-list">
                ${[...saved.guesses].reverse().map((guess) => `
                  <li class="guess-item"><strong>${escapeHtml(guess.value)}</strong><span>${guess.titleSolved ? "Titre !" : guess.hint ? "Indice" : `${guess.hits} occ.`}</span></li>
                `).join("")}
              </ol>
            ` : `<p class="muted" style="margin:10px 0 0;font-size:13px">Aucun essai pour le moment.</p>`}
          </div>
        </aside>
      </div>
    </div>
  `;
}

function renderTitleMask(target, solved) {
  const segments = titleSegments(target);
  return `<div class="title-mask" aria-label="${solved ? `Titre : ${escapeAttribute(target)}` : "Titre masqué"}">
    ${segments.map((segment) => {
      if (!/[\p{L}\p{M}]/u.test(segment)) return `<span aria-hidden="true">${segment.trim() ? escapeHtml(segment) : " "}</span>`;
      return `<span class="title-mask__word">${[...segment].map((letter) => `<span class="title-mask__letter">${solved ? escapeHtml(letter) : ""}</span>`).join("")}</span>`;
    }).join("")}
  </div>`;
}

function renderPuzzleText(entry, revealedWords, solved) {
  const revealed = new Set(revealedWords);
  return tokenizeText(entry.text).map((token) => {
    if (!token.isWord) return escapeHtml(token.value).replace(/\n/g, "<br>");
    if (solved || revealed.has(token.normalized)) return `<span class="revealed-word">${escapeHtml(token.value)}</span>`;
    return `<span class="masked-word" tabindex="0" style="--letters:${[...token.value].length}" data-length="${[...token.value].length}" aria-label="Mot masqué, ${[...token.value].length} lettres">${escapeHtml(token.value)}</span>`;
  }).join("");
}

function saveCurrentPedantix(saved, key) {
  savePedantixState(key, { ...saved, updatedAt: Date.now() });
}

function submitPedantixGuess(value) {
  const { entry, key, saved } = pedantixRuntime();
  const clean = String(value ?? "").trim();
  if (!clean) return;
  const normalized = normalizePhrase(clean);
  if (saved.guesses.some((guess) => normalizePhrase(guess.value) === normalized)) {
    showToast("Vous avez déjà proposé ce mot.");
    return;
  }
  const result = applyGuess(entry, clean, saved.revealedWords);
  saved.revealedWords = result.revealedWords;
  saved.won = result.titleSolved;
  saved.guesses.push({ value: clean, hits: result.hits, titleSolved: result.titleSolved, at: Date.now() });
  saveCurrentPedantix(saved, key);
  renderPedantix();
  if (result.titleSolved) showToast("Titre trouvé — belle déduction !");
  else if (result.hits) showToast(`${result.hits} occurrence${result.hits > 1 ? "s" : ""} révélée${result.hits > 1 ? "s" : ""}.`);
  else showToast("Aucune occurrence dans ce texte.");
  requestAnimationFrame(() => document.querySelector("#pedantix-guess")?.focus());
}

function revealPedantixHint() {
  const { entry, key, saved } = pedantixRuntime();
  const hint = chooseHint(entry, saved.revealedWords);
  if (!hint) {
    showToast("Tous les mots significatifs sont déjà révélés.");
    return;
  }
  saved.revealedWords = [...new Set([...saved.revealedWords, hint.normalized])];
  saved.hints += 1;
  saved.guesses.push({ value: hint.value, hits: 1, hint: true, at: Date.now() });
  saveCurrentPedantix(saved, key);
  renderPedantix();
  showToast(`Indice révélé : « ${hint.value} »`);
}

function teacherSubjects() {
  return state.data.semesters.flatMap((semester) => semester.subjects.map((subject) => ({
    ...subject,
    semesterLabel: semester.label,
  })));
}

function initializeTeacher() {
  const subject = teacherSubjects()[0];
  state.teacher.subjectId = subject?.id ?? "";
  state.teacher.id = suggestTeacherId(subject?.id);
}

function suggestTeacherId(subjectId) {
  const subject = teacherSubjects().find((entry) => entry.id === subjectId);
  const next = (subject?.questions.length ?? 0) + state.teacher.output.filter((question) => question.subjectId === subjectId).length + 1;
  return `${subjectId || "question"}_q${String(next).padStart(3, "0")}`;
}

function renderTeacher() {
  const subjects = teacherSubjects();
  const teacher = state.teacher;
  const output = teacher.output.length
    ? `[
${teacher.output.map(({ subjectId: _subjectId, ...question }) => JSON.stringify(question, null, 2)).join(",\n")}
]`
    : "";

  app.innerHTML = `
    <div class="page">
      <a class="back-link" href="#/home">← Retour à l’accueil</a>
      <div class="page-heading">
        <div>
          <p class="eyebrow">Utilitaire local</p>
          <h1>Outil enseignant</h1>
        </div>
        <p class="page-heading__side">Préparez des objets JSON valides à copier dans la banque de révision. Aucun fichier n’est modifié automatiquement.</p>
      </div>

      <div class="teacher-grid">
        <form id="teacher-form" class="panel">
          <div class="panel__header">
            <h3 style="margin:0">Nouvelle question</h3>
          </div>
          <div class="panel__body">
            <label class="field">
              <span>UE de destination</span>
              <select name="subjectId">
                ${subjects.map((subject) => `<option value="${escapeAttribute(subject.id)}"${subject.id === teacher.subjectId ? " selected" : ""}>${escapeHtml(subject.semesterLabel)} · ${escapeHtml(subject.label)}</option>`).join("")}
              </select>
            </label>
            <label class="field">
              <span>Identifiant</span>
              <input type="text" name="id" value="${escapeAttribute(teacher.id)}" spellcheck="false" required>
            </label>
            <label class="field">
              <span>Énoncé</span>
              <textarea name="prompt" placeholder="Saisissez la question…" required>${escapeHtml(teacher.prompt)}</textarea>
            </label>

            <div class="field">
              <span>Réponses possibles</span>
              <p class="field-note">Cochez chaque bonne réponse.</p>
              <div class="choice-editor">
                ${teacher.choices.map((choice, index) => `
                  <div class="choice-editor__row">
                    <span class="choice-editor__letter">${choice.id.toUpperCase()}</span>
                    <input type="text" name="choice-${index}" value="${escapeAttribute(choice.text)}" placeholder="Réponse ${choice.id.toUpperCase()}" required>
                    <label class="pill"><input type="checkbox" name="correct-${index}"${choice.correct ? " checked" : ""}> Correcte</label>
                  </div>
                `).join("")}
              </div>
              <div class="inline-actions" style="margin-top:10px">
                <button class="btn btn--outline btn--small" type="button" data-action="teacher-add-choice"${teacher.choices.length >= 7 ? " disabled" : ""}>＋ Ajouter</button>
                <button class="btn btn--ghost btn--small" type="button" data-action="teacher-remove-choice"${teacher.choices.length <= 2 ? " disabled" : ""}>Retirer</button>
              </div>
            </div>

            <label class="field">
              <span>Explication</span>
              <textarea name="explanation" placeholder="Pourquoi cette réponse est-elle correcte ?">${escapeHtml(teacher.explanation)}</textarea>
            </label>
          </div>
          <div class="panel__footer inline-actions">
            <button class="btn" type="submit">Ajouter à la sortie</button>
            <button class="btn btn--ghost" type="button" data-action="teacher-reset">Réinitialiser</button>
          </div>
        </form>

        <aside class="panel">
          <div class="panel__header">
            <div class="inline-actions" style="justify-content:space-between">
              <h3 style="margin:0">Sortie JSON</h3>
              <span class="pill">${teacher.output.length} question${teacher.output.length > 1 ? "s" : ""}</span>
            </div>
          </div>
          <div class="panel__body">
            <textarea class="code-output" readonly spellcheck="false" placeholder="Les questions générées apparaîtront ici…">${escapeHtml(output)}</textarea>
          </div>
          <div class="panel__footer inline-actions">
            <button class="btn btn--outline btn--small" type="button" data-action="teacher-copy"${output ? "" : " disabled"}>Copier</button>
            <button class="btn btn--ghost btn--danger btn--small" type="button" data-action="teacher-clear-output"${output ? "" : " disabled"}>Vider</button>
          </div>
        </aside>
      </div>
    </div>
  `;
}

function captureTeacherDraft() {
  const form = document.querySelector("#teacher-form");
  if (!form) return;
  const data = new FormData(form);
  state.teacher.subjectId = String(data.get("subjectId") ?? "");
  state.teacher.id = String(data.get("id") ?? "");
  state.teacher.prompt = String(data.get("prompt") ?? "");
  state.teacher.explanation = String(data.get("explanation") ?? "");
  state.teacher.choices = state.teacher.choices.map((choice, index) => ({
    ...choice,
    text: String(data.get(`choice-${index}`) ?? ""),
    correct: data.get(`correct-${index}`) === "on",
  }));
}

function submitTeacherQuestion() {
  captureTeacherDraft();
  const teacher = state.teacher;
  const id = teacher.id.trim().replace(/[^A-Za-z0-9_-]+/g, "_");
  const prompt = teacher.prompt.trim();
  const choices = teacher.choices.map((choice) => ({ ...choice, text: choice.text.trim() }));
  if (!id || !prompt || choices.some((choice) => !choice.text)) {
    showToast("Complétez l’identifiant, l’énoncé et toutes les réponses.");
    return;
  }
  if (!choices.some((choice) => choice.correct)) {
    showToast("Cochez au moins une bonne réponse.");
    return;
  }
  const payloadChoices = choices.map((choice) => choice.correct
    ? { id: choice.id, text: choice.text, correct: true }
    : { id: choice.id, text: choice.text });
  state.teacher.output.push({
    subjectId: teacher.subjectId,
    id,
    prompt,
    choices: payloadChoices,
    explanation: teacher.explanation.trim(),
  });
  state.teacher.id = suggestTeacherId(teacher.subjectId);
  state.teacher.prompt = "";
  state.teacher.explanation = "";
  state.teacher.choices = createTeacherChoices(teacher.choices.length);
  renderTeacher();
  showToast("Question ajoutée à la sortie JSON.");
}

async function copyTeacherOutput() {
  const output = document.querySelector(".code-output")?.value;
  if (!output) return;
  try {
    await navigator.clipboard.writeText(output);
    showToast("JSON copié dans le presse-papiers.");
  } catch {
    document.querySelector(".code-output")?.select();
    showToast("Sélectionnez puis copiez le JSON affiché.");
  }
}

function handleClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const route = currentRoute();

  if (action === "select-choice") selectChoice(route, button.dataset.choiceId);
  else if (action === "validate-answer") validateAnswer(route);
  else if (action === "next-question") route === "normal" ? advanceNormalQuestion() : advanceRevisionQuestion();
  else if (action === "finish-session") finishSession(route);
  else if (action === "quit-session") {
    event.preventDefault();
    if (route === "normal") state.normalSession = null;
    else state.revisionSession = null;
    renderRoute();
  } else if (action === "restart-session") {
    if (route === "normal") startNormalSession(state.normalConfig.theme, state.normalConfig.length);
    else startRevisionSession(state.revisionConfig.subjectIds, state.revisionConfig.length);
  } else if (action === "reset-profile") {
    if (window.confirm("Réinitialiser votre Elo et toutes les statistiques locales ?")) {
      state.profile = clearProfile();
      state.normalSession = null;
      renderNormal();
      showToast("Progression locale réinitialisée.");
    }
  } else if (action === "revision-select-all") {
    state.revisionConfig.subjectIds = new Set(currentSemester()?.subjects.map((subject) => subject.id) ?? []);
    renderRevisionConfig();
  } else if (action === "revision-clear") {
    state.revisionConfig.subjectIds = new Set();
    renderRevisionConfig();
  } else if (action === "pedantix-hint") revealPedantixHint();
  else if (action === "pedantix-give-up") {
    if (window.confirm("Révéler le texte et le titre de cette énigme ?")) {
      const { key, saved } = pedantixRuntime();
      saved.gaveUp = true;
      saveCurrentPedantix(saved, key);
      renderPedantix();
    }
  } else if (action === "pedantix-reset") {
    if (window.confirm("Effacer vos essais pour cette énigme ?")) {
      const { key } = pedantixRuntime();
      clearPedantixState(key);
      renderPedantix();
    }
  } else if (action === "pedantix-today") {
    initializePedantix();
    renderPedantix();
  } else if (action === "teacher-add-choice") {
    captureTeacherDraft();
    if (state.teacher.choices.length < 7) {
      state.teacher.choices.push({ id: String.fromCharCode(97 + state.teacher.choices.length), text: "", correct: false });
      renderTeacher();
    }
  } else if (action === "teacher-remove-choice") {
    captureTeacherDraft();
    if (state.teacher.choices.length > 2) {
      state.teacher.choices.pop();
      renderTeacher();
    }
  } else if (action === "teacher-reset") {
    state.teacher.id = suggestTeacherId(state.teacher.subjectId);
    state.teacher.prompt = "";
    state.teacher.explanation = "";
    state.teacher.choices = createTeacherChoices(4);
    renderTeacher();
  } else if (action === "teacher-copy") copyTeacherOutput();
  else if (action === "teacher-clear-output") {
    if (window.confirm("Vider toute la sortie JSON ?")) {
      state.teacher.output = [];
      renderTeacher();
    }
  }
}

function handleChange(event) {
  if (event.target.matches('[data-action="revision-semester"]')) {
    state.revisionConfig.semesterId = event.target.value;
    state.revisionConfig.subjectIds = new Set(currentSemester()?.subjects.map((subject) => subject.id) ?? []);
    renderRevisionConfig();
  } else if (event.target.matches('#revision-config-form input[name="subjects"]')) {
    const subjectId = event.target.value;
    if (event.target.checked) state.revisionConfig.subjectIds.add(subjectId);
    else state.revisionConfig.subjectIds.delete(subjectId);
    renderRevisionConfig();
  } else if (event.target.matches('[data-action="pedantix-archive"]')) {
    state.pedantixIndex = Number(event.target.value) || 0;
    state.pedantixExactDate = state.data.pedantix[state.pedantixIndex]?.date === todayIso();
    renderPedantix();
  }
}

function handleSubmit(event) {
  if (event.target.id === "normal-config-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    startNormalSession(String(data.get("theme") ?? "all"), Number(data.get("length")) || 0);
  } else if (event.target.id === "revision-config-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    const subjectIds = new Set(data.getAll("subjects").map(String));
    const length = Number(data.get("length")) || 0;
    startRevisionSession(subjectIds, length);
  } else if (event.target.id === "pedantix-guess-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    submitPedantixGuess(data.get("guess"));
  } else if (event.target.id === "teacher-form") {
    event.preventDefault();
    submitTeacherQuestion();
  }
}

function handleKeyboard(event) {
  const tagName = document.activeElement?.tagName;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(tagName)) return;
  const route = currentRoute();
  if (!["normal", "revision"].includes(route)) return;
  const session = route === "normal" ? state.normalSession : state.revisionSession;
  if (!session?.current || session.complete) return;
  if (/^[1-7]$/.test(event.key) && !session.locked) {
    const choice = session.current.choices[Number(event.key) - 1];
    if (choice) {
      event.preventDefault();
      selectChoice(route, choice.id);
    }
  } else if (event.key === "Enter") {
    event.preventDefault();
    if (session.locked) route === "normal" ? advanceNormalQuestion() : advanceRevisionQuestion();
    else if (session.selectedIds.size) validateAnswer(route);
  }
}

function renderLoadError(error) {
  app.innerHTML = `
    <div class="page page--compact">
      <section class="error-state">
        <div class="error-state__icon" aria-hidden="true">!</div>
        <p class="eyebrow">Chargement interrompu</p>
        <h2>Les banques de questions sont introuvables.</h2>
        <p class="muted">${escapeHtml(error?.message || "Une erreur inconnue s’est produite.")}</p>
        <button class="btn" type="button" onclick="window.location.reload()">Réessayer</button>
      </section>
    </div>
  `;
}

async function boot() {
  try {
    state.data = await loadPlantQuizData();
    initializeRevisionConfig();
    initializePedantix();
    initializeTeacher();
    app.addEventListener("click", handleClick);
    app.addEventListener("change", handleChange);
    app.addEventListener("submit", handleSubmit);
    window.addEventListener("hashchange", () => renderRoute({ focus: true }));
    window.addEventListener("keydown", handleKeyboard);
    if (!window.location.hash) window.location.hash = "#/home";
    else renderRoute();
  } catch (error) {
    console.error(error);
    renderLoadError(error);
  }
}

boot();
