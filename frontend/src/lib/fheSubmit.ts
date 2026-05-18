import { toFunctionSelector, type Hex, type PublicClient } from "viem";
import { encryptedFormAbi } from "./abis";
import { estimateContractGasWithBuffer, MAX_TX_GAS } from "./contractGas";
import type { Question } from "./schema";
import { getQuestionKind, QUESTION_KIND_CHOICE, QUESTION_KIND_MULTI, QUESTION_KIND_TEXT } from "./schema";
import { packStringToUint32s } from "./fhePack";
import { loadOnChainQuestionMeta, type OnChainQuestionMeta } from "./onChainFormMeta";
import {
  isAlreadyAnsweredError,
  isQuestionAnsweredInMask,
  readFheAnswerProgress,
  readFheAnswersRecorded,
} from "./fheProgress";
import type { FormSchema } from "./schema";
import type { EncryptedItemInput } from "@cofhe/sdk";

function toArg(e: EncryptedItemInput): EncryptedChoiceArg {
  return {
    ctHash: e.ctHash,
    securityZone: e.securityZone,
    utype: e.utype,
    signature: e.signature as Hex,
  };
}

export type EncryptedChoiceArg = {
  ctHash: bigint;
  securityZone: number;
  utype: number;
  signature: Hex;
};

const SUBMIT_QUESTION_SELECTOR = toFunctionSelector(
  "submitFheQuestion(uint8,(uint256,uint8,uint8,bytes)[])",
);

export async function supportsPerQuestionFheSubmit(
  publicClient: PublicClient,
  formAddress: `0x${string}`,
): Promise<boolean> {
  const bytecode = await publicClient.getBytecode({ address: formAddress });
  if (!bytecode) return false;
  const needle = SUBMIT_QUESTION_SELECTOR.slice(2).toLowerCase();
  return bytecode.toLowerCase().includes(needle);
}

const toTuple = (e: EncryptedChoiceArg) => ({
  ctHash: e.ctHash,
  securityZone: e.securityZone,
  utype: e.utype,
  signature: e.signature,
});

export async function buildEncryptedValuesForQuestion(
  q: Question,
  _questionIndex: number,
  onChain: OnChainQuestionMeta | undefined,
  answers: {
    choiceIndex?: number;
    multiIndices?: number[];
    text?: string;
    photoUrl?: string;
  },
  encryptBatch: (values: number[]) => Promise<EncryptedItemInput[]>,
): Promise<EncryptedChoiceArg[]> {
  const kind = onChain?.kind ?? getQuestionKind(q.type);
  const slotCount = onChain?.slotCount;

  if (kind === QUESTION_KIND_CHOICE) {
    const idx = answers.choiceIndex ?? 0;
    const enc = await encryptBatch([idx]);
    return [toArg(enc[0]!)];
  }

  if (kind === QUESTION_KIND_MULTI) {
    const n = slotCount ?? (q.options?.length ?? 2);
    const selected = new Set(answers.multiIndices ?? []);
    const vals = Array.from({ length: n }, (_, i) => (selected.has(i) ? 1 : 0));
    const enc = await encryptBatch(vals);
    return enc.map(toArg);
  }

  const raw =
    q.type === "photo"
      ? (answers.photoUrl ?? answers.text ?? "")
      : (answers.text ?? "");
  const chunks = slotCount ?? (q.type === "longText" ? 8 : 4);
  const packed = packStringToUint32s(raw, chunks);
  const enc = await encryptBatch(packed);
  return enc.map(toArg);
}

