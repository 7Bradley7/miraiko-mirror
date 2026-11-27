// Test data for local development and CI. Never run against production.
// Usage: npm run db:seed (Prisma loads the .env* files through prisma.config.ts).
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL must be set to seed the database.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// Test accounts with a verified email, to log in locally without sending emails.
const TEST_PASSWORD = "miraiko-test-password";
const testUsers = [
  { email: "aiko@example.com", name: "Aiko" },
  { email: "kenji@example.com", name: "Kenji" },
];

async function main() {
  const passwordHash = await hashPassword(TEST_PASSWORD);

  for (const { email, name } of testUsers) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, emailVerified: true },
      create: { email, name, emailVerified: true },
    });

    // Better Auth stores the hashed password on a "credential" account.
    await prisma.account.deleteMany({ where: { userId: user.id, providerId: "credential" } });
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: passwordHash,
      },
    });
  }
  console.log(`Seeded ${testUsers.length} test users (password: ${TEST_PASSWORD}).`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
