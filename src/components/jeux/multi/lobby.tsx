"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { SFX } from "@/lib/jeux/sounds";

type JeuId = "puissance4" | "bataille_navale" | "quiz_duel";

const JEUX_MULTI = [
  {
    id: "puissance4" as JeuId,
    emoji: "🔴",
    nom: "Puissance 4",
    description: "Aligne 4 jetons avant ton adversaire. Stratégie et rapidité !",
    joueurs: "2 joueurs",
    duree: "5–10 min",
    difficulte: "Facile",
    couleur: "from-red-600 to-orange-500",
    glow: "rgba(239,68,68,0.35)",
    xpCout: 15,
  },
  {
    id: "bataille_navale" as JeuId,
    emoji: "🚢",
    nom: "Bataille navale",
    description: "Place ta flotte et coule les navires adverses avant les tiens !",
    joueurs: "2 joueurs",
    duree: "10–20 min",
    difficulte: "Moyen",
    couleur: "from-blue-600 to-cyan-500",
    glow: "rgba(59,130,246,0.35)",
    xpCout: 25,
  },
  {
    id: "quiz_duel" as JeuId,
    emoji: "⚔️",
    nom: "Quiz Duel",
    description: "Réponds le plus vite aux questions de culture générale et sciences !",
    joueurs: "2–4 joueurs",
    duree: "5 min",
    difficulte: "Variable",
    couleur: "from-purple-600 to-pink-500",
    glow: "rgba(147,51,234,0.35)",
    xpCout: 20,
  },
];

