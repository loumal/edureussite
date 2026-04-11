"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";

/* ── Types ── */
type Profil = {
  prenom: string;
  nom: string | null;
  niveauScolaire: string | null;
  ecole: string | null;
  styleApprentissage: string | null;
  matieresPreferees: unknown;
  matieresRedoutees: unknown;
  tdah: boolean;
  dyslexie: boolean;
  anxieteScolaire: boolean;
  centresInteret: unknown;
  sportFavori: string | null;
  universMediatique: string | null;
  autresPassions: string | null;
  environnement: string | null;
  personnalite: unknown;
  objectifScolaire: string | null;
  dateNaissance: Date | null;
};

/* ── Constantes ── */
const NIVEAUX = [
  { value: "PRIMAIRE_1", label: "1re année primaire" },
  { value: "PRIMAIRE_2", label: "2e année primaire" },
  { value: "PRIMAIRE_3", label: "3e année primaire" },
  { value: "PRIMAIRE_4", label: "4e année primaire" },
  { value: "PRIMAIRE_5", label: "5e année primaire" },
  { value: "PRIMAIRE_6", label: "6e année primaire" },
  { value: "SECONDAIRE_1", label: "Secondaire 1" },
  { value: "SECONDAIRE_2", label: "Secondaire 2" },
  { value: "SECONDAIRE_3", label: "Secondaire 3" },
  { value: "SECONDAIRE_4", label: "Secondaire 4" },
  { value: "SECONDAIRE_5", label: "Secondaire 5" },
];

const STYLES = [
  { value: "VISUEL", emoji: "👀", label: "Visuel — j'apprends en voyant" },
  { value: "AUDITIF", emoji: "👂", label: "Auditif — j'apprends en écoutant" },
  { value: "KINESTHESIQUE", emoji: "🖐️", label: "Kinesthésique — j'apprends en faisant" },
  { value: "LECTURE_ECRITURE", emoji: "✍️", label: "Lecture/Écriture — j'apprends en lisant et écrivant" },
];

const MATIERES = [
  { value: "FRANCAIS", emoji: "✏️", label: "Français" },
  { value: "MATHEMATIQUES", emoji: "🔢", label: "Mathématiques" },
  { value: "SCIENCES", emoji: "🔬", label: "Sciences" },
  { value: "UNIVERS_SOCIAL", emoji: "🌍", label: "Univers social" },
  { value: "ARTS", emoji: "🎨", label: "Arts" },
  { value: "ETHIQUE", emoji: "🤝", label: "Éthique" },
  { value: "ANGLAIS", emoji: "🗣️", label: "Anglais" },
  { value: "EDUCATION_PHYSIQUE", emoji: "🏃", label: "Éducation physique" },
];

const CENTRES_INTERET = [
  { value: "SOCCER", emoji: "⚽", label: "Soccer" },
  { value: "HOCKEY", emoji: "🏒", label: "Hockey" },
  { value: "BASKETBALL", emoji: "🏀", label: "Basketball" },
  { value: "NATATION", emoji: "🏊", label: "Natation" },
  { value: "SPORT_AUTRE", emoji: "🏅", label: "Autre sport" },
  { value: "JEUX_VIDEO", emoji: "🎮", label: "Jeux vidéo" },
  { value: "MANGA_BD", emoji: "📕", label: "Manga / BD" },
  { value: "LECTURE", emoji: "📚", label: "Romans / Lecture" },
  { value: "MUSIQUE", emoji: "🎵", label: "Musique" },
  { value: "CINEMA_SERIES", emoji: "🎬", label: "Films / Séries" },
  { value: "YOUTUBE", emoji: "▶️", label: "YouTube / TikTok" },
  { value: "DESSIN", emoji: "🎨", label: "Dessin / Art" },
  { value: "CUISINE", emoji: "🍳", label: "Cuisine" },
  { value: "DANSE", emoji: "💃", label: "Danse" },
  { value: "THEATRE", emoji: "🎭", label: "Théâtre" },
  { value: "ANIMAUX", emoji: "🐾", label: "Animaux" },
  { value: "NATURE", emoji: "🌲", label: "Nature / Plein air" },
  { value: "TECHNOLOGIE", emoji: "💻", label: "Techno / Code" },
  { value: "VOYAGE", emoji: "✈️", label: "Voyage" },
  { value: "MODE", emoji: "👗", label: "Mode / Style" },
];

