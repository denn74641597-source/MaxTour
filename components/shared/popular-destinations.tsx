'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export interface Destination {
  name: string;
  countryKey: 'uzbekistan' | 'turkey' | 'uae';
  image: string;
}

interface PopularDestinationsProps {
  destinations?: Destination[];
}

export function PopularDestinations({ destinations = [] }: PopularDestinationsProps) {
  const { t } = useTranslation();

  if (destinations.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">{t.home.popularDestinations}</h3>
        <Link href="/tours" className="text-primary text-sm font-semibold">
          {t.common.viewAll}
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4">
        {destinations.map((dest) => {
          const countryName = t.destinations[dest.countryKey];
          return (
            <Link
              key={dest.name}
              href={`/tours?country=${encodeURIComponent(countryName)}`}
              className="shrink-0 w-40"
            >
              <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-slate-200">
                <Image
                  src={dest.image}
                  alt={dest.name}
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="font-bold text-sm text-slate-900">{dest.name}</p>
              <p className="text-xs text-slate-500">{countryName}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
