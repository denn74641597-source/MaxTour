'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HotelImageCarouselProps {
  images: string[];
  hotelName: string;
}

export function HotelImageCarousel({ images, hotelName }: HotelImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0, hasDragged: false });

  const scrollTo = useCallback((index: number) => {
    setCurrentIndex(index);
    scrollRef.current?.children[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, []);

  const prev = () => scrollTo(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
  const next = () => scrollTo(currentIndex < images.length - 1 ? currentIndex + 1 : 0);

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    dragState.current = { isDown: true, startX: e.pageX, scrollLeft: el.scrollLeft, hasDragged: false };
    el.style.cursor = 'grabbing';
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.current.isDown) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const dx = e.pageX - dragState.current.startX;
    if (Math.abs(dx) > 5) dragState.current.hasDragged = true;
    el.scrollLeft = dragState.current.scrollLeft - dx;
  };
  const handleMouseUp = () => {
    dragState.current.isDown = false;
    const el = scrollRef.current;
    if (el) el.style.cursor = '';
  };

  if (images.length === 0) return null;

  return (
    <div className="relative group">
      {/* Image container */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide rounded-xl cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const index = Math.round(el.scrollLeft / el.clientWidth);
          if (index !== currentIndex && index >= 0 && index < images.length) {
            setCurrentIndex(index);
          }
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="snap-center shrink-0 w-full aspect-[16/10] relative bg-muted"
          >
            <Image
              src={src}
              alt={`${hotelName} - ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-surface/90 backdrop-blur-sm shadow-ambient rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-surface/90 backdrop-blur-sm shadow-ambient rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-6 h-2 bg-white shadow-md'
                  : 'w-2 h-2 bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
