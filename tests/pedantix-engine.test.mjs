import test from "node:test";
import assert from "node:assert/strict";
import {
  applyGuess,
  guessMatchesWord,
  normalizePhrase,
  normalizeWord,
  puzzleProgress,
  selectDailyEntry,
  tokenizeText,
} from "../assets/js/pedantix-engine.js";

const entry = {
  date: "2026-01-01",
  target: "Croissance végétale",
  text: "Les plantes croissent. La croissance dépend de la lumière.",
};

test("la normalisation française ignore accents et ponctuation", () => {
  assert.equal(normalizeWord("Végétale"), "vegetale");
  assert.equal(normalizePhrase("  Croissance — VÉGÉTALE ! "), "croissance vegetale");
});

test("la correspondance légère relie singulier, pluriel et formes proches", () => {
  assert.equal(guessMatchesWord("plante", "plantes"), true);
  assert.equal(guessMatchesWord("croître", "croissent"), false);
  assert.equal(guessMatchesWord("lumière", "lumière"), true);
});

test("une proposition révèle toutes ses occurrences", () => {
  const result = applyGuess(entry, "croissance", []);
  assert.equal(result.hits, 1);
  assert.ok(result.revealedWords.includes("croissance"));
  assert.ok(puzzleProgress(entry, result.revealedWords).percentage > 0);
});

test("le titre complet résout l’énigme", () => {
  const result = applyGuess(entry, "croissance vegetale", []);
  assert.equal(result.titleSolved, true);
  assert.equal(puzzleProgress(entry, result.revealedWords).percentage, 100);
});

test("la sélection quotidienne utilise la date exacte ou une rotation stable", () => {
  const entries = [entry, { ...entry, date: "2026-01-02", target: "Auxine" }];
  assert.equal(selectDailyEntry(entries, "2026-01-02").entry.target, "Auxine");
  assert.equal(selectDailyEntry(entries, "2027-01-01").index, selectDailyEntry(entries, "2027-01-01").index);
});

test("la tokenisation conserve mots et séparateurs", () => {
  const tokens = tokenizeText("L’auxine agit.");
  assert.equal(tokens.filter((token) => token.isWord).length, 3);
});
