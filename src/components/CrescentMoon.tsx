interface CrescentMoonProps {
  size?: "sm" | "md" | "lg";
}

const CrescentMoon = ({ size = "md" }: CrescentMoonProps) => {
  const sizeClasses = {
    sm: "w-16 h-16 md:w-20 md:h-20",
    md: "w-24 h-24 md:w-32 md:h-32",
    lg: "w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48",
  };

  const shadowSizes = {
    sm: "inset -12px -5px 0 0",
    md: "inset -16px -6px 0 0",
    lg: "inset -20px -8px 0 0",
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Outer glow */}
      <div 
        className="absolute inset-0 rounded-full opacity-40 blur-2xl"
        style={{
          background: 'radial-gradient(circle, hsl(38, 56%, 72%) 0%, transparent 70%)',
        }}
      />
      {/* Crescent shape using box-shadow technique */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(135deg, hsl(38, 56%, 72%) 0%, hsl(38, 45%, 55%) 50%, hsl(38, 40%, 45%) 100%)',
          boxShadow: `
            ${shadowSizes[size]} hsl(220, 45%, 8%),
            0 0 40px 0 hsl(38, 56%, 72%, 0.3),
            0 0 80px 0 hsl(38, 56%, 72%, 0.15)
          `,
        }}
      />
    </div>
  );
};

export default CrescentMoon;
