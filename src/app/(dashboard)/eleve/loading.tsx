export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full animate-pulse">
      {/* Header skeleton */}
      <div className="h-8 w-48 rounded-xl bg-[var(--color-rule)]" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="h-40 rounded-2xl bg-[var(--color-rule)]" />
          <div className="h-32 rounded-2xl bg-[var(--color-rule)]" />
          <div className="h-48 rounded-2xl bg-[var(--color-rule)]" />
        </div>
        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="h-32 rounded-2xl bg-[var(--color-rule)]" />
          <div className="h-40 rounded-2xl bg-[var(--color-rule)]" />
        </div>
      </div>
    </div>
  );
}
