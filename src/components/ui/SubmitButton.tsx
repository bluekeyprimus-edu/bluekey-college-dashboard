"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import { useToast } from "./Toast";

type SubmitButtonVariant = "primary" | "secondary" | "secondary-sm" | "inline" | "inline-sm" | "ghost-danger" | "ghost-danger-sm";

const VARIANT_CLASS: Record<SubmitButtonVariant, string> = {
  primary: "rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800",
  secondary: "rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50",
  "secondary-sm": "rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-50",
  inline: "rounded-md border border-navy-200 px-3 py-1 text-xs font-medium text-navy-700 hover:bg-navy-50",
  "inline-sm": "rounded-md border border-navy-200 px-2.5 py-1 text-xs font-medium text-navy-700 hover:bg-navy-50",
  "ghost-danger": "text-xs font-medium text-rose-500 hover:text-rose-700",
  "ghost-danger-sm": "text-[11px] font-medium text-rose-500 hover:text-rose-700",
};

/**
 * Drop-in replacement for <button type="submit">. Disables itself and
 * swaps in a pending label while the enclosing form's Server Action is
 * in flight, so a slow response (or an impatient extra click) can't fire
 * the action twice — e.g. creating the same student record more than once.
 * Must be rendered inside the <form> it submits (useFormStatus reads the
 * nearest parent form's pending state), and the form's `action` must be
 * a Server Action (a plain `method="get"` search form doesn't have a
 * pending state for this to read — leave those as plain <button>s).
 *
 * Pass `toastMessage` to also pop a confirmation toast ("저장되었습니다",
 * "삭제되었습니다", ...) the moment the action finishes — detected as the
 * pending→not-pending transition, so no change to the action itself is
 * needed. Omit it for forms that redirect on success (the page navigates
 * away before the transition is observed; use ToastFlash on the
 * destination page instead) or for actions where a toast would just be
 * noise (e.g. applying a search filter).
 */
export function SubmitButton({
  label,
  pendingLabel,
  toastMessage,
  toastTone = "success",
  variant = "primary",
  className,
}: {
  label: string;
  pendingLabel?: string;
  toastMessage?: string;
  toastTone?: "success" | "error";
  variant?: SubmitButtonVariant;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (wasPending.current && !pending && toastMessage) {
      showToast(toastMessage, toastTone);
    }
    wasPending.current = pending;
  }, [pending, toastMessage, toastTone, showToast]);

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(VARIANT_CLASS[variant], "disabled:cursor-not-allowed disabled:opacity-60", className)}
    >
      {pending ? (pendingLabel ?? "처리 중...") : label}
    </button>
  );
}
