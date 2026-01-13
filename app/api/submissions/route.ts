import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { storeFile } from "@/lib/uploads";

const ONE_GB = 1024 * 1024 * 1024;

async function handleSubmission(params: {
  formId: string;
  submissionId: string;
  formData: FormData;
  values: Record<string, any>;
  userId: string;
}) {
  const { formId, submissionId, formData, values, userId } = params;
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { fields: true }
  });

  if (!form) {
    return NextResponse.json({ message: "Formulaire introuvable" }, { status: 404 });
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: { updatedAt: new Date() }
  });

  const fieldMap = new Map(form.fields.map((field) => [field.id, field]));

  for (const [fieldId, value] of Object.entries(values)) {
    const field = fieldMap.get(fieldId);
    if (!field) continue;
    if (field.type === "media" || field.type === "signature") {
      continue;
    }
    await prisma.submissionValue.upsert({
      where: { submissionId_fieldId: { submissionId, fieldId } },
      update: { valueJson: value },
      create: {
        submissionId,
        fieldId,
        valueJson: value
      }
    });
  }

  for (const field of form.fields) {
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
      const stored = await storeFile({ file: entry, formSlug: form.slug, submissionId });
      await prisma.submissionFile.create({
        data: {
          submissionId,
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

  return NextResponse.json({ id: submissionId });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const formData = await request.formData();
  const formId = formData.get("formId")?.toString();
  const valuesRaw = formData.get("values")?.toString() ?? "{}";

  if (!formId) {
    return NextResponse.json({ message: "formId manquant" }, { status: 400 });
  }

  const form = await prisma.form.findUnique({ where: { id: formId } });
  if (!form || (!form.isPublished && user.role !== "ADMIN")) {
    return NextResponse.json({ message: "Formulaire non disponible" }, { status: 403 });
  }

  const values = JSON.parse(valuesRaw);
  const submission = await prisma.submission.create({
    data: {
      formId,
      userId: user.id,
      status: "SUBMITTED"
    }
  });

  return handleSubmission({
    formId,
    submissionId: submission.id,
    formData,
    values,
    userId: user.id
  });
}
