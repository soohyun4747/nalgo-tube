'use client';

import { ReactNode, useRef } from 'react';

type HorizontalScrollProps = {
  children: ReactNode;
  className?: string;
  label: string;
};

export default function HorizontalScroll({
  children,
  className = '',
  label,
}: HorizontalScrollProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollByPage = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction * Math.max(scroller.clientWidth * 0.85, 240),
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`${label} 왼쪽으로 이동`}
        onClick={() => scrollByPage(-1)}
        className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/95 text-xl font-semibold text-zinc-50 shadow-lg transition hover:border-emerald-500 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
      >
        ‹
      </button>
      <div
        ref={scrollerRef}
        className={`scrollbar-thin -mx-6 flex gap-4 overflow-x-auto scroll-smooth px-12 pb-2 ${className}`}
      >
        {children}
      </div>
      <button
        type="button"
        aria-label={`${label} 오른쪽으로 이동`}
        onClick={() => scrollByPage(1)}
        className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/95 text-xl font-semibold text-zinc-50 shadow-lg transition hover:border-emerald-500 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
      >
        ›
      </button>
    </div>
  );
}
