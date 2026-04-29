import './globals.css';
import { initOmegaShield } from '@/lib/omegaShield';
import { ClientWrapper } from '@/components/ClientWrapper';

export const metadata = {
  title: 'Omnimux Ultimate - 10X Edition',
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
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
