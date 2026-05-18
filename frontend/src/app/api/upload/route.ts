import { NextResponse } from "next/server";
import { ensureDataDirs, uploadDir } from "@/lib/storage";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 5MB" }, { status: 400 });
  }

  await ensureDataDirs();
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const fullPath = path.join(uploadDir(), filename);
  await fs.writeFile(fullPath, buffer);

  return NextResponse.json({
    url: `/api/uploads/${filename}`,
    filename,
  });
}
