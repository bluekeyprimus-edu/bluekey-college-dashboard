import { redirect } from "next/navigation";
import { getCurrentCounselor } from "@/lib/current-counselor";
import { InstructorContractsList } from "./InstructorContractsList";

export const dynamic = "force-dynamic";

export default async function InstructorContractsPage() {
  const actingCounselor = await getCurrentCounselor();
  if (!actingCounselor?.isAdmin) redirect("/");

  return <InstructorContractsList />;
}
