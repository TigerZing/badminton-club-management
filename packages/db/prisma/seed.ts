import bcrypt from "bcryptjs";
import { prisma } from "../src/index";

// Creates the first admin from SEED_ADMIN_* env vars. Pass --demo to also add
// sample members, a venue and an open event for local testing.
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD");

  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: {
      email,
      name: process.env.SEED_ADMIN_NAME || "Club Admin",
      passwordHash: await bcrypt.hash(password, 10),
      role: "ADMIN",
      skillLevel: 6,
    },
  });
  console.log(`Admin ready: ${email}`);

  if (!process.argv.includes("--demo")) return;

  const hash = await bcrypt.hash("password123", 10);
  for (let i = 1; i <= 20; i++) {
    await prisma.user.upsert({
      where: { email: `player${i}@example.com` },
      update: {},
      create: { email: `player${i}@example.com`, name: `Player ${i}`, passwordHash: hash, skillLevel: 1 + (i % 10) },
    });
  }

  const venue =
    (await prisma.venue.findFirst({ where: { name: "Demo Sports Hall" } })) ??
    (await prisma.venue.create({
      data: {
        name: "Demo Sports Hall",
        address: "123 Example Street",
        courts: { create: [1, 2, 3, 4].map((n) => ({ name: `Court ${n}` })) },
      },
    }));

  const start = new Date();
  start.setUTCDate(start.getUTCDate() + ((6 - start.getUTCDay() + 7) % 7 || 7));
  start.setUTCHours(11, 0, 0, 0); // 18:00 in Vietnam
  const event = await prisma.event.create({
    data: {
      title: "Saturday Club Night",
      venueId: venue.id,
      startsAt: start,
      endsAt: new Date(start.getTime() + 3 * 3600_000),
      courtCount: 4,
      maxPlayers: 24,
      registrationDeadline: new Date(start.getTime() - 2 * 3600_000),
      status: "OPEN",
    },
  });
  const players = await prisma.user.findMany({ where: { email: { startsWith: "player" } } });
  for (const p of players) {
    await prisma.registration.create({ data: { eventId: event.id, userId: p.id, status: "CONFIRMED" } });
  }
  console.log(`Demo data ready: 20 players (password123), event ${event.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
