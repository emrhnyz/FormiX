import { NextResponse } from "next/server";
import { uploadDir } from "@/lib/storage";
import path from "path";
import { promises as fs } from "fs";

type RouteParams = { params: { filename: string } };

export async function GET(_: Request, { params }: RouteParams) {
  const filename = path.basename(params.filename);
  const fullPath = path.join(uploadDir(), filename);

  try {
    const data = await fs.readFile(fullPath);
    const ext = filename.split(".").pop()?.toLowerCase();
    const type =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : "image/jpeg";
    return new NextResponse(data, {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
