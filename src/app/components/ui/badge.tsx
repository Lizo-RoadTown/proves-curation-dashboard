import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

/**
 * Badge variants for enterprise ops console:
 * - default: Subtle, not attention-grabbing
 * - secondary: Even more subtle
 * - outline: Border only, minimal
 * - destructive: Muted red for errors
 * - success: Muted green for active/verified
 * - warning: Muted amber for attention
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        // Default: Subtle cyan tint
        default:
          "border-transparent bg-[#164e63] text-[#a5f3fc] [a&]:hover:bg-[#155e75]",
        // Secondary: Very subtle, blends in
        secondary:
          "border-transparent bg-[#334155] text-[#94a3b8] [a&]:hover:bg-[#475569]",
        // Outline: Border only, minimal footprint
        outline:
          "border-[#334155] bg-transparent text-[#94a3b8] [a&]:hover:bg-[#334155] [a&]:hover:text-[#e2e8f0]",
        // Destructive: Muted red
        destructive:
          "border-transparent bg-[#7f1d1d] text-[#fecaca] [a&]:hover:bg-[#991b1b]",
        // Success: Muted green for verified/active status
        success:
          "border-transparent bg-[#14532d] text-[#86efac] [a&]:hover:bg-[#166534]",
        // Warning: Muted amber for attention
        warning:
          "border-transparent bg-[#78350f] text-[#fcd34d] [a&]:hover:bg-[#92400e]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
