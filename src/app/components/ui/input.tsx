import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base: Interactive surface level
        "flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base md:text-sm",
        "bg-[#0f172a] border-[#334155] text-[#e2e8f0]",
        "placeholder:text-[#64748b]",
        // Focus: Cyan accent ring
        "outline-none transition-[color,box-shadow]",
        "focus-visible:border-[#06b6d4] focus-visible:ring-[#06b6d4]/30 focus-visible:ring-[3px]",
        // Selection
        "selection:bg-[#06b6d4] selection:text-[#0f172a]",
        // File inputs
        "file:text-[#e2e8f0] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Invalid
        "aria-invalid:ring-[#dc2626]/20 aria-invalid:border-[#dc2626]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
