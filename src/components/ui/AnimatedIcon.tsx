
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type AnimatedIconProps = {
  icon: React.ElementType;
  size?: number;
  className?: string;
  color?: string;
  animated?: boolean;
  animationDelay?: number;
};

const AnimatedIcon = ({
  icon: Icon,
  size = 24,
  className,
  color,
  animated = true,
  animationDelay = 0,
}: AnimatedIconProps) => {
  const [isVisible, setIsVisible] = useState(!animated);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, animationDelay);
      
      return () => clearTimeout(timer);
    }
  }, [animated, animationDelay]);

  return (
    <div 
      className={cn(
        "transition-all duration-500 ease-out transform",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
      <Icon size={size} className={cn(color && `text-${color}`)} />
    </div>
  );
};

export default AnimatedIcon;
