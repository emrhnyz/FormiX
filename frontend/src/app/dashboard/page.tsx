"use client";

import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { PageShell } from "@/components/layout/PageShell";
import { formFactoryAbi } from "@/lib/abis";
import { fetchFormSchema } from "@/lib/formApi";
import { defaultCofheChain } from "@/lib/chains";
import { useEffect, useState } from "react";
import type { FormSchema } from "@/lib/schema";

const FACTORY = (process.env.NEXT_PUBLIC_FORM_FACTORY_ADDRESS ?? "") as `0x${string}`;

type FormCard = {
  address: `0x${string}`;
  schema: FormSchema | null;
};

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [cards, setCards] = useState<FormCard[]>([]);

  const { data: formAddresses } = useReadContract({
    address: FACTORY,
    abi: formFactoryAbi,
    functionName: "getCreatorForms",
    args: address ? [address] : undefined,
    chainId: defaultCofheChain.id,
    query: { enabled: Boolean(address && FACTORY) },
  });

  useEffect(() => {
    if (!formAddresses) return;
    void (async () => {
      const list = await Promise.all(
        (formAddresses as `0x${string}`[]).map(async (addr) => ({
          address: addr,
          schema: await fetchFormSchema(addr),
        })),
      );
      setCards(list.reverse());
    })();
  }, [formAddresses]);

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-slate-400">
          Forms you deployed — decrypt FHE tallies and text answers as the creator.
        </p>

        {!isConnected && (
          <p className="fx-card mt-8 p-6 text-slate-400">Connect your wallet to see your forms.</p>
        )}

        {isConnected && cards.length === 0 && (
          <p className="mt-8 text-slate-500">
            No forms yet.{" "}
            <Link href="/create" className="text-violet-400 hover:text-violet-300">
              Create your first form
            </Link>
            .
          </p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ address: addr, schema }) => (
            <Link
              key={addr}
              href={`/dashboard/${addr}`}
              className="fx-card group block p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">
                  {schema?.kind === "poll" ? "Poll" : "Form"}
                </span>
                {schema?.reward.enabled && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                    Rewards
                  </span>
                )}
              </div>
              <h2 className="mt-3 font-display font-semibold text-white group-hover:text-violet-200">
                {schema?.title ?? "Untitled form"}
              </h2>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{schema?.description}</p>
              <p className="mt-3 font-mono text-[10px] text-slate-600">{addr}</p>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
