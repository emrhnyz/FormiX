"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { BrandLogo } from "@/components/brand/BrandLogo";

const links = [
  { href: "/about", label: "What is FormiX" },
  { href: "/create", label: "Create" },
  { href: "/fill", label: "Fill" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-xl transition-shadow duration-500 hover:shadow-[0_4px_32px_rgba(139,92,246,0.12)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <BrandLogo variant="inline" />

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition duration-300 ${
                  active
                    ? "bg-violet-500/20 text-violet-100 shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white hover:shadow-[0_0_16px_rgba(34,211,238,0.1)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <ConnectButton />
      </div>
    </header>
  );
}
