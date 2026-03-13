'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

interface Destination {
  name: string;
  countryKey: 'uzbekistan' | 'turkey' | 'uae';
  image: string;
}

const POPULAR_DESTINATIONS: Destination[] = [
  {
    name: 'Samarkand',
    countryKey: 'uzbekistan',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVLo08i4s7wisQekcmMeWO8LaF-JObVb2nxzhCYcWWn4h6yshWqjcFqJ55PM6D-IvAB_ZYTnOv7b5Zn2mi6ZV_14NlxWtOM1P1J2Gg6NUryxX6LpGgL3xooI-2fWTqcwqzK584TqDqNDfKaBTiV1rJJcEbNpbVUaSS0Y6KSUzCoqyiOx5G4U8KTHERtY_HauJumIL9l2F-_ytPnqSaAzVtqIb1lREnfBCYNi3Xj3oL5PCETiCLAfRie6c24uXYjqNZ5dlmGPsIn4pR',
  },
  {
    name: 'Antalya',
    countryKey: 'turkey',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8MXLo1phkhboSCiVtp_34mVoPonC4nhuoNoMaJ62w1BtzXqFRf-Gn-5QcvB8y0oSlBaXjBbFnmXPSQe-eUbxSQpT6In0C-rqKloK42gjeldv-P-0TnbpeJeJglS7zKohxLoBigoUYUsHY92XGvmK4u9ZeINCt--JNv103QdVSWe_aGapttVd2tWarisBB_dar2j7wkHcZgrrFhoQljqkQokuXD8mfdGRIPcqDTiB7K0blg_OPwvw5oU78kuhXAyrIyox_zNN8zk_C',
  },
  {
    name: 'Dubai',
    countryKey: 'uae',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsK0Y1u9VvKc2cuKF_bh6oFCH0RueZS8ai1qCWKCutof545jKL0_liHJQa4TrvssjP42bbiZNE5BQZw6gXDan0ivu6OAyVyODNO-E8_eIqA8CRAw5AFfjwwHivy4Xec7mUzZjXkUbfpHCvnM8zVdPld8Q5TB9yk2XADTj5I6mr1O7Wa5XS-GdjEOw6WYm_BVU3Pz0mlG8FwB9qZSIlX_6iqAy-m-VeOuE5-3z_TSmP-v6YUSEmZeFzF1ygUuf9PUIqYdlZsYZewSSR',
  },
  {
    name: 'Bukhara',
    countryKey: 'uzbekistan',
    image: 'https://placehold.co/400x400/0ea5e9/white?text=Bukhara',
  },
];

export function PopularDestinations() {
  const { t } = useTranslation();

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">{t.home.popularDestinations}</h3>
        <Link href="/tours" className="text-primary text-sm font-semibold">
          {t.common.viewAll}
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4">
        {POPULAR_DESTINATIONS.map((dest) => {
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
