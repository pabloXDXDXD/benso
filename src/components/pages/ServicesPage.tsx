'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Send, Calendar, Search } from 'lucide-react';
import { BentoCard, Icon, ScrollReveal, AnimatedCard, PriceDisplay, ServicesGridSkeleton, RequestModal, ShinyText } from '@/components';
import Grainient from '@/components/Grainient';
import { useTranslations } from 'next-intl';
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

export function ServicesPage({ initialServicios = [] }: { initialServicios?: Servicio[] }) {
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [animKey, setAnimKey] = useState(0);
  const [requestItem, setRequestItem] = useState<RequestItem | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { addItem } = useCart();
  const t = useTranslations('services');
  const common = useTranslations('common');
  const home = useTranslations('home');
  const filters = [
    { label: t('filterAll'), value: 'all' as CategoryFilter },
    { label: t('filterConsultoria'), value: 'consultoria' as CategoryFilter },
    { label: t('filterCapacitacion'), value: 'capacitacion' as CategoryFilter },
    { label: t('filterHerramientas'), value: 'herramientas' as CategoryFilter },
  ];
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
              <h2>{t('pageTitle')}</h2>
            </div>
            <div className="filter-controls">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
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
                  className="interactive-card service-card toned-card"
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
                      <span>{common('addToCart')}</span>
                    </button>
                  </div>
                </BentoCard>
              </AnimatedCard>
            ))}
          </div>
          )}
        </div>
      </ScrollReveal>

      <div className="cta-card">
        <div className="cta-card-grainient">
          <Grainient className="absolute inset-0" />
        </div>
        <div className="container section-cta cta-card-content">
          <h2>{home('sections.ctaTitle')}</h2>
          <p>{home('sections.ctaText')}</p>
          <button
            className="cta-button cta-button--light"
            onClick={() => {
              setRequestItem({ title: common('appointmentTitle'), price: '', priceNum: 0, whatsappLink: '', type: 'servicio' });
              setIsRequestOpen(true);
            }}
          >
            <Calendar size={18} />
            {home('sections.ctaButton')}
          </button>
        </div>
      </div>

      <RequestModal
        item={requestItem}
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
      />
    </>
  );
}
