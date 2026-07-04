"use client";

import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

type LectureJournaliere = {
  id: string;
  titreLivre: string;
  auteur?: string | null;
  qui?: string | null;
  quoi?: string | null;
  ou?: string | null;
  quand?: string | null;
  pourquoi?: string | null;
  analyseIA?: string | null;
  scoreGlobal?: number | null;
  date: Date;
};

interface Props {
  lectureAujourdhui: LectureJournaliere | null;
  historique: LectureJournaliere[];
  enFrancais: boolean;
}

type Onglet = "formulaire" | "historique";

const L = (fr: string, en: string, enFrancais: boolean) => enFrancais ? fr : en;

export function LectureClient({ lectureAujourdhui, historique, enFrancais }: Props) {
  const router = useRouter();
  const [onglet, setOnglet] = useState<Onglet>(lectureAujourdhui ? "historique" : "formulaire");

  // Form state
  const [titre, setTitre] = useState(lectureAujourdhui?.titreLivre ?? "");
  const [auteur, setAuteur] = useState(lectureAujourdhui?.auteur ?? "");
  const [qui, setQui]     = useState(lectureAujourdhui?.qui ?? "");
  const [quoi, setQuoi]   = useState(lectureAujourdhui?.quoi ?? "");
  const [ou, setOu]       = useState(lectureAujourdhui?.ou ?? "");
  const [quand, setQuand] = useState(lectureAujourdhui?.quand ?? "");
  const [pourquoi, setPourquoi] = useState(lectureAujourdhui?.pourquoi ?? "");
  const [analyse, setAnalyse]   = useState(lectureAujourdhui?.analyseIA ?? "");
  const [score, setScore]       = useState(lectureAujourdhui?.scoreGlobal ?? null as number | null);

  // Photo upload state
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadEnCours, setUploadEnCours] = useState(false);
  const [uploadErreur, setUploadErreur]   = useState("");

  const mutation = trpc.eleve.soumettreLecture.useMutation({
    onSuccess: (data) => {
      setAnalyse(data.analyseIA ?? "");
      setScore(data.scoreGlobal ?? null);
      router.refresh();
    },
  });

  const handlePhotoUpload = async (file: File) => {
    setUploadEnCours(true);
    setUploadErreur("");
    try {
      const form = new FormData();
      form.append("fichier", file);
      const res = await fetch("/api/eleve/lecture-photo", { method: "POST", body: form });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? L("Erreur lors de l'analyse", "Error during analysis", enFrancais));
      }
      const data = (await res.json()) as {
        qui?: string; quoi?: string; ou?: string; quand?: string; pourquoi?: string;
      };
      if (data.qui)      setQui(data.qui);
      if (data.quoi)     setQuoi(data.quoi);
      if (data.ou)       setOu(data.ou);
      if (data.quand)    setQuand(data.quand);
      if (data.pourquoi) setPourquoi(data.pourquoi);
    } catch (e) {
      setUploadErreur(e instanceof Error ? e.message : L("Erreur inconnue", "Unknown error", enFrancais));
    } finally {
      setUploadEnCours(false);
    }
  };

  const handleSubmit = () => {
    if (!titre.trim()) return;
    mutation.mutate({
      titreLivre: titre.trim(),
      auteur: auteur.trim() || undefined,
      qui: qui.trim() || undefined,
      quoi: quoi.trim() || undefined,
      ou: ou.trim() || undefined,
      quand: quand.trim() || undefined,
      pourquoi: pourquoi.trim() || undefined,
    });
  };

  const dejaSoumis = !!lectureAujourdhui && !mutation.isSuccess;
  const showSucces = mutation.isSuccess || (!!lectureAujourdhui && analyse);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[var(--color-ink)]">
          📖 {L("Lecture du jour", "Today's Reading", enFrancais)}
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          {L(
            "Lis un livre et résume-le en répondant aux 5 questions essentielles.",
            "Read a book and summarize it by answering the 5 essential questions.",
            enFrancais
          )}
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 mb-6 rounded-xl bg-[var(--color-paper)] p-1">
        {(["formulaire", "historique"] as Onglet[]).map((o) => (
          <button
            key={o}
            onClick={() => setOnglet(o)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
              onglet === o
                ? "bg-white text-[var(--color-ink)] shadow-sm"
                : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            }`}
          >
            {o === "formulaire"
              ? L("Aujourd'hui", "Today", enFrancais)
              : L("Historique", "History", enFrancais)}
            {o === "historique" && historique.length > 0 && (
              <span className="ml-1.5 rounded-full bg-[var(--color-ink-soft)]/20 px-1.5 py-0.5 text-[10px] font-bold">
                {historique.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── ONGLET FORMULAIRE ── */}
      {onglet === "formulaire" && (
        <div className="space-y-4">
          {/* Succès + analyse IA */}
          {showSucces && analyse && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🤖</span>
                <p className="font-bold text-emerald-800 text-sm">
                  {L("Analyse IA", "AI Analysis", enFrancais)}
                  {score !== null && (
                    <span className="ml-2 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-xs font-black text-emerald-700">
                      {score}/100
                    </span>
                  )}
                </p>
              </div>
              <p className="text-sm text-emerald-700 leading-relaxed">{analyse}</p>
            </div>
          )}

          {dejaSoumis && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {L(
                "Tu as déjà soumis une lecture aujourd'hui ! Tu peux modifier tes réponses.",
                "You already submitted a reading today! You can update your answers.",
                enFrancais
              )}
            </div>
          )}

          {/* Infos du livre */}
          <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink-soft)]">
              {L("Informations du livre", "Book Info", enFrancais)}
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
                {L("Titre du livre *", "Book title *", enFrancais)}
              </label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder={L("Ex : Charlotte's Web", "Ex: Charlotte's Web", enFrancais)}
                className="w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)] focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
                {L("Auteur (facultatif)", "Author (optional)", enFrancais)}
              </label>
              <input
                type="text"
                value={auteur}
                onChange={(e) => setAuteur(e.target.value)}
                placeholder={L("Ex : E.B. White", "Ex: E.B. White", enFrancais)}
                className="w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)] focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Photo upload */}
          <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink-soft)] mb-2">
              {L("Photo du résumé (facultatif)", "Photo of summary (optional)", enFrancais)}
            </p>
            <p className="text-xs text-[var(--color-ink-soft)] mb-3">
              {L(
                "Tu as écrit ton résumé à la main ? Prends-en une photo et on remplira les champs pour toi !",
                "Did you write your summary by hand? Take a photo and we'll fill in the fields for you!",
                enFrancais
              )}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadEnCours}
              className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-4 py-3 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-white hover:border-[var(--color-ink)] transition-colors disabled:opacity-50 w-full justify-center"
            >
              {uploadEnCours ? (
                <>
                  <span className="animate-spin">⟳</span>
                  {L("Analyse en cours…", "Analyzing…", enFrancais)}
                </>
              ) : (
                <>
                  📷 {L("Choisir une photo", "Choose a photo", enFrancais)}
                </>
              )}
            </button>
            {uploadErreur && (
              <p className="mt-2 text-xs text-red-600">{uploadErreur}</p>
            )}
          </div>

          {/* 5W fields */}
          <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-4 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink-soft)]">
              {L("Les 5 questions essentielles", "The 5 essential questions", enFrancais)}
            </p>

            {[
              {
                label: enFrancais ? "Qui ? (Les personnages principaux)" : "Who? (Main characters)",
                val: qui, set: setQui,
                placeholder: enFrancais ? "Ex : Charlotte, Wilbur, Templeton…" : "Ex: Charlotte, Wilbur, Templeton…",
                emoji: "👥",
              },
              {
                label: enFrancais ? "Quoi ? (Ce qui se passe)" : "What? (What happens)",
                val: quoi, set: setQuoi,
                placeholder: enFrancais ? "Ex : Charlotte tisse des mots dans sa toile pour sauver Wilbur." : "Ex: Charlotte weaves words in her web to save Wilbur.",
                emoji: "📋",
              },
              {
                label: enFrancais ? "Où ? (Le lieu)" : "Where? (The setting)",
                val: ou, set: setOu,
                placeholder: enFrancais ? "Ex : Dans une ferme en milieu rural." : "Ex: On a farm in the countryside.",
                emoji: "📍",
              },
              {
                label: enFrancais ? "Quand ? (L'époque)" : "When? (The time period)",
                val: quand, set: setQuand,
                placeholder: enFrancais ? "Ex : À l'automne, avant la foire agricole." : "Ex: In autumn, before the county fair.",
                emoji: "🕐",
              },
              {
                label: enFrancais ? "Pourquoi ? (Le message / la leçon)" : "Why? (The message / lesson)",
                val: pourquoi, set: setPourquoi,
                placeholder: enFrancais ? "Ex : L'amitié peut surmonter tous les obstacles." : "Ex: Friendship can overcome all obstacles.",
                emoji: "💡",
              },
            ].map(({ label, val, set, placeholder, emoji }) => (
              <div key={emoji}>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink)]">
                  <span>{emoji}</span> {label}
                </label>
                <textarea
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  placeholder={placeholder}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)] focus:bg-white transition-colors"
                />
              </div>
            ))}
          </div>

          {/* Erreur mutation */}
          {mutation.isError && (
            <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {mutation.error?.message ?? L("Une erreur s'est produite.", "An error occurred.", enFrancais)}
            </p>
          )}

          {/* Bouton soumettre */}
          <button
            onClick={handleSubmit}
            disabled={!titre.trim() || mutation.isPending}
            className="w-full rounded-2xl bg-[var(--color-ink)] px-4 py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 active:scale-[0.98]"
          >
            {mutation.isPending
              ? L("Analyse IA en cours…", "AI analysis in progress…", enFrancais)
              : dejaSoumis
                ? L("Mettre à jour ma lecture", "Update my reading", enFrancais)
                : L("Soumettre ma lecture", "Submit my reading", enFrancais)
            }
          </button>
        </div>
      )}

      {/* ── ONGLET HISTORIQUE ── */}
      {onglet === "historique" && (
        <div className="space-y-3">
          {historique.length === 0 ? (
            <div className="rounded-2xl border border-[var(--color-rule)] bg-white px-6 py-12 text-center">
              <p className="text-4xl mb-3">📚</p>
              <p className="font-semibold text-[var(--color-ink)]">
                {L("Aucune lecture enregistrée", "No readings recorded yet", enFrancais)}
              </p>
              <p className="text-sm text-[var(--color-ink-soft)] mt-1">
                {L("Soumets ta première lecture !", "Submit your first reading!", enFrancais)}
              </p>
              <button
                onClick={() => setOnglet("formulaire")}
                className="mt-4 rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity"
              >
                {L("Commencer →", "Get started →", enFrancais)}
              </button>
            </div>
          ) : (
            historique.map((lecture) => (
              <div key={lecture.id} className="rounded-2xl border border-[var(--color-rule)] bg-white p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-bold text-[var(--color-ink)] text-sm">{lecture.titreLivre}</p>
                    {lecture.auteur && (
                      <p className="text-xs text-[var(--color-ink-soft)]">{lecture.auteur}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {lecture.scoreGlobal !== null && lecture.scoreGlobal !== undefined && (
                      <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-xs font-black text-emerald-700">
                        {lecture.scoreGlobal}/100
                      </span>
                    )}
                    <span className="text-xs text-[var(--color-ink-soft)]">
                      {new Date(lecture.date).toLocaleDateString(enFrancais ? "fr-CA" : "en-CA", {
                        day: "numeric", month: "short",
                      })}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {lecture.qui     && <Detail emoji="👥" label={enFrancais ? "Qui"      : "Who"}     val={lecture.qui} />}
                  {lecture.quoi    && <Detail emoji="📋" label={enFrancais ? "Quoi"     : "What"}    val={lecture.quoi} />}
                  {lecture.ou      && <Detail emoji="📍" label={enFrancais ? "Où"       : "Where"}   val={lecture.ou} />}
                  {lecture.quand   && <Detail emoji="🕐" label={enFrancais ? "Quand"    : "When"}    val={lecture.quand} />}
                  {lecture.pourquoi && <Detail emoji="💡" label={enFrancais ? "Pourquoi" : "Why"}    val={lecture.pourquoi} />}
                </div>

                {lecture.analyseIA && (
                  <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
                      🤖 {enFrancais ? "Analyse IA" : "AI Analysis"}
                    </p>
                    <p className="text-xs text-emerald-700 leading-relaxed">{lecture.analyseIA}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ emoji, label, val }: { emoji: string; label: string; val: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="flex-shrink-0 text-base leading-5">{emoji}</span>
      <p className="text-[var(--color-ink-soft)]">
        <span className="font-semibold text-[var(--color-ink)]">{label} : </span>
        {val}
      </p>
    </div>
  );
}
