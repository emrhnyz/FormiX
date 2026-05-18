import type { FormSchema } from "./schema";

const CACHE_PREFIX = "formix-schema-";

function toBase64Url(text: string): string {
  if (typeof window !== "undefined") {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  return Buffer.from(text, "utf8").toString("base64url");
}

function fromBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  if (typeof window !== "undefined") {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(padded, "base64").toString("utf8");
}

export function encodeSchemaForUrl(schema: FormSchema): string {
  return toBase64Url(JSON.stringify(schema));
}

export function decodeSchemaFromUrl(encoded: string): FormSchema | null {
  try {
    return JSON.parse(fromBase64Url(encoded)) as FormSchema;
  } catch {
    return null;
  }
}

export function cacheSchemaLocally(address: string, schema: FormSchema) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${CACHE_PREFIX}${address.toLowerCase()}`, JSON.stringify(schema));
  } catch {
    /* quota */
  }
}

export function loadCachedSchema(address: string): FormSchema | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${address.toLowerCase()}`);
    if (!raw) return null;
    return JSON.parse(raw) as FormSchema;
  } catch {
    return null;
  }
}

export function buildFillUrl(formAddress: string, schema: FormSchema, origin?: string) {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  const params = new URLSearchParams({
    form: formAddress,
    schema: encodeSchemaForUrl(schema),
  });
  return `${base}/fill?${params.toString()}`;
}
