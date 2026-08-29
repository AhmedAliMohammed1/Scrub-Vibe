import Link from "next/link";
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f2ea] px-5 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-4 font-serif text-7xl">Lost, beautifully.</h1>
        <Link
          href="/en"
          className="mt-8 inline-block border-b border-current pb-1 text-xs font-bold uppercase tracking-[.15em]"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
