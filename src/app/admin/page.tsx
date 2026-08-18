'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import AppSidebar, { AdminTab } from './AppSidebar';
import { BensoLogo } from '@/components/BensoLogo';

const FN_URL = 'https://irhbkkfvcawklbahivii.supabase.co/functions/v1';
import { 
  Search, Plus, CheckCheck, X,
  Edit2, Save, Trash2, Copy, Loader,
  Clock, Mail, Phone,
  Eye, EyeOff, ShoppingCart, DollarSign, CheckCircle, CalendarCheck,
  MessageSquare, HelpCircle, ImageUp, Upload
} from 'lucide-react';
import AdminDataTable, { AdminTableCustomizer, AdminTableColumn, AdminTablePref, defaultAdminTablePref } from '@/components/admin/AdminDataTable';

interface ProductVariant {
  label: string;
  unit_price: number;
  total_price: number;
  description?: string;
}

interface Producto {
  id: number;
  title: string;
  description: string;
  price: string;
  price_num: number;
  category: string;
  icon: string;
  popular: boolean;
  image?: string;
  whatsapp_link?: string;
  price_type?: string;
  is_active?: boolean;
  variants?: ProductVariant[];
}

interface Servicio {
  id: number;
  title: string;
  description: string;
  price: string;
  price_num: number;
  category: string;
  icon: string;
  popular: boolean;
  image?: string;
  subtitle?: string;
  includes?: string[];
  whatsapp_link?: string;
  price_type?: string;
  is_active?: boolean;
}

interface Evento {
  id: number;
  title: string;
  description: string;
  date: string;
  status: string;
  image?: string;
  categoria?: string;
  icon?: string;
}

interface Pedido {
  id: number;
  customer_name: string;
  customer_email: string;
  items: any;
  total_price: number;
  status: string;
  created_at: string;
}

interface Cita {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  mensaje: string;
  fecha_creacion: string;
}

interface Solicitud {
  id: number;
  servicio_id: number | null;
  servicio_titulo: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  mensaje?: string | null;
  created_at: string;
}

interface Inscripcion {
  id: number;
  evento_id: number | null;
  evento_titulo: string;
  correo_electronico: string;
  telefono: string;
  nivel_estudios?: string | null;
  tiene_negocio?: boolean | null;
  nombre_negocio?: string | null;
  sector?: string | null;
  motivacion?: string | null;
  acuerdo_aprendizaje?: boolean | null;
  notificaciones?: boolean | null;
  tipo_solicitud: string;
  created_at: string;
}

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  position: string;
  image: string;
  is_active: boolean;
  sort_order: number;
}

interface Faq {
  id: number;
  question: string;
  answer: string;
  is_active: boolean;
  sort_order: number;
}

const PRODUCT_CATEGORIES = ['adhesivos', 'carteleria', 'papeleria', 'indumentaria', 'merchandising', 'lonas', 'otros'];
const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  adhesivos: 'Adhesivos',
  carteleria: 'Cartelería',
  papeleria: 'Papelería',
  indumentaria: 'Indumentaria',
  merchandising: 'Merchandising',
  lonas: 'Lonas',
  otros: 'Otros',
};
const SERVICE_CATEGORIES = ['contabilidad-finanzas', 'marketing-marca', 'soluciones-bi-digital', 'administracion-gestion'];
const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  'contabilidad-finanzas': 'Contabilidad y Finanzas',
  'marketing-marca': 'Marketing y Marca',
  'soluciones-bi-digital': 'Soluciones BI y Digital',
  'administracion-gestion': 'Administración y Gestión',
};
const EVENT_CATEGORIES = ['taller', 'curso', 'evento'];
const EVENT_CATEGORY_LABELS: Record<string, string> = {
  taller: 'Taller',
  curso: 'Curso',
  evento: 'Evento',
};

function extractNumberFromPrice(price: string): number {
  const match = price.match(/[\d,.]+/);
  if (match) {
    const numStr = match[0].replace(/,/g, '');
    return parseFloat(numStr) || 0;
  }
  return 0;
}

function formatId(id: number): string {
  return String(id).padStart(3, '0');
}

const COLUMN_DEFAULTS: Record<string, number> = {
  id: 70, acciones: 100, popular: 80, estado: 80,
  precio: 120, fecha: 120, contactos: 200, items: 220, formacion: 110,
  total: 110, cliente: 150, nombre: 150, titulo: 200,
  desc: 250, mensaje: 250, msj: 250,
  subtitle: 200, includes: 240,
  categoria: 110, variantes: 110,
};

