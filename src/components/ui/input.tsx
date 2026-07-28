import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, inputMode, pattern, ...props }: React.ComponentProps<"input">) {
  const isNumber = type === "number"
  const computedInputMode = inputMode ?? (isNumber ? "numeric" : undefined)
  const computedPattern = pattern ?? (isNumber ? "[0-9]*" : undefined)

  return (
    <InputPrimitive
      type={type}
      inputMode={computedInputMode}
      pattern={computedPattern}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-200 ease-out outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/25 focus-visible:bg-background/90 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-rose-500 aria-invalid:ring-2 aria-invalid:ring-rose-500/20 dark:bg-card/40 dark:border-white/10 dark:focus-visible:border-amber-500/80 dark:focus-visible:ring-amber-500/30 dark:disabled:bg-input/80 shadow-sm",
        (type === "date" || type === "month") && "tabular-nums cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:rounded-lg [&::-webkit-calendar-picker-indicator]:hover:bg-amber-500/20 [&::-webkit-calendar-picker-indicator]:transition-all dark:[&::-webkit-calendar-picker-indicator]:invert-[0.8]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
