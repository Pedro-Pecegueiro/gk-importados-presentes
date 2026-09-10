import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://gkpresentes.com.br'),
  title: 'GK Importados e Presentes | Perfumaria e presentes em Suzano',
  description:
    'Perfumes, autocuidado e presentes selecionados em Suzano. Monte sua sacola e receba atendimento personalizado pelo WhatsApp.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'GK Importados e Presentes',
    title: 'GK Importados e Presentes',
    description:
      'Perfumes, autocuidado e presentes selecionados com atendimento personalizado pelo WhatsApp.',
  },
  twitter: {
    card: 'summary',
    title: 'GK Importados e Presentes',
    description:
      'Perfumes, autocuidado e presentes selecionados com atendimento personalizado pelo WhatsApp.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
