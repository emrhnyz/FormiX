"use client";

import { useCallback, useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { useFhenix } from "@/hooks/useFhenix";
import { TallyChart } from "@/components/dashboard/TallyChart";
import { encryptedFormAbi } from "@/lib/abis";
import {
  decryptFormTallies,
  grantCreatorTallyAccess,
  publishFormTalliesLive,
  type QuestionTally,
} from "@/lib/fheTallies";
import { getFheQuestions, type FormSchema } from "@/lib/schema";

type Props = {
  formAddress: `0x${string}`;
  schema: FormSchema;
};

export function FheResultsPanel({ formAddress, schema }: Props) {
  const { address, isConnected } = useAccount();
  const { data: creator } = useReadContract({
    address: formAddress,
    abi: encryptedFormAbi,
    functionName: "creator",
  });

  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const {
    isReady,
    isInitializing,
    decryptUint32,
    ensureCofheNetwork,
    targetChain,
    client,
  } = useFhenix();

  const [tallies, setTallies] = useState<QuestionTally[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const fheQuestions = getFheQuestions(schema);
  const isCreator =
    isConnected &&
    address &&
    creator &&
    address.toLowerCase() === (creator as string).toLowerCase();

  const decrypt = useCallback(async () => {
    setError(null);
    setStatus(null);
    if (!isCreator || !address) {
      setError("Only the form creator wallet can decrypt results.");
      return;
    }
    if (!publicClient) {
      setError("RPC connection unavailable.");
      return;
    }
    if (!isReady || !client) {
      setError("FHE client not ready. Connect your wallet and wait.");
      return;
    }

    setLoading(true);
    try {
      await ensureCofheNetwork();
      setStatus("Granting on-chain view access…");
      await grantCreatorTallyAccess({
        publicClient,
        formAddress,
        account: address,
        writeContract: (args) =>
          writeContractAsync(args as Parameters<typeof writeContractAsync>[0]),
        chainId: targetChain.id,
      });

      setStatus("Decrypting encrypted votes (CoFHE)…");
      const decoded = await decryptFormTallies({
        schema,
        formAddress,
        publicClient,
        decryptUint32,
      });
      setTallies(decoded);
      setStatus(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decryption failed");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [
    address,
    client,
    decryptUint32,
    ensureCofheNetwork,
    formAddress,
    isCreator,
    isReady,
    publicClient,
    schema,
    targetChain.id,
    writeContractAsync,
  ]);

  const publishLive = useCallback(async () => {
    if (!tallies?.length || !isCreator || !address || !publicClient || !client) return;
    setPublishing(true);
    setError(null);
    setStatus("Publishing live results on-chain…");
    try {
      await ensureCofheNetwork();
      await publishFormTalliesLive({
        schema,
        formAddress,
        publicClient,
        client,
        account: address,
        writeContract: (args) =>
          writeContractAsync(args as Parameters<typeof writeContractAsync>[0]),
        chainId: targetChain.id,
        tallies,
      });
      setStatus("Live results published — visible on the fill page.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
      setStatus(null);
    } finally {
      setPublishing(false);
    }
  }, [
    address,
    client,
    ensureCofheNetwork,
    formAddress,
    isCreator,
    publicClient,
    schema,
    tallies,
    targetChain.id,
    writeContractAsync,
  ]);

  if (fheQuestions.length === 0) {
    return (
      <p className="text-sm text-slate-500">No FHE tally questions on this form.</p>
    );
  }

  return (
    <div>
      {!isCreator && (
        <p className="text-sm text-amber-300/90">
          Connect the wallet that created this form to decrypt tallies.
        </p>
      )}

      {isCreator && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading || isInitializing || !isReady}
            onClick={() => void decrypt()}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Decrypting…" : "Decrypt FHE results"}
          </button>
          {schema.showLiveResults && tallies && (
            <button
              type="button"
              disabled={publishing}
              onClick={() => void publishLive()}
              className="rounded-xl border border-violet-500/50 px-4 py-2 text-sm text-violet-200 disabled:opacity-50"
            >
              {publishing ? "Publishing…" : "Publish live results"}
            </button>
          )}
        </div>
      )}

      {status && <p className="mt-3 text-sm text-violet-200">{status}</p>}
      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      {tallies && (
        <div className="mt-6 space-y-6">
          {tallies.map((t) => (
            <div key={t.questionId} className="rounded-xl border border-slate-700/50 p-4">
              <p className="font-medium text-white">{t.title}</p>
              <TallyChart tally={t} />
            </div>
          ))}
        </div>
      )}

      {!tallies && isCreator && (
        <p className="mt-4 text-sm text-slate-500">
          Not decrypted yet. The first click asks MetaMask to approve{" "}
          <code className="text-violet-300">allowCreatorToViewTallies</code>, then each option is
          decrypted via CoFHE.
        </p>
      )}
    </div>
  );
}
