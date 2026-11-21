import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import type { PublicSettings } from '../types';

const defaults: PublicSettings = {
  church_name: 'The Dreamers Centre Fellowship',
  logo_url: null,
  location: 'Manzese Tiptop, Dar es Salaam, Tanzania',
  phone: '+255 621 585 025',
  email: '',
  welcome_message:
    'We value your experience at The Dreamers Centre Fellowship. Your feedback helps us strengthen our ministry, improve our fellowship, and serve our community better.',
  feedback_intro:
    'Share your experience, encourage our leaders, and help us serve you better. Your feedback is reviewed by the ministry leadership team.',
  footer_text: 'A community of dreamers, growing together in faith and service.',
  service_info: '',
  map_lat: '-6.7980824',
  map_lng: '39.2302042',
  instagram_url: 'https://www.instagram.com/dreamerscenter_tz',
  tiktok_url: 'https://www.tiktok.com/@dreamerscentre_tz',
  facebook_url: 'https://www.facebook.com/DreamerscentreTz',
  youtube_url: 'https://www.youtube.com/@thedreamerscentretzchurch',
};

interface SettingsContextValue {
  settings: PublicSettings;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<PublicSettings>(defaults);

  const refresh = useCallback(async () => {
    try {
      setSettings({ ...defaults, ...(await api<PublicSettings>('/settings/public')) });
    } catch {
      // Keep defaults if the API is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    const onVisibility = () => {
      if (!document.hidden) void refresh();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh]);

  const value = useMemo(() => ({ settings, refresh }), [settings, refresh]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
};
