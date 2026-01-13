"use client";

import { useState } from "react";

export default function NewFormPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        slug: formData.get("slug"),
        description: formData.get("description"),
        isPublished: formData.get("isPublished") === "on"
      })
    });

    if (response.ok) {
      const data = await response.json();
      window.location.href = `/admin/forms/${data.id}/edit`;
      return;
    }

    const payload = await response.json().catch(() => ({ message: "Erreur" }));
    setError(payload.message || "Erreur");
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-xl rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-xl font-semibold">Créer un formulaire</h1>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1">
          <label htmlFor="name">Nom</label>
          <input id="name" name="name" required />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="slug">Slug</label>
          <input id="slug" name="slug" required />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isPublished" /> Publier
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button className="bg-blue-600 text-white" disabled={loading}>
          {loading ? "Création..." : "Créer"}
        </button>
      </form>
    </div>
  );
}
