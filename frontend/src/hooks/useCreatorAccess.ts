"use client";

import { useCallback, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import type { Hex } from "viem";
import { buildCreatorAccessMessage } from "@/lib/creatorAuth";

export function useCreatorAccess(formAddress: `0x${string}` | null) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [headers, setHeaders] = useState<{
    address: `0x${string}`;
    signature: Hex;
    timestamp: string;
  } | null>(null);

  const signAccess = useCallback(async () => {
    if (!formAddress || !address) throw new Error("Wallet required");
    const timestamp = Date.now();
    const message = buildCreatorAccessMessage(formAddress, timestamp);
    const signature = await signMessageAsync({ message });
    const next = {
      address,
      signature: signature as Hex,
      timestamp: String(timestamp),
    };
    setHeaders(next);
    return next;
  }, [address, formAddress, signMessageAsync]);

  const authFetch = useCallback(
    async (input: string, init?: RequestInit) => {
      let h = headers;
      if (!h) h = await signAccess();
      return fetch(input, {
        ...init,
        headers: {
          ...init?.headers,
          "x-forminyo-address": h.address,
          "x-forminyo-signature": h.signature,
          "x-forminyo-timestamp": h.timestamp,
        },
      });
    },
    [headers, signAccess],
  );

  return {
    isConnected,
    address,
    headers,
    signAccess,
    authFetch,
  };
}
