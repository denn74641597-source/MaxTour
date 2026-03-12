import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center gap-4">
      <SearchX className="h-12 w-12 text-muted-foreground/50" />
      <div>
        <h2 className="text-lg font-bold">Page Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link href="/">
        <Button size="sm">Go Home</Button>
      </Link>
    </div>
  );
}
