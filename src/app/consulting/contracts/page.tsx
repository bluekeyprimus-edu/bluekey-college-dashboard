import { redirect } from "next/navigation";
import { getCurrentCounselor } from "@/lib/current-counselor";
import { ConsultingContractsList } from "./ConsultingContractsList";

export const dynamic = "force-dynamic";

export default async function ConsultingContractsPage() {
  const actingCounselor = await getCurrentCounselor();
  if (!actingCounselor?.isAdmin) redirect("/");

  return <ConsultingContractsList />;
}
