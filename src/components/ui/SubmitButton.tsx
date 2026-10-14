"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";

/**
 * Drop-in replacement for <button type="submit">. Disables itself and
 * swaps in a pending label while the enclosing form's Server Action is
 * in flight, so a slow response (or an impatient extra click) can't fire
 * the action twice — e.g. creating the same student record more than once.
 * Must be rendered inside the <form> it submits (useFormStatus reads the
 * nearest parent form's pending state).
 */
export function SubmitButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {pending ? (pendingLabel ?? "처리 중...") : label}
    </button>
  );
}
