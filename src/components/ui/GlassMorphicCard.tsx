
import React from 'react';
import { cn } from '@/lib/utils';

interface GlassMorphicCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  style?: React.CSSProperties;
}

const GlassMorphicCard = ({ 
  children, 
  className, 
  hoverEffect = true,
  style
}: GlassMorphicCardProps) => {
  return (
    <div 
      className={cn(
        "glassmorphic rounded-xl overflow-hidden transition-all duration-300",
        hoverEffect && "hover-scale",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
};

export default GlassMorphicCard;
