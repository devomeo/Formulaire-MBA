import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export function safePathJoin(...parts: string[]) {
  return path.join(...parts);
}

export async function storeFile(params: {
  file: File;
  formSlug: string;
  submissionId: string;
}) {
  const { file, formSlug, submissionId } = params;
  const ext = path.extname(file.name);
  const storedName = `${randomUUID()}${ext}`;
  const targetDir = safePathJoin(UPLOAD_ROOT, formSlug, submissionId);
  await ensureDir(targetDir);
  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = safePathJoin(formSlug, submissionId, storedName);
  await fs.writeFile(safePathJoin(UPLOAD_ROOT, storagePath), buffer);
  return {
    storedName,
    storagePath,
    sizeBytes: buffer.length,
    mimeType: file.type || "application/octet-stream",
    originalName: file.name
  };
}
