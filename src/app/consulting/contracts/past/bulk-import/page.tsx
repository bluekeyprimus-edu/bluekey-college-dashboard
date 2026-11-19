import { redirect } from "next/navigation";
import { getCurrentCounselor } from "@/lib/current-counselor";
import { getStudents } from "@/lib/data";
import { BulkPastContractImport } from "./BulkPastContractImport";

export const dynamic = "force-dynamic";

export default async function BulkPastContractImportPage() {
  const actingCounselor = await getCurrentCounselor();
  if (!actingCounselor?.isAdmin) redirect("/");

  const students = await getStudents();

  return <BulkPastContractImport students={students} />;
}
