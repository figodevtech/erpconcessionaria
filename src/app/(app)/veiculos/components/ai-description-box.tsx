"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Sparkles, ChevronDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AIDescriptionBoxProps {
  children?: ReactNode;
  text?: string;
  className?: string;
  isGenerating?: boolean;
}

export function AIDescriptionBox({
  children,
  text,
  className = "",
  isGenerating = false,
}: AIDescriptionBoxProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const content = children || text;

  return (
    <div className={cn("relative group w-full", className)}>
      {/* Animated gradient border */}
      <div className={cn(
        "absolute -inset-0.5 bg-linear-to-r from-cyan-500/50 via-violet-500/50 to-cyan-500/50 rounded-3xl opacity-10 group-hover:opacity-30 blur-sm transition-all duration-800",
        isGenerating && "opacity-100 animate-pulse"
      )} />

      {/* Glow effect */}
      <div className={cn(
        "absolute -inset-1 bg-linear-to-r from-cyan-500/10 via-violet-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-800",
        isGenerating && "opacity-100"
      )} />

      {/* Main container */}
      <div className="relative bg-background/95 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden flex flex-col min-h-[100px] transition-all duration-800">
        {/* Subtle animated background pattern */}
        <div className={cn(
          "absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-violet-500/5 pointer-events-none",
          isGenerating && "animate-shimmer"
        )} />

        {/* Content wrapper */}
        <div className="relative p-5 sm:p-6 flex-1 flex flex-col items-start">
          {/* Header Section */}
          <div className="flex flex-wrap items-center justify-between w-full gap-4 relative z-10">
            {/* AI Badge */}
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 w-fit transition-all duration-800",
              isGenerating && "scale-105 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
            )}>
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 text-cyan-500 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              )}
              <span className="text-xs font-bold bg-linear-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent uppercase tracking-wider">
                {isGenerating ? "Gerando..." : "Gerado por IA"}
              </span>
            </div>

            {/* Toggle Button (only if not generating and has content) */}

          </div>

          {/* Animated Text Container */}
          <AnimatePresence initial={false}>
            {(isExpanded || isGenerating) && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, marginTop: "1.25rem" }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 1, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="relative overflow-hidden w-full"
              >
                <div className={cn(
                  "text-foreground/90 text-sm sm:text-base leading-relaxed tracking-wide font-normal wrap-break-word pb-2",
                  isGenerating && "animate-pulse italic text-muted-foreground"
                )}>
                  {isGenerating ? (
                    "Analisando os dados do veículo para criar uma descrição persuasiva e profissional..."
                  ) : (
                    content
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
