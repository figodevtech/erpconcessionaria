// src/components/theme-provider.tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type NextThemesProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider(props: NextThemesProps) {
  return <NextThemesProvider {...props} />;
}

export function Providers({
  children,
  ...props
}: {
  children: React.ReactNode;
} & NextThemesProps) {
  return (
    <NextThemesProvider {...props}>{children}</NextThemesProvider>
  );
}
