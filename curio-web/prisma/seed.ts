import "dotenv/config";


import { PrismaClient } from "@prisma/client";


// IMPORTANT: this import must be server-safe.
// If PROJECTS is in a file that imports React/components, move it to a plain .ts data file.
import { PROJECTS } from "../app/data/projects";

const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!url) throw new Error("Missing DATABASE_URL/DIRECT_URL");


const prisma = new PrismaClient();

async function main() {
  for (const p of PROJECTS) {
    await prisma.project.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        description: p.description,
        category: p.category ?? null,
        hours: p.hours ?? null,
        image: p.image ?? null,
        available: !!p.available,
        sortOrder: typeof (p as any).sortOrder === "number" ? (p as any).sortOrder : 0,
        difficulties: (p as any).difficulties ?? null,
      },
      create: {
        slug: p.slug,
        title: p.title,
        description: p.description,
        category: p.category ?? null,
        hours: p.hours ?? null,
        image: p.image ?? null,
        available: !!p.available,
        sortOrder: typeof (p as any).sortOrder === "number" ? (p as any).sortOrder : 0,
        difficulties: (p as any).difficulties ?? null,
      },
    });
  }

  console.log(`Seeded/updated ${PROJECTS.length} projects`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });