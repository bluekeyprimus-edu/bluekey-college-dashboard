"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "./Toast";

/**
 * Shows a confirmation toast after a redirect-on-success Server Action
 * (createStudent, updateStudent, ...) — those finish by navigating to a
 * new page, so the pending→not-pending toast trick SubmitButton uses
 * can't fire there (the old page is already gone). Instead the action
 * redirects to `${path}?${param}=1`, and this component — rendered on
 * the destination page — pops the toast on mount and then strips the
 * param from the URL so a refresh doesn't show it again.
 */
export function ToastFlash({ param, message }: { param: string; message: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  useEffect(() => {
    if (!searchParams.get(param)) return;
    showToast(message);
    const params = new URLSearchParams(searchParams.toString());
    params.delete(param);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchParams, param, message, router, pathname, showToast]);

  return null;
}
