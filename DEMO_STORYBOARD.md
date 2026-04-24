# ÉduRéussite — Storyboard écran par écran
> Chaque case = un écran ou état visible à l'écran. Utiliser comme guide de tournage.

---

## BLOC 0 — Intro (0:00–0:30)

```
┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 0.1 — Écran noir                                  │
│                                                          │
│              [Fondu depuis noir]                         │
│                                                          │
│         ✦ ÉduRéussite  ← logo centré                    │
│    « Chaque élève mérite un parcours unique »            │
│                                                          │
│  Durée : 5 sec                                           │
└─────────────────────────────────────────────────────────┘
```

---

## BLOC 1 — Page d'accueil (0:30–1:00)

```
┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 1.1 — Hero section                                │
│                                                          │
│  [En-tête navbar visible]                                │
│  ┌──────────────────────────────────────┐                │
│  │  Sélecteur région : [ Québec ▼ ]     │                │
│  └──────────────────────────────────────┘                │
│                                                          │
│  Titre hero :                                            │
│  "Chaque élève mérite un parcours unique"                │
│                                                          │
│  Badge orange : "1re année → Sec. 5"                    │
│                                                          │
│  Stats : 100% aligné PFEQ · < 5 min · 3 rôles           │
│                                                          │
│  [Flèche curseur survole le sélecteur de région]         │
│  Action : clic → ouvre la liste de provinces/pays        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 1.2 — Sélecteur de région ouvert                  │
│                                                          │
│  ┌─────────────────────────┐                            │
│  │ 🇨🇦 Canada               │                            │
│  │   Québec ✓              │                            │
│  │   Ontario               │                            │
│  │   Colombie-Brit...      │                            │
│  │ 🌍 France & Afrique     │                            │
│  │   France                │                            │
│  │   Bénin                 │  ← curseur survole         │
│  │   Sénégal               │                            │
│  └─────────────────────────┘                            │
│                                                          │
│  Note tournage : montrer brièvement, rester sur QC       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 1.3 — Scroll vers section rôles                   │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Élève   │  │  Parent  │  │Enseignant│              │
│  │    🎒    │  │   👨‍👩‍👧   │  │    🏫    │              │
│  │  Plan    │  │  Suivi   │  │  Classe  │              │
│  │  perso.  │  │  enfant  │  │  IA      │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                          │
│  [Curseur clique sur bouton "Commencer gratuitement"]    │
└─────────────────────────────────────────────────────────┘
```

---

## BLOC 2 — Inscription & Onboarding élève (1:00–2:15)

```
┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 2.1 — Page d'inscription                          │
│                                                          │
│  Rôle sélectionné : [ Élève ]                            │
│                                                          │
│  Prénom :    [ Emma          ]                           │
│  Courriel :  [ emma@...      ]                           │
│  Mot de passe : [ ••••••••  ]                            │
│                                                          │
│  [ Créer mon compte → ]   ← clic                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 2.2 — Onboarding Étape 1 : Identité              │
│                                                          │
│  ✦ ÉduRéussite                                          │
│  [●○○○○○]  Étape 1/6                                    │
│                                                          │
│  👋 Bonjour ! Comment tu t'appelles ?                    │
│                                                          │
│  Prénom :  [ Emma    ]   Nom :  [ Tremblay ]             │
│                                                          │
│  Mon année scolaire :                                    │
│  PRIMAIRE :  [1re][2e][3e][4e][5e][6e]                  │
│  SECONDAIRE : [Sec.1][Sec.2][■Sec.3■][Sec.4][Sec.5]     │
│                    ↑ sélectionné                         │
│                                                          │
│  École (optionnel) : [ École Bois-Joli ]                 │
│  [ Continuer → ]                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 2.3 — Étape 2 : Style d'apprentissage            │
│                                                          │
│  [●●○○○○]  Étape 2/6                                    │
│                                                          │
│  🧠 Comment tu apprends le mieux ?                       │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Visuel  │  │  Auditif │  │Kinestési │              │
│  │  📖      │  │  🎧  ✓   │  │   🖐️     │              │
│  │  Je lis  │  │J'écoute  │  │Je pratiq.│              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 2.4 — Étape 3 : Matières                         │
│                                                          │
│  [●●●○○○]  Étape 3/6                                    │
│                                                          │
│  📚 Tes matières préférées…                              │
│                                                          │
│  ❤️ J'aime beaucoup :                                   │
│  [■Arts■] [Français] [Sciences] [Anglais]                │
│   ↑ sélectionné en vert                                  │
│                                                          │
│  💪 Je trouve ça difficile :                             │
│  [■Mathématiques■] [Sciences]                            │
│   ↑ sélectionné en orange                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 2.5 — Étape 4 : Besoins                          │
│                                                          │
│  [●●●●○○]  Étape 4/6                                    │
│                                                          │
│  💙 Des besoins particuliers ?                           │
│                                                          │
│  ☑ TDAH / difficulté d'attention                        │
│  ☐ Dyslexie / difficulté de lecture                     │
│  ☑ Anxiété scolaire                                     │
│                                                          │
│  → Pas de jugement, l'IA adapte son approche            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 2.6 — Étape 5 : Univers personnel                │
│                                                          │
│  [●●●●●○]  Étape 5/6                                    │
│                                                          │
│  🌍 Ton univers                                          │
│                                                          │
│  Centres d'intérêt : [■Basketball■] [■Jeux vidéo■]      │
│  Sport favori : [ Basketball       ]                     │
│  Objectif :     [ ■ Passer en Sec.4 ■ ]                 │
│  Personnalité : [■ Curieux ■] [Créatif] [Compétitif]    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 2.7 — Étape 6 : Plan généré !                    │
│                                                          │
│  [●●●●●●]  Terminé !                                    │
│                                                          │
│  🚀 Ton profil est prêt, Emma !                          │
│                                                          │
│  L'IA a créé ton plan personnalisé de 6 semaines.        │
│                                                          │
│  [Voir mon tableau de bord →]   ← clic                  │
└─────────────────────────────────────────────────────────┘
```

