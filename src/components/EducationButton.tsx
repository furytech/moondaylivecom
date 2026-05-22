import { ChevronRight } from "lucide-react";

interface EducationButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

const EducationButton = ({ label, onClick, className = "" }: EducationButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[hsl(245_100%_92%/0.65)] bg-[hsl(245_100%_92%/0.12)] hover:bg-[hsl(245_100%_92%/0.22)] hover:border-[hsl(245_100%_96%/0.95)] hover:shadow-[0_0_24px_hsl(var(--primary)/0.35)] text-[hsl(245_100%_96%)] hover:text-primary-foreground font-display text-sm uppercase tracking-widest transition-all duration-300 ${className}`}
    >
      <span>{label}</span>
      <ChevronRight className="w-4 h-4 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
    </button>
  );
};

export default EducationButton;
