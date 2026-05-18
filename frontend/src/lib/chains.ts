import { arbitrumSepolia, baseSepolia, sepolia } from "viem/chains";

export type SupportedCofheChain = typeof baseSepolia | typeof sepolia | typeof arbitrumSepolia;

const chainMap = {
  baseSepolia,
  sepolia,
  arbitrumSepolia,
} as const;

export type ChainEnvKey = "baseSepolia" | "sepolia" | "arbSepolia";

export function getCofheChain(): SupportedCofheChain {
  const raw = process.env.NEXT_PUBLIC_CHAIN ?? "baseSepolia";
  const key = raw === "arbitrumSepolia" ? "arbSepolia" : raw;
  if (key in chainMap) {
    return chainMap[key as keyof typeof chainMap];
  }
  return baseSepolia;
}

export const defaultCofheChain = getCofheChain();
