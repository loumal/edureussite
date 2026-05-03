"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { SFX } from "@/lib/jeux/sounds";
import { JeuPuissance4 } from "./jeu-puissance4";
import { JeuBatailleNavale } from "./jeu-bataille-navale";
import { JeuQuizDuel } from "./jeu-quiz-duel";

interface Props { code: string; prenom: string }

type Joueur = { eleveId: string; prenom: string; pret: boolean; score: number };

function WaitingRoom({ code, joueurs, monEleveId, jeuId, onQuitter }: {
  code: string;
  joueurs: Joueur[];
  monEleveId: string;
  jeuId: string;
  onQuitter: () => void;
}) {
  const [recherche, setRecherche] = useState("");
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const { data: resultats, isFetching } = trpc.multijoueur.rechercherEleve.useQuery(
    { recherche },
    { enabled: recherche.length >= 2 }
  );
  const inviter = trpc.multijoueur.envoyerInvitation.useMutation({
    onSuccess: (_, vars) => setInvited(prev => new Set([...prev, vars.eleveId])),
  });

  const jeuNoms: Record<string, string> = {
    puissance4: "Puissance 4",
    bataille_navale: "Bataille navale",
    quiz_duel: "Quiz Duel",
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-5xl animate-bounce">⏳</div>
      <h2 className="text-2xl font-black text-white">Salle d'attente</h2>

      <div className="rounded-3xl bg-white/5 border border-white/10 p-6 space-y-4 w-full max-w-sm">
        <div className="text-center">
          <p className="text-white/60 text-sm mb-2">Code de la partie</p>
          <div className="flex items-center justify-center gap-3">
            <p className="text-4xl font-black text-yellow-300 tracking-widest">{code}</p>
            <button onClick={copyCode}
              className="rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs text-white/60 transition-colors">
              {copied ? "✓" : "Copier"}
            </button>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 space-y-2">
          {joueurs.map((j) => (
            <div key={j.eleveId} className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white font-semibold">{j.prenom}</span>
              {j.eleveId === monEleveId && <span className="text-white/40 text-xs">(toi)</span>}
            </div>
          ))}
          {joueurs.length < 2 && (
            <div className="flex items-center gap-2 justify-center text-white/30">
              <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
              <span className="text-sm italic">En attente d'un joueur...</span>
            </div>
          )}
        </div>

        {/* Invite friends */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">🔍 Inviter un ami</p>
          <div className="relative">
            <input
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              placeholder="Cherche par prénom..."
              className="w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-400"
            />
            {isFetching && (
              <div className="absolute right-3 top-2.5 w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            )}
          </div>
          {resultats && resultats.length > 0 && (
            <div className="space-y-1.5">
              {resultats.map(eleve => (
                <div key={eleve.id} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-black text-white flex-shrink-0">
                    {eleve.prenom.charAt(0)}
                  </div>
                  <span className="flex-1 text-sm text-white font-medium truncate">{eleve.prenom} <span className="text-white/50 font-normal">#{eleve.codeAnonyme}</span></span>
                  {invited.has(eleve.id) ? (
                    <span className="text-xs text-green-400 font-semibold flex-shrink-0">✓ Invité</span>
                  ) : (
                    <button
                      onClick={() => inviter.mutate({ eleveId: eleve.id, partieCode: code, jeuNom: jeuNoms[jeuId] ?? jeuId })}
                      disabled={inviter.isPending}
                      className="rounded-lg bg-purple-500 hover:bg-purple-400 px-2.5 py-1 text-xs font-bold text-white transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      Inviter
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {resultats && resultats.length === 0 && recherche.length >= 2 && (
            <p className="text-white/30 text-xs text-center">Aucun élève trouvé</p>
          )}
        </div>
      </div>

      <button onClick={onQuitter} className="text-white/30 hover:text-white/60 text-sm transition-colors">
        Annuler la partie
      </button>
    </div>
  );
}

export function GameRoom({ code, prenom }: Props) {
  const router = useRouter();
  const prevUpdatedAt = useRef<string | null>(null);

  const { data: partie, isLoading, error } = trpc.multijoueur.getPartie.useQuery(
    { code },
    { refetchInterval: 800, refetchIntervalInBackground: true }
  );

  const jouerCoup = trpc.multijoueur.jouerCoup.useMutation();
  const quitter = trpc.multijoueur.quitterPartie.useMutation({
    onSuccess: () => router.push("/eleve/jeux/multijoueur"),
  });

  useEffect(() => {
    if (!partie) return;
    const updated = partie.updatedAt?.toString();
    prevUpdatedAt.current = updated ?? null;
  }, [partie?.updatedAt]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        <p className="text-white/50">Connexion à la partie...</p>
      </div>
    );
  }

  if (error || !partie) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">😕</p>
        <p className="text-white font-bold">Partie introuvable</p>
        <button onClick={() => router.push("/eleve/jeux/multijoueur")} className="mt-4 rounded-xl bg-white/10 text-white px-4 py-2">← Retour au lobby</button>
      </div>
    );
  }

  const { joueurs, etat, statut, jeuId, monEleveId } = partie;
  const monIndex = joueurs.findIndex(j => j.eleveId === monEleveId);

  if (statut === "EN_ATTENTE") {
    return (
      <WaitingRoom
        code={code}
        joueurs={joueurs}
        monEleveId={monEleveId}
        jeuId={jeuId}
        onQuitter={() => quitter.mutate({ code })}
      />
    );
  }

  if (statut === "ANNULEE") {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">🚫</p>
        <p className="text-white font-bold">Partie annulée</p>
        <button onClick={() => router.push("/eleve/jeux/multijoueur")} className="mt-4 rounded-xl bg-white/10 text-white px-4 py-2">← Retour au lobby</button>
      </div>
    );
  }

  const isMyTurn = (() => {
    if (!etat) return false;
    const e = etat as { tourIndex?: number };
    return e.tourIndex === monIndex;
  })();

  const handleCoup = (coup: unknown) => { jouerCoup.mutate({ code, coup }); };

  const jeuNames: Record<string, string> = {
    puissance4: "🔴 Puissance 4",
    bataille_navale: "🚢 Bataille navale",
    quiz_duel: "⚔️ Quiz Duel",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-black text-white">{jeuNames[jeuId] ?? jeuId}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statut === "EN_COURS" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
            {statut === "TERMINEE" ? "Terminé" : "En cours"}
          </span>
        </div>
        <button onClick={() => router.push("/eleve/jeux/multijoueur")} className="text-white/30 hover:text-white/60 text-xs">Quitter</button>
      </div>

      {jeuId === "puissance4" && (
        <JeuPuissance4
          joueurs={joueurs}
          etat={etat as Parameters<typeof JeuPuissance4>[0]["etat"]}
          monEleveId={monEleveId}
          onCoup={handleCoup}
          isMyTurn={isMyTurn}
          loading={jouerCoup.isPending}
        />
      )}
      {jeuId === "bataille_navale" && (
        <JeuBatailleNavale
          joueurs={joueurs}
          etat={etat as unknown as Parameters<typeof JeuBatailleNavale>[0]["etat"]}
          monEleveId={monEleveId}
          onCoup={handleCoup}
          isMyTurn={isMyTurn}
          loading={jouerCoup.isPending}
        />
      )}
      {jeuId === "quiz_duel" && (
        <JeuQuizDuel
          joueurs={joueurs}
          etat={etat as unknown as Parameters<typeof JeuQuizDuel>[0]["etat"]}
          monEleveId={monEleveId}
          onCoup={handleCoup}
          loading={jouerCoup.isPending}
        />
      )}
      {statut === "TERMINEE" && (
        <div className="mt-6 text-center">
          <button onClick={() => router.push("/eleve/jeux/multijoueur")}
            className="rounded-2xl bg-white/10 text-white px-6 py-3 font-bold hover:bg-white/20">
            ← Rejouer ou changer de jeu
          </button>
        </div>
      )}
    </div>
  );
}
