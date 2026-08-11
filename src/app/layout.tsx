import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Plus_Jakarta_Sans as PlusJakartaSans, Outfit } from 'next/font/google';
import './globals.css';

// Same two families sals3-portal uses. Keeping the type identical is what
// makes the two products read as one system while the colour theme differs.
const jakarta = PlusJakartaSans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['500', '600'],
});

export const metadata: Metadata = {
  title: 'Sals3 Admin Portal',
  description:
    'Internal Sals3 platform control plane. Employee access only, deny by default.',
  // Internal control plane. Keep it out of search engines and AI answer
  // surfaces on purpose - `next.config.ts` sends the matching `X-Robots-Tag`
  // header so non-document responses are covered too.
  robots: { index: false, follow: false },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
