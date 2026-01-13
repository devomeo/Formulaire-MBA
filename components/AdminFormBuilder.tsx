"use client";

import { useState } from "react";

type Field = {
  id: string;
  keyName: string;
  label: string;
  type: string;
  sortOrder: number;
  isRequired: boolean;
  placeholder?: string | null;
  helpText?: string | null;
  configJson?: any;
  conditional?: any;
};

type AdminFormBuilderProps = {
  formId: string;
  initialFields: Field[];
  form: {
    name: string;
    slug: string;
    description: string | null;
    isPublished: boolean;
  };
};

const FIELD_TYPES = [
  "text",
  "textarea",
  "select",
  "multi-select",
  "checkbox",
  "radio",
  "date",
  "time",
  "datetime",
  "address",
  "hidden",
  "media",
  "signature"
];

export default function AdminFormBuilder({ formId, initialFields, form }: AdminFormBuilderProps) {
  const [fields, setFields] = useState<Field[]>(initialFields);
  const [error, setError] = useState<string | null>(null);

  const handleFormUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/forms/${formId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        slug: formData.get("slug"),
        description: formData.get("description"),
        isPublished: formData.get("isPublished") === "on"
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: "Erreur" }));
      setError(payload.message || "Erreur");
    }
  };

  const handleAddField = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const options = formData.get("options")?.toString().split(",").map((item) => item.trim()).filter(Boolean) ?? [];

    const conditionalFieldId = formData.get("conditionalFieldId")?.toString() || "";
    const conditionalValue = formData.get("conditionalValue")?.toString() || "";
    const conditionalAction = formData.get("conditionalAction")?.toString() || "show";

    const response = await fetch(`/api/forms/${formId}/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyName: formData.get("keyName"),
        label: formData.get("label"),
        type: formData.get("type"),
        sortOrder: Number(formData.get("sortOrder")),
        isRequired: formData.get("isRequired") === "on",
        placeholder: formData.get("placeholder"),
        helpText: formData.get("helpText"),
        configJson: {
          options,
          minLength: formData.get("minLength") ? Number(formData.get("minLength")) : undefined,
          maxLength: formData.get("maxLength") ? Number(formData.get("maxLength")) : undefined,
          maxBytes: 1073741824
        },
        conditional: conditionalFieldId
          ? {
              fieldId: conditionalFieldId,
              value: conditionalValue,
              action: conditionalAction
            }
          : null
      })
    });

    if (response.ok) {
      const payload = await response.json();
      setFields((prev) => [...prev, payload]);
      event.currentTarget.reset();
      return;
    }

    const payload = await response.json().catch(() => ({ message: "Erreur" }));
    setError(payload.message || "Erreur");
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Informations du formulaire</h2>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleFormUpdate}>
          <div className="flex flex-col gap-1">
            <label htmlFor="name">Nom</label>
            <input id="name" name="name" defaultValue={form.name} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="slug">Slug</label>
            <input id="slug" name="slug" defaultValue={form.slug} />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" defaultValue={form.description ?? ""} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPublished" defaultChecked={form.isPublished} /> Publier
          </label>
          <button className="bg-blue-600 text-white" type="submit">
            Mettre à jour
          </button>
        </form>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Champs</h2>
        <div className="flex flex-col gap-3">
          {fields.map((field) => (
            <div key={field.id} className="rounded border p-3 text-sm">
              <div className="font-semibold">{field.label}</div>
              <div className="text-slate-500">{field.type} • order {field.sortOrder}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Ajouter un champ</h2>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleAddField}>
          <div className="flex flex-col gap-1">
            <label htmlFor="label">Label</label>
            <input id="label" name="label" required />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="keyName">Clé unique</label>
            <input id="keyName" name="keyName" required />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="type">Type</label>
            <select id="type" name="type" defaultValue="text">
              {FIELD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="sortOrder">Ordre</label>
            <input id="sortOrder" name="sortOrder" type="number" defaultValue={fields.length + 1} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="placeholder">Placeholder</label>
            <input id="placeholder" name="placeholder" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="helpText">Texte d'aide</label>
            <input id="helpText" name="helpText" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="options">Options (séparées par virgule)</label>
            <input id="options" name="options" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isRequired" /> Requis
          </label>
          <div className="flex flex-col gap-1">
            <label htmlFor="minLength">Longueur min</label>
            <input id="minLength" name="minLength" type="number" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="maxLength">Longueur max</label>
            <input id="maxLength" name="maxLength" type="number" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="conditionalFieldId">Champ conditionnel</label>
            <select id="conditionalFieldId" name="conditionalFieldId" defaultValue="">
              <option value="">Aucun</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="conditionalValue">Valeur attendue</label>
            <input id="conditionalValue" name="conditionalValue" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="conditionalAction">Action</label>
            <select id="conditionalAction" name="conditionalAction" defaultValue="show">
              <option value="show">Afficher</option>
              <option value="hide">Masquer</option>
            </select>
          </div>
          <button type="submit" className="bg-blue-600 text-white md:col-span-2">
            Ajouter
          </button>
        </form>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </section>
    </div>
  );
}