const PERSONNALITES = [
  { value: "CURIEUX", emoji: "🔍", label: "Curieux/se" },
  { value: "CREATIF", emoji: "🎨", label: "Créatif/ve" },
  { value: "COMPETITEUR", emoji: "🏆", label: "Compétiteur/trice" },
  { value: "COOPERATIF", emoji: "🤝", label: "Coopératif/ve" },
  { value: "ANALYTIQUE", emoji: "🧮", label: "Analytique" },
  { value: "CALME", emoji: "🌿", label: "Calme" },
  { value: "SOCIABLE", emoji: "💬", label: "Sociable" },
  { value: "AMBITIEUX", emoji: "🚀", label: "Ambitieux/se" },
];

const ENVIRONNEMENTS = [
  { value: "VILLE", emoji: "🏙️", label: "Ville" },
  { value: "BANLIEUE", emoji: "🏘️", label: "Banlieue / Couronne" },
  { value: "REGION", emoji: "🌄", label: "Région / Campagne" },
];

const OBJECTIFS = [
  { value: "REUSSIR_ANNEE", emoji: "📋", label: "Passer mon année sans stress" },
  { value: "AMELIORER_NOTES", emoji: "📈", label: "Améliorer mes notes" },
  { value: "CEGEP_UNIVERSITE", emoji: "🎓", label: "Préparer le CÉGEP / l'université" },
  { value: "AIMER_APPRENDRE", emoji: "❤️", label: "Mieux aimer apprendre" },
  { value: "COMBLER_LACUNES", emoji: "🔧", label: "Combler mes lacunes" },
  { value: "SOUTIEN_PARENTS", emoji: "👪", label: "Soutien suggéré par mes parents" },
];

/* ── Helpers ── */
function isNew(val: unknown): boolean {
  if (val === null || val === undefined || val === "") return true;
  if (Array.isArray(val) && val.length === 0) return true;
  return false;
}

function SaveBadge({ saved }: { saved: boolean }) {
  if (!saved) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(42,124,111,0.12)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-success)]">
      ✓ Sauvegardé
    </span>
  );
}

function NewBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(217,79,43,0.12)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-accent)] animate-pulse">
      Nouveau !
    </span>
  );
}

