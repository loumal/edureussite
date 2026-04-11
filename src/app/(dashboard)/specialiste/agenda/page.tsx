import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavSpecialiste } from "@/components/specialiste/nav-specialiste";
import { AjouterCreneauForm } from "@/components/specialiste/ajouter-creneau-form";
import Link from "next/link";

export default async function AgendaSpecialistePage() {
  await requireRole(["SPECIALISTE"]);

  const [creneaux, rdvData] = await Promise.all([
    api.specialiste.mesCreneaux(),
    api.specialiste.mesRendezVous(),
  ]);

  const { aVenir, passes } = rdvData;
  const creneauxLibres = creneaux.filter((c) => !c.rendezVous);

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavSpecialiste />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[var(--color-ink)]">Mon agenda</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Gérez vos créneaux disponibles et vos rendez-vous confirmés.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Rendez-vous à venir */}
          <Card className="p-5">
            <CardLabel className="mb-4">Rendez-vous à venir</CardLabel>
            {aVenir.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-soft)]">Aucun rendez-vous planifié.</p>
            ) : (
              <div className="space-y-3">
                {aVenir.map((rdv) => (
                  <div key={rdv.id} className="rounded-xl bg-[var(--color-paper-warm)] p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {rdv.eleve
                          ? `${rdv.eleve.prenom} ${rdv.eleve.nom}`
                          : rdv.demande.prenomEnfant
                          ? `Enfant : ${rdv.demande.prenomEnfant}`
                          : "Parent"}
                      </p>
                      <Badge variant="success">Confirmé</Badge>
                    </div>
                    <p className="text-xs text-[var(--color-ink-soft)]">
                      {new Date(rdv.debut).toLocaleDateString("fr-CA", { dateStyle: "full" })}
                    </p>
                    <p className="text-xs text-[var(--color-ink-soft)]">
                      {new Date(rdv.debut).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                      {" – "}
                      {new Date(rdv.fin).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Créneaux disponibles */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <CardLabel>Créneaux disponibles</CardLabel>
              <span className="text-xs text-[var(--color-ink-soft)]">
                {creneauxLibres.length} libre{creneauxLibres.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="mb-4">
              <AjouterCreneauForm />
            </div>

            {creneauxLibres.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-soft)]">Aucun créneau libre pour l'instant.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {creneauxLibres.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl bg-[var(--color-paper-warm)] p-2.5">
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-ink)]">
                        {new Date(c.debut).toLocaleDateString("fr-CA", { dateStyle: "medium" })}
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        {new Date(c.debut).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                        {" – "}
                        {new Date(c.fin).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Badge variant="success">Libre</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Demandes en attente */}
        <div className="mt-6">
          <Link
            href="/specialiste/demandes"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-rule)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] transition-colors"
          >
            📋 Voir les demandes de rencontre →
          </Link>
        </div>

        {/* Historique */}
        {passes.length > 0 && (
          <Card className="mt-6 p-5">
            <CardLabel className="mb-4">Historique</CardLabel>
            <div className="space-y-2">
              {passes.slice(0, 10).map((rdv) => (
                <div key={rdv.id} className="flex items-center justify-between rounded-xl bg-[var(--color-paper-warm)] p-3">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-ink)]">
                      {rdv.eleve
                        ? `${rdv.eleve.prenom} ${rdv.eleve.nom}`
                        : rdv.demande.prenomEnfant ?? "Parent"}
                    </p>
                    <p className="text-xs text-[var(--color-ink-soft)]">
                      {new Date(rdv.debut).toLocaleDateString("fr-CA", { dateStyle: "medium" })}
                    </p>
                  </div>
                  <Badge variant={rdv.statut === "TERMINE" ? "default" : "accent"}>
                    {rdv.statut === "TERMINE" ? "Terminé" : "Annulé"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
