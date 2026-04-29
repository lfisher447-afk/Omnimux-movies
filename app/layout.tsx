import './globals.css';
import { initOmegaShield } from '@/lib/omegaShield';
import { ClientWrapper } from '@/components/ClientWrapper';

export const metadata = {
  title: 'Omnimux Ultimate - 10X Edition',
  description: 'The definitive neural streaming multiplex.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(${initOmegaShield.toString()})();` }} />
      </head>
      <body className="bg-[#030508] text-white selection:bg-indigo-500/30">
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
