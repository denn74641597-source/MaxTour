import { cn } from '@/lib/utils';

export function PageTitle({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header className={cn('space-y-1', className)}>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      {subtitle ? (
        <p className="text-sm text-slate-500">{subtitle}</p>
      ) : null}
    </header>
  );
}
