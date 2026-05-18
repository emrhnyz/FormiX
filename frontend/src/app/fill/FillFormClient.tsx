"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { DynamicFormFill } from "@/components/fill/DynamicFormFill";
import { fetchFormSchema } from "@/lib/formApi";
import { isTxHash, parseFormAddress } from "@/lib/parseAddress";
import { decodeSchemaFromUrl } from "@/lib/schemaShare";
import type { FormSchema } from "@/lib/schema";

const FACTORY = process.env.NEXT_PUBLIC_FORM_FACTORY_ADDRESS?.toLowerCase();

export function FillFormClient() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("form") ?? "";
  const initialSchema = searchParams.get("schema");

  const [input, setInput] = useState(initial);
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (raw: string) => {
    setError(null);
    setSchema(null);

    if (isTxHash(raw)) {
      setError("Enter the EncryptedForm contract address, not a transaction hash.");
      return;
    }

    const parsed = parseFormAddress(raw);
    if (!parsed) {
      setError("Invalid address or URL.");
      return;
    }
    if (FACTORY && parsed.toLowerCase() === FACTORY) {
      setError("That is the factory address. Use the form contract from Create.");
      return;
    }

    setLoading(true);
    setAddress(parsed);

    const fromUrl = initialSchema ? decodeSchemaFromUrl(initialSchema) : null;
    if (fromUrl) {
      setSchema(fromUrl);
      setLoading(false);
      return;
    }

    const data = await fetchFormSchema(parsed);
    setLoading(false);
    if (!data) {
      setError(
        "Schema not found. Open the full Fill link from Create (includes embedded schema), or enable Vercel Blob storage.",
      );
      return;
    }
    setSchema(data);
  }, [initialSchema]);

  useEffect(() => {
    if (initial) void load(initial);
    else if (initialSchema) {
      setError("Add the form contract address in the URL (?form=0x…), or use the share link from Create.");
    }
  }, [initial, initialSchema, load]);

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-white">Fill a form</h1>
        <p className="mt-2 text-slate-400">
          Paste the shared form link or contract address. Answers are encrypted before they reach
          the chain.
        </p>

        {!schema && (
          <div className="mt-8 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="0x… or Basescan URL"
              className="fx-input flex-1 font-mono"
            />
            <button
              type="button"
              onClick={() => void load(input)}
              className="fx-btn-primary shrink-0 px-5"
            >
              Load
            </button>
          </div>
        )}

        {loading && <p className="mt-4 text-sm text-violet-300">Loading…</p>}
        {error && (
          <p className="mt-4 text-sm text-rose-400">
            {error}{" "}
            <Link href="/create" className="underline">
              Create a form
            </Link>
          </p>
        )}

        {schema && address && <DynamicFormFill formAddress={address} schema={schema} />}
      </div>
    </PageShell>
  );
}
