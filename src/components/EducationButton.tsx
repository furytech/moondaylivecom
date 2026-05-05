import { Info } from "lucide-react";

interface EducationButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

const EducationButton = ({ label, onClick, className = "" }: EducationButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 hover:border-primary/60 text-primary font-display text-sm uppercase tracking-widest transition-all duration-300 ${className}`}
    >
      <Info className="w-4 h-4 opacity-80 group-hover:opacity-100 transition-opacity" />
      <span>{label}</span>
    </button>
  );
};

export default EducationButton;
