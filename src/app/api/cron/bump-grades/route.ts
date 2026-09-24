import { NextRequest, NextResponse } from "next/server";
import { bumpGradesForNewSchoolYear } from "@/lib/grade-bump";

// Vercel Cron hits this once a year (see vercel.json — Sept 1, 00:00 UTC /
// 09:00 KST) with an Authorization header it sets from CRON_SECRET. Anyone
// else calling this without that header gets rejected.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await bumpGradesForNewSchoolYear();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
