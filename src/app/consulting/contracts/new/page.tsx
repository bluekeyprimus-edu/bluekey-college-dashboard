import { redirect } from "next/navigation";
import { getCurrentCounselor } from "@/lib/current-counselor";
import { NewConsultingContract } from "./NewConsultingContract";

export const dynamic = "force-dynamic";

export default async function NewConsultingContractPage() {
  const actingCounselor = await getCurrentCounselor();
  if (!actingCounselor?.isAdmin) redirect("/");

  return <NewConsultingContract />;
}
