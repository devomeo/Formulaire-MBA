import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import FormRunner from "@/components/FormRunner";

export default async function SubmissionEditPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      form: { include: { fields: { orderBy: { sortOrder: "asc" } } } },
      values: true,
      files: true
    }
  });

  if (!submission || (submission.userId !== user.id && user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const initialValues = submission.values.reduce<Record<string, any>>((acc, value) => {
    acc[value.fieldId] = value.valueJson;
    return acc;
  }, {});

  const initialFiles = submission.files.reduce<Record<string, { id: string; originalName: string; storagePath: string }[]>>(
    (acc, file) => {
      acc[file.fieldId] = acc[file.fieldId] ?? [];
      acc[file.fieldId].push({ id: file.id, originalName: file.originalName, storagePath: file.storagePath });
      return acc;
    },
    {}
  );

  return (
    <FormRunner
      formId={submission.formId}
      formSlug={submission.form.slug}
      formName={submission.form.name}
      userId={user.id}
      fields={submission.form.fields}
      submissionId={submission.id}
      initialValues={initialValues}
      initialFiles={initialFiles}
    />
  );
}