/* ── Section wrapper ── */
function Section({
  titre, emoji, isIncomplete, children,
}: {
  titre: string; emoji: string; isIncomplete?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(isIncomplete ?? false);
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-[var(--color-paper-warm)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="font-bold text-sm text-[var(--color-ink)]">{titre}</span>
          {isIncomplete && <NewBadge />}
        </div>
        <span className="text-[var(--color-ink-soft)] text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="border-t border-[var(--color-rule)] px-5 py-5">{children}</div>}
    </Card>
  );
}

/* ── Main component ── */
export function ParametresClient({ profil }: { profil: Profil }) {
  const utils = trpc.useUtils();
  const mutation = trpc.eleve.mettreAJourProfil.useMutation({
    onSuccess: () => utils.eleve.getProfilParametres.invalidate(),
  });

  const save = async (data: Parameters<typeof mutation.mutateAsync>[0], setSaved: (v: boolean) => void) => {
    await mutation.mutateAsync(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const matieresPref = profil.matieresPreferees as string[];
  const matieresRedou = profil.matieresRedoutees as string[];
  const centresInteret = profil.centresInteret as string[];
  const personnalite = profil.personnalite as string[];

  /* ── Section : Identité ── */
  const SectionIdentite = () => {
    const [prenom, setPrenom] = useState(profil.prenom);
    const [nom, setNom] = useState(profil.nom ?? "");
    const [niveau, setNiveau] = useState(profil.niveauScolaire ?? "");
    const [ecole, setEcole] = useState(profil.ecole ?? "");
    const [dateNaissance, setDateNaissance] = useState(
      profil.dateNaissance ? new Date(profil.dateNaissance).toISOString().split("T")[0] : ""
    );
    const [saved, setSaved] = useState(false);

    return (
      <Section emoji="👋" titre="Qui es-tu ?" isIncomplete={!profil.dateNaissance}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *">
              <input value={prenom} onChange={(e) => setPrenom(e.target.value)} className={INPUT} />
            </Field>
            <Field label="Nom de famille">
              <input value={nom} onChange={(e) => setNom(e.target.value)} className={INPUT} />
            </Field>
          </div>
          <Field label="Niveau scolaire *">
            <select value={niveau} onChange={(e) => setNiveau(e.target.value)} className={INPUT}>
              <option value="">— Choisir —</option>
              {NIVEAUX.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
          </Field>
          <Field label="École (facultatif)">
            <input value={ecole} onChange={(e) => setEcole(e.target.value)} placeholder="Ex : École Bois-de-Coulonge" className={INPUT} />
          </Field>
          <Field label="🎂 Date de naissance">
            <input
              type="date"
              value={dateNaissance}
              onChange={(e) => setDateNaissance(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className={INPUT}
            />
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">
              Utilisée pour te souhaiter bonne fête le jour de ton anniversaire 🎉
            </p>
          </Field>
          <div className="flex items-center gap-3">
            <button
              onClick={() => save({ prenom, nom, niveauScolaire: niveau as never, ecole, dateNaissance: dateNaissance || null }, setSaved)}
              disabled={mutation.isPending || !prenom || !niveau}
              className={BTN}
            >
              Sauvegarder
            </button>
            <SaveBadge saved={saved} />
          </div>
        </div>
      </Section>
    );
  };

  /* ── Section : Style ── */
  const SectionStyle = () => {
    const [style, setStyle] = useState(profil.styleApprentissage ?? "");
    const [saved, setSaved] = useState(false);
    const incomplete = isNew(profil.styleApprentissage);

    return (
      <Section emoji="🧠" titre="Comment tu apprends ?" isIncomplete={incomplete}>
        <div className="space-y-3">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(s.value)}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-all ${
                style === s.value
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                  : "border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
              }`}
            >
              <span className="text-xl">{s.emoji}</span>
              <span className="font-medium">{s.label}</span>
              {style === s.value && <span className="ml-auto font-bold">✓</span>}
            </button>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <button onClick={() => save({ styleApprentissage: style as never }, setSaved)} disabled={mutation.isPending || !style} className={BTN}>
              Sauvegarder
            </button>
            <SaveBadge saved={saved} />
          </div>
        </div>
      </Section>
    );
  };

  /* ── Section : Matières ── */
  const SectionMatieres = () => {
    const [pref, setPref] = useState<string[]>(matieresPref);
    const [redou, setRedou] = useState<string[]>(matieresRedou);
    const [saved, setSaved] = useState(false);

    const toggle = (arr: string[], set: (v: string[]) => void, val: string) =>
      set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

    return (
      <Section emoji="📚" titre="Tes matières">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)] mb-2">❤️ Matières préférées</p>
            <div className="flex flex-wrap gap-2">
              {MATIERES.map((m) => (
                <button key={m.value} onClick={() => toggle(pref, setPref, m.value)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                    pref.includes(m.value) ? "bg-[var(--color-success)] text-white" : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-white"
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)] mb-2">😰 Matières difficiles</p>
            <div className="flex flex-wrap gap-2">
              {MATIERES.map((m) => (
                <button key={m.value} onClick={() => toggle(redou, setRedou, m.value)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                    redou.includes(m.value) ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-white"
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => save({ matieresPreferees: pref as never, matieresRedoutees: redou as never }, setSaved)} disabled={mutation.isPending} className={BTN}>
              Sauvegarder
            </button>
            <SaveBadge saved={saved} />
          </div>
        </div>
      </Section>
    );
  };

  /* ── Section : Besoins ── */
  const SectionBesoins = () => {
    const [tdah, setTdah] = useState(profil.tdah);
    const [dyslexie, setDyslexie] = useState(profil.dyslexie);
    const [anxiete, setAnxiete] = useState(profil.anxieteScolaire);
    const [saved, setSaved] = useState(false);

    const besoins = [
      { key: "tdah" as const, emoji: "⚡", titre: "TDAH / Attention", desc: "Difficile de rester concentré(e) longtemps", val: tdah, set: setTdah },
      { key: "dyslexie" as const, emoji: "📝", titre: "Dyslexie / Lecture", desc: "Lire et écrire demande beaucoup d'efforts", val: dyslexie, set: setDyslexie },
      { key: "anxieteScolaire" as const, emoji: "😰", titre: "Anxiété scolaire", desc: "Les évaluations ou l'école créent du stress", val: anxiete, set: setAnxiete },
    ];

    return (
      <Section emoji="💙" titre="Tes besoins particuliers">
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-ink-soft)] mb-1">🔒 Confidentiel — aide l'IA à mieux t'adapter.</p>
          {besoins.map((b) => (
            <button key={b.key} onClick={() => b.set((v) => !v)}
              className={`flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                b.val ? "border-[var(--color-purple)] bg-[rgba(91,79,207,0.06)]" : "border-[var(--color-rule)] bg-white hover:border-[var(--color-ink-soft)]"
              }`}
            >
              <span className="text-2xl">{b.emoji}</span>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${b.val ? "text-[var(--color-purple)]" : "text-[var(--color-ink)]"}`}>{b.titre}</p>
                <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">{b.desc}</p>
              </div>
              <div className={`mt-1 h-5 w-5 flex-shrink-0 rounded-full border-2 transition-all ${b.val ? "border-[var(--color-purple)] bg-[var(--color-purple)]" : "border-[var(--color-rule)]"}`}>
                {b.val && <svg viewBox="0 0 20 20" fill="white" className="h-full w-full p-0.5"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
              </div>
            </button>
          ))}
          <div className="flex items-center gap-3 pt-1">
            <button onClick={() => save({ tdah, dyslexie, anxieteScolaire: anxiete }, setSaved)} disabled={mutation.isPending} className={BTN}>
              Sauvegarder
            </button>
            <SaveBadge saved={saved} />
          </div>
        </div>
      </Section>
    );
  };

  /* ── Section : Univers personnel ── */
  const SectionUnivers = () => {
    const [centres, setCentres] = useState<string[]>(centresInteret);
    const [sport, setSport] = useState(profil.sportFavori ?? "");
    const [media, setMedia] = useState(profil.universMediatique ?? "");
    const [passions, setPassions] = useState(profil.autresPassions ?? "");
    const [env, setEnv] = useState(profil.environnement ?? "");
    const [perso, setPerso] = useState<string[]>(personnalite);
    const [objectif, setObjectif] = useState(profil.objectifScolaire ?? "");
    const [saved, setSaved] = useState(false);

    const hasSport = centres.some((c) => ["SOCCER", "HOCKEY", "BASKETBALL", "NATATION", "SPORT_AUTRE"].includes(c));

    const incomplete = isNew(profil.objectifScolaire) || isNew(profil.personnalite as unknown[]) || isNew(profil.centresInteret as unknown[]);

    const toggle = (arr: string[], set: (v: string[]) => void, val: string) =>
      set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

    return (
      <Section emoji="🌍" titre="Ton univers personnel" isIncomplete={incomplete}>
        <div className="space-y-6">

          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)] mb-2">❤️ Ce que tu aimes faire</p>
            <div className="flex flex-wrap gap-2">
              {CENTRES_INTERET.map((c) => (
                <button key={c.value} onClick={() => toggle(centres, setCentres, c.value)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                    centres.includes(c.value) ? "bg-[var(--color-accent)] text-white scale-105" : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-white"
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {hasSport && (
            <Field label="🏅 Ton sport ou équipe favori(e) (facultatif)">
              <input value={sport} onChange={(e) => setSport(e.target.value)} placeholder="Ex : Le Canadien de Montréal…" className={INPUT} />
            </Field>
          )}

          <Field label="🎬 Tes références culturelles (séries, jeux, artistes…)">
            <input value={media} onChange={(e) => setMedia(e.target.value)} placeholder="Ex : Naruto, Minecraft, Taylor Swift, Marvel…" className={INPUT} />
          </Field>

          <Field label="✨ Autre chose à savoir sur toi ? (facultatif)">
            <input value={passions} onChange={(e) => setPassions(e.target.value)} placeholder="Ex : Je veux devenir vétérinaire, j'adore le rap québécois…" className={INPUT} />
          </Field>

          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)] mb-2">🏡 Tu habites où ?</p>
            <div className="flex flex-wrap gap-2">
              {ENVIRONNEMENTS.map((e) => (
                <button key={e.value} onClick={() => setEnv(e.value)}
                  className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all ${
                    env === e.value ? "border-[var(--color-purple)] bg-[rgba(91,79,207,0.06)] text-[var(--color-purple)]" : "border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
                  }`}
                >
                  {e.emoji} {e.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)] mb-2">
              🧠 Comment tu te décrirais ?{" "}
              {isNew(profil.personnalite as unknown[]) && <NewBadge />}
            </p>
            <div className="flex flex-wrap gap-2">
              {PERSONNALITES.map((p) => (
                <button key={p.value} onClick={() => toggle(perso, setPerso, p.value)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                    perso.includes(p.value) ? "bg-[rgba(42,124,111,0.12)] text-[var(--color-success)] border border-[var(--color-success)]" : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-white border border-transparent"
                  }`}
                >
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)] mb-2">
              🎯 Pourquoi tu utilises ÉduRéussite ?{" "}
              {isNew(profil.objectifScolaire) && <NewBadge />}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {OBJECTIFS.map((o) => (
                <button key={o.value} onClick={() => setObjectif(o.value)}
                  className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left text-sm transition-all ${
                    objectif === o.value ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white" : "border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
                  }`}
                >
                  <span className="text-lg">{o.emoji}</span>
                  <span className="font-medium leading-snug">{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => save({
                centresInteret: centres,
                sportFavori: sport || undefined,
                universMediatique: media || undefined,
                autresPassions: passions || undefined,
                environnement: env || undefined,
                personnalite: perso,
                objectifScolaire: objectif || undefined,
              }, setSaved)}
              disabled={mutation.isPending}
              className={BTN}
            >
              Sauvegarder
            </button>
            <SaveBadge saved={saved} />
          </div>
        </div>
      </Section>
    );
  };

  return (
    <div className="space-y-4">
      {/* Banner nouvelles questions */}
      {(isNew(profil.objectifScolaire) || isNew(profil.personnalite as unknown[]) || isNew(profil.styleApprentissage)) && (
        <div className="rounded-2xl border border-[rgba(217,79,43,0.3)] bg-[rgba(217,79,43,0.04)] px-5 py-4">
          <p className="text-sm font-bold text-[var(--color-accent)] mb-1">
            🆕 Nouvelles questions disponibles !
          </p>
          <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
            Des questions ont été ajoutées pour mieux te connaître. Les sections marquées <strong>Nouveau !</strong> contiennent des questions que tu n'as pas encore répondues — complète-les pour améliorer ta personnalisation.
          </p>
        </div>
      )}

      <SectionIdentite />
      <SectionStyle />
      <SectionMatieres />
      <SectionBesoins />
      <SectionUnivers />

      {/* Compte */}
      <Card className="px-5 py-5">
        <p className="text-sm font-bold text-[var(--color-ink)] mb-3">🔑 Mon compte</p>
        <p className="text-xs text-[var(--color-ink-soft)] mb-4">
          Pour changer ton courriel ou mot de passe, contacte l'administrateur de l'école.
        </p>
        <div className="rounded-xl bg-[var(--color-paper-warm)] px-4 py-3">
          <p className="text-xs text-[var(--color-ink-soft)]">
            💡 Tes données personnelles sont utilisées uniquement pour personnaliser ton expérience d'apprentissage et ne sont jamais partagées sans ton consentement.
          </p>
        </div>
      </Card>
    </div>
  );
}

/* ── Helpers UI ── */
const INPUT =
  "w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]";

const BTN =
  "rounded-xl bg-[var(--color-ink)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">{label}</label>
      {children}
    </div>
  );
}
