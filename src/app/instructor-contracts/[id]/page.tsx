import { redirect } from "next/navigation";
import { getCurrentCounselor } from "@/lib/current-counselor";
import { EditInstructorContract } from "./EditInstructorContract";

export const dynamic = "force-dynamic";

export default async function EditInstructorContractPage({ params }: { params: Promise<{ id: string }> }) {
  const actingCounselor = await getCurrentCounselor();
  if (!actingCounselor?.isAdmin) redirect("/");
  const { id } = await params;

  return <EditInstructorContract id={id} />;
}
