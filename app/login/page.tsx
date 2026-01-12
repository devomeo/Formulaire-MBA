"use client";

import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      window.location.href = "/dashboard";
      return;
    }

    const data = await response.json().catch(() => ({ message: "Erreur" }));
    setError(data.message || "Erreur de connexion");
    setLoading(false);
  };

  return (
    <div className="mx-auto mt-16 max-w-md rounded-lg bg-white p-8 shadow">
      <h1 className="mb-4 text-xl font-semibold">Connexion</h1>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password">Mot de passe</label>
          <input id="password" name="password" type="password" required />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="bg-blue-600 text-white hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
