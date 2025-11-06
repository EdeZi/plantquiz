# PlantQuiz

**PlantQuiz** est une application web interactive destinée aux étudiant·e·s en biologie végétale. Elle réunit plusieurs outils de révision autour du parcours Biologie Végétale de Montpellier dans une interface unique et légère.

🎥 **Tutoriel enseignant (outil prof)** : https://youtu.be/wGEtw88RgNA

Projet de M2 de : **Louis GRARD, Alan GAUBERT, Léo Giornelli, Steven CHARMANT et Mathieu DRUENNE.**

Contact (questions techniques sur le site) :
**Louis GRARD – grard.louis34@gmail.com**

---

## Accès

- **En ligne** : 👉 https://edezi.github.io/plantquiz/
- **En local** : ouvrir simplement `index.html` dans un navigateur moderne (Chrome, Firefox, Edge, Safari…)

Le dépôt GitHub correspondant est [`EdeZi/plantquiz`](https://github.com/EdeZi/plantquiz).

---

## Modules proposés

### Quiz normal (adaptatif)

- Banque de questions : `data/questions_normal.json` (jeu de démonstration intégré si le fichier est absent).
- Difficulté pilotée par un Elo sur 6 niveaux : chaque bonne réponse augmente le score et débloque des questions plus exigeantes.
- Les indicateurs affichés sont : `Elo` (score courant), `Q` (questions posées), `Bonnes` (réponses correctes), `Streak` (série de bonnes réponses).
- Les questions à choix multiples nécessitent de sélectionner toutes les bonnes réponses puis de valider.
- Un boost est appliqué sur les premières questions pour accélérer le calibrage.

### Quiz révision (par semestre)

- Sélectionne un semestre (S5 à S9) puis coche des UE tronc commun ou optionnelles.
- Aucune influence sur l’Elo : les statistiques se limitent à `Q` et `Bonnes`.
- Le bouton **Historique** ouvre, à la demande, un panneau listant les questions déjà vues avec la correction et les explications.
- Les questions proviennent de `data/questions_revision.json` organisé par semestre et UE.

### Pédantix végétal

- Texte quotidien tiré de `data/pedantix_daily.json`. À défaut d’entrée pour la date du jour, la première entrée du fichier est utilisée.
- Tape des mots pour dévoiler leurs occurrences : les formes conjuguées et les accords sont reconnus grâce à un lemmatiseur interne.
- L’objectif est de trouver le titre masqué (`target`). Le bouton **Réinitialiser du jour** recharge le texte pour retenter sa chance.
- Le panneau **ℹ️ Info** rappelle les règles et peut être ouvert/fermé à volonté.

### Outil prof (générateur JSON)

- Accessible via le bouton **« Outil prof »** dans la barre supérieure.
- Permet de sélectionner une UE, saisir l’identifiant de la question, l’énoncé, les réponses (2 à 5) et l’explication facultative.
- Le bouton **« Ajouter »** génère une ligne JSON prête à être copiée dans `data/questions_revision.json` (une ligne par question).
- **« Réinitialiser »** vide les champs, tandis que **« 🧹 Vider la sortie »** nettoie la zone d’export sans effacer les questions déjà générées.
- Utiliser **« Retour »** dans la barre supérieure pour revenir à l’accueil.

#### Tutoriel écrit : ajouter une question en tant que prof

1. Ouvrir PlantQuiz et cliquer sur **« Outil prof »** dans la barre supérieure.
2. Choisir dans la liste déroulante l’UE qui recevra la nouvelle question.
3. Remplir les champs :
   - **Identifiant** (ex. `S6_autotrophie_q1`) en respectant le format utilisé pour le semestre et la matière.
   - **Niveau** entre 1 et 6 pour indiquer la difficulté.
   - **Énoncé** de la question.
   - **Réponses** : au moins deux propositions, cocher celles qui sont correctes.
   - **Explication** (facultative) affichée après la correction.
4. Cliquer sur **« Ajouter »** : la zone d’export en bas de page affiche la question générée sous forme de ligne JSON.
5. Copier cette ligne et la coller dans le tableau `questions` de la matière correspondante dans `data/questions_revision.json` (une question = une ligne).
6. Sauvegarder le fichier JSON, recharger PlantQuiz et vérifier dans le module Révision que la question apparaît correctement.

---

## Données & structure du projet

- `index.html` – interface principale et logique JavaScript.
- `data/questions_normal.json` – questions du quiz adaptatif (niveaux 1 à 6).
- `data/questions_revision.json` – questions triées par semestre (`semesters`) puis par matières (`subjects`). Chaque matière contient :
  - `id` (identifiant unique), `label` (intitulé affiché), `type` (`core` ou `elective`) et `questions` (tableau de questions).
  - Une question type :
    ```json
    { "id": "S6_autotrophie_q1", "level": 2, "prompt": "Texte de la question ?", "choices": [ { "id": "a", "text": "Réponse A", "correct": true }, { "id": "b", "text": "Réponse B" } ], "explanation": "Optionnel : explication" }
    ```
- `data/pedantix_daily.json` – liste datée (`date`, `target`, `text`) pour le module Pédantix.

---

## Technologies utilisées

- **HTML5 / CSS3 / JavaScript** sans framework.
- **Données locales** : fichiers JSON servis depuis le dossier `data/` (chargés via `fetch` ou XHR de secours).
- **Stockage local** : statistiques des questions normalisées conservées dans `localStorage` (`plantquiz.stats.v2`).
- **Déploiement** : GitHub Pages (`main` comme branche principale).

---

## Contribution

1. Mettre à jour les fichiers JSON dans `data/` pour ajouter ou corriger des questions.
2. Ouvrir `index.html` localement pour tester les trois modules.
3. Vérifier que les nouveaux identifiants de question sont uniques et cohérents.
4. Conserver une question par ligne dans les fichiers JSON afin de rester compatible avec l’outil prof.

---

## Caractéristiques techniques (ordre alphabétique)

- **Archivage local des stats** : chaque question répondue en mode normal conserve nombre de vues, bonnes réponses et Elo associé dans `localStorage` pour améliorer la sélection future.
- **Boost de début de partie** : les 12 premières questions du mode normal bénéficient d’un multiplicateur de gain (`x1,5`) pour accélérer le calibrage.
- **Calibrage des niveaux** : la progression Elo repose sur un pas de 120 points. Les niveaux disponibles sont 1 à 6 et le score est toujours arrondi sur un niveau réellement présent dans la banque de questions.
- **Disponibilité hors ligne** : si `data/questions_normal.json` est inaccessible, un petit jeu de démonstration embarqué permet malgré tout de lancer le quiz normal.
- **Historique de révision** : un panneau modal regroupe les réponses données en mode Révision (question, réponse choisie, correction, explication) tant que la session n’est pas réinitialisée.
- **Lemmatiseur Pédantix** : les essais sont comparés en supprimant les accents, en générant des variantes genre/nombre et en ramenant les verbes à leur infinitif pour dévoiler un maximum d’occurrences pertinentes.
- **Malus progressif** : une erreur en mode normal soustrait un malus dépendant du niveau de la question (jusqu’à 28 points au niveau 6) pour recentrer la difficulté.
- **Sélection anti-répétition** : un tampon de 40 identifiants empêche de reposer immédiatement les mêmes questions ; en cas d’erreur, la question peut réapparaître après un court délai.

---

Bonne révision !