export async function writeAllFheQuestions(params: {
  publicClient: PublicClient;
  writeContract: (args: Record<string, unknown>) => Promise<Hex>;
  formAddress: `0x${string}`;
  account: `0x${string}`;
  chainId: number;
  schema: FormSchema;
  questions: Question[];
  onQuestionStart?: (index: number, total: number) => void;
  buildValues: (
    q: Question,
    index: number,
    onChain: OnChainQuestionMeta,
  ) => Promise<EncryptedChoiceArg[]>;
}): Promise<void> {
  const useNew = await supportsPerQuestionFheSubmit(params.publicClient, params.formAddress);
  const total = params.questions.length;

  const settings = await params.publicClient.readContract({
    address: params.formAddress,
    abi: encryptedFormAbi,
    functionName: "settings",
  });
  const fheCount = Number(settings[8]);
  const onChainMeta = await loadOnChainQuestionMeta(
    params.publicClient,
    params.formAddress,
    params.schema,
  );

  if (total !== fheCount) {
    throw new Error(
      `Schema mismatch (${total} questions / ${fheCount} on-chain). Create a new form.`,
    );
  }

  if (await readFheAnswersRecorded(params.publicClient, params.formAddress, params.account)) {
    return;
  }

  const progressMask = await readFheAnswerProgress(
    params.publicClient,
    params.formAddress,
    params.account,
  );

  for (let i = 0; i < total; i++) {
    if (progressMask !== null && isQuestionAnsweredInMask(progressMask, i)) {
      continue;
    }

    params.onQuestionStart?.(i, total);
    const values = await params.buildValues(params.questions[i], i, onChainMeta[i]!);
    const tuples = values.map(toTuple);

    try {
      if (useNew) {
        const gas = await estimateContractGasWithBuffer(params.publicClient, {
          address: params.formAddress,
          abi: encryptedFormAbi,
          functionName: "submitFheQuestion",
          args: [i, tuples],
          account: params.account,
        });

        const hash = await params.writeContract({
          address: params.formAddress,
          abi: encryptedFormAbi,
          functionName: "submitFheQuestion",
          args: [i, tuples],
          gas,
          chainId: params.chainId,
        });
        await params.publicClient.waitForTransactionReceipt({ hash });
      } else if (
        values.length === 1 &&
        getQuestionKind(params.questions[i].type) === QUESTION_KIND_CHOICE
      ) {
        const gas = await estimateContractGasWithBuffer(params.publicClient, {
          address: params.formAddress,
          abi: encryptedFormAbi,
          functionName: "submitFheAnswer",
          args: [i, tuples[0]],
          account: params.account,
        });
        const hash = await params.writeContract({
          address: params.formAddress,
          abi: encryptedFormAbi,
          functionName: "submitFheAnswer",
          args: [i, tuples[0]],
          gas,
          chainId: params.chainId,
        });
        await params.publicClient.waitForTransactionReceipt({ hash });
      } else {
        throw new Error(
          "This question type requires submitFheQuestion. Try creating a new form.",
        );
      }
    } catch (error) {
      if (isAlreadyAnsweredError(error)) {
        continue;
      }
      throw error;
    }
  }

  const recorded = await readFheAnswersRecorded(
    params.publicClient,
    params.formAddress,
    params.account,
  );
  if (!recorded) {
    throw new Error(
      "Not all FHE answers were written on-chain. Complete missing questions and try again.",
    );
  }
}

/** Eski tek-seçim toplu gönderim (geriye uyumluluk). */
export async function writeFheSubmits(params: {
  publicClient: PublicClient;
  writeContract: (args: Record<string, unknown>) => Promise<Hex>;
  formAddress: `0x${string}`;
  account: `0x${string}`;
  chainId: number;
  encrypted: EncryptedChoiceArg[];
  usePerQuestion: boolean;
}): Promise<Hex[]> {
  const { publicClient, writeContract, formAddress, account, chainId, encrypted } = params;
  const hashes: Hex[] = [];
  const tuples = encrypted.map(toTuple);

  if (await supportsPerQuestionFheSubmit(publicClient, formAddress)) {
    for (let i = 0; i < tuples.length; i++) {
      const gas = await estimateContractGasWithBuffer(publicClient, {
        address: formAddress,
        abi: encryptedFormAbi,
        functionName: "submitFheQuestion",
        args: [i, [tuples[i]]],
        account,
      });
      const hash = await writeContract({
        address: formAddress,
        abi: encryptedFormAbi,
        functionName: "submitFheQuestion",
        args: [i, [tuples[i]]],
        gas,
        chainId,
      });
      hashes.push(hash);
      await publicClient.waitForTransactionReceipt({ hash });
    }
    return hashes;
  }

  const gas = await estimateContractGasWithBuffer(publicClient, {
    address: formAddress,
    abi: encryptedFormAbi,
    functionName: "submitFheAnswers",
    args: [tuples],
    account,
  });

  if (gas >= MAX_TX_GAS) {
    throw new Error("FHE submission exceeds gas limits.");
  }

  const hash = await writeContract({
    address: formAddress,
    abi: encryptedFormAbi,
    functionName: "submitFheAnswers",
    args: [tuples],
    gas,
    chainId,
  });
  hashes.push(hash);
  await publicClient.waitForTransactionReceipt({ hash });
  return hashes;
}
