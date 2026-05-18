"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrumSepolia, baseSepolia, sepolia } from "viem/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo";

export const wagmiConfig = getDefaultConfig({
  appName: "FormiX",
  projectId,
  chains: [baseSepolia, sepolia, arbitrumSepolia],
  ssr: true,
});
