import type { Metadata } from 'next';
import { Inter, Noto_Serif_Display } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const notoSerifDisplay = Noto_Serif_Display({
  variable: '--font-noto-serif-display',
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LCMS',
  description: 'Legal Contract Management System',
  icons: {
    icon: '/logo/logo.png',
    shortcut: '/logo/logo.png',
    apple: '/logo/logo.png',
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="lo"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSerifDisplay.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
