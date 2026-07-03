import "server-only";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";

import { env } from "@/env";
import { seedForUser } from "@/server/db/seed";

export async function GET() {
  if (env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await seedForUser(user.id);

  return NextResponse.json({ ok: true, userId: user.id });
}
