import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { VerifiedBadge } from './verified-badge';
import { placeholderImage } from '@/lib/utils';
import type { Agency } from '@/types';

interface AgencyCardProps {
  agency: Agency;
}

export function AgencyCard({ agency }: AgencyCardProps) {
  return (
    <Link href={`/agencies/${agency.slug}`}>
      <Card className="overflow-hidden min-w-[180px] snap-start">
        <CardContent className="flex flex-col items-center p-4 text-center gap-2">
          <div className="relative h-14 w-14 rounded-full overflow-hidden bg-muted">
            <Image
              src={agency.logo_url || placeholderImage(100, 100, agency.name[0])}
              alt={agency.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div className="flex items-center gap-1">
            <h3 className="font-medium text-sm truncate max-w-[140px]">
              {agency.name}
            </h3>
            {agency.is_verified && <VerifiedBadge size="sm" />}
          </div>
          {agency.city && (
            <p className="text-xs text-muted-foreground">{agency.city}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
