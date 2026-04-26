'use client';

import { useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function GlowCard({ children, className, contentClassName }: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    cardRef.current.style.setProperty('--glow-x', `${x}px`);
    cardRef.current.style.setProperty('--glow-y', `${y}px`);
    cardRef.current.style.setProperty('--glow-alpha', '0.92');
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--glow-alpha', '0');
  };

  const glowVars = {
    '--glow-x': '50%',
    '--glow-y': '50%',
    '--glow-alpha': 0,
  } as CSSProperties;

  return (
    <div className={cn('relative', className)}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn('relative overflow-hidden rounded-[inherit]', contentClassName)}
        style={glowVars}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(220px circle at var(--glow-x) var(--glow-y), rgba(56, 189, 248, calc(var(--glow-alpha) * 0.34)), rgba(37, 99, 235, calc(var(--glow-alpha) * 0.26)) 34%, rgba(99, 102, 241, calc(var(--glow-alpha) * 0.18)) 50%, rgba(56, 189, 248, 0) 72%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(140px circle at var(--glow-x) var(--glow-y), rgba(255, 255, 255, calc(var(--glow-alpha) * 0.32)), rgba(255, 255, 255, 0) 72%)',
          }}
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
