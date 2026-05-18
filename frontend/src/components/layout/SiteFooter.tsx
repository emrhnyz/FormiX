import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { BRAND } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] bg-ink-900/50 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-6 py-12 sm:flex-row">
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <BrandLogo variant="inline" href="/" iconSize={32} />
          <p className="max-w-xs text-center text-sm text-slate-500 sm:text-left">
            {BRAND.tagline}. Built on Fhenix CoFHE and Base Sepolia.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
          <Link href="/about" className="transition hover:text-violet-300">
            What is FormiX
          </Link>
          <Link href="/create" className="transition hover:text-violet-300">
            Create
          </Link>
          <Link href="/fill" className="transition hover:text-violet-300">
            Fill
          </Link>
          <Link href="/dashboard" className="transition hover:text-violet-300">
            Dashboard
          </Link>
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} {BRAND.name}. Testnet demo — not production advice.
      </p>
    </footer>
  );
}
