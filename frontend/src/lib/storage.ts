import { promises as fs } from "fs";
import path from "path";

const dataRoot = path.join(process.cwd(), "data");

export function formPath(address: string) {
  return path.join(dataRoot, "forms", `${address.toLowerCase()}.json`);
}

export function responsesPath(address: string) {
  return path.join(dataRoot, "responses", `${address.toLowerCase()}.json`);
}

export function uploadDir() {
  return path.join(dataRoot, "uploads");
}

export async function ensureDataDirs() {
  await fs.mkdir(path.join(dataRoot, "forms"), { recursive: true });
  await fs.mkdir(path.join(dataRoot, "responses"), { recursive: true });
  await fs.mkdir(uploadDir(), { recursive: true });
}