function InvitationsBadge({ prenom }: { prenom: string }) {
  const router = useRouter();
  const { data: invitations, refetch } = trpc.multijoueur.getMesInvitations.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const marquerLue = trpc.multijoueur.marquerInvitationLue.useMutation({ onSuccess: () => refetch() });
  const rejoindre = trpc.multijoueur.rejoindrePartie.useMutation({
    onSuccess: (data) => { SFX.join(); router.push(`/eleve/jeux/multijoueur/${data.code}`); },
  });

  if (!invitations || invitations.length === 0) return null;

  return (
    <div className="space-y-2 mb-5">
      {invitations.map((inv) => {
        const d = inv.donnees as { partieCode: string; jeuNom: string; expediteurPrenom: string } | null;
        if (!d) return null;
        return (
          <div key={inv.id}
            className="rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-900/40 to-pink-900/30 px-4 py-3 flex items-center gap-3 animate-pulse-once">
            <span className="text-2xl">🎮</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">{d.expediteurPrenom} t'invite à jouer !</p>
              <p className="text-white/60 text-xs">{d.jeuNom} · Code : <span className="font-black tracking-widest text-yellow-300">{d.partieCode}</span></p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { marquerLue.mutate({ notifId: inv.id }); rejoindre.mutate({ code: d.partieCode }); }}
                className="rounded-xl bg-purple-500 hover:bg-purple-400 px-3 py-1.5 text-xs font-black text-white transition-colors"
              >
                Rejoindre
              </button>
              <button
                onClick={() => marquerLue.mutate({ notifId: inv.id })}
                className="rounded-xl bg-white/10 hover:bg-white/20 px-2 py-1.5 text-xs text-white/50 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const NIVEAU_COURT: Record<string, string> = {
  PRIMAIRE_1: "P1", PRIMAIRE_2: "P2", PRIMAIRE_3: "P3",
  PRIMAIRE_4: "P4", PRIMAIRE_5: "P5", PRIMAIRE_6: "P6",
  SECONDAIRE_1: "Sec.1", SECONDAIRE_2: "Sec.2", SECONDAIRE_3: "Sec.3",
  SECONDAIRE_4: "Sec.4", SECONDAIRE_5: "Sec.5",
};

function FriendSearch({ partieCode, jeuNom, expediteurPrenom }: { partieCode: string; jeuNom: string; expediteurPrenom: string }) {
  const [recherche, setRecherche] = useState("");
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const { data: resultats, isFetching } = trpc.multijoueur.rechercherEleve.useQuery(
    { recherche },
    { enabled: recherche.length >= 2 }
  );
  const inviter = trpc.multijoueur.envoyerInvitation.useMutation({
    onSuccess: (_, vars) => setInvited(prev => new Set([...prev, vars.eleveId])),
  });

  return (
    <div className="rounded-2xl bg-white border border-[var(--color-rule)] p-4 space-y-3 shadow-sm">
      <p className="text-sm font-bold text-[var(--color-ink)]">🔍 Inviter un ami</p>
      <div className="relative">
        <input
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder="Cherche un élève par prénom..."
          className="w-full rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-3 py-2.5 text-[var(--color-ink)] placeholder-[var(--color-ink-soft)] text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
        />
        {isFetching && <div className="absolute right-3 top-3 w-4 h-4 rounded-full border-2 border-[var(--color-rule)] border-t-purple-500 animate-spin" />}
      </div>
      {resultats && resultats.length > 0 && (
        <div className="space-y-1.5">
          {resultats.map(eleve => (
            <div key={eleve.id} className="flex items-center gap-2.5 rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-3 py-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-black text-white">
                {eleve.prenom.charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-semibold text-[var(--color-ink)] truncate">
                {eleve.prenom} <span className="text-[var(--color-ink-soft)] font-normal">#{eleve.codeAnonyme}</span>
              </span>
              {eleve.niveauScolaire && (
                <span className="flex-shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                  {NIVEAU_COURT[eleve.niveauScolaire] ?? eleve.niveauScolaire}
                </span>
              )}
              {invited.has(eleve.id) ? (
                <span className="flex-shrink-0 text-xs font-bold text-emerald-600">✓ Invité</span>
              ) : (
                <button
                  onClick={() => inviter.mutate({ eleveId: eleve.id, partieCode, jeuNom })}
                  disabled={inviter.isPending}
                  className="flex-shrink-0 rounded-lg bg-purple-600 hover:bg-purple-500 px-3 py-1.5 text-xs font-bold text-white transition-colors disabled:opacity-50"
                >
                  Inviter
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {resultats && resultats.length === 0 && recherche.length >= 2 && (
        <p className="text-[var(--color-ink-soft)] text-xs text-center py-2">Aucun élève trouvé pour « {recherche} »</p>
      )}
    </div>
  );
}

export function MultiLobby({ prenom }: { prenom: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<JeuId | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"select" | "create" | "join">("select");
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const creer = trpc.multijoueur.creerPartie.useMutation({
    onSuccess: (data) => {
      SFX.join();
      setCreatedCode(data.code);
    },
    onError: (e) => setError(e.message),
  });

  const rejoindre = trpc.multijoueur.rejoindrePartie.useMutation({
    onSuccess: (data) => {
      SFX.join();
      router.push(`/eleve/jeux/multijoueur/${data.code}`);
    },
    onError: (e) => setError(e.message),
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (mode === "create" && selected) {
    const jeu = JEUX_MULTI.find(j => j.id === selected)!;

    if (createdCode) {
      return (
        <div className="space-y-5">
          <button onClick={() => { setMode("select"); setCreatedCode(null); }} className="text-white/50 hover:text-white text-sm flex items-center gap-1">
            ← Retour
          </button>
          <div className="rounded-3xl overflow-hidden" style={{ boxShadow: `0 20px 60px ${jeu.glow}` }}>
            <div className={`bg-gradient-to-br ${jeu.couleur} px-6 py-5 flex items-center gap-4`}>
              <span className="text-4xl">{jeu.emoji}</span>
              <div>
                <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">Partie créée !</p>
                <h2 className="text-2xl font-black text-white">{jeu.nom}</h2>
              </div>
            </div>
            <div className="bg-[var(--color-paper-warm)] border-x border-b border-[var(--color-rule)] p-5 space-y-4">
              <div className="text-center">
                <p className="text-xs text-amber-600 font-semibold mb-1">⭐ {jeu.xpCout} XP déduits à chaque joueur au démarrage</p>
              <p className="text-xs text-[var(--color-ink-soft)] mb-2">Code à partager</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-black text-[var(--color-ink)] tracking-widest">{createdCode}</span>
                  <button onClick={() => copyCode(createdCode)}
                    className="rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] transition-colors">
                    {copied ? "✓ Copié !" : "Copier"}
                  </button>
                </div>
              </div>
              <FriendSearch partieCode={createdCode} jeuNom={jeu.nom} expediteurPrenom={prenom} />
              <button
                onClick={() => router.push(`/eleve/jeux/multijoueur/${createdCode}`)}
                className={`w-full rounded-2xl py-3.5 text-base font-black text-white bg-gradient-to-r ${jeu.couleur} hover:opacity-90 transition-opacity`}
                style={{ boxShadow: `0 8px 24px ${jeu.glow}` }}
              >
                🚀 Rejoindre ma partie
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <button onClick={() => setMode("select")} className="text-white/50 hover:text-white text-sm flex items-center gap-1">
          ← Retour
        </button>
        <div className="rounded-3xl overflow-hidden" style={{ boxShadow: `0 20px 60px ${jeu.glow}` }}>
          <div className={`bg-gradient-to-br ${jeu.couleur} p-8 text-center`}>
            <p className="text-6xl mb-3">{jeu.emoji}</p>
            <h2 className="text-3xl font-black text-white">{jeu.nom}</h2>
            <p className="text-white/70 mt-2 max-w-xs mx-auto text-sm">{jeu.description}</p>
          </div>
          <div className="bg-[var(--color-paper-warm)] border border-[var(--color-rule)] p-6 space-y-4">
            <div className="flex gap-3 text-sm text-[var(--color-ink-soft)] justify-center">
              <span>👥 {jeu.joueurs}</span><span>·</span>
              <span>⏱ {jeu.duree}</span><span>·</span>
              <span>🎯 {jeu.difficulte}</span>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-center">
              <p className="text-sm font-black text-amber-700">⭐ {jeu.xpCout} XP par joueur</p>
              <p className="text-xs text-amber-600 mt-0.5">Déduits quand ton ami rejoint la partie</p>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              onClick={() => creer.mutate({ jeuId: selected })}
              disabled={creer.isPending}
              className={`w-full rounded-2xl py-4 text-lg font-black text-white bg-gradient-to-r ${jeu.couleur} hover:opacity-90 transition-opacity disabled:opacity-50`}
              style={{ boxShadow: `0 8px 24px ${jeu.glow}` }}
            >
              {creer.isPending ? "Création..." : "🎮 Créer la partie"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div className="space-y-6">
        <button onClick={() => { setMode("select"); setError(null); }} className="text-white/50 hover:text-white text-sm">← Retour</button>
        <div className="rounded-3xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] p-8 text-center space-y-5">
          <p className="text-5xl">🔑</p>
          <h2 className="text-2xl font-black text-[var(--color-ink)]">Rejoindre une partie</h2>
          <p className="text-[var(--color-ink-soft)] text-sm">Entre le code de 6 lettres que ton ami t'a envoyé</p>
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="ABC123"
            className="w-full max-w-xs mx-auto block rounded-2xl border-2 border-[var(--color-rule)] bg-white px-5 py-3 text-center text-3xl font-black text-[var(--color-ink)] tracking-widest focus:outline-none focus:border-[var(--color-purple)]"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={() => { setError(null); rejoindre.mutate({ code: joinCode }); }}
            disabled={joinCode.length < 4 || rejoindre.isPending}
            className="w-full max-w-xs mx-auto block rounded-2xl bg-[var(--color-purple)] py-3 text-lg font-black text-white hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {rejoindre.isPending ? "Connexion..." : "🚀 Rejoindre"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black text-[var(--color-ink)]">🎮 Jeux Multijoueur</h1>
        <p className="text-[var(--color-ink-soft)] mt-1">Défie tes amis en temps réel, {prenom} !</p>
      </div>

      <InvitationsBadge prenom={prenom} />

      <div className="space-y-3">
        {JEUX_MULTI.map(jeu => (
          <div key={jeu.id}
            className="rounded-3xl overflow-hidden border border-[var(--color-rule)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-[0.99]"
            style={{ boxShadow: `0 4px 24px ${jeu.glow}` }}
            onClick={() => { setSelected(jeu.id); setMode("create"); SFX.select(); }}
          >
            <div className={`bg-gradient-to-r ${jeu.couleur} p-5 flex items-center gap-4`}>
              <span className="text-5xl">{jeu.emoji}</span>
              <div className="flex-1">
                <h3 className="text-xl font-black text-white">{jeu.nom}</h3>
                <p className="text-white/70 text-sm">{jeu.description}</p>
              </div>
              <div className="text-white/60 text-2xl transition-transform group-hover:translate-x-1">›</div>
            </div>
            <div className="bg-[var(--color-paper-warm)] px-5 py-2.5 flex items-center justify-between text-xs text-[var(--color-ink-soft)]">
              <div className="flex gap-3">
                <span>👥 {jeu.joueurs}</span>
                <span>⏱ {jeu.duree}</span>
                <span>🎯 {jeu.difficulte}</span>
              </div>
              <span className="font-bold text-[var(--color-gold)]">⭐ {jeu.xpCout} XP / joueur</span>
            </div>
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--color-rule)]" /></div>
        <div className="relative flex justify-center"><span className="bg-[var(--color-paper)] px-3 text-xs text-[var(--color-ink-muted)]">tu as déjà un code ?</span></div>
      </div>

      <button onClick={() => { setMode("join"); SFX.select(); }}
        className="w-full rounded-2xl border-2 border-dashed border-[var(--color-rule)] py-4 text-[var(--color-ink-soft)] font-semibold hover:border-[var(--color-purple)] hover:text-[var(--color-purple)] transition-colors">
        🔑 Rejoindre avec un code
      </button>
    </div>
  );
}
