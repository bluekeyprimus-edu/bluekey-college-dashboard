import { redirect } from "next/navigation";
import { getCurrentCounselor } from "@/lib/current-counselor";
import { NewInstructorContract } from "./NewInstructorContract";

export const dynamic = "force-dynamic";

export default async function NewInstructorContractPage() {
  const actingCounselor = await getCurrentCounselor();
  if (!actingCounselor?.isAdmin) redirect("/");

  return <NewInstructorContract />;
}
