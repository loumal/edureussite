"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

type Onglet = "SOCIAL" | "VEILLE" | "MARKETING" | "PARTENARIAT" | "JOURNAL";

interface Source { title: string; url: string; content: string; score: number; }

// ─── Composant Sources Web ────────────────────────────────────────────────────

function SourcesWeb({ sources, webDispo }: { sources?: Source[]; webDispo?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  if (!webDispo) return (
    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--color-ink-soft)]">
      <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium">Base IA uniquement</span>
      <span>— Configurez TAVILY_API_KEY pour activer la recherche web en temps réel</span>
    </div>
  );
  if (!sources?.length) return null;
  return (
    <div className="mt-2">
      <button onClick={() => setOuvert(!ouvert)}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-success)] hover:opacity-75 transition-opacity">
        <span className="rounded-full bg-green-100 px-2 py-0.5">🌐 Web live · {sources.length} source{sources.length > 1 ? "s" : ""}</span>
        <span className="text-[var(--color-ink-soft)]">{ouvert ? "▲ Masquer" : "▼ Voir les sources"}</span>
      </button>
      {ouvert && (
        <div className="mt-2 space-y-1.5">
          {sources.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-2 hover:bg-[var(--color-rule)] transition-colors">
              <span className="text-[10px] font-bold text-[var(--color-ink-soft)] mt-0.5 flex-shrink-0">#{i + 1}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--color-ink)] truncate">{s.title}</p>
                <p className="text-[10px] text-[var(--color-ink-soft)] truncate">{s.url}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────

function ResultatCard({ titre, contenu, onCopier }: { titre: string; contenu: string; onCopier: () => void }) {
  const [copie, setCopie] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(contenu).then(() => {
      setCopie(true);
      onCopier();
      setTimeout(() => setCopie(false), 2000);
    });
  }
  return (
    <div className="mt-4 rounded-xl border border-[var(--color-rule)] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-rule)] bg-[var(--color-paper-warm)]">
        <span className="text-xs font-bold text-[var(--color-ink-soft)] uppercase tracking-wide">{titre}</span>
        <button
          onClick={handleCopy}
          className="text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
        >
          {copie ? "✓ Copié !" : "Copier"}
        </button>
      </div>
      <div className="px-4 py-4 text-sm text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
        {contenu}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)] resize-none"
      />
    </div>
  );
}

function BoutonGenerer({ onClick, pending, label = "Générer" }: { onClick: () => void; pending: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="w-full rounded-xl bg-[var(--color-ink)] py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
    >
      {pending ? "Génération en cours…" : `✦ ${label}`}
    </button>
  );
}

function ErreurMsg({ msg }: { msg: string }) {
  return <p className="mt-2 text-xs text-[var(--color-accent)]">{msg}</p>;
}

// ─── Social Media — Constantes ────────────────────────────────────────────────

const PLATEFORME_SOCIAL: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  LINKEDIN:  { label: "LinkedIn",  emoji: "💼", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  FACEBOOK:  { label: "Facebook",  emoji: "📘", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  INSTAGRAM: { label: "Instagram", emoji: "📸", color: "text-pink-700",   bg: "bg-pink-50 border-pink-200" },
};

const OBJECTIF_BADGE: Record<string, { label: string; color: string }> = {
  NOTORIETE:    { label: "Notoriété",    color: "bg-sky-100 text-sky-700" },
  ENGAGEMENT:   { label: "Engagement",   color: "bg-amber-100 text-amber-700" },
  CONVERSION:   { label: "Conversion",   color: "bg-green-100 text-green-700" },
  FIDELISATION: { label: "Fidélisation", color: "bg-purple-100 text-purple-700" },
};

const STATUT_PUB: Record<string, { label: string; color: string }> = {
  BROUILLON: { label: "Brouillon", color: "bg-gray-100 text-gray-600" },
  PLANIFIE:  { label: "Planifié",  color: "bg-amber-100 text-amber-700" },
  PUBLIE:    { label: "Publié ✓",  color: "bg-green-100 text-green-700" },
  ERREUR:    { label: "Erreur",    color: "bg-red-100 text-red-600" },
};

const JOURS_FR = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MOIS_FR  = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "aoû", "sep", "oct", "nov", "déc"];

// ─── Sous-onglet : Comptes ────────────────────────────────────────────────────

