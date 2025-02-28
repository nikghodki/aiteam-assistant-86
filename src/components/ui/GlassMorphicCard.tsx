
import React from 'react';
import { cn } from '@/lib/utils';

interface GlassMorphicCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

const GlassMorphicCard = ({ 
  children, 
  className, 
  hoverEffect = true 
}: GlassMorphicCardProps) => {
  return (
    <div 
      className={cn(
        "glassmorphic rounded-xl overflow-hidden transition-all duration-300",
        hoverEffect && "hover-scale",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassMorphicCard;
