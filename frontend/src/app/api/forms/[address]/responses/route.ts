import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { parseCreatorAuthHeaders, verifyCreatorAccess } from "@/lib/creatorAuth";
import { ensureDataDirs, responsesPath } from "@/lib/storage";
import type { StoredResponse } from "@/lib/schema";
import { promises as fs } from "fs";

type RouteParams = { params: { address: string } };

/** Yanıtlar yalnızca form oluşturucusuna açık (imzalı istek). */
export async function GET(request: Request, { params }: RouteParams) {
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

  try {
    await ensureDataDirs();
    const raw = await fs.readFile(responsesPath(address), "utf8");
    return NextResponse.json(JSON.parse(raw) as StoredResponse[]);
  } catch {
    return NextResponse.json([]);
  }
}
