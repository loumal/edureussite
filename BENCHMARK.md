# ÉduRéussite — Benchmark professionnel & plan d'amélioration
> Analyse comparative · Audit technique · Roadmap priorisée
> Date : avril 2026

---

## 1. Positionnement concurrentiel

### Concurrents directs analysés

| Plateforme | Marché principal | Modèle | Forces |
|---|---|---|---|
| **Khan Academy** | Mondial (EN/FR) | Gratuit | Contenu vidéo exhaustif, exercices adaptatifs, curriculum US |
| **Alloprof** | Québec | Gratuit (subventionné) | Contenu 100% PFEQ, aide aux devoirs humaine, confiance parents |
| **Duolingo Math** | Mondial | Freemium | Gamification ultra-poussée, rétention, mobile-first |
| **Socrative / Quizlet** | Scolaire (enseignants) | Freemium B2B | Création quiz, usage en classe, intégration LMS |
| **Matific** | Primaire (maths) | B2B école | Jeux pédagogiques, adaptatif, reporting enseignant |
| **Mia by Scolari** | Québec (lecture) | B2B école | Spécialisé lecture/orthographe, interface élève simple |
| **Photomath / Wolfram** | Mondial | Freemium | Résolution pas-à-pas, reconnaissance image |
| **Google Classroom** | Scolaire | Gratuit (G Suite) | Intégration Drive/Meet, gestion de classe |

---

### Matrice de positionnement

```
                    IA GÉNÉRATIVE
                         ▲
                         │
          ÉduRéussite ●  │
                         │
  Matific ●              │              ● Khanmigo (Khan)
                         │
──────────────────────────────────────────── CURRICULUM QC
         Quizlet ●       │       ● Alloprof
                         │
                         │  ● Google Classroom
                         ▼
                    CONTENU STATIQUE
```

**Conclusion :** ÉduRéussite est **le seul acteur** combinant IA générative + curriculum québécois + rôles multiples (élève/parent/enseignant). C'est un avantage différenciateur fort, mais non défendu par la notoriété.

---

## 2. Analyse comparative feature par feature

| Fonctionnalité | ÉduRéussite | Khan Academy | Alloprof | Duolingo |
|---|:---:|:---:|:---:|:---:|
| Plan personnalisé IA | ✅ | ⚠️ partiel | ❌ | ⚠️ partiel |
| Exercices génératifs IA | ✅ | ❌ | ❌ | ❌ |
| Avatar vocal IA (Mira) | ✅ | ⚠️ (Khanmigo) | ❌ | ❌ |
| Curriculum PFEQ QC | ✅ | ❌ | ✅ | ❌ |
| Multi-région (FR/Afrique) | ✅ | ✅ | ❌ | ✅ |
| Dashboard parent | ✅ | ⚠️ basique | ❌ | ❌ |
| Dashboard enseignant | ✅ | ✅ | ❌ | ❌ |
| Suivi émotionnel | ✅ | ❌ | ❌ | ❌ |
| Gamification (streak/XP) | ✅ | ⚠️ basique | ❌ | ✅✅ |
| App mobile native | ❌ | ✅ | ✅ | ✅✅ |
| Mode hors-ligne | ❌ | ⚠️ partiel | ❌ | ✅ |
| Contenu vidéo | ❌ | ✅✅ | ✅ | ❌ |
| Aide humaine (tuteurs) | ❌ | ✅ (US) | ✅ | ❌ |
| Tests / examens blancs | ✅ | ✅ | ✅ | ❌ |
| Intégration LMS (Google, etc.) | ❌ | ✅ | ❌ | ❌ |
| Accessibilité WCAG AA | ⚠️ insuffisant | ✅ | ✅ | ✅ |
| Langue anglaise | ⚠️ UI FR only | ✅ | ❌ | ✅ |

---

## 3. Audit technique — État actuel

### 3.1 Sécurité — ★★★★★ (EXCELLENT)

