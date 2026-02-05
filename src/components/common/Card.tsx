import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface/80 backdrop-blur-lg border border-dark-700/50 rounded-2xl',
        hover && 'transition-all duration-300 cursor-pointer hover:border-primary-400/30 hover:shadow-glow',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn('p-6 border-b border-dark-700/50', className)}>{children}</div>;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

function CardFooter({ children, className }: CardFooterProps) {
  return <div className={cn('p-6 pt-0', className)}>{children}</div>;
}

export { Card, CardHeader, CardContent, CardFooter };
export default Card;
