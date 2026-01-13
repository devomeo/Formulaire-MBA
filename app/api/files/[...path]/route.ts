import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { UPLOAD_ROOT } from "@/lib/uploads";

export async function GET(_: Request, { params }: { params: { path: string[] } }) {
  const user = await requireUser();
  const [formSlug, submissionId, storedName] = params.path;

  if (!formSlug || !submissionId || !storedName) {
    return NextResponse.json({ message: "Chemin invalide" }, { status: 400 });
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId }
  });

  if (!submission || (submission.userId !== user.id && user.role !== "ADMIN")) {
    return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
  }

  const filePath = path.join(UPLOAD_ROOT, formSlug, submissionId, storedName);
  try {
    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `inline; filename="${storedName}"`
      }
    });
  } catch {
    return NextResponse.json({ message: "Fichier introuvable" }, { status: 404 });
  }
}
