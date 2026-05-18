import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { parseCreatorAuthHeaders, verifyCreatorAccess } from "@/lib/creatorAuth";
import { ensureDataDirs, formPath, responsesPath } from "@/lib/storage";
import type { FormSchema, StoredResponse } from "@/lib/schema";
import { promises as fs } from "fs";

type RouteParams = { params: { address: string } };

export async function GET(_: Request, { params }: RouteParams) {
  const address = params.address?.toLowerCase();
  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    await ensureDataDirs();
    const raw = await fs.readFile(formPath(address), "utf8");
    const schema = JSON.parse(raw) as FormSchema;
    return NextResponse.json(schema);
  } catch {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const address = params.address?.toLowerCase();
  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const auth = parseCreatorAuthHeaders(request);
  if (!auth) {
    return NextResponse.json({ error: "Creator authentication required" }, { status: 401 });
  }
  const verified = await verifyCreatorAccess(address as `0x${string}`, auth);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: verified.status });
  }

  const schema = (await request.json()) as FormSchema;
  schema.contractAddress = address;

  await ensureDataDirs();
  await fs.writeFile(formPath(address), JSON.stringify(schema, null, 2), "utf8");
  return NextResponse.json({ ok: true });
}

/** Eski istemciler için kapalı — yanıtlar yalnızca zincirde (FHE). */
export async function POST() {
  return NextResponse.json(
    { error: "Off-chain yanıt depolama devre dışı. Yanıtları zincire gönderin." },
    { status: 410 },
  );
}
