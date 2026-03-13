import Link from 'next/link';
import Image from 'next/image';
import { placeholderImage } from '@/lib/utils';
import { VerifiedBadge } from './verified-badge';
import type { Agency } from '@/types';

interface AgencyCardProps {
  agency: Agency;
}

export function AgencyCard({ agency }: AgencyCardProps) {
  return (
    <Link href={`/agencies/${agency.slug}`} className="flex flex-col items-center gap-2 shrink-0">
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
          <Image
            src={agency.logo_url || placeholderImage(100, 100, agency.name[0])}
            alt={agency.name}
            width={56}
            height={56}
            className="object-cover w-full h-full"
          />
        </div>
        {agency.is_verified && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-[1px]">
            <VerifiedBadge size="sm" />
          </div>
        )}
      </div>
      <span className="text-[10px] font-medium text-slate-700 truncate max-w-[60px] text-center">
        {agency.name}
      </span>
    </Link>
  );
}
