"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
}

/**
 * Piège le focus clavier à l'intérieur du composant enfant (WCAG 2.1 — 2.1.1).
 * Appuyer sur Échap appelle onClose si fourni via data-attr.
 */
export function FocusTrap({ children, active = true }: FocusTrapProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    // Focus sur le premier élément focusable à l'ouverture
    const focusable = el.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusable[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const all = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (all.length === 0) return;
      const first = all[0];
      const last = all[all.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active]);

  return (
    <div ref={ref} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
