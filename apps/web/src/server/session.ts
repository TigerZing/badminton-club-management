import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@club/db";
import { auth } from "./auth";

/** The signed-in user, read fresh from the database so role changes apply at once. */
export const currentUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id } });
  return user?.isActive ? user : null;
});

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/events");
  return user;
}
