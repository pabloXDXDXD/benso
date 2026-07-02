import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/lib/query-client';
import './admin.css';

export const metadata: Metadata = {
  title: 'BENSO Admin',
  description: 'Panel de administración BENSO',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
      {children}
    </Providers>
  );
}