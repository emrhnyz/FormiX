"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount, usePublicClient, useSignMessage, useWriteContract } from "wagmi";
import { parseEther, type Hex } from "viem";
import { PageShell } from "@/components/layout/PageShell";
import { FormBuilder } from "@/components/builder/FormBuilder";
import { formFactoryAbi } from "@/lib/abis";
import { useFhenix } from "@/hooks/useFhenix";
import {
  extractFormAddressFromReceipt,
  basescanAddressUrl,
  basescanTxUrl,
} from "@/lib/extractFormAddress";
import { saveFormSchema } from "@/lib/formApi";
import { buildFillUrl, cacheSchemaLocally } from "@/lib/schemaShare";
import { buildCreatorAccessMessage } from "@/lib/creatorAuth";
import {
  getSlotCounts,
  getQuestionKinds,
  getFheQuestions,
  schemaHash,
  type FormSchema,
} from "@/lib/schema";

const FACTORY = (process.env.NEXT_PUBLIC_FORM_FACTORY_ADDRESS ?? "") as `0x${string}`;

const defaultSchema = (): FormSchema => ({
  version: 1,
  title: "My new form",
  description: "",
  kind: "form",
  showLiveResults: false,
  reward: {
    enabled: false,
    amountEth: "0.001",
    maxRecipients: 100,
    initialBountyEth: "0.01",
  },
  questions: [],
  createdAt: new Date().toISOString(),
});

