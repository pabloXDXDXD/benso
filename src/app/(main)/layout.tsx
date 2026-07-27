import { CartProvider } from '@/context/CartContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { SWRProvider } from '@/components/SWRProvider'; // localStorage-backed SWR cache
import { PromoBanner, Header, Footer, Cart, TopBarWrapper } from '@/components';
import { Toaster } from 'react-hot-toast';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CurrencyProvider>
    <CartProvider>
      <SWRProvider>
        <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
        <TopBarWrapper />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <Cart />
        <Toaster position="bottom-left" toastOptions={{ duration: 3000 }} />
      </SWRProvider>
    </CartProvider>
    </CurrencyProvider>
  );
}
