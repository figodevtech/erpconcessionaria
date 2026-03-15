"use client";

import { Toaster } from "sonner";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function RouteAwareToaster() {
  const pathname = usePathname();

  useEffect(() => {
    // Dismiss all toasts on route change to keep the UI clean
    toast.dismiss();
  }, [pathname]);

  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      expand={false}
      theme="system"
    />
  );
}
