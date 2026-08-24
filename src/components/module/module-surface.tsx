import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type ModuleSurfaceProps = {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function ModuleSurface({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: ModuleSurfaceProps) {
  return (
    <section className={cn("module-surface", className)}>
      <header className="flex items-start justify-between gap-4 border-b border-border/70 px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="min-w-0">
          <h2 className="module-card-title">{title}</h2>
          {description ? (
            <p className="module-card-description">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div className={cn("min-w-0 px-3 pb-3 pt-4 sm:px-5 sm:pb-5", contentClassName)}>
        {children}
      </div>
    </section>
  )
}
