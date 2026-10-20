import * as React from "react"
import { cn } from '@/lib/utils/cn'

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[12px] border border-[rgba(11,27,58,0.14)] bg-(--surface-input) px-3 py-2 text-base outline-none dark:border-white/14 placeholder:text-muted-foreground focus-visible:border-(--focus-ring) focus-visible:ring-4 focus-visible:ring-(--focus-ring)/25 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)  disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
