import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formSchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const forms = await prisma.form.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(forms);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = formSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Données invalides" }, { status: 400 });
  }

  const user = await requireAdmin();
  const form = await prisma.form.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      isPublished: parsed.data.isPublished,
      createdBy: user.id
    }
  });
  return NextResponse.json(form, { status: 201 });
}
