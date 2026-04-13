import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavParent } from "@/components/layout/nav-parent";
import { AnnulerRdvBtn } from "@/components/parent/annuler-rdv-btn";
import { isFeatureActive, FEATURE_KEYS } from "@/lib/features";
import { redirect } from "next/navigation";

const SPECIALITE_LABEL: Record<string, string> = {
  ORTHOPEDAGOGUE: "Orthopédagogue",
  PSYCHONEUROLOGUE: "Psychoneurologue",
  PSYCHOEDUCATEUR: "Psychoéducateur",
  ORTHOPHONISTE: "Orthophoniste",
  TRAVAILLEUR_SOCIAL: "Travailleur social",
  PSYCHOLOGUE: "Psychologue",
  AUTRE: "Autre spécialité",
};

export default async function RendezVousParentPage() {
  await requireRole(["PARENT", "ADMIN", "SUPER_ADMIN"]);
  const actif = await isFeatureActive(FEATURE_KEYS.SPECIALISTES);
  if (!actif) redirect("/parent");

  const [profilParent, rdvs, inscriptions] = await Promise.all([
    api.parent.getDashboard(),
    api.specialiste.mesRendezVousParent(),
    api.specialiste.mesInscriptions(),
  ]);

  const now = new Date();
  const rdvsAVenir = rdvs.filter(
    (r) => new Date(r.debut) >= now && r.statut === "CONFIRME"
  );
  const rdvsPasses = rdvs.filter(
    (r) => new Date(r.debut) < now || r.statut === "TERMINE" || r.statut === "ANNULE"
  );

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavParent nom={profilParent.nom} specialistesActif={true} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[var(--color-ink)]">Mes rendez-vous</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Rendez-vous avec nos spécialistes et inscriptions aux webinaires.
          </p>
        </div>

        {/* Rendez-vous à venir */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-[var(--color-ink)] mb-4">
            Rendez-vous à venir
          </h2>

          {rdvsAVenir.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-[var(--color-ink-soft)]">
                Aucun rendez-vous à venir. Consultez{" "}
                <a href="/parent/specialistes" className="text-[var(--color-accent)] font-semibold hover:underline">
                  nos spécialistes
                </a>{" "}
                pour en planifier un.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {rdvsAVenir.map((rdv) => (
                <Card key={rdv.id} className="p-5">
                  <div className="flex items-start gap-4">
                    {rdv.specialiste.photo ? (
                      <img
                        src={rdv.specialiste.photo}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-purple)] text-xl font-black text-white flex-shrink-0">
                        {rdv.specialiste.prenom.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-bold text-[var(--color-ink)]">
                            {rdv.specialiste.prenom} {rdv.specialiste.nom}
                          </p>
                          <p className="text-xs font-semibold text-[var(--color-accent)] mt-0.5">
                            {SPECIALITE_LABEL[rdv.specialiste.specialite] ?? rdv.specialiste.specialite}
                          </p>
                        </div>
                        <Badge variant="success">Confirmé</Badge>
                      </div>

                      <div className="mt-2 flex items-center gap-4 flex-wrap">
                        <p className="text-sm font-semibold text-[var(--color-ink)]">
                          {new Date(rdv.debut).toLocaleDateString("fr-CA", { dateStyle: "full" })}
                        </p>
                        <p className="text-sm text-[var(--color-ink-soft)]">
                          {new Date(rdv.debut).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                          {" – "}
                          {new Date(rdv.fin).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>

                      {(rdv.eleve ?? rdv.demande.prenomEnfant) && (
                        <p className="text-xs text-[var(--color-ink-soft)] mt-1">
                          Enfant : {rdv.eleve?.prenom ?? rdv.demande.prenomEnfant}
                          {rdv.eleve?.nom ? ` ${rdv.eleve.nom}` : ""}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-3">
                        <AnnulerRdvBtn rdvId={rdv.id} />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Inscriptions aux webinaires */}
        {inscriptions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-[var(--color-ink)] mb-4">
              Mes inscriptions aux webinaires
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {inscriptions.map((i) => (
                <Card key={i.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-center rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-3 py-2 min-w-[52px]">
                      <p className="text-xs font-bold text-[var(--color-ink-soft)] uppercase">
                        {new Date(i.webinaire.dateHeure).toLocaleDateString("fr-CA", { month: "short" })}
                      </p>
                      <p className="text-xl font-black text-[var(--color-ink)] leading-none">
                        {new Date(i.webinaire.dateHeure).getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--color-ink)] line-clamp-2">
                        {i.webinaire.titre}
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                        {i.webinaire.specialiste.prenom} {i.webinaire.specialiste.nom}
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        {new Date(i.webinaire.dateHeure).toLocaleTimeString("fr-CA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <div className="mt-2">
                        <Badge variant={new Date(i.webinaire.dateHeure) >= now ? "success" : "default"}>
                          {new Date(i.webinaire.dateHeure) >= now ? "À venir" : "Passé"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Historique RDV */}
        {rdvsPasses.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-[var(--color-ink)] mb-4">Historique</h2>
            <div className="space-y-3">
              {rdvsPasses.map((rdv) => (
                <Card key={rdv.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {rdv.specialiste.prenom} {rdv.specialiste.nom}
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        {new Date(rdv.debut).toLocaleDateString("fr-CA", { dateStyle: "medium" })}
                      </p>
                    </div>
                    <Badge variant={rdv.statut === "TERMINE" ? "default" : "accent"}>
                      {rdv.statut === "TERMINE" ? "Terminé" : "Annulé"}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
