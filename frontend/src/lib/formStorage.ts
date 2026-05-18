import { head, put } from "@vercel/blob";
import { promises as fs } from "fs";
import { formPath, ensureDataDirs } from "@/lib/storage";

const FORM_PREFIX = "forms";

function blobKey(address: string) {
  return `${FORM_PREFIX}/${address.toLowerCase()}.json`;
}

function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function schemaStorageReady(): { ok: true } | { ok: false; error: string } {
  if (hasBlobStorage()) return { ok: true };
  if (!process.env.VERCEL) return { ok: true };
  return {
    ok: false,
    error:
      "Schema storage is not configured on Vercel. Create a Blob store in the project (Storage → Blob) so BLOB_READ_WRITE_TOKEN is set, then redeploy.",
  };
}

export async function writeFormSchemaJson(address: string, json: string): Promise<void> {
  const ready = schemaStorageReady();
  if (!ready.ok) throw new Error(ready.error);

  if (hasBlobStorage()) {
    await put(blobKey(address), json, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  await ensureDataDirs();
  await fs.writeFile(formPath(address), json, "utf8");
}

export async function readFormSchemaJson(address: string): Promise<string | null> {
  if (hasBlobStorage()) {
    try {
      const meta = await head(blobKey(address));
      const res = await fetch(meta.url, { cache: "no-store" });
      if (!res.ok) return null;
      return res.text();
    } catch {
      return null;
    }
  }

  try {
    await ensureDataDirs();
    return await fs.readFile(formPath(address), "utf8");
  } catch {
    return null;
  }
}