function SocialComptesTab() {
  const utils = trpc.useUtils();
  const { data: comptes, isLoading } = trpc.agents.getComptesSociaux.useQuery();
  const connecter = trpc.agents.connecterCompte.useMutation({
    onSuccess: () => { utils.agents.getComptesSociaux.invalidate(); setShowForm(false); setNom(""); setPageId(""); setToken(""); setExpire(""); },
  });
  const supprimer = trpc.agents.supprimerCompte.useMutation({
    onSuccess: () => utils.agents.getComptesSociaux.invalidate(),
  });

  const [showForm, setShowForm] = useState(false);
  const [plateforme, setPlateforme] = useState("LINKEDIN");
  const [nom, setNom] = useState("");
  const [pageId, setPageId] = useState("");
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");

  const PLATEFORME_HELP: Record<string, string> = {
    LINKEDIN:  "ID numérique de la page organisation (trouvable dans l'URL admin). Token OAuth 2.0 d'une app LinkedIn.",
    FACEBOOK:  "Page ID Facebook (Paramètres de la page > À propos). Token de page longue durée via Meta for Developers.",
    INSTAGRAM: "Instagram Business Account ID (via Meta Graph API Explorer). Token de la page Facebook liée.",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-ink-soft)]">
          {comptes?.length ?? 0} compte{(comptes?.length ?? 0) !== 1 ? "s" : ""} connecté{(comptes?.length ?? 0) !== 1 ? "s" : ""}
        </p>
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-[var(--color-ink)] px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity">
          {showForm ? "Annuler" : "+ Connecter un compte"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] p-5 space-y-4">
          <p className="text-xs font-bold text-[var(--color-ink)]">Nouveau compte social</p>

          <div className="grid grid-cols-3 gap-2">
            {["LINKEDIN", "FACEBOOK", "INSTAGRAM"].map(p => {
              const meta = PLATEFORME_SOCIAL[p]!;
              return (
                <button key={p} onClick={() => setPlateforme(p)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                    plateforme === p ? `${meta.bg} border-current ${meta.color}` : "border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)]"
                  }`}>
                  <span className="text-xl">{meta.emoji}</span>
                  <span className="text-[10px] font-bold">{meta.label}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-700">
            <strong>💡 {plateforme}</strong> — {PLATEFORME_HELP[plateforme]}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Nom du compte</label>
              <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex: ÉduRéussite QC officiel"
                className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                {plateforme === "LINKEDIN" ? "Organisation/Person ID" : plateforme === "FACEBOOK" ? "Page ID" : "IG Business Account ID"}
              </label>
              <input value={pageId} onChange={e => setPageId(e.target.value)} placeholder="Ex: 12345678"
                className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Access Token</label>
            <textarea value={token} onChange={e => setToken(e.target.value)} rows={3}
              placeholder="Coller ici le token OAuth 2.0…"
              className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-xs font-mono text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)] resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Expiration du token (optionnel)</label>
            <input type="date" value={expire} onChange={e => setExpire(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]" />
          </div>

          <button
            onClick={() => connecter.mutate({ plateforme: plateforme as "LINKEDIN" | "FACEBOOK" | "INSTAGRAM", nomCompte: nom, pageId: pageId || undefined, accessToken: token, tokenExpire: expire || undefined })}
            disabled={connecter.isPending || !nom.trim() || !token.trim()}
            className="w-full rounded-xl bg-[var(--color-ink)] py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
            {connecter.isPending ? "Connexion en cours…" : "✦ Connecter ce compte"}
          </button>
          {connecter.error && <ErreurMsg msg={connecter.error.message} />}
        </div>
      )}

      {isLoading ? (
        <p className="text-center text-sm text-[var(--color-ink-soft)] py-6">Chargement…</p>
      ) : !comptes?.length ? (
        <div className="text-center py-12 text-sm text-[var(--color-ink-soft)]">
          <div className="text-4xl mb-3">🔗</div>
          <p className="font-medium">Aucun compte connecté</p>
          <p className="text-xs mt-1 max-w-xs mx-auto">Connectez vos comptes LinkedIn, Facebook ou Instagram pour publier directement depuis cet espace.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {comptes.map(c => {
            const meta = PLATEFORME_SOCIAL[c.plateforme];
            const expBientot = c.tokenExpire && new Date(c.tokenExpire) < new Date(Date.now() + 7 * 86_400_000);
            return (
              <div key={c.id} className={`flex items-center gap-3 rounded-xl border-2 p-4 ${meta?.bg ?? "border-[var(--color-rule)] bg-white"}`}>
                <span className="text-2xl">{meta?.emoji ?? "📄"}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${meta?.color ?? ""}`}>{c.nomCompte}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{meta?.label} · ID {c.pageId ?? "—"}</p>
                  {expBientot && (
                    <p className="text-[11px] text-red-600 font-medium mt-0.5">⚠️ Token expire le {new Date(c.tokenExpire!).toLocaleDateString("fr-CA")}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Actif</span>
                  <button onClick={() => { if (confirm("Retirer ce compte ?")) supprimer.mutate({ id: c.id }); }}
                    className="rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-100 transition-colors">
                    Retirer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sous-onglet : Rédiger un post ────────────────────────────────────────────

function SocialPostTab() {
  const utils = trpc.useUtils();
  const { data: comptes } = trpc.agents.getComptesSociaux.useQuery();
  const [plateforme, setPlateforme] = useState("LINKEDIN");
  const [sujet, setSujet] = useState("");
  const [ton, setTon] = useState("PROFESSIONNEL");
  const [inclureEmoji, setInclureEmoji] = useState(true);
  const [inclureHashtags, setInclureHashtags] = useState(true);
  const [contenu, setContenu] = useState("");
  const [compteId, setCompteId] = useState("");
  const [datePlan, setDatePlan] = useState("");
  const [heurePlan, setHeurePlan] = useState("");
  const [validationErr, setValidationErr] = useState("");
  const [savedOk, setSavedOk] = useState(false);

  const comptesFiltre = (comptes ?? []).filter(c => c.plateforme === plateforme);

  const genPost = trpc.agents.genererPost.useMutation({ onSuccess: d => setContenu(d.contenu) });
  const sauvegarder = trpc.agents.sauvegarderPublication.useMutation({
    onSuccess: () => { utils.agents.getPublications.invalidate(); setSavedOk(true); setTimeout(() => setSavedOk(false), 3000); },
  });
  const publier = trpc.agents.publierPublication.useMutation({
    onSuccess: () => { utils.agents.getPublications.invalidate(); setSavedOk(true); setTimeout(() => setSavedOk(false), 3000); },
  });

  async function handleAction(publierMaintenant: boolean) {
    if (!compteId) { setValidationErr("Sélectionnez un compte pour publier."); return; }
    if (!contenu) { setValidationErr("Générez d'abord un post."); return; }
    setValidationErr("");
    const dt = datePlan && heurePlan ? `${datePlan}T${heurePlan}:00` : undefined;
    const pub = await sauvegarder.mutateAsync({ compteId, contenu, sujet: sujet || "Post généré", typeContenu: "TEXTE", planifieLe: dt });
    if (pub && publierMaintenant) await publier.mutateAsync({ id: pub.id });
  }

  const isPending = genPost.isPending;
  const isSaving  = sauvegarder.isPending || publier.isPending;
  const error = validationErr || genPost.error?.message || sauvegarder.error?.message || publier.error?.message;

  return (
    <div className="space-y-4">
      {/* Plateforme */}
      <div>
        <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-2">Plateforme</label>
        <div className="grid grid-cols-3 gap-2">
          {["LINKEDIN", "FACEBOOK", "INSTAGRAM"].map(p => {
            const meta = PLATEFORME_SOCIAL[p]!;
            return (
              <button key={p} onClick={() => { setPlateforme(p); setCompteId(""); }}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                  plateforme === p ? `${meta.bg} border-current ${meta.color}` : "border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)]"
                }`}>
                {meta.emoji} {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <SelectField label="Ton" value={ton} onChange={setTon} options={[
        { value: "PROFESSIONNEL", label: "Professionnel" },
        { value: "INSPIRANT",     label: "Inspirant & motivant" },
        { value: "EDUCATIF",      label: "Éducatif & informatif" },
        { value: "PROMOTIONNEL",  label: "Promotionnel" },
      ]} />

      <TextareaField label="Sujet / angle du post" value={sujet} onChange={setSujet}
        placeholder="Ex: Impact de l'IA adaptative sur les élèves en difficulté au Québec…" rows={2} />

      <div className="flex items-center gap-4">
        {[["Emojis", inclureEmoji, setInclureEmoji] as const, ["Hashtags", inclureHashtags, setInclureHashtags] as const].map(([lbl, val, set]) => (
          <label key={lbl} className="flex items-center gap-1.5 text-xs text-[var(--color-ink-soft)] cursor-pointer">
            <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="rounded" />
            {lbl}
          </label>
        ))}
      </div>

      <BoutonGenerer onClick={() => {
        if (!sujet.trim()) { setValidationErr("Veuillez saisir un sujet."); return; }
        setValidationErr(""); setContenu("");
        genPost.mutate({ plateforme: plateforme as "LINKEDIN" | "FACEBOOK" | "INSTAGRAM", sujet, ton: ton as "PROFESSIONNEL" | "INSPIRANT" | "EDUCATIF" | "PROMOTIONNEL", inclureEmoji, inclureHashtags });
      }} pending={isPending} label="Générer le post" />

      {error && <ErreurMsg msg={error} />}

      {contenu && (
        <div className="space-y-3">
          {/* Aperçu */}
          <div className={`rounded-xl border-2 p-5 ${PLATEFORME_SOCIAL[plateforme]?.bg ?? "border-[var(--color-rule)] bg-white"}`}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-current/10">
              <span className="text-lg">{PLATEFORME_SOCIAL[plateforme]?.emoji}</span>
              <span className={`text-xs font-bold ${PLATEFORME_SOCIAL[plateforme]?.color}`}>{PLATEFORME_SOCIAL[plateforme]?.label}</span>
              <span className="flex-1" />
              <button onClick={() => navigator.clipboard.writeText(contenu)}
                className="text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors">
                📋 Copier
              </button>
            </div>
            <div className="text-sm text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
              {contenu}
            </div>
          </div>

          {/* Publication */}
          <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] p-4 space-y-3">
            <p className="text-xs font-bold text-[var(--color-ink)]">Publier sur un compte connecté</p>

            {comptesFiltre.length === 0 ? (
              <p className="text-xs text-[var(--color-ink-soft)]">
                Aucun compte {PLATEFORME_SOCIAL[plateforme]?.label} connecté.
                Ajoutez-en un dans l'onglet <strong>Comptes</strong>.
              </p>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Compte cible</label>
                  <select value={compteId} onChange={e => setCompteId(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]">
                    <option value="">— Sélectionner —</option>
                    {comptesFiltre.map(c => <option key={c.id} value={c.id}>{c.nomCompte}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Date de planification</label>
                    <input type="date" value={datePlan} onChange={e => setDatePlan(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Heure</label>
                    <input type="time" value={heurePlan} onChange={e => setHeurePlan(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none" />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => handleAction(false)} disabled={isSaving || !compteId}
                    className="flex-1 rounded-xl border-2 border-[var(--color-ink)] py-2 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] disabled:opacity-50 transition-colors">
                    {savedOk ? "✓ Sauvegardé" : isSaving ? "Enregistrement…" : "📅 Sauvegarder"}
                  </button>
                  <button onClick={() => handleAction(true)} disabled={isSaving || !compteId || plateforme === "INSTAGRAM"}
                    title={plateforme === "INSTAGRAM" ? "Instagram requiert un média – publiez via Meta Business Suite" : ""}
                    className="flex-1 rounded-xl bg-[var(--color-ink)] py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {isSaving ? "Publication…" : "🚀 Publier maintenant"}
                  </button>
                </div>
                {plateforme === "INSTAGRAM" && (
                  <p className="text-[11px] text-[var(--color-ink-soft)]">ⓘ Instagram requiert une image — sauvegardez et publiez depuis Meta Business Suite avec le contenu texte.</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sous-onglet : Calendrier éditorial ──────────────────────────────────────

type CalPost = {
  date: string; plateforme: string; sujet: string; angle: string;
  typeContenu: string; objectif: string; heureSuggereeTz: string;
};

function SocialCalendrierTab() {
  const utils = trpc.useUtils();
  const { data: comptes } = trpc.agents.getComptesSociaux.useQuery();
  const [periode, setPeriode] = useState<"SEMAINE" | "MOIS">("SEMAINE");
  const [plateformes, setPlateformes] = useState<string[]>(["LINKEDIN"]);
  const [themes, setThemes] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [posts, setPosts] = useState<CalPost[]>([]);
  const [savedAll, setSavedAll] = useState(false);
  const [validationErr, setValidationErr] = useState("");

  const generer = trpc.agents.genererCalendrier.useMutation({
    onSuccess: d => setPosts(d.posts ?? []),
  });
  const sauvegarder = trpc.agents.sauvegarderPublication.useMutation({
    onSuccess: () => utils.agents.getPublications.invalidate(),
  });

  function togglePlateforme(p: string) {
    setPlateformes(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  async function handleSauvegarderTout() {
    const compteMap: Record<string, string | undefined> = {};
    (comptes ?? []).forEach(c => { if (!compteMap[c.plateforme]) compteMap[c.plateforme] = c.id; });
    for (const p of posts) {
      const cid = compteMap[p.plateforme];
      if (!cid) continue;
      const dt = `${p.date}T${p.heureSuggereeTz ?? "09:00"}:00`;
      await sauvegarder.mutateAsync({ compteId: cid, contenu: "", sujet: p.sujet, typeContenu: (p.typeContenu as "TEXTE" | "IMAGE" | "VIDEO") || "TEXTE", planifieLe: dt });
    }
    setSavedAll(true);
    setTimeout(() => setSavedAll(false), 4000);
  }

  const byDate = posts.reduce<Record<string, CalPost[]>>((acc, p) => {
    if (!acc[p.date]) acc[p.date] = [];
    acc[p.date]!.push(p);
    return acc;
  }, {});

  const jours: string[] = [];
  if (posts.length > 0) {
    const dates = Object.keys(byDate).sort();
    const d0 = new Date(dates[0]! + "T12:00:00");
    const dN = new Date(dates[dates.length - 1]! + "T12:00:00");
    for (const d = new Date(d0); d <= dN; d.setDate(d.getDate() + 1)) {
      jours.push(d.toISOString().slice(0, 10));
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5">Période</label>
          <div className="flex gap-2">
            {(["SEMAINE", "MOIS"] as const).map(p => (
              <button key={p} onClick={() => setPeriode(p)}
                className={`flex-1 rounded-xl border-2 py-2 text-xs font-bold transition-all ${
                  periode === p ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]" : "border-[var(--color-rule)] text-[var(--color-ink-soft)] bg-white"
                }`}>
                {p === "SEMAINE" ? "7 jours" : "30 jours"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5">À partir du</label>
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5">Plateformes</label>
        <div className="flex gap-2">
          {["LINKEDIN", "FACEBOOK", "INSTAGRAM"].map(p => {
            const meta = PLATEFORME_SOCIAL[p]!;
            return (
              <button key={p} onClick={() => togglePlateforme(p)}
                className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                  plateformes.includes(p) ? `${meta.bg} border-current ${meta.color}` : "border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)]"
                }`}>
                {meta.emoji} {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <TextareaField label="Thèmes prioritaires (optionnel)" value={themes} onChange={setThemes}
        placeholder="Ex: rentrée scolaire, succès élèves, impact IA, conseils parents TDAH…" rows={2} />

      <BoutonGenerer onClick={() => {
        if (!plateformes.length) { setValidationErr("Sélectionnez au moins une plateforme."); return; }
        setValidationErr(""); setPosts([]);
        generer.mutate({ periode, plateformes: plateformes as ("LINKEDIN" | "FACEBOOK" | "INSTAGRAM")[], themesPrioritaires: themes || undefined, dateDebut: dateDebut || undefined });
      }} pending={generer.isPending} label="Générer le calendrier éditorial" />

      {validationErr && <ErreurMsg msg={validationErr} />}
      {generer.error && <ErreurMsg msg={generer.error.message} />}

      {posts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[var(--color-ink)]">{posts.length} publication{posts.length > 1 ? "s" : ""} générée{posts.length > 1 ? "s" : ""}</p>
            {!!comptes?.length && (
              <button onClick={handleSauvegarderTout} disabled={sauvegarder.isPending || savedAll}
                className="rounded-xl bg-[var(--color-ink)] px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
                {savedAll ? "✓ Tout sauvegardé" : sauvegarder.isPending ? "Sauvegarde…" : "💾 Sauvegarder tout"}
              </button>
            )}
          </div>

          {/* ── Vue semaine (7 colonnes) ── */}
          {periode === "SEMAINE" ? (
            <div className="overflow-x-auto pb-2">
              <div className="grid gap-2 min-w-[700px]" style={{ gridTemplateColumns: `repeat(${Math.min(jours.length, 7)}, 1fr)` }}>
                {jours.slice(0, 7).map(date => {
                  const d = new Date(date + "T12:00:00");
                  const dayPosts = byDate[date] ?? [];
                  const hasPost = dayPosts.length > 0;
                  return (
                    <div key={date}>
                      <div className={`rounded-t-xl px-2 py-2.5 text-center ${hasPost ? "bg-[var(--color-ink)]" : "bg-[var(--color-paper-warm)]"}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wide ${hasPost ? "text-white/60" : "text-[var(--color-ink-soft)]"}`}>
                          {JOURS_FR[d.getDay()]}
                        </p>
                        <p className={`text-xl font-black ${hasPost ? "text-white" : "text-[var(--color-ink-soft)]"}`}>{d.getDate()}</p>
                        <p className={`text-[9px] ${hasPost ? "text-white/50" : "text-[var(--color-ink-soft)]"}`}>{MOIS_FR[d.getMonth()]}</p>
                      </div>
                      <div className="rounded-b-xl border border-t-0 border-[var(--color-rule)] bg-white p-2 space-y-1.5 min-h-[100px]">
                        {dayPosts.length === 0 ? (
                          <div className="h-10 flex items-center justify-center">
                            <span className="text-[11px] text-[var(--color-ink-soft)]">—</span>
                          </div>
                        ) : (
                          dayPosts.map((p, i) => {
                            const meta = PLATEFORME_SOCIAL[p.plateforme];
                            const obj  = OBJECTIF_BADGE[p.objectif];
                            return (
                              <div key={i} className={`rounded-lg border p-2 space-y-1 ${meta?.bg ?? "border-[var(--color-rule)] bg-white"}`}>
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px]">{meta?.emoji}</span>
                                  <span className={`text-[10px] font-bold truncate ${meta?.color}`}>{meta?.label}</span>
                                  <span className="flex-1" />
                                  <span className="text-[9px] text-[var(--color-ink-soft)] flex-shrink-0">{p.heureSuggereeTz}</span>
                                </div>
                                <p className="text-[11px] font-medium text-[var(--color-ink)] leading-tight line-clamp-2">{p.sujet}</p>
                                {obj && <span className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold ${obj.color}`}>{obj.label}</span>}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── Vue mois (liste par semaine) ── */
            <div className="space-y-3">
              {Array.from({ length: Math.ceil(jours.length / 7) }, (_, wi) => {
                const sJours = jours.slice(wi * 7, wi * 7 + 7);
                const sPosts = sJours.flatMap(d => (byDate[d] ?? []).map(p => ({ ...p, _date: d })));
                if (!sPosts.length) return null;
                const d0 = new Date(sJours[0]! + "T12:00:00");
                const dN = new Date(sJours[sJours.length - 1]! + "T12:00:00");
                return (
                  <div key={wi} className="rounded-xl border border-[var(--color-rule)] overflow-hidden">
                    <div className="bg-[var(--color-paper-warm)] px-4 py-2.5 border-b border-[var(--color-rule)] flex items-center justify-between">
                      <p className="text-xs font-bold text-[var(--color-ink)]">
                        Semaine {wi + 1} — {d0.getDate()} {MOIS_FR[d0.getMonth()]} au {dN.getDate()} {MOIS_FR[dN.getMonth()]}
                      </p>
                      <span className="text-[11px] text-[var(--color-ink-soft)]">{sPosts.length} post{sPosts.length > 1 ? "s" : ""}</span>
                    </div>
                    <div className="divide-y divide-[var(--color-rule)]">
                      {sPosts.map((p, i) => {
                        const meta = PLATEFORME_SOCIAL[p.plateforme];
                        const obj  = OBJECTIF_BADGE[p.objectif];
                        const d    = new Date(p._date + "T12:00:00");
                        return (
                          <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-paper-warm)] transition-colors">
                            <div className="w-10 flex-shrink-0 text-center">
                              <p className="text-[10px] text-[var(--color-ink-soft)] font-semibold">{JOURS_FR[d.getDay()]}</p>
                              <p className="text-base font-black text-[var(--color-ink)]">{d.getDate()}</p>
                            </div>
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold flex-shrink-0 ${meta?.bg} ${meta?.color}`}>
                              {meta?.emoji} {meta?.label}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{p.sujet}</p>
                              <p className="text-xs text-[var(--color-ink-soft)] truncate">{p.angle}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {obj && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${obj.color}`}>{obj.label}</span>}
                              <span className="text-xs text-[var(--color-ink-soft)]">{p.heureSuggereeTz}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sous-onglet : Publications & Commentaires ────────────────────────────────

function SocialPublicationsTab() {
  const utils = trpc.useUtils();
  const [filtreStatut, setFiltreStatut] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [contexte, setContexte] = useState("");
  const [platComment, setPlatComment] = useState("LINKEDIN");
  const [ton, setTon] = useState("CHALEUREUX");
  const [reponse, setReponse] = useState("");

  const { data: publications, isLoading } = trpc.agents.getPublications.useQuery(
    filtreStatut ? { statut: filtreStatut } : undefined
  );
  const publier   = trpc.agents.publierPublication.useMutation({ onSuccess: () => utils.agents.getPublications.invalidate() });
  const supprimer = trpc.agents.supprimerPublication.useMutation({ onSuccess: () => utils.agents.getPublications.invalidate() });
  const genRep    = trpc.agents.genererReponseCommentaire.useMutation({ onSuccess: d => setReponse(d.reponse) });

  return (
    <div className="space-y-5">
      {/* Filtre */}
      <div className="flex gap-2 flex-wrap">
        {[["", "Toutes"], ["BROUILLON", "Brouillons"], ["PLANIFIE", "Planifiées"], ["PUBLIE", "Publiées"], ["ERREUR", "Erreurs"]].map(([v, l]) => (
          <button key={v} onClick={() => setFiltreStatut(v!)}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${filtreStatut === v ? "bg-[var(--color-ink)] text-white" : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Liste */}
      {isLoading ? (
        <p className="text-center text-sm text-[var(--color-ink-soft)] py-6">Chargement…</p>
      ) : !publications?.length ? (
        <div className="text-center py-10 text-sm text-[var(--color-ink-soft)]">
          <div className="text-3xl mb-2">📭</div>
          Aucune publication. Générez des posts dans <strong>Rédiger</strong> ou <strong>Calendrier</strong>.
        </div>
      ) : (
        <div className="space-y-2">
          {publications.map(pub => {
            const meta   = PLATEFORME_SOCIAL[pub.compte?.plateforme ?? ""];
            const statut = STATUT_PUB[pub.statut];
            return (
              <div key={pub.id} className="rounded-xl border border-[var(--color-rule)] bg-white overflow-hidden">
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="text-2xl mt-0.5">{meta?.emoji ?? "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statut?.color ?? "bg-gray-100 text-gray-600"}`}>{statut?.label ?? pub.statut}</span>
                      <span className={`text-xs font-semibold ${meta?.color ?? ""}`}>{meta?.label ?? pub.compte?.plateforme}</span>
                      <span className="text-xs text-[var(--color-ink-soft)]">{pub.compte?.nomCompte}</span>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{pub.sujet}</p>
                    {pub.contenu && <p className="text-xs text-[var(--color-ink-soft)] mt-0.5 line-clamp-1">{pub.contenu}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--color-ink-soft)]">
                      {pub.planifieLe && <span>📅 {new Date(pub.planifieLe).toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" })}</span>}
                      {pub.publieLe  && <span>✓ Publié le {new Date(pub.publieLe).toLocaleDateString("fr-CA")}</span>}
                      {pub.erreur    && <span className="text-red-600 truncate max-w-xs">⚠ {pub.erreur}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {(pub.statut === "BROUILLON" || pub.statut === "PLANIFIE" || pub.statut === "ERREUR") && pub.contenu && (
                      <button onClick={() => publier.mutate({ id: pub.id })} disabled={publier.isPending}
                        className="rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-[11px] font-bold text-white hover:opacity-80 disabled:opacity-50 transition-opacity">
                        🚀 Publier
                      </button>
                    )}
                    <button onClick={() => { if (confirm("Supprimer ?")) supprimer.mutate({ id: pub.id }); }}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] text-red-600 hover:bg-red-100 transition-colors">
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Réponse aux commentaires */}
      <div className="rounded-xl border-2 border-dashed border-[var(--color-rule)] p-5 space-y-3">
        <div>
          <p className="text-sm font-bold text-[var(--color-ink)]">💬 Répondre à un commentaire</p>
          <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">Collez un commentaire d'internaute — l'IA génère une réponse professionnelle prête à poster.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5">Plateforme</label>
            <div className="flex gap-1.5">
              {["LINKEDIN", "FACEBOOK", "INSTAGRAM"].map(p => {
                const meta = PLATEFORME_SOCIAL[p]!;
                return (
                  <button key={p} onClick={() => setPlatComment(p)}
                    className={`flex items-center gap-1 rounded-lg border-2 px-2.5 py-1.5 text-sm transition-all ${
                      platComment === p ? `${meta.bg} border-current ${meta.color}` : "border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)]"
                    }`}>
                    {meta.emoji}
                  </button>
                );
              })}
            </div>
          </div>
          <SelectField label="Ton de la réponse" value={ton} onChange={setTon} options={[
            { value: "CHALEUREUX",     label: "Chaleureux" },
            { value: "PROFESSIONNEL",  label: "Professionnel" },
            { value: "INFORMATIF",     label: "Informatif" },
            { value: "RECONNAISSANT",  label: "Reconnaissant" },
          ]} />
        </div>

        <TextareaField label="Commentaire de l'internaute" value={commentaire} onChange={setCommentaire}
          placeholder="Ex: Bonjour, mon fils utilise l'app mais il n'y a pas assez d'exercices de géographie…" rows={2} />
        <TextareaField label="Contexte de la publication (optionnel)" value={contexte} onChange={setContexte}
          placeholder="Ex: Post sur le lancement du module d'univers social…" rows={1} />

        <BoutonGenerer onClick={() => {
          if (!commentaire.trim()) return;
          setReponse("");
          genRep.mutate({
            plateforme: platComment as "LINKEDIN" | "FACEBOOK" | "INSTAGRAM",
            commentaire, contextePublication: contexte || undefined,
            ton: ton as "PROFESSIONNEL" | "CHALEUREUX" | "INFORMATIF" | "RECONNAISSANT",
          });
        }} pending={genRep.isPending} label="Générer une réponse" />

        {genRep.error && <ErreurMsg msg={genRep.error.message} />}

        {reponse && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-green-700">Réponse suggérée · {PLATEFORME_SOCIAL[platComment]?.label}</p>
              <button onClick={() => navigator.clipboard.writeText(reponse)}
                className="text-xs font-semibold text-green-700 hover:opacity-70 transition-opacity">
                📋 Copier
              </button>
            </div>
            <p className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">{reponse}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Onglet Social Media (principal) ─────────────────────────────────────────

type ModeSocial = "COMPTES" | "POST" | "CALENDRIER" | "PUBLICATIONS";

function OngletSocial() {
  const [mode, setMode] = useState<ModeSocial>("POST");

  const MODES: { id: ModeSocial; label: string; emoji: string }[] = [
    { id: "COMPTES",      label: "Comptes",      emoji: "🔗" },
    { id: "POST",         label: "Rédiger",       emoji: "✍️" },
    { id: "CALENDRIER",   label: "Calendrier",    emoji: "📅" },
    { id: "PUBLICATIONS", label: "Publications",  emoji: "📬" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap border-b border-[var(--color-rule)] pb-3">
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              mode === m.id ? "bg-[var(--color-ink)] text-white" : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            }`}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>
      {mode === "COMPTES"      && <SocialComptesTab />}
      {mode === "POST"         && <SocialPostTab />}
      {mode === "CALENDRIER"   && <SocialCalendrierTab />}
      {mode === "PUBLICATIONS" && <SocialPublicationsTab />}
    </div>
  );
}

// ─── Onglet Veille Concurrentielle ────────────────────────────────────────────

function OngletVeille() {
  const [mode, setMode] = useState<"CONCURRENT" | "TENDANCES">("CONCURRENT");
  const [concurrent, setConcurrent] = useState("");
  const [domaine, setDomaine] = useState("EDTECH_QC");
  const [horizon, setHorizon] = useState("1_AN");
  const [resultat, setResultat] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [webDispo, setWebDispo] = useState<boolean | undefined>();
  const [validationErr, setValidationErr] = useState("");

  const analyseConcurrent = trpc.agents.analyserConcurrence.useMutation({
    onSuccess: (d) => { setResultat(d.analyse); setSources((d.sources ?? []) as Source[]); setWebDispo(d.webDispo); }
  });
  const analyseTendances = trpc.agents.analyserTendances.useMutation({
    onSuccess: (d) => { setResultat(d.rapport); setSources((d.sources ?? []) as Source[]); setWebDispo(d.webDispo); }
  });

  function generer() {
    setValidationErr(""); setSources([]); setWebDispo(undefined);
    if (mode === "CONCURRENT") {
      if (!concurrent.trim()) { setValidationErr("Veuillez saisir le nom d'un concurrent."); return; }
      analyseConcurrent.mutate({ concurrent });
    } else {
      analyseTendances.mutate({ domaine: domaine as "EDTECH_QC" | "EDTECH_CA" | "EDTECH_INTERNATIONAL" | "IA_EDUCATION" | "SAAS_EDUCATION", horizon: horizon as "6_MOIS" | "1_AN" | "3_ANS" });
    }
  }

  const isPending = analyseConcurrent.isPending || analyseTendances.isPending;
  const error = validationErr || analyseConcurrent.error?.message || analyseTendances.error?.message;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["CONCURRENT", "TENDANCES"].map((m) => (
          <button key={m} onClick={() => { setMode(m as "CONCURRENT" | "TENDANCES"); setResultat(""); setSources([]); setWebDispo(undefined); }}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${mode === m ? "bg-[var(--color-ink)] text-white" : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"}`}>
            {m === "CONCURRENT" ? "Analyser un concurrent" : "Tendances du marché"}
          </button>
        ))}
      </div>

      {mode === "CONCURRENT" ? (
        <div>
          <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Nom du concurrent</label>
          <input
            type="text"
            value={concurrent}
            onChange={(e) => setConcurrent(e.target.value)}
            placeholder="Ex: Khan Academy, Alloprof, Seesaw…"
            className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <SelectField label="Domaine" value={domaine} onChange={setDomaine} options={[
            { value: "EDTECH_QC", label: "EdTech Québec" },
            { value: "EDTECH_CA", label: "EdTech Canada" },
            { value: "EDTECH_INTERNATIONAL", label: "EdTech International" },
            { value: "IA_EDUCATION", label: "IA en éducation" },
            { value: "SAAS_EDUCATION", label: "SaaS Éducation" },
          ]} />
          <SelectField label="Horizon" value={horizon} onChange={setHorizon} options={[
            { value: "6_MOIS", label: "6 mois" }, { value: "1_AN", label: "1 an" }, { value: "3_ANS", label: "3 ans" }
          ]} />
        </div>
      )}

      <BoutonGenerer onClick={generer} pending={isPending} label={mode === "CONCURRENT" ? "Analyser" : "Générer le rapport"} />
      {error && <ErreurMsg msg={error} />}
      {resultat && (
        <>
          <SourcesWeb sources={sources} webDispo={webDispo} />
          <ResultatCard titre={mode === "CONCURRENT" ? `Analyse : ${concurrent}` : `Tendances ${domaine}`} contenu={resultat} onCopier={() => {}} />
        </>
      )}
    </div>
  );
}

// ─── Onglet Marketing & Growth ────────────────────────────────────────────────

function OngletMarketing() {
  const [mode, setMode] = useState<"COPY" | "PLAN">("COPY");
  const [typeCopy, setTypeCopy] = useState("LANDING_PAGE");
  const [cible, setCible] = useState("PARENTS");
  const [objectif, setObjectif] = useState("");
  const [contraintes, setContraintes] = useState("");
  const [objectifCroissance, setObjectifCroissance] = useState("");
  const [budget, setBudget] = useState("FAIBLE");
  const [horizonPlan, setHorizonPlan] = useState("6_MOIS");
  const [contexteConcurrentiel, setContexteConcurrentiel] = useState("");
  const [resultat, setResultat] = useState("");
  const [validationErr, setValidationErr] = useState("");

  const genCopy = trpc.agents.genererCopy.useMutation({ onSuccess: (d) => setResultat(d.copy) });
  const genPlan = trpc.agents.genererPlanMarketing.useMutation({ onSuccess: (d) => setResultat(d.plan) });

  function generer() {
    setValidationErr("");
    if (mode === "COPY") {
      if (!objectif.trim()) { setValidationErr("Veuillez décrire l'objectif de la campagne."); return; }
      genCopy.mutate({
        type: typeCopy as "LANDING_PAGE" | "EMAIL_CAMPAGNE" | "TUNNEL_VENTE" | "ANNONCE_PUBLICITAIRE" | "PROPOSITION_VALEUR",
        cibleAudience: cible as "PARENTS" | "ENSEIGNANTS" | "COMMISSIONS_SCOLAIRES" | "GENERAL",
        objectif,
        contraintes: contraintes || undefined,
      });
    } else {
      if (!objectifCroissance.trim()) { setValidationErr("Veuillez décrire l'objectif de croissance."); return; }
      genPlan.mutate({
        objectifCroissance,
        budget: budget as "FAIBLE" | "MOYEN" | "ELEVE",
        horizon: horizonPlan as "3_MOIS" | "6_MOIS" | "1_AN",
        contexteConcurrentiel: contexteConcurrentiel || undefined,
      });
    }
  }

  const isPending = genCopy.isPending || genPlan.isPending;
  const error = validationErr || genCopy.error?.message || genPlan.error?.message;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["COPY", "PLAN"].map((m) => (
          <button key={m} onClick={() => { setMode(m as "COPY" | "PLAN"); setResultat(""); }}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${mode === m ? "bg-[var(--color-ink)] text-white" : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"}`}>
            {m === "COPY" ? "Copy marketing" : "Plan de croissance"}
          </button>
        ))}
      </div>

      {mode === "COPY" ? (
        <div className="space-y-3">
          <SelectField label="Type de contenu" value={typeCopy} onChange={setTypeCopy} options={[
            { value: "LANDING_PAGE", label: "Page d'atterrissage" },
            { value: "EMAIL_CAMPAGNE", label: "Email de campagne" },
            { value: "TUNNEL_VENTE", label: "Tunnel de vente" },
            { value: "ANNONCE_PUBLICITAIRE", label: "Annonce publicitaire" },
            { value: "PROPOSITION_VALEUR", label: "Proposition de valeur" },
          ]} />
          <SelectField label="Audience cible" value={cible} onChange={setCible} options={[
            { value: "PARENTS", label: "Parents" }, { value: "ENSEIGNANTS", label: "Enseignants" },
            { value: "COMMISSIONS_SCOLAIRES", label: "Commissions scolaires" }, { value: "GENERAL", label: "Grand public" },
          ]} />
          <TextareaField label="Objectif de la campagne" value={objectif} onChange={setObjectif} placeholder="Ex: convaincre les parents d'inscrire leur enfant à la période de rentrée…" rows={2} />
          <TextareaField label="Contraintes (optionnel)" value={contraintes} onChange={setContraintes} placeholder="Ex: pas mentionner les prix, focus sur le TDAH…" rows={2} />
        </div>
      ) : (
        <div className="space-y-3">
          <TextareaField label="Objectif de croissance" value={objectifCroissance} onChange={setObjectifCroissance} placeholder="Ex: atteindre 500 familles actives d'ici 6 mois dans la région de Montréal…" rows={2} />
          <SelectField label="Budget mensuel" value={budget} onChange={setBudget} options={[
            { value: "FAIBLE", label: "Faible (< 2 000 $ CAD/mois)" },
            { value: "MOYEN", label: "Moyen (2 000–10 000 $ CAD/mois)" },
            { value: "ELEVE", label: "Élevé (> 10 000 $ CAD/mois)" },
          ]} />
          <SelectField label="Horizon" value={horizonPlan} onChange={setHorizonPlan} options={[
            { value: "3_MOIS", label: "3 mois" }, { value: "6_MOIS", label: "6 mois" }, { value: "1_AN", label: "1 an" },
          ]} />
          <TextareaField label="Contexte concurrentiel (optionnel)" value={contexteConcurrentiel} onChange={setContexteConcurrentiel} placeholder="Ex: Alloprof vient de lancer une app mobile gratuite…" rows={2} />
        </div>
      )}

      <BoutonGenerer onClick={generer} pending={isPending} label={mode === "COPY" ? "Générer le copy" : "Générer le plan"} />
      {error && <ErreurMsg msg={error} />}
      {resultat && <ResultatCard titre={mode === "COPY" ? `Copy : ${typeCopy}` : `Plan marketing ${horizonPlan}`} contenu={resultat} onCopier={() => {}} />}
    </div>
  );
}

// ─── Onglet Partenariats ───────────────────────────────────────────────────────

function OngletPartenariats() {
  const [mode, setMode] = useState<"RECHERCHE" | "SOUMISSION" | "OPPORTUNITES">("OPPORTUNITES");
  const [typeRecherche, setTypeRecherche] = useState("TOUS");
  const [region, setRegion] = useState("TOUS");
  const [contexteRecherche, setContexteRecherche] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [typePartenariat, setTypePartenariat] = useState("");
  const [objectifSoumission, setObjectifSoumission] = useState("");
  const [exigences, setExigences] = useState("");
  const [signataire, setSignataire] = useState("");
  const [resultat, setResultat] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [webDispo, setWebDispo] = useState<boolean | undefined>();
  const [opportuniteSelectee, setOpportuniteSelectee] = useState<string | undefined>();

  // Formulaire nouvelle opportunité
  const [showForm, setShowForm] = useState(false);
  const [newTitre, setNewTitre] = useState("");
  const [newOrg, setNewOrg] = useState("");
  const [newType, setNewType] = useState("MINISTERE_QC");
  const [newRegion, setNewRegion] = useState("QC");
  const [newEcheance, setNewEcheance] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const utils = trpc.useUtils();
  const rechercherOpp = trpc.agents.rechercherOpportunites.useMutation({
    onSuccess: (d) => { setResultat(d.opportunites); setSources((d.sources ?? []) as Source[]); setWebDispo(d.webDispo); }
  });
  const genSoumission = trpc.agents.genererSoumission.useMutation({ onSuccess: (d) => setResultat(d.soumission) });
  const { data: opportunites, isLoading } = trpc.agents.getOpportunites.useQuery();
  const creerOpp = trpc.agents.creerOpportunite.useMutation({ onSuccess: () => { utils.agents.getOpportunites.invalidate(); setShowForm(false); setNewTitre(""); setNewOrg(""); setNewNotes(""); setNewEcheance(""); } });
  const updateOpp = trpc.agents.updateOpportunite.useMutation({ onSuccess: () => utils.agents.getOpportunites.invalidate() });

  const [validationErr, setValidationErr] = useState("");

  function generer() {
    setValidationErr(""); setSources([]); setWebDispo(undefined);
    if (mode === "RECHERCHE") {
      rechercherOpp.mutate({
        type: typeRecherche as "COMMISSION_SCOLAIRE" | "MINISTERE_QC" | "MINISTERE_CA" | "ENTREPRISE" | "UNIVERSITE" | "INTERNATIONAL" | "TOUS",
        region: region as "QC" | "CA" | "INTERNATIONAL" | "TOUS",
        contexte: contexteRecherche || undefined,
      });
    } else if (mode === "SOUMISSION") {
      if (!organisation.trim()) { setValidationErr("Veuillez indiquer l'organisation destinataire."); return; }
      if (!typePartenariat.trim()) { setValidationErr("Veuillez décrire le type de partenariat visé."); return; }
      if (!objectifSoumission.trim()) { setValidationErr("Veuillez décrire l'objectif du partenariat."); return; }
      genSoumission.mutate({
        opportuniteId: opportuniteSelectee,
        organisation, typePartenariat, objectifPartenariat: objectifSoumission,
        exigences: exigences || undefined, signataire: signataire || undefined,
      });
    }
  }

  const isPending = rechercherOpp.isPending || genSoumission.isPending;
  const error = validationErr || rechercherOpp.error?.message || genSoumission.error?.message;

  const STATUT_LABELS: Record<string, { label: string; color: string }> = {
    DETECTEE: { label: "Détectée", color: "bg-blue-100 text-blue-700" },
    EN_COURS: { label: "En cours", color: "bg-yellow-100 text-yellow-700" },
    SOUMIS: { label: "Soumis", color: "bg-purple-100 text-purple-700" },
    GAGNE: { label: "Gagné ✓", color: "bg-green-100 text-green-700" },
    ABANDONNE: { label: "Abandonné", color: "bg-gray-100 text-gray-500" },
  };

  const TYPE_LABELS: Record<string, string> = {
    COMMISSION_SCOLAIRE: "Commission scolaire", MINISTERE_QC: "Ministère QC",
    MINISTERE_CA: "Ministère CA", ENTREPRISE: "Entreprise", UNIVERSITE: "Université",
    INTERNATIONAL: "International", AUTRE: "Autre",
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["OPPORTUNITES", "RECHERCHE", "SOUMISSION"] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setResultat(""); }}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${mode === m ? "bg-[var(--color-ink)] text-white" : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"}`}>
            {m === "OPPORTUNITES" ? "Tableau de bord" : m === "RECHERCHE" ? "Rechercher des opportunités" : "Générer une soumission"}
          </button>
        ))}
      </div>

      {/* Tableau de bord des opportunités */}
      {mode === "OPPORTUNITES" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-ink-soft)]">{opportunites?.length ?? 0} opportunité{(opportunites?.length ?? 0) > 1 ? "s" : ""}</span>
            <button onClick={() => setShowForm(!showForm)}
              className="text-xs font-bold text-[var(--color-ink)] hover:opacity-70 transition-opacity">
              {showForm ? "Annuler" : "+ Ajouter manuellement"}
            </button>
          </div>

          {showForm && (
            <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Titre</label>
                  <input value={newTitre} onChange={(e) => setNewTitre(e.target.value)} placeholder="Ex: Appel à projets MEES 2026…"
                    className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Organisation</label>
                  <input value={newOrg} onChange={(e) => setNewOrg(e.target.value)} placeholder="Ex: MEES, CSS Montréal…"
                    className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <SelectField label="Type" value={newType} onChange={setNewType} options={[
                  { value: "MINISTERE_QC", label: "Ministère QC" }, { value: "MINISTERE_CA", label: "Ministère CA" },
                  { value: "COMMISSION_SCOLAIRE", label: "Commission scolaire" }, { value: "ENTREPRISE", label: "Entreprise" },
                  { value: "UNIVERSITE", label: "Université/Cégep" }, { value: "INTERNATIONAL", label: "International" }, { value: "AUTRE", label: "Autre" },
                ]} />
                <SelectField label="Région" value={newRegion} onChange={setNewRegion} options={[
                  { value: "QC", label: "Québec" }, { value: "CA", label: "Canada" }, { value: "INTERNATIONAL", label: "International" },
                ]} />
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Échéance</label>
                  <input type="date" value={newEcheance} onChange={(e) => setNewEcheance(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]" />
                </div>
              </div>
              <TextareaField label="Notes" value={newNotes} onChange={setNewNotes} placeholder="Description, contexte, contacts…" rows={2} />
              <button onClick={() => creerOpp.mutate({ titre: newTitre, organisation: newOrg, type: newType, region: newRegion, echeance: newEcheance || undefined, notes: newNotes || undefined })}
                disabled={creerOpp.isPending || !newTitre.trim() || !newOrg.trim()}
                className="rounded-xl bg-[var(--color-ink)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50">
                {creerOpp.isPending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-[var(--color-ink-soft)] text-center py-4">Chargement…</p>
          ) : opportunites?.length === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--color-ink-soft)]">
              <div className="text-3xl mb-2">🤝</div>
              Aucune opportunité enregistrée. Utilisez "Rechercher" pour en identifier, ou ajoutez-en manuellement.
            </div>
          ) : (
            <div className="space-y-2">
              {opportunites?.map((opp) => {
                const s = STATUT_LABELS[opp.statut] ?? { label: opp.statut, color: "bg-gray-100 text-gray-500" };
                return (
                  <div key={opp.id} className="rounded-xl border border-[var(--color-rule)] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-[var(--color-ink)] truncate">{opp.titre}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.color}`}>{s.label}</span>
                          <span className="rounded-full bg-[var(--color-paper-warm)] px-2 py-0.5 text-[10px] text-[var(--color-ink-soft)]">
                            {TYPE_LABELS[opp.type] ?? opp.type} · {opp.region}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-ink-soft)]">{opp.organisation}</p>
                        {opp.echeance && (
                          <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                            Échéance : {new Date(opp.echeance).toLocaleDateString("fr-CA")}
                          </p>
                        )}
                        {opp.soumissions.length > 0 && (
                          <p className="text-[10px] text-[var(--color-ink-soft)] mt-1">{opp.soumissions.length} soumission{opp.soumissions.length > 1 ? "s" : ""} générée{opp.soumissions.length > 1 ? "s" : ""}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <select
                          value={opp.statut}
                          onChange={(e) => updateOpp.mutate({ id: opp.id, statut: e.target.value })}
                          className="rounded-lg border border-[var(--color-rule)] bg-white px-2 py-1 text-[11px] text-[var(--color-ink)] focus:outline-none"
                        >
                          {Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <button
                          onClick={() => { setOpportuniteSelectee(opp.id); setOrganisation(opp.organisation); setMode("SOUMISSION"); }}
                          className="rounded-lg bg-[var(--color-ink)] px-2 py-1 text-[11px] font-bold text-white hover:opacity-80 transition-opacity"
                        >
                          Soumission →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recherche d'opportunités */}
      {mode === "RECHERCHE" && (
        <div className="space-y-3">
          <SelectField label="Type d'organisation" value={typeRecherche} onChange={setTypeRecherche} options={[
            { value: "TOUS", label: "Tous types" }, { value: "COMMISSION_SCOLAIRE", label: "Commissions scolaires" },
            { value: "MINISTERE_QC", label: "Ministères Québec" }, { value: "MINISTERE_CA", label: "Ministères Canada" },
            { value: "ENTREPRISE", label: "Entreprises privées" }, { value: "UNIVERSITE", label: "Universités / Cégeps" },
            { value: "INTERNATIONAL", label: "International" },
          ]} />
          <SelectField label="Région" value={region} onChange={setRegion} options={[
            { value: "TOUS", label: "Toutes régions" }, { value: "QC", label: "Québec" },
            { value: "CA", label: "Canada" }, { value: "INTERNATIONAL", label: "International" },
          ]} />
          <TextareaField label="Contexte supplémentaire (optionnel)" value={contexteRecherche} onChange={setContexteRecherche}
            placeholder="Ex: focus sur les élèves HDAA, subventions pour outils numériques…" rows={2} />
          <BoutonGenerer onClick={generer} pending={isPending} label="Identifier des opportunités" />
          {error && <ErreurMsg msg={error} />}
          {resultat && (
            <>
              <SourcesWeb sources={sources} webDispo={webDispo} />
              <ResultatCard titre="Opportunités identifiées" contenu={resultat} onCopier={() => {}} />
            </>
          )}
        </div>
      )}

      {/* Générateur de soumissions */}
      {mode === "SOUMISSION" && (
        <div className="space-y-3">
          {opportuniteSelectee && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700 font-medium">
              Lié à l'opportunité sélectionnée dans le tableau
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Organisation destinataire</label>
            <input value={organisation} onChange={(e) => setOrganisation(e.target.value)} placeholder="Ex: Centre de services scolaires de Montréal"
              className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Type de partenariat visé</label>
            <input value={typePartenariat} onChange={(e) => setTypePartenariat(e.target.value)} placeholder="Ex: Intégration d'ÉduRéussite QC dans les écoles du CSS, pilote 2026-2027"
              className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]" />
          </div>
          <TextareaField label="Objectif du partenariat" value={objectifSoumission} onChange={setObjectifSoumission}
            placeholder="Ex: Améliorer les résultats scolaires des élèves en difficulté grâce à l'IA adaptative…" rows={3} />
          <TextareaField label="Exigences connues (optionnel)" value={exigences} onChange={setExigences}
            placeholder="Ex: soumission en français, focus HDAA, budget max 50 000$…" rows={2} />
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Signataire (optionnel)</label>
            <input value={signataire} onChange={(e) => setSignataire(e.target.value)} placeholder="Ex: Jean-Philippe Tremblay, Directeur général"
              className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]" />
          </div>
          <BoutonGenerer onClick={generer} pending={isPending} label="Générer la soumission" />
          {error && <ErreurMsg msg={error} />}
          {resultat && <ResultatCard titre={`Soumission : ${organisation}`} contenu={resultat} onCopier={() => {}} />}
        </div>
      )}
    </div>
  );
}

// ─── Onglet Journal ────────────────────────────────────────────────────────────

function OngletJournal() {
  const [filtreAgent, setFiltreAgent] = useState("");
  const [entreeOuverte, setEntreeOuverte] = useState<string | null>(null);

  const { data: journal, isLoading } = trpc.agents.getJournal.useQuery(
    { agentType: filtreAgent || undefined, limit: 50 },
  );

  const AGENT_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
    SOCIAL: { label: "Social Media", color: "bg-pink-100 text-pink-700", emoji: "📣" },
    VEILLE: { label: "Veille", color: "bg-blue-100 text-blue-700", emoji: "🔍" },
    MARKETING: { label: "Marketing", color: "bg-green-100 text-green-700", emoji: "📈" },
    PARTENARIAT: { label: "Partenariats", color: "bg-purple-100 text-purple-700", emoji: "🤝" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {["", "SOCIAL", "VEILLE", "MARKETING", "PARTENARIAT"].map((a) => (
          <button key={a} onClick={() => setFiltreAgent(a)}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${filtreAgent === a ? "bg-[var(--color-ink)] text-white" : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"}`}>
            {a === "" ? "Tous" : `${AGENT_LABELS[a]?.emoji} ${AGENT_LABELS[a]?.label}`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-center text-[var(--color-ink-soft)] py-6">Chargement…</p>
      ) : !journal?.length ? (
        <div className="text-center py-8 text-sm text-[var(--color-ink-soft)]">
          <div className="text-3xl mb-2">📋</div>
          Aucune activité enregistrée pour l'instant.
        </div>
      ) : (
        <div className="space-y-2">
          {journal.map((entry) => {
            const meta = AGENT_LABELS[entry.agentType] ?? { label: entry.agentType, color: "bg-gray-100 text-gray-600", emoji: "⚙️" };
            const isOpen = entreeOuverte === entry.id;
            return (
              <div key={entry.id} className="rounded-xl border border-[var(--color-rule)] bg-white overflow-hidden">
                <button
                  onClick={() => setEntreeOuverte(isOpen ? null : entry.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-paper-warm)] transition-colors text-left"
                >
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0 ${meta.color}`}>
                    {meta.emoji} {meta.label}
                  </span>
                  <span className="text-sm text-[var(--color-ink)] flex-1 truncate">{entry.action}</span>
                  <span className="text-xs text-[var(--color-ink-soft)] flex-shrink-0">
                    {new Date(entry.createdAt).toLocaleDateString("fr-CA", { dateStyle: "short" })}
                  </span>
                  <span className="text-xs text-[var(--color-ink-soft)] flex-shrink-0">
                    {entry.admin?.name ?? entry.admin?.email ?? "—"}
                  </span>
                  <span className="text-xs text-[var(--color-ink-soft)] flex-shrink-0">{isOpen ? "▲" : "▼"}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-[var(--color-rule)] px-4 py-3 space-y-3 bg-[var(--color-paper-warm)]">
                    {entry.opportunite && (
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        Lié à : <strong>{entry.opportunite.titre}</strong> — {entry.opportunite.organisation}
                      </p>
                    )}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)] mb-1">Résultat généré</p>
                      <div className="text-xs text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-white rounded-lg p-3 border border-[var(--color-rule)]">
                        {entry.output}
                      </div>
                    </div>
                    <p className="text-[10px] text-[var(--color-ink-soft)]">
                      {entry.inputTokens + entry.outputTokens} tokens · ~{((entry.coutUSD ?? 0) * 1.37).toFixed(4)} $ CAD
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

const ONGLETS: { id: Onglet; label: string; emoji: string; desc: string }[] = [
  { id: "SOCIAL", label: "Social Media", emoji: "📣", desc: "Posts & calendriers éditoriaux" },
  { id: "VEILLE", label: "Veille", emoji: "🔍", desc: "Concurrents & tendances EdTech" },
  { id: "MARKETING", label: "Marketing", emoji: "📈", desc: "Copy & plans de croissance" },
  { id: "PARTENARIAT", label: "Partenariats", emoji: "🤝", desc: "Opportunités & soumissions" },
  { id: "JOURNAL", label: "Journal", emoji: "📋", desc: "Historique des générations" },
];

export function AgentsClient() {
  const [onglet, setOnglet] = useState<Onglet>("SOCIAL");

  return (
    <div className="space-y-4">
      {/* Onglets */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            className={`rounded-xl p-3 text-left transition-all border ${
              onglet === o.id
                ? "bg-[var(--color-ink)] text-white border-transparent"
                : "bg-white border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            }`}
          >
            <div className="text-xl mb-1">{o.emoji}</div>
            <div className={`text-xs font-bold ${onglet === o.id ? "text-white" : "text-[var(--color-ink)]"}`}>{o.label}</div>
            <div className={`text-[10px] mt-0.5 ${onglet === o.id ? "text-white/70" : "text-[var(--color-ink-soft)]"}`}>{o.desc}</div>
          </button>
        ))}
      </div>

      {/* Contenu de l'onglet */}
      <Card className="p-6">
        {onglet === "SOCIAL" && <OngletSocial />}
        {onglet === "VEILLE" && <OngletVeille />}
        {onglet === "MARKETING" && <OngletMarketing />}
        {onglet === "PARTENARIAT" && <OngletPartenariats />}
        {onglet === "JOURNAL" && <OngletJournal />}
      </Card>
    </div>
  );
}
