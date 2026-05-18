import { keccak256, toBytes, type Hex } from "viem";

export type FormKind = "form" | "poll";

export type QuestionType =
  | "shortText"
  | "longText"
  | "singleChoice"
  | "multipleChoice"
  | "photo"
  | "poll";

export const QUESTION_KIND_CHOICE = 0;
export const QUESTION_KIND_MULTI = 1;
export const QUESTION_KIND_TEXT = 2;

export type Question = {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
};

export type RewardConfig = {
  enabled: boolean;
  amountEth: string;
  maxRecipients: number;
  initialBountyEth: string;
};

export type FormSchema = {
  version: 1;
  title: string;
  description: string;
  kind: FormKind;
  showLiveResults: boolean;
  reward: RewardConfig;
  questions: Question[];
  createdAt: string;
  creator?: string;
  contractAddress?: string;
};

export type FormAnswer = {
  questionId: string;
  type: QuestionType;
  text?: string;
  choiceIndex?: number;
  photoUrl?: string;
};

export type StoredResponse = {
  respondent: string;
  submittedAt: string;
  answers: FormAnswer[];
};

/** Tüm soru tipleri zincirde FHE ile işlenir. */
export function isFheQuestion(_type: QuestionType): boolean {
  return true;
}

export function getFheQuestions(schema: FormSchema): Question[] {
  return schema.questions;
}

export function getQuestionKind(type: QuestionType): number {
  if (type === "multipleChoice") return QUESTION_KIND_MULTI;
  if (type === "shortText" || type === "longText" || type === "photo") return QUESTION_KIND_TEXT;
  return QUESTION_KIND_CHOICE;
}

export function getTextChunkCount(type: QuestionType): number {
  if (type === "shortText" || type === "photo") return 4;
  if (type === "longText") return 8;
  return 0;
}

export function getSlotCounts(schema: FormSchema): number[] {
  return schema.questions.map((q) => {
    if (q.type === "shortText" || q.type === "photo") return 4;
    if (q.type === "longText") return 8;
    const count = q.options?.length ?? 0;
    return Math.min(Math.max(count, 2), 8);
  });
}

export function getQuestionKinds(schema: FormSchema): number[] {
  return schema.questions.map((q) => getQuestionKind(q.type));
}

/** @deprecated use getSlotCounts */
export function getOptionCounts(schema: FormSchema): number[] {
  return getSlotCounts(schema);
}

export function schemaHash(schema: Omit<FormSchema, "contractAddress" | "creator">): Hex {
  const canonical = JSON.stringify({
    version: schema.version,
    title: schema.title,
    description: schema.description,
    kind: schema.kind,
    showLiveResults: schema.showLiveResults,
    reward: schema.reward,
    questions: schema.questions,
  });
  return keccak256(toBytes(canonical));
}

export function createEmptyQuestion(type: QuestionType = "shortText"): Question {
  return {
    id: crypto.randomUUID(),
    type,
    title: "",
    description: "",
    placeholder: "",
    required: true,
    options:
      type === "shortText" || type === "longText" || type === "photo"
        ? undefined
        : ["Option 1", "Option 2"],
  };
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  shortText: "Short text (FHE)",
  longText: "Long text (FHE)",
  singleChoice: "Single choice (FHE)",
  multipleChoice: "Multiple choice (FHE)",
  photo: "Photo / URL (FHE)",
  poll: "Poll / vote (FHE)",
};

export function isChoiceQuestion(type: QuestionType): boolean {
  return type === "poll" || type === "singleChoice";
}

export function isTallyQuestion(type: QuestionType): boolean {
  return isChoiceQuestion(type) || type === "multipleChoice";
}
