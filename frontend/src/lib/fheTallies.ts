import type { CofheClient } from "@cofhe/sdk";
import type { PublicClient } from "viem";
import { encryptedFormAbi } from "./abis";
import { estimateContractGasWithBuffer } from "./contractGas";
import { getFheQuestions, isTallyQuestion, type FormSchema } from "./schema";

export type QuestionTally = {
  questionId: string;
  title: string;
  options: string[];
  counts: bigint[];
};

const ALLOWED_KEY = (form: string) => `forminyo-tally-allowed-${form.toLowerCase()}`;

export function hasGrantedTallyAccess(formAddress: string): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(ALLOWED_KEY(formAddress)) === "1";
}

export function markTallyAccessGranted(formAddress: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ALLOWED_KEY(formAddress), "1");
}

export async function readEncryptedTallyHandle(
  publicClient: PublicClient,
  formAddress: `0x${string}`,
  questionIndex: number,
  optionIndex: number,
): Promise<bigint> {
  const handle = await publicClient.readContract({
    address: formAddress,
    abi: encryptedFormAbi,
    functionName: "getEncryptedTally",
    args: [questionIndex, optionIndex],
  });
  return handle as bigint;
}

export async function readPublishedTally(
  publicClient: PublicClient,
  formAddress: `0x${string}`,
  questionIndex: number,
  optionIndex: number,
): Promise<bigint | null> {
  try {
    const value = await publicClient.readContract({
      address: formAddress,
      abi: encryptedFormAbi,
      functionName: "getPublishedTally",
      args: [questionIndex, optionIndex],
    });
    return value as bigint;
  } catch {
    return null;
  }
}

export async function grantCreatorTallyAccess(params: {
  publicClient: PublicClient;
  formAddress: `0x${string}`;
  account: `0x${string}`;
  writeContract: (args: Record<string, unknown>) => Promise<`0x${string}`>;
  chainId: number;
}): Promise<void> {
  if (hasGrantedTallyAccess(params.formAddress)) return;

  const gas = await estimateContractGasWithBuffer(params.publicClient, {
    address: params.formAddress,
    abi: encryptedFormAbi,
    functionName: "allowCreatorToViewTallies",
    account: params.account,
  });

  const hash = await params.writeContract({
    address: params.formAddress,
    abi: encryptedFormAbi,
    functionName: "allowCreatorToViewTallies",
    gas,
    chainId: params.chainId,
  });

  await params.publicClient.waitForTransactionReceipt({ hash });
  markTallyAccessGranted(params.formAddress);
}

export async function decryptFormTallies(params: {
  schema: FormSchema;
  formAddress: `0x${string}`;
  publicClient: PublicClient;
  decryptUint32: (ctHash: bigint) => Promise<bigint>;
}): Promise<QuestionTally[]> {
  const fheQuestions = getFheQuestions(params.schema).filter((q) => isTallyQuestion(q.type));
  const results: QuestionTally[] = [];
  const allQuestions = params.schema.questions;

  for (let qi = 0; qi < allQuestions.length; qi++) {
    const q = allQuestions[qi];
    if (!isTallyQuestion(q.type)) continue;
    const options = q.options ?? [];
    const counts: bigint[] = [];

    for (let oi = 0; oi < options.length; oi++) {
      const ctHash = await readEncryptedTallyHandle(
        params.publicClient,
        params.formAddress,
        qi,
        oi,
      );
      if (ctHash === 0n) {
        counts.push(0n);
        continue;
      }
      counts.push(await params.decryptUint32(ctHash));
    }

    results.push({
      questionId: q.id,
      title: q.title || "Soru",
      options,
      counts,
    });
  }

  return results;
}

export async function readPublishedFormTallies(
  publicClient: PublicClient,
  formAddress: `0x${string}`,
  schema: FormSchema,
): Promise<QuestionTally[] | null> {
  const results: QuestionTally[] = [];
  let allPublished = true;
  let hasTally = false;

  for (let qi = 0; qi < schema.questions.length; qi++) {
    const q = schema.questions[qi];
    if (!isTallyQuestion(q.type)) continue;
    hasTally = true;
    const options = q.options ?? [];
    const counts: bigint[] = [];

    for (let oi = 0; oi < options.length; oi++) {
      const value = await readPublishedTally(publicClient, formAddress, qi, oi);
      if (value === null) {
        allPublished = false;
        counts.push(0n);
      } else {
        counts.push(value);
      }
    }

    results.push({
      questionId: q.id,
      title: q.title || "Soru",
      options,
      counts,
    });
  }

  if (!hasTally) return null;
  return allPublished ? results : null;
}

export async function publishFormTalliesLive(params: {
  schema: FormSchema;
  formAddress: `0x${string}`;
  publicClient: PublicClient;
  client: CofheClient;
  account: `0x${string}`;
  writeContract: (args: Record<string, unknown>) => Promise<`0x${string}`>;
  chainId: number;
  tallies: QuestionTally[];
}): Promise<void> {
  await params.client.permits.getOrCreateSelfPermit();
  for (let qi = 0; qi < params.schema.questions.length; qi++) {
    const q = params.schema.questions[qi];
    if (!isTallyQuestion(q.type)) continue;
    const options = q.options ?? [];
    const counts = params.tallies.find((t) => t.questionId === q.id)?.counts ?? [];

    for (let oi = 0; oi < options.length; oi++) {
      const ctHash = await readEncryptedTallyHandle(
        params.publicClient,
        params.formAddress,
        qi,
        oi,
      );
      if (ctHash === 0n) continue;

      const { decryptedValue, signature } = await params.client
        .decryptForTx(ctHash)
        .withPermit()
        .execute();

      const plain = Number(decryptedValue);
      if (plain < 0 || plain > 0xffffffff) continue;

      const gas = await estimateContractGasWithBuffer(params.publicClient, {
        address: params.formAddress,
        abi: encryptedFormAbi,
        functionName: "publishTallyResult",
        args: [qi, oi, plain, signature],
        account: params.account,
      });

      const hash = await params.writeContract({
        address: params.formAddress,
        abi: encryptedFormAbi,
        functionName: "publishTallyResult",
        args: [qi, oi, plain, signature],
        gas,
        chainId: params.chainId,
      });
      await params.publicClient.waitForTransactionReceipt({ hash });
    }
  }
}

export function tallyTotal(counts: bigint[]): bigint {
  return counts.reduce((sum, n) => sum + n, 0n);
}

export function tallyPercent(count: bigint, total: bigint): number {
  if (total === 0n) return 0;
  return Number((count * 10000n) / total) / 100;
}
