import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

/**
 * Button Hierarchy (Enterprise Ops Console):
 * - Primary: Solid cyan - ONE per panel (Submit, Approve)
 * - Secondary: Outline - alternatives (Save draft, Cancel)
 * - Ghost: No border - icon actions (open, copy, link)
 * - Destructive: Muted red - reject/delete (not neon)
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[#06b6d4]/30 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        // Primary: Cyan solid - use sparingly (one per panel)
        default:
          "bg-[#06b6d4] text-[#0f172a] hover:bg-[#22d3ee] font-semibold",
        // Destructive: Muted red, not neon
        destructive:
          "bg-[#7f1d1d] text-[#fecaca] hover:bg-[#991b1b] focus-visible:ring-[#dc2626]/30",
        // Secondary: Outline style for alternatives
        outline:
          "border border-[#334155] bg-transparent text-[#e2e8f0] hover:bg-[#334155] hover:text-[#f1f5f9]",
        // Secondary solid: Muted fill
        secondary:
          "bg-[#334155] text-[#e2e8f0] hover:bg-[#475569]",
        // Ghost: No border, subtle hover (for icon actions)
        ghost:
          "text-[#94a3b8] hover:bg-[#334155] hover:text-[#e2e8f0]",
        // Link: Underlined text
        link: "text-[#06b6d4] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
