import { ArrowRight, ExternalLink, Home, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SHUSHO_QUOTES } from '../../data/shusho';

const PHOTOS = [
  { src: '/brand/shusho-1.jpg', mood: 'Joyful' },
  { src: '/brand/shusho-2.jpg', mood: 'Prayerful' },
  { src: '/brand/shusho-3.jpg', mood: 'Warmth' },
  { src: '/brand/shusho-4.jpg', mood: 'Classic' },
  { src: '/brand/shusho-5.jpg', mood: 'Honor' },
  { src: '/brand/shusho-6.jpg', mood: 'Anthem' },
];

const nextIndex = (current: number, total: number): number => {
  if (total <= 1) return 0;
  let next = current;
  while (next === current) next = Math.floor(Math.random() * total);
  return next;
};

interface ShushoSpotlightProps {
  standalone?: boolean;
}

export const ShushoSpotlight = ({ standalone = false }: ShushoSpotlightProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => nextIndex(current, SHUSHO_QUOTES.length));
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  const quote = SHUSHO_QUOTES[index];
  const photo = PHOTOS[index % PHOTOS.length];
  const advance = () => setIndex((current) => nextIndex(current, SHUSHO_QUOTES.length));

  const slide = (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] border border-gold-soft/20 bg-ink shadow-2xl">
      <img
        key={photo.src}
        src={photo.src}
        alt={`Pastor Christina Shusho — ${photo.mood.toLowerCase()} portrait`}
        className="animate-fade-in absolute inset-0 h-full w-full object-cover object-center"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/35" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-brand/25 blur-3xl" />

      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-7 md:p-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-gold-soft/30 bg-ink/55 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-soft backdrop-blur-sm sm:text-xs">
              <Sparkles className="h-3.5 w-3.5" /> Pastor Christina Shusho
            </p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cream/60 sm:text-[11px]">
              Words that stay with you
            </p>
          </div>

          {standalone ? (
            <Link
              to="/"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-cream/20 bg-ink/55 px-3 py-2 text-xs font-semibold text-cream backdrop-blur-sm hover:border-gold-soft/50"
            >
              <Home className="h-3.5 w-3.5" /> Home
            </Link>
          ) : (
            <a
              href="/shusho"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-cream/20 bg-ink/55 px-3 py-2 text-xs font-semibold text-cream backdrop-blur-sm hover:border-gold-soft/50"
            >
              New tab <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center py-3">
          <blockquote
            key={index}
            aria-live="polite"
            className="animate-fade-up line-clamp-6 text-xl font-bold leading-tight tracking-tight text-cream sm:text-3xl md:text-[2.6rem]"
          >
            “{quote.en}”
          </blockquote>
          <p key={`sw-${index}`} className="animate-fade-up mt-3 line-clamp-2 text-sm leading-relaxed text-cream/75 italic sm:text-base">
            {quote.sw}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cream/15 pt-3 sm:pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border border-gold-soft/30 bg-gold-soft/10 text-gold-soft">{photo.mood}</span>
            <span className="chip border border-cream/15 bg-cream/10 capitalize text-cream/85">{quote.theme}</span>
            <span className="text-[11px] font-semibold tracking-wide text-cream/60">
              {String(index + 1).padStart(2, '0')} / {SHUSHO_QUOTES.length}
            </span>
          </div>
          <button
            type="button"
            onClick={advance}
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-gold-soft"
          >
            Next word <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (standalone) {
    return <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-8">{slide}</main>;
  }

  return (
    <section id="shusho" className="bg-ink py-10 sm:py-14">
      <div className="mx-auto w-full max-w-[900px] px-4 sm:px-6">{slide}</div>
    </section>
  );
};
