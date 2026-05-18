import type { PublicClient } from "viem";
import { encryptedFormAbi } from "./abis";

export function isQuestionAnsweredInMask(mask: bigint, questionIndex: number): boolean {
  return (mask & (1n << BigInt(questionIndex))) !== 0n;
}

export function isAlreadyAnsweredError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("Question already answered");
}

export async function readFheAnswerProgress(
  publicClient: PublicClient,
  formAddress: `0x${string}`,
  account: `0x${string}`,
): Promise<bigint | null> {
  try {
    return (await publicClient.readContract({
      address: formAddress,
      abi: encryptedFormAbi,
      functionName: "fheAnswerProgress",
      args: [account],
    })) as bigint;
  } catch {
    return null;
  }
}

export async function readFheAnswersRecorded(
  publicClient: PublicClient,
  formAddress: `0x${string}`,
  account: `0x${string}`,
): Promise<boolean> {
  return publicClient.readContract({
    address: formAddress,
    abi: encryptedFormAbi,
    functionName: "fheAnswersRecorded",
    args: [account],
  });
}
