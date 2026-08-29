import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <main className="mx-auto min-h-[60vh] max-w-md px-5 py-20">
      <p className="eyebrow">NOVA ACCOUNT</p>
      <h1 className="mt-4 font-serif text-5xl">
        {locale === "ar" ? "مرحباً بعودتك" : "Welcome back"}
      </h1>
      <form className="mt-10 space-y-4">
        <label className="block text-xs font-bold uppercase tracking-[.12em]">
          Email
          <input
            type="email"
            className="mt-2 h-12 w-full border border-black/20 bg-transparent px-4 font-normal normal-case"
          />
        </label>
        <label className="block text-xs font-bold uppercase tracking-[.12em]">
          Password
          <input
            type="password"
            className="mt-2 h-12 w-full border border-black/20 bg-transparent px-4"
          />
        </label>
        <button className="h-12 w-full bg-neutral-950 text-xs font-bold uppercase tracking-[.14em] text-white">
          {locale === "ar" ? "تسجيل الدخول" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
