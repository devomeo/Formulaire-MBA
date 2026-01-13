import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formSchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  await requireAdmin();
  const body = await request.json();
  const parsed = formSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Données invalides" }, { status: 400 });
  }

  const form = await prisma.form.update({
    where: { id: params.id },
    data: parsed.data
  });

  return NextResponse.json(form);
}
