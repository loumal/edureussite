"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";

const APIS_DEFAUT = ["ElevenLabs", "Anthropic", "Deepgram", "OpenAI", "Resend"];

// Services qui utilisent un système de crédits (et pour lesquels on peut entrer creditsTotal)
const CREDITS_HINT: Record<string, string> = {
  ElevenLabs: "Crédits TTS du plan (ex: 500000 pour le plan Indie à 99 $)",
  Deepgram: "Crédits du plan Deepgram si applicable",
};

function statutBadge(joursRestants: number | null) {
  if (joursRestants === null) return null;
  if (joursRestants <= 0)
    return <span className="text-xs font-bold text-white bg-red-600 rounded-full px-2 py-0.5">Épuisé</span>;
  if (joursRestants <= 1)
    return <span className="text-xs font-bold text-white bg-[var(--color-accent)] rounded-full px-2 py-0.5">⚠ &lt;24h restantes</span>;
  if (joursRestants <= 3)
    return <span className="text-xs font-bold text-[var(--color-gold)] bg-[rgba(201,149,42,0.12)] rounded-full px-2 py-0.5">⚠ J-{Math.ceil(joursRestants)}</span>;
  return <span className="text-xs font-bold text-[var(--color-success)] bg-[rgba(42,124,111,0.10)] rounded-full px-2 py-0.5">✓ {Math.round(joursRestants)}j restants</span>;
}

function formatUSD(val: number) {
  return val.toLocaleString("fr-CA", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CA", {
    day: "numeric", month: "long", year: "numeric",
    timeZone: "America/Toronto",
  });
}

function formatCredits(n: number) {
  return n.toLocaleString("fr-CA");
}

