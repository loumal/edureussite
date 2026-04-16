export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full animate-pulse">
      <div className="h-8 w-40 rounded-xl bg-[var(--color-rule)]" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-[var(--color-rule)]" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-[var(--color-rule)]" />
    </div>
  );
}
