import { getAddress, isAddress } from "viem";

const ADDRESS_REGEX = /0x[a-fA-F0-9]{40}/;

/** Accepts raw 0x…, EIP-55, or explorer URLs; returns checksummed address or null. */
export function parseFormAddress(input: string): `0x${string}` | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (isAddress(trimmed, { strict: false })) {
    try {
      return getAddress(trimmed);
    } catch {
      return null;
    }
  }

  const match = trimmed.match(ADDRESS_REGEX);
  if (!match) return null;

  try {
    return getAddress(match[0]);
  } catch {
    return null;
  }
}

export function isTxHash(input: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(input.trim());
}
