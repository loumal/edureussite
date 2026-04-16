import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[var(--color-paper)]">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-[var(--color-rule)] mb-2 select-none">
          404
        </div>
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-2xl font-black text-[var(--color-ink)] mb-2">
          Page introuvable
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mb-8">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-ink)] px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
        >
          ← Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
