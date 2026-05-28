import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Construtor — AI Page Builder para E-books',
  description: 'Crie landing pages profissionais para seus e-books em minutos com IA.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans text-gray-900 bg-white">
        {children}
      </body>
    </html>
  );
}
