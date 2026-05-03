import { cn } from '@/lib/utils';

export function SectionShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn('space-y-4', className)}>{children}</section>;
}