Points forts :
- Rate limiting double couche (Upstash Redis + in-memory fallback)
- Zod validation sur toutes les mutations tRPC
- CSP, HSTS, X-Frame-Options configurés
- Logs de sécurité complets (IP blocking, escalades de rôle)
- bcryptjs + OTP limité à 5 tentatives/15 min
- Procédures tRPC segmentées par rôle (`adminProcedure`, `superAdminProcedure`, `aiProcedure`)

Aucune action critique. Classe entreprise.

---

### 3.2 Performance — ★★★☆☆ (MOYEN)

| Problème | Impact | Effort fix |
|---|---|---|
| ~20 `<img>` non optimisées vs 1 `next/image` | LCP dégradé, pas de lazy loading auto | Faible |
| 90 composants `"use client"` | Hydratation excessive, bundle JS lourd | Moyen |
| Pas de `loading.tsx` par route | UX saccadée sur navigation lente | Faible |
| Pas de cache HTTP explicite sur assets | Re-téléchargements inutiles | Faible |
| Pas de Suspense sur les routes dashboard | Waterfall de données côté serveur | Moyen |

**Score Lighthouse estimé** (non mesuré) : ~62/100 Performance sur mobile.

---

### 3.3 Accessibilité — ★☆☆☆☆ (CRITIQUE)

| Problème | Impact | Norme violée |
|---|---|---|
| ~3% de couverture ARIA sur 97 composants | Inutilisable pour non-voyants | WCAG 2.1 AA — 4.1.2 |
| ~0% d'attributs `alt` sur les images | Lecteur d'écran muet | WCAG 2.1 AA — 1.1.1 |
| Pas de gestion du focus dans les modales | Piège clavier pour utilisateurs tab | WCAG 2.1 AA — 2.1.1 |
| Pas d'association `aria-labelledby` sur formulaires | Champs illisibles par AT | WCAG 2.1 AA — 1.3.1 |
| Contraste non vérifié | Lisibilité réduite | WCAG 2.1 AA — 1.4.3 |

**Risque légal :** En tant que plateforme éducative (mineurs inclus), WCAG AA est une obligation morale et potentiellement légale selon la Loi sur l'accessibilité (projet Québec, AODA Ontario).

---

### 3.4 Tests — ★☆☆☆☆ (CRITIQUE)

**Zéro fichier de test dans l'ensemble du projet.**

Zones sans filet de sécurité :
- Logique de génération de plan IA
- Calcul des coûts et facturation
- Authentification et gestion des rôles
- Mutations sensibles (suspension de compte, escalade admin)
- Onboarding multi-étapes (régression silencieuse possible)

