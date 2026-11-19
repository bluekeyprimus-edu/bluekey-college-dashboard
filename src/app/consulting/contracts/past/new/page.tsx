import { redirect } from "next/navigation";
import { getCurrentCounselor } from "@/lib/current-counselor";
import { getStudents } from "@/lib/data";
import { NewPastConsultingContract } from "./NewPastConsultingContract";

export const dynamic = "force-dynamic";

export default async function NewPastConsultingContractPage() {
  const actingCounselor = await getCurrentCounselor();
  if (!actingCounselor?.isAdmin) redirect("/");

  const students = await getStudents();

  return <NewPastConsultingContract students={students} />;
}