export function ApiRenewals() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.getApiBudgets.useQuery();
  const setBudget = trpc.admin.setApiBudget.useMutation({
    onSuccess: () => utils.admin.getApiBudgets.invalidate(),
  });

  const [editing, setEditing] = useState<string | null>(null);
  const [montant, setMontant] = useState("");
  const [datePaiement, setDatePaiement] = useState("");
  const [creditsTotal, setCreditsTotal] = useState("");

  const resultats = data?.resultats ?? [];
  const elevesActifs = data?.elevesActifs ?? 0;

  const configuredNames = resultats.map((r) => r.nom);
  const allNames = [...new Set([...APIS_DEFAUT, ...configuredNames])];

  function startEdit(nom: string) {
    const existing = resultats.find((r) => r.nom === nom);
    setMontant(existing?.montantUSD?.toString() ?? "");
    setDatePaiement(existing?.datePaiement ? existing.datePaiement.slice(0, 10) : "");
    setCreditsTotal(existing?.creditsTotal?.toString() ?? "");
    setEditing(nom);
  }

  async function save(nom: string) {
    if (!montant || !datePaiement) return;
    await setBudget.mutateAsync({
      nom,
      montantUSD: parseFloat(montant),
      datePaiement: new Date(datePaiement).toISOString(),
      creditsTotal: creditsTotal ? parseInt(creditsTotal) : undefined,
    });
    setEditing(null);
  }

  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
        💰 Suivi budgétaire des APIs
      </p>
      <p className="text-xs text-[var(--color-ink-soft)] mb-4">
        Saisissez le montant payé et la date de paiement. La plateforme projette la date d'épuisement et alerte les admins à J-3 et J-1.
        {elevesActifs > 0 && (
          <span className="ml-1">• <strong>{elevesActifs}</strong> élève{elevesActifs > 1 ? "s" : ""} actifs</span>
        )}
      </p>

      <div className="space-y-3">
        {allNames.map((nom) => {
          const r = resultats.find((x) => x.nom === nom);
          const configured = r?.montantUSD !== null && r?.datePaiement !== null;
          const useCredits = !!(r?.creditsTotal && r?.creditsUtilises !== null);
          const pctCredits = useCredits
            ? Math.round((r!.creditsUtilises! / r!.creditsTotal!) * 100)
            : null;
          const pctUSD = r?.montantUSD
            ? Math.round((r.consommeUSD / r.montantUSD) * 100)
            : 0;
          // Quelle jauge afficher ?
          const pctAffiche = pctCredits ?? pctUSD;

          return (
            <div key={nom} className="rounded-xl border border-[var(--color-rule)] bg-white p-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[var(--color-ink)]">{nom}</span>
                  {r && statutBadge(r.joursRestants)}
                </div>
                <button
                  onClick={() => editing === nom ? setEditing(null) : startEdit(nom)}
                  className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] underline"
                >
                  {editing === nom ? "Annuler" : configured ? "Modifier" : "Configurer"}
                </button>
              </div>

              {/* Stats (quand configuré et pas en édition) */}
              {configured && r && editing !== nom && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)]">Budget</p>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{formatUSD(r.montantUSD!)}</p>
                    <p className="text-[10px] text-[var(--color-ink-soft)]">depuis {formatDate(r.datePaiement!)}</p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)]">
                      {useCredits ? "Crédits TTS" : "Consommé"}
                    </p>
                    {useCredits ? (
                      <>
                        <p className="text-sm font-semibold text-[var(--color-ink)]">
                          {formatCredits(r.creditsUtilises!)} / {formatCredits(r.creditsTotal!)}
                        </p>
                        <p className="text-[10px] text-[var(--color-ink-soft)]">
                          {pctCredits}% des crédits · {formatUSD(r.consommeUSD)} estimé
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-[var(--color-ink)]">{formatUSD(r.consommeUSD)}</p>
                        <p className="text-[10px] text-[var(--color-ink-soft)]">{pctUSD}% du budget</p>
                      </>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)]">Moy./jour</p>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {r.moyenneParJourUSD !== null ? formatUSD(r.moyenneParJourUSD) : "—"}
                    </p>
                    <p className="text-[10px] text-[var(--color-ink-soft)]">
                      {r.coutParEleveUSD > 0 ? `${formatUSD(r.coutParEleveUSD)}/élève` : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)]">Épuisement prévu</p>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {r.dateEpuisement ? formatDate(r.dateEpuisement) : "—"}
                    </p>
                    <p className="text-[10px] text-[var(--color-ink-soft)]">
                      {r.joursRestants !== null && r.joursRestants > 0
                        ? `dans ~${Math.round(r.joursRestants)}j`
                        : r.joursRestants === 0 ? "budget épuisé" : "—"}
                    </p>
                  </div>
                </div>
              )}

              {/* Barre de progression */}
              {configured && r && editing !== nom && r.montantUSD && (
                <div className="mt-3">
                  <div className="h-1.5 w-full rounded-full bg-[var(--color-rule)]">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, pctAffiche)}%`,
                        backgroundColor:
                          r.joursRestants !== null && r.joursRestants <= 1
                            ? "var(--color-accent)"
                            : r.joursRestants !== null && r.joursRestants <= 3
                            ? "var(--color-gold)"
                            : "var(--color-success)",
                      }}
                    />
                  </div>
                  {useCredits && (
                    <p className="text-[10px] text-[var(--color-ink-soft)] mt-1">
                      Calcul basé sur les crédits du plan ({formatCredits(r.creditsTotal!)} crédits / {formatUSD(r.montantUSD!)})
                    </p>
                  )}
                </div>
              )}

              {/* Non-configuré */}
              {!configured && editing !== nom && (
                <p className="text-xs text-[var(--color-ink-soft)] mt-1">Aucun budget configuré</p>
              )}

              {/* Formulaire d'édition */}
              {editing === nom && (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                        Montant payé (USD)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={montant}
                        onChange={(e) => setMontant(e.target.value)}
                        placeholder="99.00"
                        className="rounded-lg border border-[var(--color-rule)] px-3 py-1.5 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)] w-32"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                        Date de paiement
                      </label>
                      <input
                        type="date"
                        value={datePaiement}
                        onChange={(e) => setDatePaiement(e.target.value)}
                        className="rounded-lg border border-[var(--color-rule)] px-3 py-1.5 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
                      />
                    </div>
                  </div>

                  {/* Champ crédits (seulement pour les APIs qui le supportent) */}
                  {CREDITS_HINT[nom] && (
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                        Crédits du plan (optionnel — calcul exact)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={creditsTotal}
                        onChange={(e) => setCreditsTotal(e.target.value)}
                        placeholder="500000"
                        className="rounded-lg border border-[var(--color-rule)] px-3 py-1.5 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)] w-36"
                      />
                      <p className="text-[10px] text-[var(--color-ink-soft)] mt-0.5">
                        {CREDITS_HINT[nom]}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => save(nom)}
                    disabled={!montant || !datePaiement || setBudget.isPending}
                    className="rounded-lg bg-[var(--color-ink)] px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
                  >
                    {setBudget.isPending ? "Sauvegarde…" : "Sauvegarder"}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <p className="text-xs text-[var(--color-ink-soft)] text-center py-4">Chargement…</p>
        )}
      </div>
    </Card>
  );
}
