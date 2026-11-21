import { Facebook, Instagram, MapPin, Music2, Phone, Youtube } from 'lucide-react';
import type { PublicSettings } from '../../types';

interface FindUsSectionProps {
  settings: PublicSettings;
}

export const FindUsSection = ({ settings }: FindUsSectionProps) => {
  const hasCoordinates = !!settings.map_lat && !!settings.map_lng;
  const mapQuery = hasCoordinates
    ? `${settings.map_lat},${settings.map_lng}`
    : settings.location || settings.church_name;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`;

  const socials = [
    { label: 'Instagram', href: settings.instagram_url, icon: Instagram },
    { label: 'TikTok', href: settings.tiktok_url, icon: Music2 },
    { label: 'Facebook', href: settings.facebook_url, icon: Facebook },
    { label: 'YouTube', href: settings.youtube_url, icon: Youtube },
  ].filter((item) => !!item.href);

  return (
    <section id="find-us" className="scroll-mt-16 border-t border-line bg-soft/50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-brand">
              <MapPin className="h-4 w-4" />
              Find us
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Visit us in Manzese Tiptop</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              You are warmly welcome to join {settings.church_name} in Tanzania. Use the map below to find us, or contact the church office for directions.
            </p>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
            target="_blank"
            rel="noreferrer"
            className="chip w-fit bg-white text-brand shadow-sm hover:bg-brand-soft"
          >
            Open in Google Maps ↗
          </a>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="animate-fade-up card overflow-hidden p-3">
            <iframe
              title={`Google Map of ${settings.church_name}`}
              src={mapSrc}
              className="h-[320px] w-full rounded-2xl border-0 sm:h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <div className="animate-fade-up card flex flex-col justify-between p-6" style={{ animationDelay: '100ms' }}>
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-ink">Our location</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{settings.location}</p>
              {hasCoordinates && (
                <p className="mt-2 text-[11px] text-muted">
                  {settings.map_lat}, {settings.map_lng}
                </p>
              )}
              {settings.service_info && <p className="mt-4 text-sm leading-relaxed text-muted">{settings.service_info}</p>}
            </div>

            {settings.phone && (
              <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="mt-6 flex items-center gap-3 rounded-xl bg-soft p-4 transition-colors hover:bg-brand-soft">
                <Phone className="h-4 w-4 shrink-0 text-brand" />
                <span className="text-sm font-semibold text-ink">{settings.phone}</span>
              </a>
            )}

            {socials.length > 0 && (
              <div className="mt-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Follow us</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {socials.map(({ label, href, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      title={label}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-muted transition-colors hover:border-brand/40 hover:text-brand"
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
