import './globals.css';
import { Navbar } from '@/components/Navbar';
import { ProfileSelector } from '@/components/ProfileSelector';
import { GlobalChat } from '@/components/GlobalChat';
import { initOmegaShield } from '@/lib/omegaShield';

export const metadata = {
  title: 'Omnimux Ultimate - Vercel Edition',
  description: 'The definitive streaming platform.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(${initOmegaShield.toString()})();` }} />
      </head>
      <body>
        <ProfileSelector />
        <Navbar />
        {children}
        <GlobalChat />
      </body>
    </html>
  );
}
