import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { VerifiedBadge } from './verified-badge';
import type { Agency } from '@/types';

function AgencyLogoFallback({ name }: { name: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center">
      <span className="text-white font-bold text-xl">{name?.[0]?.toUpperCase() || 'M'}</span>
    </div>
  );
}

interface AgencyCardProps {
  agency: Agency;
}

export function AgencyCard({ agency }: AgencyCardProps) {
  return (
    <Link href={`/agencies/${agency.slug}`} className="flex flex-col items-center gap-1.5 shrink-0">
      <div className="relative">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface-container-low flex items-center justify-center overflow-hidden shadow-[0_16px_28px_-14px_rgba(15,23,42,0.62),0_6px_12px_-8px_rgba(15,23,42,0.38)]">
          {agency.logo_url ? (
            <Image
              src={agency.logo_url}
              alt={agency.name}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : (
            <AgencyLogoFallback name={agency.name} />
          )}
        </div>
        {agency.is_verified && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-surface rounded-full p-[1px]">
            <VerifiedBadge size="sm" />
          </div>
        )}
      </div>
      <span className="text-[11px] font-semibold text-foreground truncate max-w-[72px] text-center leading-tight">
        {agency.name}
      </span>
      {agency.avg_rating != null && agency.avg_rating > 0 && (
        <div className="flex items-center gap-0.5">
          <Star className="h-3 w-3 text-tertiary fill-tertiary" />
          <span className="text-[10px] font-medium text-muted-foreground">{agency.avg_rating.toFixed(1)}</span>
        </div>
      )}
    </Link>
  );
}
