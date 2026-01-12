import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function SubmissionPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      form: true,
      values: { include: { field: true } },
      files: { include: { field: true } }
    }
  });

  if (!submission || (submission.userId !== user.id && user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{submission.form.name}</h1>
          <p className="text-sm text-slate-500">Soumission #{submission.id}</p>
        </div>
        <Link className="text-sm text-blue-600" href={`/submissions/${submission.id}/edit`}>
          Modifier
        </Link>
      </div>
      <div className="flex flex-col gap-4">
        {submission.values.map((value) => (
          <div key={value.id}>
            <div className="text-sm font-medium">{value.field.label}</div>
            <div className="text-sm text-slate-700">{JSON.stringify(value.valueJson)}</div>
          </div>
        ))}
        {submission.files.map((file) => (
          <div key={file.id}>
            <div className="text-sm font-medium">{file.field.label}</div>
            <a
              className="text-sm text-blue-600"
              href={`/api/files/${file.storagePath}`}
              target="_blank"
              rel="noreferrer"
            >
              {file.originalName}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