---

## BLOC 3 — Tableau de bord élève (2:15–3:30)

```
┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 3.1 — Dashboard principal                         │
│                                                          │
│  Bonjour Emma ! ☀️                                       │
│                                                          │
│  ┌─────────────────────────────┐  ┌──────────────┐      │
│  │  📌 Notion du jour          │  │  🔥 Streak   │      │
│  │  Équations du 1er degré     │  │    12 jours  │      │
│  │  Mathématiques · Sec. 3     │  │  ████████░░  │      │
│  │  [Commencer l'exercice →]  │  │  🏅 3 badges │      │
│  └─────────────────────────────┘  └──────────────┘      │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  📊 Ma progression                               │    │
│  │  Français     ████████░░ 78%                    │    │
│  │  Maths        █████░░░░░ 52%  ← rouge           │    │
│  │  Sciences     ███████░░░ 71%                    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│                              [● Mira ← flottant]        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 3.2 — Exercice IA généré                          │
│                                                          │
│  Exercice · Mathématiques · Sec. 3                       │
│                                                          │
│  Question 1/5                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Dans un tournoi de basketball, l'équipe        │    │
│  │  d'Emma a marqué 2x + 5 points au total.        │    │
│  │  Si le total est 23, quelle est la valeur de x? │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ○ 7    ○ 8    ● 9    ○ 10                              │
│                                                          │
│  [ Valider ma réponse ]   ← clic                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 3.3 — Correction avec leçon                      │
│                                                          │
│  ✅ Bonne réponse !                                      │
│                                                          │
│  📖 Leçon à retenir :                                    │
│  Pour résoudre 2x + 5 = 23 :                            │
│  → Isole x : 2x = 23 - 5 = 18                          │
│  → Divise par 2 : x = 9 ✓                              │
│                                                          │
│  💡 Stratégie : toujours isoler l'inconnue              │
│     en commençant par les termes constants.              │
│                                                          │
│  [ Question suivante → ]                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 3.4 — Mira (avatar IA)                           │
│                                                          │
│  [Clic sur le bouton flottant Mira]                      │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  [Animation avatar Mira — personnage animé]     │    │
│  │                                                  │    │
│  │  Mira : « Bonjour Emma ! Comment puis-je        │    │
│  │           t'aider aujourd'hui ? »               │    │
│  │                                                  │    │
│  │  Emma : "Je comprends pas les inégalités"        │    │
│  │                                                  │    │
│  │  Mira : « Bonne question ! Une inégalité,        │    │
│  │           c'est comme un match de basket :       │    │
│  │           un côté marque plus que l'autre... »   │    │
│  └─────────────────────────────────────────────────┘    │
│  [ 🎤 Parler ]  [ ✏️ Écrire ]                           │
└─────────────────────────────────────────────────────────┘
```

---

## BLOC 4 — Plan d'apprentissage (3:30–4:15)