export default function CreatePage() {
  const { address, isConnected } = useAccount();
  const { ensureCofheNetwork, targetChain } = useFhenix();
  const publicClient = usePublicClient({ chainId: targetChain.id });
  const [schema, setSchema] = useState<FormSchema>(defaultSchema);
  const [step, setStep] = useState<"build" | "done">("build");
  const [deployed, setDeployed] = useState<`0x${string}` | null>(null);
  const [fillShareUrl, setFillShareUrl] = useState<string | null>(null);
  const [schemaWarning, setSchemaWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<Hex | null>(null);
  const [loading, setLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const { signMessageAsync } = useSignMessage();

  const deploy = async () => {
    setError(null);
    setSchemaWarning(null);
    setFillShareUrl(null);
    setLastTx(null);
    if (!isConnected || !address) {
      setError("Connect your wallet first.");
      return;
    }
    if (!FACTORY) {
      setError("Set NEXT_PUBLIC_FORM_FACTORY_ADDRESS in frontend/.env");
      return;
    }
    if (!schema.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (schema.questions.length === 0) {
      setError("Add at least one question.");
      return;
    }
    if (!publicClient) {
      setError("RPC not ready.");
      return;
    }

    const fheQs = getFheQuestions(schema);
    if (fheQs.length > 4) {
      setError("Use at most 4 questions per form (gas limits; all types use FHE).");
      return;
    }

    setLoading(true);
    try {
      await ensureCofheNetwork();

      const hash = schemaHash(schema);
      const slotCounts = getSlotCounts(schema);
      const questionKinds = getQuestionKinds(schema);
      const bounty = schema.reward.enabled ? parseEther(schema.reward.initialBountyEth || "0") : 0n;

      const settingsArg = {
        title: schema.title.slice(0, 64),
        description: "",
        kind: schema.kind === "poll" ? 1 : 0,
        showLiveResults: schema.showLiveResults,
        rewardEnabled: schema.reward.enabled,
        rewardPerSubmission: schema.reward.enabled
          ? parseEther(schema.reward.amountEth || "0")
          : 0n,
        maxRewardRecipients: BigInt(schema.reward.maxRecipients || 0),
        schemaHash: hash,
        fheQuestionCount: slotCounts.length,
      } as const;

      const simulation = await publicClient.simulateContract({
        address: FACTORY,
        abi: formFactoryAbi,
        functionName: "createForm",
        args: [settingsArg, slotCounts, questionKinds],
        value: bounty,
        account: address,
      });

      const predictedForm = simulation.result as `0x${string}`;

      let gasLimit = await publicClient.estimateContractGas({
        address: FACTORY,
        abi: formFactoryAbi,
        functionName: "createForm",
        args: [settingsArg, slotCounts, questionKinds],
        value: bounty,
        account: address,
      });
      const maxGas = 12_000_000n;
      gasLimit = gasLimit + gasLimit / 5n + 300_000n;
      if (gasLimit > maxGas) gasLimit = maxGas;

      const txHash = await writeContractAsync({
        ...simulation.request,
        gas: gasLimit,
        chainId: targetChain.id,
      });
      setLastTx(txHash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== "success") {
        throw new Error("Transaction reverted on-chain. Check Basescan for details.");
      }

      const fromEvent = extractFormAddressFromReceipt(receipt, FACTORY);
      const formAddr = fromEvent ?? predictedForm;

      if (!formAddr || formAddr === "0x0000000000000000000000000000000000000000") {
        throw new Error(
          "Could not read form address. Check Basescan logs for FormCreated.",
        );
      }

      const ts = Date.now();
      const signature = await signMessageAsync({
        message: buildCreatorAccessMessage(formAddr, ts),
      });
      const payload: FormSchema = {
        ...schema,
        creator: address,
        contractAddress: formAddr,
      };
      cacheSchemaLocally(formAddr, payload);
      setFillShareUrl(buildFillUrl(formAddr, payload));

      try {
        await saveFormSchema(formAddr, payload, {
          address,
          signature: signature as Hex,
          timestamp: String(ts),
        });
      } catch (saveErr) {
        const msg =
          saveErr instanceof Error ? saveErr.message : "Could not save schema to server";
        setSchemaWarning(
          `${msg} Your form is on-chain. Use the Fill link below (schema embedded) so respondents can still answer.`,
        );
      }

      setDeployed(formAddr);
      setStep("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Deploy failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-6 py-10">
        {step === "build" ? (
          <>
            <h1 className="font-display text-3xl font-bold text-white">Create a form</h1>
            <p className="mt-2 text-slate-400">
              Every question type is encrypted with FHE before it is stored on-chain. For your first
              deploy, we recommend starting with one or two questions.
            </p>
            <div className="mt-8">
              <FormBuilder value={schema} onChange={setSchema} />
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => void deploy()}
              className="fx-btn-primary mt-8 w-full py-4 disabled:opacity-50"
            >
              {loading ? "Publishing…" : "Publish on-chain"}
            </button>
            {error && (
              <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">
                <p>{error}</p>
                {lastTx && (
                  <a
                    href={basescanTxUrl(targetChain.id, lastTx)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-violet-400 underline"
                  >
                    View transaction on Basescan →
                  </a>
                )}
              </div>
            )}
          </>
        ) : (
          deployed && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-8 text-center">
              <h2 className="font-display text-2xl font-bold text-emerald-300">Live on-chain</h2>
              <p className="mt-4 break-all font-mono text-sm text-white">{deployed}</p>
              {schemaWarning && (
                <p className="mx-auto mt-4 max-w-lg rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-left text-sm text-amber-100">
                  {schemaWarning}
                </p>
              )}
              {fillShareUrl && (
                <p className="mx-auto mt-4 max-w-lg break-all text-left text-xs text-slate-400">
                  Share link:{" "}
                  <a href={fillShareUrl} className="text-cyan-300 underline">
                    {fillShareUrl}
                  </a>
                </p>
              )}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href={fillShareUrl ?? `/fill?form=${deployed}`} className="fx-btn-primary text-sm">
                  Fill link
                </Link>
                <Link
                  href={`/dashboard/${deployed}`}
                  className="fx-btn-secondary text-sm"
                >
                  Analytics
                </Link>
                <a
                  href={basescanAddressUrl(targetChain.id, deployed)}
                  target="_blank"
                  rel="noreferrer"
                  className="fx-btn-secondary text-sm"
                >
                  Basescan
                </a>
              </div>
            </div>
          )
        )}
      </div>
    </PageShell>
  );
}
