"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  type: string;
  titre: string;
  contenu: string;
  lue: boolean;
  createdAt: Date;
};

const TYPE_CONFIG: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  ALERTE_BLOCAGE:      { emoji: "🚨", label: "Blocage détecté",    color: "text-[var(--color-accent)]",   bg: "bg-[rgba(217,79,43,0.08)] border-[rgba(217,79,43,0.2)]"   },
  ALERTE_DECROCHAGE:   { emoji: "📉", label: "Risque de décrochage", color: "text-[var(--color-accent)]", bg: "bg-[rgba(217,79,43,0.08)] border-[rgba(217,79,43,0.2)]"   },
  ALERTE_EMOTIONNELLE: { emoji: "💛", label: "Alerte émotionnelle", color: "text-[var(--color-gold)]",    bg: "bg-[rgba(201,149,42,0.08)] border-[rgba(201,149,42,0.2)]" },
  RAPPORT_POSITIF:     { emoji: "🌟", label: "Rapport positif",    color: "text-[var(--color-success)]",  bg: "bg-[rgba(42,124,111,0.08)] border-[rgba(42,124,111,0.2)]"  },
  RAPPORT_HEBDOMADAIRE:{ emoji: "📊", label: "Rapport hebdomadaire",color: "text-[var(--color-purple)]",  bg: "bg-[rgba(91,79,207,0.08)] border-[rgba(91,79,207,0.2)]"    },
  RELANCE_ABSENCE:     { emoji: "📅", label: "Absence détectée",   color: "text-[var(--color-gold)]",    bg: "bg-[rgba(201,149,42,0.08)] border-[rgba(201,149,42,0.2)]"  },
  EXERCICE_AJOUTE:     { emoji: "✏️", label: "Nouvel exercice",    color: "text-[var(--color-purple)]",  bg: "bg-[rgba(91,79,207,0.08)] border-[rgba(91,79,207,0.2)]"    },
  PLAN_MODIFIE:        { emoji: "🗺️", label: "Plan mis à jour",    color: "text-[var(--color-success)]",  bg: "bg-[rgba(42,124,111,0.08)] border-[rgba(42,124,111,0.2)]"  },
};

interface Props {
  initialNotifications: Notification[];
}

export function NotificationsClient({ initialNotifications }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const utils = trpc.useUtils();

  const marquerLue = trpc.parent.marquerNotificationLue.useMutation({
    onSuccess: (_, vars) => {
      setNotifications((prev) =>
        prev.map((n) => n.id === vars.notificationId ? { ...n, lue: true } : n)
      );
    },
  });

  const marquerToutes = trpc.parent.marquerToutesNotificationsLues.useMutation({
    onSuccess: () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, lue: true })));
      utils.parent.countNotificationsNonLues.invalidate();
    },
  });

  const nonLues = notifications.filter((n) => !n.lue).length;

  if (notifications.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-5xl mb-4">🔔</div>
        <p className="text-lg font-bold text-[var(--color-ink)] mb-2">Aucune notification</p>
        <p className="text-sm text-[var(--color-ink-soft)] max-w-sm mx-auto">
          Les alertes, rapports et mises à jour concernant vos enfants apparaîtront ici automatiquement.
        </p>
      </Card>
    );
  }

  return (
    <div>
      {/* Barre d'actions */}
      {nonLues > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[var(--color-ink-soft)]">
            <strong className="text-[var(--color-ink)]">{nonLues}</strong> notification{nonLues > 1 ? "s" : ""} non lue{nonLues > 1 ? "s" : ""}
          </p>
          <Button
            variant="secondary"
            size="sm"
            loading={marquerToutes.isPending}
            onClick={() => marquerToutes.mutate()}
          >
            Tout marquer comme lu
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((notif) => {
          const cfg = TYPE_CONFIG[notif.type] ?? {
            emoji: "🔔",
            label: notif.type,
            color: "text-[var(--color-ink-soft)]",
            bg: "bg-[var(--color-paper-warm)] border-[var(--color-rule)]",
          };

          return (
            <div
              key={notif.id}
              className={`relative rounded-2xl border p-4 transition-all ${cfg.bg} ${
                !notif.lue ? "shadow-sm" : "opacity-75"
              }`}
            >
              {/* Point non lu */}
              {!notif.lue && (
                <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-[var(--color-accent)]" />
              )}

              <div className="flex items-start gap-3 pr-4">
                <span className="text-2xl flex-shrink-0 mt-0.5">{cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-[var(--color-ink-soft)]">
                      {new Date(notif.createdAt).toLocaleDateString("fr-CA", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-ink)] mb-1">{notif.titre}</p>
                  <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">{notif.contenu}</p>

                  {!notif.lue && (
                    <button
                      className="mt-2 text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] underline underline-offset-2"
                      onClick={() => marquerLue.mutate({ notificationId: notif.id })}
                    >
                      Marquer comme lu
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
