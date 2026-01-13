import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export default async function AdminFormsPage() {
  await requireAdmin();
  const forms = await prisma.form.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin formulaires</h1>
        <Link href="/admin/forms/new" className="rounded bg-blue-600 px-4 py-2 text-sm text-white">
          Nouveau formulaire
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {forms.map((form) => (
          <div key={form.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold">{form.name}</h2>
            <p className="text-sm text-slate-500">{form.slug}</p>
            <div className="mt-2 flex gap-3 text-sm">
              <Link className="text-blue-600" href={`/admin/forms/${form.id}/edit`}>
                Éditer
              </Link>
              <span className="text-slate-400">{form.isPublished ? "Publié" : "Brouillon"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
