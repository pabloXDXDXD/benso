'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Calendar, Search, RefreshCw } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { BentoCard, Icon, ScrollReveal, AnimatedCard, ServicesGridSkeleton } from '@/components';
import Grainient from '@/components/Grainient';
import { useTranslations } from 'next-intl';
import { useServicios, type Servicio } from '@/hooks/useData';
import { ServiceRequestModal } from '@/components/ServiceRequestModal';

type CategoryFilter = 'all' | 'contabilidad-finanzas' | 'marketing-marca' | 'soluciones-bi-digital' | 'administracion-gestion';

const FILTERS: { value: CategoryFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'filterAll' },
  { value: 'contabilidad-finanzas', labelKey: 'filterFinanzas' },
  { value: 'marketing-marca', labelKey: 'filterMarketing' },
  { value: 'soluciones-bi-digital', labelKey: 'filterBIDigital' },
  { value: 'administracion-gestion', labelKey: 'filterAdmon' },
];

export function ServicesPage({ initialServicios }: { initialServicios?: Servicio[] }) {
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [animKey, setAnimKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations('services');
  const home = useTranslations('home');
  const { servicios, loading, error, retry } = useServicios(initialServicios);
  const showLoading = !mounted || (loading && (initialServicios || []).length === 0);

  useEffect(() => { setMounted(true); }, []);

  const openModal = (servicio: Servicio) => {
    setSelectedServicio(servicio);
    setIsModalOpen(true);
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
                {FILTERS.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {t(filter.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <ServicesGridSkeleton count={6} />
          ) : error && servicios.length === 0 ? (
            <div className="bento-grid">
              <div className="bento-card">
                <p>{t('loadError')}</p>
                <button onClick={retry} className="btn-add-cart btn-add-cart-full">
                  <RefreshCw size={16} />
                  {t('retry')}
                </button>
              </div>
            </div>
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
                  {service.subtitle && <p className="service-card-subtitle">{service.subtitle}</p>}
                  <div className="card-actions">
                    <button className="btn-view-more" onClick={() => openModal(service)}>
                      {t('viewMoreInfo')}
                      <ArrowRight size={15} />
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
          <Link href="/contacto" className="cta-button cta-button--light">
            <Calendar size={18} />
            {home('sections.ctaButton')}
          </Link>
        </div>
      </div>

      <ServiceRequestModal
        servicio={selectedServicio}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
