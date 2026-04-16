export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-paper)]">
      <div className="flex flex-col items-center gap-4">
        <div className="text-3xl font-black text-[var(--color-ink)] animate-pulse">
          ✦ ÉduRéussite
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-[var(--color-ink-soft)] animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
