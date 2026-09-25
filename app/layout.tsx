import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CANTOPOP BATTLE 2026',
  description: '廣東歌唱擂台2026團隊預覽',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
