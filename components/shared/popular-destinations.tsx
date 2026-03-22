'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { placeholderImage } from '@/lib/utils';

export interface Destination {
  name: string;
  countryKey: 'uzbekistan' | 'turkey' | 'uae';
  image: string;
}

const DEFAULT_DESTINATIONS: Destination[] = [
  { name: 'Buxoro', countryKey: 'uzbekistan', image: placeholderImage(200, 200, 'Buxoro') },
  { name: 'Xiva', countryKey: 'uzbekistan', image: placeholderImage(200, 200, 'Xiva') },
  { name: 'Toshkent', countryKey: 'uzbekistan', image: placeholderImage(200, 200, 'Toshkent') },
  { name: 'Samarqand', countryKey: 'uzbekistan', image: placeholderImage(200, 200, 'Samarqand') },
  { name: 'Shahrisabz', countryKey: 'uzbekistan', image: placeholderImage(200, 200, 'Shahrisabz') },
];

interface PopularDestinationsProps {
  destinations?: Destination[];
}

export function PopularDestinations({ destinations }: PopularDestinationsProps) {
  const { t } = useTranslation();

  const items = destinations && destinations.length > 0 ? destinations : DEFAULT_DESTINATIONS;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">{t.home.popularDestinations}</h3>
        <Link href="/tours" className="text-primary text-sm font-semibold">
          {t.home.seeAll}
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4">
        {items.map((dest) => {
          const countryName = t.destinations[dest.countryKey];
          return (
            <Link
              key={dest.name}
              href={`/tours?country=${encodeURIComponent(countryName)}`}
              className="shrink-0"
            >
              <div className="w-28 h-28 rounded-2xl overflow-hidden mb-2 bg-slate-200 shadow-sm">
                <Image
                  src={dest.image}
                  alt={dest.name}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="font-semibold text-sm text-slate-900 text-center">{dest.name}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
