import { TourListSkeleton } from '@/components/shared/loading-skeleton';

export default function Loading() {
  return (
    <div className="px-4 py-4">
      <TourListSkeleton count={6} />
    </div>
  );
}
