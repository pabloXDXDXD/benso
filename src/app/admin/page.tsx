'use client';

import { useState, useEffect, useRef } from 'react';
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
}

interface Evento {
  id: number;
  title: string;
  description: string;
  date: string;
  status: string;
  image?: string;
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

interface Testimonial {
  id: number;
  quote: string;
  quote_en: string;
  author: string;
  position: string;
  position_en: string;
  image: string;
  is_active: boolean;
  sort_order: number;
}

interface Faq {
  id: number;
  question: string;
  question_en: string;
  answer: string;
  answer_en: string;
  is_active: boolean;
  sort_order: number;
}

const PRODUCT_CATEGORIES = ['pegatinas', 'posters', 'cuadros', 'tarjetas', 'lonas', 'otros'];
const SERVICE_CATEGORIES = ['consultoria', 'herramientas', 'capacitacion'];

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
  id: 70, acciones: 100, popular: 80, estado: 130,
  precio: 120, fecha: 120, contactos: 200, items: 220,
  total: 110, cliente: 150, nombre: 150, titulo: 200,
  desc: 250, mensaje: 250, msj: 250,
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pedidos' | 'citas' | 'productos' | 'servicios' | 'eventos' | 'testimonials' | 'faqs'>('dashboard');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  // loading is derived from queries below — kept as var name for JSX compatibility
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>(null);
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
      || testimonialsQuery.isLoading || faqsQuery.isLoading
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

