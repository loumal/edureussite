import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavAdmin } from "@/components/layout/nav-admin";
import { ChangerRoleBtn } from "@/components/admin/changer-role-btn";
import { SupprimerUserBtn } from "@/components/admin/supprimer-user-btn";
import { CreerSuperAdminBtn } from "@/components/admin/creer-super-admin-btn";
import { ReinitialiserMdpBtn } from "@/components/admin/reinitialiser-mdp-btn";
import { BonusMiraBtn } from "@/components/admin/bonus-mira-btn";
import { SuspendreUserBtn } from "@/components/admin/suspendre-user-btn";
import Link from "next/link";

const ROLE_LABEL: Record<string, string> = {
  ELEVE: "Élève",
  PARENT: "Parent",
  ENSEIGNANT: "Enseignant",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

const ROLE_VARIANT: Record<string, "success" | "accent" | "gold" | "default"> = {
  ELEVE: "default",
  PARENT: "default",
  ENSEIGNANT: "success",
  ADMIN: "gold",
  SUPER_ADMIN: "accent",
};

const ROLE_TABS = [
  { label: "Tous", value: "" },
  { label: "Élèves", value: "ELEVE" },
  { label: "Parents", value: "PARENT" },
  { label: "Enseignants", value: "ENSEIGNANT" },
  { label: "Admins", value: "ADMIN" },
  { label: "Super Admins", value: "SUPER_ADMIN" },
] as const;

type PageProps = { searchParams: Promise<{ role?: string; page?: string; search?: string }> };

export default async function UtilisateursPage({ searchParams }: PageProps) {
  const session = await requireRole(["SUPER_ADMIN"]);
  const { role: roleFilter, page: pageParam, search: searchParam } = await searchParams;

  const validRoles = ["ELEVE", "PARENT", "ENSEIGNANT", "ADMIN", "SUPER_ADMIN"];
  const roleActif = roleFilter && validRoles.includes(roleFilter) ? roleFilter : undefined;
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1);
  const search = searchParam?.trim() || undefined;

  const { items, total, totalPages } = await api.admin.listerUtilisateurs(
    { role: roleActif as "ELEVE" | "PARENT" | "ENSEIGNANT" | "ADMIN" | "SUPER_ADMIN" | undefined, page, search }
  );

  function buildHref(params: { role?: string; page?: number; search?: string }) {
    const sp = new URLSearchParams();
    if (params.role) sp.set("role", params.role);
    if (params.page && params.page > 1) sp.set("page", String(params.page));
    if (params.search) sp.set("search", params.search);
    const qs = sp.toString();
    return `/admin/utilisateurs${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavAdmin role={session.user.role} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[var(--color-ink)]">
              Gestion des utilisateurs 👥
            </h1>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">
              {total} utilisateur{total > 1 ? "s" : ""}
              {roleActif ? ` · filtre : ${ROLE_LABEL[roleActif]}` : ""}
              {search ? ` · recherche : "${search}"` : ""}
            </p>
          </div>
          <CreerSuperAdminBtn />
        </div>

        {/* Onglets filtre par rôle */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {ROLE_TABS.map((tab) => {
            const isActif = (roleActif ?? "") === tab.value;
            return (
              <Link
                key={tab.value}
                href={buildHref({ role: tab.value || undefined, search })}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  isActif
                    ? "bg-[var(--color-ink)] text-white"
                    : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Barre de recherche */}
        <form method="GET" action="/admin/utilisateurs" className="mb-4 flex items-center gap-2">
          {roleActif && <input type="hidden" name="role" value={roleActif} />}
          <input
            type="search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Rechercher par nom ou courriel…"
            className="flex-1 max-w-sm rounded-xl border border-[var(--color-rule)] bg-white px-4 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
          />
          <button
            type="submit"
            className="rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Chercher
          </button>
          {search && (
            <Link
              href={buildHref({ role: roleActif })}
              className="text-xs text-[var(--color-ink-soft)] hover:underline"
            >
              Effacer
            </Link>
          )}
        </form>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <CardLabel>
              {roleActif ? `${ROLE_LABEL[roleActif]}s (${items.length} / ${total})` : `Tous les utilisateurs (${items.length} / ${total})`}
            </CardLabel>
            {totalPages > 1 && (
              <span className="text-xs text-[var(--color-ink-soft)]">
                Page {page} / {totalPages}
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-center text-[var(--color-ink-soft)] py-6">
              Aucun utilisateur dans cette catégorie.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between rounded-xl p-3 ${
                    user.suspended ? "bg-amber-50 border border-amber-200" : "bg-[var(--color-paper-warm)]"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
                        {user.profilEleve
                          ? `${user.profilEleve.prenom} ${user.profilEleve.nom}`
                          : user.name ?? user.email}
                      </p>
                      <Badge variant={ROLE_VARIANT[user.role] ?? "default"}>
                        {ROLE_LABEL[user.role] ?? user.role}
                      </Badge>
                      {user.suspended && (
                        <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                          🔒 Suspendu
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">{user.email}</p>
                    {user.profilEleve && (
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        {user.profilEleve.niveauScolaire.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0 flex-wrap justify-end">
                    <span className="text-xs text-[var(--color-ink-soft)]">
                      {new Date(user.createdAt).toLocaleDateString("fr-CA")}
                    </span>
                    {user.profilEleve && (
                      <BonusMiraBtn
                        eleveId={user.profilEleve.id}
                        nom={`${user.profilEleve.prenom} ${user.profilEleve.nom}`}
                      />
                    )}
                    <ReinitialiserMdpBtn
                      userId={user.id}
                      nom={
                        user.profilEleve
                          ? `${user.profilEleve.prenom} ${user.profilEleve.nom}`
                          : (user.name ?? user.email)
                      }
                    />
                    <SuspendreUserBtn
                      userId={user.id}
                      nom={
                        user.profilEleve
                          ? `${user.profilEleve.prenom} ${user.profilEleve.nom}`
                          : (user.name ?? user.email)
                      }
                      suspended={user.suspended ?? false}
                    />
                    <ChangerRoleBtn userId={user.id} roleActuel={user.role} />
                    <SupprimerUserBtn
                      userId={user.id}
                      nom={
                        user.profilEleve
                          ? `${user.profilEleve.prenom} ${user.profilEleve.nom}`
                          : (user.name ?? user.email)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--color-rule)]">
              <Link
                href={buildHref({ role: roleActif, page: page - 1, search })}
                className={`rounded-lg border border-[var(--color-rule)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-soft)] transition-colors ${
                  page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-[var(--color-paper-warm)] hover:text-[var(--color-ink)]"
                }`}
                aria-disabled={page <= 1}
              >
                ← Précédent
              </Link>
              <span className="text-xs text-[var(--color-ink-soft)]">
                {page} / {totalPages} · {total} utilisateur{total > 1 ? "s" : ""}
              </span>
              <Link
                href={buildHref({ role: roleActif, page: page + 1, search })}
                className={`rounded-lg border border-[var(--color-rule)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-soft)] transition-colors ${
                  page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-[var(--color-paper-warm)] hover:text-[var(--color-ink)]"
                }`}
                aria-disabled={page >= totalPages}
              >
                Suivant →
              </Link>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
