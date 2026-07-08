import { LuFishSymbol } from "react-icons/lu";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-surface font-(family-name:--font-inter)">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-8 py-24 text-center sm:px-16">
        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
          <LuFishSymbol className="size-8 animate-pulse" aria-hidden />
        </div>
        <div className="mb-3 h-10 w-48 animate-pulse rounded-lg bg-surface-container-low sm:w-56" />
        <div className="mb-8 h-5 w-full max-w-md animate-pulse rounded-lg bg-surface-container-low" />
        <div className="flex flex-wrap justify-center gap-4">
          <div className="h-12 w-32 animate-pulse rounded-2xl bg-surface-container-low" />
          <div className="h-12 w-32 animate-pulse rounded-2xl bg-surface-container-low" />
        </div>
      </main>
    </div>
  );
}
