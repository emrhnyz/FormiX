"use client";

import { useCallback, useMemo, useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import type { Hex } from "viem";
import { useFhenix } from "@/hooks/useFhenix";
import { encryptedFormAbi } from "@/lib/abis";
import { uploadPhoto } from "@/lib/formApi";
import {
  getFheQuestions,
  isChoiceQuestion,
  type FormAnswer,
  type FormSchema,
} from "@/lib/schema";
import { estimateContractGasWithBuffer } from "@/lib/contractGas";
import { buildEncryptedValuesForQuestion, writeAllFheQuestions } from "@/lib/fheSubmit";

type Props = {
  formAddress: `0x${string}`;
  schema: FormSchema;
};

export function DynamicFormFill({ formAddress, schema }: Props) {
  const { address, isConnected } = useAccount();
  const { isReady, encryptUint32Batch, ensureCofheNetwork, targetChain } = useFhenix();
  const [answers, setAnswers] = useState<Record<string, FormAnswer>>({});
  const [multiChoices, setMultiChoices] = useState<Record<string, number[]>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const publicClient = usePublicClient({ chainId: targetChain.id });
  const { writeContractAsync, data: txHash } = useWriteContract();
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash: txHash });

  const { data: onChainSettings } = useReadContract({
    address: formAddress,
    abi: encryptedFormAbi,
    functionName: "settings",
    chainId: targetChain.id,
  });

  const { data: hasSubmittedOnChain } = useReadContract({
    address: formAddress,
    abi: encryptedFormAbi,
    functionName: "hasSubmitted",
    args: address ? [address] : undefined,
    chainId: targetChain.id,
    query: { enabled: Boolean(address) },
  });

  const { data: fheAnswersRecordedOnChain } = useReadContract({
    address: formAddress,
    abi: encryptedFormAbi,
    functionName: "fheAnswersRecorded",
    args: address ? [address] : undefined,
    chainId: targetChain.id,
    query: { enabled: Boolean(address) },
  });

  const fheComplete = Boolean(fheAnswersRecordedOnChain);
  const alreadySubmitted = Boolean(hasSubmittedOnChain);
  const finalizeOnly = fheComplete && !alreadySubmitted;

  const rewardEnabled =
    onChainSettings ? onChainSettings[4] : schema.reward.enabled;
  const showLiveResults =
    schema.kind === "poll" && (schema.showLiveResults || false);

  const fheQuestions = useMemo(() => getFheQuestions(schema), [schema]);

  const setTextAnswer = (qid: string, type: "shortText" | "longText", text: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: { questionId: qid, type, text } }));
  };

  const setChoiceAnswer = (qid: string, type: "poll" | "singleChoice", choiceIndex: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: { questionId: qid, type, choiceIndex } }));
  };

  const toggleMulti = (qid: string, index: number) => {
    setMultiChoices((prev) => {
      const cur = prev[qid] ?? [];
      const next = cur.includes(index) ? cur.filter((i) => i !== index) : [...cur, index];
      return { ...prev, [qid]: next };
    });
  };

  const validate = useCallback(() => {
    for (const q of schema.questions) {
      if (!q.required) continue;
      if (q.type === "multipleChoice") {
        if (!(multiChoices[q.id]?.length ?? 0)) return `"${q.title || "Question"}" is required`;
        continue;
      }
      if (q.type === "photo") {
        if (!answers[q.id]?.photoUrl) return `Photo required for "${q.title || "Question"}"`;
        continue;
      }
      if (isChoiceQuestion(q.type)) {
        if (answers[q.id]?.choiceIndex === undefined) return `"${q.title || "Question"}" is required`;
        continue;
      }
      if (q.type === "shortText" || q.type === "longText") {
        if (!answers[q.id]?.text?.trim()) return `"${q.title || "Question"}" is required`;
        continue;
      }
    }
    return null;
  }, [answers, multiChoices, schema.questions]);

  const handleSubmit = async () => {
    if (submitting || confirming) return;
    setError(null);
    setStatus(null);

    if (alreadySubmitted) {
      setDone(true);
      return;
    }

    if (!finalizeOnly) {
      const validationError = validate();
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (!isConnected || !address) {
      setError("Connect your wallet.");
      return;
    }

    setSubmitting(true);
    try {
      await ensureCofheNetwork();
      if (!finalizeOnly) {
        if (!isReady) throw new Error("FHE client not ready.");
      }
      if (!publicClient) throw new Error("RPC not ready.");

      if (!finalizeOnly) {
        await writeAllFheQuestions({
        publicClient,
        writeContract: (args) =>
          writeContractAsync(args as Parameters<typeof writeContractAsync>[0]),
        formAddress,
        account: address,
        chainId: targetChain.id,
        schema,
        questions: fheQuestions,
        onQuestionStart: (qi, total) => {
          setStatus(`Encrypting & submitting: question ${qi + 1}/${total}…`);
        },
        buildValues: async (q, qi, onChain) =>
          buildEncryptedValuesForQuestion(
            q,
            qi,
            onChain,
            {
              choiceIndex: answers[q.id]?.choiceIndex,
              multiIndices: multiChoices[q.id],
              text: answers[q.id]?.text,
              photoUrl: answers[q.id]?.photoUrl,
            },
            encryptUint32Batch,
          ),
        });
      } else {
        setStatus("Encrypted answers already on-chain; finalizing…");
      }

      setStatus("Finalizing…");
      const finalizeGas = publicClient
        ? await estimateContractGasWithBuffer(publicClient, {
            address: formAddress,
            abi: encryptedFormAbi,
            functionName: "finalizeSubmission",
            account: address,
          })
        : undefined;

      const finalHash = await writeContractAsync({
        address: formAddress,
        abi: encryptedFormAbi,
        functionName: "finalizeSubmission",
        chainId: targetChain.id,
        gas: finalizeGas,
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: finalHash });
      }

      setDone(true);
      setStatus(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
      setStatus(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {rewardEnabled && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-fuchsia-500/10 px-5 py-4">
          <span className="text-2xl">🎁</span>
          <div>
            <p className="font-semibold text-amber-200">Rewarded form</p>
            <p className="text-sm text-slate-300">
              You may receive{" "}
              <strong>{schema.reward.amountEth} ETH</strong> after a successful submission (while
              quota lasts).
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-bold text-white">{schema.title}</h1>
        {schema.description && <p className="mt-2 text-slate-400">{schema.description}</p>}
        <p className="mt-2 text-xs text-violet-300">
          Every answer is FHE-encrypted on-chain. Only the creator can decrypt.
        </p>
      </div>

      {schema.questions.map((q, i) => (
        <div
          key={q.id}
          className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5"
        >
          <p className="text-sm font-medium text-violet-300">
            Question {i + 1}
            {q.required && <span className="text-rose-400"> *</span>}
          </p>
          <h3 className="mt-1 text-lg text-white">{q.title || "Untitled question"}</h3>
          {q.description && <p className="mt-1 text-sm text-slate-400">{q.description}</p>}

          {q.type === "longText" && (
              <textarea
                placeholder={q.placeholder || "Your answer…"}
                className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
                rows={4}
                onChange={(e) => setTextAnswer(q.id, "longText", e.target.value)}
              />
            )}
          {q.type === "shortText" && (
              <input
                placeholder={q.placeholder || "Your answer…"}
                className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
                onChange={(e) => setTextAnswer(q.id, "shortText", e.target.value)}
              />
            )}

          {(q.type === "poll" || q.type === "singleChoice") && (
            <div className="mt-4 space-y-2">
              {(q.options ?? []).map((opt, oi) => (
                <label
                  key={oi}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 px-4 py-3 hover:border-violet-500/50"
                >
                  <input
                    type="radio"
                    name={q.id}
                    className="accent-violet-500"
                    onChange={() =>
                      setChoiceAnswer(
                        q.id,
                        q.type === "poll" ? "poll" : "singleChoice",
                        oi,
                      )
                    }
                  />
                  <span className="text-sm text-slate-200">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "multipleChoice" && (
            <div className="mt-4 space-y-2">
              {(q.options ?? []).map((opt, oi) => (
                <label
                  key={oi}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    className="accent-violet-500"
                    checked={(multiChoices[q.id] ?? []).includes(oi)}
                    onChange={() => toggleMulti(q.id, oi)}
                  />
                  <span className="text-sm text-slate-200">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "photo" && (
            <div className="mt-4">
              <input
                type="file"
                accept="image/*"
                className="text-sm text-slate-400"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setStatus("Uploading photo…");
                  try {
                    const url = await uploadPhoto(file);
                    setAnswers((prev) => ({
                      ...prev,
                      [q.id]: { questionId: q.id, type: "photo", photoUrl: url },
                    }));
                    setStatus(null);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Upload failed");
                    setStatus(null);
                  }
                }}
              />
              {answers[q.id]?.photoUrl && (
                <p className="mt-2 text-xs text-emerald-400">✓ Photo uploaded</p>
              )}
            </div>
          )}
        </div>
      ))}

      {showLiveResults && (
        <p className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-xs text-violet-200">
          Live results are only visible in the creator dashboard.
        </p>
      )}

      {finalizeOnly && !done && (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          Your encrypted answers are on-chain. Complete submission with one final transaction.
        </p>
      )}

      {!done && !alreadySubmitted ? (
        <button
          type="button"
          disabled={confirming || submitting}
          onClick={() => void handleSubmit()}
          className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {confirming || submitting
            ? "Waiting for confirmation…"
            : finalizeOnly
              ? "Complete submission"
              : "Submit (encrypted)"}
        </button>
      ) : done || alreadySubmitted ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center text-emerald-300">
          Thank you! Your response is recorded.
          {rewardEnabled && " Reward sent to your wallet if eligible."}
        </div>
      ) : null}

      {status && <p className="text-sm text-violet-200">{status}</p>}
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
