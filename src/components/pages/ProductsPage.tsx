'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingCart, Calendar, Search } from 'lucide-react';
import { BentoCard, PriceDisplay, RequestModal, ProductsGridSkeleton, VariantSelectionDialog } from '@/components';
import { useCart } from '@/hooks/useCart';
import { useProductos, type Producto } from '@/hooks/useData';
import { imgSrc } from '@/lib/imageLoader';
interface RequestItem {
  title: string;
  price: string;
  priceNum: number;
  whatsappLink: string;
  type: 'servicio' | 'producto' | 'evento';
}

type CategoryFilter = 'all' | 'adhesivos' | 'carteleria' | 'papeleria' | 'indumentaria' | 'merchandising';

const filters = [
  { label: 'Todos', value: 'all' as CategoryFilter },
  { label: 'Adhesivos', value: 'adhesivos' as CategoryFilter },
  { label: 'Cartelería', value: 'carteleria' as CategoryFilter },
  { label: 'Papelería', value: 'papeleria' as CategoryFilter },
  { label: 'Indumentaria', value: 'indumentaria' as CategoryFilter },
  { label: 'Merchandising', value: 'merchandising' as CategoryFilter },
];

export function ProductsPage({ initialProductos = [] }: { initialProductos?: Producto[] }) {
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [requestItem, setRequestItem] = useState<RequestItem | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const { addItem } = useCart();
  const { productos, loading } = useProductos(initialProductos);

  useEffect(() => { setMounted(true); }, []);

  const openRequest = (item: RequestItem) => {
    setRequestItem(item);
    setIsRequestOpen(true);
  };

  const filteredProducts = productos.filter(
    product => (activeFilter === 'all' || product.category === activeFilter) &&
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Prevent hydration mismatch: server and client first render must match
  const isLoading = !mounted || (loading && initialProductos.length === 0);

  return (
    <div className="reveal-section reveal-disabled">
      <div className="container">
        <div className="section-title-row page-intro-title">
          <div className="section-title">
            <h2>Nuestros productos</h2>
          </div>
          <div className="filter-controls">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                disabled={isLoading}
              />
            </div>
            <select
              className="filter-select"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as CategoryFilter)}
              disabled={isLoading}
            >
              {filters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <ProductsGridSkeleton count={8} />
        ) : filteredProducts.length === 0 ? (
          <div className="bento-grid">
            <div className="bento-card">
              <p>No hay productos disponibles</p>
            </div>
          </div>
        ) : (
          <div className="bento-grid">
            {filteredProducts.map((product) => (
              <div key={`${activeFilter}-${product.id}`}>
                <BentoCard 
                  className={`interactive-card service-card${product.popular ? ' popular-card' : ''}`}
                  dataCategory={product.category}
                >
                  {product.popular && <span className="popular-tag">#popular</span>}
                  {product.image ? (
                    <div className="product-image-container">
                      <Image 
                        src={imgSrc(product.image)} 
                        alt={product.title} 
                        width={600} 
                        height={200} 
                        loading="lazy" 
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="product-image-placeholder">
                      <span>Imagen no disponible</span>
                    </div>
                  )}
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                  <span className="card-price"><PriceDisplay price={product.price} priceNum={product.price_num} /></span>
                  <div className="card-actions">
                    <button
                        className="btn-add-cart btn-add-cart-full"
                        onClick={() => {
                          if (product.variants && product.variants.length > 0) {
                            setSelectedProduct(product);
                          } else {
                            addItem(product.title, 'Único', product.price_num);
                          }
                        }}
                      >
                        <ShoppingCart size={16} />
                        <span>Añadir al carrito</span>
                      </button>
                  </div>
                </BentoCard>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="container section-cta">
        <h2>¿Listo para transformar tu negocio?</h2>
        <p>Agenda una cita y descubre cómo podemos ayudarte a alcanzar tus metas.</p>
        <button
          className="cta-button"
          onClick={() => {
            setRequestItem({ title: 'Cita de consulta', price: '', priceNum: 0, whatsappLink: '', type: 'servicio' });
            setIsRequestOpen(true);
          }}
        >
          <Calendar size={18} />
          Agendar cita
        </button>
      </div>

      {selectedProduct && (
        <VariantSelectionDialog
          product={{
            id: selectedProduct.id,
            title: selectedProduct.title,
            description: selectedProduct.description,
            image: selectedProduct.image,
            variants: selectedProduct.variants,
            category: selectedProduct.category,
          }}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <RequestModal
        item={requestItem}
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
      />
    </div>
  );
}