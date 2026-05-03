import Link from "next/link";

export default function CompteSuspenduPage() {
  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center p-4">
      <div style={{ fontFamily: "Georgia, serif", maxWidth: 480, width: "100%" }}>
        <div className="text-center mb-8">
          <h1 className="text-xl font-black text-[var(--color-ink)] mb-1">✦ Édu-Réussite QC</h1>
        </div>

        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-lg font-black text-[var(--color-ink)] mb-2">
            Accès temporairement suspendu
          </h2>
          <p className="text-sm text-[var(--color-ink-soft)] mb-6 leading-relaxed">
            Votre compte a été suspendu par un administrateur suite à une activité inhabituelle détectée.
            Vous avez reçu un courriel avec plus d&apos;informations.
          </p>

          <div className="bg-[var(--color-paper-warm)] rounded-xl p-4 mb-6 text-left text-sm text-[var(--color-ink-soft)]">
            <p className="font-semibold text-[var(--color-ink)] mb-2">Pour récupérer votre accès :</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Consultez le courriel de suspension reçu</li>
              <li>Contactez le support à <strong>support@edu-reussite.com</strong></li>
              <li>Un administrateur réactivera votre compte</li>
            </ol>
          </div>

          <a
            href="mailto:support@edu-reussite.com"
            className="inline-block rounded-xl bg-[var(--color-ink)] text-white px-6 py-2.5 text-sm font-bold hover:opacity-80 transition-opacity"
          >
            Contacter le support →
          </a>

          <div className="mt-4">
            <Link href="/login" className="text-xs text-[var(--color-ink-soft)] hover:underline">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
