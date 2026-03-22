import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { placeholderImage } from '@/lib/utils';
import { VerifiedBadge } from './verified-badge';
import type { Agency } from '@/types';

interface AgencyCardProps {
  agency: Agency;
}

export function AgencyCard({ agency }: AgencyCardProps) {
  return (
    <Link href={`/agencies/${agency.slug}`} className="flex flex-col items-center gap-1.5 shrink-0">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-primary/5 border-2 border-primary/15 flex items-center justify-center overflow-hidden shadow-sm">
          <Image
            src={agency.logo_url || placeholderImage(100, 100, agency.name[0])}
            alt={agency.name}
            width={64}
            height={64}
            className="object-cover w-full h-full"
          />
        </div>
        {agency.is_verified && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-[1px]">
            <VerifiedBadge size="sm" />
          </div>
        )}
      </div>
      <span className="text-[11px] font-semibold text-slate-800 truncate max-w-[72px] text-center leading-tight">
        {agency.name}
      </span>
      {agency.avg_rating != null && agency.avg_rating > 0 && (
        <div className="flex items-center gap-0.5">
          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
          <span className="text-[10px] font-medium text-slate-600">{agency.avg_rating.toFixed(1)}</span>
        </div>
      )}
    </Link>
  );
}
