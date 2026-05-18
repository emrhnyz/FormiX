import { decodeEventLog, parseEventLogs, type Hex, type TransactionReceipt } from "viem";
import { formFactoryAbi } from "./abis";

export function extractFormAddressFromReceipt(
  receipt: TransactionReceipt,
  factoryAddress: `0x${string}`,
): `0x${string}` | null {
  const factoryLogs = receipt.logs.filter(
    (log) => log.address.toLowerCase() === factoryAddress.toLowerCase(),
  );

  try {
    const parsed = parseEventLogs({
      abi: formFactoryAbi,
      logs: factoryLogs,
      eventName: "FormCreated",
    });
    if (parsed[0]?.args.form) {
      return parsed[0].args.form as `0x${string}`;
    }
  } catch {
    // fallback below
  }

  for (const log of factoryLogs) {
    try {
      const decoded = decodeEventLog({
        abi: formFactoryAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "FormCreated" && decoded.args.form) {
        return decoded.args.form as `0x${string}`;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function basescanAddressUrl(chainId: number, address: string): string {
  if (chainId === 84532) return `https://sepolia.basescan.org/address/${address}`;
  if (chainId === 11155111) return `https://sepolia.etherscan.io/address/${address}`;
  if (chainId === 421614) return `https://sepolia.arbiscan.io/address/${address}`;
  return `https://sepolia.basescan.org/address/${address}`;
}

export function basescanTxUrl(chainId: number, hash: Hex): string {
  if (chainId === 84532) return `https://sepolia.basescan.org/tx/${hash}`;
  if (chainId === 11155111) return `https://sepolia.etherscan.io/tx/${hash}`;
  if (chainId === 421614) return `https://sepolia.arbiscan.io/tx/${hash}`;
  return `https://sepolia.basescan.org/tx/${hash}`;
}
