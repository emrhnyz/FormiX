import type { CreatorAuthHeaders } from "@/lib/creatorAuth";
import type { FormSchema, StoredResponse } from "./schema";

function authHeaders(auth: CreatorAuthHeaders): HeadersInit {
  return {
    "x-forminyo-address": auth.address,
    "x-forminyo-signature": auth.signature,
    "x-forminyo-timestamp": auth.timestamp,
  };
}

export async function saveFormSchema(
  address: string,
  schema: FormSchema,
  auth?: CreatorAuthHeaders,
) {
  const res = await fetch(`/api/forms/${address}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? authHeaders(auth) : {}),
    },
    body: JSON.stringify({ ...schema, contractAddress: address }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Could not save schema");
  }
}

export async function fetchFormSchema(address: string): Promise<FormSchema | null> {
  const res = await fetch(`/api/forms/${address}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<FormSchema>;
}

/** @deprecated Yanıtlar artık yalnızca zincirde (FHE). */
export async function submitOffChainResponse(_address: string, _response: StoredResponse) {
  throw new Error("Off-chain yanıt gönderimi kapatıldı.");
}

export async function fetchResponses(
  address: string,
  auth: CreatorAuthHeaders,
): Promise<StoredResponse[]> {
  const res = await fetch(`/api/forms/${address}/responses`, {
    cache: "no-store",
    headers: authHeaders(auth),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error("Bu yanıtları görüntüleme yetkiniz yok.");
  }
  if (!res.ok) return [];
  return res.json() as Promise<StoredResponse[]>;
}

export async function uploadPhoto(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Fotoğraf yüklenemedi");
  const data = (await res.json()) as { url: string };
  return data.url;
}
