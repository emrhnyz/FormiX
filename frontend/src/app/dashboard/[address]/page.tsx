"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatEther, isAddress } from "viem";
import { PageShell } from "@/components/layout/PageShell";
import { FheResultsPanel } from "@/components/dashboard/FheResultsPanel";
import { FheTextAnswersPanel } from "@/components/dashboard/FheTextAnswersPanel";
import { encryptedFormAbi } from "@/lib/abis";
import { fetchFormSchema } from "@/lib/formApi";
import { defaultCofheChain } from "@/lib/chains";
import type { FormSchema } from "@/lib/schema";
import { getFheQuestions, isTallyQuestion } from "@/lib/schema";

export default function FormAnalyticsPage() {
  const params = useParams();
  const raw = params.address as string;
  const formAddress = isAddress(raw) ? (raw as `0x${string}`) : null;

  const { address, isConnected } = useAccount();
  const [schema, setSchema] = useState<FormSchema | null>(null);

  const { data: creator } = useReadContract({
    address: formAddress ?? undefined,
    abi: encryptedFormAbi,
    functionName: "creator",
    chainId: defaultCofheChain.id,
    query: { enabled: Boolean(formAddress) },
  });

  const { data: total } = useReadContract({
    address: formAddress ?? undefined,
    abi: encryptedFormAbi,
    functionName: "totalSubmissions",
    chainId: defaultCofheChain.id,
    query: { enabled: Boolean(formAddress) },
  });

  const { data: rewardsPaid } = useReadContract({
    address: formAddress ?? undefined,
    abi: encryptedFormAbi,
    functionName: "rewardsPaidCount",
    chainId: defaultCofheChain.id,
    query: { enabled: Boolean(formAddress) },
  });

  const { data: bounty } = useReadContract({
    address: formAddress ?? undefined,
    abi: encryptedFormAbi,
    functionName: "getBountyBalance",
    chainId: defaultCofheChain.id,
    query: { enabled: Boolean(formAddress) },
  });

  useEffect(() => {
    if (!formAddress) return;
    void fetchFormSchema(formAddress).then(setSchema);
  }, [formAddress]);

  const isCreator = useMemo(() => {
    if (!address || !creator) return false;
    return address.toLowerCase() === (creator as string).toLowerCase();
  }, [address, creator]);

  const tallyCount = schema
    ? schema.questions.filter((q) => isTallyQuestion(q.type)).length
    : 0;

  if (!formAddress) {
    return (
      <PageShell>
        <p className="p-10 text-rose-400">Invalid address</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/dashboard" className="text-sm text-violet-400 hover:text-violet-300">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold">{schema?.title ?? "Analytics"}</h1>
        <p className="mt-1 text-slate-400">{schema?.description}</p>

        {!isConnected && (
          <div className="mt-8 rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm text-amber-200">
            Connect the <strong>wallet that created this form</strong> to view responses.
          </div>
        )}

        {isConnected && !isCreator && (
          <div className="mt-8 rounded-xl border border-rose-500/40 bg-rose-500/10 p-5 text-sm text-rose-200">
            This panel is creator-only. Your connected wallet is not the form owner.
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total submissions" value={total?.toString() ?? "0"} />
          <Stat label="FHE questions" value={String(schema ? getFheQuestions(schema).length : 0)} />
          <Stat label="Poll / choice" value={String(tallyCount)} />
          <Stat label="Bounty left" value={bounty != null ? `${formatEther(bounty)} ETH` : "—"} />
        </div>

        {isCreator && schema && (
          <>
            {tallyCount > 0 && (
              <section className="fx-card mt-10 p-6">
                <h2 className="font-display text-lg font-semibold">Poll & choice results (FHE)</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Distributions decrypt only with your creator wallet.
                </p>
                <div className="mt-4">
                  <FheResultsPanel formAddress={formAddress} schema={schema} />
                </div>
              </section>
            )}
            <FheTextAnswersPanel formAddress={formAddress} schema={schema} isCreator />
          </>
        )}

        {isConnected && !isCreator && (
          <p className="mt-10 text-sm text-slate-500">
            Rewards paid: {rewardsPaid?.toString() ?? "0"} — detailed answers remain private.
          </p>
        )}

        <div className="mt-8 flex gap-3">
          <Link href={`/fill?form=${formAddress}`} className="fx-btn-primary text-sm">
            Open fill link
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="fx-card p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
