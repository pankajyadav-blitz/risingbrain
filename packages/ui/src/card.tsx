import * as React from "react";
import { cn } from "./cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lift the card on hover (frosted-glass elevation). */
  interactive?: boolean;
}

export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "glass rounded-xl p-6",
        interactive && "glass-hover",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold text-foreground", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted", className)} {...props} />;
}
