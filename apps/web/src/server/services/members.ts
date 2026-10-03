import bcrypt from "bcryptjs";
import { prisma, type Role } from "@club/db";
import { UserError } from "../errors";

export async function createMember(input: {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  skillLevel?: number;
  role?: Role;
}) {
  await assertEmailFree(input.email);
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      skillLevel: input.skillLevel ?? 5,
      passwordHash: await bcrypt.hash(input.password, 10),
      role: input.role ?? (isBootstrapAdmin(input.email) ? "ADMIN" : "MEMBER"),
    },
  });
}

async function assertEmailFree(email: string, exceptUserId?: string) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists && exists.id !== exceptUserId) throw new UserError("errors.emailTaken");
}

/** Emails listed in ADMIN_EMAILS become admins when they sign up, so a new deployment needs no seed step. */
function isBootstrapAdmin(email: string) {
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
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
  input: {
    userId: string;
    name: string;
    email: string;
    phone?: string | null;
    skillLevel: number;
    role: Role;
    isActive: boolean;
  },
) {
  const target = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!target) throw new UserError("errors.memberNotFound");
  await assertEmailFree(input.email, input.userId);

  const losesAdmin = target.role === "ADMIN" && (input.role !== "ADMIN" || !input.isActive);
  if (losesAdmin) {
    const admins = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
    if (admins <= 1) throw new UserError("errors.needOneAdmin");
  }
  if (input.userId === actorId && !input.isActive) throw new UserError("errors.cannotDeactivateSelf");

  return prisma.user.update({
    where: { id: input.userId },
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      skillLevel: input.skillLevel,
      role: input.role,
      isActive: input.isActive,
    },
  });
}

export async function getMemberDetail(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const [registrations, matches] = await Promise.all([
    prisma.registration.count({ where: { userId, status: "CONFIRMED" } }),
    prisma.matchPlayer.count({ where: { userId, match: { round: { status: { in: ["PUBLISHED", "DONE"] } } } } }),
  ]);
  return { user, registrations, matches };
}

/** Admin: sets a new password for a member, e.g. when they forget theirs. */
export async function resetPassword(userId: string, newPassword: string) {
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new UserError("errors.wrongCurrentPassword");
  }
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
}
