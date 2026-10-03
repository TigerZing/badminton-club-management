import bcrypt from "bcryptjs";
import { prisma, type Role } from "@club/db";
import { UserError } from "../errors";

export async function createMember(input: { name: string; email: string; password: string }) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw new UserError("An account with this email already exists");
  return prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, 10) },
  });
}

export function updateProfile(userId: string, input: { name: string; phone?: string | null }) {
  return prisma.user.update({ where: { id: userId }, data: { name: input.name, phone: input.phone ?? null } });
}

export function listMembers(query?: string) {
  const q = query?.trim();
  return prisma.user.findMany({
    where: q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
      : undefined,
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}

export async function updateMember(
  actorId: string,
  input: { userId: string; skillLevel: number; role: Role; isActive: boolean },
) {
  const target = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!target) throw new UserError("Member not found");

  const losesAdmin = target.role === "ADMIN" && (input.role !== "ADMIN" || !input.isActive);
  if (losesAdmin) {
    const admins = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
    if (admins <= 1) throw new UserError("The club needs at least one active admin");
  }
  if (input.userId === actorId && !input.isActive) throw new UserError("You cannot deactivate yourself");

  return prisma.user.update({
    where: { id: input.userId },
    data: { skillLevel: input.skillLevel, role: input.role, isActive: input.isActive },
  });
}
