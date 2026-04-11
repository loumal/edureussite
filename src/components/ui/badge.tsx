import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)]",
        accent:
          "bg-[rgba(217,79,43,0.12)] text-[var(--color-accent)] border border-[rgba(217,79,43,0.2)]",
        success:
          "bg-[rgba(42,124,111,0.12)] text-[var(--color-success)] border border-[rgba(42,124,111,0.2)]",
        purple:
          "bg-[rgba(91,79,207,0.12)] text-[var(--color-purple)] border border-[rgba(91,79,207,0.2)]",
        gold: "bg-[rgba(201,149,42,0.12)] text-[var(--color-gold)] border border-[rgba(201,149,42,0.2)]",
        ink: "bg-[var(--color-ink)] text-white",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
