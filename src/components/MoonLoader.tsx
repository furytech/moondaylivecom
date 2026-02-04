import { forwardRef } from "react";

interface MoonLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const MoonLoader = forwardRef<HTMLDivElement, MoonLoaderProps>(
  ({ size = "md", text }, ref) => {
    const sizeClasses = {
      sm: "w-8 h-8",
      md: "w-12 h-12",
      lg: "w-16 h-16",
    };

    return (
      <div ref={ref} className="flex flex-col items-center justify-center gap-4">
        <div className={`moon-loader ${sizeClasses[size]}`} />
        {text && (
          <p className="font-serif text-cream-muted animate-pulse">{text}</p>
        )}
      </div>
    );
  }
);

MoonLoader.displayName = "MoonLoader";

export default MoonLoader;
