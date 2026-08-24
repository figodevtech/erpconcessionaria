"use client"

import { useEffect, useRef, useState } from "react"
import type { LucideIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type ModuleKpiProps = {
  label: string
  value: React.ReactNode
  description: string
  icon: LucideIcon
  className?: string
  iconClassName?: string
  valueTooltip?: string
}

export function ModuleKpi({
  label,
  value,
  description,
  icon: Icon,
  className,
  iconClassName,
  valueTooltip,
}: ModuleKpiProps) {
  const valueRef = useRef<HTMLParagraphElement>(null)
  const [isValueOverflowing, setIsValueOverflowing] = useState(false)
  const inferredValueText = typeof value === "string" || typeof value === "number"
    ? String(value)
    : undefined
  const tooltipText = valueTooltip ?? inferredValueText
  const valueLength = tooltipText?.replace(/\s/g, "").length ?? 0
  const valueSize = valueLength > 21 ? "extreme" : valueLength > 14 ? "long" : "default"

  useEffect(() => {
    const element = valueRef.current
    if (!element) return

    let active = true
    let frame = 0
    const measureOverflow = () => {
      if (!active) return
      frame = window.requestAnimationFrame(() => {
        if (!active) return
        setIsValueOverflowing(element.scrollWidth > element.clientWidth + 1)
      })
    }

    measureOverflow()
    const resizeObserver = new ResizeObserver(measureOverflow)
    resizeObserver.observe(element)
    document.fonts?.ready.then(measureOverflow)

    return () => {
      active = false
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
    }
  }, [value, valueSize])

  const valueElement = (
    <p
      ref={valueRef}
      data-size={valueSize}
      className="module-kpi-value"
    >
      {value}
    </p>
  )

  return (
    <article className={cn("module-kpi group", className)}>
      <div className="flex min-w-0 w-full flex-1 flex-col justify-between gap-3">
        <p className="pr-11 text-xs font-medium text-muted-foreground">{label}</p>
        <div className="min-w-0">
          {tooltipText ? (
            <TooltipProvider delay={100}>
              <Tooltip disabled={!isValueOverflowing}>
                <TooltipTrigger
                  render={
                    <div
                      tabIndex={isValueOverflowing ? 0 : -1}
                      className={cn(
                        "block min-w-0 rounded-sm outline-none",
                        isValueOverflowing && "focus-visible:ring-2 focus-visible:ring-ring/50",
                      )}
                    />
                  }
                >
                  {valueElement}
                </TooltipTrigger>
                <TooltipContent>
                  <span className="tabular-nums">{tooltipText}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : valueElement}
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground sm:text-xs">
            {description}
          </p>
        </div>
      </div>
      <div className="module-kpi-icon" aria-hidden="true">
        <Icon className={cn("size-4 text-primary sm:size-[18px]", iconClassName)} />
      </div>
    </article>
  )
}

export function ModuleKpiSkeleton() {
  return (
    <div className="module-kpi" aria-hidden="true">
      <div className="flex w-full flex-1 flex-col justify-between gap-3">
        <Skeleton className="h-3 w-28" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-36 max-w-full" />
        </div>
      </div>
      <Skeleton className="absolute right-3.5 top-3.5 size-8 rounded-lg sm:right-4 sm:top-4" />
    </div>
  )
}
