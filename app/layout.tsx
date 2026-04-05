import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Manrope } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from '@/components/ui/sonner';
import { LanguageProvider } from '@/lib/i18n';
import { HapticProvider } from '@/components/shared/haptic-provider';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-display',
  subsets: ['latin', 'cyrillic-ext'],
  weight: ['500', '600', '700', '800'],
});

const manrope = Manrope({
  variable: '--font-sans',
  subsets: ['latin', 'cyrillic'],
});

export const metadata: Metadata = {
  title: {
    default: "MaxTour — O'zbekiston sayohat bozori",
    template: '%s | MaxTour',
  },
  description:
    "O'zbekistondagi tasdiqlangan sayohat agentliklaridan eng yaxshi tur paketlarini toping va band qiling.",
  openGraph: {
    type: 'website',
    siteName: 'MaxTour',
    title: "MaxTour — O'zbekiston sayohat bozori",
    description:
      "O'zbekistondagi tasdiqlangan sayohat agentliklaridan eng yaxshi tur paketlarini toping va band qiling.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body
        className={`${manrope.variable} ${plusJakartaSans.variable} font-sans antialiased`}
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <HapticProvider />
        <Toaster position="top-center" />
        {/* Telegram Mini App SDK — loaded after page is interactive */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
