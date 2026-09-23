import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-navy-100 bg-white shadow-[0_1px_2px_rgba(15,28,48,0.06)]", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("border-b border-navy-100 px-5 py-4", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn("font-serif text-lg font-semibold text-navy-900", className)}>{children}</h3>;
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}
