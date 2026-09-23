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
          <p className="text-sm font-medium text-navy-600">이 메뉴는 다음 단계에서 만들 예정이에요.</p>
          <p className="mt-1 text-xs text-navy-400">데이터 구조는 이미 준비되어 있고, 화면(UI)은 다음 작업에서 이어서 만들 거예요.</p>
        </CardBody>
      </Card>
    </div>
  );
}
