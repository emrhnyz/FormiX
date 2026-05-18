"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Encryptable,
  FheTypes,
  type CofheClient,
  type EncryptedItemInput,
} from "@cofhe/sdk";
import { createCofheClient, createCofheConfig } from "@cofhe/sdk/web";
import { chains } from "@cofhe/sdk/chains";
import { useAccount, useChainId, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { defaultCofheChain, type SupportedCofheChain } from "@/lib/chains";

export type UseFhenixReturn = {
  isReady: boolean;
  isInitializing: boolean;
  isOnCofheNetwork: boolean;
  error: string | null;
  client: CofheClient | null;
  /** Tek seferde birden fazla uint32 — CoFHE tek ZK proof üretir (tercih edilen). */
  encryptUint32Batch: (values: number[]) => Promise<EncryptedItemInput[]>;
  encryptUint32: (value: number) => Promise<EncryptedItemInput>;
  decryptUint32: (ctHash: bigint) => Promise<bigint>;
  ensureCofheNetwork: () => Promise<void>;
  targetChain: SupportedCofheChain;
};

function chainToCofheKey(chainId: number): keyof typeof chains | null {
  if (chainId === 84532) return "baseSepolia";
  if (chainId === 11155111) return "sepolia";
  if (chainId === 421614) return "arbSepolia";
  return null;
}

function toEncryptableUint32(value: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 0xffffffff) {
    throw new Error(`FHE için geçersiz sayı: ${value}`);
  }
  return Encryptable.uint32(BigInt(n >>> 0));
}

export function useFhenix(): UseFhenixReturn {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const targetChain = defaultCofheChain;
  const cofheChainKey = chainToCofheKey(targetChain.id);
  const supportedChain = cofheChainKey ? chains[cofheChainKey] : chains.baseSepolia;

  const [client, setClient] = useState<CofheClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const encryptQueueRef = useRef(Promise.resolve());
  const configRef = useRef(
    createCofheConfig({
      supportedChains: [supportedChain],
    }),
  );

  const isOnCofheNetwork = chainId === targetChain.id;

  const ensureCofheNetwork = useCallback(async () => {
    if (chainId === targetChain.id) return;
    await switchChainAsync({ chainId: targetChain.id });
  }, [chainId, switchChainAsync, targetChain.id]);

  useEffect(() => {
    if (!isConnected || !publicClient || !walletClient) {
      setClient(null);
      return;
    }

    let cancelled = false;

    const connect = async () => {
      setIsInitializing(true);
      setError(null);
      try {
        const cofheClient = createCofheClient(configRef.current);
        await cofheClient.connect(
          publicClient as Parameters<CofheClient["connect"]>[0],
          walletClient as Parameters<CofheClient["connect"]>[1],
        );
        if (!cancelled) setClient(cofheClient);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "CoFHE client bağlanamadı");
          setClient(null);
        }
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };

    void connect();
    return () => {
      cancelled = true;
    };
  }, [isConnected, publicClient, walletClient, supportedChain]);

  const runExclusive = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    const next = encryptQueueRef.current.then(fn, fn);
    encryptQueueRef.current = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }, []);

  const encryptUint32Batch = useCallback(
    async (values: number[]): Promise<EncryptedItemInput[]> => {
      if (!client) {
        throw new Error("CoFHE client hazır değil. Önce cüzdanı bağlayın.");
      }
      if (values.length === 0) return [];

      const MAX_PER_PROOF = 4;
      const results: EncryptedItemInput[] = [];

      for (let offset = 0; offset < values.length; offset += MAX_PER_PROOF) {
        const slice = values.slice(offset, offset + MAX_PER_PROOF);
        const part = await runExclusive(async () => {
          const items = slice.map((v) => toEncryptableUint32(v));
          return client.encryptInputs(items).execute();
        });
        results.push(...part);
      }

      return results;
    },
    [client, runExclusive],
  );

  const encryptUint32 = useCallback(
    async (value: number): Promise<EncryptedItemInput> => {
      const [encrypted] = await encryptUint32Batch([value]);
      return encrypted;
    },
    [encryptUint32Batch],
  );

  const decryptUint32 = useCallback(
    async (ctHash: bigint): Promise<bigint> => {
      if (!client) {
        throw new Error("CoFHE client hazır değil. Önce cüzdanı bağlayın.");
      }
      await client.permits.getOrCreateSelfPermit();
      const value = await client.decryptForView(ctHash, FheTypes.Uint32).execute();
      return value as bigint;
    },
    [client],
  );

  const isReady = useMemo(() => Boolean(client) && isConnected, [client, isConnected]);

  return {
    isReady,
    isInitializing,
    isOnCofheNetwork,
    error,
    client,
    encryptUint32Batch,
    encryptUint32,
    decryptUint32,
    ensureCofheNetwork,
    targetChain,
  };
}
