# PlantQuiz

![PlantQuiz — Cultivez vos connaissances](./assets/og-card.png)

> **Statut du projet — version finale.** PlantQuiz est un projet pédagogique réalisé en 2025. En 2026, les progrès des outils d’intelligence artificielle ont été mis à profit pour lui apporter rapidement et efficacement un dernier coup de fraîcheur : moderniser son apparence, remettre au propre sa présentation et surtout structurer la documentation afin de faciliter sa transmission à d’autres étudiants. Il ne s’agit pas d’un redéveloppement du projet ni d’une refonte de ses contenus, mais d’une dernière passe de finition destinée à le clore et à le présenter proprement. Les banques de questions existantes ont été conservées.

**PlantQuiz** est une application web de révision consacrée à la biologie végétale. Elle rassemble un quiz adaptatif, des sessions ciblées par semestre et un Pédantix végétal dans une interface légère, responsive et sans compte utilisateur.

🌿 **[Ouvrir PlantQuiz](https://edezi.github.io/plantquiz/)** · 📘 **[Comprendre et reprendre le projet](./docs/GUIDE-DE-REPRISE.md)** · 🎥 **[Tutoriel de l’outil enseignant](https://youtu.be/wGEtw88RgNA)**

## Contenu disponible

| Mode | Contenu |
| --- | ---: |
| Défi Elo | 991 questions, réparties sur 6 niveaux |
| Révision ciblée | 792 questions, réparties dans 7 UE |
| Pédantix végétal | 200 énigmes |

La banque de révision contient actuellement :

| Semestre | UE | Questions | Remarque |
| --- | ---: | ---: | --- |
| S5 | 1 | 138 | Développement des plantes |
| S6 | 1 | 3 | Aperçu d’Autotrophie, encore signalé « BIENTÔT » dans la banque |
| S7 | 5 | 651 | Cinq UE substantielles |

Aucun semestre n’est vide. Le S6 est toutefois un aperçu très court ; il est conservé pour ne pas modifier la banque d’origine. Le nombre de « matières terminées » n’est pas affiché, car la donnée source ne fournit pas de statut de complétion fiable pour chaque UE.

## Les modes de jeu

### Défi Elo

Le niveau évolue après chaque réponse. Le moteur privilégie les questions proches du niveau estimé, présente progressivement les nouvelles notions et repropose les thèmes moins bien maîtrisés.

- sessions de 10, 20 questions ou durée libre ;
- prise en charge des QCU, QCM et Vrai/Faux ;
- progression conservée localement dans le navigateur ;
- aucune inscription et aucune donnée envoyée à un serveur.

### Révision ciblée

Le mode Révision permet de choisir un semestre, une ou plusieurs unités d’enseignement et une durée de session. Il ne modifie jamais le score Elo.

- sessions de 5, 10, 20 questions ou banque complète ;
- nombre de questions indiqué pour chaque UE ;
- bilan final avec les erreurs, les réponses attendues et les explications.

### Pédantix végétal

Un titre est masqué ainsi que le texte qui le décrit. Chaque proposition révèle les occurrences correspondantes et certaines formes françaises proches.

- énigme quotidienne déterministe, même après la dernière date de la banque ;
- archives accessibles par date ;
- indices, progression, abandon et reprise après rechargement ;
- état sauvegardé uniquement sur l’appareil.

### Outil enseignant

Un générateur aide à préparer de nouvelles questions au bon format JSON. Il produit un bloc à copier manuellement et ne modifie aucun fichier du dépôt.

## Statistiques et confidentialité

Les statistiques visibles sur l’accueil sont sauvegardées dans le `localStorage` du navigateur :

- l’**Elo** et le niveau estimé dépendent uniquement du Défi Elo ;
- les **questions répondues** additionnent le Défi et la Révision ;
- la **précision cumulée** additionne également ces deux modes.

Un simple rechargement de la page ne remet donc pas les compteurs à zéro. Ils sont réinitialisés si l’utilisateur efface les données du site, utilise un autre navigateur ou appareil, ou navigue dans un mode privé qui ne conserve pas le stockage.

## Choix techniques

PlantQuiz reste volontairement simple à héberger et à reprendre :

- HTML5, CSS3 et JavaScript moderne sans framework ;
- modules JavaScript séparés par responsabilité ;
- aucune dépendance de production ;
- données stockées dans trois fichiers JSON lisibles ;
- stockage local pour la progression ;
- déploiement direct avec GitHub Pages ;
- tests basés uniquement sur le moteur de test intégré à Node.js.

## Lancer le projet localement

Node.js 22 ou une version récente suffit :

```bash
git clone https://github.com/EdeZi/plantquiz.git
cd plantquiz
npm run serve
```

Ouvrez ensuite [http://127.0.0.1:4173](http://127.0.0.1:4173).

## Vérifier le projet

```bash
npm run check
```

Cette commande contrôle la structure des trois banques JSON, exécute les tests des moteurs de jeu et vérifie la syntaxe du fichier principal.

## Structure

```text
plantquiz/
├── assets/
│   ├── js/
│   │   ├── app.js                # écrans, navigation et interactions
│   │   ├── data.js               # chargement et normalisation des banques
│   │   ├── pedantix-engine.js    # moteur de révélation et sélection quotidienne
│   │   ├── quiz-engine.js        # sélection adaptative et calcul Elo
│   │   └── storage.js            # progression locale
│   ├── og-card.png               # aperçu pour les partages
│   └── styles.css                # identité visuelle et responsive
├── data/
│   ├── pedantix_daily.json
│   ├── questions_normal.json
│   └── questions_revision.json
├── docs/
│   └── GUIDE-DE-REPRISE.md       # documentation accessible pour reprendre le projet
├── scripts/
│   ├── serve.mjs
│   └── validate-data.mjs
├── tests/
├── index.html
└── package.json
```

## Transmission et réutilisation

Le dépôt est public et peut être partagé comme support d’apprentissage avec des étudiants souhaitant comprendre, adapter ou prolonger une petite application web pédagogique. Le [guide de reprise](./docs/GUIDE-DE-REPRISE.md) explique où intervenir et comment éviter de casser les données.

Un dépôt public n’accorde toutefois pas automatiquement une licence de réutilisation. Aucune licence juridique n’est actuellement déclarée. Avant une republication ou une réutilisation dans un autre produit, les auteurs doivent choisir ensemble une licence pour le code et pour les contenus pédagogiques.

## Origine du projet

Projet de M2 réalisé par **Louis Grard, Alan Gaubert, Léo Giornelli, Steven Charmant et Mathieu Druenne** pour le parcours Biologie Végétale de Montpellier.
