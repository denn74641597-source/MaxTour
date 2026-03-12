import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function VerifiedBadge({ size = 'md', className }: VerifiedBadgeProps) {
  return (
    <BadgeCheck
      className={cn(
        'text-blue-500 shrink-0',
        size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5',
        className
      )}
    />
  );
}
