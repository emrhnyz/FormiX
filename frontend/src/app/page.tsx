import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { PageShell } from "@/components/layout/PageShell";
import { FadeIn } from "@/components/ui/FadeIn";
import { BRAND } from "@/lib/brand";

const features = [
  {
    title: "Rich form builder",
    desc: "Text, choice, multi-select, polls, and photo questions — all routed through FHE before they hit the chain.",
    icon: "✦",
  },
  {
    title: "Private by default",
    desc: "Individual answers stay encrypted. Creators decrypt only inside their wallet session.",
    icon: "🔐",
  },
  {
    title: "Fill-to-earn",
    desc: "Attach ETH bounties per response with caps and factory-funded pools.",
    icon: "◎",
  },
  {
    title: "Creator dashboard",
    desc: "Track submissions, decrypt tallies, and read text answers when you own the form.",
    icon: "◈",
  },
  {
    title: "On-chain integrity",
    desc: "Schema hash and settings live in your EncryptedForm contract — no silent schema drift.",
    icon: "⛓",
  },
  {
    title: "CoFHE ready",
    desc: "Powered by Fhenix on Base Sepolia testnet. Production-minded architecture.",
    icon: "⚡",
  },
];

const steps = [
  {
    n: "01",
    title: "Create",
    desc: "Design your form, pick question types, optionally enable rewards, and deploy via FormFactory.",
  },
  {
    n: "02",
    title: "Encrypt & submit",
    desc: "Respondents connect a wallet. CoFHE encrypts each answer client-side, then submits per question on-chain.",
  },
  {
    n: "03",
    title: "Finalize & decrypt",
    desc: "A final transaction seals the response. Only the creator can decrypt aggregates and text chunks.",
  },
];

export default function HomePage() {
  return (
    <PageShell>
      <section className="relative overflow-hidden px-6 pb-20 pt-12 sm:pt-20">
        <div className="mx-auto max-w-5xl text-center">
          <FadeIn>
            <p className="fx-pill">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              FHE · Blockchain · Private forms
            </p>
          </FadeIn>

          <FadeIn delay={1} className="mt-10 flex justify-center">
            <BrandLogo
              variant="stacked"
              href={false}
              iconSize={88}
              className="animate-float scale-105 sm:scale-110"
            />
          </FadeIn>

          <FadeIn delay={2}>
            <h1 className="mt-8 font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Forms that{" "}
              <span className="fx-gradient-text">never leak</span> individual answers
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
              {BRAND.name} is a privacy-first form platform on the blockchain. Build surveys,
              applications, and rewarded polls where every response is fully homomorphically
              encrypted before it reaches the chain.
            </p>
          </FadeIn>

          <FadeIn delay={3} className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/create" className="fx-btn-primary">
              Create a form
            </Link>
            <Link href="/fill" className="fx-btn-secondary">
              Fill a form
            </Link>
            <Link href="/dashboard" className="fx-btn-secondary">
              Dashboard
            </Link>
            <Link href="/about" className="fx-btn-secondary">
              What is FormiX?
            </Link>
          </FadeIn>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-ink-900/40 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <h2 className="fx-section-title text-center">How it works</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-slate-400">
              Three on-chain steps. Zero plaintext answers stored in contract storage.
            </p>
          </FadeIn>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <FadeIn key={s.n} delay={(i + 1) as 1 | 2 | 3}>
                <article className="fx-card group relative overflow-hidden p-8">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl transition group-hover:bg-cyan-500/15" />
                  <span className="font-display text-5xl font-bold text-violet-500/25 transition duration-500 group-hover:text-cyan-400/40">
                    {s.n}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold text-white">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{s.desc}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <h2 className="fx-section-title text-center">Built for trust and presentation</h2>
          </FadeIn>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={((i % 3) + 1) as 1 | 2 | 3}>
                <article className="fx-card group h-full p-6">
                  <span className="inline-block text-2xl text-violet-400 transition duration-500 group-hover:scale-110 group-hover:text-cyan-300">
                    {f.icon}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <FadeIn>
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/80 via-ink-900 to-cyan-950/40 p-10 text-center sm:p-14">
            <BrandLogo variant="icon" href={false} iconSize={56} className="mx-auto" />
            <h2 className="mt-6 font-display text-2xl font-bold text-white sm:text-3xl">
              Ready to ship your first encrypted form?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-400">
              Connect your wallet, deploy in one transaction, and share the contract address with
              respondents.
            </p>
            <Link href="/create" className="fx-btn-primary mt-8 inline-block">
              Get started
            </Link>
          </div>
        </FadeIn>
      </section>
    </PageShell>
  );
}
