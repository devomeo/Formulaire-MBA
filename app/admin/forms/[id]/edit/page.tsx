import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import AdminFormBuilder from "@/components/AdminFormBuilder";

export default async function AdminFormEditPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const form = await prisma.form.findUnique({
    where: { id: params.id },
    include: { fields: { orderBy: { sortOrder: "asc" } } }
  });

  if (!form) {
    redirect("/admin/forms");
  }

  return (
    <AdminFormBuilder
      formId={form.id}
      initialFields={form.fields}
      form={{
        name: form.name,
        slug: form.slug,
        description: form.description,
        isPublished: form.isPublished
      }}
    />
  );
}
