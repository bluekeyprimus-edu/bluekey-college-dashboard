import { redirect } from "next/navigation";
import { getCurrentCounselor } from "@/lib/current-counselor";
import { EditConsultingContract } from "./EditConsultingContract";

export const dynamic = "force-dynamic";

export default async function EditConsultingContractPage({ params }: { params: Promise<{ id: string }> }) {
  const actingCounselor = await getCurrentCounselor();
  if (!actingCounselor?.isAdmin) redirect("/");
  const { id } = await params;

  return <EditConsultingContract id={id} />;
}
