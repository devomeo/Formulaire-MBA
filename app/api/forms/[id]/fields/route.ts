import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fieldSchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await requireAdmin();
  const fields = await prisma.formField.findMany({ where: { formId: params.id }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json(fields);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  await requireAdmin();
  const body = await request.json();
  const parsed = fieldSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Données invalides" }, { status: 400 });
  }

  const field = await prisma.formField.create({
    data: {
      formId: params.id,
      keyName: parsed.data.keyName,
      label: parsed.data.label,
      type: parsed.data.type,
      sortOrder: parsed.data.sortOrder,
      isRequired: parsed.data.isRequired,
      placeholder: parsed.data.placeholder,
      helpText: parsed.data.helpText,
      configJson: parsed.data.configJson ?? undefined,
      conditional: parsed.data.conditional ?? undefined
    }
  });

  return NextResponse.json(field, { status: 201 });
}
