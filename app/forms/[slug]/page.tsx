import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import FormRunner from "@/components/FormRunner";

export default async function FormPage({ params }: { params: { slug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const form = await prisma.form.findUnique({
    where: { slug: params.slug },
    include: { fields: { orderBy: { sortOrder: "asc" } } }
  });

  if (!form || (!form.isPublished && user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  return (
    <FormRunner
      formId={form.id}
      formSlug={form.slug}
      formName={form.name}
      userId={user.id}
      fields={form.fields}
    />
  );
}
