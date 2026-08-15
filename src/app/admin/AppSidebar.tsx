'use client';

import { motion } from 'motion/react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  Package,
  Calendar,
  Tag,
  Wrench,
  CalendarDays,
  MessageSquare,
  HelpCircle,
  Inbox,
  UserPlus,
  RefreshCw,
  LogOut,
} from 'lucide-react';

export type AdminTab = 'dashboard' | 'pedidos' | 'citas' | 'solicitudes' | 'inscripciones' | 'productos' | 'servicios' | 'eventos' | 'testimonials' | 'faqs';

export interface AppSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  counts: Record<string, number>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onRefresh: () => void;
  loading: boolean;
  onLogout: () => void;
  isMobile: boolean;
}

interface NavItem {
  tab: AdminTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  countKey?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/** Item solitario (Dashboard) — fuera de cualquier sección agrupada */
const topItems: NavItem[] = [
  { tab: 'dashboard', label: 'Dashboard', icon: TrendingUp },
];

const navSections: NavSection[] = [
  {
    title: 'OPERACIONES',
    items: [
      { tab: 'pedidos', label: 'Pedidos', icon: Package, countKey: 'pedidos' },
      { tab: 'citas', label: 'Citas', icon: Calendar, countKey: 'citas' },
      { tab: 'solicitudes', label: 'Solicitudes', icon: Inbox, countKey: 'servicio_solicitudes' },
      { tab: 'inscripciones', label: 'Inscripciones', icon: UserPlus, countKey: 'evento_inscripciones' },
    ],
  },
  {
    title: 'CATÁLOGO',
    items: [
      { tab: 'productos', label: 'Productos', icon: Tag, countKey: 'productos' },
      { tab: 'servicios', label: 'Servicios', icon: Wrench, countKey: 'servicios' },
      { tab: 'eventos', label: 'Eventos', icon: CalendarDays, countKey: 'eventos' },
    ],
  },
  {
    title: 'CONTENIDO',
    items: [
      { tab: 'testimonials', label: 'Testimonios', icon: MessageSquare, countKey: 'testimonials' },
      { tab: 'faqs', label: 'FAQs', icon: HelpCircle, countKey: 'faqs' },
    ],
  },
];

export default function AppSidebar({
  activeTab,
  onTabChange,
  counts,
  isCollapsed,
  onToggleCollapse,
  onRefresh,
  loading,
  onLogout,
  isMobile,
}: AppSidebarProps) {
  return (
    <>
      {isMobile && !isCollapsed && (
        <div className="sidebar-backdrop" onClick={onToggleCollapse} />
      )}
      <motion.aside
        className="app-sidebar"
        animate={{ width: isCollapsed ? 64 : 200 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="sidebar-inner">
          {/* Header */}
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <img
                src="/assets/logos/Isotipo Benso Claro.svg"
                alt="BENSO"
                className="sidebar-logo-img"
              />
              {!isCollapsed && <span className="sidebar-logo-label">Admin</span>}
            </div>
            <button
              className="sidebar-toggle"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
              aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav admin-nav">
            {/* Items sueltos (Dashboard) */}
            <div className="sidebar-section">
              {topItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.tab}
                    className={`sidebar-item${activeTab === item.tab ? ' active' : ''}`}
                    onClick={() => onTabChange(item.tab)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="sidebar-item-icon">
                      <Icon size={18} />
                    </span>
                    {!isCollapsed && (
                      <span className="sidebar-item-label">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Secciones agrupadas */}
            {navSections.map((section) => (
              <div key={section.title} className="sidebar-section">
                {!isCollapsed && (
                  <span className="sidebar-section-title">{section.title}</span>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const count = item.countKey ? counts[item.countKey] : undefined;
                  return (
                    <button
                      key={item.tab}
                      className={`sidebar-item${activeTab === item.tab ? ' active' : ''}`}
                      onClick={() => onTabChange(item.tab)}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span className="sidebar-item-icon">
                        <Icon size={18} />
                      </span>
                      {!isCollapsed && (
                        <span className="sidebar-item-label">{item.label}</span>
                      )}
                      {!isCollapsed && count !== undefined && (
                        <span className="badge">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer — estilo nav-item */}
          <div className="sidebar-footer">
            <button
              className="sidebar-item sidebar-footer-btn"
              onClick={onRefresh}
              title={isCollapsed ? 'Actualizar' : ''}
            >
              <span className="sidebar-item-icon">
                <RefreshCw size={18} className={loading ? 'spin' : ''} />
              </span>
              {!isCollapsed && (
                <span className="sidebar-item-label">{loading ? 'Cargando...' : 'Actualizar'}</span>
              )}
            </button>
            <button
              className="sidebar-item sidebar-footer-btn"
              onClick={onLogout}
              title={isCollapsed ? 'Salir' : ''}
            >
              <span className="sidebar-item-icon">
                <LogOut size={18} />
              </span>
              {!isCollapsed && (
                <span className="sidebar-item-label">Salir</span>
              )}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
