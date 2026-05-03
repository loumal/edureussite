import Link from "next/link";

export const metadata = {
  title: "Notre approche de l'IA — Édu-Réussite",
  description: "Édu-Réussite répond aux préoccupations des parents québécois sur l'intelligence artificielle en éducation : transparence, contrôle parental, conformité Loi 25, et principes éthiques.",
};

export default function NotreApprocheIAPage() {
  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      {/* Navigation */}
      <header className="sticky top-0 z-10 border-b border-[var(--color-rule)] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-base font-black text-[var(--color-ink)] tracking-tight hover:opacity-75 transition-opacity">
            ✦ Édu-Réussite
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/comment-ca-marche" className="hidden sm:block text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors">
              Comment ça marche
            </Link>
            <Link href="/login" className="rounded-xl bg-[var(--color-ink)] px-4 py-2 text-xs font-bold text-white hover:opacity-85 transition-opacity">
              Se connecter
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 pb-20">

        {/* En-tête */}
        <div className="mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(91,79,207,0.25)] bg-[rgba(91,79,207,0.06)] px-3 py-1 text-[11px] font-semibold text-[var(--color-purple)]">
            Position publique
          </span>
          <h1 className="mt-4 text-4xl font-black text-[var(--color-ink)] leading-tight tracking-tight sm:text-5xl">
            Notre approche<br />
            <span style={{ background: "linear-gradient(135deg, var(--color-purple) 0%, var(--color-accent) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              de l'intelligence artificielle
            </span>
          </h1>
          <p className="mt-5 text-base text-[var(--color-ink-soft)] leading-relaxed">
            Les parents québécois posent des questions légitimes sur l'IA en éducation. Nous répondons directement, sans langue de bois, en nous appuyant sur nos choix techniques réels.
          </p>
          <p className="mt-2 text-xs text-[var(--color-ink-soft)]">Publié le 3 mai 2026 · En réponse aux préoccupations documentées par le rapport Obvia/CIRANO sur l'IA et la confiance au Québec</p>
        </div>

        {/* Intro contexte */}
        <div className="mb-14 rounded-2xl border border-[rgba(91,79,207,0.2)] bg-[rgba(91,79,207,0.04)] p-6">
          <p className="font-bold text-[var(--color-purple)] mb-3">📋 Pourquoi cette page ?</p>
          <p className="text-sm text-[var(--color-ink)] leading-relaxed mb-3">
            Des chercheurs québécois (Obvia, CIRANO) ont documenté une préoccupation croissante des parents face à l'utilisation de l'IA avec leurs enfants : manque de transparence, perte de contrôle, incertitude sur l'utilisation des données.
          </p>
          <p className="text-sm text-[var(--color-ink)] leading-relaxed">
            Ces inquiétudes sont légitimes. Plutôt que de les minimiser, nous avons choisi de les adresser frontalement — en expliquant ce que nous faisons concrètement pour y répondre.
          </p>
        </div>

        <div className="space-y-14">

          {/* Principe 1 — L'humain décide */}
          <div>
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-2xl bg-[var(--color-ink)] text-white text-sm font-black">1</div>
              <div>
                <h2 className="text-xl font-black text-[var(--color-ink)]">L'IA informe. Les humains décident.</h2>
                <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">Préoccupation parentale : "L'IA va-t-elle prendre des décisions à ma place ?"</p>
              </div>
            </div>
            <div className="pl-14 space-y-4">
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
                Aucune décision ayant un impact sur la scolarité de votre enfant n'est prise de façon entièrement automatisée. L'IA d'Édu-Réussite remplit trois fonctions : générer des exercices, corriger des réponses, et signaler des patterns qui pourraient mériter l'attention d'un spécialiste.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { titre: "Ce que l'IA fait", items: ["Générer des exercices adaptés", "Corriger et expliquer les erreurs", "Signaler une difficulté potentielle"], couleur: "rgba(42,124,111,0.08)", bord: "rgba(42,124,111,0.2)", text: "var(--color-success)" },
                  { titre: "Ce que vous décidez", items: ["Consulter ou non un spécialiste", "Ajuster le profil de votre enfant", "Activer ou désactiver l'IA"], couleur: "rgba(217,79,43,0.06)", bord: "rgba(217,79,43,0.2)", text: "var(--color-accent)" },
                  { titre: "Ce que l'enseignant garde", items: ["L'autorité pédagogique", "L'évaluation officielle", "La relation avec l'élève"], couleur: "rgba(91,79,207,0.06)", bord: "rgba(91,79,207,0.2)", text: "var(--color-purple)" },
                ].map((col) => (
                  <div key={col.titre} className="rounded-2xl border p-4" style={{ background: col.couleur, borderColor: col.bord }}>
                    <p className="text-xs font-bold mb-2" style={{ color: col.text }}>{col.titre}</p>
                    <ul className="space-y-1">
                      {col.items.map((item) => (
                        <li key={item} className="text-xs text-[var(--color-ink)] flex items-start gap-1.5">
                          <span className="mt-0.5 flex-shrink-0">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Principe 2 — Données minimales */}
          <div>
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-2xl bg-[var(--color-ink)] text-white text-sm font-black">2</div>
              <div>
                <h2 className="text-xl font-black text-[var(--color-ink)]">Collecte minimale. Utilisation transparente.</h2>
                <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">Préoccupation parentale : "Quelles données ma famille donne-t-elle vraiment ?"</p>
              </div>
            </div>
            <div className="pl-14 space-y-4">
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
                Nous appliquons le principe de <strong className="text-[var(--color-ink)]">minimisation des données</strong> : collecter seulement ce qui est strictement nécessaire au service pédagogique, et l'utiliser uniquement pour ce service.
              </p>
              <div className="rounded-2xl border border-[var(--color-rule)] bg-white overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-[var(--color-rule)]">
                  <div className="p-4">
                    <p className="text-xs font-bold text-[var(--color-success)] mb-3">✅ Ce que nous collectons</p>
                    <ul className="space-y-2 text-xs text-[var(--color-ink-soft)]">
                      {["Niveau scolaire de l'élève", "Résultats aux exercices", "Style d'apprentissage déclaré", "Besoins particuliers (optionnel, renseigné par le parent)", "Durée d'utilisation de Mira (compteur hebdo)"].map(item => (
                        <li key={item} className="flex items-start gap-1.5"><span className="text-[var(--color-success)] flex-shrink-0">·</span>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-bold text-[var(--color-accent)] mb-3">✕ Ce que nous ne collectons PAS</p>
                    <ul className="space-y-2 text-xs text-[var(--color-ink-soft)]">
                      {["Enregistrements audio conservés", "Historique de navigation", "Données de localisation", "Données financières ou bancaires", "Identifiants scolaires officiels"].map(item => (
                        <li key={item} className="flex items-start gap-1.5"><span className="text-[var(--color-accent)] flex-shrink-0">·</span>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
                Les données transmises à notre fournisseur d'IA sont <strong className="text-[var(--color-ink)]">anonymisées</strong> — elles ne contiennent ni nom, ni courriel, ni aucun identifiant direct. L'IA voit un profil pédagogique, pas une personne.
              </p>
            </div>
          </div>

          {/* Principe 3 — Données au Canada */}
          <div>
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-2xl bg-[var(--color-ink)] text-white text-sm font-black">3</div>
              <div>
                <h2 className="text-xl font-black text-[var(--color-ink)]">Données hébergées au Canada.</h2>
                <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">Préoccupation parentale : "Où sont stockées les données de mon enfant ?"</p>
              </div>
            </div>
            <div className="pl-14 space-y-4">
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
                Notre base de données principale est hébergée au Canada. Les données sensibles de vos enfants ne quittent pas le territoire canadien.
              </p>
              <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    { drapeau: "🇨🇦", titre: "Base de données", lieu: "Canada", statut: "Données au Canada", couleur: "rgba(42,124,111,0.1)", bord: "rgba(42,124,111,0.3)" },
                    { drapeau: "🇺🇸", titre: "Moteur d'intelligence artificielle", lieu: "États-Unis", statut: "Données anonymisées uniquement", couleur: "rgba(201,149,42,0.08)", bord: "rgba(201,149,42,0.3)" },
                    { drapeau: "🇺🇸", titre: "Service d'envoi de courriels", lieu: "États-Unis", statut: "Adresse courriel + message uniquement", couleur: "rgba(201,149,42,0.08)", bord: "rgba(201,149,42,0.3)" },
                    { drapeau: "🇺🇸", titre: "Hébergement de l'application web", lieu: "États-Unis", statut: "Métadonnées HTTP en transit seulement", couleur: "rgba(201,149,42,0.08)", bord: "rgba(201,149,42,0.3)" },
                  ].map((item) => (
                    <div key={item.titre} className="rounded-xl border p-3" style={{ background: item.couleur, borderColor: item.bord }}>
                      <p className="font-semibold text-[var(--color-ink)] text-xs mb-0.5">{item.drapeau} {item.titre}</p>
                      <p className="text-[11px] text-[var(--color-ink-soft)]">{item.lieu}</p>
                      <p className="text-[11px] font-medium text-[var(--color-ink)] mt-1.5">→ {item.statut}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Principe 4 — Conformité Loi 25 */}
          <div>
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-2xl bg-[var(--color-ink)] text-white text-sm font-black">4</div>
              <div>
                <h2 className="text-xl font-black text-[var(--color-ink)]">Conforme à la Loi 25 du Québec.</h2>
                <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">Préoccupation parentale : "Est-ce que mes droits sont respectés ?"</p>
              </div>
            </div>
            <div className="pl-14 space-y-4">
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
                La Loi 25 (Loi modernisant des dispositions législatives en matière de protection des renseignements personnels) impose des obligations claires. Voici comment nous y répondons concrètement.
              </p>
              <div className="space-y-2">
                {[
                  { obligation: "Responsable de la protection désigné (RPRP)", action: "Désigné dès le lancement — joignable à confidentialite@edu-reussite.com", statut: true },
                  { obligation: "Consentement explicite et éclairé", action: "Obtenu lors de la création de compte, avec explication claire des finalités", statut: true },
                  { obligation: "Consentement parental pour les mineurs", action: "Les profils élèves sont créés exclusivement par le parent/tuteur légal", statut: true },
                  { obligation: "Évaluation des facteurs relatifs à la vie privée (ÉFVP)", action: "Réalisée pour tous les transferts de données hors Québec vers nos sous-traitants établis à l'étranger", statut: true },
                  { obligation: "Notification d'incident à la CAI sous 72h", action: "Procédure interne documentée et testée", statut: true },
                  { obligation: "Droits d'accès, rectification, effacement, portabilité", action: "Exercables par courriel ou directement dans les paramètres du compte", statut: true },
                  { obligation: "Droit d'opposition aux décisions automatisées", action: "Paramètre disponible dans les préférences du compte parent", statut: true },
                ].map((item) => (
                  <div key={item.obligation} className="flex gap-3 rounded-xl border border-[var(--color-rule)] bg-white px-4 py-3">
                    <span className={`flex-shrink-0 mt-0.5 text-sm ${item.statut ? "text-[var(--color-success)]" : "text-[var(--color-accent)]"}`}>
                      {item.statut ? "✅" : "⏳"}
                    </span>
                    <div>
                      <p className="font-semibold text-[var(--color-ink)] text-xs mb-0.5">{item.obligation}</p>
                      <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">{item.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Principe 5 — PFEQ */}
          <div>
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-2xl bg-[var(--color-ink)] text-white text-sm font-black">5</div>
              <div>
                <h2 className="text-xl font-black text-[var(--color-ink)]">Ancré dans le PFEQ, pas dans l'abstrait.</h2>
                <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">Préoccupation parentale : "Cette IA est-elle alignée sur ce qu'apprend mon enfant en classe ?"</p>
              </div>
            </div>
            <div className="pl-14 space-y-4">
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
                Tous nos exercices et corrections sont générés avec une référence explicite au <strong className="text-[var(--color-ink)]">Programme de formation de l'école québécoise (PFEQ)</strong> — le curriculum officiel du Ministère de l'Éducation du Québec.
              </p>
              <div className="rounded-2xl bg-[rgba(42,124,111,0.06)] border border-[rgba(42,124,111,0.2)] p-5">
                <p className="text-sm font-bold text-[var(--color-success)] mb-3">Ce que ça signifie concrètement</p>
                <div className="space-y-2 text-sm text-[var(--color-ink-soft)]">
                  {[
                    "Chaque exercice précise quelle compétence PFEQ il développe",
                    "La difficulté est calibrée sur les attentes du cycle scolaire officiel",
                    "Les corrections utilisent le même vocabulaire pédagogique qu'en classe",
                    "L'IA n'invente pas ses propres critères d'évaluation — elle s'appuie sur ceux du ministère",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <span className="text-[var(--color-success)] flex-shrink-0 mt-0.5">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Principe 6 — Pas de profilage commercial */}
          <div>
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-2xl bg-[var(--color-ink)] text-white text-sm font-black">6</div>
              <div>
                <h2 className="text-xl font-black text-[var(--color-ink)]">Zéro publicité. Zéro revente de données.</h2>
                <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">Préoccupation parentale : "Les données de mon enfant seront-elles utilisées à des fins commerciales ?"</p>
              </div>
            </div>
            <div className="pl-14">
              <div className="rounded-2xl bg-[rgba(217,79,43,0.04)] border border-[rgba(217,79,43,0.15)] p-5">
                <p className="font-black text-[var(--color-ink)] mb-4">Nos engagements fermes</p>
                <div className="space-y-3">
                  {[
                    { txt: "Nous ne vendons pas les données de vos enfants. À personne. Jamais.", icon: "🚫" },
                    { txt: "Nous n'affichons pas de publicité sur la plateforme.", icon: "🚫" },
                    { txt: "Nous ne construisons pas de profil commercial à des fins de ciblage.", icon: "🚫" },
                    { txt: "Nous n'utilisons pas les données des élèves pour entraîner des modèles d'IA tiers.", icon: "🚫" },
                    { txt: "Nos seules sources de revenus sont les abonnements familiaux et institutionnels.", icon: "✅" },
                  ].map((item) => (
                    <div key={item.txt} className="flex items-start gap-3 text-sm text-[var(--color-ink)]">
                      <span className="flex-shrink-0 text-base">{item.icon}</span>
                      <span>{item.txt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Section dialogue ouvert */}
        <div className="mt-16 rounded-2xl border border-[var(--color-rule)] bg-white p-8">
          <h3 className="text-xl font-black text-[var(--color-ink)] mb-3">Un dialogue ouvert</h3>
          <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed mb-6">
            Cette page n'est pas un document figé. L'IA évolue, la réglementation évolue, et les attentes des familles québécoises évoluent. Nous nous engageons à mettre à jour cette page à chaque changement significatif de nos pratiques, et à consulter nos utilisateurs avant d'introduire de nouvelles fonctionnalités IA.
          </p>
          <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed mb-6">
            Si vous avez une question qui n'est pas couverte ici, ou si vous souhaitez nous signaler une préoccupation, notre équipe vous répondra sous 48 heures.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:support@edu-reussite.com"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-ink)] px-5 py-3 text-sm font-bold text-white hover:opacity-85 transition-opacity"
            >
              Nous écrire directement
            </a>
            <Link
              href="/comment-ca-marche"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white transition-all"
            >
              Comment ça marche en détail →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-[var(--color-rule)] pt-8 text-center">
          <p className="text-xs text-[var(--color-ink-soft)]">
            © {new Date().getFullYear()} Édu-Réussite ·{" "}
            <Link href="/" className="hover:underline">Accueil</Link>
            {" · "}
            <Link href="/comment-ca-marche" className="hover:underline">Comment ça marche</Link>
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
