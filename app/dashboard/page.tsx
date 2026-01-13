import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [forms, submissions] = await Promise.all([
    prisma.form.findMany({ where: { isPublished: true }, orderBy: { createdAt: "desc" } }),
    prisma.submission.findMany({
      where: { userId: user.id },
      include: { form: true },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Formulaires disponibles</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {forms.map((form) => (
            <div key={form.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold">{form.name}</h3>
              <p className="text-sm text-slate-500">{form.description}</p>
              <Link className="mt-3 inline-block text-sm text-blue-600" href={`/forms/${form.slug}`}>
                Remplir le formulaire
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Vos soumissions</h2>
        <div className="flex flex-col gap-3">
          {submissions.map((submission) => (
            <div key={submission.id} className="flex items-center justify-between rounded-lg border bg-white p-4">
              <div>
                <div className="font-medium">{submission.form.name}</div>
                <div className="text-xs text-slate-500">Mise à jour {submission.updatedAt.toLocaleString("fr-FR")}</div>
              </div>
              <div className="flex gap-3 text-sm">
                <Link className="text-blue-600" href={`/submissions/${submission.id}`}>
                  Voir
                </Link>
                <Link className="text-blue-600" href={`/submissions/${submission.id}/edit`}>
                  Modifier
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
