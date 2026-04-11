"use client";

import { useEffect } from "react";

const STORAGE_KEY = "edu_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== "classique") {
      document.documentElement.setAttribute("data-theme", saved);
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const val = e.newValue;
      if (!val || val === "classique") {
        document.documentElement.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", val);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return <>{children}</>;
}

export function applyTheme(theme: string) {
  localStorage.setItem(STORAGE_KEY, theme);
  if (theme === "classique") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
  // Broadcast to other tabs
  window.dispatchEvent(
    new StorageEvent("storage", { key: STORAGE_KEY, newValue: theme })
  );
}

export function getSavedTheme(): string {
  if (typeof window === "undefined") return "classique";
  return localStorage.getItem(STORAGE_KEY) ?? "classique";
}
