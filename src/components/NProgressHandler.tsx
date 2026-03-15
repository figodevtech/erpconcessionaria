"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

// Configure nprogress
NProgress.configure({ showSpinner: false });

export default function NProgressHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Start progress bar on interaction could be handled here if needed,
    // but for simple path changes we just finish it.
    NProgress.done();
    
    return () => {
      NProgress.start();
    };
  }, [pathname, searchParams]);

  return null;
}
