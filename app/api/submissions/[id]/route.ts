import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { storeFile } from "@/lib/uploads";

const ONE_GB = 1024 * 1024 * 1024;

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await requireUser();
  const formData = await request.formData();
  const valuesRaw = formData.get("values")?.toString() ?? "{}";
  const formId = formData.get("formId")?.toString();

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: { form: { include: { fields: true } } }
  });

  if (!submission || (submission.userId !== user.id && user.role !== "ADMIN")) {
    return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
  }

  if (formId && formId !== submission.formId) {
    return NextResponse.json({ message: "Formulaire invalide" }, { status: 400 });
  }

  const values = JSON.parse(valuesRaw);
  const fieldMap = new Map(submission.form.fields.map((field) => [field.id, field]));

  for (const [fieldId, value] of Object.entries(values)) {
    const field = fieldMap.get(fieldId);
    if (!field) continue;
    if (field.type === "media" || field.type === "signature") {
      continue;
    }
    await prisma.submissionValue.upsert({
      where: { submissionId_fieldId: { submissionId: submission.id, fieldId } },
      update: { valueJson: value },
      create: {
        submissionId: submission.id,
        fieldId,
        valueJson: value
      }
    });
  }

  for (const field of submission.form.fields) {
    if (field.type !== "media" && field.type !== "signature") continue;
    const fileEntries = formData.getAll(field.type === "signature" ? `signature:${field.id}` : `files:${field.id}`);
    if (!fileEntries.length) continue;

    const maxBytes = (field.configJson as any)?.maxBytes ?? ONE_GB;
    const totalBytes = fileEntries.reduce((sum, item) => sum + (item instanceof File ? item.size : 0), 0);
    if (totalBytes > maxBytes) {
      return NextResponse.json({ message: "Taille de fichier trop élevée" }, { status: 400 });
    }

    for (const entry of fileEntries) {
      if (!(entry instanceof File)) continue;
      const stored = await storeFile({ file: entry, formSlug: submission.form.slug, submissionId: submission.id });
      await prisma.submissionFile.create({
        data: {
          submissionId: submission.id,
          fieldId: field.id,
          originalName: stored.originalName,
          storedName: stored.storedName,
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
          storagePath: stored.storagePath
        }
      });
    }
  }

  await prisma.submission.update({
    where: { id: submission.id },
    data: { updatedAt: new Date() }
  });

  return NextResponse.json({ id: submission.id });
}
