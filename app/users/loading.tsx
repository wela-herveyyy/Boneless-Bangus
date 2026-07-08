export default function UsersLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 h-9 w-32 animate-pulse rounded-lg bg-surface-container-low" />
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-14 animate-pulse rounded-xl bg-surface-container-low"
          />
        ))}
      </div>
    </main>
  );
}
