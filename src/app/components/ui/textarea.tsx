import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base: Interactive surface level
        "flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base md:text-sm resize-none",
        "bg-[#0f172a] border-[#334155] text-[#e2e8f0]",
        "placeholder:text-[#64748b]",
        // Focus: Cyan accent ring
        "outline-none transition-[color,box-shadow]",
        "focus-visible:border-[#06b6d4] focus-visible:ring-[#06b6d4]/30 focus-visible:ring-[3px]",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Invalid
        "aria-invalid:ring-[#dc2626]/20 aria-invalid:border-[#dc2626]",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
