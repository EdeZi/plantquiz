# Plan de génération pour la banque de questions

## Contexte et contraintes
- Le moteur adapte la difficulté via un Elo ancré qui cible un niveau flottant puis échantillonne dans une fenêtre ±0,6 à ±2,5 autour de la cible, avec mémo des 40 dernières questions pour limiter les répétitions.【F:index.html†L405-L520】
- Une séquence de calibration impose 6 questions initiales aux niveaux 3 à 8, d'où la nécessité de stocks confortables à ces niveaux.【F:index.html†L364-L372】【F:index.html†L536-L547】
- Aujourd'hui, seuls 127 items existent, concentrés sur les niveaux 1 à 10 avec un déficit total aux niveaux 11-12.【F:data/questions_normal.json†L1-L127】

## Volumes recommandés
### Palier 320 questions (déjà validé)
Pour une expérience fluide sans retombées fréquentes sur des questions déjà vues, viser **≈300 à 320 questions** réparties comme suit (≥40 items autour du coeur de distribution afin que `recentIds` n'épuise pas la réserve) :

| Niveau | Focus attendu | Volume cible |
| --- | --- | --- |
| 1 | Culture G scientifique grand public | 32 |
| 2 | Culture G scientifique + anecdotes végétales simples | 32 |
| 3 | Biologie générale, écologie, notions de botanique basique | 36 |
| 4 | Anatomie végétale introductive, physiologie simple | 34 |
| 5 | Structures végétatives, reproduction, adaptabilité | 32 |
| 6 | Biochimie végétale de base, photosynthèse détaillée | 32 |
| 7 | Physiologie avancée, signaux, interactions biotiques | 28 |
| 8 | Agronomie, pathologie, écophysiologie ciblée plantes | 26 |
| 9 | Génétique végétale, amélioration des plantes | 24 |
| 10 | Biotechnologies, métabolisme secondaire, stress | 24 |
| 11 | Recherche actuelle en biologie végétale, articles de synthèse | 10 |
| 12 | Études de cas complexes, intégration multi-disciplinaire | 10 |

> 🛈 Les niveaux 1-2 sont conservés pour les phases de calibration et pour les profils très novices. Ils peuvent être partiellement réutilisés dans des modes « entraînement express ».

### Palier 600 questions
Objectif : permettre des sessions longues (≥120 questions) sans répétition, même pour des joueurs réguliers.

| Niveau | Volume cible | Ajustements de contenu |
| --- | --- | --- |
| 1 | 48 | Réserve de curiosités scientifiques + vulgarisation végétale pour onboarding rapide |
| 2 | 60 | Introduire des anecdotes botaniques et agroalimentaires faciles |
| 3 | 72 | Consolider les bases d’écophysiologie, cycles de vie, adaptations |
| 4 | 66 | Cas pratiques simples (diagnostic de plante, organes) |
| 5 | 60 | Processus reproductifs, stratégies adaptatives, exemples agronomiques |
| 6 | 60 | Biochimie photosynthétique, bilans hydriques, signaux |
| 7 | 54 | Stress abiotiques/biotiques, symbioses |
| 8 | 54 | Pathologie, physiologie intégrative, écophysiologie avancée |
| 9 | 48 | Génétique, amélioration variétale, biostatistiques de base |
| 10 | 42 | Biotechnologies, métabolites secondaires, métabolomique |
| 11 | 36 | Résumés d’articles, méthodologies expérimentales |
| 12 | 36 | Études de cas complexes, interdisciplinaires, scénarios de recherche |

### Palier 1 000 questions
Objectif : banque robuste pour événements (tournois, révisions annuelles) et mutualisation avec d’autres parcours.

| Niveau | Volume cible | Ajustements |
| --- | --- | --- |
| 1 | 70 | Déployer une base « culture G scientifique » exportable vers d’autres modes |
| 2 | 90 | Ajouter questions contextualisées (ex. innovations agroécologiques) |
| 3 | 120 | Constituer sous-thématiques précises (morphologie, physiologie cellulaire, écologie) |
| 4 | 110 | Doubler les cas pratiques illustrés + mini études comparatives |
| 5 | 110 | Approfondir reproduction/évolution avec études de cycles complets |
| 6 | 110 | Série thématiques « énergie & métabolisme », « signaux », « stress » |
| 7 | 90 | Ajouter dossiers sur communications plantes-microbes, défense avancée |
| 8 | 90 | Intégrer pathologies émergentes, changements climatiques, agriculture de précision |
| 9 | 80 | Génétique quantitative, biologie synthétique, big data végétal |
| 10 | 60 | Biotechnologies appliquées (CRISPR, métabolites) |
| 11 | 40 | Veille scientifique structurée, extraits de publications |
| 12 | 30 | Cas transdisciplinaires (écologie + économie, recherche appliquée) |

> ✅ Astuce logistique : ces volumes supposent un cycle de relecture dédié. Planifier une base Zotero / Notion pour tracer les sources et éviter les doublons.

## Stratégie éditoriale
1. **Cartographier les thèmes** : établir une matrice thèmes × niveaux en partant des UE/compétences clés (physiologie, diversité, éco-agro, biotechnologies) pour garantir la progression.
2. **Segmenter par vagues** : découper le backlog en lots (ex. 6 vagues × ~170 questions pour l’objectif 1 000) avec responsables éditoriaux différents afin de réduire le risque de doublon.
3. **Rédiger par lots** de 10 à 15 questions en alternant formats (vrai contexte, études de cas, terminologie) pour maintenir la variété.
4. **Contrôler la granularité** : prévoir une revue croisée des difficultés (lecture à froid, test rapide sur le moteur) afin d’ajuster le niveau assigné avant import et d’éviter les biais de calibration.
5. **Préparer les métadonnées** : chaque entrée doit comprendre `id` unique, `prompt`, 4 propositions minimum avec une bonne réponse et explication concise.
6. **Intégrer progressivement** : ajouter par paquets (ex. niveaux 3-6 en priorité pour soutenir l’algorithme), lancer une session test (≥30 questions) et analyser les stats (`questionStats`) avant d’élargir.
7. **Industrialiser la validation** : maintenir un tableur partagé (ou Notion + scripts) qui vérifie unicité des `id`, niveau déclaré, source et statut (ébauche/revu/validé).

## Capacité de génération
- Générer ~300 questions sans doublon est réaliste en s'appuyant sur un plan éditorial détaillé (thèmes × niveaux) et une base documentaire fiable.
- Pour **600 questions**, prévoir 4 à 5 sprints éditoriaux (≈3 semaines chacun) : deux sprints pour les niveaux 1-5, un pour 6-7, un pour 8-10, un « expert » pour 11-12 avec appui de chercheurs.
- Pour **1 000 questions**, allouer 6 vagues (1 par mois) avec relectures tournantes et outils de QA automatiques (script qui signale prompts proches via similarité TF-IDF ou embeddings).
- Utiliser un suivi (tableur ou script) pour tracer les `id` et éviter les doublons lors de la rédaction.
- Déployer un script de détection de similarité (cosine sur embeddings) avant import dans `questions_normal.json` pour bannir les doublons quasi-identiques.

## Réflexion sur les niveaux bas
- Le moteur propulse rapidement les joueurs vers leur niveau réel grâce à la séquence de calibration (`[4,6,3,7,5,8]`) et au facteur K réduit ensuite.【F:index.html†L364-L408】【F:index.html†L525-L571】
- Supprimer totalement les niveaux 1-2 créerait un trou dans la plage Elo (700–820) et réduirait la capacité du moteur à redescendre en douceur après une série de mauvaises réponses.
- Recommandation : conserver les niveaux 1-2 mais en faire des **modules d’onboarding** et de **révision ciblée** (ex. mode « échauffement »), tout en autorisant l’ancre à ne pas descendre en dessous de 2 sauf après plusieurs erreurs consécutives.
- À mesure que la banque grossit, ajuster `CALIBRATION_SEQUENCE` pour démarrer à 4 puis osciller entre 4 et 7 (comme aujourd’hui) suffit ; les niveaux 1-2 serviront surtout aux profils novices ou aux sessions de découverte.

## Prochaines étapes
1. Valider ce plan et ajuster si nécessaire (ex : poids accru sur agronomie ou sur biologie moléculaire).
2. Mettre en place un gabarit de question (Markdown/Google Sheet) pour industrialiser la rédaction.
3. Lors de l'ajout des nouvelles questions, prévoir un test de session (≥30 questions) pour vérifier la stabilité de l'Elo et la diversité.
