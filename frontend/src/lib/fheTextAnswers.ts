import type { PublicClient } from "viem";
import { encryptedFormAbi } from "./abis";
import { unpackUint32sToString } from "./fhePack";
import { supportsExtendedEncryptedForm } from "./onChainFormMeta";
import { QUESTION_KIND_TEXT, type FormSchema, type Question } from "./schema";

export type DecryptedRespondentAnswer = {
  respondent: `0x${string}`;
  answers: { questionId: string; title: string; text: string }[];
};

export async function readRespondents(
  publicClient: PublicClient,
  formAddress: `0x${string}`,
): Promise<`0x${string}`[]> {
  const count = await publicClient.readContract({
    address: formAddress,
    abi: encryptedFormAbi,
    functionName: "respondentCount",
  });
  const n = Number(count);
  const list: `0x${string}`[] = [];
  for (let i = 0; i < n; i++) {
    const addr = await publicClient.readContract({
      address: formAddress,
      abi: encryptedFormAbi,
      functionName: "getRespondent",
      args: [BigInt(i)],
    });
    list.push(addr as `0x${string}`);
  }
  return list;
}

async function readTextChunkHandle(
  publicClient: PublicClient,
  formAddress: `0x${string}`,
  respondent: `0x${string}`,
  questionIndex: number,
  chunkIndex: number,
): Promise<bigint> {
  const handle = await publicClient.readContract({
    address: formAddress,
    abi: encryptedFormAbi,
    functionName: "getEncryptedTextChunk",
    args: [respondent, questionIndex, chunkIndex],
  });
  return handle as bigint;
}

function isTextQuestion(q: Question): boolean {
  return q.type === "shortText" || q.type === "longText" || q.type === "photo";
}

export async function decryptTextAnswersForForm(params: {
  schema: FormSchema;
  formAddress: `0x${string}`;
  publicClient: PublicClient;
  decryptUint32: (ctHash: bigint) => Promise<bigint>;
}): Promise<DecryptedRespondentAnswer[]> {
  const extended = await supportsExtendedEncryptedForm(
    params.publicClient,
    params.formAddress,
  );
  if (!extended) {
    return [];
  }

  const respondents = await readRespondents(params.publicClient, params.formAddress);
  const out: DecryptedRespondentAnswer[] = [];

  for (const respondent of respondents) {
    const answers: DecryptedRespondentAnswer["answers"] = [];

    for (let qi = 0; qi < params.schema.questions.length; qi++) {
      const q = params.schema.questions[qi];
      if (!isTextQuestion(q)) continue;

      const kind = await params.publicClient.readContract({
        address: params.formAddress,
        abi: encryptedFormAbi,
        functionName: "questionKinds",
        args: [BigInt(qi)],
      });
      if (Number(kind) !== QUESTION_KIND_TEXT) continue;

      const chunks = Number(
        await params.publicClient.readContract({
          address: params.formAddress,
          abi: encryptedFormAbi,
          functionName: "slotCounts",
          args: [BigInt(qi)],
        }),
      );
      const values: bigint[] = [];

      for (let ci = 0; ci < chunks; ci++) {
        const ctHash = await readTextChunkHandle(
          params.publicClient,
          params.formAddress,
          respondent,
          qi,
          ci,
        );
        if (ctHash === 0n) {
          values.push(0n);
          continue;
        }
        values.push(await params.decryptUint32(ctHash));
      }

      const text = unpackUint32sToString(values).trim();
      if (text) {
        answers.push({
          questionId: q.id,
          title: q.title || "Soru",
          text,
        });
      }
    }

    if (answers.length > 0) {
      out.push({ respondent, answers });
    }
  }

  return out;
}
