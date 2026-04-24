import Image from "next/image";
import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { Card, CardLabel } from "@/components/ui/card";
import { NavParent } from "@/components/layout/nav-parent";
import { Badge } from "@/components/ui/badge";
import { DemandeRencontreBtn } from "@/components/parent/demande-rencontre-btn";
import { InscriptionWebinaireBtn } from "@/components/parent/inscription-webinaire-btn";
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

export default async function SpecialistesPage() {
  await requireRole(["PARENT", "ADMIN", "SUPER_ADMIN"]);
  const actif = await isFeatureActive(FEATURE_KEYS.SPECIALISTES);
  if (!actif) redirect("/parent");

  const [profilParent, specialistes, webinaires, inscriptions] = await Promise.all([
    api.parent.getDashboard(),
    api.specialiste.lister(),
    api.specialiste.prochainWebinaires(),
    api.specialiste.mesInscriptions(),
  ]);

  const inscritWebinaireIds = new Set(inscriptions.map((i) => i.webinaireId));

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavParent nom={profilParent.nom} specialistesActif={true} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[var(--color-ink)]">Nos spécialistes</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Orthopédagogues, psychoneurologues et autres experts en éducation disponibles pour votre famille.
          </p>
        </div>

        {/* Webinaires à venir */}
        {webinaires.length > 0 && (
          <section className="mb-10">
            <h2 className="text-base font-bold text-[var(--color-ink)] mb-4 flex items-center gap-2">
              📅 Prochains webinaires
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {webinaires.map((w) => {
                const dejaInscrit = inscritWebinaireIds.has(w.id);
                return (
                  <Card key={w.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 text-center rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-3 py-2 min-w-[52px]">
                        <p className="text-xs font-bold text-[var(--color-ink-soft)] uppercase">
                          {new Date(w.dateHeure).toLocaleDateString("fr-CA", { month: "short" })}
                        </p>
                        <p className="text-xl font-black text-[var(--color-ink)] leading-none">
                          {new Date(w.dateHeure).getDate()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[var(--color-ink)] line-clamp-2">{w.titre}</p>
                        <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                          {w.specialiste.prenom} {w.specialiste.nom} ·{" "}
                          {new Date(w.dateHeure).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {w.gratuit ? (
                            <Badge variant="success">Gratuit</Badge>
                          ) : (
                            <Badge variant="gold">Payant</Badge>
                          )}
                        </div>
                        <div className="mt-2">
                          <InscriptionWebinaireBtn
                            webinaireId={w.id}
                            dejaInscrit={dejaInscrit}
                            nbInscrits={w.inscriptions.length}
                            maxParticipants={w.maxParticipants}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Annuaire des spécialistes */}
        <section>
          <h2 className="text-base font-bold text-[var(--color-ink)] mb-4 flex items-center gap-2">
            👩‍⚕️ Notre équipe
          </h2>

          {specialistes.length === 0 ? (
            <Card className="p-10 text-center">
              <div className="text-5xl mb-3">🔜</div>
              <p className="text-sm text-[var(--color-ink-soft)]">
                Les profils de nos spécialistes seront disponibles très bientôt.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {specialistes.map((s) => (
                <Card key={s.id} className="p-5">
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {s.photo ? (
                        <Image
                          src={s.photo}
                          alt={`${s.prenom} ${s.nom}`}
                          width={64}
                          height={64}
                          className="h-16 w-16 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-purple)] text-2xl font-black text-white">
                          {s.prenom.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-bold text-[var(--color-ink)]">
                            {s.prenom} {s.nom}
                          </p>
                          <p className="text-xs font-semibold text-[var(--color-accent)] mt-0.5">
                            {SPECIALITE_LABEL[s.specialite] ?? s.specialite}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-[var(--color-ink-soft)] mt-2 line-clamp-3">
                        {s.bio}
                      </p>

                      {s.disponibilites && (
                        <p className="text-xs text-[var(--color-ink-soft)] mt-2">
                          🕐 {s.disponibilites}
                        </p>
                      )}

                      {s.langues.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {s.langues.map((l) => (
                            <span
                              key={l}
                              className="rounded-full bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-ink-soft)]"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-3">
                        <DemandeRencontreBtn
                          specialisteId={s.id}
                          specialisteNom={`${s.prenom} ${s.nom}`}
                          enfants={profilParent.eleves.map((e) => ({ id: e.id, prenom: e.prenom }))}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
