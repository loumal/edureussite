"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import type { ItemBoutique, Cosmetiques } from "@/lib/boutique/items";
import { JEUX_CATALOG } from "@/lib/jeux/catalog";

interface BoutiqueClientProps {
  initialItems: ItemBoutique[];
  initialCosmetiques: Cosmetiques;
  initialPoints: number;
}

export function BoutiqueClient({ initialItems, initialCosmetiques, initialPoints }: BoutiqueClientProps) {
  const searchParams = useSearchParams();
  const initialOnglet = searchParams.get("onglet") === "jeux" ? "jeux" : "avatar";
  const [onglet, setOnglet] = useState<"avatar" | "titre" | "jeux">(initialOnglet as "avatar" | "titre" | "jeux");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [demandeEnCours, setDemandeEnCours] = useState<string | null>(null);
  const router = useRouter();

  const { data, refetch } = trpc.eleve.getBoutique.useQuery(undefined, {
    initialData: { items: initialItems, cosmetiques: initialCosmetiques, totalPoints: initialPoints },
  });

  const acheter = trpc.eleve.acheterItem.useMutation({
    onSuccess: () => { refetch(); setFeedback(null); },
    onError: (e) => setFeedback(e.message),
  });

  const equiper = trpc.eleve.equiperItem.useMutation({
    onSuccess: () => { refetch(); setFeedback(null); },
    onError: (e) => setFeedback(e.message),
  });

  const demanderJeu = trpc.eleve.demanderJeu.useMutation({
    onSuccess: (result) => {
      router.push(`/eleve/jeux/${demandeEnCours}?demandeId=${result.demandeId}`);
      setDemandeEnCours(null);
    },
    onError: (e) => { setFeedback(e.message); setDemandeEnCours(null); },
  });

  const cosmetiques = data.cosmetiques;
  const points = data.totalPoints;
  const items = data.items.filter((i) => i.categorie === onglet);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* En-tête solde */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-ink)]">🛍️ Boutique XP</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-0.5">Dépense tes XP pour personnaliser ton profil</p>
        </div>
        <div className="rounded-2xl bg-[rgba(201,149,42,0.12)] px-4 py-2 text-center">
          <p className="text-2xl font-black text-[var(--color-gold)]">{points.toLocaleString()}</p>
          <p className="text-xs font-semibold text-[var(--color-gold)]">XP disponibles</p>
        </div>
      </div>

      {feedback && (
        <div className="mb-4 rounded-xl bg-[rgba(217,79,43,0.08)] px-4 py-3 text-sm font-medium text-[var(--color-accent)]">
          {feedback}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["avatar", "titre", "jeux"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setOnglet(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
              onglet === cat
                ? "bg-[var(--color-ink)] text-white shadow-sm"
                : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)]"
            }`}
          >
            {cat === "avatar" ? "🎨 Avatars" : cat === "titre" ? "🏷️ Titres" : "🎮 Jeux"}
          </button>
        ))}
      </div>

      {/* Jeux tab */}
      {onglet === "jeux" && (
        <div>
          {/* ── Bannière Multijoueur ── */}
          <a href="/eleve/jeux/multijoueur"
            className="group flex items-center gap-4 rounded-2xl mb-5 overflow-hidden border border-[var(--color-rule)] hover:border-transparent transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)" }}
          >
            <div className="px-5 py-4 flex-1">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-0.5">Nouveau</p>
              <p className="text-lg font-black text-white leading-tight">🎮 Jouer avec des amis</p>
              <p className="text-xs text-white/70 mt-0.5">Puissance 4 · Bataille navale · Quiz Duel</p>
            </div>
            <div className="pr-5 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all text-xl">›</div>
          </a>

          <p className="text-xs font-semibold text-[var(--color-ink-soft)] uppercase tracking-wider mb-3">Jeux solo</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {JEUX_CATALOG.map((jeu) => {
              const abordable = jeu.xpCout <= points;
              return (
                <div
                  key={jeu.id}
                  className={`relative rounded-2xl border-2 p-4 transition-all duration-200 ${
                    !jeu.disponible
                      ? "border-[var(--color-rule)] bg-[var(--color-paper-warm)] opacity-60"
                      : abordable
                      ? "border-[var(--color-rule)] bg-[var(--color-paper)] hover:border-[var(--color-purple)] hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] active:shadow-sm"
                      : "border-[var(--color-rule)] bg-[var(--color-paper)] opacity-60"
                  }`}
                >
                  {jeu.nouveaute && <span className="absolute -top-2 -right-2 rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-bold text-white">Nouveau</span>}
                  {jeu.populaire && !jeu.nouveaute && <span className="absolute -top-2 -right-2 rounded-full bg-[var(--color-gold)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-ink)]">⭐</span>}
                  <div className="text-center text-3xl mb-2">{jeu.emoji}</div>
                  <p className="text-center text-sm font-bold text-[var(--color-ink)] mb-0.5 leading-tight">{jeu.nom}</p>
                  <p className="text-center text-xs text-[var(--color-ink-soft)] mb-1 line-clamp-2 leading-snug">{jeu.description}</p>
                  <div className="flex items-center justify-center gap-1 text-xs text-[var(--color-ink-soft)] mb-3">
                    <span>⏱ {jeu.minutesSession} min</span>
                    <span>·</span>
                    <span>{jeu.categorieLabel}</span>
                  </div>
                  {!jeu.disponible ? (
                    <p className="text-center text-xs font-semibold text-[var(--color-ink-soft)]">🚧 Bientôt</p>
                  ) : (
                    <button
                      onClick={() => {
                        setDemandeEnCours(jeu.id);
                        setFeedback(null);
                        demanderJeu.mutate({ jeuId: jeu.id });
                      }}
                      disabled={!abordable || (demanderJeu.isPending && demandeEnCours === jeu.id)}
                      className={`w-full rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150 active:scale-95 ${
                        abordable
                          ? "bg-[var(--color-gold)] text-[var(--color-ink)] hover:opacity-90 hover:shadow-sm"
                          : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] cursor-not-allowed"
                      } disabled:opacity-50`}
                    >
                      {demanderJeu.isPending && demandeEnCours === jeu.id
                        ? "..."
                        : abordable
                        ? `🎮 ${jeu.xpCout} XP`
                        : `🔒 ${jeu.xpCout} XP`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grille items cosmétiques */}
      {onglet !== "jeux" && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => {
          const debloque = cosmetiques.debloquesIds.includes(item.id);
          const equipe =
            item.categorie === "avatar"
              ? cosmetiques.avatarEquipe === item.id
              : cosmetiques.titreEquipe === item.id;
          const abordable = item.prix <= points;

          return (
            <div
              key={item.id}
              className={`relative rounded-2xl border-2 p-4 transition-all duration-200 ${
                equipe
                  ? "border-[var(--color-purple)] bg-[rgba(91,79,207,0.06)]"
                  : debloque
                  ? "border-[var(--color-success)] bg-[rgba(42,124,111,0.04)] hover:-translate-y-0.5 hover:shadow-sm"
                  : "border-[var(--color-rule)] bg-[var(--color-paper)] hover:-translate-y-0.5 hover:shadow-sm"
              }`}
            >
              {equipe && (
                <span className="absolute -top-2 -right-2 rounded-full bg-[var(--color-purple)] px-2 py-0.5 text-[10px] font-bold text-white">
                  Équipé
                </span>
              )}

              {/* Preview avatar */}
              {item.categorie === "avatar" && item.gradient && (
                <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${item.gradient} text-2xl font-bold text-white`}>
                  A
                </div>
              )}

              {/* Preview titre */}
              {item.categorie === "titre" && (
                <div className="mb-3 flex justify-center">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold border"
                    style={{ color: item.couleurTitre ?? "var(--color-ink)", borderColor: item.couleurTitre ?? "var(--color-rule)" }}
                  >
                    {item.emoji} {item.label}
                  </span>
                </div>
              )}

              <p className="text-center text-sm font-bold text-[var(--color-ink)] mb-0.5">{item.label}</p>
              <p className="text-center text-xs text-[var(--color-ink-soft)] mb-3">{item.description}</p>

              {item.defaut || item.prix === 0 ? (
                <p className="text-center text-xs font-semibold text-[var(--color-success)]">Gratuit ✓</p>
              ) : debloque ? (
                equipe ? null : (
                  <button
                    onClick={() => equiper.mutate({ itemId: item.id })}
                    disabled={equiper.isPending}
                    className="w-full rounded-xl bg-[var(--color-purple)] px-3 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    Équiper
                  </button>
                )
              ) : (
                <button
                  onClick={() => acheter.mutate({ itemId: item.id })}
                  disabled={acheter.isPending || !abordable}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold transition-opacity ${
                    abordable
                      ? "bg-[var(--color-gold)] text-[var(--color-ink)] hover:opacity-90"
                      : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] cursor-not-allowed"
                  } disabled:opacity-50`}
                >
                  {abordable ? `🏆 ${item.prix} XP` : `🔒 ${item.prix} XP`}
                </button>
              )}
            </div>
          );
        })}
      </div>}
    </div>
  );
}