```
┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 4.1 — Plan · Vue calendrier (Gantt)              │
│                                                          │
│  Mon plan · Secondaire 3 · Actif                        │
│                                                          │
│  Semaine 1  Semaine 2  Semaine 3  …  Semaine 6          │
│  ┌──────────────────────────────────────────────┐       │
│  │ Maths    [🔴🔴🔴🔴][🟡🟡🟡][🟢🟢]           │       │
│  │ Français [🟡🟡🟡🟡][🟢🟢🟢🟢]              │       │
│  │ Sciences [🟠🟠🟠][🟡🟡🟡🟡]                │       │
│  └──────────────────────────────────────────────┘       │
│                                                          │
│  🔴 Urgent   🟠 Important   🟡 Plus tard   🟢 Maîtrisé │
│                                                          │
│  [← Retour] [Modifier le plan]                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 4.2 — Cours de remédiation (Mira enseigne)       │
│                                                          │
│  Navigation → /eleve/cours                              │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  [Avatar Mira animé, bouche qui bouge]          │    │
│  │                                                  │    │
│  │  « Chapitre 2 : Les équations du 1er degré.     │    │
│  │    Imagine que x est le nombre de points        │    │
│  │    qu'il te faut pour gagner... »               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ████████░░  Progression : 60%                          │
│  [ ⏸ Pause ]  [ → Continuer ]                           │
└─────────────────────────────────────────────────────────┘
```

---

## BLOC 5 — Tableau de bord parent (4:15–5:15)

```
┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 5.1 — Dashboard parent                           │
│                                                          │
│  Bonjour ! Voici le suivi d'Emma.                       │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Emma Tremblay · Sec. 3 · École Bois-Joli       │    │
│  │                                                  │    │
│  │  ⚠️ Alerte émotionnelle  ← badge rouge          │    │
│  │  Emma a signalé du stress 3 jours consécutifs.  │    │
│  │                                                  │    │
│  │  Français     ████████░░ 78%  🟡                │    │
│  │  Maths        █████░░░░░ 52%  🔴  ← rouge       │    │
│  │  Sciences     ███████░░░ 71%  🟡                │    │
│  │  Univers soc. █████████░ 85%  🟢                │    │
│  │                                                  │    │
│  │  🔥 12 jours de suite · ⏱️ 3h25 cette semaine  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 5.2 — Recommandation spécialiste                 │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  🤖 Recommandation IA                           │    │
│  │                                                  │    │
│  │  [🟠 URGENCE MODÉRÉE]                           │    │
│  │  Une consultation avec un·e orthopédagogue      │    │
│  │  pourrait être bénéfique pour Emma.             │    │
│  │                                                  │    │
│  │  Signaux détectés :                             │    │
│  │  • Résultats en baisse en Maths (−15% / 3 sem) │    │
│  │  • Anxiété signalée 3 jours/semaine             │    │
│  │  • Temps de complétion exercices +40%           │    │
│  │                                                  │    │
│  │  [Voir les spécialistes disponibles →]          │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 5.3 — Plan d'accompagnement parental             │
│                                                          │
│  Navigation → /parent/accompagnement/emma               │
│                                                          │
│  Plan d'accompagnement · Emma · Généré le 16 avril      │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  « En tant qu'orthopédagogue, je recommande...  │    │
│  │                                                  │    │
│  │  Semaine 1 : Créer une routine de 20 min/soir   │    │
│  │  Semaine 2 : Exercices de respiration avant      │    │
│  │              les devoirs de maths               │    │
│  │  Semaine 3 : Jeu de cartes "équations" en       │    │
│  │              famille (5 min / soir) »           │    │
│  └─────────────────────────────────────────────────┘    │
│  [ ⬇ Télécharger le plan ]                              │
└─────────────────────────────────────────────────────────┘
```

---

## BLOC 6 — Démo multi-région : Bénin (5:15–5:45)

