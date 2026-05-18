"use client";

import { useCallback, useState } from "react";
import { usePublicClient, useReadContract } from "wagmi";
import { useFhenix } from "@/hooks/useFhenix";
import { encryptedFormAbi } from "@/lib/abis";
import { decryptTextAnswersForForm, type DecryptedRespondentAnswer } from "@/lib/fheTextAnswers";
import type { FormSchema } from "@/lib/schema";

type Props = {
  formAddress: `0x${string}`;
  schema: FormSchema;
  isCreator: boolean;
};

export function FheTextAnswersPanel({ formAddress, schema, isCreator }: Props) {
  const publicClient = usePublicClient();
  const { isReady, decryptUint32, ensureCofheNetwork } = useFhenix();
  const [rows, setRows] = useState<DecryptedRespondentAnswer[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasText = schema.questions.some(
    (q) => q.type === "shortText" || q.type === "longText" || q.type === "photo",
  );

  const { data: respondentCount } = useReadContract({
    address: formAddress,
    abi: encryptedFormAbi,
    functionName: "respondentCount",
  });

  const decrypt = useCallback(async () => {
    if (!isCreator || !publicClient || !isReady) return;
    setLoading(true);
    setError(null);
    try {
      await ensureCofheNetwork();
      const decoded = await decryptTextAnswersForForm({
        schema,
        formAddress,
        publicClient,
        decryptUint32,
      });
      setRows(decoded);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not decrypt text answers");
    } finally {
      setLoading(false);
    }
  }, [decryptUint32, ensureCofheNetwork, formAddress, isCreator, isReady, publicClient, schema]);

  if (!hasText) return null;

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <h2 className="font-display text-lg font-semibold">Text & photo (FHE)</h2>
      <p className="mt-1 text-sm text-slate-400">
        Individual answers stay encrypted on-chain. Only the creator can decrypt.
      </p>

      {isCreator ? (
        <>
          <button
            type="button"
            disabled={loading || !isReady}
            onClick={() => void decrypt()}
            className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Decrypting…" : "Decrypt text answers"}
          </button>
          {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
          {rows && (
            <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">
              {rows.length === 0 && (
                <p className="text-sm text-slate-500">No text answers yet.</p>
              )}
              {rows.map((r) => (
                <div key={r.respondent} className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs">
                  <p className="font-mono text-slate-500">{r.respondent}</p>
                  {r.answers.map((a) => (
                    <div key={a.questionId} className="mt-2 text-slate-300">
                      <span className="text-violet-400">{a.title}: </span>
                      {a.text.startsWith("/api/uploads") || a.text.startsWith("http") ? (
                        <a href={a.text} target="_blank" rel="noreferrer" className="text-violet-300 underline">
                          {a.text}
                        </a>
                      ) : (
                        <span>{a.text}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="mt-4 text-sm text-amber-300/90">
          {Number(respondentCount ?? 0)} submissions — content visible only to the creator.
        </p>
      )}
    </section>
  );
}
