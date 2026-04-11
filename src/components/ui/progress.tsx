import { cn } from "@/lib/utils/cn";

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  color?: "success" | "accent" | "gold" | "purple";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

const colorMap = {
  success: "linear-gradient(90deg, var(--color-success), #38b2a0)",
  accent: "linear-gradient(90deg, var(--color-accent), #e8714f)",
  gold: "linear-gradient(90deg, var(--color-gold), #e0b040)",
  purple: "linear-gradient(90deg, var(--color-purple), #7b6ed8)",
};

const sizeMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function Progress({
  value,
  className,
  color = "success",
  size = "md",
  animated = true,
}: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full overflow-hidden rounded-full bg-[var(--color-rule)]",
        sizeMap[size],
        className
      )}
    >
      <div
        className={cn("h-full rounded-full", animated && "transition-[width] duration-700 ease-out")}
        style={{
          width: `${clampedValue}%`,
          background: colorMap[color],
        }}
      />
    </div>
  );
}
