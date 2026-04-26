'use client';

import Lottie from 'lottie-react';
import maxTourAnimation from '@/loading/MaxTour Final .json';
import { cn } from '@/lib/utils';

type MaxTourLoaderProps = {
  className?: string;
  loop?: boolean;
};

export function MaxTourLoader({ className, loop = true }: MaxTourLoaderProps) {
  return (
    <Lottie
      animationData={maxTourAnimation}
      loop={loop}
      className={cn('h-52 w-52 md:h-64 md:w-64', className)}
      rendererSettings={{
        preserveAspectRatio: 'xMidYMid meet',
      }}
    />
  );
}
