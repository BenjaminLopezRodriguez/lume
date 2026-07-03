import { type NextRequest, NextResponse } from "next/server";
import { lte } from "drizzle-orm";
import { db } from "@/server/db";
import { webPresences } from "@/server/db/schema";
import { resend } from "@/server/resend";
import { env } from "@/env";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json({ skipped: "no resend key" });
  }

  const due = await db.query.webPresences.findMany({
    where: (row, { and, lte: lteWhere, isNotNull: isNotNullWhere }) =>
      and(
        isNotNullWhere(row.dnsReminderEmail),
        lteWhere(row.dnsReminderAt, new Date()),
      ),
  });

  if (due.length === 0) return NextResponse.json({ sent: 0 });

  const results = await Promise.allSettled(
    due.map(async (presence) => {
      const business = await db.query.businesses.findFirst({
        where: (row, { eq }) => eq(row.id, presence.businessId),
      });

      await resend!.emails.send({
        from: "Lume <no-reply@onlume.co>",
        to: [presence.dnsReminderEmail!],
        subject: `DNS reminder — verify ${presence.customDomain ?? "your domain"}`,
        html: `
          <p>Hey — it's been about an hour since you set up DNS for <strong>${presence.customDomain ?? "your domain"}</strong>${business ? ` on ${business.name}` : ""}.</p>
          <p>Head back to Lume and click <strong>Verify DNS</strong> to confirm your domain is live.</p>
          <p><a href="https://www.onlume.co/m/presence/web">Check now →</a></p>
          <p style="color:#999;font-size:12px">You requested this reminder while setting up a custom domain.</p>
        `,
      });

      await db
        .update(webPresences)
        .set({ dnsReminderEmail: null, dnsReminderAt: null, updatedAt: new Date() })
        .where(lte(webPresences.dnsReminderAt, new Date()));
    }),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ sent, failed });
}
