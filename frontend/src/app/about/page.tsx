import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { FormiXMark } from "@/components/brand/FormiXMark";
import { FormLifecycleDiagram } from "@/components/about/FormLifecycleDiagram";
import { PlaintextExposureChart } from "@/components/about/PlaintextExposureChart";
import { PageShell } from "@/components/layout/PageShell";
import { FadeIn } from "@/components/ui/FadeIn";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `What is ${BRAND.name}? — How encrypted forms work`,
  description:
    "Learn how FormiX uses FHE, smart contracts, and CoFHE on Base Sepolia. Early development preview — not the final release.",
};

const txSteps = [
  { step: "1", name: "createForm", who: "Creator", detail: "Deploy EncryptedForm via FormFactory; schema hash stored on-chain." },
  { step: "2", name: "submitFheQuestion", who: "Respondent", detail: "One tx per FHE question; ciphertext written to contract storage." },
  { step: "3", name: "finalizeSubmission", who: "Respondent", detail: "Seals the response; no plaintext payload in this transaction." },
  { step: "4", name: "decrypt (off-chain UI)", who: "Creator", detail: "Dashboard uses wallet session + CoFHE to read aggregates and text chunks." },
];

const questionTypes = [
  { type: "Short / long text", fhe: "Yes", storage: "Encrypted chunks on-chain" },
  { type: "Single choice", fhe: "Yes", storage: "Encrypted selection index" },
  { type: "Multi-select", fhe: "Yes", storage: "Encrypted bitmask / indices" },
  { type: "Poll / rating", fhe: "Yes", storage: "Homomorphic tallies" },
  { type: "Photo upload", fhe: "Metadata on IPFS", storage: "Image file off-chain; reference hashed on-chain" },
];

const stackRows = [
  { layer: "UI", tech: "Next.js 14, React, Tailwind", role: "Create, fill, dashboard flows" },
  { layer: "Wallet", tech: "Wagmi, RainbowKit", role: "Sign transactions, creator auth" },
  { layer: "Encryption", tech: "Fhenix CoFHE SDK", role: "Client-side FHE before submit" },
  { layer: "Chain", tech: "Base Sepolia", role: "Testnet execution environment" },
  { layer: "Contracts", tech: "FormFactory, EncryptedForm", role: "Form lifecycle & ciphertext storage" },
];

const devStatus = [
  { area: "Network", status: "Testnet only", note: "Base Sepolia — no mainnet deployment yet" },
  { area: "Product", status: "Active development", note: "UI, contracts, and flows may change without notice" },
  { area: "FHE limits", status: "~4 FHE questions / form", note: "Gas and batching constraints on testnet" },
  { area: "Security", status: "Not audited", note: "Do not use for regulated or high-risk data" },
  { area: "Release", status: "Preview build", note: "This is not the final production version of FormiX" },
];

