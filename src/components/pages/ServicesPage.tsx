'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Send, Calendar, Search } from 'lucide-react';
import { BentoCard, Icon, ScrollReveal, AnimatedCard, PriceDisplay, ServicesGridSkeleton, RequestModal, ShinyText } from '@/components';
import { useCart } from '@/hooks/useCart';
import { useServicios, type Servicio } from '@/hooks/useData';

type CategoryFilter = 'all' | 'consultoria' | 'capacitacion' | 'herramientas';

interface RequestItem {
  title: string;
  price: string;
  priceNum: number;
  whatsappLink: string;
  type: 'servicio' | 'producto' | 'evento';
}

const filters = [
  { label: 'Todos', value: 'all' as CategoryFilter },
  { label: 'Consultoría', value: 'consultoria' as CategoryFilter },
  { label: 'Capacitación', value: 'capacitacion' as CategoryFilter },
  { label: 'Herramientas', value: 'herramientas' as CategoryFilter },
];

export function ServicesPage({ initialServicios = [] }: { initialServicios?: Servicio[] }) {
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [animKey, setAnimKey] = useState(0);
  const [requestItem, setRequestItem] = useState<RequestItem | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { addItem } = useCart();
  const { servicios, loading } = useServicios(initialServicios);
  const showLoading = !mounted || (loading && initialServicios.length === 0);

  useEffect(() => { setMounted(true); }, []);

  const openRequest = (item: RequestItem) => {
    setRequestItem(item);
    setIsRequestOpen(true);
  };

  const filteredServices = servicios.filter(
    service => (activeFilter === 'all' || service.category === activeFilter) &&
    service.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFilterChange = (value: CategoryFilter) => {
    setActiveFilter(value);
    setAnimKey(prev => prev + 1);
  };

  return (
    <>
      <ScrollReveal>
        <div className="container">
          <div className="section-title-row page-intro-title">
            <div className="section-title">
              <h2>Nuestros servicios</h2>
            </div>
            <div className="filter-controls">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar servicios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <select
                className="filter-select"
                value={activeFilter}
                onChange={(e) => handleFilterChange(e.target.value as CategoryFilter)}
              >
                {filters.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <ServicesGridSkeleton count={6} />
          ) : (
          <div className="bento-grid" key={animKey}>
            {filteredServices.map((service, idx) => (
              <AnimatedCard key={`${activeFilter}-${service.id}`} index={idx}>
                <BentoCard 
                  className="interactive-card service-card"
                  dataCategory={service.category}
                >
                  <div className="service-card-header">
                    <Icon name={service.icon} />
                    <h3>{service.title}</h3>
                  </div>
                  <p>{service.description}</p>
                  <span className="card-price"><PriceDisplay price={service.price} priceNum={service.price_num} /></span>
                  <div className="card-actions">
                    <button
                      className="btn-add-cart btn-add-cart-full"
                      onClick={() => addItem(service.title, 'Único', service.price_num)}
                    >
                      <ShoppingCart size={16} />
                      <span>Añadir al carrito</span>
                    </button>
                  </div>
                </BentoCard>
              </AnimatedCard>
            ))}
          </div>
          )}
        </div>
      </ScrollReveal>

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

      <RequestModal
        item={requestItem}
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
      />
    </>
  );
}
