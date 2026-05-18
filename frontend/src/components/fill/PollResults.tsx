"use client";

import { useEffect, useState } from "react";
import { usePublicClient, useReadContract } from "wagmi";
import { TallyChart } from "@/components/dashboard/TallyChart";
import { encryptedFormAbi } from "@/lib/abis";
import { readPublishedFormTallies, type QuestionTally } from "@/lib/fheTallies";
import { getFheQuestions, type FormSchema } from "@/lib/schema";
import { defaultCofheChain } from "@/lib/chains";

type Props = {
  formAddress: `0x${string}`;
  schema: FormSchema;
};

export function PollResults({ formAddress, schema }: Props) {
  const fheQs = getFheQuestions(schema);
  const publicClient = usePublicClient({ chainId: defaultCofheChain.id });

  const { data: total } = useReadContract({
    address: formAddress,
    abi: encryptedFormAbi,
    functionName: "totalSubmissions",
    chainId: defaultCofheChain.id,
  });

  const [published, setPublished] = useState<QuestionTally[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicClient || fheQs.length === 0) {
      setLoading(false);
      return;
    }
    void readPublishedFormTallies(publicClient, formAddress, schema)
      .then(setPublished)
      .finally(() => setLoading(false));
  }, [publicClient, formAddress, schema, fheQs.length]);

  if (fheQs.length === 0) return null;

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 text-sm text-violet-100">
      <p className="font-medium">Canlı sonuçlar</p>
      <p className="mt-1 text-xs text-violet-200/80">
        Toplam gönderim: {total?.toString() ?? "0"}
      </p>

      {loading && <p className="mt-3 text-xs text-slate-400">Yükleniyor…</p>}

      {!loading && published && (
        <div className="mt-4 space-y-4">
          {published.map((t) => (
            <div key={t.questionId}>
              <p className="text-sm font-medium text-white">{t.title}</p>
              <TallyChart tally={t} />
            </div>
          ))}
        </div>
      )}

      {!loading && !published && (
        <p className="mt-3 text-xs text-slate-400">
          Oluşturucu henüz sonuçları zincire yayınlamadı. Panelden &quot;Canlı sonuçları
          yayınla&quot; ile açılabilir.
        </p>
      )}
    </div>
  );
}
