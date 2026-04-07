import type { Metadata } from 'next';
import { Inter, Manrope, Work_Sans } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
});

export const metadata: Metadata = {
  title: 'FoodControl - Gestão de Refeições',
  description: 'Sistema de Gestão de Refeições e Presença (Lunch Control)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" className={`${inter.variable} ${manrope.variable} ${workSans.variable}`}>
      <body suppressHydrationWarning className="bg-[#f4faff] text-[#111d23] font-body antialiased">
        {children}
      </body>
    </html>
  );
}
