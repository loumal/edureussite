import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Politique de confidentialité — Édu-Réussite QC",
  description: "Comment Édu-Réussite QC collecte, utilise et protège vos renseignements personnels conformément à la Loi 25 du Québec.",
};

const Section = ({
  id,
  num,
  title,
  children,
}: {
  id: string;
  num: string;
  title: string;
  children: ReactNode;
}) => (
  <section id={id} className="scroll-mt-24">
    <div className="flex items-start gap-4 mb-4">
      <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-ink)] text-sm font-black text-white">
        {num}
      </div>
      <h2 className="text-lg font-black text-[var(--color-ink)] pt-1">{title}</h2>
    </div>
    <div className="text-sm text-[var(--color-ink-soft)] space-y-4 leading-relaxed pl-[52px]">
      {children}
    </div>
  </section>
);

const Tableau = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <div className="rounded-xl border border-[var(--color-rule)] overflow-hidden -ml-[52px]">
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-[var(--color-paper-warm)]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-2.5 font-bold text-[var(--color-ink)]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-rule)]">
          {rows.map((row, i) => (
            <tr key={i} className="even:bg-[rgba(15,22,35,0.01)]">
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-2.5 ${j === 0 ? "font-medium text-[var(--color-ink)]" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default function PolitiqueConfidentialitePage() {
  const dateMAJ = "3 mai 2026";

  const sections = [
    "#responsable",
    "#consentement",
    "#donnees-collectees",
    "#cookies",
    "#finalites",
    "#tiers",
    "#transferts-internationaux",
    "#conservation",
    "#securite",
    "#mineurs",
    "#ia",
    "#droits",
    "#contact",
  ];

  const tocItems = [
    "Responsable du traitement",
    "Consentement",
    "Renseignements collectés",
    "Témoins (cookies)",
    "Finalités du traitement",
    "Partage avec des tiers",
    "Transferts internationaux",
    "Conservation des données",
    "Sécurité",
    "Protection des mineurs",
    "Intelligence artificielle",
    "Vos droits (Loi 25)",
    "Nous contacter",
  ];

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      {/* Navigation */}
      <header className="sticky top-0 z-10 border-b border-[var(--color-rule)] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-base font-black text-[var(--color-ink)] tracking-tight hover:opacity-75 transition-opacity">
            ✦ Édu-Réussite QC
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-[var(--color-ink)] px-4 py-2 text-xs font-bold text-white hover:opacity-85 transition-opacity"
          >
            Se connecter
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">

          {/* Contenu principal */}
          <div>
            {/* En-tête */}
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-soft)] mb-3">
                Légal
              </p>
              <h1 className="text-4xl font-black text-[var(--color-ink)] mb-3 leading-tight">
                Politique de confidentialité
              </h1>
              <p className="text-sm text-[var(--color-ink-soft)] mb-6">
                Dernière mise à jour : <strong className="text-[var(--color-ink)]">{dateMAJ}</strong>
              </p>

              {/* Bannière engagement */}
              <div className="rounded-2xl bg-[rgba(42,124,111,0.06)] border border-[rgba(42,124,111,0.2)] p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">🔒</span>
                  <div>
                    <p className="font-bold text-[var(--color-success)] text-sm mb-1">Notre engagement envers vos données</p>
                    <p className="text-sm text-[var(--color-ink)] leading-relaxed">
                      Édu-Réussite QC s'engage à protéger vos renseignements personnels conformément à la{" "}
                      <strong>Loi modernisant des dispositions législatives en matière de protection des renseignements personnels (Loi 25)</strong>{" "}
                      du Québec et à la{" "}
                      <strong>Loi sur la protection des renseignements personnels et les documents électroniques (LPRPDE)</strong>{" "}
                      du Canada. Nous ne vendons jamais vos données. Jamais.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-14">

              {/* 1. Responsable */}
              <Section id="responsable" num="1" title="Responsable du traitement">
                <p>
                  Le responsable du traitement de vos renseignements personnels est{" "}
                  <strong className="text-[var(--color-ink)]">Édu-Réussite QC</strong>, plateforme éducative numérique québécoise opérée depuis la province de Québec, Canada.
                </p>
                <div className="rounded-xl border border-[var(--color-rule)] bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">Responsable de la protection des renseignements personnels (RPRP)</p>
                  <p className="text-[var(--color-ink)] font-semibold">Édu-Réussite QC</p>
                  <p>📧 <a href="mailto:confidentialite@edu-reussite.com" className="text-[var(--color-accent)] hover:underline">confidentialite@edu-reussite.com</a></p>
                  <p>🌐 Province de Québec, Canada</p>
                </div>
                <p>
                  Pour toute question, préoccupation ou demande d'exercice de vos droits, notre RPRP vous répondra dans un délai maximum de <strong className="text-[var(--color-ink)]">30 jours</strong>.
                </p>
              </Section>

              {/* 2. Consentement */}
              <Section id="consentement" num="2" title="Consentement">
                <p>
                  Conformément à la Loi 25, nous obtenons votre consentement libre, éclairé, et donné à des fins spécifiques avant de collecter vos renseignements personnels.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      icon: "✅",
                      titre: "Consentement explicite à l'inscription",
                      desc: "En créant un compte, vous consentez à la collecte des renseignements nécessaires au fonctionnement de la plateforme, tels que décrits dans la présente politique.",
                    },
                    {
                      icon: "👶",
                      titre: "Consentement parental pour les mineurs",
                      desc: "Les profils d'élèves mineurs sont créés exclusivement par un parent ou tuteur légal, qui consent en leur nom conformément aux dispositions légales applicables aux enfants.",
                    },
                    {
                      icon: "↩️",
                      titre: "Retrait du consentement",
                      desc: "Vous pouvez retirer votre consentement à tout moment en supprimant votre compte. Le retrait du consentement ne compromet pas la légalité des traitements effectués avant ce retrait.",
                    },
                  ].map((item) => (
                    <div key={item.titre} className="flex gap-3 rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-4 py-3">
                      <span className="text-lg flex-shrink-0">{item.icon}</span>
                      <div>
                        <p className="font-semibold text-[var(--color-ink)] text-xs mb-0.5">{item.titre}</p>
                        <p className="text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* 3. Données collectées */}
              <Section id="donnees-collectees" num="3" title="Renseignements collectés">
                <p>
                  Nous appliquons le principe de <strong className="text-[var(--color-ink)]">minimisation des données</strong> — seuls les renseignements strictement nécessaires au service sont collectés.
                </p>
                <Tableau
                  headers={["Catégorie", "Données collectées", "Personnes concernées"]}
                  rows={[
                    ["Compte utilisateur", "Prénom, nom, adresse courriel, mot de passe (haché de façon irréversible), rôle", "Parents, enseignants, spécialistes"],
                    ["Profil scolaire", "Prénom, nom, niveau scolaire, école, style d'apprentissage, matières préférées/redoutées, plan d'apprentissage IA", "Élèves"],
                    ["Bien-être scolaire", "Humeur déclarée lors des check-ins quotidiens (voluntary self-reporting)", "Élèves"],
                    ["Besoins particuliers", "TDAH, dyslexie, dyscalculie, anxiété scolaire — renseignés volontairement par le parent", "Élèves"],
                    ["Résultats scolaires", "Réponses aux exercices, scores, temps de complétion, corrections IA", "Élèves"],
                    ["Rendez-vous", "Demandes de rencontre avec des spécialistes, créneaux, statut", "Parents, spécialistes"],
                    ["Webinaires", "Inscriptions aux événements éducatifs", "Parents"],
                    ["Utilisation de Mira (IA orale)", "Durée d'utilisation hebdomadaire en secondes, identifiant de la semaine ISO, bonus de quota accordé par l'administrateur — aucun enregistrement vocal ni transcription conservés", "Élèves"],
                    ["Données techniques", "Adresse IP (sessions), type de navigateur, préférences d'affichage (localStorage)", "Tous les utilisateurs"],
                  ]}
                />
                <div className="rounded-xl bg-[rgba(217,79,43,0.04)] border border-[rgba(217,79,43,0.15)] px-4 py-3">
                  <p className="text-xs font-semibold text-[var(--color-accent)] mb-1">Ce que nous ne collectons pas</p>
                  <p className="text-xs leading-relaxed">Aucune donnée biométrique · Aucune géolocalisation précise · Aucune donnée financière ou bancaire · Aucun numéro d'assurance sociale · Aucun suivi publicitaire · Aucun enregistrement vocal permanent (le microphone Mira transmet uniquement la transcription textuelle)</p>
                </div>
              </Section>

              {/* 4. Cookies */}
              <Section id="cookies" num="4" title="Témoins (cookies)">
                <p>
                  Édu-Réussite QC utilise uniquement des témoins <strong className="text-[var(--color-ink)]">strictement essentiels</strong> au fonctionnement de la plateforme. Aucun cookie publicitaire, de pistage commercial ou d'analyse de tiers n'est installé.
                </p>
                <Tableau
                  headers={["Nom du témoin", "Finalité", "Durée", "Attributs de sécurité"]}
                  rows={[
                    ["session-token", "Maintenir la session de connexion (jeton signé et chiffré)", "30 jours", "HttpOnly · Secure · SameSite=Lax"],
                    ["csrf-token", "Protection contre les attaques CSRF (Cross-Site Request Forgery)", "Session", "HttpOnly · SameSite=Strict"],
                    ["callback-url", "URL de redirection après authentification", "Session", "Essentiel"],
                  ]}
                />
                <p>
                  Ces témoins sont <strong className="text-[var(--color-ink)]">essentiels</strong> — sans eux, la connexion à votre compte est impossible. Vous pouvez les supprimer via les paramètres de votre navigateur, ce qui mettra fin à votre session active.
                </p>
                <p>
                  Des données de préférence d'affichage (ex : tour de bienvenue vu) sont stockées dans le <strong className="text-[var(--color-ink)]">localStorage</strong> de votre navigateur — elles ne sont jamais transmises à nos serveurs.
                </p>
              </Section>

              {/* 5. Finalités */}
              <Section id="finalites" num="5" title="Finalités du traitement">
                <p>Vos renseignements sont traités exclusivement pour les finalités suivantes, conformément aux bases légales de la Loi 25 :</p>
                <div className="space-y-2">
                  {[
                    { emoji: "🔐", titre: "Authentification et sécurité du compte", desc: "Vérification d'identité, protection contre les accès non autorisés, envoi de codes OTP par courriel. Base légale : exécution du contrat." },
                    { emoji: "📊", titre: "Suivi pédagogique personnalisé", desc: "Génération du plan d'apprentissage, suivi des exercices, affichage de la progression, correction détaillée des travaux. Base légale : exécution du contrat." },
                    { emoji: "🤖", titre: "Recommandations par intelligence artificielle", desc: "Analyse du profil scolaire pour personnaliser les exercices et générer des recommandations pédagogiques. Voir section 11. Base légale : intérêt légitime pédagogique + consentement." },
                    { emoji: "📅", titre: "Gestion des rendez-vous et webinaires", desc: "Mise en relation entre parents et spécialistes, gestion des créneaux, inscriptions aux événements. Base légale : exécution du contrat." },
                    { emoji: "📧", titre: "Communications transactionnelles", desc: "Envoi de codes de vérification, confirmations, rappels de rendez-vous, invitations de l'enseignant. Aucun courriel marketing sans consentement explicite. Base légale : exécution du contrat." },
                    { emoji: "📈", titre: "Amélioration de la plateforme", desc: "Analyse technique anonymisée des erreurs et comportements d'utilisation pour corriger les bugs et améliorer l'expérience. Base légale : intérêt légitime." },
                  ].map((item) => (
                    <div key={item.titre} className="flex gap-3 rounded-xl border border-[var(--color-rule)] bg-white px-4 py-3">
                      <span className="text-lg flex-shrink-0">{item.emoji}</span>
                      <div>
                        <p className="font-semibold text-[var(--color-ink)] text-xs mb-0.5">{item.titre}</p>
                        <p className="text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* 6. Tiers */}
              <Section id="tiers" num="6" title="Partage avec des tiers">
                <p>
                  Nous faisons appel à un nombre limité de sous-traitants de confiance. Ces tiers n'ont accès qu'aux données strictement nécessaires à leur prestation et sont liés par des obligations contractuelles de confidentialité. Vos données ne sont <strong className="text-[var(--color-ink)]">jamais vendues</strong>.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      nom: "Hébergement de la base de données",
                      pays: "🇨🇦 Canada",
                      role: "Stockage sécurisé de l'ensemble des données de la plateforme",
                      donnees: "Toutes les données applicatives, chiffrées au repos (AES-256) et en transit (TLS 1.3)",
                      badge: "Données au Canada",
                      badgeCouleur: "rgba(42,124,111,0.1)",
                    },
                    {
                      nom: "Moteur d'intelligence artificielle",
                      pays: "🇺🇸 États-Unis",
                      role: "Génération d'exercices personnalisés, corrections pédagogiques et recommandations de spécialistes",
                      donnees: "Profil scolaire anonymisé (niveau, résultats, indicateurs de difficulté) — aucun nom, courriel ou identifiant direct transmis",
                      badge: "Transfert international",
                      badgeCouleur: "rgba(201,149,42,0.1)",
                    },
                    {
                      nom: "Service d'envoi de courriels",
                      pays: "🇺🇸 États-Unis",
                      role: "Acheminement des courriels transactionnels (codes de vérification, confirmations, invitations)",
                      donnees: "Adresse courriel du destinataire et contenu du message uniquement",
                      badge: "Transfert international",
                      badgeCouleur: "rgba(201,149,42,0.1)",
                    },
                    {
                      nom: "Services de synthèse et reconnaissance vocales",
                      pays: "🇺🇸 États-Unis",
                      role: "Génération de la voix de l'enseignante IA et transcription audio de secours sur certains navigateurs",
                      donnees: "Synthèse : texte à vocaliser uniquement. Transcription (mode secours) : enregistrement audio traité immédiatement et non conservé. Aucun identifiant personnel transmis.",
                      badge: "Transfert international",
                      badgeCouleur: "rgba(201,149,42,0.1)",
                    },
                    {
                      nom: "Hébergement de l'application web",
                      pays: "🇺🇸 États-Unis",
                      role: "Mise à disposition de l'interface web et traitement des requêtes applicatives",
                      donnees: "Métadonnées de requête HTTP (IP anonymisée, en-têtes) — traitées en transit uniquement, non stockées de façon permanente",
                      badge: "Transfert international",
                      badgeCouleur: "rgba(201,149,42,0.1)",
                    },
                  ].map((t) => (
                    <div key={t.nom} className="rounded-xl border border-[var(--color-rule)] bg-white p-4">
                      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                        <div>
                          <p className="font-bold text-sm text-[var(--color-ink)]">{t.nom}</p>
                          <p className="text-xs text-[var(--color-ink-soft)]">{t.pays}</p>
                        </div>
                        <span
                          className="text-[11px] font-semibold rounded-full px-2.5 py-0.5 flex-shrink-0"
                          style={{ background: t.badgeCouleur, color: "var(--color-ink)" }}
                        >
                          {t.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-ink-soft)] mb-1">
                        <span className="font-semibold text-[var(--color-ink)]">Rôle : </span>{t.role}
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        <span className="font-semibold text-[var(--color-ink)]">Données transmises : </span>{t.donnees}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* 7. Transferts internationaux */}
              <Section id="transferts-internationaux" num="7" title="Transferts internationaux de données">
                <p>
                  Certains de nos sous-traitants sont établis aux <strong className="text-[var(--color-ink)]">États-Unis</strong>. Conformément à la Loi 25, tout transfert de renseignements personnels hors Québec fait l'objet d'une évaluation des facteurs relatifs à la vie privée (ÉFVP).
                </p>
                <div className="rounded-xl bg-[rgba(201,149,42,0.06)] border border-[rgba(201,149,42,0.2)] px-4 py-4 space-y-3">
                  <p className="text-xs font-bold text-[var(--color-gold)] uppercase tracking-wider">Mesures de protection appliquées</p>
                  {[
                    "Les données transmises à notre fournisseur IA sont anonymisées — aucun identifiant personnel (nom, courriel, IP) n'est inclus dans les requêtes",
                    "Les données transmises à notre service d'envoi de courriels se limitent à l'adresse courriel du destinataire et au contenu du message transactionnel",
                    "Notre fournisseur de services vocaux reçoit uniquement le texte à vocaliser, ou en mode secours un enregistrement audio traité instantanément et non conservé",
                    "Notre fournisseur d'hébergement applicatif traite les requêtes HTTP en transit — aucune donnée applicative n'est stockée de façon permanente",
                    "Nos sous-traitants établis aux États-Unis sont soumis au cadre de protection des données UE-É.-U. ou à des clauses contractuelles équivalentes",
                    "La base de données principale est hébergée au Canada — les données sensibles ne quittent pas le territoire canadien",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-xs">
                      <span className="text-[var(--color-gold)] flex-shrink-0 mt-0.5">⚡</span>
                      <span className="text-[var(--color-ink)]">{item}</span>
                    </div>
                  ))}
                </div>
              </Section>

              {/* 8. Conservation */}
              <Section id="conservation" num="8" title="Conservation des données">
                <p>
                  Nous conservons vos renseignements uniquement le temps nécessaire aux finalités pour lesquelles ils ont été collectés, conformément aux obligations légales applicables.
                </p>
                <Tableau
                  headers={["Type de données", "Durée de conservation", "Motif"]}
                  rows={[
                    ["Compte utilisateur actif", "Durée de vie du compte", "Nécessaire au service"],
                    ["Données scolaires de l'élève", "Durée du compte parent + 1 an", "Continuité du suivi pédagogique"],
                    ["Exercices et corrections IA", "Durée du compte + 1 an", "Historique d'apprentissage"],
                    ["Recommandations IA", "7 jours (cache renouvelable)", "Calcul à la demande"],
                    ["Session de connexion", "30 jours ou fermeture de session", "Sécurité de l'authentification"],
                    ["Quota d'utilisation Mira", "Réinitialisé chaque lundi — seul le compteur de la semaine courante est conservé", "Limitation du service + équité entre utilisateurs"],
                    ["Codes OTP de vérification", "15 minutes", "Sécurité — expiration automatique"],
                    ["Jetons d'invitation spécialiste", "72 heures", "Sécurité — usage unique"],
                    ["Logs techniques (IP)", "90 jours", "Sécurité et débogage"],
                    ["Compte supprimé", "Suppression immédiate des données identifiantes", "Droit à l'effacement"],
                  ]}
                />
                <p>
                  À l'expiration des délais de conservation, les données sont <strong className="text-[var(--color-ink)]">supprimées de façon sécurisée et irréversible</strong> ou anonymisées si elles sont utilisées à des fins statistiques agrégées.
                </p>
              </Section>

              {/* 9. Sécurité */}
              <Section id="securite" num="9" title="Sécurité">
                <p>
                  Nous appliquons le principe de <strong className="text-[var(--color-ink)]">protection dès la conception (Privacy by Design)</strong> avec les mesures techniques et organisationnelles suivantes :
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    { icon: "🔑", titre: "Hachage des mots de passe", desc: "Algorithme de hachage cryptographique irréversible à coût adaptatif élevé — jamais stockés en clair" },
                    { icon: "🎲", titre: "Codes OTP cryptographiques", desc: "Générés par un générateur de nombres aléatoires cryptographiquement sûr — non prédictibles" },
                    { icon: "🍪", titre: "Sessions sécurisées", desc: "Jeton de session signé cryptographiquement, cookie HttpOnly · Secure · SameSite" },
                    { icon: "📧", titre: "Double vérification", desc: "OTP par courriel requis pour toutes les connexions adultes" },
                    { icon: "🔒", titre: "Chiffrement en transit", desc: "TLS 1.3 pour toutes les communications avec la base de données" },
                    { icon: "👮", titre: "Contrôle d'accès (RBAC)", desc: "Chaque rôle n'accède qu'à ses données autorisées" },
                    { icon: "⏱️", titre: "Limitation de débit (OTP)", desc: "Maximum 5 envois d'OTP par fenêtre de 15 minutes par adresse courriel — blocage automatique en cas de dépassement" },
                    { icon: "🚨", titre: "Détection de force brute", desc: "Déclenchement automatique d'une alerte critique dès 5 échecs de connexion consécutifs sur un même compte ou 10 échecs depuis la même adresse IP en 10 minutes" },
                    { icon: "📋", titre: "Journal de sécurité", desc: "Enregistrement en base de données de tous les événements de sécurité critiques et avertissements — visible uniquement par le super administrateur" },
                    { icon: "🛡️", titre: "En-têtes de sécurité HTTP", desc: "HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy" },
                  ].map((item) => (
                    <div key={item.titre} className="flex gap-3 rounded-xl border border-[var(--color-rule)] bg-white px-4 py-3">
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      <div>
                        <p className="font-semibold text-[var(--color-ink)] text-xs mb-0.5">{item.titre}</p>
                        <p className="text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-[rgba(42,124,111,0.06)] border border-[rgba(42,124,111,0.15)] px-4 py-3">
                  <p className="text-xs leading-relaxed">
                    <strong className="text-[var(--color-ink)]">Notification d'incident :</strong>{" "}
                    En cas de violation de données susceptible de causer un préjudice sérieux, nous nous engageons à en informer la{" "}
                    <strong>Commission d'accès à l'information (CAI)</strong> et les personnes concernées dans les délais prévus par la Loi 25 (72 heures pour la CAI).
                  </p>
                </div>
              </Section>

              {/* 10. Mineurs */}
              <Section id="mineurs" num="10" title="Protection des mineurs">
                <p>
                  Édu-Réussite QC est une plateforme conçue pour le soutien scolaire des enfants. Nous accordons une attention particulière à la protection de leurs données.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      icon: "👨‍👩‍👧",
                      titre: "Création de compte par un adulte uniquement",
                      desc: "Les profils d'élèves mineurs sont créés et gérés exclusivement par un parent ou tuteur légal. Les élèves ne peuvent pas créer de compte directement sur la plateforme.",
                    },
                    {
                      icon: "🔐",
                      titre: "Accès strictement contrôlé",
                      desc: "Les données scolaires d'un élève (résultats, humeur, plan d'apprentissage) ne sont accessibles qu'à son parent/tuteur et à son enseignant(e) désigné(e). Aucune donnée d'élève n'est affichée publiquement.",
                    },
                    {
                      icon: "🤖",
                      titre: "Anonymisation pour l'IA",
                      desc: "Les données transmises à notre fournisseur d'intelligence artificielle pour la génération de contenu pédagogique sont anonymisées — elles n'incluent ni le nom, ni le courriel, ni aucun identifiant direct de l'enfant.",
                    },
                    {
                      icon: "🚫",
                      titre: "Aucun profilage commercial",
                      desc: "Les données des élèves ne sont jamais utilisées à des fins publicitaires, de profilage commercial ou de revente. Elles servent uniquement à personnaliser le parcours d'apprentissage.",
                    },
                  ].map((item) => (
                    <div key={item.titre} className="flex gap-3 rounded-xl border border-[var(--color-rule)] bg-white px-4 py-3">
                      <span className="text-lg flex-shrink-0">{item.icon}</span>
                      <div>
                        <p className="font-semibold text-[var(--color-ink)] text-xs mb-0.5">{item.titre}</p>
                        <p className="text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* 11. IA */}
              <Section id="ia" num="11" title="Intelligence artificielle — Transparence">
                <p>
                  Édu-Réussite QC utilise l'intelligence artificielle comme outil pédagogique d'appui. Voici comment nous l'utilisons de façon responsable :
                </p>
                <div className="space-y-3">
                  {[
                    {
                      icon: "📝",
                      titre: "Génération d'exercices personnalisés",
                      desc: "L'IA génère des exercices adaptés au niveau, au style d'apprentissage et aux intérêts de l'élève, alignés sur le Programme de formation de l'école québécoise (PFEQ).",
                    },
                    {
                      icon: "📐",
                      titre: "Corrections pédagogiques détaillées",
                      desc: "L'IA analyse les réponses de l'élève et produit une correction structurée avec diagnostic de l'erreur, démarche pas à pas et stratégies pour ne plus répéter l'erreur.",
                    },
                    {
                      icon: "🧭",
                      titre: "Recommandations de spécialistes",
                      desc: "L'IA analyse le profil scolaire anonymisé de l'élève et peut recommander une consultation avec un spécialiste (orthopédagogue, psychoéducateur…). Cette recommandation est indicative — la décision appartient toujours au parent.",
                    },
                    {
                      icon: "🎙️",
                      titre: "Enseignante IA orale — Mira",
                      desc: "Mira est une enseignante IA interactive avec laquelle l'élève peut converser par texte ou par microphone. La reconnaissance vocale utilise en priorité le traitement local du navigateur (aucune donnée audio transmise à nos serveurs). Sur certains navigateurs incompatibles, un enregistrement audio est transmis à un service tiers pour transcription immédiate et n'est pas conservé. L'utilisation est limitée à 30 minutes par semaine — seul le compteur de durée est conservé en base, aucun enregistrement ni transcription.",
                    },
                  ].map((item) => (
                    <div key={item.titre} className="flex gap-3 rounded-xl border border-[var(--color-rule)] bg-white px-4 py-3">
                      <span className="text-lg flex-shrink-0">{item.icon}</span>
                      <div>
                        <p className="font-semibold text-[var(--color-ink)] text-xs mb-0.5">{item.titre}</p>
                        <p className="text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-4 py-3">
                  <p className="text-xs leading-relaxed">
                    <strong className="text-[var(--color-ink)]">Décision humaine finale :</strong>{" "}
                    Aucune décision ayant un effet juridique ou significatif sur une personne n'est prise de façon entièrement automatisée. L'IA accompagne — elle ne remplace pas le jugement des parents, des enseignants et des spécialistes.
                  </p>
                </div>
              </Section>

              {/* 12. Droits */}
              <Section id="droits" num="12" title="Vos droits (Loi 25)">
                <p>
                  Conformément à la Loi 25 et à la LPRPDE, vous disposez des droits suivants sur vos renseignements personnels :
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { emoji: "👁️", titre: "Droit d'accès", desc: "Consulter l'ensemble des renseignements que nous détenons sur vous et votre enfant." },
                    { emoji: "✏️", titre: "Droit de rectification", desc: "Faire corriger toute information inexacte, incomplète ou équivoque." },
                    { emoji: "🗑️", titre: "Droit à l'effacement", desc: "Demander la suppression complète de votre compte et de toutes les données associées." },
                    { emoji: "📦", titre: "Droit à la portabilité", desc: "Recevoir vos données dans un format structuré, couramment utilisé et lisible par machine." },
                    { emoji: "🚫", titre: "Droit d'opposition", desc: "Vous opposer à certains traitements, notamment aux recommandations par IA." },
                    { emoji: "⚠️", titre: "Droit de déposer une plainte", desc: "Contacter la Commission d'accès à l'information (CAI) du Québec si vous estimez que vos droits ne sont pas respectés." },
                  ].map((d) => (
                    <div key={d.titre} className="flex gap-3 rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-4 py-3">
                      <span className="text-lg flex-shrink-0">{d.emoji}</span>
                      <div>
                        <p className="font-semibold text-[var(--color-ink)] text-xs mb-0.5">{d.titre}</p>
                        <p className="text-xs leading-relaxed">{d.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-[var(--color-rule)] bg-white p-4">
                  <p className="text-xs font-bold text-[var(--color-ink)] mb-2">Comment exercer vos droits</p>
                  <p className="text-xs leading-relaxed mb-2">
                    Envoyez votre demande à{" "}
                    <a href="mailto:confidentialite@edu-reussite.com" className="text-[var(--color-accent)] hover:underline font-semibold">
                      confidentialite@edu-reussite.com
                    </a>{" "}
                    en précisant votre identité et la nature de votre demande. Nous vous répondrons dans un délai de <strong>30 jours</strong>.
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    Si vous n'êtes pas satisfait de notre réponse, vous pouvez contacter la{" "}
                    <a href="https://www.cai.gouv.qc.ca" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">
                      Commission d'accès à l'information (CAI) →
                    </a>
                  </p>
                </div>
              </Section>

              {/* 13. Contact */}
              <Section id="contact" num="13" title="Nous contacter">
                <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-5 space-y-2">
                  <p className="font-black text-[var(--color-ink)]">Édu-Réussite QC</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">Responsable de la protection des renseignements personnels (RPRP)</p>
                  <p className="text-sm">
                    📧{" "}
                    <a href="mailto:confidentialite@edu-reussite.com" className="text-[var(--color-accent)] hover:underline font-semibold">
                      confidentialite@edu-reussite.com
                    </a>
                  </p>
                  <p className="text-sm">🌐 Province de Québec, Canada</p>
                </div>
                <div className="rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-4 py-3">
                  <p className="text-xs leading-relaxed">
                    <strong className="text-[var(--color-ink)]">Mise à jour de cette politique :</strong>{" "}
                    Cette politique peut être mise à jour pour refléter l'évolution de nos pratiques ou des exigences légales. La date de dernière mise à jour est toujours indiquée en haut de cette page. En cas de modification substantielle, nous vous en informerons par courriel avec un préavis de 30 jours.
                  </p>
                </div>
              </Section>

            </div>

            {/* Pied de page */}
            <div className="mt-16 border-t border-[var(--color-rule)] pt-8 text-center">
              <p className="text-xs text-[var(--color-ink-soft)]">
                © {new Date().getFullYear()} Édu-Réussite QC · Tous droits réservés ·{" "}
                <Link href="/" className="hover:underline">Accueil</Link>
                {" · "}
                <Link href="/login" className="hover:underline">Connexion</Link>
              </p>
            </div>
          </div>

          {/* Sidebar — Table des matières (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-[var(--color-rule)] bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-4">
                Table des matières
              </p>
              <ol className="space-y-1">
                {tocItems.map((label, i) => (
                  <li key={i}>
                    <a
                      href={sections[i]}
                      className="flex items-center gap-2 text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors py-0.5 group"
                    >
                      <span className="text-[10px] font-black text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)] w-4 flex-shrink-0">
                        {i + 1}
                      </span>
                      {label}
                    </a>
                  </li>
                ))}
              </ol>

              <div className="mt-6 pt-4 border-t border-[var(--color-rule)]">
                <p className="text-[11px] text-[var(--color-ink-soft)] leading-relaxed">
                  Mise à jour : <strong className="text-[var(--color-ink)]">{dateMAJ}</strong>
                </p>
                <a
                  href="mailto:confidentialite@edu-reussite.com"
                  className="mt-2 block text-[11px] text-[var(--color-accent)] hover:underline"
                >
                  Questions ? Écrivez-nous →
                </a>
              </div>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
