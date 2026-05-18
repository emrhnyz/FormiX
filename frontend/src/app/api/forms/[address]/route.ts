import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { parseCreatorAuthHeaders, verifyCreatorAccess } from "@/lib/creatorAuth";
import {
  readFormSchemaJson,
  schemaStorageReady,
  writeFormSchemaJson,
} from "@/lib/formStorage";
import type { FormSchema } from "@/lib/schema";

type RouteParams = { params: { address: string } };

export async function GET(_: Request, { params }: RouteParams) {
  const address = params.address?.toLowerCase();
  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const ready = schemaStorageReady();
  if (!ready.ok) {
    return NextResponse.json({ error: ready.error }, { status: 503 });
  }

  const raw = await readFormSchemaJson(address);
  if (!raw) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  try {
    const schema = JSON.parse(raw) as FormSchema;
    return NextResponse.json(schema);
  } catch {
    return NextResponse.json({ error: "Invalid stored schema" }, { status: 500 });
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

  const ready = schemaStorageReady();
  if (!ready.ok) {
    return NextResponse.json({ error: ready.error }, { status: 503 });
  }

  const schema = (await request.json()) as FormSchema;
  schema.contractAddress = address;

  try {
    await writeFormSchemaJson(address, JSON.stringify(schema, null, 2));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save schema";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Eski istemciler için kapalı — yanıtlar yalnızca zincirde (FHE). */
export async function POST() {
  return NextResponse.json(
    { error: "Off-chain yanıt depolama devre dışı. Yanıtları zincire gönderin." },
    { status: 410 },
  );
}
