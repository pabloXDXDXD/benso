'use client';

import { useState, useEffect } from 'react';
import { Calendar, Search, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { BentoCard, Icon, ScrollReveal, AnimatedCard, AnimatedSection, StaggerReveal, ServicesGridSkeleton } from '@/components';
import Grainient from '@/components/Grainient';
import { useServicios, type Servicio } from '@/hooks/useData';
import { serviceSlug } from '@/lib/slugify';

type CategoryFilter = 'all' | 'contabilidad-finanzas' | 'marketing-marca' | 'soluciones-bi-digital' | 'administracion-gestion';

const FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'contabilidad-finanzas', label: 'Contabilidad y Finanzas' },
  { value: 'marketing-marca', label: 'Marketing y Marca' },
  { value: 'soluciones-bi-digital', label: 'Soluciones BI y Digital' },
  { value: 'administracion-gestion', label: 'Administración y Gestión' },
];

export function ServicesPage({ initialServicios }: { initialServicios?: Servicio[] }) {
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [animKey, setAnimKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { servicios, loading, error, retry } = useServicios(initialServicios);
  const showLoading = !mounted || (loading && (initialServicios || []).length === 0);

  useEffect(() => { setMounted(true); }, []);

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
                {FILTERS.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
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
                <p>No pudimos cargar los servicios. Revisa tu conexión e inténtalo de nuevo.</p>
                <button onClick={retry} className="btn-add-cart btn-add-cart-full">
                  <RefreshCw size={16} />
                  Reintentar
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
                    <Link href={`/servicios/${serviceSlug(service, servicios)}`} className="event-cta-link">
                      <span>Ver más info</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
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
