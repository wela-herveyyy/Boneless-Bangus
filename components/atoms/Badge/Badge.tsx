import React from "react";
import { useBadgeStyles, type BadgeVariant } from "./badge.hooks";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "muted", className }: BadgeProps) {
  const styles = useBadgeStyles(variant, className);
  return <span className={styles}>{children}</span>;
}
