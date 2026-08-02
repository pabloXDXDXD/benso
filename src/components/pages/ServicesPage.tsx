'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Calendar, Search, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { BentoCard, Icon, ScrollReveal, AnimatedCard, ServicesGridSkeleton } from '@/components';
import Grainient from '@/components/Grainient';
import { useServicios, type Servicio } from '@/hooks/useData';
import { ServiceRequestModal } from '@/components/ServiceRequestModal';

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
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
                    <button className="btn-view-more" onClick={() => openModal(service)}>
                      Ver más info
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
          <h2>¿Listo para transformar tu negocio?</h2>
          <p>Agenda una cita y descubre cómo podemos ayudarte a escalar tus proyectos.</p>
          <Link href="/contacto" className="cta-button cta-button--light">
            <Calendar size={18} />
            Agendar cita
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
