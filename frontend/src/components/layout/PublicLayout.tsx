import { ArrowUpRight, Facebook, Instagram, Music2, Youtube } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { ChurchLogo } from '../brand/ChurchLogo';
import { useSettings } from '../../lib/settings';

export const PublicLayout = () => {
  const { settings } = useSettings();
  const year = new Date().getFullYear();
  const socials = [
    { label: 'Instagram', href: settings.instagram_url, icon: Instagram },
    { label: 'TikTok', href: settings.tiktok_url, icon: Music2 },
    { label: 'Facebook', href: settings.facebook_url, icon: Facebook },
    { label: 'YouTube', href: settings.youtube_url, icon: Youtube },
  ].filter((item) => !!item.href);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="min-w-0 max-w-[62%] rounded-lg sm:max-w-[45%]">
            <ChurchLogo subtitle="Official Ministry Portal" size="sm" className="w-full" />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3">
            <a href="/#shusho" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink sm:block">
              Shusho
            </a>
            <a href="/#team" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink sm:block">
              Our Team
            </a>
            <a href="/#find-us" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink sm:block">
              Find Us
            </a>
            <a href="/#freshers" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-brand sm:block">
              Freshers
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-soft/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <div>
            <ChurchLogo subtitle="Official Ministry Portal" size="sm" className="w-full" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{settings.footer_text}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">Visit us</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{settings.location || 'Service location will be announced soon.'}</p>
            {settings.service_info && <p className="mt-2 text-sm leading-relaxed text-muted">{settings.service_info}</p>}
            <a href="/#find-us" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
              View on map <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">Contact</h3>
            {settings.phone && (
              <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="mt-3 block text-sm font-medium text-ink transition-colors hover:text-brand">
                {settings.phone}
              </a>
            )}
            {settings.email && (
              <a href={`mailto:${settings.email}`} className="mt-1 block break-all text-sm text-muted transition-colors hover:text-brand">
                {settings.email}
              </a>
            )}
            <a href="/#freshers" className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
              Join the fellowship <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            {socials.length > 0 && (
              <div className="mt-4 rounded-xl bg-[url('/brand/social-art.svg')] bg-cover bg-center p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Official socials</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {socials.map(({ label, href, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      title={label}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand shadow-sm transition-transform hover:-translate-y-0.5"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-muted sm:px-6">
            © {year} {settings.church_name}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
