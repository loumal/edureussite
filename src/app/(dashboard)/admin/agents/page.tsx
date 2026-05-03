import { requireRole } from "@/lib/auth/utils";
import { NavAdmin } from "@/components/layout/nav-admin";
import { AgentsClient } from "@/components/admin/agents-client";

export default async function AgentsPage() {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavAdmin role={session.user.role} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[var(--color-ink)]">Agents IA 🤖</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Assistants intelligents pour la croissance, la veille et les partenariats d'Édu-Réussite QC
          </p>
        </div>
        <AgentsClient />
      </main>
    </div>
  );
}