  const filteredData = {
    pedidos: pedidos.filter(p => p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())),
    citas: citas.filter(c => c.nombre?.toLowerCase().includes(searchTerm.toLowerCase())),
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
    eventos: eventos.filter(e => e.title?.toLowerCase().includes(searchTerm.toLowerCase())),
    testimonials: testimonials.filter(t => t.author?.toLowerCase().includes(searchTerm.toLowerCase())),
    faqs: faqs.filter(f => f.question?.toLowerCase().includes(searchTerm.toLowerCase())),
  };

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
        const title = item.title || item.name || '';
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
    productos: productos.length,
    servicios: servicios.length,
    eventos: eventos.length,
    testimonials: testimonials.length,
    faqs: faqs.length,
  };

  return (
    <div className="admin-container">
      {!isAuthenticated ? (
        <div className="login-screen">
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
              {(activeTab === 'productos' || activeTab === 'servicios') && (
                <select 
                  className="filter-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {(activeTab === 'productos' ? PRODUCT_CATEGORIES : SERVICE_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              )}
              <span className="results-count">
                {filteredData[activeTab]?.length || 0} resultados
              </span>
            </div>
            <div className="toolbar-right">
              {activeTab !== 'pedidos' && activeTab !== 'citas' && (
                <button onClick={() => { setShowCreateModal(true); setCreateTable(activeTab as 'productos' | 'servicios' | 'eventos' | 'testimonials' | 'faqs'); }} className="btn-add">
                  <Plus size={18} /> Añadir
                </button>
              )}
            </div>
          </div>
          )}

          <main className="admin-main">
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
                  <div className="table-container">
                    <table className="data-table">
                      <colgroup>
                        <col style={{ width: getColWidth('pedidos-id', colWidths) }} />
                        <col style={{ width: getColWidth('pedidos-cliente', colWidths) }} />
                        <col style={{ width: getColWidth('pedidos-contactos', colWidths) }} />
                        <col style={{ width: getColWidth('pedidos-items', colWidths) }} />
                        <col style={{ width: getColWidth('pedidos-total', colWidths) }} />
                        <col style={{ width: getColWidth('pedidos-estado', colWidths) }} />
                        <col style={{ width: getColWidth('pedidos-fecha', colWidths) }} />
                        <col style={{ width: getColWidth('pedidos-acciones', colWidths) }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th style={{position:'relative'}}>ID<ColResizeHandle col="pedidos-id" /></th>
                          <th style={{position:'relative'}}>Cliente<ColResizeHandle col="pedidos-cliente" /></th>
                          <th style={{position:'relative'}}>Contactos<ColResizeHandle col="pedidos-contactos" /></th>
                          <th style={{position:'relative'}}>Items<ColResizeHandle col="pedidos-items" /></th>
                          <th style={{position:'relative'}}>Total<ColResizeHandle col="pedidos-total" /></th>
                          <th style={{position:'relative'}}>Estado<ColResizeHandle col="pedidos-estado" /></th>
                          <th style={{position:'relative'}}>Fecha<ColResizeHandle col="pedidos-fecha" /></th>
                          <th style={{position:'relative'}}>Acciones<ColResizeHandle col="pedidos-acciones" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.pedidos.map(p => (
                          <tr key={p.id}>
                            <td className="id-cell">{formatId(p.id)}</td>
                            <td className="name-cell">{p.customer_name}</td>
                            <td>
                              <div className="contact-cell">
                                {p.customer_email && <span><Mail size={14} /> {p.customer_email}</span>}
                              </div>
                            </td>
                            <td className="items-cell">
                              <div className="items-list">
                                {(() => {
                                  const itemsKey = `items-${p.id}`;
                                  const showAll = expandedCells[itemsKey];
                                  const itemsToShow = showAll ? p.items : p.items?.slice(0, 3);
                                  return (itemsToShow || []).map((i: any, idx: number) => (
                                    <span key={idx}>• {i.title} x{i.quantity}</span>
                                  ));
                                })()}
                                {p.items?.length > 3 && (
                                  <button onClick={() => toggleCell(`items-${p.id}`)} className="expand-toggle more">
                                    {expandedCells[`items-${p.id}`] ? 'Ver menos' : `Ver +${p.items.length - 3} más`}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="price-cell">{p.total_price?.toLocaleString()} CUP</td>
                            <td>
                              <select 
                                value={p.status} 
                                onChange={(e) => updateStatus(p.id, e.target.value)}
                                className={`status-select ${p.status}`}
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="completado">Completado</option>
                              </select>
                            </td>
                            <td className="date-cell">{new Date(p.created_at).toLocaleDateString('es-ES')}</td>
                            <td>
                              <div className="actions-cell">
                                <button onClick={() => {
                                  const items = (p.items || []).map((i: any) => `  • ${i.title} x${i.quantity} — ${i.price} CUP`).join('\n');
                                  copyToClipboard('Pedido', `Pedido #${p.id} — ${p.customer_name}\nEmail: ${p.customer_email}\nItems:\n${items}\nTotal: ${p.total_price?.toLocaleString()} CUP\nEstado: ${p.status}\nFecha: ${new Date(p.created_at).toLocaleDateString('es-ES')}`);
                                }} className="btn-icon-sm" title="Copiar info del pedido">
                                  <Copy size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Paginación pedidos */}
                    {(() => {
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
                  </div>
                )}

                {activeTab === 'citas' && (
                  <div className="table-container">
                    <table className="data-table">
                      <colgroup>
                        <col style={{ width: getColWidth('citas-id', colWidths) }} />
                        <col style={{ width: getColWidth('citas-nombre', colWidths) }} />
                        <col style={{ width: getColWidth('citas-contactos', colWidths) }} />
                        <col style={{ width: getColWidth('citas-mensaje', colWidths) }} />
                        <col style={{ width: getColWidth('citas-fecha', colWidths) }} />
                        <col style={{ width: getColWidth('citas-acciones', colWidths) }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th style={{position:'relative'}}>ID<ColResizeHandle col="citas-id" /></th>
                          <th style={{position:'relative'}}>Nombre<ColResizeHandle col="citas-nombre" /></th>
                          <th style={{position:'relative'}}>Contactos<ColResizeHandle col="citas-contactos" /></th>
                          <th style={{position:'relative'}}>Mensaje<ColResizeHandle col="citas-mensaje" /></th>
                          <th style={{position:'relative'}}>Fecha<ColResizeHandle col="citas-fecha" /></th>
                          <th style={{position:'relative'}}>Acciones<ColResizeHandle col="citas-acciones" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.citas.map(c => (
                          <tr key={c.id}>
                            <td className="id-cell">{formatId(c.id)}</td>
                            <td className="name-cell">{c.nombre}</td>
                            <td>
                              <div className="contact-cell">
                                {c.email && <span><Mail size={14} /> {c.email}</span>}
                                {c.telefono && <span><Phone size={14} /> {c.telefono}</span>}
                              </div>
                            </td>
                            <td className="messaje-cell"><TruncatedCell text={c.mensaje} cellKey={`msg-c-${c.id}`} /></td>
                            <td className="date-cell">{new Date(c.fecha_creacion).toLocaleString('es-ES')}</td>
                            <td>
                              <div className="actions-cell">
                                <button onClick={() => {
                                  copyToClipboard('Cita', `Cita #${c.id} — ${c.nombre}\nEmail: ${c.email || '—'}\nTeléfono: ${c.telefono || '—'}\nMensaje: ${c.mensaje || '—'}\nFecha: ${new Date(c.fecha_creacion).toLocaleString('es-ES')}`);
                                }} className="btn-icon-sm" title="Copiar info de la cita">
                                  <Copy size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'productos' && (
                  <div className="table-container">
                    <table className="data-table">
                      <colgroup>
                        <col style={{ width: getColWidth('prod-id', colWidths) }} />
                        <col style={{ width: getColWidth('prod-titulo', colWidths) }} />
                        <col style={{ width: 60 }} />
                        <col style={{ width: getColWidth('prod-desc', colWidths) }} />
                        <col style={{ width: getColWidth('prod-precio', colWidths) }} />
                        <col style={{ width: getColWidth('prod-acciones', colWidths) }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th style={{position:'relative'}}>ID<ColResizeHandle col="prod-id" /></th>
                          <th style={{position:'relative'}}>Producto<ColResizeHandle col="prod-titulo" /></th>
                          <th style={{position:'relative'}}>Imagen</th>
                          <th style={{position:'relative'}}>Descripción<ColResizeHandle col="prod-desc" /></th>
                          <th style={{position:'relative'}}>Precio<ColResizeHandle col="prod-precio" /></th>
                          <th style={{position:'relative'}}>Acciones<ColResizeHandle col="prod-acciones" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.productos.map(p => (
                          <tr key={p.id}>
                            <td className="id-cell">{formatId(p.id)}</td>
                            <td>
                              {editingId === p.id ? (
                                <input 
                                  value={editData.title} 
                                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                                  className="edit-input"
                                />
                              ) : p.title}
                            </td>
                            <td>
                              {editingId === p.id ? (
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
                                p.image ? (
                                  <img src={p.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                                ) : (
                                  <span className="no-image-placeholder"><ImageUp size={16} /></span>
                                )
                              )}
                            </td>
                            <td className="desc-cell">
                              {editingId === p.id ? (
                                <textarea 
                                  value={editData.description} 
                                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                                  className="edit-textarea"
                                  rows={2}
                                />
                              ) : (
                                <TruncatedCell text={p.description} cellKey={`desc-p-${p.id}`} />
                              )}
                            </td>
                            <td>
                              {editingId === p.id ? (
                                <input 
                                  value={editData.price} 
                                  onChange={(e) => setEditData({...editData, price: e.target.value})}
                                  className="edit-input price-input"
                                />
                              ) : (
                                <span className="price-display">{p.price}</span>
                              )}
                            </td>
                            <td>
                              <div className="actions-cell">
                                {editingId === p.id ? (
                                  <>
                                    <button onClick={() => saveEdit('productos')} className="btn-icon-sm success" title="Guardar">
                                      <Save size={14} />
                                    </button>
                                    <button onClick={cancelEdit} className="btn-icon-sm danger" title="Cancelar">
                                      <X size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEdit(p, 'productos')} className="btn-icon-sm" title="Editar">
                                      <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteClick('productos', p.id)} className="btn-icon-sm danger" title="Eliminar">
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

                {activeTab === 'servicios' && (
                  <div className="table-container">
                    <table className="data-table">
                      <colgroup>
                        <col style={{ width: getColWidth('serv-id', colWidths) }} />
                        <col style={{ width: getColWidth('serv-titulo', colWidths) }} />
                        <col style={{ width: 60 }} />
                        <col style={{ width: getColWidth('serv-desc', colWidths) }} />
                        <col style={{ width: getColWidth('serv-precio', colWidths) }} />
                        <col style={{ width: getColWidth('serv-acciones', colWidths) }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th style={{position:'relative'}}>ID<ColResizeHandle col="serv-id" /></th>
                          <th style={{position:'relative'}}>Servicio<ColResizeHandle col="serv-titulo" /></th>
                          <th style={{position:'relative'}}>Imagen</th>
                          <th style={{position:'relative'}}>Descripción<ColResizeHandle col="serv-desc" /></th>
                          <th style={{position:'relative'}}>Precio<ColResizeHandle col="serv-precio" /></th>
                          <th style={{position:'relative'}}>Acciones<ColResizeHandle col="serv-acciones" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.servicios.map(s => (
                          <tr key={s.id}>
                            <td className="id-cell">{formatId(s.id)}</td>
                            <td>
                              {editingId === s.id ? (
                                <input 
                                  value={editData.title} 
                                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                                  className="edit-input"
                                />
                              ) : s.title}
                            </td>
                            <td>
                              {editingId === s.id ? (
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
                                s.image ? (
                                  <img src={s.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                                ) : (
                                  <span className="no-image-placeholder"><ImageUp size={16} /></span>
                                )
                              )}
                            </td>
                            <td className="desc-cell">
                              {editingId === s.id ? (
                                <textarea 
                                  value={editData.description} 
                                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                                  className="edit-textarea"
                                  rows={2}
                                />
                              ) : (
                                <TruncatedCell text={s.description} cellKey={`desc-s-${s.id}`} />
                              )}
                            </td>
                            <td>
                              {editingId === s.id ? (
                                <input 
                                  value={editData.price} 
                                  onChange={(e) => setEditData({...editData, price: e.target.value})}
                                  className="edit-input price-input"
                                />
                              ) : (
                                <span className="price-display">{s.price}</span>
                              )}
                            </td>
                            <td>
                              <div className="actions-cell">
                                {editingId === s.id ? (
                                  <>
                                    <button onClick={() => saveEdit('servicios')} className="btn-icon-sm success" title="Guardar">
                                      <Save size={14} />
                                    </button>
                                    <button onClick={cancelEdit} className="btn-icon-sm danger" title="Cancelar">
                                      <X size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEdit(s, 'servicios')} className="btn-icon-sm" title="Editar">
                                      <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteClick('servicios', s.id)} className="btn-icon-sm danger" title="Eliminar">
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
                        <col style={{ width: getColWidth('ev-acciones', colWidths) }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th style={{position:'relative'}}>ID<ColResizeHandle col="ev-id" /></th>
                          <th style={{position:'relative'}}>Evento<ColResizeHandle col="ev-titulo" /></th>
                          <th style={{position:'relative'}}>Imagen</th>
                          <th style={{position:'relative'}}>Descripción<ColResizeHandle col="ev-desc" /></th>
                          <th style={{position:'relative'}}>Fecha<ColResizeHandle col="ev-fecha" /></th>
                          <th style={{position:'relative'}}>Estado<ColResizeHandle col="ev-estado" /></th>
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
              <h2>Nuevo {createTable === 'productos' ? 'Producto' : createTable === 'servicios' ? 'Servicio' : createTable === 'eventos' ? 'Evento' : createTable === 'testimonials' ? 'Testimonio' : 'FAQ'}</h2>
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
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
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