import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'text' | 'circular';
}

export default function Skeleton({
  className,
  width,
  height,
  rounded = 'md',
  variant = 'default',
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const variantClasses = {
    default: '',
    text: 'h-4',
    circular: 'rounded-full',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        'animate-shimmer bg-surfaceElevated',
        roundedClasses[rounded],
        variantClasses[variant],
        className
      )}
      style={style}
      aria-label="Loading..."
      role="status"
    />
  );
}
