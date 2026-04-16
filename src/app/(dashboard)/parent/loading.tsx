export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full animate-pulse">
      <div className="h-8 w-56 rounded-xl bg-[var(--color-rule)]" />
      <div className="h-64 rounded-2xl bg-[var(--color-rule)]" />
      <div className="h-48 rounded-2xl bg-[var(--color-rule)]" />
    </div>
  );
}
