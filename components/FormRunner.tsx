"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SignaturePad from "./SignaturePad";

export type RunnerField = {
  id: string;
  keyName: string;
  label: string;
  type: string;
  isRequired: boolean;
  placeholder?: string | null;
  helpText?: string | null;
  configJson?: any;
  conditional?: any;
};

type FormRunnerProps = {
  formId: string;
  formSlug: string;
  formName: string;
  userId: string;
  fields: RunnerField[];
  initialValues?: Record<string, any>;
  submissionId?: string | null;
  initialFiles?: Record<string, { id: string; originalName: string; storagePath: string }[]>;
};

const ONE_GB = 1024 * 1024 * 1024;

export default function FormRunner({
  formId,
  formSlug,
  formName,
  userId,
  fields,
  initialValues = {},
  submissionId,
  initialFiles = {}
}: FormRunnerProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [signatureData, setSignatureData] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);

  const draftKey = useMemo(() => {
    return submissionId ? `draft:${userId}:${submissionId}` : `draft:${userId}:${formSlug}`;
  }, [formSlug, submissionId, userId]);

  useEffect(() => {
    const draft = localStorage.getItem(draftKey);
    const parsedDraft = draft ? JSON.parse(draft) : {};
    setValues({ ...initialValues, ...parsedDraft });
  }, [draftKey, initialValues]);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify(values));
    }, 400);
    return () => window.clearTimeout(handler);
  }, [draftKey, values]);

  const onChangeValue = (fieldId: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const onChangeFiles = (fieldId: string, fileList: FileList | null) => {
    const fileArray = fileList ? Array.from(fileList) : [];
    const total = fileArray.reduce((sum, file) => sum + file.size, 0);
    const maxBytes = fields.find((field) => field.id === fieldId)?.configJson?.maxBytes ?? ONE_GB;
    if (total > maxBytes) {
      setError("La taille totale dépasse la limite de 1GB pour ce champ.");
      return;
    }
    setFiles((prev) => ({ ...prev, [fieldId]: fileArray }));
  };

  const shouldShowField = useCallback(
    (field: RunnerField) => {
      if (!field.conditional) return true;
      const { fieldId, value, action } = field.conditional as {
        fieldId: string;
        value: any;
        action: "show" | "hide";
      };
      const match = values[fieldId] === value;
      if (action === "show") return match;
      if (action === "hide") return !match;
      return true;
    },
    [values]
  );

  const handleReset = () => {
    const confirmed = window.confirm("Réinitialiser tous les champs ?");
    if (!confirmed) return;
    localStorage.removeItem(draftKey);
    setValues({});
    setFiles({});
    setSignatureData({});
  };

  const handleSubmit = async () => {
    setError(null);
    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("formId", formId);
    if (submissionId) {
      formData.append("submissionId", submissionId);
    }
    formData.append("values", JSON.stringify(values));

    Object.entries(files).forEach(([fieldId, fileList]) => {
      fileList.forEach((file) => {
        formData.append(`files:${fieldId}`, file);
      });
    });

    Object.entries(signatureData).forEach(([fieldId, dataUrl]) => {
      if (!dataUrl) return;
      const base64 = dataUrl.split(",")[1];
      const binary = atob(base64);
      const buffer = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        buffer[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([buffer], { type: "image/png" });
      formData.append(`signature:${fieldId}`, new File([blob], "signature.png", { type: "image/png" }));
    });

    fields
      .filter((field) => field.type === "signature")
      .forEach((field) => {
        if (signatureData[field.id]) return;
        const dataUrl = values[field.id];
        if (!dataUrl || typeof dataUrl !== "string") return;
        const base64 = dataUrl.split(",")[1];
        if (!base64) return;
        const binary = atob(base64);
        const buffer = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          buffer[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([buffer], { type: "image/png" });
        formData.append(`signature:${field.id}`, new File([blob], "signature.png", { type: "image/png" }));
      });

    const xhr = new XMLHttpRequest();
    xhr.open(submissionId ? "PUT" : "POST", submissionId ? `/api/submissions/${submissionId}` : "/api/submissions");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        localStorage.removeItem(draftKey);
        const response = JSON.parse(xhr.responseText);
        window.location.href = `/submissions/${response.id}`;
      } else {
        const response = JSON.parse(xhr.responseText || "{}");
        setError(response.message || "Erreur lors de l'envoi");
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError("Erreur réseau");
    };

    xhr.send(formData);
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{formName}</h1>
          <p className="text-sm text-slate-500">Remplissez le formulaire ci-dessous.</p>
        </div>
        <button type="button" className="bg-slate-200 text-slate-700 hover:bg-slate-300" onClick={handleReset}>
          Réinitialiser
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {fields.map((field) => {
          if (!shouldShowField(field)) return null;
          const value = values[field.id] ?? "";
          const fieldOptions = field.configJson?.options ?? [];
          const minLength = field.configJson?.minLength;
          const maxLength = field.configJson?.maxLength;

          if (field.type === "hidden") {
            return <input key={field.id} type="hidden" value={value} />;
          }

          return (
            <div key={field.id} className="flex flex-col gap-2">
              <label>
                {field.label}
                {field.isRequired ? <span className="text-red-500"> *</span> : null}
              </label>
              {field.type === "text" || field.type === "date" || field.type === "time" || field.type === "datetime" ? (
                <input
                  type={field.type === "datetime" ? "datetime-local" : field.type}
                  placeholder={field.placeholder ?? ""}
                  required={field.isRequired}
                  minLength={typeof minLength === "number" ? minLength : undefined}
                  maxLength={typeof maxLength === "number" ? maxLength : undefined}
                  value={value}
                  onChange={(event) => onChangeValue(field.id, event.target.value)}
                />
              ) : null}
              {field.type === "textarea" ? (
                <textarea
                  placeholder={field.placeholder ?? ""}
                  required={field.isRequired}
                  minLength={typeof minLength === "number" ? minLength : undefined}
                  maxLength={typeof maxLength === "number" ? maxLength : undefined}
                  value={value}
                  onChange={(event) => onChangeValue(field.id, event.target.value)}
                />
              ) : null}
              {field.type === "select" ? (
                <select value={value} onChange={(event) => onChangeValue(field.id, event.target.value)}>
                  <option value="">Sélectionner...</option>
                  {fieldOptions.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : null}
              {field.type === "multi-select" || field.type === "checkbox" ? (
                <div className="flex flex-col gap-2">
                  {fieldOptions.map((option: string) => {
                    const selected: string[] = value || [];
                    const checked = selected.includes(option);
                    return (
                      <label key={option} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? selected.filter((item) => item !== option)
                              : [...selected, option];
                            onChangeValue(field.id, next);
                          }}
                        />
                        {option}
                      </label>
                    );
                  })}
                </div>
              ) : null}
              {field.type === "radio" ? (
                <div className="flex flex-col gap-2">
                  {fieldOptions.map((option: string) => (
                    <label key={option} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={field.id}
                        checked={value === option}
                        onChange={() => onChangeValue(field.id, option)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              ) : null}
              {field.type === "address" ? (
                <input
                  type="text"
                  placeholder={field.placeholder ?? "Adresse"}
                  value={value}
                  onChange={(event) => onChangeValue(field.id, event.target.value)}
                />
              ) : null}
              {field.type === "media" ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    capture="environment"
                    onChange={(event) => onChangeFiles(field.id, event.target.files)}
                  />
                  {initialFiles[field.id]?.length ? (
                    <div className="text-xs text-slate-500">
                      Fichiers existants: {initialFiles[field.id].length}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {field.type === "signature" ? (
                <SignaturePad
                  initialDataUrl={typeof value === "string" ? value : null}
                  onChange={(dataUrl) => {
                    setSignatureData((prev) => ({ ...prev, [field.id]: dataUrl }));
                    onChangeValue(field.id, dataUrl);
                  }}
                />
              ) : null}
              {field.helpText ? <p className="text-xs text-slate-500">{field.helpText}</p> : null}
            </div>
          );
        })}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {uploading ? (
        <div className="mt-4">
          <div className="mb-2 text-sm text-slate-600">Upload en cours...</div>
          <div className="h-2 w-full rounded bg-slate-200">
            <div className="h-2 rounded bg-blue-600" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      ) : null}
      <button
        type="button"
        className="mt-6 w-full bg-blue-600 text-white hover:bg-blue-700"
        onClick={handleSubmit}
        disabled={uploading}
      >
        {submissionId ? "Mettre à jour la soumission" : "Envoyer"}
      </button>
    </div>
  );
}
