import Image from "next/image";
import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavAdmin } from "@/components/layout/nav-admin";
import { GererSpecialistesClient } from "@/components/admin/gerer-specialistes-client";
import { GererWebinairesClient } from "@/components/admin/gerer-webinaires-client";
import { FeatureToggle } from "@/components/admin/feature-toggle";
import { InvitationBtn } from "@/components/admin/invitation-btn";

const SPECIALITE_LABEL: Record<string, string> = {
  ORTHOPEDAGOGUE: "Orthopédagogue",
  PSYCHONEUROLOGUE: "Psychoneurologue",
  PSYCHOEDUCATEUR: "Psychoéducateur",
  ORTHOPHONISTE: "Orthophoniste",
  TRAVAILLEUR_SOCIAL: "Travailleur social",
  PSYCHOLOGUE: "Psychologue",
  AUTRE: "Autre spécialité",
};

export default async function SpecialistesAdminPage() {
  const session = await requireRole(["SUPER_ADMIN"]);
  const [specialistes, demandes, featureFlags] = await Promise.all([
    api.specialiste.listerAdmin(),
    api.specialiste.listerDemandes(),
    api.admin.getFeatureFlags(),
  ]);
  const featureActif = featureFlags["feature_specialistes"] ?? true;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavAdmin role={session.user.role} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[var(--color-ink)]">Spécialistes 👩‍⚕️</h1>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">
              {specialistes.length} spécialiste{specialistes.length > 1 ? "s" : ""} · {demandes.length} demande{demandes.length > 1 ? "s" : ""} reçue{demandes.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <FeatureToggle
              featureKey="feature_specialistes"
              actif={featureActif}
              label="Visible aux parents"
            />
            <GererSpecialistesClient />
          </div>
        </div>

        {!featureActif && (
          <div className="mb-6 rounded-xl bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.2)] px-4 py-3">
            <p className="text-sm text-[var(--color-accent)] font-medium">
              ⚠️ Cette fonctionnalité est actuellement désactivée — elle n'est pas visible dans l'espace parent.
            </p>
          </div>
        )}

        {/* Demandes de rencontre en attente */}
        {demandes.length > 0 && (
          <section className="mb-8">
            <Card className="p-5">
              <CardLabel className="mb-4">Demandes de rencontre reçues</CardLabel>
              <div className="space-y-3">
                {demandes.map((d) => (
                  <div key={d.id} className="flex items-start gap-3 rounded-xl bg-[var(--color-paper-warm)] p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[var(--color-ink)]">
                          Demande pour {d.specialiste.prenom} {d.specialiste.nom}
                        </p>
                        <Badge variant={d.statut === "EN_ATTENTE" ? "gold" : "success"}>
                          {d.statut === "EN_ATTENTE" ? "En attente" : d.statut}
                        </Badge>
                      </div>
                      {d.parent && (
                        <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                          Parent : {d.parent.name ?? d.parent.email}
                          {" · "}
                          <a href={`mailto:${d.parent.email}`} className="hover:underline text-[var(--color-accent)]">
                            {d.parent.email}
                          </a>
                        </p>
                      )}
                      {d.prenomEnfant && (
                        <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                          Enfant : {d.prenomEnfant}
                        </p>
                      )}
                      <p className="text-xs text-[var(--color-ink-soft)] mt-1 line-clamp-2">{d.message}</p>
                      <p className="text-xs text-[var(--color-ink-soft)] mt-1">
                        {new Date(d.createdAt).toLocaleDateString("fr-CA", { dateStyle: "medium" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}

        {/* Liste des spécialistes */}
        <section>
          <div className="space-y-4">
            {specialistes.length === 0 ? (
              <Card className="p-10 text-center">
                <div className="text-5xl mb-3">👩‍⚕️</div>
                <p className="text-sm text-[var(--color-ink-soft)]">
                  Aucun spécialiste pour l'instant. Cliquez sur «&nbsp;+ Ajouter&nbsp;» pour en créer un.
                </p>
              </Card>
            ) : (
              specialistes.map((s) => (
                <Card key={s.id} className="p-4">
                  <div className="flex items-center gap-4">
                    {s.photo ? (
                      <Image src={s.photo} alt="" width={48} height={48} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-purple)] text-lg font-black text-white flex-shrink-0">
                        {s.prenom.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--color-ink)]">{s.prenom} {s.nom}</p>
                      <p className="text-xs text-[var(--color-accent)] font-semibold">
                        {SPECIALITE_LABEL[s.specialite] ?? s.specialite}
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)] mt-0.5 truncate">{s.email}</p>
                      {s.disponibilites && (
                        <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">🕐 {s.disponibilites}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={s.actif ? "success" : "default"}>
                        {s.actif ? "Actif" : "Inactif"}
                      </Badge>
                      <InvitationBtn
                        specialisteId={s.id}
                        compteActif={!!s.userId}
                      />
                    </div>
                  </div>

                  {/* Webinaires section */}
                  <div className="mt-4 border-t border-[var(--color-rule)] pt-4">
                    <p className="text-xs font-bold text-[var(--color-ink-soft)] uppercase tracking-wider mb-2">
                      Webinaires ({s.webinaires.length})
                    </p>
                    <GererWebinairesClient
                      specialisteId={s.id}
                      webinaires={s.webinaires.map((w) => ({
                        id: w.id,
                        titre: w.titre,
                        dateHeure: w.dateHeure,
                        gratuit: w.gratuit,
                        actif: w.actif,
                        inscriptions: w.inscriptions,
                        maxParticipants: w.maxParticipants,
                      }))}
                    />
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