export default function AboutPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-6 pb-24 pt-10 sm:pt-14">
        <FadeIn>
          <div className="fx-banner-warn flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
              <strong className="text-amber-200">Early development preview.</strong>{" "}
              {BRAND.name} is under active construction. Features, contracts, and UX are not
              final — use testnet wallets and demo data only.
            </p>
            <span className="shrink-0 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
              Not final release
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={1} className="mt-12 text-center">
          <BrandLogo variant="stacked" href={false} iconSize={72} className="mx-auto" />
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            What is <span className="fx-gradient-text">{BRAND.name}</span>?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            A blockchain-native form platform where individual answers stay encrypted on-chain.
            Creators design forms; respondents answer with a wallet; only the form owner can
            decrypt results in their session.
          </p>
        </FadeIn>

        <FadeIn delay={2} className="mt-16">
          <section className="fx-card p-8 sm:p-10">
            <h2 className="fx-section-title">What it does</h2>
            <div className="mt-6 grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start">
              <ul className="space-y-4 text-slate-400">
                <li className="flex gap-3">
                  <FormiXMark size={28} className="mt-0.5 shrink-0" />
                  <span>
                    <strong className="text-slate-200">Create</strong> — Publish an{" "}
                    <code className="text-cyan-300/90">EncryptedForm</code> contract with your
                    question schema, optional ETH rewards, and on-chain settings.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 text-xl text-violet-400">🔐</span>
                  <span>
                    <strong className="text-slate-200">Fill</strong> — Respondents encrypt each
                    answer in the browser with CoFHE, then send ciphertext via smart-contract
                    calls.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 text-xl text-cyan-400">◈</span>
                  <span>
                    <strong className="text-slate-200">Analyze</strong> — The creator opens the
                    dashboard, decrypts tallies and text inside the wallet-connected session.
                    Third parties see transactions, not plaintext answers.
                  </span>
                </li>
              </ul>
              <div className="hidden sm:block">
                <FormiXMark size={120} className="opacity-90" />
              </div>
            </div>
          </section>
        </FadeIn>

        <FadeIn delay={3} className="mt-12">
          <h2 className="fx-section-title text-center">End-to-end flow</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slate-400">
            From deployment to decryption — every sensitive answer path goes through FHE before
            storage.
          </p>
          <div className="fx-card mt-8 overflow-x-auto p-6 sm:p-8">
            <FormLifecycleDiagram />
          </div>
        </FadeIn>

        <FadeIn className="mt-12">
          <section className="fx-card overflow-hidden p-0">
            <div className="border-b border-white/[0.06] px-6 py-5 sm:px-8">
              <h2 className="font-display text-xl font-semibold text-white">On-chain transactions</h2>
              <p className="mt-1 text-sm text-slate-400">
                Typical respondent journey (exact names match the EncryptedForm ABI).
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="fx-table">
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>Function</th>
                    <th>Actor</th>
                    <th>What happens</th>
                  </tr>
                </thead>
                <tbody>
                  {txSteps.map((row) => (
                    <tr key={row.step}>
                      <td className="font-mono text-violet-300">{row.step}</td>
                      <td className="font-mono text-cyan-300/90">{row.name}</td>
                      <td>{row.who}</td>
                      <td>{row.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </FadeIn>

        <FadeIn delay={1} className="mt-12">
          <h2 className="fx-section-title">Privacy model (illustrative)</h2>
          <p className="mt-2 text-sm text-slate-400">
            FormiX reduces where answer plaintext must exist compared to a typical centralized
            form host. This chart is educational — not a certified comparison.
          </p>
          <div className="fx-card mt-6 p-8">
            <PlaintextExposureChart />
          </div>
        </FadeIn>

        <FadeIn delay={2} className="mt-12 grid gap-8 lg:grid-cols-2">
          <section className="fx-card overflow-hidden p-0">
            <div className="border-b border-white/[0.06] px-6 py-5">
              <h2 className="font-display text-lg font-semibold text-white">Question types</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="fx-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>FHE</th>
                    <th>Storage</th>
                  </tr>
                </thead>
                <tbody>
                  {questionTypes.map((q) => (
                    <tr key={q.type}>
                      <td className="text-slate-200">{q.type}</td>
                      <td>{q.fhe}</td>
                      <td className="text-xs">{q.storage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="fx-card overflow-hidden p-0">
            <div className="border-b border-white/[0.06] px-6 py-5">
              <h2 className="font-display text-lg font-semibold text-white">Technology stack</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="fx-table">
                <thead>
                  <tr>
                    <th>Layer</th>
                    <th>Technology</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {stackRows.map((r) => (
                    <tr key={r.layer}>
                      <td className="font-medium text-violet-200">{r.layer}</td>
                      <td className="text-slate-300">{r.tech}</td>
                      <td className="text-xs">{r.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </FadeIn>

        <FadeIn delay={3} className="mt-12">
          <h2 className="fx-section-title">Development status</h2>
          <p className="mt-2 text-slate-400">
            Please treat everything below as current for this preview — we will update this page
            as the product matures.
          </p>
          <div className="fx-card mt-6 overflow-hidden p-0">
            <table className="fx-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {devStatus.map((d) => (
                  <tr key={d.area}>
                    <td className="font-medium text-slate-200">{d.area}</td>
                    <td>
                      <span className="inline-flex rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-200">
                        {d.status}
                      </span>
                    </td>
                    <td>{d.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>

        <FadeIn className="mt-12">
          <section className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-ink-900 to-violet-950/50 p-8 text-center sm:p-10">
            <h2 className="font-display text-2xl font-bold text-white">Try the preview</h2>
            <p className="mx-auto mt-3 max-w-md text-slate-400">
              Connect a Base Sepolia wallet, deploy a test form, and share the contract address
              with respondents.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/create" className="fx-btn-primary">
                Create a form
              </Link>
              <Link href="/" className="fx-btn-secondary">
                Back to home
              </Link>
            </div>
          </section>
        </FadeIn>
      </div>
    </PageShell>
  );
}
