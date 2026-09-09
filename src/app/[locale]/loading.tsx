export default function Loading() {
  return (
    <main className="page-shell min-h-[65vh] py-12" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading Scrub Vibe</span>
      <div className="h-3 w-28 animate-pulse bg-[#dce9e5]" />
      <div className="mt-5 h-14 max-w-xl animate-pulse bg-black/8" />
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="aspect-[4/5] animate-pulse bg-black/6" />)}
      </div>
    </main>
  );
}
