import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavAdmin } from "@/components/layout/nav-admin";
import Link from "next/link";
import { ComptesSuspendus } from "./_components/comptes-suspendus";
import { IPsBloquees } from "./_components/ips-bloquees";
import { SttProviderSelector } from "./_components/stt-provider-selector";
import { TtsProviderSelector } from "./_components/tts-provider-selector";
import { ApiRenewals } from "./_components/api-renewals";
import { ProvinceManager } from "./_components/province-manager";
import { SecurityLogsPanel } from "./_components/security-logs-panel";
import { ImpersonationPanel } from "./_components/impersonation-panel";

const MATIERE_LABEL: Record<string, string> = {
  FRANCAIS: "Français",
  MATHEMATIQUES: "Mathématiques",
  SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social",
  ARTS: "Arts",
  ANGLAIS: "Anglais",
  EDUCATION_PHYSIQUE: "Éd. physique",
  ETHIQUE: "Éthique",
};

const SOURCE_LABEL: Record<string, string> = {
  MEES_OFFICIEL: "MEES Officiel",
  COMMISSION_SCOLAIRE: "Commission scolaire",
  MANUEL_SCOLAIRE: "Manuel scolaire",
  AUTRE: "Autre",
};


export default async function AdminDashboardPage() {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const dashboard = await api.admin.getDashboard();
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const securityLogs = isSuperAdmin ? await api.admin.getSecurityLogs({ limit: 75 }) : [];
  const apiCouts = isSuperAdmin ? await api.admin.getApiCouts() : null;
  const sttProvider = isSuperAdmin ? (await api.admin.getSttProvider()).provider : "ELEVENLABS";
  const ttsProvider = isSuperAdmin ? (await api.admin.getTtsProvider()).provider : "ELEVENLABS";

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavAdmin role={session.user.role} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[var(--color-ink)]">
            Tableau de bord {isSuperAdmin ? "Super Admin" : "Admin"} ⚙️
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Vue d'ensemble de la plateforme Édu-Réussite QC
          </p>
        </div>

        {/* Stats globales */}
        <div className={`grid gap-3 mb-6 ${isSuperAdmin ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-4"}`}>
          {[
            { label: "Élèves", value: dashboard.totalEleves, emoji: "🎒" },
            { label: "Enseignants", value: dashboard.totalEnseignants, emoji: "🍎" },
            { label: "Parents", value: dashboard.totalParents, emoji: "👨‍👩‍👧" },
            { label: "Modèles d'épreuves", value: dashboard.totalEpreuves, emoji: "📋" },
          ].map((stat) => (
            <Card key={stat.label} className="p-5 text-center">
              <div className="text-3xl mb-1">{stat.emoji}</div>
              <div className="text-3xl font-black text-[var(--color-ink)] leading-none">
                {stat.value}
              </div>
              <div className="text-xs text-[var(--color-ink-soft)] mt-1">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Stats Super Admin */}
        {isSuperAdmin && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Spécialistes", value: dashboard.totalSpecialistes, emoji: "👩‍⚕️" },
              { label: "Documents IA actifs", value: dashboard.totalDocuments, emoji: "📚" },
              { label: "Admins & Super Admins", value: dashboard.totalAdmins, emoji: "🛡️" },
              { label: "Nouveaux (7 jours)", value: dashboard.nouveauxCetteSemaine, emoji: "🆕", highlight: dashboard.nouveauxCetteSemaine > 0 },
            ].map((stat) => (
              <Card key={stat.label} className={`p-5 text-center ${stat.highlight ? "border-[var(--color-success)] bg-[rgba(42,124,111,0.03)]" : ""}`}>
                <div className="text-3xl mb-1">{stat.emoji}</div>
                <div className={`text-3xl font-black leading-none ${stat.highlight ? "text-[var(--color-success)]" : "text-[var(--color-ink)]"}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-[var(--color-ink-soft)] mt-1">{stat.label}</div>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Simuler une vue — Super Admin uniquement */}
          {isSuperAdmin && (
            <div className="md:col-span-2">
              <ImpersonationPanel />
            </div>
          )}

          {/* Modèles d'épreuves récents */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <CardLabel>Modèles d'épreuves récents</CardLabel>
              <Link
                href="/admin/epreuves"
                className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
              >
                Voir tout →
              </Link>
            </div>

            {dashboard.epreuvesRecentes.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm text-[var(--color-ink-soft)]">
                  Aucun modèle ajouté pour l'instant.
                </p>
                {isSuperAdmin && (
                  <Link
                    href="/admin/epreuves/nouveau"
                    className="mt-3 inline-block rounded-xl bg-[var(--color-ink)] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                  >
                    + Ajouter un modèle
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.epreuvesRecentes.map((e) => (
                  <Link
                    key={e.id}
                    href={`/admin/epreuves/${e.id}`}
                    className="flex items-center justify-between rounded-xl p-3 bg-[var(--color-paper-warm)] hover:bg-[var(--color-rule)] transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-ink)] line-clamp-1">
                        {e.titre}
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                        {MATIERE_LABEL[e.matiere] ?? e.matiere} ·{" "}
                        {e.niveauScolaire.replace("_", " ")} ·{" "}
                        {SOURCE_LABEL[e.source] ?? e.source}
                        {e.annee ? ` · ${e.annee}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span className="text-xs text-[var(--color-ink-soft)]">
                        {e.sections.length} section{e.sections.length > 1 ? "s" : ""}
                      </span>
                      {e.valide ? (
                        <Badge variant="success">✓ Validé</Badge>
                      ) : (
                        <Badge variant="accent">En attente</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Actions rapides */}
          <Card className="p-5">
            <CardLabel className="mb-4">Actions rapides</CardLabel>
            <div className="space-y-3">
              {isSuperAdmin && (
                <>
                  <Link
                    href="/admin/epreuves/nouveau"
                    className="flex items-center gap-3 rounded-xl p-3 bg-[var(--color-ink)] text-white hover:opacity-90 transition-opacity"
                  >
                    <span className="text-xl">📥</span>
                    <div>
                      <p className="text-sm font-bold">Ajouter un modèle d'épreuve</p>
                      <p className="text-xs opacity-70">
                        Coller une épreuve — Claude analyse la structure
                      </p>
                    </div>
                  </Link>
                  <Link
                    href="/admin/utilisateurs"
                    className="flex items-center gap-3 rounded-xl p-3 bg-[var(--color-paper-warm)] hover:bg-[var(--color-rule)] transition-colors"
                  >
                    <span className="text-xl">👥</span>
                    <div>
                      <p className="text-sm font-bold text-[var(--color-ink)]">
                        Gérer les utilisateurs
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        Rôles, accès, promotion super admin
                      </p>
                    </div>
                  </Link>
                  <Link
                    href="/admin/specialistes"
                    className="flex items-center gap-3 rounded-xl p-3 bg-[var(--color-paper-warm)] hover:bg-[var(--color-rule)] transition-colors"
                  >
                    <span className="text-xl">👩‍⚕️</span>
                    <div>
                      <p className="text-sm font-bold text-[var(--color-ink)]">
                        Gérer les spécialistes
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        Profils, webinaires, demandes de rencontre
                      </p>
                    </div>
                  </Link>
                  <Link
                    href="/admin/documents"
                    className="flex items-center gap-3 rounded-xl p-3 bg-[var(--color-paper-warm)] hover:bg-[var(--color-rule)] transition-colors"
                  >
                    <span className="text-xl">🤖</span>
                    <div>
                      <p className="text-sm font-bold text-[var(--color-ink)]">
                        Documents IA
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        Recherches et guides enrichissant les conseils IA
                      </p>
                    </div>
                  </Link>
                </>
              )}
              <Link
                href="/admin/epreuves"
                className="flex items-center gap-3 rounded-xl p-3 bg-[var(--color-paper-warm)] hover:bg-[var(--color-rule)] transition-colors"
              >
                <span className="text-xl">📚</span>
                <div>
                  <p className="text-sm font-bold text-[var(--color-ink)]">
                    Bibliothèque d'épreuves
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    Consulter et valider les modèles
                  </p>
                </div>
              </Link>
            </div>
          </Card>
        </div>

        {/* Coûts API — Super Admin uniquement */}
        {isSuperAdmin && apiCouts && <ApiCoutsWidget data={apiCouts} />}

        {/* Configuration vocale — Super Admin uniquement */}
        {isSuperAdmin && (
          <Card className="p-5 mt-4">
            <CardLabel className="mb-4">Configuration vocale</CardLabel>
            <div className="space-y-5">
              <TtsProviderSelector initialProvider={ttsProvider} />
              <div className="border-t border-[var(--color-rule)]" />
              <SttProviderSelector initialProvider={sttProvider} />
            </div>
          </Card>
        )}

        {/* Expansion pan-canadienne — Super Admin uniquement */}
        {isSuperAdmin && (
          <div className="mt-4">
            <ProvinceManager />
          </div>
        )}

        {/* Suivi budgétaire des APIs — Admin + Super Admin */}
        <div className="mt-4">
          <ApiRenewals />
        </div>

        {/* Comptes suspendus + IPs bloquées — Super Admin uniquement */}
        {isSuperAdmin && (
          <div className="mt-2">
            <ComptesSuspendus />
            <IPsBloquees />
          </div>
        )}

        {/* Journaux de sécurité — Super Admin uniquement */}
        {isSuperAdmin && (
          <Card className="p-5 mt-4">
            <SecurityLogsPanel logs={securityLogs} />
          </Card>
        )}
      </main>
    </div>
  );
}

// ── Widget coûts API ──────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, { label: string; emoji: string; unite: (s: ServiceRow) => string }> = {
  CLAUDE_MIRA:    { label: "Claude · Mira (chat)",     emoji: "🤖", unite: (s) => `${((s.inputTokens + s.outputTokens) / 1000).toFixed(1)}K tokens` },
  CLAUDE_EXERCICE: { label: "Claude · Exercices",        emoji: "📝", unite: (s) => `${((s.inputTokens + s.outputTokens) / 1000).toFixed(1)}K tokens` },
  CLAUDE_DOCUMENT: { label: "Claude · Documents IA",    emoji: "📄", unite: (s) => `${((s.inputTokens + s.outputTokens) / 1000).toFixed(1)}K tokens` },
  CLAUDE_ANALYSE:  { label: "Claude · Analyse épreuve", emoji: "🔍", unite: (s) => `${((s.inputTokens + s.outputTokens) / 1000).toFixed(1)}K tokens` },
  ELEVENLABS_TTS:  { label: "ElevenLabs · Voix Mira",  emoji: "🔊", unite: (s) => `${s.characters.toLocaleString()} caractères` },
  OPENAI_TTS:      { label: "OpenAI · Voix Mira",      emoji: "⚡", unite: (s) => `${s.characters.toLocaleString()} caractères` },
  EDUREUSSITE_TTS: { label: "RunPod · Voix Mira",      emoji: "🏠", unite: (s) => `${s.characters.toLocaleString()} caractères` },
  ELEVENLABS_STT:  { label: "ElevenLabs · Micro",       emoji: "🎤", unite: (s) => `~${Math.round(s.audioSecs / 60)} min audio` },
  DEEPGRAM_STT:    { label: "Deepgram · Micro",         emoji: "⚡", unite: (s) => `~${Math.round(s.audioSecs / 60)} min audio` },
  RESEND:          { label: "Resend · Courriels",        emoji: "📧", unite: (s) => `${s.emails} courriel${s.emails > 1 ? "s" : ""}` },
};

type ServiceRow = { service: string; appels: number; coutUSD: number; inputTokens: number; outputTokens: number; characters: number; audioSecs: number; emails: number };
type ApiCoutsData = { totalMoisUSD: number; totalGeneralUSD: number; totalAppels: number; parService: ServiceRow[]; par30Jours: { jour: string; coutUSD: number }[] };

const USD_TO_CAD = 1.37;

function fmt(usd: number) {
  const cad = usd * USD_TO_CAD;
  return cad < 0.01 ? "< 0,01 $" : `${cad.toFixed(2)} $`;
}

function ApiCoutsWidget({ data }: { data: ApiCoutsData }) {
  const maxJour = Math.max(...data.par30Jours.map((d) => d.coutUSD), 0.001);

  // Remplir les jours manquants sur 30 jours
  const jours30: { jour: string; coutUSD: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const found = data.par30Jours.find((x: { jour: string; coutUSD: number }) => x.jour === key);
    jours30.push({ jour: key, coutUSD: found?.coutUSD ?? 0 });
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Titre */}
      <div className="flex items-center gap-2">
        <span className="text-base">💰</span>
        <h2 className="text-base font-black text-[var(--color-ink)]">Coûts API estimés</h2>
        <span className="text-xs text-[var(--color-ink-soft)]">(CAD, taux ~1,37)</span>
      </div>

      {/* Cartes résumé */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Ce mois-ci", val: fmt(data.totalMoisUSD), sub: `${data.totalMoisUSD < 0.01 ? "0,00" : (data.totalMoisUSD * USD_TO_CAD).toFixed(2)} $ CAD` },
          { label: "Total cumulé", val: fmt(data.totalGeneralUSD), sub: `depuis le début` },
          { label: "Total appels", val: data.totalAppels.toLocaleString(), sub: "toutes APIs" },
          { label: "Services actifs", val: String(data.parService.length), sub: "sur 7 possibles" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-[var(--color-rule)] bg-white p-4">
            <p className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wide">{c.label}</p>
            <p className="text-xl font-black text-[var(--color-ink)] mt-1">{c.val}</p>
            <p className="text-[10px] text-[var(--color-ink-soft)] mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Graphique 30 jours */}
      <div className="rounded-xl border border-[var(--color-rule)] bg-white p-5">
        <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-3">Dépenses quotidiennes — 30 derniers jours (CAD)</p>
        <div className="flex items-end gap-0.5 h-20">
          {jours30.map((d) => {
            const pct = (d.coutUSD / maxJour) * 100;
            const isToday = d.jour === new Date().toISOString().split("T")[0];
            return (
              <div
                key={d.jour}
                className="flex-1 flex flex-col items-center gap-0.5 group relative"
                title={`${d.jour} : ${fmt(d.coutUSD)}`}
              >
                <div
                  className={`w-full rounded-t transition-all ${isToday ? "bg-[var(--color-success)]" : "bg-[var(--color-ink-soft)] opacity-40 group-hover:opacity-70"}`}
                  style={{ height: `${Math.max(pct, d.coutUSD > 0 ? 4 : 1)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-[var(--color-ink-soft)]">
          <span>{jours30[0]?.jour?.slice(5)}</span>
          <span>Aujourd&apos;hui</span>
        </div>
      </div>

      {/* Tableau par service */}
      <div className="rounded-xl border border-[var(--color-rule)] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-rule)] bg-[var(--color-paper-warm)]">
              <th className="text-left px-4 py-2.5 text-[11px] font-bold text-[var(--color-ink-soft)] uppercase tracking-wide">Service</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-bold text-[var(--color-ink-soft)] uppercase tracking-wide">Appels</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-bold text-[var(--color-ink-soft)] uppercase tracking-wide">Usage</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-bold text-[var(--color-ink-soft)] uppercase tracking-wide">Coût (CAD)</th>
            </tr>
          </thead>
          <tbody>
            {data.parService.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-xs text-[var(--color-ink-soft)]">
                  Aucun appel enregistré ce mois-ci — les données s&apos;accumuleront au fil des utilisations.
                </td>
              </tr>
            ) : (
              data.parService.map((s) => {
                const meta = SERVICE_LABELS[s.service];
                return (
                  <tr key={s.service} className="border-b border-[var(--color-rule)] last:border-0 hover:bg-[var(--color-paper-warm)]">
                    <td className="px-4 py-2.5 text-xs font-medium text-[var(--color-ink)]">
                      <span className="mr-1.5">{meta?.emoji ?? "⚙️"}</span>
                      {meta?.label ?? s.service}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-right text-[var(--color-ink-soft)]">{s.appels.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-xs text-right text-[var(--color-ink-soft)]">{meta?.unite(s) ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-right font-semibold text-[var(--color-ink)]">{fmt(s.coutUSD)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="px-4 py-2 text-[10px] text-[var(--color-ink-soft)] border-t border-[var(--color-rule)] bg-[var(--color-paper-warm)]">
          * Estimations basées sur les tarifs publics. Claude $3/$15 /1M tokens · ElevenLabs TTS $0,30/1000 chars · ElevenLabs STT $0,40/h · Deepgram STT $0,0043/min · Deepgram TTS $0,015/1000 chars · OpenAI TTS $0,015/1000 chars · Resend $1/1000 courriels.
        </div>
      </div>
    </div>
  );
}
