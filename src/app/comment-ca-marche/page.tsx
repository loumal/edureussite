import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Comment ça marche — Édu-Réussite",
  description: "Comprendre simplement comment l'intelligence artificielle d'Édu-Réussite fonctionne, quelles données elle utilise, et comment vos droits sont protégés.",
};

const Section = ({ id, children }: { id: string; children: ReactNode }) => (
  <section id={id} className="scroll-mt-24">
    {children}
  </section>
);

const Chip = ({ children, color = "default" }: { children: ReactNode; color?: "green" | "red" | "default" }) => {
  const styles = {
    green: "bg-[rgba(42,124,111,0.1)] text-[var(--color-success)] border-[rgba(42,124,111,0.2)]",
    red: "bg-[rgba(217,79,43,0.08)] text-[var(--color-accent)] border-[rgba(217,79,43,0.2)]",
    default: "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] border-[var(--color-rule)]",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${styles[color]}`}>
      {children}
    </span>
  );
};

export default function CommentCaMarchePage() {
  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      {/* Navigation */}
      <header className="sticky top-0 z-10 border-b border-[var(--color-rule)] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-base font-black text-[var(--color-ink)] tracking-tight hover:opacity-75 transition-opacity">
            ✦ Édu-Réussite
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/politique-confidentialite" className="hidden sm:block text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors">
              Politique de confidentialité
            </Link>
            <Link href="/login" className="rounded-xl bg-[var(--color-ink)] px-4 py-2 text-xs font-bold text-white hover:opacity-85 transition-opacity">
              Se connecter
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 pb-20">

        {/* En-tête */}
        <div className="mb-14 text-center">
          <Chip>Transparence</Chip>
          <h1 className="mt-4 text-4xl font-black text-[var(--color-ink)] leading-tight tracking-tight sm:text-5xl">
            Comment ça<br />
            <span style={{ background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-purple) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              marche ?
            </span>
          </h1>
          <p className="mt-5 mx-auto max-w-xl text-base text-[var(--color-ink-soft)] leading-relaxed">
            Une explication claire et honnête de l'intelligence artificielle utilisée dans Édu-Réussite — pour que vous puissiez faire confiance à la technologie qui accompagne votre enfant.
          </p>
        </div>

        {/* Bannière engagement */}
        <div className="mb-14 rounded-2xl bg-[rgba(42,124,111,0.06)] border border-[rgba(42,124,111,0.2)] p-5">
          <div className="flex items-start gap-4">
            <span className="text-3xl flex-shrink-0">🤝</span>
            <div>
              <p className="font-bold text-[var(--color-success)] mb-1">Notre engagement de transparence</p>
              <p className="text-sm text-[var(--color-ink)] leading-relaxed">
                Vous avez le droit de savoir exactement ce que l'IA fait avec les informations de votre enfant. Cette page répond à toutes les questions que vous pourriez vous poser — sans jargon technique, sans langue de bois.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-16">

          {/* 1. Qu'est-ce que l'IA fait ? */}
          <Section id="que-fait-ia">
            <h2 className="text-2xl font-black text-[var(--color-ink)] mb-2">1. Qu'est-ce que l'IA fait concrètement ?</h2>
            <p className="text-sm text-[var(--color-ink-soft)] mb-6 leading-relaxed">
              Édu-Réussite utilise l'intelligence artificielle comme un <strong className="text-[var(--color-ink)]">outil pédagogique d'appui</strong> — ni plus, ni moins. Voici ses quatre rôles précis.
            </p>
            <div className="space-y-4">
              {[
                {
                  num: "01",
                  emoji: "📝",
                  titre: "Elle crée des exercices sur mesure",
                  desc: "À partir du niveau scolaire, du style d'apprentissage et des matières de votre enfant, l'IA génère des exercices adaptés — ni trop faciles (ennuyant), ni trop difficiles (décourageant). Chaque exercice est aligné sur le Programme de formation de l'école québécoise (PFEQ).",
                  badge: null,
                },
                {
                  num: "02",
                  emoji: "📐",
                  titre: "Elle corrige et explique les erreurs",
                  desc: "Quand votre enfant répond à un exercice, l'IA ne dit pas juste « faux ». Elle identifie précisément l'erreur, explique le raisonnement correct étape par étape, et propose des stratégies pour ne plus répéter l'erreur. C'est le même travail qu'un tuteur patient.",
                  badge: null,
                },
                {
                  num: "03",
                  emoji: "🧭",
                  titre: "Elle peut suggérer un spécialiste",
                  desc: "Si l'analyse du profil scolaire de votre enfant détecte des patterns qui suggèrent un bénéfice potentiel d'un spécialiste (orthopédagogue, psychoéducateur, etc.), l'IA peut en informer le parent. Cette suggestion est indicative — la décision appartient toujours à vous.",
                  badge: "Décision humaine finale",
                },
                {
                  num: "04",
                  emoji: "🎙️",
                  titre: "Elle anime Mira, l'enseignante IA orale",
                  desc: "Mira est une enseignante IA avec qui votre enfant peut converser par texte ou par microphone pour poser des questions, recevoir des explications, et pratiquer à l'oral. Mira ne juge pas — elle est toujours disponible, toujours patiente.",
                  badge: null,
                },
              ].map((item) => (
                <div key={item.num} className="flex gap-4 rounded-2xl border border-[var(--color-rule)] bg-white p-5">
                  <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-paper-warm)] text-xs font-black text-[var(--color-ink-soft)]">
                    {item.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                      <p className="font-bold text-[var(--color-ink)] text-sm">{item.emoji} {item.titre}</p>
                      {item.badge && <Chip color="green">✅ {item.badge}</Chip>}
                    </div>
                    <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 2. Quelles données l'IA utilise-t-elle ? */}
          <Section id="donnees-utilisees">
            <h2 className="text-2xl font-black text-[var(--color-ink)] mb-2">2. Quelles données l'IA utilise-t-elle ?</h2>
            <p className="text-sm text-[var(--color-ink-soft)] mb-6 leading-relaxed">
              Nous avons conçu notre système pour que l'IA reçoive le <strong className="text-[var(--color-ink)]">minimum nécessaire</strong> pour faire son travail pédagogique — et rien de plus.
            </p>

            <div className="rounded-2xl border border-[var(--color-rule)] bg-white overflow-hidden mb-5">
              <div className="px-5 py-3 bg-[var(--color-paper-warm)] border-b border-[var(--color-rule)]">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">Ce que l'IA reçoit pour travailler</p>
              </div>
              <div className="divide-y divide-[var(--color-rule)]">
                {[
                  { donnee: "Niveau scolaire", exemple: "ex. : 3e secondaire", raison: "Pour calibrer la difficulté des exercices" },
                  { donnee: "Matières & résultats", exemple: "ex. : difficulté en algèbre, fort en lecture", raison: "Pour personnaliser le contenu" },
                  { donnee: "Style d'apprentissage", exemple: "ex. : visuel, préfère les exemples concrets", raison: "Pour adapter la pédagogie" },
                  { donnee: "Besoins particuliers déclarés", exemple: "ex. : TDAH, dyslexie — renseignés par le parent", raison: "Pour adapter le rythme et la présentation" },
                  { donnee: "Réponses aux exercices", exemple: "La réponse donnée + le score", raison: "Pour générer une correction précise" },
                ].map((row) => (
                  <div key={row.donnee} className="px-5 py-3 grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs">
                    <span className="font-semibold text-[var(--color-ink)]">{row.donnee}</span>
                    <span className="text-[var(--color-ink-soft)]">{row.exemple}</span>
                    <span className="text-[var(--color-ink-soft)]">{row.raison}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[rgba(42,124,111,0.06)] border border-[rgba(42,124,111,0.2)] p-4 mb-4">
              <p className="text-sm font-bold text-[var(--color-success)] mb-2">🔒 Ce qui n'est JAMAIS envoyé à l'IA</p>
              <div className="flex flex-wrap gap-2">
                {["Nom de votre enfant", "Adresse courriel", "Adresse IP", "École fréquentée", "Numéro d'identifiant", "Données financières"].map((item) => (
                  <Chip key={item} color="green">✕ {item}</Chip>
                ))}
              </div>
              <p className="text-xs text-[var(--color-ink-soft)] mt-3 leading-relaxed">
                Les requêtes envoyées à notre fournisseur d'IA utilisent un identifiant interne anonyme, jamais de données permettant d'identifier directement votre enfant.
              </p>
            </div>
          </Section>

          {/* 3. Ce que l'IA ne fait PAS */}
          <Section id="ce-que-ia-ne-fait-pas">
            <h2 className="text-2xl font-black text-[var(--color-ink)] mb-2">3. Ce que l'IA ne fait <em>pas</em></h2>
            <p className="text-sm text-[var(--color-ink-soft)] mb-6 leading-relaxed">
              Il est aussi important de comprendre les limites que nous avons posées — par choix éthique et par conception technique.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { emoji: "🚫", titre: "Aucune décision automatique finale", desc: "L'IA ne prend jamais de décision ayant un impact direct sur la scolarité de votre enfant. Elle suggère, informe, recommande — vous décidez." },
                { emoji: "📵", titre: "Aucune écoute permanente du microphone", desc: "Le microphone n'est activé que quand votre enfant appuie sur le bouton de parole. Il n'y a aucune écoute en arrière-plan, aucun enregistrement continu." },
                { emoji: "🚫", titre: "Aucun profilage publicitaire", desc: "Les données de votre enfant ne servent pas à afficher de la publicité, à construire un profil commercial, ni à être revendues à des tiers." },
                { emoji: "📵", titre: "Pas de mémoire long-terme des conversations", desc: "Mira ne se souvient pas des conversations passées entre les sessions. Chaque nouvelle conversation repart du profil scolaire, pas de l'historique des dialogues." },
                { emoji: "🚫", titre: "Aucun partage avec d'autres familles", desc: "Le profil et les résultats de votre enfant ne sont jamais partagés, comparés ou rendus visibles aux autres familles de la plateforme." },
                { emoji: "📵", titre: "L'IA ne remplace pas l'enseignant", desc: "Édu-Réussite est un outil d'appui à la maison. Il ne se substitue pas au travail de classe ni au jugement de l'enseignant de votre enfant." },
              ].map((item) => (
                <div key={item.titre} className="flex gap-3 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] p-4">
                  <span className="text-xl flex-shrink-0 mt-0.5">{item.emoji}</span>
                  <div>
                    <p className="font-bold text-[var(--color-ink)] text-sm mb-1">{item.titre}</p>
                    <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 4. Mira en détail */}
          <Section id="mira">
            <h2 className="text-2xl font-black text-[var(--color-ink)] mb-2">4. Comment fonctionne Mira ?</h2>
            <p className="text-sm text-[var(--color-ink-soft)] mb-6 leading-relaxed">
              Mira est l'enseignante IA d'Édu-Réussite. Votre enfant peut lui parler par texte ou par microphone. Voici exactement ce qui se passe techniquement.
            </p>
            <div className="rounded-2xl border border-[var(--color-rule)] bg-white overflow-hidden">
              <div className="p-5 border-b border-[var(--color-rule)]">
                <p className="font-bold text-[var(--color-ink)] mb-3">🎙️ Quand votre enfant parle au microphone</p>
                <div className="space-y-3">
                  {[
                    {
                      step: "1",
                      titre: "Traitement local sur votre appareil (la grande majorité des cas)",
                      desc: "La reconnaissance vocale est traitée directement par votre navigateur, sur votre appareil — aucun enregistrement audio ne quitte l'appareil. La voix est convertie en texte localement, puis ce texte est envoyé à Mira.",
                      chip: { text: "100% local", color: "green" as const },
                    },
                    {
                      step: "2",
                      titre: "Traitement via un service tiers (mode de secours sur certains navigateurs)",
                      desc: "Lorsque votre navigateur ne supporte pas le traitement vocal local, l'enregistrement audio est transmis à un service tiers certifié pour transcription immédiate. L'audio est traité instantanément et n'est pas conservé. Aucun identifiant personnel n'est joint à cet enregistrement.",
                      chip: { text: "Traité et non conservé", color: "default" as const },
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3 rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] p-4">
                      <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-ink)] text-xs font-black text-white">{item.step}</div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-[var(--color-ink)] text-sm">{item.titre}</p>
                          <Chip color={item.chip.color}>{item.chip.text}</Chip>
                        </div>
                        <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5">
                <p className="font-bold text-[var(--color-ink)] mb-3">📊 Ce qui est conservé en base de données</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { titre: "Durée d'utilisation", detail: "Compteur hebdomadaire en secondes (max 30 min/semaine)", conserve: true },
                    { titre: "Transcriptions audio", detail: "Non conservées — ni en base ni ailleurs", conserve: false },
                    { titre: "Enregistrements audio", detail: "Non conservés — traités immédiatement puis supprimés", conserve: false },
                  ].map((item) => (
                    <div key={item.titre} className={`rounded-xl border p-3 text-center ${item.conserve ? "border-[rgba(201,149,42,0.3)] bg-[rgba(201,149,42,0.05)]" : "border-[rgba(42,124,111,0.2)] bg-[rgba(42,124,111,0.05)]"}`}>
                      <p className={`text-lg mb-1 ${item.conserve ? "" : ""}`}>{item.conserve ? "⏱️" : "✅"}</p>
                      <p className="text-xs font-bold text-[var(--color-ink)] mb-1">{item.titre}</p>
                      <p className="text-[11px] text-[var(--color-ink-soft)] leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* 5. Qui développe l'IA */}
          <Section id="qui-developpe">
            <h2 className="text-2xl font-black text-[var(--color-ink)] mb-2">5. D'où vient l'IA que nous utilisons ?</h2>
            <p className="text-sm text-[var(--color-ink-soft)] mb-6 leading-relaxed">
              Édu-Réussite s'appuie sur un fournisseur d'intelligence artificielle de référence mondiale, sélectionné pour son engagement explicite envers la sécurité, l'éthique et la protection des données. Voici ce que ça signifie pour vous.
            </p>
            <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-6">
              <div className="space-y-3 text-sm text-[var(--color-ink-soft)] leading-relaxed">
                <p>
                  Notre fournisseur IA est reconnu comme l'un des leaders mondiaux en matière de <strong className="text-[var(--color-ink)]">sécurité et d'éthique de l'intelligence artificielle</strong>. Son modèle est conçu pour être honnête, inoffensif et utile — des valeurs qui s'alignent avec notre mission éducative.
                </p>
                <p>
                  Nous utilisons cette IA exclusivement côté serveur — votre enfant n'interagit jamais directement avec le fournisseur. Chaque échange passe d'abord par nos propres serveurs, où nous contrôlons précisément ce qui est transmis : un profil pédagogique anonymisé, jamais d'information permettant d'identifier votre enfant.
                </p>
                <p>
                  Conformément aux engagements contractuels de notre fournisseur, les données des appels ne sont pas utilisées pour entraîner leurs modèles.
                </p>
              </div>
            </div>
          </Section>

          {/* 6. Résultats mesurables */}
          <Section id="resultats">
            <h2 className="text-2xl font-black text-[var(--color-ink)] mb-2">6. Comment savoir si ça fonctionne ?</h2>
            <p className="text-sm text-[var(--color-ink-soft)] mb-6 leading-relaxed">
              La personnalisation par l'IA ne vaut que si elle produit des résultats mesurables. Voici ce que vous pouvez suivre directement depuis votre compte parent.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { icon: "📈", titre: "Progression par compétence", desc: "Suivez l'évolution des résultats de votre enfant matière par matière, alignés sur les compétences du PFEQ." },
                { icon: "🔥", titre: "Série quotidienne (streak)", desc: "Le streak mesure la régularité — facteur clé d'apprentissage. Une série ininterrompue révèle une habitude qui se construit." },
                { icon: "⏱️", titre: "Temps de session et exercices complétés", desc: "Consultez combien d'exercices ont été complétés cette semaine et le temps moyen de concentration." },
                { icon: "🏆", titre: "Points XP et niveau", desc: "Le système de récompense intrinsèque encourage votre enfant à persévérer sans pression externe." },
              ].map((item) => (
                <div key={item.titre} className="flex gap-3 rounded-2xl border border-[var(--color-rule)] bg-white p-4">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <p className="font-bold text-[var(--color-ink)] text-sm mb-1">{item.titre}</p>
                    <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 7. Vos droits */}
          <Section id="vos-droits">
            <h2 className="text-2xl font-black text-[var(--color-ink)] mb-2">7. Vos droits en tant que parent</h2>
            <p className="text-sm text-[var(--color-ink-soft)] mb-6 leading-relaxed">
              Conformément à la <strong className="text-[var(--color-ink)]">Loi 25 du Québec</strong>, vous avez des droits étendus sur les données de votre enfant. Vous pouvez les exercer à tout moment, gratuitement.
            </p>
            <div className="rounded-2xl border border-[var(--color-rule)] bg-white overflow-hidden">
              <div className="divide-y divide-[var(--color-rule)]">
                {[
                  { emoji: "👁️", droit: "Accès", desc: "Demander à voir toutes les données que nous détenons sur vous et votre enfant.", comment: "Par courriel à confidentialite@edu-reussite.com" },
                  { emoji: "✏️", droit: "Rectification", desc: "Faire corriger toute information inexacte ou incomplète.", comment: "Par courriel ou directement dans les paramètres du compte" },
                  { emoji: "🗑️", droit: "Effacement", desc: "Demander la suppression complète du compte et de toutes les données.", comment: "Suppression immédiate et irréversible — bouton disponible dans les paramètres" },
                  { emoji: "📦", droit: "Portabilité", desc: "Recevoir les données de votre enfant dans un format lisible (JSON/CSV).", comment: "Par courriel à confidentialite@edu-reussite.com" },
                  { emoji: "🚫", droit: "Opposition à l'IA", desc: "Vous opposer aux recommandations automatisées par intelligence artificielle.", comment: "Disponible dans les paramètres du compte — sans impact sur le reste de l'accès" },
                ].map((item) => (
                  <div key={item.droit} className="px-5 py-4 flex gap-4 items-start">
                    <span className="text-xl flex-shrink-0 mt-0.5">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--color-ink)] text-sm">{item.droit}</p>
                      <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">{item.desc}</p>
                      <p className="text-[11px] text-[var(--color-success)] font-medium mt-1">→ {item.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-[var(--color-paper-warm)] border-t border-[var(--color-rule)] px-5 py-4">
                <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
                  Toute demande reçoit une réponse dans un délai maximum de <strong className="text-[var(--color-ink)]">30 jours</strong>. Si vous n'êtes pas satisfait, vous pouvez contacter la{" "}
                  <a href="https://www.cai.gouv.qc.ca" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">Commission d'accès à l'information (CAI) du Québec →</a>
                </p>
              </div>
            </div>
          </Section>

          {/* 8. FAQ */}
          <Section id="faq">
            <h2 className="text-2xl font-black text-[var(--color-ink)] mb-2">8. Questions fréquentes des parents</h2>
            <div className="space-y-3">
              {[
                {
                  q: "Mon enfant peut-il faire confiance à ce que dit Mira ?",
                  r: "Mira donne des explications pédagogiques fondées sur le curriculum officiel (PFEQ). Pour les questions complexes, elle recommande de consulter l'enseignant. Elle ne donne pas de conseils médicaux, psychologiques ou personnels.",
                },
                {
                  q: "Est-ce que l'IA peut se tromper ?",
                  r: "Oui, comme tout outil. L'IA peut générer des corrections imprécises, surtout sur des questions très spécifiques ou ambiguës. C'est pourquoi nous encourageons votre enfant à vérifier avec son enseignant en cas de doute. Vous pouvez aussi nous signaler une erreur à support@edu-reussite.com.",
                },
                {
                  q: "Pourquoi la plateforme a-t-elle besoin des informations sur le TDAH ou la dyslexie de mon enfant ?",
                  r: "Ces informations permettent à l'IA d'adapter sa pédagogie : exercices plus courts pour le TDAH, typographie adaptée pour la dyslexie, rythme plus lent pour l'anxiété. Ces données sont strictement confidentielles, jamais partagées, et vous pouvez les retirer à tout moment.",
                },
                {
                  q: "Est-ce que d'autres enfants ou familles peuvent voir les résultats de mon enfant ?",
                  r: "Non. Les données scolaires de votre enfant sont accessibles uniquement par vous (parent/tuteur) et par l'enseignant que vous avez désigné. Aucune autre famille ne peut y accéder.",
                },
                {
                  q: "Que se passe-t-il si je supprime le compte ?",
                  r: "La suppression est immédiate et irréversible. Toutes les données associées au profil (résultats, plan d'apprentissage, historique) sont effacées de nos serveurs. Aucune copie n'est conservée.",
                },
                {
                  q: "L'IA s'améliore-t-elle grâce aux données de mon enfant ?",
                  r: "Non. Nous n'entraînons pas de modèle d'IA avec les données de vos enfants. Notre fournisseur d'IA s'engage contractuellement à ne pas utiliser les données de ses clients pour entraîner ses modèles.",
                },
              ].map((item) => (
                <details key={item.q} className="group rounded-2xl border border-[var(--color-rule)] bg-white overflow-hidden">
                  <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 text-sm font-semibold text-[var(--color-ink)] list-none">
                    <span>{item.q}</span>
                    <span className="flex-shrink-0 text-[var(--color-ink-soft)] group-open:rotate-45 transition-transform duration-200 text-lg leading-none mt-0.5">+</span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-[var(--color-ink-soft)] leading-relaxed border-t border-[var(--color-rule)] pt-4">
                    {item.r}
                  </div>
                </details>
              ))}
            </div>
          </Section>

        </div>

        {/* CTA final */}
        <div className="mt-16 rounded-2xl bg-[var(--color-ink)] p-8 text-center">
          <p className="text-white/70 text-sm mb-2">Une question qui n'est pas répondue ici ?</p>
          <p className="text-white font-black text-xl mb-6">Écrivez-nous directement.</p>
          <a
            href="mailto:support@edu-reussite.com"
            className="inline-block rounded-xl bg-white px-6 py-3 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] transition-colors"
          >
            support@edu-reussite.com
          </a>
          <p className="text-white/50 text-xs mt-4">Réponse garantie sous 48h · En français</p>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-[var(--color-rule)] pt-8 text-center">
          <p className="text-xs text-[var(--color-ink-soft)]">
            © {new Date().getFullYear()} Édu-Réussite ·{" "}
            <Link href="/" className="hover:underline">Accueil</Link>
            {" · "}
            <Link href="/politique-confidentialite" className="hover:underline">Politique de confidentialité</Link>
            {" · "}
            <Link href="/login" className="hover:underline">Connexion</Link>
          </p>
        </div>

      </main>
    </div>
  );
}
