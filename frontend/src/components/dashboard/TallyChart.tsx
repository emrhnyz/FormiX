"use client";

import { tallyPercent, tallyTotal, type QuestionTally } from "@/lib/fheTallies";

export function TallyChart({ tally }: { tally: QuestionTally }) {
  const total = tallyTotal(tally.counts);

  return (
    <div className="mt-3 space-y-3">
      {tally.options.map((label, i) => {
        const count = tally.counts[i] ?? 0n;
        const pct = tallyPercent(count, total);
        return (
          <div key={i}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-200">{label}</span>
              <span className="text-slate-400">
                {count.toString()} oy · {pct.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-xs text-slate-500">Toplam: {total.toString()} oy</p>
    </div>
  );
}
