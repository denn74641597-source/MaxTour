import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Manrope } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from '@/components/ui/sonner';
import { LanguageProvider } from '@/lib/i18n';
import { HapticProvider } from '@/components/shared/haptic-provider';
import { BeamBackground } from '@/components/pioneerui/beam-background';
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
  maximumScale: 5,
  userScalable: true,
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
          <div className="relative min-h-screen">
            <BeamBackground
              className="pointer-events-none fixed inset-0 z-0 min-h-screen bg-transparent [&>div:nth-child(2)]:hidden"
              beams={[
                { color: '#2563eb', opacity: 0.28, width: 34, height: '62%' },
                { color: '#4f46e5', opacity: 0.24, width: 24, height: '48%' },
                { color: '#0ea5e9', opacity: 0.26, width: 44, height: '70%' },
                { color: '#6366f1', opacity: 0.22, width: 30, height: '56%' },
                { color: '#38bdf8', opacity: 0.24, width: 40, height: '64%' },
                { color: '#8b5cf6', opacity: 0.2, width: 22, height: '44%' },
                { color: '#3b82f6', opacity: 0.26, width: 36, height: '58%' },
              ]}
            />
            <div className="relative z-10">{children}</div>
          </div>
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
