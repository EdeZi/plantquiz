import test from "node:test";
import assert from "node:assert/strict";
import {
  createRevisionSet,
  evaluateSelection,
  expectedScore,
  ratingToLevel,
  updateRating,
} from "../assets/js/quiz-engine.js";

test("ratingToLevel couvre les six niveaux", () => {
  assert.equal(ratingToLevel(800), 1);
  assert.equal(ratingToLevel(1000), 2);
  assert.equal(ratingToLevel(1800), 6);
});

test("une bonne réponse augmente le rating et une erreur le réduit", () => {
  const win = updateRating({ rating: 1000, questionLevel: 3, correct: true, answered: 20 });
  const loss = updateRating({ rating: 1000, questionLevel: 1, correct: false, answered: 20 });
  assert.ok(win.delta > 0);
  assert.ok(loss.delta < 0);
  assert.ok(expectedScore(1000, 1) > expectedScore(1000, 4));
});

test("un QCM exige exactement toutes les bonnes réponses", () => {
  const question = {
    choices: [
      { id: "a", correct: true },
      { id: "b", correct: true },
      { id: "c", correct: false },
    ],
  };
  assert.equal(evaluateSelection(question, new Set(["a", "b"])).correct, true);
  assert.equal(evaluateSelection(question, new Set(["a"])).correct, false);
  assert.equal(evaluateSelection(question, new Set(["a", "b", "c"])).correct, false);
});

test("une session de révision est limitée sans modifier la banque", () => {
  const source = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const session = createRevisionSet(source, 2, () => 0.5);
  assert.equal(session.length, 2);
  assert.deepEqual(source, [{ id: 1 }, { id: 2 }, { id: 3 }]);
});
