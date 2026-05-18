const rows = [
  { label: "Form schema & settings", hosted: 85, formix: 40, note: "On-chain hash; metadata in contract" },
  { label: "Individual answers", hosted: 100, formix: 5, note: "FHE ciphertext on chain; no plaintext storage" },
  { label: "Who can read answers", hosted: 90, formix: 15, note: "Creator decrypts with wallet keys" },
  { label: "Audit trail", hosted: 30, formix: 75, note: "Public txs; privacy via encryption not hiding" },
] as const;

/** Relative “plaintext exposure” bars (illustrative, not measured) */
export function PlaintextExposureChart() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-6 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-6 rounded bg-slate-500/60" />
          Typical hosted form (illustrative)
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-6 rounded bg-gradient-to-r from-violet-500 to-cyan-400" />
          FormiX (FHE + on-chain)
        </span>
      </div>
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium text-slate-200">{row.label}</span>
            <span className="text-xs text-slate-500">{row.note}</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-slate-500">Hosted</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-800">
                <div
                  className="h-full rounded-full bg-slate-500/50"
                  style={{ width: `${row.hosted}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-violet-300">FormiX</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500"
                  style={{ width: `${row.formix}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
      <p className="text-xs text-slate-600">
        Bars compare illustrative exposure of readable plaintext — not a formal security audit.
      </p>
    </div>
  );
}
