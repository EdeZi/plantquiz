# PlantQuiz

**PlantQuiz** est une application web interactive destinée aux étudiant·e·s en biologie végétale.  
Elle propose trois modes complémentaires (Quiz adaptatif, Révision ciblée et Pédantix végétal) pour réviser les notions du parcours Biologie Végétale de Montpellier de manière ludique et progressive.

Projet de M2 de : **Louis GRARD, Alan GAUBERT, Léo Giornelli, Steven CHARMANT et Mathieu DRUENNE.**

Contact (questions techniques sur le site) :  
**Louis GRARD – grard.louis34@gmail.com**

PlantQuiz est un quiz web centré sur les sciences du végétal. Il propose trois modules complémentaires :

- **Quiz normal** – suit un système Elo qui adapte la difficulté des questions en fonction de vos réponses.
- **Quiz révision** – permet de travailler des UE précises sans impact sur l’Elo et d’accéder à l’historique des questions déjà vues.
- **Pédantix végétal** – variante façon « texte masqué » : tapez des mots pour dévoiler le contenu et devinez le titre.

Le site est accessible en ligne sur :  
👉 [https://edezi.github.io/plantquiz/](https://edezi.github.io/plantquiz/)  
(le dépôt GitHub correspondant est `EdeZi/plantquiz`)  

Le projet peut également être ouvert **en local** en lançant simplement `index.html` dans un navigateur moderne.

---

## 🧰 Technologies utilisées

- **Langages** : HTML5, CSS3, JavaScript (sans framework)
- **Données** : fichiers JSON locaux (dossier `data/`)
- **Déploiement** : GitHub Pages – [`https://edezi.github.io/plantquiz/`](https://edezi.github.io/plantquiz/)
- **Versionnement** : Git & GitHub (`main` comme branche principale)

---

## Fonctionnement du système Elo

En mode **Quiz normal**, chaque bonne réponse augmente votre Elo et déverrouille des questions plus exigeantes.  
Une mauvaise réponse fait légèrement baisser l’Elo, ce qui recentre la difficulté autour de votre niveau actuel.

Les indicateurs affichés à l’écran sont :

- **Elo** – estimation de votre maîtrise actuelle.
- **↕️ Régler Elo** – permet de fixer manuellement votre point de départ.
- **Q** – nombre de questions déjà posées lors de la session.
- **Bonnes** – total des réponses correctes.
- **Streak** – série de bonnes réponses consécutives.

Ces compteurs sont masqués en mode Révision (sauf `Q` et `Bonnes`) afin de ne pas mélanger apprentissage ciblé et suivi de performance.

---

## Modes de jeu

### Quiz normal

- Répondez pour faire évoluer votre Elo et accéder à des questions plus avancées.
- Certaines questions peuvent comporter plusieurs bonnes réponses : sélectionnez toutes les propositions pertinentes puis utilisez le bouton **« Valider la sélection »** avant de passer à la question suivante.

### Quiz révision

- Choisissez un semestre puis les UE (obligatoires ou optionnelles) que vous souhaitez réviser.
- Les questions sont tirées sans impact sur votre Elo.
- Un bouton **« Historique »** permet de rouvrir les questions déjà posées avec leur correction.
- Les statistiques se limitent à `Q` et `Bonnes` pour un retour rapide sur votre progression.

### Pédantix végétal

- Accédez au module via la carte dédiée sur la page d’accueil.
- Chaque jour, un texte thématique est masqué : saisissez des mots pour révéler les occurrences correspondantes.
- L’objectif est de retrouver le **titre caché** ; un bouton **« Indice »** révèle progressivement des mots si besoin.
- Les essais sont listés pour faciliter la stratégie et le suivi de vos hypothèses.

---

## Guide enseignant – outil prof

La **vidéo tuto** est ici : https://youtu.be/wGEtw88RgNA

L’outil prof est accessible via le bouton **« Outil prof »** présent dans la barre supérieure.  
Il ouvre une page dédiée et génère automatiquement le JSON attendu pour le mode Révision.  
Utilisez le bouton **« Retour »** de la navigation pour revenir à l’accueil.

### 1. Ouvrir l’outil

- Cliquez sur le bouton **« Outil prof »** dans la barre supérieure.
- La page affiche le générateur ; vous pouvez revenir à l’accueil avec **« Retour »**.

### 2. Sélectionner la matière

- Le menu déroulant **« Matière »** liste les UE disponibles pour le semestre courant.
- Si la matière souhaitée n’existe pas encore, ajoutez-la manuellement dans `data/questions_revision.json` (voir ci-dessous) puis rechargez la page.

### 3. Renseigner la question

1. Saisissez l’énoncé dans le champ **« Question »**.
2. Ajoutez entre deux et cinq propositions (boutons **« + Ajouter une option »** / **« − Retirer la dernière option »**). Les intitulés sont libres.
3. Cochez toutes les réponses correctes à l’aide des cases à cocher situées à gauche de chaque proposition (une ou plusieurs réponses peuvent être justes).
4. (Optionnel) Ajoutez une explication dans **« Complément »** pour fournir un feedback aux étudiants.

### 4. Générer et récupérer le JSON

- Cliquez sur **« Ajouter »** : l’outil produit une ligne JSON compactée conforme au format de `questions_revision.json`.
- Plusieurs questions peuvent être ajoutées successivement ; chacune apparaît sur une ligne séparée dans la zone de sortie.
- Utilisez **« Réinitialiser »** pour vider les champs si besoin (la sortie reste inchangée).

### 5. Intégrer les questions dans `data/questions_revision.json`

1. Ouvrez le fichier `data/questions_revision.json` avec votre éditeur préféré.
2. Repérez le semestre (`rev.semesters`) puis la matière (`subjects`) concernée.
3. Collez les nouvelles lignes JSON dans le tableau `questions` correspondant.  
   Chaque question doit rester sur **une seule ligne** pour rester compatible avec les outils d’import.
4. Vérifiez que chaque entrée respecte la structure suivante :

   ```json
   {"id":"UE_identifiant_unique","level":1,"prompt":"Texte de la question ?","choices":[{"id":"a","text":"Réponse A","correct":true},{"id":"b","text":"Réponse B","correct":true},{"id":"c","text":"Réponse C"},{"id":"d","text":"Réponse D"}],"explanation":"Optionnel : explication"}
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

---

## Structure du projet

- `index.html` – page principale contenant l’interface, la logique du quiz et l’outil prof.
- `data/questions_normal.json` – banque de questions utilisée par le mode Quiz normal et le système Elo.
- `data/questions_revision.json` – catalogue structuré par semestre et UE pour le mode Révision.
- `data/pedantix_daily.json` – textes annexes utilisés par certaines fonctionnalités d’entraînement.

---

## 🔐 Accès et gestion du dépôt

- Le projet est hébergé sur GitHub : [`https://github.com/EdeZi/plantquiz`](https://github.com/EdeZi/plantquiz).
- Les collaborateur·rice·s invité·e·s disposent d’un accès **Write** : ils peuvent modifier le code, ajouter des questions ou corriger des erreurs.
- La configuration du dépôt (règles, protection de branche, suppression) est gérée par l’administrateur principal (**Louis GRARD**).
- La branche principale `main` est **protégée contre la suppression accidentelle** et les `push --force`.

---

## Contribution et maintenance

- Les contributions se font principalement en ajoutant ou en corrigeant des questions dans les fichiers JSON du dossier `data/`.
- Pour vérifier les changements, ouvrez `index.html` localement et testez les modes **Quiz normal** et **Révision**.
