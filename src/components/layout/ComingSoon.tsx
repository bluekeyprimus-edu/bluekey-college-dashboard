import Image from "next/image";
import { Card, CardBody } from "@/components/ui/Card";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy-900">{title}</h1>
        <p className="mt-1 text-sm text-navy-500">{description}</p>
      </div>
      <Card>
        <CardBody className="py-16 text-center">
          <Image src="/logo.png" alt="BlueKey" width={48} height={48} className="mx-auto mb-3 h-12 w-12 rounded-full object-cover" />
          <p className="text-sm font-medium text-navy-600">This module is being built next.</p>
          <p className="mt-1 text-xs text-navy-400">The data structure already supports it — the UI is coming in the next pass.</p>
        </CardBody>
      </Card>
    </div>
  );
}
