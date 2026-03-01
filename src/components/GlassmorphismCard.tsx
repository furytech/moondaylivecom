import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassmorphismCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "gold" | "blue" | "purple";
  size?: "sm" | "md" | "lg";
}

const GlassmorphismCard = ({
  children,
  className,
  glowColor = "gold",
  size = "md",
}: GlassmorphismCardProps) => {
  const glowStyles = {
    gold: "shadow-[0_0_60px_-15px_hsl(239,84%,67%,0.25)] border-primary/20 hover:border-primary/40 hover:shadow-[0_0_80px_-15px_hsl(239,84%,67%,0.35)]",
    blue: "shadow-[0_0_60px_-15px_hsl(220,60%,50%,0.2)] border-blue-400/20 hover:border-blue-400/40",
    purple: "shadow-[0_0_60px_-15px_hsl(280,60%,50%,0.2)] border-purple-400/20 hover:border-purple-400/40",
  };

  const sizeStyles = {
    sm: "p-6 md:p-8",
    md: "p-8 md:p-10",
    lg: "p-10 md:p-14",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border backdrop-blur-xl transition-all duration-500",
        "bg-background/95",
        "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/[0.08] before:via-white/[0.04] before:to-transparent before:opacity-100 before:transition-opacity before:duration-500 hover:before:opacity-100",
        glowStyles[glowColor],
        sizeStyles[size],
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GlassmorphismCard;
