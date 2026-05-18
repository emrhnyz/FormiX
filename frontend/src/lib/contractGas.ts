import type { EstimateContractGasParameters, PublicClient } from "viem";

/** Base Sepolia per-tx gas cap (see Base docs). */
export const MAX_TX_GAS = 24_000_000n;

export async function estimateContractGasWithBuffer(
  publicClient: PublicClient,
  params: EstimateContractGasParameters,
  options?: { maxGas?: bigint; bufferPercent?: bigint },
): Promise<bigint> {
  const maxGas = options?.maxGas ?? MAX_TX_GAS;
  const bufferPercent = options?.bufferPercent ?? 25n;

  let gas = await publicClient.estimateContractGas(params);
  gas = gas + (gas * bufferPercent) / 100n + 150_000n;
  if (gas > maxGas) gas = maxGas;
  return gas;
}
