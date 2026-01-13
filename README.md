# Formulaire-MBA

MVP fullstack Next.js pour créer des formulaires dynamiques, collecter des soumissions, gérer les fichiers médias, et capturer des signatures manuscrites. L'authentification est basée sur JWT stocké en cookie httpOnly.

## Fonctionnalités

- Authentification email + mot de passe avec rôles ADMIN/USER.
- Back-office admin pour créer/modifier/publier des formulaires et ajouter des champs.
- Remplissage des formulaires par les utilisateurs avec édition des soumissions.
- Gestion des fichiers images/vidéos (multi-upload) et signature manuscrite.
- Brouillon localStorage pour éviter la perte de données en cas de rechargement.
- API sécurisée + protection RBAC.

## Prérequis

- Node.js 18+
- MySQL 8+

## Installation locale

1. Installer les dépendances :

```bash
npm install
```

2. Créer un fichier `.env` à la racine :

```bash
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/formulaire"
AUTH_SECRET="change-me"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="admin1234"
```

3. Appliquer les migrations et générer le client Prisma :

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Seed initial (admin + formulaire exemple) :

```bash
npm run seed
```

5. Démarrer en local :

```bash
npm run dev
```

## Démarrage local avec Docker (MySQL inclus)

Ce mode démarre automatiquement MySQL + l'app, applique les migrations Prisma, puis exécute le seed.

```bash
docker compose up --build
```

Ensuite ouvrir `http://localhost:3000`.

Identifiants admin par défaut :
- Email : `admin@example.com`
- Mot de passe : `admin1234`

Variables utiles :
- Vous pouvez copier `docker/.env.example` vers `.env` et ajuster les valeurs.
- Sur Windows, si Prisma échoue dans le container, utilisez le Dockerfile fourni (base Debian + OpenSSL) et relancez `docker compose up --build`.

## Production

1. Build :

```bash
npm run build
npm run start
```

2. Variables d'environnement :

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_BASE_URL` (optionnel, pour les redirections)

3. Migrations :

```bash
npm run prisma:migrate
```

4. Uploads & serveur :

- Configurer un volume persistant pour `./uploads`.
- Ajuster les limites d'upload côté reverse proxy (ex: Nginx `client_max_body_size 1g`).
- Configurer HTTPS et cookies sécurisés.

## Notes techniques

- Les fichiers sont stockés sur disque dans `./uploads/{formSlug}/{submissionId}`.
- Les champs médias/signatures utilisent `submission_files` et les autres valeurs `submission_values`.
- Accès aux fichiers via `/api/files/[...path]` avec contrôle d'accès.
