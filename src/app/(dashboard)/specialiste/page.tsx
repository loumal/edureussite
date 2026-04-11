import { requireRole } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { NavSpecialiste } from "@/components/specialiste/nav-specialiste";
import { WelcomeTour } from "@/components/ui/welcome-tour";
import Link from "next/link";

export default async function SpecialisteDashboardPage() {
  const session = await requireRole(["SPECIALISTE"]);

  const specialiste = await prisma.specialiste.findUnique({
    where: { userId: session.user.id },
    include: {
      webinaires: {
        where: { dateHeure: { gte: new Date() } },
        orderBy: { dateHeure: "asc" },
        take: 5,
      },
    },
  });

  if (!specialiste) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-[var(--color-ink-soft)]">Profil spécialiste introuvable.</p>
      </div>
    );
  }

  const [demandesEnAttente, prochainsRdv] = await Promise.all([
    prisma.demandeRencontre.findMany({
      where: { specialisteId: specialiste.id, statut: "EN_ATTENTE" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.rendezVous.findMany({
      where: { specialisteId: specialiste.id, statut: "CONFIRME", debut: { gte: new Date() } },
      orderBy: { debut: "asc" },
      take: 3,
      include: {
        eleve: { select: { prenom: true, nom: true } },
        demande: { select: { prenomEnfant: true } },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <WelcomeTour role="specialiste" prenom={specialiste.prenom} />
      <NavSpecialiste />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[var(--color-ink)]">
            Bonjour, {specialiste.prenom} 👋
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {specialiste.specialite.replace(/_/g, " ")}
          </p>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
          <Link
            href="/specialiste/agenda"
            className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--color-rule)] bg-white p-4 hover:bg-[var(--color-paper-warm)] transition-colors text-center"
          >
            <span className="text-2xl">📅</span>
            <span className="text-xs font-semibold text-[var(--color-ink)]">Mon agenda</span>
          </Link>
          <Link
            href="/specialiste/demandes"
            className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--color-rule)] bg-white p-4 hover:bg-[var(--color-paper-warm)] transition-colors text-center relative"
          >
            <span className="text-2xl">📋</span>
            <span className="text-xs font-semibold text-[var(--color-ink)]">Demandes</span>
            {demandesEnAttente.length > 0 && (
              <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-white">
                {demandesEnAttente.length}
              </span>
            )}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Prochains rendez-vous */}
          <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-4">
              Prochains rendez-vous
            </p>
            {prochainsRdv.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-soft)]">
                Aucun rendez-vous confirmé.{" "}
                <Link href="/specialiste/demandes" className="text-[var(--color-accent)] hover:underline">
                  Voir les demandes →
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {prochainsRdv.map((rdv) => (
                  <div key={rdv.id} className="rounded-xl bg-[var(--color-paper-warm)] p-3">
                    <p className="text-xs font-semibold text-[var(--color-ink)]">
                      {rdv.eleve
                        ? `${rdv.eleve.prenom} ${rdv.eleve.nom}`
                        : rdv.demande.prenomEnfant ?? "Parent"}
                    </p>
                    <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                      {new Date(rdv.debut).toLocaleDateString("fr-CA", { dateStyle: "medium" })} ·{" "}
                      {new Date(rdv.debut).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
                <Link
                  href="/specialiste/agenda"
                  className="block text-xs font-semibold text-[var(--color-accent)] hover:underline mt-2"
                >
                  Voir l'agenda complet →
                </Link>
              </div>
            )}
          </div>

          {/* Demandes en attente */}
          <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-4">
              Demandes en attente
            </p>
            {demandesEnAttente.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-soft)]">Aucune demande en attente.</p>
            ) : (
              <div className="space-y-3">
                {demandesEnAttente.map((d) => (
                  <div key={d.id} className="rounded-xl bg-[var(--color-paper-warm)] p-3">
                    {d.prenomEnfant && (
                      <p className="text-xs font-semibold text-[var(--color-ink)] mb-1">
                        Enfant : {d.prenomEnfant}
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-ink-soft)] line-clamp-2">{d.message}</p>
                    <p className="text-xs text-[var(--color-ink-soft)] mt-1">
                      {new Date(d.createdAt).toLocaleDateString("fr-CA", { dateStyle: "medium" })}
                    </p>
                  </div>
                ))}
                <Link
                  href="/specialiste/demandes"
                  className="block text-xs font-semibold text-[var(--color-accent)] hover:underline mt-2"
                >
                  Gérer les demandes →
                </Link>
              </div>
            )}
          </div>

          {/* Prochains webinaires */}
          <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-5 md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-4">
              Mes prochains webinaires
            </p>
            {specialiste.webinaires.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-soft)]">Aucun webinaire planifié.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {specialiste.webinaires.map((w) => (
                  <div key={w.id} className="rounded-xl bg-[var(--color-paper-warm)] p-3">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{w.titre}</p>
                    <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                      {new Date(w.dateHeure).toLocaleDateString("fr-CA", { dateStyle: "long" })} ·{" "}
                      {new Date(w.dateHeure).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
