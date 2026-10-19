import { getRosterRows } from "@/lib/data";
import { getCounselorRestriction } from "@/lib/current-counselor";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [rows, restricted] = await Promise.all([getRosterRows(), getCounselorRestriction()]);

  return <DashboardOverview rows={rows} restricted={!!restricted} />;
}
