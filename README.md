# PlantQuizz

Projet de M2 de : Louis GRARD, Alan GAUBERT, Léo Giornelli, Steven CHARMANT et Mathieu.

Contact (questions techniques sur le site) : Louis GRARD – grard.louis34@gmail.com

PlantQuizz est un quiz web centré sur les sciences du végétal. Il propose deux modes complémentaires :

- **Quiz normal** – suit un système Elo qui adapte la difficulté des questions en fonction de vos réponses.
- **Quiz révision** – permet de travailler des UE précises sans impact sur l’Elo et d’accéder à l’historique des questions déjà vues.

Le site est accessible en ligne sur [https://edezi.github.io/plantquizz/](https://edezi.github.io/plantquizz/) et peut également être ouvert localement en lançant `index.html` dans un navigateur moderne.

## Fonctionnement du système Elo

En mode **Quiz normal**, chaque bonne réponse augmente votre Elo et déverrouille des questions plus exigeantes. Une mauvaise réponse fait légèrement baisser l’Elo, ce qui recentre la difficulté autour de votre niveau actuel. Les indicateurs affichés à l’écran sont :

- **Elo** – estimation de votre maîtrise actuelle.
- **↕️ Régler Elo** – permet de fixer manuellement votre point de départ.
- **Q** – nombre de questions déjà posées lors de la session.
- **Bonnes** – total des réponses correctes.
- **Streak** – série de bonnes réponses consécutives.

Ces compteurs sont masqués en mode Révision (sauf `Q` et `Bonnes`) afin de ne pas mélanger apprentissage ciblé et suivi de performance.

## Modes de jeu

### Quiz normal
- Sélectionnez un ensemble d’UE à la volée ou laissez le mode automatique.
- Répondez pour faire évoluer votre Elo et accéder à des questions plus avancées.
- Servez-vous de l’indicateur `Streak` pour suivre votre dynamique.

### Quiz révision
- Choisissez un semestre puis les UE (obligatoires ou optionnelles) que vous souhaitez réviser.
- Les questions sont tirées sans impact sur votre Elo.
- Un bouton **Historique** permet de rouvrir les questions déjà posées avec leur correction.
- Les statistiques se limitent à `Q` et `Bonnes` pour un retour rapide sur votre progression.

## Guide enseignant – outil prof

L’outil prof est intégré directement à la page d’accueil afin de faciliter la contribution des équipes pédagogiques. Il génère automatiquement le JSON attendu pour le mode Révision.

### 1. Ouvrir l’outil
- Cliquez sur le bouton **« Outil prof »** en bas à droite de l’interface.
- La fenêtre flottante peut être refermée à tout moment avec **« Fermer »**.

### 2. Sélectionner la matière
- Le menu déroulant **Matière** liste les UE disponibles pour le semestre courant.
- Si la matière souhaitée n’existe pas encore, ajoutez-la manuellement dans `data/questions_revision.json` (voir ci-dessous) puis rechargez la page.

### 3. Renseigner la question
1. Saisissez l’énoncé dans le champ **Question**.
2. Remplissez les quatre propositions dans les champs A, B, C, D (les intitulés peuvent être libres, mais quatre réponses sont nécessaires).
3. Cochez la réponse correcte à l’aide du bouton radio situé à gauche de l’option correspondante.
4. (Optionnel) Ajoutez une explication dans **Complément** pour fournir un feedback aux étudiants.

### 4. Générer et récupérer le JSON
- Cliquez sur **Ajouter** : l’outil produit une ligne JSON compactée conforme au format de `questions_revision.json`.
- Plusieurs questions peuvent être ajoutées successivement ; chacune apparaît sur une ligne séparée dans la zone de sortie.
- Utilisez **Réinitialiser** pour vider les champs si besoin (la sortie reste inchangée).

### 5. Intégrer les questions dans `data/questions_revision.json`
1. Ouvrez le fichier `data/questions_revision.json` avec votre éditeur préféré.
2. Repérez le semestre (`rev.semesters`) puis la matière (`subjects`) concernée.
3. Collez les nouvelles lignes JSON dans le tableau `questions` correspondant. Chaque question doit rester sur **une seule ligne** pour rester compatible avec les outils d’import.
4. Vérifiez que chaque entrée respecte la structure suivante :
   ```json
   {"id":"UE_identifiant_unique","level":1,"prompt":"Texte de la question ?","choices":[{"id":"a","text":"Réponse A","correct":true},{"id":"b","text":"Réponse B"},{"id":"c","text":"Réponse C"},{"id":"d","text":"Réponse D"}],"explanation":"Optionnel : explication"}
   ```
5. Enregistrez le fichier puis rechargez la page pour vérifier que les questions apparaissent correctement.

### 6. Ajouter ou modifier des UE
- Pour ajouter une nouvelle UE, insérez un objet dans le tableau `subjects` du semestre concerné :
  ```json
  {"id":"S7_nouvelle_ue","label":"Nom de l’UE","type":"core","questions":[]}
  ```
  - `type` accepte `core` (tronc commun) ou `elective` (option).
  - Le champ `questions` doit contenir les questions générées avec l’outil prof.
- Pour modifier l’intitulé affiché dans l’interface, ajustez simplement la valeur de `label`.

## Structure du projet
- `index.html` – page principale contenant l’interface, la logique du quiz et l’outil prof.
- `data/questions_normal.json` – banque de questions utilisée par le mode Quiz normal et le système Elo.
- `data/questions_revision.json` – catalogue structuré par semestre et UE pour le mode Révision.
- `data/pedantix_daily.json` – textes annexes utilisés par certaines fonctionnalités d’entraînement.

## Contribution et maintenance
- Les contributions se font principalement en ajoutant ou en corrigeant des questions dans les fichiers JSON.
- Pensez à conserver des identifiants (`id`) uniques pour chaque question afin d’éviter les doublons pendant l’import.
- Pour vérifier les changements, ouvrez `index.html` localement et testez les modes Normal et Révision.
