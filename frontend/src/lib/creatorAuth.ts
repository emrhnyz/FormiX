import { createPublicClient, http, recoverMessageAddress, type Hex } from "viem";
import { encryptedFormAbi } from "./abis";
import { getCofheChain } from "./chains";

const ACCESS_TTL_MS = 5 * 60 * 1000;

export function buildCreatorAccessMessage(formAddress: string, timestamp: number): string {
  return `FormiX creator access\nForm: ${formAddress.toLowerCase()}\nTimestamp: ${timestamp}`;
}

export type CreatorAuthHeaders = {
  address: `0x${string}`;
  signature: Hex;
  timestamp: string;
};

export function parseCreatorAuthHeaders(request: Request): CreatorAuthHeaders | null {
  const address = request.headers.get("x-forminyo-address");
  const signature = request.headers.get("x-forminyo-signature");
  const timestamp = request.headers.get("x-forminyo-timestamp");
  if (!address || !signature || !timestamp) return null;
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return null;
  if (!/^0x[a-fA-F0-9]+$/.test(signature)) return null;
  return {
    address: address as `0x${string}`,
    signature: signature as Hex,
    timestamp,
  };
}

export async function verifyCreatorAccess(
  formAddress: `0x${string}`,
  auth: CreatorAuthHeaders,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const ts = Number(auth.timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > ACCESS_TTL_MS) {
    return { ok: false, error: "Signature expired", status: 401 };
  }

  const message = buildCreatorAccessMessage(formAddress, ts);
  let recovered: `0x${string}`;
  try {
    recovered = await recoverMessageAddress({ message, signature: auth.signature });
  } catch {
    return { ok: false, error: "Invalid signature", status: 401 };
  }

  if (recovered.toLowerCase() !== auth.address.toLowerCase()) {
    return { ok: false, error: "Signature address mismatch", status: 401 };
  }

  const chain = getCofheChain();
  const publicClient = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0]),
  });

  const creator = await publicClient.readContract({
    address: formAddress,
    abi: encryptedFormAbi,
    functionName: "creator",
  });

  if ((creator as string).toLowerCase() !== auth.address.toLowerCase()) {
    return { ok: false, error: "You are not the creator of this form", status: 403 };
  }

  return { ok: true };
}
