'use client';

import { motion } from 'motion/react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  LogOut,
  ClipboardList,
  BarChart3,
  Users,
} from 'lucide-react';

export type ViewType = 'kanban' | 'reports' | 'equipo';

export interface TeamSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onRefresh: () => void;
  loading: boolean;
  isMobile: boolean;
  onLogout?: () => void;
  role: 'admin' | 'user';
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'TAREAS',
    items: [
      { id: 'kanban', label: 'Tareas', icon: ClipboardList },
    ],
  },
  {
    title: 'GESTIÓN',
    items: [
      { id: 'reports', label: 'Reportes', icon: BarChart3 },
      { id: 'equipo', label: 'Equipo', icon: Users },
    ],
  },
];

export default function TeamSidebar({
  isCollapsed,
  onToggleCollapse,
  onRefresh,
  loading,
  isMobile,
  onLogout,
  role,
  activeView,
  onViewChange,
}: TeamSidebarProps) {
  // Filter sections based on role — users only get TAREAS
  const visibleSections = role === 'admin'
    ? navSections
    : navSections.filter((s) => s.title === 'TAREAS');

  return (
    <>
      {isMobile && !isCollapsed && (
        <div className="sidebar-backdrop" onClick={onToggleCollapse} />
      )}
      <motion.aside
        className="app-sidebar team-sidebar"
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
              {!isCollapsed && <span className="sidebar-logo-label">Team</span>}
            </div>
            <button
              className="sidebar-toggle"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expandir' : 'Colapsar'}
              aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {/* Navigation — matching admin sidebar structure */}
          <nav className="sidebar-nav admin-nav">
            {visibleSections.map((section) => (
              <div key={section.title} className="sidebar-section">
                {!isCollapsed && (
                  <span className="sidebar-section-title">{section.title}</span>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className={`sidebar-item${activeView === item.id ? ' active' : ''}`}
                      onClick={() => onViewChange(item.id)}
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
            ))}
          </nav>

          {/* Footer */}
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
            {onLogout && (
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
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
