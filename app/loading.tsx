import { LuFishSymbol } from "react-icons/lu";

export default function RootLoading() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden bg-surface-container-low lg:block" />
      <div className="flex flex-col items-center justify-center bg-surface px-6 py-10">
        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-surface-container-low text-primary lg:hidden">
          <LuFishSymbol className="size-8 animate-pulse" aria-hidden />
        </div>
        <main className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-8 shadow-bloom">
          <div className="mb-8 h-1.5 animate-pulse rounded-full bg-surface-container-low" />
          <div className="mb-3 h-9 w-3/4 animate-pulse rounded-lg bg-surface-container-low" />
          <div className="mb-8 h-5 w-full animate-pulse rounded-lg bg-surface-container-low" />
          <div className="h-12 w-full animate-pulse rounded-2xl bg-surface-container-low" />
        </main>
      </div>
    </div>
  );
}
