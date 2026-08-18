'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { SlidersHorizontal, ChevronUp, ChevronDown } from 'lucide-react';

export type SortDir = 'asc' | 'desc';

export interface AdminTableSort {
  key: string;
  dir: SortDir;
}

export interface AdminTablePref {
  hidden: string[];
  sort: AdminTableSort | null;
  filters: Record<string, string>;
}

export const defaultAdminTablePref = (): AdminTablePref => ({
  hidden: [],
  sort: null,
  filters: {},
});

export interface AdminTableColumn<T> {
  /** Identificador único; también se usa para los anchos de columna: `${prefix}-${key}`. */
  key: string;
  label: string;
  /** Si existe, la columna es ordenable al hacer clic en el encabezado. */
  sortValue?: (row: T) => string | number;
  /** Si existe, la columna aparece en el panel de filtros por columna. */
  filterValue?: (row: T) => string;
  /** La columna no se puede ocultar (p. ej. Acciones). */
  alwaysVisible?: boolean;
  /** Devuelve el <td> completo de la celda. */
  render: (row: T) => ReactNode;
}

interface AdminTableCustomizerProps {
  columns: AdminTableColumn<any>[];
  pref: AdminTablePref;
  onPrefChange: (pref: AdminTablePref) => void;
}

/** Botón "Personalizar" + panel de columnas y filtros. Vive en la toolbar del admin. */
export function AdminTableCustomizer({ columns, pref, onPrefChange }: AdminTableCustomizerProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const hidden = useMemo(() => new Set(pref.hidden || []), [pref.hidden]);
  const filters = pref.filters || {};

  const visibleColumns = useMemo(
    () => columns.filter(c => !hidden.has(c.key)),
    [columns, hidden],
  );

  const hasCustomization =
    (pref.hidden?.length || 0) > 0 ||
    !!pref.sort ||
    Object.values(filters).some(v => (v || '').trim() !== '');

  // Cerrar el panel al hacer clic fuera
  useEffect(() => {
    if (!panelOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [panelOpen]);

  function toggleColumn(key: string) {
    const nextHidden = hidden.has(key)
      ? (pref.hidden || []).filter(k => k !== key)
      : [...(pref.hidden || []), key];
    onPrefChange({ ...pref, hidden: nextHidden });
  }

  function setFilter(key: string, value: string) {
    onPrefChange({ ...pref, filters: { ...filters, [key]: value } });
  }

  function resetAll() {
    onPrefChange(defaultAdminTablePref());
    setPanelOpen(false);
  }

  return (
    <div className="table-customize-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`btn-customize${hasCustomization ? ' has-custom' : ''}`}
        onClick={() => setPanelOpen(o => !o)}
        aria-expanded={panelOpen}
      >
        <SlidersHorizontal size={15} />
        Personalizar
        {hasCustomization && <span className="custom-dot" aria-label="Personalización activa" />}
      </button>
      {panelOpen && (
        <div className="table-panel">
          <div className="table-panel-section">
            <div className="table-panel-title">Columnas visibles</div>
            <div className="col-check-list">
              {columns.map(col => (
                <label key={col.key} className="col-check-item">
                  <input
                    type="checkbox"
                    checked={!hidden.has(col.key)}
                    disabled={col.alwaysVisible}
                    onChange={() => toggleColumn(col.key)}
                  />
                  <span>{col.label}</span>
                  {col.alwaysVisible && <em className="always-visible-hint">siempre</em>}
                </label>
              ))}
            </div>
          </div>
          <div className="table-panel-section">
            <div className="table-panel-title">Filtros por columna</div>
            {visibleColumns.some(c => c.filterValue) ? (
              <div className="filter-list">
                {visibleColumns.filter(c => c.filterValue).map(col => (
                  <label key={col.key} className="filter-item">
                    <span>{col.label}</span>
                    <input
                      type="text"
                      value={filters[col.key] || ''}
                      onChange={e => setFilter(col.key, e.target.value)}
                      placeholder={`Filtrar por ${col.label.toLowerCase()}`}
                    />
                  </label>
                ))}
              </div>
            ) : (
              <div className="table-panel-empty">Sin columnas filtrables</div>
            )}
          </div>
          {hasCustomization && (
            <button type="button" className="btn-customize-reset" onClick={resetAll}>
              Restablecer vista
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface AdminDataTableProps<T> {
  /** Prefijo de la tabla para las claves de ancho de columna (p. ej. 'pedidos', 'sol'). */
  prefix: string;
  columns: AdminTableColumn<T>[];
  rows: T[];
  pref: AdminTablePref;
  onPrefChange: (pref: AdminTablePref) => void;
  colWidths: Record<string, number>;
  getColWidth: (key: string, overrides: Record<string, number>) => number;
  renderResizeHandle?: (colKey: string) => ReactNode;
  footer?: ReactNode;
}

export default function AdminDataTable<T>({
  prefix,
  columns,
  rows,
  pref,
  onPrefChange,
  colWidths,
  getColWidth,
  renderResizeHandle,
  footer,
}: AdminDataTableProps<T>) {
  const hidden = useMemo(() => new Set(pref.hidden || []), [pref.hidden]);
  const filters = pref.filters || {};
  const sort = pref.sort || null;

  const visibleColumns = useMemo(
    () => columns.filter(c => !hidden.has(c.key)),
    [columns, hidden],
  );

  const filteredRows = useMemo(() => {
    const active = Object.entries(filters).filter(([, v]) => (v || '').trim() !== '');
    if (active.length === 0) return rows;
    return rows.filter(row =>
      active.every(([key, value]) => {
        const col = columns.find(c => c.key === key);
        const raw = col?.filterValue ? col.filterValue(row) : '';
        return String(raw || '').toLowerCase().includes(value.toLowerCase());
      }),
    );
  }, [rows, filters, columns]);

  const sortedRows = useMemo(() => {
    if (!sort) return filteredRows;
    const col = columns.find(c => c.key === sort.key);
    if (!col?.sortValue) return filteredRows;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), 'es', { numeric: true });
      return cmp * dir;
    });
  }, [filteredRows, sort, columns]);

  function toggleSort(key: string) {
    const col = columns.find(c => c.key === key);
    if (!col?.sortValue) return;
    let next: AdminTableSort | null;
    if (!sort || sort.key !== key) next = { key, dir: 'asc' };
    else if (sort.dir === 'asc') next = { key, dir: 'desc' };
    else next = null;
    onPrefChange({ ...pref, sort: next });
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <colgroup>
          {visibleColumns.map(col => (
            <col key={col.key} style={{ width: getColWidth(`${prefix}-${col.key}`, colWidths) }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {visibleColumns.map(col => (
              <th
                key={col.key}
                style={{ position: 'relative' }}
                className={col.sortValue ? 'th-sortable' : ''}
                onClick={e => {
                  if ((e.target as HTMLElement).closest('.col-resize-handle')) return;
                  toggleSort(col.key);
                }}
              >
                <span className="th-content">{col.label}</span>
                {sort?.key === col.key && (
                  <span className="th-sort-indicator">
                    {sort.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </span>
                )}
                {renderResizeHandle && renderResizeHandle(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, i) => (
            <tr key={(row as any)?.id ?? i}>
              {visibleColumns.map(col => col.render(row))}
            </tr>
          ))}
          {sortedRows.length === 0 && (
            <tr>
              <td colSpan={Math.max(1, visibleColumns.length)} className="empty-cell">
                Sin resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {footer}
    </div>
  );
}