**Risque :** Un déploiement peut casser silencieusement une fonctionnalité critique (ex: plan d'apprentissage, recommandations spécialiste) sans que personne ne le sache immédiatement.

---

### 3.5 Internationalisation — ★★☆☆☆ (INSUFFISANT)

Tout le texte UI est codé en dur en français dans les composants React.

Conséquences :
- Impossible d'afficher l'interface en anglais pour Ontario, BC, Alberta
- Traduction future = refactoring massif de 97 fichiers
- Le code anglais existe déjà dans la région-education.ts (labels EN), mais l'UI reste FR

---

### 3.6 Gestion d'erreurs — ★★★☆☆ (PARTIEL)

| Élément | État |
|---|---|
| `error.tsx` global (App Router) | ❌ Absent |
| `not-found.tsx` (404 custom) | ❌ Absent |
| `loading.tsx` par route | ❌ Absent |
| Try/catch dans les API routes | ✅ Présent |
| Erreurs Zod formatées pour l'UI | ✅ Présent |
| Error boundaries client | ❌ Absent |

---

### 3.7 Analytics & Observabilité — ★☆☆☆☆ (ABSENT)

Aucun outil de monitoring en production :
- Pas de Sentry → erreurs runtime invisibles
- Pas de PostHog/Vercel Analytics → comportement utilisateur inconnu
- Pas de Real User Monitoring → performances réelles non mesurées
- Seuls les `console.error` sont présents

---

### 3.8 PWA / Mobile natif — ★☆☆☆☆ (ABSENT)

Aucun support offline, aucun manifest PWA, pas d'app native.

Contexte : Duolingo doit 70% de ses sessions actives à son app mobile. La plupart des élèves du secondaire utilisent leur téléphone comme outil principal. L'absence d'app mobile est une friction majeure à l'adoption.

---

## 4. Points d'amélioration — Priorisés

### NIVEAU 1 — Critique (à faire maintenant)

**P1. Tests automatisés**
- Framework recommandé : **Vitest** + React Testing Library
- Cibles prioritaires : routers tRPC (auth, eleve, parent), logique plan IA, onboarding flow
- Objectif minimum : 60% de couverture sur la logique métier
- Effort estimé : 2–3 semaines

**P2. Accessibilité de base**
- Ajouter `alt=""` sur toutes les images décoratives, description sur les images informatives
- Ajouter `aria-label` sur tous les boutons sans texte visible (icônes)
- Ajouter `aria-describedby` sur les champs de formulaire avec erreur
- Ajouter focus trap dans les modales (ex: `ajouter-enfant-modal`)
- Effort estimé : 1 semaine

**P3. Pages d'erreur globales**
- Créer `src/app/error.tsx` (erreur inattendue)
- Créer `src/app/not-found.tsx` (404)
- Créer `src/app/loading.tsx` (loading global)
- Effort estimé : 2 jours

---

### NIVEAU 2 — Important (prochain sprint)

**P4. Monitoring en production**
- Intégrer **Sentry** (gratuit jusqu'à 5K events/mois) → `@sentry/nextjs`
- Intégrer **Vercel Analytics** (gratuit sur Vercel) → 1 ligne de code
- Objectif : alertes automatiques sur les erreurs 500, les lenteurs > 3s
- Effort estimé : 1 jour

**P5. Optimisation images**
- Remplacer les ~20 `<img>` par `next/image` avec `width`, `height`, `priority` sur les images above-the-fold
- Gain LCP estimé : −40%
- Effort estimé : 3 heures

**P6. Application mobile (PWA)**
- Installer `next-pwa` → service worker automatique
- Ajouter `manifest.json` (icône, couleur, orientation)
- Activer le cache offline sur les assets statiques
- Résultat : installable sur iOS/Android sans app store
- Effort estimé : 2 jours

---

### NIVEAU 3 — Croissance (roadmap 3–6 mois)

**P7. Internationalisation (i18n)**
- Migrer vers **next-intl** : structure de fichiers `messages/fr.json`, `messages/en.json`
- Permettre l'interface EN pour les provinces anglophones (Ontario, BC...)
- Débloquer un nouveau segment de marché : ~8M d'élèves anglophone au Canada
- Effort estimé : 3–4 semaines

**P8. Contenu vidéo**
- Khan Academy doit sa notoriété aux vidéos explicatives
- Intégrer des vidéos courtes (2–3 min) de Mira enseignant les notions clés
- Alternative légère : utiliser ElevenLabs pour générer des explications audio + slides
- Effort estimé : contenu ongoing

**P9. App mobile native (React Native / Expo)**
- Partager la logique tRPC avec l'app web
- Interface tactile dédiée : exercices swipables, notifications push (streak risk)
- Effort estimé : 8–12 semaines (projet à part entière)

**P10. Intégration LMS (Google Classroom / Moodle)**
- Les enseignants vivent dans Google Classroom
- Une extension Chrome ou une intégration API permettrait d'assigner des exercices ÉduRéussite depuis Classroom
- Effort estimé : 4–6 semaines

**P11. Aide humaine (tuteurs asynchrones)**
- Alloprof a un avantage de confiance grâce à ses tuteurs humains
- Ajouter une fonctionnalité "Question à un expert" (réponse sous 24h, asynchrone)
- Modèle : marketplace de tuteurs étudiants universitaires
- Effort estimé : MVP 4 semaines

**P12. Mode hors-ligne**
- Permettre de télécharger 5 exercices pour travailler sans connexion
- Critique pour les élèves en zones rurales (Afrique francophone)
- Effort estimé : 3 semaines

---

## 5. Opportunités différenciatrices non exploitées

### 5.1 Reconnaissance de l'écriture (OCR)
**Observation :** Photomath capte des millions d'utilisateurs avec la résolution par photo.
**Opportunité :** Permettre à l'élève de prendre en photo un problème de maths ou un texte et laisser Mira expliquer la solution.
**Faisabilité :** API Claude Vision déjà disponible dans le stack.

### 5.2 Rapports hebdomadaires automatiques pour les parents
**Observation :** Les parents reçoivent trop peu de notifications proactives.
**Opportunité :** Email hebdomadaire automatique avec : résumé de la semaine, 1 alerte si besoin, 1 conseil actionnable.
**Faisabilité :** Resend est déjà intégré dans le stack. Cron job à ajouter.

### 5.3 Mode enseignant enrichi
**Observation :** Google Classroom domine parce que les enseignants peuvent assigner des contenus.
**Opportunité :** Permettre à l'enseignant d'assigner un exercice IA personnalisé à toute une classe en 1 clic, avec rapport automatique de résultats.
**Faisabilité :** Les routes `/enseignant` existent, la logique de génération IA aussi.

### 5.4 Certification de compétences
**Observation :** Les élèves n'ont aucune preuve visible de leurs progrès.
**Opportunité :** Générer un badge/certificat PDF téléchargeable pour chaque notion maîtrisée. Partager sur les réseaux.
**Faisabilité :** Faible effort — `@react-pdf/renderer` ou API PDF.

### 5.5 Programme de parrainage famille
**Observation :** Le bouche-à-oreille est le canal d'acquisition N°1 en edtech.
**Opportunité :** "Invitez un ami, obtenez 1 mois de fonctionnalités premium". Système de codes de parrainage.
**Faisabilité :** Moyen — système d'invitation déjà partiellement présent (`/partager/[token]`).

---

## 6. Score global

| Dimension | Score | Commentaire |
|---|---|---|
| **Innovation produit** | 9/10 | Différenciateur unique sur le marché |
| **Sécurité** | 9/10 | Niveau entreprise |
| **UX / Design** | 7/10 | Interface soignée, mais manque d'app mobile |
| **Performance technique** | 6/10 | Bonnes bases, images non optimisées |
| **Accessibilité** | 2/10 | Critique — quasi absente |
| **Fiabilité (tests)** | 1/10 | Zéro couverture de test |
| **Observabilité** | 1/10 | Aucun monitoring en production |
| **Internationalisation** | 3/10 | FR uniquement |
| **Compétitivité marché** | 8/10 | Unique sur le segment QC + IA |
| **Potentiel de croissance** | 9/10 | Multi-région en place, modèle scalable |

**Score global : 5.5/10** — Produit innovant avec une dette technique concentrée sur trois axes (tests, accessibilité, monitoring). Un sprint de 3 semaines sur P1–P3 ferait passer ce score à 7.5/10.

---

## 7. Synthèse exécutive

**Ce qui est excellent :**
ÉduRéussite est techniquement audacieux et pédagogiquement pertinent. La combinaison IA générative + curriculum local + rôles connectés est une proposition de valeur inédite sur le marché québécois et francophone. La sécurité est de niveau professionnel. L'extension multi-région (France, Afrique) est stratégiquement bien exécutée.

**Ce qui est insuffisant pour scaler :**
Le produit n'a aucun test automatisé, aucun monitoring de production, et une accessibilité quasi nulle. Ces trois éléments combinés créent un risque opérationnel important : une régression critique peut passer inaperçue pendant des jours, et la plateforme ne respecte pas les standards d'inclusion attendus d'une plateforme éducative.

**Recommandation stratégique :**
Avant d'acquérir de nouveaux utilisateurs, sécuriser l'existant. Investir 3 semaines sur P1 (tests), P2 (accessibilité) et P3 (monitoring) avant tout lancement commercial. Ces fondations sont ce qui distingue un prototype d'un produit.