function getColWidth(key: string, overrides: Record<string, number>): number {
  if (overrides[key]) return overrides[key];
  const suffix = key.split('-').pop() || '';
  return COLUMN_DEFAULTS[suffix] ?? 150;
}

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pedidos' | 'citas' | 'solicitudes' | 'inscripciones' | 'productos' | 'servicios' | 'eventos' | 'testimonials' | 'faqs'>('dashboard');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  // loading is derived from queries below — kept as var name for JSX compatibility
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTable, setCreateTable] = useState<'productos' | 'servicios' | 'eventos' | 'testimonials' | 'faqs'>('productos');
  const [createData, setCreateData] = useState({title: '', description: '', price: '', category: '', icon: '', popular: false, whatsapp_link: '', date: '', status: 'Proximamente', author: '', quote: '', position: '', question: '', answer: ''});
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ table: string; id: number; label: string } | null>(null);
  const [expandedCells, setExpandedCells] = useState<Record<string, boolean>>({});
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const resizeRef = useRef<{ col: string; startX: number; startW: number } | null>(null);
  const mouseMoveRef = useRef<((ev: MouseEvent) => void) | null>(null);
  const mouseUpRef = useRef<((ev: MouseEvent) => void) | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ── Preferencias de tabla (columnas visibles, filtros, orden) ──
  const TABLE_PREFS_KEY = 'admin-table-prefs-v1';
  const [tablePrefs, setTablePrefs] = useState<Record<string, AdminTablePref>>(() => {
    try {
      const raw = localStorage.getItem(TABLE_PREFS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(TABLE_PREFS_KEY, JSON.stringify(tablePrefs));
    } catch {
      // localStorage no disponible: ignorar
    }
  }, [tablePrefs]);

  const getTablePref = (tab: string): AdminTablePref => tablePrefs[tab] || defaultAdminTablePref();
  const updateTablePref = (tab: string, pref: AdminTablePref) =>
    setTablePrefs(prev => ({ ...prev, [tab]: pref }));

  // ── Admin API helper ──
  async function adminFetch(action: string, payload: Record<string, any> = {}): Promise<any> {
    const token = sessionStorage.getItem('admin-token');
    if (!token) {
      setIsAuthenticated(false);
      return { error: 'Sesión expirada' };
    }

    const res = await fetch(`${FN_URL}/admin-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, ...payload }),
    });

    if (res.status === 401) {
      setIsAuthenticated(false);
      sessionStorage.removeItem('admin-token');
      toast.error('Sesión expirada. Ingresa de nuevo.');
      return { error: 'Sesión expirada' };
    }

    return res.json();
  }

  // ── React Query ──
  const queryClient = useQueryClient();
  const authEnabled = isAuthenticated;
  const [pedidosPage, setPedidosPage] = useState(1);

  const productosQuery = useQuery({
    queryKey: ['admin', 'productos'],
    queryFn: () => adminFetch('select', { table: 'productos', orderBy: 'id', ascending: true }),
    enabled: authEnabled,
  });

  const serviciosQuery = useQuery({
    queryKey: ['admin', 'servicios'],
    queryFn: () => adminFetch('select', { table: 'servicios', orderBy: 'id', ascending: true }),
    enabled: authEnabled,
  });

  const eventosQuery = useQuery({
    queryKey: ['admin', 'eventos'],
    queryFn: () => adminFetch('select', { table: 'eventos', orderBy: 'id', ascending: true }),
    enabled: authEnabled,
  });

  const pedidosQuery = useQuery({
    queryKey: ['admin', 'pedidos', pedidosPage],
    queryFn: () => adminFetch('select', {
      table: 'pedidos',
      orderBy: 'created_at',
      ascending: false,
      page: pedidosPage,
      pageSize: 50,
    }),
    enabled: authEnabled,
  });

  const citasQuery = useQuery({
    queryKey: ['admin', 'citas'],
    queryFn: () => adminFetch('select', { table: 'citas', orderBy: 'fecha_creacion', ascending: false }),
    enabled: authEnabled,
  });

  const solicitudesQuery = useQuery({
    queryKey: ['admin', 'solicitudes'],
    queryFn: () => adminFetch('select', { table: 'servicio_solicitudes', orderBy: 'created_at', ascending: false }),
    enabled: authEnabled,
  });

  const inscripcionesQuery = useQuery({
    queryKey: ['admin', 'inscripciones'],
    queryFn: () => adminFetch('select', { table: 'evento_inscripciones', orderBy: 'created_at', ascending: false }),
    enabled: authEnabled,
  });

  const testimonialsQuery = useQuery({
    queryKey: ['admin', 'testimonials'],
    queryFn: () => adminFetch('select', { table: 'testimonials', orderBy: 'sort_order', ascending: true }),
    enabled: authEnabled,
  });

  const faqsQuery = useQuery({
    queryKey: ['admin', 'faqs'],
    queryFn: () => adminFetch('select', { table: 'faqs', orderBy: 'sort_order', ascending: true }),
    enabled: authEnabled,
  });

  // Sync React Query → local state
  useEffect(() => {
    if (productosQuery.data?.data) setProductos(productosQuery.data.data);
  }, [productosQuery.data]);
  useEffect(() => {
    if (serviciosQuery.data?.data) setServicios(serviciosQuery.data.data);
  }, [serviciosQuery.data]);
  useEffect(() => {
    if (eventosQuery.data?.data) setEventos(eventosQuery.data.data);
  }, [eventosQuery.data]);
  useEffect(() => {
    if (pedidosQuery.data?.data?.rows) setPedidos(pedidosQuery.data.data.rows);
  }, [pedidosQuery.data]);
  useEffect(() => {
    if (citasQuery.data?.data) setCitas(citasQuery.data.data);
  }, [citasQuery.data]);
  useEffect(() => {
    if (inscripcionesQuery.data?.data) setInscripciones(inscripcionesQuery.data.data);
  }, [inscripcionesQuery.data]);
  useEffect(() => {
    if (testimonialsQuery.data?.data) setTestimonials(testimonialsQuery.data.data);
  }, [testimonialsQuery.data]);
  useEffect(() => {
    if (faqsQuery.data?.data) setFaqs(faqsQuery.data.data);
  }, [faqsQuery.data]);

  // Refetch all on auth
  useEffect(() => {
    if (isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    } else {
      setPedidosPage(1);
    }
  }, [isAuthenticated, queryClient]);

  const loading = isAuthenticated
    ? productosQuery.isLoading || serviciosQuery.isLoading
      || eventosQuery.isLoading || pedidosQuery.isLoading || citasQuery.isLoading
      || solicitudesQuery.isLoading || inscripcionesQuery.isLoading || testimonialsQuery.isLoading || faqsQuery.isLoading
    : false;

  function handleColResizeStart(col: string, e: React.MouseEvent) {
    e.preventDefault();

    // Clean up any stale listeners from a previous incomplete drag
    if (mouseMoveRef.current) document.removeEventListener('mousemove', mouseMoveRef.current);
    if (mouseUpRef.current) document.removeEventListener('mouseup', mouseUpRef.current);

    const th = (e.target as HTMLElement).closest('th');
    if (!th) return;
    const startW = th.offsetWidth;
    resizeRef.current = { col, startX: e.clientX, startW };

    const handleMouseMove = (ev: MouseEvent) => {
      const r = resizeRef.current;
      if (!r) return;
      const diff = ev.clientX - r.startX;
      const newW = Math.max(50, r.startW + diff);
      setColWidths(prev => ({ ...prev, [r.col]: newW }));
      document.body.style.cursor = 'col-resize';
    };

    const handleMouseUp = () => {
      mouseMoveRef.current = null;
      mouseUpRef.current = null;
      resizeRef.current = null;
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    mouseMoveRef.current = handleMouseMove;
    mouseUpRef.current = handleMouseUp;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  function ColResizeHandle({ col }: { col: string }) {
    return (
      <span
        className="col-resize-handle"
        onMouseDown={(e) => handleColResizeStart(col, e)}
      />
    );
  }

  function toggleCell(key: string) {
    setExpandedCells(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function TruncatedCell({ text, cellKey, maxChars = 100 }: { text: string; cellKey: string; maxChars?: number }) {
    const isExpanded = expandedCells[cellKey];
    const shouldTruncate = text && text.length > maxChars;
    const display = shouldTruncate && !isExpanded ? text.slice(0, maxChars) + '...' : text;
    return (
      <div>
        <span>{display || '-'}</span>
        {shouldTruncate && (
          <button onClick={() => toggleCell(cellKey)} className="expand-toggle">
            {isExpanded ? 'Ver menos' : 'Ver más'}
          </button>
        )}
      </div>
    );
  }

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (e.matches) setIsCollapsed(true);
    };
    handler(mql);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  async function handleLogin() {
    const res = await fetch(`${FN_URL}/admin-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    if (json.token) {
      sessionStorage.setItem('admin-token', json.token);
      setIsAuthenticated(true);
    } else {
      toast.error('Contraseña inválida');
    }
  }

  function handleLogout() {
    setIsAuthenticated(false);
    router.push('/');
  }

  async function updateStatus(id: number, newStatus: string) {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    toast.success(`Estado actualizado a ${newStatus}`);
    const json = await adminFetch('update', { table: 'pedidos', id, data: { status: newStatus } });
    if (json.error) {
      toast.error('Error al actualizar: ' + json.error);
    }
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  async function saveEdit(table: string) {
    if (!editData) return;
    let updateData: any;
    if (table === 'testimonials' || table === 'faqs') {
      updateData = { ...editData };
      delete updateData.id;
    } else {
      const priceNum = extractNumberFromPrice(editData.price);
      const { popular: _, ...rest } = editData;
      updateData = { ...rest, price_num: priceNum };
    }

    // Servicios: includes is edited as one-per-line textarea → convert to text[]
    if (table === 'servicios' && typeof updateData.includes === 'string') {
      updateData.includes = updateData.includes.split('\n').map((s: string) => s.trim()).filter(Boolean);
    }

    // Optimistic: update local state immediately
    const setter = table === 'productos' ? setProductos : table === 'servicios' ? setServicios : table === 'eventos' ? setEventos : table === 'testimonials' ? setTestimonials : setFaqs;
    setter((prev: any[]) => prev.map(item => item.id === editingId ? { ...item, ...updateData } : item));
    setEditingId(null);
    setEditData(null);
    toast.success('Guardado');

    // Background sync
    const json = await adminFetch('update', { table, id: editingId, data: updateData });
    if (json.error) {
      toast.error('Error: ' + json.error);
    }
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  function startEdit(item: any, table: string) {
    setEditingId(item.id);
    setEditData({ ...item });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData(null);
  }

  // ── Modal de edición de producto (detalles + variantes) ──
  function openProductEdit(p: Producto) {
    setEditingId(p.id);
    setEditData({
      ...p,
      variants: Array.isArray(p.variants) ? p.variants.map(v => ({ ...v })) : [],
    });
    setShowEditProductModal(true);
  }

  function closeProductEdit() {
    setShowEditProductModal(false);
    setEditingId(null);
    setEditData(null);
  }

  function updateVariantField(index: number, field: keyof ProductVariant, value: string | number) {
    setEditData((prev: any) => {
      const variants = [...(prev.variants || [])];
      variants[index] = { ...variants[index], [field]: value };
      return { ...prev, variants };
    });
  }

  function addVariant() {
    setEditData((prev: any) => ({
      ...prev,
      variants: [...(prev.variants || []), { label: '', unit_price: 0, total_price: 0, description: '' }],
    }));
  }

  function removeVariant(index: number) {
    setEditData((prev: any) => {
      const variants = (prev.variants || []).filter((_: any, i: number) => i !== index);
      return { ...prev, variants };
    });
  }

  async function saveProductEdit() {
    if (!editData) return;
    if (!editData.title?.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    const newId = Number(editData.id) || editingId;
    if (newId !== editingId && productos.some(item => item.id === newId)) {
      toast.error(`Ya existe un producto con el ID ${newId}`);
      return;
    }
    const variants = (editData.variants || [])
      .map((v: any) => ({
        label: String(v.label || '').trim(),
        unit_price: Number(v.unit_price) || 0,
        total_price: Number(v.total_price) || 0,
        description: String(v.description || '').trim(),
      }))
      .filter((v: any) => v.label);

    const priceNum = extractNumberFromPrice(editData.price);
    const updateData: any = {
      title: editData.title,
      description: editData.description || '',
      price: editData.price,
      price_num: priceNum,
      category: editData.category || 'otros',
      icon: editData.icon || 'box',
      popular: !!editData.popular,
      image: editData.image || '',
      whatsapp_link: editData.whatsapp_link || '',
      price_type: editData.price_type || 'fijo',
      is_active: !!editData.is_active,
      variants,
    };
    if (newId !== editingId) updateData.id = newId;

    // Optimistic update
    setProductos(prev => prev.map(item => item.id === editingId ? { ...item, ...updateData, id: newId } : item));
    closeProductEdit();
    toast.success('Producto guardado');

    const json = await adminFetch('update', { table: 'productos', id: editingId, data: updateData });
    if (json.error) toast.error('Error: ' + json.error);
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  async function toggleProductActive(p: Producto) {
    const next = !p.is_active;
    setProductos(prev => prev.map(item => item.id === p.id ? { ...item, is_active: next } : item));
    toast.success(next ? 'Producto visible en la web' : 'Producto oculto de la web');
    const json = await adminFetch('update', { table: 'productos', id: p.id, data: { is_active: next } });
    if (json.error) toast.error('Error: ' + json.error);
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  async function toggleServiceActive(s: Servicio) {
    const next = !s.is_active;
    setServicios(prev => prev.map(item => item.id === s.id ? { ...item, is_active: next } : item));
    toast.success(next ? 'Servicio visible en la web' : 'Servicio oculto de la web');
    const json = await adminFetch('update', { table: 'servicios', id: s.id, data: { is_active: next } });
    if (json.error) toast.error('Error: ' + json.error);
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  // ── Modal de edición de servicio (detalles) ──
  function openServiceEdit(s: Servicio) {
    setEditingId(s.id);
    setEditData({
      ...s,
      includes: Array.isArray(s.includes) ? [...s.includes] : [],
    });
    setShowEditServiceModal(true);
  }

  function closeServiceEdit() {
    setShowEditServiceModal(false);
    setEditingId(null);
    setEditData(null);
  }

  async function saveServiceEdit() {
    if (!editData) return;
    if (!editData.title?.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    const newId = Number(editData.id) || editingId;
    if (newId !== editingId && servicios.some(item => item.id === newId)) {
      toast.error(`Ya existe un servicio con el ID ${newId}`);
      return;
    }
    const includes = Array.isArray(editData.includes)
      ? editData.includes
      : String(editData.includes || '').split('\n').map((s: string) => s.trim()).filter(Boolean);

    const updateData: any = {
      title: editData.title,
      subtitle: editData.subtitle || '',
      description: editData.description || '',
      category: editData.category || 'contabilidad-finanzas',
      icon: editData.icon || 'box',
      popular: !!editData.popular,
      is_active: !!editData.is_active,
      whatsapp_link: editData.whatsapp_link || '',
      includes,
      // Campos que la web no muestra: se preservan sin exponerse en el modal
      price: editData.price ?? '',
      price_num: editData.price_num ?? 0,
      image: editData.image || '',
      price_type: editData.price_type || 'fijo',
    };
    if (newId !== editingId) updateData.id = newId;

    // Optimistic update
    setServicios(prev => prev.map(item => item.id === editingId ? { ...item, ...updateData, id: newId } : item));
    closeServiceEdit();
    toast.success('Servicio guardado');

    const json = await adminFetch('update', { table: 'servicios', id: editingId, data: updateData });
    if (json.error) toast.error('Error: ' + json.error);
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  async function handleImageUpload(file: File): Promise<string | null> {
    const token = sessionStorage.getItem('admin-token');
    if (!token) return null;
    
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    
    const json = await res.json();
    if (json.url) return json.url;
    toast.error(json.error || 'Error al subir imagen');
    return null;
  }

  function handleDeleteClick(table: string, id: number) {
    const label = table === 'productos' ? 'Producto' : table === 'servicios' ? 'Servicio' : table === 'eventos' ? 'Evento' : table === 'testimonials' ? 'Testimonio' : 'FAQ';
    setConfirmDelete({ table, id, label });
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    const { table, id, label } = confirmDelete;

    const setter = table === 'productos' ? setProductos : table === 'servicios' ? setServicios : table === 'eventos' ? setEventos : table === 'testimonials' ? setTestimonials : setFaqs;

    // Optimistic: remove from local state immediately
    setter((prev: any[]) => prev.filter(item => item.id !== id));
    toast.success(`${label} eliminado`);
    setConfirmDelete(null);

    // Background sync via API
    const json = await adminFetch('delete', { table, id });
    if (json.error) {
      toast.error('Error al eliminar: ' + json.error);
    }
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  async function handleCreate() {
    if (createTable === 'testimonials') {
      if (!createData.author.trim()) {
        toast.error('Autor es obligatorio');
        return;
      }
    } else if (createTable === 'faqs') {
      if (!createData.question.trim() || !createData.answer.trim()) {
        toast.error('Pregunta y Respuesta son obligatorios');
        return;
      }
    } else {
      if (!createData.title.trim() || !createData.price.trim()) {
        toast.error('Título y Precio son obligatorios');
        return;
      }
    }
    let data: any;
    if (createTable === 'testimonials') {
      data = {
        author: createData.author,
        quote: createData.quote || '',
        position: createData.position || '',
      };
    } else if (createTable === 'faqs') {
      data = {
        question: createData.question,
        answer: createData.answer,
      };
    } else {
      data = {
        title: createData.title,
        description: createData.description || '',
        price: createData.price,
        price_num: extractNumberFromPrice(createData.price),
        whatsapp_link: createData.whatsapp_link || `https://wa.me/5355609099?text=Quiero%20solicitar%20el%20${encodeURIComponent(createData.title)}`,
      };
      if (createTable !== 'eventos') {
        data.category = createData.category || 'otros';
        data.icon = createData.icon || 'box';
        data.price_type = createData.price.toLowerCase().includes('desde') ? 'desde' : 'fijo';
      }
      if (createTable === 'eventos') {
        data.date = createData.date || '';
        data.status = createData.status || 'Proximamente';
        data.categoria = createData.category || 'evento';
        data.icon = createData.icon || 'calendar';
      }
    }
    try {
      const json = await adminFetch('insert', { table: createTable, data });
      if (json.error) { toast.error('Error: ' + json.error); return; }
      toast.success('Creado');
      setShowCreateModal(false);
      setCreateData({title: '', description: '', price: '', category: '', icon: '', popular: false, whatsapp_link: '', date: '', status: 'Proximamente', author: '', quote: '', position: '', question: '', answer: ''});
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    } catch (e) {
      toast.error('Error al guardar');
    }
  }

  function copyToClipboard(label: string, text: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  }

  const solicitudesData = (solicitudesQuery.data?.data || []) as Solicitud[];
  const inscripcionesData = (inscripcionesQuery.data?.data || []) as Inscripcion[];

  // Mapa evento_id → categoria para distinguir el tipo de formación (taller/curso/evento/...)
  const eventoCategoriaMap = useMemo(() => {
    const m = new Map<number, string>();
    (eventosQuery.data?.data || []).forEach((e: any) => {
      if (e?.id != null && e?.categoria) m.set(e.id, e.categoria);
    });
    return m;
  }, [eventosQuery.data]);

  const CATEGORIA_FORMACION_LABELS: Record<string, string> = {
    taller: 'Taller',
    curso: 'Curso',
    evento: 'Evento',
    masterclass: 'Masterclass',
  };

  function categoriaFormacion(cat?: string): string {
    if (!cat) return '—';
    return CATEGORIA_FORMACION_LABELS[cat] ?? cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  const filteredData = {
    pedidos: pedidos.filter(p => p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())),
    citas: citas.filter(c => c.nombre?.toLowerCase().includes(searchTerm.toLowerCase())),
    solicitudes: solicitudesData.filter(s =>
      s.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
      || s.servicio_titulo?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    inscripciones: inscripcionesData.filter(i =>
      i.correo_electronico?.toLowerCase().includes(searchTerm.toLowerCase())
      || i.evento_titulo?.toLowerCase().includes(searchTerm.toLowerCase())
      || i.telefono?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    productos: productos.filter(p => {
      const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }),
    servicios: servicios.filter(s => {
      const matchesSearch = s.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || s.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }),
    eventos: eventos.filter(e => {
      const matchesSearch = e.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || e.categoria === categoryFilter;
      return matchesSearch && matchesCategory;
    }),
    testimonials: testimonials.filter(t => t.author?.toLowerCase().includes(searchTerm.toLowerCase())),
    faqs: faqs.filter(f => f.question?.toLowerCase().includes(searchTerm.toLowerCase())),
  };

  const pedidosColumns: AdminTableColumn<Pedido>[] = [
    { key: 'id', label: 'ID', sortValue: p => p.id, filterValue: p => String(p.id), render: p => <td className="id-cell">{formatId(p.id)}</td> },
    { key: 'cliente', label: 'Cliente', sortValue: p => p.customer_name || '', filterValue: p => p.customer_name || '', render: p => <td className="name-cell">{p.customer_name}</td> },
    {
      key: 'contactos', label: 'Contactos',
      filterValue: p => p.customer_email || '',
      render: p => (
        <td>
          <div className="contact-cell">
            {p.customer_email && <span><Mail size={14} /> {p.customer_email}</span>}
          </div>
        </td>
      ),
    },
    {
      key: 'items', label: 'Items',
      render: p => (
        <td className="items-cell">
          <div className="items-list">
            {(() => {
              const itemsKey = `items-${p.id}`;
              const showAll = expandedCells[itemsKey];
              const itemsToShow = showAll ? p.items : p.items?.slice(0, 3);
              return (itemsToShow || []).map((i: any, idx: number) => (
                <span key={idx}>• {i.title || i.productTitle || i.name} x{i.quantity}</span>
              ));
            })()}
            {p.items?.length > 3 && (
              <button onClick={() => toggleCell(`items-${p.id}`)} className="expand-toggle more">
                {expandedCells[`items-${p.id}`] ? 'Ver menos' : `Ver +${p.items.length - 3} más`}
              </button>
            )}
          </div>
        </td>
      ),
    },
    { key: 'total', label: 'Total', sortValue: p => Number(p.total_price || 0), filterValue: p => String(p.total_price ?? ''), render: p => <td className="price-cell">{p.total_price?.toLocaleString()} CUP</td> },
    {
      key: 'estado', label: 'Estado',
      sortValue: p => p.status || '',
      filterValue: p => p.status || '',
      render: p => (
        <td>
          <select
            value={p.status}
            onChange={e => updateStatus(p.id, e.target.value)}
            className={`status-select ${p.status}`}
          >
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="completado">Completado</option>
          </select>
        </td>
      ),
    },
    { key: 'fecha', label: 'Fecha', sortValue: p => new Date(p.created_at).getTime(), filterValue: p => new Date(p.created_at).toLocaleDateString('es-ES'), render: p => <td className="date-cell">{new Date(p.created_at).toLocaleDateString('es-ES')}</td> },
    {
      key: 'acciones', label: 'Acciones', alwaysVisible: true,
      render: p => (
        <td>
          <div className="actions-cell">
            <button onClick={() => {
              const items = (p.items || []).map((i: any) => `  • ${i.title || i.productTitle || i.name} x${i.quantity} — ${i.price} CUP`).join('\n');
              copyToClipboard('Pedido', `Pedido #${p.id} — ${p.customer_name}\nEmail: ${p.customer_email}\nItems:\n${items}\nTotal: ${p.total_price?.toLocaleString()} CUP\nEstado: ${p.status}\nFecha: ${new Date(p.created_at).toLocaleDateString('es-ES')}`);
            }} className="btn-icon-sm" title="Copiar info del pedido">
              <Copy size={14} />
            </button>
          </div>
        </td>
      ),
    },
  ];

  const citasColumns: AdminTableColumn<Cita>[] = [
    { key: 'id', label: 'ID', sortValue: c => c.id, filterValue: c => String(c.id), render: c => <td className="id-cell">{formatId(c.id)}</td> },
    { key: 'nombre', label: 'Nombre', sortValue: c => c.nombre || '', filterValue: c => c.nombre || '', render: c => <td className="name-cell">{c.nombre}</td> },
    {
      key: 'contactos', label: 'Contactos',
      filterValue: c => `${c.email || ''} ${c.telefono || ''}`,
      render: c => (
        <td>
          <div className="contact-cell">
            {c.email && <span><Mail size={14} /> {c.email}</span>}
            {c.telefono && <span><Phone size={14} /> {c.telefono}</span>}
          </div>
        </td>
      ),
    },
    { key: 'mensaje', label: 'Mensaje', filterValue: c => c.mensaje || '', render: c => <td className="messaje-cell"><TruncatedCell text={c.mensaje} cellKey={`msg-c-${c.id}`} /></td> },
    { key: 'fecha', label: 'Fecha', sortValue: c => new Date(c.fecha_creacion).getTime(), filterValue: c => new Date(c.fecha_creacion).toLocaleString('es-ES'), render: c => <td className="date-cell">{new Date(c.fecha_creacion).toLocaleString('es-ES')}</td> },
    {
      key: 'acciones', label: 'Acciones', alwaysVisible: true,
      render: c => (
        <td>
          <div className="actions-cell">
            <button onClick={() => {
              copyToClipboard('Cita', `Cita #${c.id} — ${c.nombre}\nEmail: ${c.email || '—'}\nTeléfono: ${c.telefono || '—'}\nMensaje: ${c.mensaje || '—'}\nFecha: ${new Date(c.fecha_creacion).toLocaleString('es-ES')}`);
            }} className="btn-icon-sm" title="Copiar info de la cita">
              <Copy size={14} />
            </button>
          </div>
        </td>
      ),
    },
  ];

  const solicitudesColumns: AdminTableColumn<Solicitud>[] = [
    { key: 'id', label: 'ID', sortValue: s => s.id, filterValue: s => String(s.id), render: s => <td className="id-cell">{formatId(s.id)}</td> },
    { key: 'servicio', label: 'Servicio', sortValue: s => s.servicio_titulo || '', filterValue: s => s.servicio_titulo || '', render: s => <td className="name-cell">{s.servicio_titulo}</td> },
    { key: 'nombre', label: 'Nombre', sortValue: s => s.nombre || '', filterValue: s => s.nombre || '', render: s => <td className="name-cell">{s.nombre}</td> },
    {
      key: 'contactos', label: 'Contactos',
      filterValue: s => `${s.email || ''} ${s.telefono || ''}`,
      render: s => (
        <td>
          <div className="contact-cell">
            {s.email && <span><Mail size={14} /> {s.email}</span>}
            {s.telefono && <span><Phone size={14} /> {s.telefono}</span>}
          </div>
        </td>
      ),
    },
    { key: 'mensaje', label: 'Mensaje', filterValue: s => s.mensaje || '', render: s => <td className="messaje-cell"><TruncatedCell text={s.mensaje || ''} cellKey={`msg-sol-${s.id}`} /></td> },
    { key: 'fecha', label: 'Fecha', sortValue: s => new Date(s.created_at).getTime(), filterValue: s => new Date(s.created_at).toLocaleString('es-ES'), render: s => <td className="date-cell">{new Date(s.created_at).toLocaleString('es-ES')}</td> },
  ];

  const inscripcionesColumns: AdminTableColumn<Inscripcion>[] = [
    { key: 'id', label: 'ID', sortValue: i => i.id, filterValue: i => String(i.id), render: i => <td className="id-cell">{formatId(i.id)}</td> },
    { key: 'evento', label: 'Evento', sortValue: i => i.evento_titulo || '', filterValue: i => i.evento_titulo || '', render: i => <td className="name-cell">{i.evento_titulo}</td> },
    {
      key: 'formacion', label: 'Formación',
      filterValue: i => categoriaFormacion(i.evento_id != null ? eventoCategoriaMap.get(i.evento_id) : undefined).toLowerCase(),
      render: i => (
        <td>
          <span className="status-badge">
            {categoriaFormacion(i.evento_id != null ? eventoCategoriaMap.get(i.evento_id) : undefined)}
          </span>
        </td>
      ),
    },
    { key: 'email', label: 'Correo', sortValue: i => i.correo_electronico || '', filterValue: i => i.correo_electronico || '', render: i => <td className="name-cell">{i.correo_electronico}</td> },
    { key: 'telefono', label: 'Teléfono', sortValue: i => i.telefono || '', filterValue: i => i.telefono || '', render: i => <td>{i.telefono}</td> },
    { key: 'nivel', label: 'Nivel de estudios', filterValue: i => i.nivel_estudios || '', render: i => <td>{i.nivel_estudios || '-'}</td> },
    {
      key: 'negocio', label: 'Tiene negocio',
      filterValue: i => (i.tiene_negocio ? 'si' : 'no'),
      render: i => (
        <td>
          <span className={`status-badge ${i.tiene_negocio ? 'completado' : 'pendiente'}`}>
            {i.tiene_negocio ? 'Sí' : 'No'}
          </span>
        </td>
      ),
    },
    { key: 'nombre-negocio', label: 'Nombre del negocio', filterValue: i => i.nombre_negocio || '', render: i => <td>{i.nombre_negocio || '-'}</td> },
    { key: 'sector', label: 'Sector', filterValue: i => i.sector || '', render: i => <td>{i.sector || '-'}</td> },
    { key: 'motivacion', label: 'Motivación', filterValue: i => i.motivacion || '', render: i => <td className="messaje-cell"><TruncatedCell text={i.motivacion || ''} cellKey={`mot-insc-${i.id}`} /></td> },
    {
      key: 'notificaciones', label: 'Notificaciones',
      filterValue: i => (i.notificaciones ? 'si' : 'no'),
      render: i => (
        <td>
          <span className={`status-badge ${i.notificaciones ? 'completado' : 'pendiente'}`}>
            {i.notificaciones ? 'Sí' : 'No'}
          </span>
        </td>
      ),
    },
    { key: 'fecha', label: 'Fecha', sortValue: i => new Date(i.created_at).getTime(), filterValue: i => new Date(i.created_at).toLocaleString('es-ES'), render: i => <td className="date-cell">{new Date(i.created_at).toLocaleString('es-ES')}</td> },
  ];

  // Dashboard computations
  const totalPedidos = pedidos.length;
  const pedidosPendientes = pedidos.filter(p => p.status === 'pendiente').length;
  const pedidosConfirmados = pedidos.filter(p => p.status === 'confirmado').length;
  const pedidosCompletados = pedidos.filter(p => p.status === 'completado').length;
  const totalIngresos = pedidos.reduce((sum, p) => sum + Number(p.total_price || 0), 0);
  const totalProductos = productos.length;
  const totalServicios = servicios.length;
  const totalEventos = eventos.length;
  const totalCitas = citas.length;
  const totalTestimonials = testimonials.length;
  const totalFaqs = faqs.length;
  const pedidosMes = pedidos.filter(p => {
    const d = new Date(p.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Compute popular items from pedidos
  const itemCounts: Record<string, number> = {};
  pedidos.forEach(p => {
    if (p.items && Array.isArray(p.items)) {
      p.items.forEach((item: any) => {
        const title = item.title || item.name || item.productTitle || '';
        const qty = Number(item.quantity || 1);
        if (title) itemCounts[title] = (itemCounts[title] || 0) + qty;
      });
    }
  });
  const sortedItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);

  const productoTitles = new Set(productos.map(p => p.title));
  const serviciotitles = new Set(servicios.map(s => s.title));

  const popularProducts = sortedItems
    .filter(([title]) => productoTitles.has(title))
    .slice(0, 5);
  const popularServicios = sortedItems
    .filter(([title]) => serviciotitles.has(title))
    .slice(0, 5);

  const counts: Record<string, number> = {
    pedidos: pedidos.length,
    citas: citas.length,
    servicio_solicitudes: solicitudesData.length,
    evento_inscripciones: inscripcionesData.length,
    productos: productos.length,
    servicios: servicios.length,
    eventos: eventos.length,
    testimonials: testimonials.length,
    faqs: faqs.length,
  };

  return (
    <div className="admin-container">
      {!isAuthenticated ? (
        <div id="main-content" tabIndex={-1} className="login-screen">
          <div className="login-card">
            <div className="login-logo">
              <BensoLogo height={48} className="login-logo-svg" />
            </div>
            <h1>Admin</h1>
            <p className="login-subtitle">Acceso restringido</p>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                aria-label="Contraseña de administrador"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button onClick={handleLogin} className="btn-primary">Entrar</button>
          </div>
        </div>
      ) : (
        <div className="admin-layout">
          <AppSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={counts}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin'] })}
            loading={loading}
            onLogout={handleLogout}
            isMobile={isMobile}
          />
          <motion.div
            className="admin-content-wrapper"
            animate={{ marginLeft: isMobile ? 64 : (isCollapsed ? 64 : 200) }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >

          {activeTab !== 'dashboard' && (
          <div className="admin-toolbar">
            <div className="toolbar-left">
              <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Buscar..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              {(activeTab === 'productos' || activeTab === 'servicios' || activeTab === 'eventos') && (
                <select 
                  className="filter-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {(activeTab === 'productos' ? PRODUCT_CATEGORIES : activeTab === 'servicios' ? SERVICE_CATEGORIES : EVENT_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>
                      {activeTab === 'productos'
                        ? (PRODUCT_CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1))
                        : activeTab === 'servicios'
                          ? (SERVICE_CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1))
                          : (EVENT_CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1))}
                    </option>
                  ))}
                </select>
              )}
              <span className="results-count">
                {filteredData[activeTab]?.length || 0} resultados
              </span>
            </div>
            <div className="toolbar-right">
              {(activeTab === 'pedidos' || activeTab === 'citas' || activeTab === 'solicitudes' || activeTab === 'inscripciones') && (
                <AdminTableCustomizer
                  columns={
                    activeTab === 'pedidos' ? pedidosColumns
                    : activeTab === 'citas' ? citasColumns
                    : activeTab === 'solicitudes' ? solicitudesColumns
                    : inscripcionesColumns
                  }
                  pref={getTablePref(activeTab)}
                  onPrefChange={p => updateTablePref(activeTab, p)}
                />
              )}
              {activeTab !== 'pedidos' && activeTab !== 'citas' && activeTab !== 'solicitudes' && activeTab !== 'inscripciones' && (
                <button onClick={() => { setShowCreateModal(true); setCreateTable(activeTab as 'productos' | 'servicios' | 'eventos' | 'testimonials' | 'faqs'); }} className="btn-add">
                  <Plus size={18} /> Añadir
                </button>
              )}
            </div>
          </div>
          )}

          <main id="main-content" tabIndex={-1} className="admin-main">
            {loading ? (
              <div className="loading"><Loader className="spin" size={32} /></div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <div className="dashboard-container">
                    <div className="dashboard-grid">
                      <div className="dashboard-card">
                        <div className="card-icon"><ShoppingCart size={24} /></div>
                        <div className="card-body">
                          <span className="card-label">Total Pedidos</span>
                          <span className="card-value">{totalPedidos}</span>
                          <span className="card-sub">{pedidosMes} este mes</span>
                        </div>
                      </div>
                      <div className="dashboard-card">
                        <div className="card-icon"><DollarSign size={24} /></div>
                        <div className="card-body">
                          <span className="card-label">Ingresos Totales</span>
                          <span className="card-value">${Number(totalIngresos).toLocaleString('es-CU')}</span>
                          <span className="card-sub">{pedidosPendientes} pendientes</span>
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-section">
                      <h3>Pedidos por Estado</h3>
                      <div className="status-summary">
                        <span className="status-item pendiente"><Clock size={16} /> {pedidosPendientes} pendientes</span>
                        <span className="status-item confirmado"><CheckCircle size={16} /> {pedidosConfirmados} confirmados</span>
                        <span className="status-item completado"><CheckCheck size={16} /> {pedidosCompletados} completados</span>
                      </div>
                    </div>

                    {(popularProducts.length > 0 || popularServicios.length > 0) && (
                      <div className="popular-bento">
                        {popularProducts.length > 0 && (
                          <div className="popular-column">
                            <h3>Productos más pedidos</h3>
                            <ul className="popular-list">
                              {popularProducts.map(([title, count], i) => (
                                <li key={title}>
                                  <span>
                                    <span className="rank">#{i + 1}</span>
                                    {title}
                                  </span>
                                  <span className="count">{count} pedido{count > 1 ? 's' : ''}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {popularServicios.length > 0 && (
                          <div className="popular-column">
                            <h3>Servicios más pedidos</h3>
                            <ul className="popular-list">
                              {popularServicios.map(([title, count], i) => (
                                <li key={title}>
                                  <span>
                                    <span className="rank">#{i + 1}</span>
                                    {title}
                                  </span>
                                  <span className="count">{count} pedido{count > 1 ? 's' : ''}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'pedidos' && (
                  <AdminDataTable
                    prefix="pedidos"
                    columns={pedidosColumns}
                    rows={filteredData.pedidos}
                    pref={getTablePref('pedidos')}
                    onPrefChange={p => updateTablePref('pedidos', p)}
                    colWidths={colWidths}
                    getColWidth={getColWidth}
                    renderResizeHandle={col => <ColResizeHandle col={`pedidos-${col}`} />}
                    footer={(() => {
                      const total = pedidosQuery.data?.data?.total;
                      if (!total) return null;
                      const totalPages = Math.ceil(total / 50);
                      if (totalPages <= 1) return null;
                      return (
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', padding: '0.75rem 1rem',
                          borderTop: '1px solid #f0f0f0', fontSize: '0.85rem', color: '#666'
                        }}>
                          <span>{total} pedidos en total</span>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              onClick={() => setPedidosPage(p => Math.max(1, p - 1))}
                              disabled={pedidosPage <= 1}
                              style={{
                                padding: '0.35rem 0.75rem', border: '1px solid #ddd',
                                borderRadius: '6px', background: '#fff', cursor: 'pointer',
                                opacity: pedidosPage <= 1 ? 0.4 : 1,
                              }}
                            >
                              ← Anterior
                            </button>
                            <span>Pág. {pedidosPage} de {totalPages}</span>
                            <button
                              onClick={() => setPedidosPage(p => Math.min(totalPages, p + 1))}
                              disabled={pedidosPage >= totalPages}
                              style={{
                                padding: '0.35rem 0.75rem', border: '1px solid #ddd',
                                borderRadius: '6px', background: '#fff', cursor: 'pointer',
                                opacity: pedidosPage >= totalPages ? 0.4 : 1,
                              }}
                            >
                              Siguiente →
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  />
                )}

                {activeTab === 'citas' && (
                  <AdminDataTable
                    prefix="citas"
                    columns={citasColumns}
                    rows={filteredData.citas}
                    pref={getTablePref('citas')}
                    onPrefChange={p => updateTablePref('citas', p)}
                    colWidths={colWidths}
                    getColWidth={getColWidth}
                    renderResizeHandle={col => <ColResizeHandle col={`citas-${col}`} />}
                  />
                )}

                {activeTab === 'solicitudes' && (
                  <AdminDataTable
                    prefix="sol"
                    columns={solicitudesColumns}
                    rows={filteredData.solicitudes}
                    pref={getTablePref('solicitudes')}
                    onPrefChange={p => updateTablePref('solicitudes', p)}
                    colWidths={colWidths}
                    getColWidth={getColWidth}
                    renderResizeHandle={col => <ColResizeHandle col={`sol-${col}`} />}
                  />
                )}

                {activeTab === 'inscripciones' && (
                  <AdminDataTable
                    prefix="insc"
                    columns={inscripcionesColumns}
                    rows={filteredData.inscripciones}
                    pref={getTablePref('inscripciones')}
                    onPrefChange={p => updateTablePref('inscripciones', p)}
                    colWidths={colWidths}
                    getColWidth={getColWidth}
                    renderResizeHandle={col => <ColResizeHandle col={`insc-${col}`} />}
                  />
                )}

                {activeTab === 'productos' && (
                  <div className="table-container">
                    <table className="data-table">
                      <colgroup>
                        <col style={{ width: getColWidth('prod-id', colWidths) }} />
                        <col style={{ width: getColWidth('prod-titulo', colWidths) }} />
                        <col style={{ width: getColWidth('prod-categoria', colWidths) }} />
                        <col style={{ width: 60 }} />
                        <col style={{ width: getColWidth('prod-desc', colWidths) }} />
                        <col style={{ width: getColWidth('prod-precio', colWidths) }} />
                        <col style={{ width: getColWidth('prod-variantes', colWidths) }} />
                        <col style={{ width: getColWidth('prod-estado', colWidths) }} />
                        <col style={{ width: getColWidth('prod-acciones', colWidths) }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th style={{position:'relative'}}>ID<ColResizeHandle col="prod-id" /></th>
                          <th style={{position:'relative'}}>Producto<ColResizeHandle col="prod-titulo" /></th>
                          <th style={{position:'relative'}}>Categoría<ColResizeHandle col="prod-categoria" /></th>
                          <th style={{position:'relative'}}>Imagen</th>
                          <th style={{position:'relative'}}>Descripción<ColResizeHandle col="prod-desc" /></th>
                          <th style={{position:'relative'}}>Precio<ColResizeHandle col="prod-precio" /></th>
                          <th style={{position:'relative'}}>Variantes<ColResizeHandle col="prod-variantes" /></th>
                          <th style={{position:'relative'}}>Estado<ColResizeHandle col="prod-estado" /></th>
                          <th style={{position:'relative'}}>Acciones<ColResizeHandle col="prod-acciones" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.productos.map(p => (
                          <tr key={p.id}>
                            <td className="id-cell">{formatId(p.id)}</td>
                            <td>{p.title}</td>
                            <td>
                              <span className="cat-badge">{PRODUCT_CATEGORY_LABELS[p.category] || p.category || '—'}</span>
                            </td>
                            <td>
                              {p.image ? (
                                <img src={p.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                              ) : (
                                <span className="no-image-placeholder"><ImageUp size={16} /></span>
                              )}
                            </td>
                            <td className="desc-cell">
                              <TruncatedCell text={p.description} cellKey={`desc-p-${p.id}`} />
                            </td>
                            <td>
                              <span className="price-display">{p.price}</span>
                            </td>
                            <td>
                              <span className={`variants-count${p.variants?.length ? '' : ' empty'}`}>
                                {p.variants?.length ? `${p.variants.length} variante${p.variants.length > 1 ? 's' : ''}` : 'Sin variantes'}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => toggleProductActive(p)}
                                className={`btn-icon-sm ${p.is_active ? 'success' : 'warning'}`}
                                title={p.is_active ? 'Ocultar de la web' : 'Mostrar en la web'}
                                aria-label={p.is_active ? 'Ocultar de la web' : 'Mostrar en la web'}
                              >
                                {p.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                              </button>
                            </td>
                            <td>
                              <div className="actions-cell">
                                <button onClick={() => openProductEdit(p)} className="btn-icon-sm" title="Editar detalles y variantes">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDeleteClick('productos', p.id)} className="btn-icon-sm danger" title="Eliminar">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'servicios' && (
                  <div className="table-container">
                    <table className="data-table">
                      <colgroup>
                        <col style={{ width: getColWidth('serv-id', colWidths) }} />
                        <col style={{ width: getColWidth('serv-titulo', colWidths) }} />
                        <col style={{ width: getColWidth('serv-subtitle', colWidths) }} />
                        <col style={{ width: getColWidth('serv-desc', colWidths) }} />
                        <col style={{ width: getColWidth('serv-includes', colWidths) }} />
                        <col style={{ width: getColWidth('serv-estado', colWidths) }} />
                        <col style={{ width: getColWidth('serv-acciones', colWidths) }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th style={{position:'relative'}}>ID<ColResizeHandle col="serv-id" /></th>
                          <th style={{position:'relative'}}>Servicio<ColResizeHandle col="serv-titulo" /></th>
                          <th style={{position:'relative'}}>Subtítulo</th>
                          <th style={{position:'relative'}}>Descripción<ColResizeHandle col="serv-desc" /></th>
                          <th style={{position:'relative'}}>Incluye</th>
                          <th style={{position:'relative'}}>Estado</th>
                          <th style={{position:'relative'}}>Acciones<ColResizeHandle col="serv-acciones" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.servicios.map(s => (
                          <tr key={s.id}>
                            <td className="id-cell">{formatId(s.id)}</td>
                            <td>{s.title}</td>
                            <td>{s.subtitle || '-'}</td>
                            <td className="desc-cell">
                              <TruncatedCell text={s.description} cellKey={`desc-s-${s.id}`} />
                            </td>
                            <td className="desc-cell">
                              <TruncatedCell text={(s.includes || []).join(' • ')} cellKey={`inc-s-${s.id}`} />
                            </td>
                            <td>
                              <button
                                onClick={() => toggleServiceActive(s)}
                                className={`btn-icon-sm ${s.is_active ? 'success' : 'warning'}`}
                                title={s.is_active ? 'Ocultar de la web' : 'Mostrar en la web'}
                                aria-label={s.is_active ? 'Ocultar de la web' : 'Mostrar en la web'}
                              >
                                {s.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                              </button>
                            </td>
                            <td>
                              <div className="actions-cell">
                                <button onClick={() => openServiceEdit(s)} className="btn-icon-sm" title="Editar detalles">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDeleteClick('servicios', s.id)} className="btn-icon-sm danger" title="Eliminar">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'eventos' && (
                  <div className="table-container">
                    <table className="data-table">
                      <colgroup>
                        <col style={{ width: getColWidth('ev-id', colWidths) }} />
                        <col style={{ width: getColWidth('ev-titulo', colWidths) }} />
                        <col style={{ width: 60 }} />
                        <col style={{ width: getColWidth('ev-desc', colWidths) }} />
                        <col style={{ width: getColWidth('ev-fecha', colWidths) }} />
                        <col style={{ width: getColWidth('ev-estado', colWidths) }} />
                        <col style={{ width: getColWidth('ev-cat', colWidths) }} />
                        <col style={{ width: getColWidth('ev-acciones', colWidths) }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th style={{position:'relative'}}>ID<ColResizeHandle col="ev-id" /></th>
                          <th style={{position:'relative'}}>Formación<ColResizeHandle col="ev-titulo" /></th>
                          <th style={{position:'relative'}}>Imagen</th>
                          <th style={{position:'relative'}}>Descripción<ColResizeHandle col="ev-desc" /></th>
                          <th style={{position:'relative'}}>Fecha<ColResizeHandle col="ev-fecha" /></th>
                          <th style={{position:'relative'}}>Estado<ColResizeHandle col="ev-estado" /></th>
                          <th style={{position:'relative'}}>Categoría<ColResizeHandle col="ev-cat" /></th>
                          <th style={{position:'relative'}}>Acciones<ColResizeHandle col="ev-acciones" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.eventos.map(e => (
                          <tr key={e.id}>
                            <td className="id-cell">{formatId(e.id)}</td>
                            <td>
                              {editingId === e.id ? (
                                <input 
                                  value={editData.title} 
                                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                                  className="edit-input"
                                />
                              ) : e.title}
                            </td>
                            <td>
                              {editingId === e.id ? (
                                <label className="upload-btn-sm" title="Subir imagen">
                                  <ImageUp size={16} />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const url = await handleImageUpload(file);
                                      if (url) setEditData({...editData, image: url});
                                    }}
                                  />
                                </label>
                              ) : (
                                e.image ? (
                                  <img src={e.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                                ) : (
                                  <span className="no-image-placeholder"><ImageUp size={16} /></span>
                                )
                              )}
                            </td>
                            <td className="desc-cell">
                              {editingId === e.id ? (
                                <textarea 
                                  value={editData.description} 
                                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                                  className="edit-textarea"
                                  rows={2}
                                />
                              ) : (
                                <TruncatedCell text={e.description} cellKey={`desc-e-${e.id}`} />
                              )}
                            </td>
                            <td>
                              {editingId === e.id ? (
                                <input 
                                  value={editData.date} 
                                  onChange={(e) => setEditData({...editData, date: e.target.value})}
                                  className="edit-input"
                                />
                              ) : e.date}
                            </td>
                            <td>
                              {editingId === e.id ? (
                                <select 
                                  value={editData.status} 
                                  onChange={(e) => setEditData({...editData, status: e.target.value})}
                                  className="edit-select"
                                >
                                  <option value="En Curso">En Curso</option>
                                  <option value="Proximamente">Próximamente</option>
                                </select>
                              ) : (
                                <span className={`status-badge ${e.status}`}>
                                  {e.status === 'En Curso' ? <CalendarCheck size={12} /> : <Clock size={12} />}
                                  {e.status}
                                </span>
                              )}
                            </td>
                            <td>
                              {editingId === e.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <select
                                    value={editData.categoria || 'evento'}
                                    onChange={(ev) => setEditData({...editData, categoria: ev.target.value})}
                                    className="edit-select"
                                  >
                                    <option value="taller">Taller</option>
                                    <option value="curso">Curso</option>
                                    <option value="evento">Evento</option>
                                  </select>
                                  <input
                                    value={editData.icon || ''}
                                    onChange={(ev) => setEditData({...editData, icon: ev.target.value})}
                                    className="edit-input"
                                    placeholder="icono"
                                  />
                                </div>
                              ) : (
                                <span className="status-badge">
                                  {e.categoria ? e.categoria.charAt(0).toUpperCase() + e.categoria.slice(1) : 'Evento'}
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="actions-cell">
                                {editingId === e.id ? (
                                  <>
                                    <button onClick={() => saveEdit('eventos')} className="btn-icon-sm success" title="Guardar">
                                      <Save size={14} />
                                    </button>
                                    <button onClick={cancelEdit} className="btn-icon-sm danger" title="Cancelar">
                                      <X size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEdit(e, 'eventos')} className="btn-icon-sm" title="Editar">
                                      <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteClick('eventos', e.id)} className="btn-icon-sm danger" title="Eliminar">
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'testimonials' && (
                  <div className="table-container">
                    <table className="data-table">
                      <colgroup>
                        <col style={{ width: getColWidth('test-id', colWidths) }} />
                        <col style={{ width: getColWidth('test-author', colWidths) }} />
                        <col style={{ width: getColWidth('test-quote', colWidths) }} />
                        <col style={{ width: getColWidth('test-position', colWidths) }} />
                        <col style={{ width: 60 }} />
                        <col style={{ width: getColWidth('test-active', colWidths) }} />
                        <col style={{ width: getColWidth('test-acciones', colWidths) }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th style={{position:'relative'}}>ID<ColResizeHandle col="test-id" /></th>
                          <th style={{position:'relative'}}>Autor<ColResizeHandle col="test-author" /></th>
                          <th style={{position:'relative'}}>Cita<ColResizeHandle col="test-quote" /></th>
                          <th style={{position:'relative'}}>Posición<ColResizeHandle col="test-position" /></th>
                          <th style={{position:'relative'}}>Imagen</th>
                          <th style={{position:'relative'}}>Activo<ColResizeHandle col="test-active" /></th>
                          <th style={{position:'relative'}}>Acciones<ColResizeHandle col="test-acciones" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.testimonials.map(t => (
                          <tr key={t.id}>
                            <td className="id-cell">{formatId(t.id)}</td>
                            <td>
                              {editingId === t.id ? (
                                <input 
                                  value={editData.author} 
                                  onChange={(e) => setEditData({...editData, author: e.target.value})}
                                  className="edit-input"
                                />
                              ) : t.author}
                            </td>
                            <td className="desc-cell">
                              {editingId === t.id ? (
                                <textarea 
                                  value={editData.quote} 
                                  onChange={(e) => setEditData({...editData, quote: e.target.value})}
                                  className="edit-textarea"
                                  rows={2}
                                />
                              ) : (
                                <TruncatedCell text={t.quote} cellKey={`quote-${t.id}`} />
                              )}
                            </td>
                            <td>
                              {editingId === t.id ? (
                                <input 
                                  value={editData.position} 
                                  onChange={(e) => setEditData({...editData, position: e.target.value})}
                                  className="edit-input"
                                />
                              ) : t.position}
                            </td>
                            <td>
                              {editingId === t.id ? (
                                <label className="upload-btn-sm" title="Subir imagen">
                                  <ImageUp size={16} />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const url = await handleImageUpload(file);
                                      if (url) setEditData({...editData, image: url});
                                    }}
                                  />
                                </label>
                              ) : (
                                t.image ? (
                                  <img src={t.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                                ) : (
                                  <span className="no-image-placeholder"><ImageUp size={16} /></span>
                                )
                              )}
                            </td>
                            <td>
                              {editingId === t.id ? (
                                <select 
                                  value={editData.is_active ? 'true' : 'false'} 
                                  onChange={(e) => setEditData({...editData, is_active: e.target.value === 'true'})}
                                  className="edit-select"
                                >
                                  <option value="true">Sí</option>
                                  <option value="false">No</option>
                                </select>
                              ) : (
                                <span className={`status-badge ${t.is_active ? 'completado' : 'pendiente'}`}>
                                  {t.is_active ? 'Sí' : 'No'}
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="actions-cell">
                                {editingId === t.id ? (
                                  <>
                                    <button onClick={() => saveEdit('testimonials')} className="btn-icon-sm success" title="Guardar">
                                      <Save size={14} />
                                    </button>
                                    <button onClick={cancelEdit} className="btn-icon-sm danger" title="Cancelar">
                                      <X size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEdit(t, 'testimonials')} className="btn-icon-sm" title="Editar">
                                      <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteClick('testimonials', t.id)} className="btn-icon-sm danger" title="Eliminar">
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'faqs' && (
                  <div className="table-container">
                    <table className="data-table">
                      <colgroup>
                        <col style={{ width: getColWidth('faq-id', colWidths) }} />
                        <col style={{ width: getColWidth('faq-question', colWidths) }} />
                        <col style={{ width: getColWidth('faq-answer', colWidths) }} />
                        <col style={{ width: getColWidth('faq-active', colWidths) }} />
                        <col style={{ width: getColWidth('faq-order', colWidths) }} />
                        <col style={{ width: getColWidth('faq-acciones', colWidths) }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th style={{position:'relative'}}>ID<ColResizeHandle col="faq-id" /></th>
                          <th style={{position:'relative'}}>Pregunta<ColResizeHandle col="faq-question" /></th>
                          <th style={{position:'relative'}}>Respuesta<ColResizeHandle col="faq-answer" /></th>
                          <th style={{position:'relative'}}>Activo<ColResizeHandle col="faq-active" /></th>
                          <th style={{position:'relative'}}>Orden<ColResizeHandle col="faq-order" /></th>
                          <th style={{position:'relative'}}>Acciones<ColResizeHandle col="faq-acciones" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.faqs.map(f => (
                          <tr key={f.id}>
                            <td className="id-cell">{formatId(f.id)}</td>
                            <td>
                              {editingId === f.id ? (
                                <input 
                                  value={editData.question} 
                                  onChange={(e) => setEditData({...editData, question: e.target.value})}
                                  className="edit-input"
                                />
                              ) : (
                                <TruncatedCell text={f.question} cellKey={`faq-q-${f.id}`} />
                              )}
                            </td>
                            <td className="desc-cell">
                              {editingId === f.id ? (
                                <textarea 
                                  value={editData.answer} 
                                  onChange={(e) => setEditData({...editData, answer: e.target.value})}
                                  className="edit-textarea"
                                  rows={2}
                                />
                              ) : (
                                <TruncatedCell text={f.answer} cellKey={`faq-a-${f.id}`} />
                              )}
                            </td>
                            <td>
                              {editingId === f.id ? (
                                <select 
                                  value={editData.is_active ? 'true' : 'false'} 
                                  onChange={(e) => setEditData({...editData, is_active: e.target.value === 'true'})}
                                  className="edit-select"
                                >
                                  <option value="true">Sí</option>
                                  <option value="false">No</option>
                                </select>
                              ) : (
                                <span className={`status-badge ${f.is_active ? 'completado' : 'pendiente'}`}>
                                  {f.is_active ? 'Sí' : 'No'}
                                </span>
                              )}
                            </td>
                            <td>
                              {editingId === f.id ? (
                                <input 
                                  type="number"
                                  value={editData.sort_order} 
                                  onChange={(e) => setEditData({...editData, sort_order: parseInt(e.target.value) || 0})}
                                  className="edit-input"
                                  style={{ width: 60 }}
                                />
                              ) : f.sort_order}
                            </td>
                            <td>
                              <div className="actions-cell">
                                {editingId === f.id ? (
                                  <>
                                    <button onClick={() => saveEdit('faqs')} className="btn-icon-sm success" title="Guardar">
                                      <Save size={14} />
                                    </button>
                                    <button onClick={cancelEdit} className="btn-icon-sm danger" title="Cancelar">
                                      <X size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEdit(f, 'faqs')} className="btn-icon-sm" title="Editar">
                                      <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteClick('faqs', f.id)} className="btn-icon-sm danger" title="Eliminar">
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </main>
          </motion.div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo {createTable === 'productos' ? 'Producto' : createTable === 'servicios' ? 'Servicio' : createTable === 'eventos' ? 'Formación' : createTable === 'testimonials' ? 'Testimonio' : 'FAQ'}</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn-close">&times;</button>
            </div>
            <div className="modal-body">
              {createTable !== 'testimonials' && createTable !== 'faqs' && (
                <>
                  <label>Título *</label>
                  <input value={createData.title} onChange={(e) => setCreateData({...createData, title: e.target.value})} placeholder="Nombre del producto/servicio/evento" />
                  
                  <label>Descripción</label>
                  <textarea value={createData.description} onChange={(e) => setCreateData({...createData, description: e.target.value})} placeholder="Descripción" rows={3} />
                  
                  <label>Precio *</label>
                  <input value={createData.price} onChange={(e) => setCreateData({...createData, price: e.target.value})} placeholder="Ej: $500.00 CUP" />
                </>
              )}

              {createTable !== 'testimonials' && createTable !== 'faqs' && createTable !== 'eventos' && (
                <>
                  <label>Categoría</label>
                  <select value={createData.category} onChange={(e) => setCreateData({...createData, category: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {(createTable === 'productos' 
                      ? PRODUCT_CATEGORIES
                      : SERVICE_CATEGORIES
                    ).map(cat => (
                    <option key={cat} value={cat}>
                      {(createTable === 'productos' ? PRODUCT_CATEGORY_LABELS : SERVICE_CATEGORY_LABELS)[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                    ))}
                  </select>
                </>
              )}

              {createTable !== 'testimonials' && createTable !== 'faqs' && createTable === 'eventos' && (
                <>
                  <label>Fecha</label>
                  <input value={createData.date || ''} onChange={(e) => setCreateData({...createData, date: e.target.value})} placeholder="Ej: Enero 2025" />
                  <label>Estado</label>
                  <select value={createData.status || 'Proximamente'} onChange={(e) => setCreateData({...createData, status: e.target.value})}>
                    <option value="Proximamente">Próximamente</option>
                    <option value="En Curso">En Curso</option>
                  </select>
                  <label>Categoría</label>
                  <select value={createData.category || ''} onChange={(e) => setCreateData({...createData, category: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    <option value="taller">Taller</option>
                    <option value="curso">Curso</option>
                    <option value="evento">Evento</option>
                  </select>
                  <label>Icono</label>
                  <input value={createData.icon || ''} onChange={(e) => setCreateData({...createData, icon: e.target.value})} placeholder="Ej: calendar, tools, graduation" />
                  <small style={{ display: 'block', color: '#777', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Disponibles: calendar, globe, people, chart, tools, graduation, document, star, heart, leaf, bolt, box, money, grid, check, info, computer, trending, quote, starFilled
                  </small>
                </>
              )}

              {createTable === 'testimonials' && (
                <>
                  <label>Autor *</label>
                  <input value={createData.author} onChange={(e) => setCreateData({...createData, author: e.target.value})} placeholder="Nombre del autor" />
                  <label>Cita / Testimonio</label>
                  <textarea value={createData.quote} onChange={(e) => setCreateData({...createData, quote: e.target.value})} placeholder="Texto del testimonio" rows={3} />
                  <label>Posición / Cargo</label>
                  <input value={createData.position} onChange={(e) => setCreateData({...createData, position: e.target.value})} placeholder="Ej: CEO, Fundador" />
                </>
              )}

              {createTable === 'faqs' && (
                <>
                  <label>Pregunta *</label>
                  <input value={createData.question} onChange={(e) => setCreateData({...createData, question: e.target.value})} placeholder="Pregunta" />
                  <label>Respuesta *</label>
                  <textarea value={createData.answer} onChange={(e) => setCreateData({...createData, answer: e.target.value})} placeholder="Respuesta" rows={3} />
                </>
              )}

              {createTable !== 'testimonials' && createTable !== 'faqs' && (
                <label>WhatsApp Link</label>
              )}
              {createTable !== 'testimonials' && createTable !== 'faqs' && (
                <input value={createData.whatsapp_link} onChange={(e) => setCreateData({...createData, whatsapp_link: e.target.value})} placeholder="https://wa.me/5355609099?text=..." />
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="btn-cancel">Cancelar</button>
              <button onClick={handleCreate} className="btn-primary">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Edit Modal (detalles + variantes) ── */}
      {showEditProductModal && editData && (
        <div className="modal-overlay" onClick={closeProductEdit}>
          <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Producto</h2>
              <button onClick={closeProductEdit} className="btn-close">&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-col">
                  <label>ID</label>
                  <input
                    type="number"
                    min={1}
                    value={editData.id ?? ''}
                    onChange={(e) => setEditData({ ...editData, id: parseInt(e.target.value, 10) || 0 })}
                    placeholder="Número de ID"
                  />
                </div>
                <div className="form-col">
                  <label>Título *</label>
                  <input
                    value={editData.title || ''}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    placeholder="Nombre del producto"
                  />
                </div>
                <div className="form-col">
                  <label>Categoría</label>
                  <select
                    value={editData.category || 'otros'}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                  >
                    {PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{PRODUCT_CATEGORY_LABELS[cat] || cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label>Precio</label>
                  <input
                    value={editData.price || ''}
                    onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                    placeholder="Ej: $500.00 CUP"
                  />
                </div>
                <div className="form-col">
                  <label>Tipo de precio</label>
                  <select
                    value={editData.price_type || 'fijo'}
                    onChange={(e) => setEditData({ ...editData, price_type: e.target.value })}
                  >
                    <option value="fijo">Fijo</option>
                    <option value="desde">Desde</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label>Icono</label>
                  <input
                    value={editData.icon || ''}
                    onChange={(e) => setEditData({ ...editData, icon: e.target.value })}
                    placeholder="Ej: box, star, sticker"
                  />
                </div>
                <div className="form-col">
                  <label>WhatsApp Link</label>
                  <input
                    value={editData.whatsapp_link || ''}
                    onChange={(e) => setEditData({ ...editData, whatsapp_link: e.target.value })}
                    placeholder="https://wa.me/5355609099?text=..."
                  />
                </div>
              </div>

              <div className="form-row form-row--checks">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!editData.popular}
                    onChange={(e) => setEditData({ ...editData, popular: e.target.checked })}
                  />
                  Popular (destacado)
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editData.is_active !== false}
                    onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                  />
                  Visible en la web
                </label>
              </div>

              <label>Imagen</label>
              <div className="image-edit-row">
                {editData.image ? (
                  <img src={editData.image} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <span className="no-image-placeholder"><ImageUp size={16} /></span>
                )}
                <label className="upload-btn-sm" title="Subir imagen">
                  <ImageUp size={16} />
                  <span>Cambiar imagen</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = await handleImageUpload(file);
                      if (url) setEditData({ ...editData, image: url });
                    }}
                  />
                </label>
              </div>

              <label>Descripción</label>
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Descripción del producto"
                rows={3}
              />

              <div className="variants-section">
                <div className="variants-header">
                  <label>Variantes</label>
                  <button type="button" onClick={addVariant} className="btn-add-sm">
                    <Plus size={14} /> Añadir variante
                  </button>
                </div>
                <p className="variants-hint">
                  Cada variante es una presentación distinta (tamaño, lote, acabado). El precio unitario y el total se
                  muestran al cliente al elegirla.
                </p>
                {(!editData.variants || editData.variants.length === 0) ? (
                  <div className="variants-empty">Sin variantes — el producto se vende con su precio base.</div>
                ) : (
                  <div className="variants-list">
                    {editData.variants.map((v: any, i: number) => (
                      <div className="variant-row" key={i}>
                        <div className="variant-field variant-field--label">
                          <input
                            value={v.label || ''}
                            onChange={(e) => updateVariantField(i, 'label', e.target.value)}
                            placeholder="Nombre (ej: Lote de 50)"
                          />
                        </div>
                        <div className="variant-field">
                          <input
                            type="number"
                            min={0}
                            value={v.unit_price ?? ''}
                            onChange={(e) => updateVariantField(i, 'unit_price', Number(e.target.value))}
                            placeholder="Precio unitario"
                          />
                        </div>
                        <div className="variant-field">
                          <input
                            type="number"
                            min={0}
                            value={v.total_price ?? ''}
                            onChange={(e) => updateVariantField(i, 'total_price', Number(e.target.value))}
                            placeholder="Precio total"
                          />
                        </div>
                        <div className="variant-field variant-field--desc">
                          <input
                            value={v.description || ''}
                            onChange={(e) => updateVariantField(i, 'description', e.target.value)}
                            placeholder="Descripción (opcional)"
                          />
                        </div>
                        <button type="button" onClick={() => removeVariant(i)} className="btn-icon-sm danger" title="Quitar variante">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={closeProductEdit} className="btn-cancel">Cancelar</button>
              <button onClick={saveProductEdit} className="btn-primary">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showEditServiceModal && editData && (
        <div className="modal-overlay" onClick={closeServiceEdit}>
          <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Servicio</h2>
              <button onClick={closeServiceEdit} className="btn-close">&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-col">
                  <label>ID</label>
                  <input
                    type="number"
                    min={1}
                    value={editData.id ?? ''}
                    onChange={(e) => setEditData({ ...editData, id: parseInt(e.target.value, 10) || 0 })}
                    placeholder="Número de ID"
                  />
                </div>
                <div className="form-col">
                  <label>Título *</label>
                  <input
                    value={editData.title || ''}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    placeholder="Nombre del servicio"
                  />
                </div>
                <div className="form-col">
                  <label>Categoría</label>
                  <select
                    value={editData.category || 'contabilidad-finanzas'}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                  >
                    {SERVICE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{SERVICE_CATEGORY_LABELS[cat] || cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label>Subtítulo</label>
                  <input
                    value={editData.subtitle || ''}
                    onChange={(e) => setEditData({ ...editData, subtitle: e.target.value })}
                    placeholder="Subtítulo breve"
                  />
                </div>
                <div className="form-col">
                  <label>Icono</label>
                  <input
                    value={editData.icon || ''}
                    onChange={(e) => setEditData({ ...editData, icon: e.target.value })}
                    placeholder="Ej: briefcase, megaphone, chart"
                  />
                </div>
                <div className="form-col">
                  <label>WhatsApp Link</label>
                  <input
                    value={editData.whatsapp_link || ''}
                    onChange={(e) => setEditData({ ...editData, whatsapp_link: e.target.value })}
                    placeholder="https://wa.me/5355609099?text=..."
                  />
                </div>
              </div>

              <div className="form-row form-row--checks">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!editData.popular}
                    onChange={(e) => setEditData({ ...editData, popular: e.target.checked })}
                  />
                  Popular (destacado)
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editData.is_active !== false}
                    onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                  />
                  Visible en la web
                </label>
              </div>

              <label>Descripción</label>
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Descripción del servicio"
                rows={3}
              />

              <label>Incluye</label>
              <textarea
                value={Array.isArray(editData.includes) ? editData.includes.join('\n') : (editData.includes || '')}
                onChange={(e) => setEditData({ ...editData, includes: e.target.value })}
                placeholder="Un ítem por línea"
                rows={4}
              />
            </div>
            <div className="modal-footer">
              <button onClick={closeServiceEdit} className="btn-cancel">Cancelar</button>
              <button onClick={saveServiceEdit} className="btn-primary">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirmDelete !== null && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '400px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Eliminar {confirmDelete.label}</h2>
              <button onClick={() => setConfirmDelete(null)} className="btn-close">&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, color: '#555', fontSize: '0.95rem' }}>
                ¿Estás seguro de que deseas eliminar {confirmDelete.label.toLowerCase()} #{confirmDelete.id}?
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setConfirmDelete(null)} className="btn-cancel">Cancelar</button>
              <button
                onClick={handleConfirmDelete}
                className="btn-primary"
                style={{ background: '#c62828' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}