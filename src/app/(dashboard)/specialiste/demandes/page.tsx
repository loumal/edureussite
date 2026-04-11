import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavSpecialiste } from "@/components/specialiste/nav-specialiste";
import { ProposerRdvBtn } from "@/components/specialiste/proposer-rdv-btn";

const STATUT_LABEL: Record<string, { label: string; variant: "default" | "gold" | "success" | "accent" }> = {
  EN_ATTENTE: { label: "En attente", variant: "gold" },
  CONFIRME: { label: "Confirmé", variant: "success" },
  ANNULE: { label: "Annulé", variant: "accent" },
  TERMINE: { label: "Terminé", variant: "default" },
};

export default async function DemandesSpecialistePage() {
  await requireRole(["SPECIALISTE"]);

  const [demandes, creneaux] = await Promise.all([
    api.specialiste.mesDemandes(),
    api.specialiste.mesCreneaux(),
  ]);

  const creneauxLibres = creneaux.filter((c) => !c.rendezVous);
  const demandesEnAttente = demandes.filter((d) => d.statut === "EN_ATTENTE");
  const demandesTraitees = demandes.filter((d) => d.statut !== "EN_ATTENTE");

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavSpecialiste />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[var(--color-ink)]">Demandes de rencontre</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {demandesEnAttente.length} en attente · {demandesTraitees.length} traitée{demandesTraitees.length !== 1 ? "s" : ""}
          </p>
        </div>

        {creneauxLibres.length === 0 && demandesEnAttente.length > 0 && (
          <div className="mb-6 rounded-xl bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.2)] px-4 py-3">
            <p className="text-sm text-[var(--color-accent)] font-medium">
              ⚠️ Vous n'avez aucun créneau disponible. Ajoutez-en depuis votre{" "}
              <a href="/specialiste/agenda" className="underline">agenda</a> pour confirmer des rendez-vous.
            </p>
          </div>
        )}

        {/* Demandes en attente */}
        {demandesEnAttente.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-[var(--color-ink)] mb-4">En attente</h2>
            <div className="space-y-4">
              {demandesEnAttente.map((d) => (
                <Card key={d.id} className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="gold">En attente</Badge>
                        {d.eleve && (
                          <span className="text-xs font-semibold text-[var(--color-ink)]">
                            Enfant : {d.eleve.prenom} {d.eleve.nom}
                          </span>
                        )}
                        {!d.eleve && d.prenomEnfant && (
                          <span className="text-xs font-semibold text-[var(--color-ink)]">
                            Enfant : {d.prenomEnfant}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-ink-soft)] mt-1">
                        Reçu le {new Date(d.createdAt).toLocaleDateString("fr-CA", { dateStyle: "medium" })}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-[var(--color-ink)] bg-[var(--color-paper-warm)] rounded-xl px-4 py-3 mb-3">
                    {d.message}
                  </p>

                  <ProposerRdvBtn
                    demandeId={d.id}
                    creneaux={creneauxLibres.map((c) => ({
                      id: c.id,
                      debut: c.debut,
                      fin: c.fin,
                    }))}
                  />
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Demandes traitées */}
        {demandesTraitees.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-[var(--color-ink)] mb-4">Traitées</h2>
            <div className="space-y-3">
              {demandesTraitees.map((d) => {
                const s = STATUT_LABEL[d.statut] ?? { label: d.statut, variant: "default" as const };
                return (
                  <Card key={d.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={s.variant}>{s.label}</Badge>
                          {d.eleve && (
                            <span className="text-xs text-[var(--color-ink-soft)]">
                              {d.eleve.prenom} {d.eleve.nom}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-ink-soft)] mt-1 line-clamp-2">{d.message}</p>
                        <p className="text-xs text-[var(--color-ink-soft)] mt-1">
                          {new Date(d.createdAt).toLocaleDateString("fr-CA", { dateStyle: "medium" })}
                        </p>
                      </div>
                      {d.rendezVous && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-semibold text-[var(--color-ink)]">
                            {new Date(d.rendezVous.debut).toLocaleDateString("fr-CA", { dateStyle: "short" })}
                          </p>
                          <p className="text-xs text-[var(--color-ink-soft)]">
                            {new Date(d.rendezVous.debut).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {demandes.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-sm text-[var(--color-ink-soft)]">
              Aucune demande de rencontre pour l'instant.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
