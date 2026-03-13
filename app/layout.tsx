import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from '@/components/ui/sonner';
import { LanguageProvider } from '@/lib/i18n';
import { HapticProvider } from '@/components/shared/haptic-provider';
import './globals.css';

const inter = Inter({
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <HapticProvider />
        <Toaster position="top-center" />
        {/* Telegram Mini App SDK — loaded after page is interactive */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