```
┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 6.1 — Page d'accueil, sélection Bénin            │
│                                                          │
│  [Sélecteur région ouvert]                               │
│  🌍 France & Afrique francophone                        │
│    France                                               │
│    ■ Bénin ■   ← clic                                   │
│    Sénégal                                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 6.2 — Onboarding avec niveaux béninois           │
│                                                          │
│  👋 Bonjour ! Comment tu t'appelles ?                    │
│                                                          │
│  Mon année scolaire :                                    │
│  PRIMAIRE :  [CP1][CP2][CE1][CE2][CM1][CM2]             │
│  COLLÈGE :   [6ème][5ème][■4ème■][3ème]                 │
│                    ↑ sélectionné                         │
│  LYCÉE :     [2nde][1ère][Terminale]                     │
│                                                          │
│  Note : même interface, niveaux localisés               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 6.3 — Matières localisées Bénin                  │
│                                                          │
│  📚 Tes matières :                                       │
│                                                          │
│  [📖 Français] [🔢 Mathématiques]                       │
│  [🔬 Sciences Naturelles / PC]                          │
│  [🗺️ Histoire-Géographie]                               │
│  [🎨 Arts Plastiques]                                    │
│  [💭 Éducation Civique]                                  │
│  [🗣️ Anglais] [⚽ EPS]                                   │
└─────────────────────────────────────────────────────────┘
```

---

## BLOC 7 — Tableau de bord admin (5:45–6:30)

```
┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 7.1 — Dashboard Super Admin                      │
│                                                          │
│  Administration · ÉduRéussite                           │
│                                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│  │  🎒    │ │  🏫    │ │  👨‍👩‍👧   │ │  ⚕️    │           │
│  │  1 247 │ │   89   │ │  834   │ │   12   │           │
│  │ Élèves │ │Enseig. │ │Parents │ │Spécia. │           │
│  └────────┘ └────────┘ └────────┘ └────────┘           │
│                                                          │
│  +47 nouveaux utilisateurs cette semaine                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 7.2 — Graphique des coûts IA                     │
│                                                          │
│  💰 Coûts IA — 30 derniers jours                        │
│                                                          │
│     $  ▲                                                │
│  1.20 │    ╭─╮    ╭─╮                                   │
│  0.80 │  ╭─╯ ╰──╮╯ ╰╮                                  │
│  0.40 │╭─╯       ╰───╯                                  │
│  0.00 └──────────────────────→ jours                   │
│                                                          │
│  Service         Appels   Coût total                    │
│  Claude API      2 341    12,40 $CA                     │
│  ElevenLabs TTS    892     4,15 $CA                     │
│  Deepgram STT      234     0,87 $CA                     │
│  Resend (email)     67     0,12 $CA                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 7.3 — Gestionnaire d'expansion                   │
│                                                          │
│  🌍 Expansion internationale                             │
│                                                          │
│  🇨🇦 Canada                                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │  ■ Québec (actif)    ■ Ontario (actif)          │    │
│  │  □ Alberta           □ Colombie-Brit.           │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  🌍 France & Afrique francophone                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │  □ France            ■ Bénin (actif)            │    │
│  │  □ Sénégal           □ Côte d'Ivoire            │    │
│  │  → [Activer France]  ← clic sur toggle          │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## BLOC 8 — Outro (6:30–7:00)

```
┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 8.1 — Récapitulatif animé                        │
│                                                          │
│  [Apparition séquentielle des points clés]               │
│                                                          │
│  ✦ Plan d'apprentissage unique pour chaque élève        │
│  ✦ Suivi bienveillant pour chaque parent                │
│  ✦ IA qui guide, sans décider à la place des humains    │
│  ✦ Québec · Canada · France · Afrique francophone       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ÉCRAN 8.2 — Call to action final                       │
│                                                          │
│         ✦ ÉduRéussite                                   │
│                                                          │
│    Inscription gratuite · Aucune carte requise           │
│            Prêt en 2 minutes                            │
│                                                          │
│         [ edureussite.ca ]   [QR code]                  │
│                                                          │
│  [Fondu vers noir]                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist avant tournage

| # | À préparer | Fait ? |
|---|---|---|
| 1 | Compte élève démo : Emma Tremblay, Sec.3, QC, TDAH+anxiété | ☐ |
| 2 | Compte parent démo lié à Emma avec recommandation active | ☐ |
| 3 | Compte admin démo avec données de coûts pré-remplies | ☐ |
| 4 | Compte élève démo Bénin : Kofi, 4ème, Bénin | ☐ |
| 5 | Plan d'apprentissage Emma généré et actif | ☐ |
| 6 | Exercice en cours sur les équations | ☐ |
| 7 | Plan d'accompagnement parental pré-généré | ☐ |
| 8 | Bénin activé dans le panel admin | ☐ |
| 9 | Résolution écran : 1920×1080 | ☐ |
| 10 | Curseur agrandi visible (logiciel de présentation) | ☐ |
| 11 | Mode "ne pas déranger" activé (notifications off) | ☐ |
| 12 | Script narration imprimé ou sur second écran | ☐ |
