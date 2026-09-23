import { getRosterRows } from "@/lib/data";
import { StudentsTable } from "@/components/students/StudentsTable";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const rows = await getRosterRows();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy-900">Students</h1>
        <p className="mt-1 text-sm text-navy-500">Full roster — sort, filter, and drill into any student profile.</p>
      </div>
      <StudentsTable rows={rows} />
    </div>
  );
}
