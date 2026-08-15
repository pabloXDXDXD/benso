'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar, Search, RefreshCw } from 'lucide-react';
import { BentoCard, PriceDisplay, ProductsGridSkeleton, AnimatedCard, AnimatedSection, StaggerReveal, ScrollReveal } from '@/components';
import Grainient from '@/components/Grainient';
import { useProductos, type Producto } from '@/hooks/useData';
import { imgSrc } from '@/lib/imageLoader';
import { productSlug } from '@/lib/slugify';

type CategoryFilter = 'all' | 'adhesivos' | 'carteleria' | 'papeleria' | 'indumentaria' | 'merchandising';

export function ProductsPage({ initialProductos }: { initialProductos?: Producto[] }) {
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { productos, loading, error, retry } = useProductos(initialProductos);
  const filters = [
    { label: 'Todos', value: 'all' as CategoryFilter },
    { label: 'Adhesivos', value: 'adhesivos' as CategoryFilter },
    { label: 'Cartelería', value: 'carteleria' as CategoryFilter },
    { label: 'Papelería', value: 'papeleria' as CategoryFilter },
    { label: 'Indumentaria', value: 'indumentaria' as CategoryFilter },
    { label: 'Merchandising', value: 'merchandising' as CategoryFilter },
  ];

  useEffect(() => { setMounted(true); }, []);

  const filteredProducts = productos.filter(
    product => (activeFilter === 'all' || product.category === activeFilter) &&
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Prevent hydration mismatch: server and client first render must match
  const isLoading = !mounted || (loading && (initialProductos || []).length === 0);

  return (
    <>
    <ScrollReveal>
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
        ) : error && productos.length === 0 ? (
          <div className="bento-grid">
            <div className="bento-card">
              <p>No pudimos cargar los productos. Revisa tu conexión e inténtalo de nuevo.</p>
              <button onClick={retry} className="btn-add-cart btn-add-cart-full">
                <RefreshCw size={16} />
                Reintentar
              </button>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bento-grid">
            <div className="bento-card">
              <p>No hay productos disponibles</p>
            </div>
          </div>
        ) : (
          <div className="bento-grid">
            {filteredProducts.map((product, index) => (
              <AnimatedCard key={`${activeFilter}-${product.id}`} index={index}>
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
                    <Link href={`/productos/${productSlug(product, productos)}`} className="event-cta-link">
                      <span>Ver detalles</span>
                      <ArrowRight size={16} className="arrow-right" />
                    </Link>
                  </div>
                </BentoCard>
              </AnimatedCard>
            ))}
          </div>
        )}
      </div>

      </ScrollReveal>

      <AnimatedSection>
        <div className="cta-card">
          <div className="cta-card-grainient">
            <Grainient className="absolute inset-0" />
          </div>
          <div className="container section-cta cta-card-content">
            <StaggerReveal>
              <h2>¿Listo para transformar tu negocio?</h2>
              <p>Agenda una cita y descubre cómo podemos ayudarte a escalar tus proyectos.</p>
              <Link href="/contacto" className="cta-button cta-button--light">
                <Calendar size={18} />
                Agendar cita
              </Link>
            </StaggerReveal>
          </div>
        </div>
      </AnimatedSection>
    </>
  );
}