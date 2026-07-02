import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export async function getSessionUserId() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  return user?.id ?? null;
}

export async function ensureUser() {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();
  if (!kindeUser?.id) return null;

  const email = kindeUser.email;
  if (!email) return null;

  const name =
    [kindeUser.given_name, kindeUser.family_name].filter(Boolean).join(" ") ||
    kindeUser.username ||
    null;

  await db
    .insert(users)
    .values({
      id: kindeUser.id,
      email,
      name,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: { email, name },
    });

  return kindeUser.id;
}
