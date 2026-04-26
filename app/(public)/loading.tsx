import { MaxTourLoader } from '@/components/shared/max-tour-loader';

export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
      <MaxTourLoader className="h-64 w-64 md:h-72 md:w-72" />
      <p className="text-sm text-muted-foreground">Sahifa yuklanmoqda...</p>
    </div>
  );
}
