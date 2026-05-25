export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { NavEleve } from "@/components/layout/nav-eleve";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { EpreuveSemaineClient } from "./epreuve-semaine-client";
import type { EpreuveGeneree } from "@/lib/ai/exercice";

interface PageProps {
  searchParams: Promise<{ semaine?: string }>;
}

export default async function EpreuveSemainePage({ searchParams }: PageProps) {
  await requireRole(["ELEVE"]);

  const params = await searchParams;
  const semaineISO = params.semaine;
  if (!semaineISO || !/^\d{4}-W\d{2}$/.test(semaineISO)) {
    redirect("/eleve/plan");
  }

  const [{ profil }, epreuve] = await Promise.all([
    api.eleve.getDashboard(),
    api.plan.getEpreuveSemaine({ semaineISO }),
  ]);

  if (!profil) return notFound();

  const semaineNum = semaineISO.split("-W")[1];

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavEleve prenom={profil.prenom} streak={profil.streakJours} />

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Fil d'Ariane */}
        <div className="mb-6">
          <Link
            href="/eleve/plan"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            ← Mon plan de réussite
          </Link>

          {!epreuve ? (
            /* Pas encore d'épreuve générée → afficher le lanceur */
            <div className="mt-4">
              <Card className="p-8 text-center">
                <div className="text-5xl mb-4">🏆</div>
                <h1 className="text-2xl font-black text-[var(--color-ink)] mb-2">
                  Épreuve de la semaine {semaineNum}
                </h1>
                <p className="text-sm text-[var(--color-ink-soft)] max-w-sm mx-auto mb-6 leading-relaxed">
                  Valide tout ce que tu as travaillé cette semaine avec une épreuve personnalisée.
                  Tu peux t&apos;arrêter n&apos;importe quand et reprendre plus tard.
                </p>
                <div className="flex justify-center gap-3 flex-wrap">
                  <Card className="p-4 text-center flex-1 min-w-[100px] max-w-[140px] border-[rgba(91,79,207,0.25)]">
                    <p className="text-2xl mb-1">⏱️</p>
                    <p className="text-xs font-bold text-[var(--color-ink)]">~35 min</p>
                    <p className="text-[10px] text-[var(--color-ink-soft)]">Durée estimée</p>
                  </Card>
                  <Card className="p-4 text-center flex-1 min-w-[100px] max-w-[140px] border-[rgba(91,79,207,0.25)]">
                    <p className="text-2xl mb-1">📊</p>
                    <p className="text-xs font-bold text-[var(--color-ink)]">100 pts</p>
                    <p className="text-[10px] text-[var(--color-ink-soft)]">Score sur 100</p>
                  </Card>
                  <Card className="p-4 text-center flex-1 min-w-[100px] max-w-[140px] border-[rgba(91,79,207,0.25)]">
                    <p className="text-2xl mb-1">⏸️</p>
                    <p className="text-xs font-bold text-[var(--color-ink)]">Pause libre</p>
                    <p className="text-[10px] text-[var(--color-ink-soft)]">Reprends quand tu veux</p>
                  </Card>
                </div>
                <EpreuveSemaineClient
                  semaineISO={semaineISO}
                  mode="generer"
                  prenom={profil.prenom}
                />
              </Card>
            </div>
          ) : (
            /* Épreuve existante (en cours ou terminée) */
            <div className="mt-4">
              {epreuve.statut === "TERMINE" ? (
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(42,124,111,0.1)] border border-[rgba(42,124,111,0.3)] px-3 py-1.5">
                    <span className="text-xs font-bold text-[var(--color-success)]">
                      ✅ Épreuve complétée · {Math.round(epreuve.score ?? 0)}/100
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(201,149,42,0.1)] border border-[rgba(201,149,42,0.3)] px-3 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-bold text-amber-700">
                      En cours — reprends là où tu t&apos;es arrêté·e
                    </span>
                  </div>
                </div>
              )}

              <EpreuveSemaineClient
                semaineISO={semaineISO}
                mode="reprendre"
                epreuveId={epreuve.id}
                epreuve={epreuve.contenu as unknown as EpreuveGeneree}
                statut={epreuve.statut}
                feedbackExistant={(epreuve.feedbackIA as Record<string, unknown> | null) ?? null}
                progressionSauvegardee={
                  (epreuve.progression as { partieActive?: number; reponses?: Record<string, string> } | null) ?? null
                }
                tempsSauvegardeSecondes={epreuve.tempsSecondes}
                prenom={profil.prenom}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
