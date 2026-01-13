import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      displayName: "Admin"
    }
  });

  const form = await prisma.form.upsert({
    where: { slug: "visite-technique" },
    update: {},
    create: {
      name: "Visite Technique",
      slug: "visite-technique",
      description: "Formulaire de visite technique",
      isPublished: true,
      createdBy: admin.id,
      fields: {
        create: [
          {
            keyName: "nom",
            label: "Nom",
            type: "text",
            sortOrder: 1,
            isRequired: true,
            placeholder: "Votre nom"
          },
          {
            keyName: "date",
            label: "Date de visite",
            type: "date",
            sortOrder: 2,
            isRequired: true
          },
          {
            keyName: "photos",
            label: "Photos",
            type: "media",
            sortOrder: 3,
            isRequired: false,
            configJson: {
              maxBytes: 1073741824
            }
          },
          {
            keyName: "signature",
            label: "Signature",
            type: "signature",
            sortOrder: 4,
            isRequired: true
          }
        ]
      }
    }
  });

  console.log("Seed complete", { admin: admin.email, form: form.slug });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
