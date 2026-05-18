import type { PublicClient } from "viem";
import { encryptedFormAbi } from "./abis";
import {
  getQuestionKind,
  getSlotCounts,
  QUESTION_KIND_CHOICE,
  QUESTION_KIND_MULTI,
  QUESTION_KIND_TEXT,
  type FormSchema,
} from "./schema";

export type OnChainQuestionMeta = {
  kind: number;
  slotCount: number;
};

/** Sabit dizi getter'ları Solidity'de uint256 indeks kullanır. */
export async function supportsExtendedEncryptedForm(
  publicClient: PublicClient,
  formAddress: `0x${string}`,
): Promise<boolean> {
  try {
    await publicClient.readContract({
      address: formAddress,
      abi: encryptedFormAbi,
      functionName: "questionKinds",
      args: [0n],
    });
    return true;
  } catch {
    return false;
  }
}

function metaFromSchema(schema: FormSchema): OnChainQuestionMeta[] {
  const kinds = schema.questions.map((q) => getQuestionKind(q.type));
  const slots = getSlotCounts(schema);
  return schema.questions.map((_, i) => ({
    kind: kinds[i]!,
    slotCount: slots[i]!,
  }));
}

/** Zincirdeki slot/kind; yoksa şema yedeği (yalnızca tek seçim formları). */
export async function loadOnChainQuestionMeta(
  publicClient: PublicClient,
  formAddress: `0x${string}`,
  schema: FormSchema,
): Promise<OnChainQuestionMeta[]> {
  const count = schema.questions.length;
  if (count === 0) return [];

  const extended = await supportsExtendedEncryptedForm(publicClient, formAddress);

  if (!extended) {
    const fromSchema = metaFromSchema(schema);
    const hasNonChoice = fromSchema.some((m) => m.kind !== QUESTION_KIND_CHOICE);
    if (hasNonChoice) {
      throw new Error(
        "This form does not support text or multi-select. Please create a new form.",
      );
    }
    return fromSchema;
  }

  const metas: OnChainQuestionMeta[] = [];
  for (let i = 0; i < count; i++) {
    const [kind, slotCount] = await Promise.all([
      publicClient.readContract({
        address: formAddress,
        abi: encryptedFormAbi,
        functionName: "questionKinds",
        args: [BigInt(i)],
      }),
      publicClient.readContract({
        address: formAddress,
        abi: encryptedFormAbi,
        functionName: "slotCounts",
        args: [BigInt(i)],
      }),
    ]);
    metas.push({
      kind: Number(kind),
      slotCount: Number(slotCount),
    });
  }
  return metas;
}

export function maxTextCharsForSlots(slotCount: number): number {
  return slotCount * 4;
}

export { QUESTION_KIND_CHOICE, QUESTION_KIND_MULTI, QUESTION_KIND_TEXT };
