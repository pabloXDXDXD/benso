'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import TeamSidebar from './TeamSidebar';
import TeamKanban from './TeamKanban';
import TeamReports from './TeamReports';
import TeamAdmin from './TeamAdmin';
import { KanbanSkeleton } from './TeamSkeleton';
import { useTeamAuth } from '@/context/TeamAuthContext';
import type { TeamMember, Task, MonthlyReportRow, MonthlyReportTask } from '@/types/team';

const REPORT_MONTHS = [
  { key: '2026-06', label: 'Junio 2026', startDate: '2026-06-01T00:00:00Z', endDate: '2026-07-01T00:00:00Z', isFake: true },
  { key: '2026-07', label: 'Julio 2026', startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-01T00:00:00Z', isFake: false },
];
import {
  Loader, Users, BarChart3, Plus, Check, Palette,
} from 'lucide-react';



// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function TeamPage() {
  const router = useRouter();
  const { session, loading: authLoading, profile, role, signOut } = useTeamAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportRow[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [view, setView] = useState<'kanban' | 'reports' | 'equipo'>('kanban');
  const [showAddMember, setShowAddMember] = useState(false);

  // ── Onboarding state (first login after invite) ──
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardName, setOnboardName] = useState('');
  const [onboardRole, setOnboardRole] = useState('');
  const [onboardColor, setOnboardColor] = useState('#0056d0');
  const [onboardSubmitting, setOnboardSubmitting] = useState(false);
  const ONBOARD_COLORS = [
    '#0056d0', '#e91e63', '#2e7d32', '#e65100',
    '#6a1b9a', '#00838f', '#f9a825', '#d32f2f',
  ];

  // Detect mobile — sidebar starts expanded, backdrop allows dismiss
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (e.matches) setIsCollapsed(false);
    };
    handler(mql);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Fetch members (role-aware), then load report
  useEffect(() => {
    loadMembers().then(() => loadMonthlyReport(selectedMonth));
  }, [role]);

  // ── Detect first login: profile exists but no team_member ──
  useEffect(() => {
    if (!profile || loading) return;
    // Check if any team_member is linked to this user's profile
    const hasMemberEntry = members.some(m => m.profile_id === profile.id);
    if (!hasMemberEntry) {
      setOnboardName(profile.email.split('@')[0]);
      setShowOnboarding(true);
    }
  }, [profile, members, loading]);

  // Fetch tasks when active member changes
  useEffect(() => {
    if (activeMemberId !== null) {
      loadTasks(activeMemberId);
    }
  }, [activeMemberId]);

  async function loadMembers() {
    setLoading(true);

    // Timeout de seguridad: si la query se cuelga (sesión corrupta), forzar salida
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      console.warn('loadMembers: timeout after 10s, forcing loading=false');
      setLoading(false);
    }, 10000);

    try {
      let query = supabase.from('team_members').select('*');

      if (role === 'user' && session?.user && !(session.user as any).__isUserNotAvailableProxy) {
        query = query.eq('profile_id', session.user.id);
      }

      if (timedOut) return;

      query = query.order('id');
      const { data: membersData, error } = await query;

      if (timedOut) return;
      if (error) throw error;

      // Get task counts per member
      const { data: tasksData } = await supabase
        .from('team_tasks')
        .select('member_id, status');

      if (timedOut) return;

      const countsMap: Record<number, { pending: number; in_progress: number; completed: number }> = {};
      (tasksData || []).forEach((t: any) => {
        if (!countsMap[t.member_id]) {
          countsMap[t.member_id] = { pending: 0, in_progress: 0, completed: 0 };
        }
        if (t.status in countsMap[t.member_id]) {
          (countsMap[t.member_id] as any)[t.status]++;
        }
      });

      const enriched: TeamMember[] = (membersData || []).map((m: any) => ({
        ...m,
        task_counts: countsMap[m.id] || { pending: 0, in_progress: 0, completed: 0 },
      }));

      setMembers(enriched);

      // Auto-select first member if none selected
      if (enriched.length > 0 && activeMemberId === null) {
        setActiveMemberId(enriched[0].id);
      }
    } catch (e) {
      console.error('Error loading members:', e);
      toast.error('Error al cargar miembros');
    }
    clearTimeout(timeoutId);
    if (!timedOut) setLoading(false);
  }

  async function loadTasks(memberId: number) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_tasks')
        .select('*')
        .eq('member_id', memberId)
        .order('position', { ascending: true })
        .order('id', { ascending: true });

      if (error) {
        console.error('Error loading tasks - Supabase error:', JSON.stringify(error));
        toast.error('Error al cargar tareas: ' + (error.message || 'desconocido'));
        return;
      }
      setTasks(data || []);
    } catch (e) {
      console.error('Error loading tasks - throw:', e);
      toast.error('Error al cargar tareas');
    }
    setLoading(false);
  }

  const FAKE_TASKS: Record<string, { title: string; payment: number }[]> = {
    'Pablo García': [
      { title: 'Rediseñar landing page', payment: 250 },
      { title: 'Optimizar imágenes del sitio', payment: 120 },
      { title: 'Corregir bug en formulario de contacto', payment: 0 },
      { title: 'Implementar modo oscuro', payment: 180 },
    ],
    'Laura Díaz': [
      { title: 'Crear mockups de la app móvil', payment: 300 },
      { title: 'Auditar accesibilidad', payment: 0 },
      { title: 'Sistema de diseño', payment: 400 },
    ],
    'Carlos Mendoza': [
      { title: 'Planificar sprint 5', payment: 0 },
      { title: 'Reunión con stakeholders', payment: 0 },
      { title: 'Revisar presupuesto Q3', payment: 150 },
    ],
    'Ana Martínez': [
      { title: 'Campaña redes sociales', payment: 200 },
      { title: 'SEO del blog', payment: 80 },
      { title: 'Newsletter semanal', payment: 60 },
      { title: 'Analítica de tráfico', payment: 0 },
    ],
    'José Rodríguez': [
      { title: 'Tests de integración', payment: 160 },
      { title: 'Automatizar E2E', payment: 220 },
      { title: 'Reporte de bugs', payment: 0 },
    ],
  };

  async function loadMonthlyReport(monthKey: string) {
    const monthCfg = REPORT_MONTHS.find(m => m.key === monthKey);
    if (!monthCfg) return;
    let report: MonthlyReportRow[] = [];

    if (monthCfg.isFake) {
      // Datos ficticios archivados
      const { data: membersData } = await supabase.from('team_members').select('id, name');
      const members = membersData || [];
      for (const member of members) {
        const tasks = FAKE_TASKS[member.name];
        if (tasks) {
          const totalPayment = tasks.reduce((s, t) => s + t.payment, 0);
          report.push({
            member_id: member.id,
            name: member.name,
            completed_count: tasks.length,
            total_payment: totalPayment,
            tasks: tasks.map((t, i) => ({ id: -(member.id * 100 + i), title: t.title, payment: t.payment })),
          });
        }
      }
    } else {
      // Datos reales desde la BD — agrupamos por member_id desde las tareas
      // para que miembros eliminados no pierdan su historial de pagos
      const tasksResult = await supabase
        .from('team_tasks')
        .select('id, member_id, title, payment')
        .eq('status', 'completed')
        .gte('updated_at', monthCfg.startDate)
        .lt('updated_at', monthCfg.endDate);

      if (!tasksResult.error) {
        const grouped = new Map<number, MonthlyReportTask[]>();
        const presentIds = new Set<number>();

        for (const row of tasksResult.data || []) {
          presentIds.add(row.member_id);
          const list = grouped.get(row.member_id) || [];
          list.push({ id: row.id, title: row.title, payment: Number(row.payment) || 0 });
          grouped.set(row.member_id, list);
        }

        // Traemos nombres de los miembros que aún existen
        const { data: membersData } = await supabase.from('team_members').select('id, name');
        const memberName = new Map((membersData || []).map(m => [m.id, m.name]));

        for (const memberId of presentIds) {
          const tasks = grouped.get(memberId);
          if (tasks && tasks.length > 0) {
            const totalPayment = tasks.reduce((s, t) => s + t.payment, 0);
            report.push({
              member_id: memberId,
              name: memberName.get(memberId) ?? 'Miembro eliminado',
              completed_count: tasks.length,
              total_payment: totalPayment,
              tasks,
            });
          }
        }
      }
    }

    setMonthlyReport(report);
  }

  const activeMember = members.find(m => m.id === activeMemberId) || null;

  // ── Onboarding: create team_member entry on first login ──
  async function handleOnboardingSubmit() {
    if (!onboardName.trim()) {
      toast.error('Elige un nombre');
      return;
    }
    setOnboardSubmitting(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          name: onboardName.trim(),
          role: onboardRole.trim(),
          color: onboardColor,
          profile_id: profile!.id,
        });

      if (error) {
        toast.error('Error al crear perfil: ' + error.message);
        return;
      }

      toast.success(`¡Bienvenido, ${onboardName.trim()}!`);
      setShowOnboarding(false);
      await loadMembers();
    } finally {
      setOnboardSubmitting(false);
    }
  }

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch {
      // falló signOut, forzamos redirect igual
    }
    // Forzar navegación incluso si signOut falla o el evento tarde
    router.push('/team/login');
  }, [signOut, router]);

  // ── Role-based view guard ─────────────────
  useEffect(() => {
    if (role === 'user' && (view === 'reports' || view === 'equipo')) {
      setView('kanban');
    }
  }, [role, view]);

  // ── Auth guard ────────────────────────────
  const authGuardPassed = useRef(false);
  useEffect(() => {
    if (authLoading) return;
    if (!session || !profile) {
      if (!authGuardPassed.current) {
        authGuardPassed.current = true;
        router.push('/team/login');
      }
    }
  }, [session, profile, authLoading, router]);

  if (authLoading) {
    return (
      <div className="team-loading" style={{ minHeight: '100vh' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Loader size={24} />
        </motion.div>
        <span>Cargando sesión…</span>
      </div>
    );
  }

  if (!session || !profile) {
    return null;
  }

  // ── Kanban content ────────────────────────
  return (
    <div className="team-container">
      <div className="team-layout">
        <TeamSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onRefresh={() => {
            loadMembers().then(() => loadMonthlyReport(selectedMonth));
            if (activeMemberId) loadTasks(activeMemberId);
          }}
          loading={loading}
          isMobile={isMobile}
          onLogout={handleLogout}
          role={role ?? 'admin'}
          activeView={view}
          onViewChange={(v) => setView(v)}
        />

        <motion.div
          className="team-content-wrapper"
          animate={{ marginLeft: isMobile ? 64 : (isCollapsed ? 64 : 200) }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Member selector — always visible on kanban view for admins */}
          {view === 'kanban' && role === 'admin' && (
            <div className="member-picker">
              {members.map(m => (
                <button
                  key={m.id}
                  className={`member-picker-chip${activeMemberId === m.id ? ' active' : ''}`}
                  onClick={() => setActiveMemberId(m.id)}
                  title={m.name}
                >
                  <span className="member-picker-name">{m.name}</span>
                  {activeMemberId === m.id && <span className="member-picker-check">✓</span>}
                </button>
              ))}
            </div>
          )}

          {/* Header — solo para kanban */}
          {view === 'kanban' && (
            <div className="team-header">
                <h1>
                  {activeMember ? (
                    activeMember.name
                  ) : (
                    <Users size={24} />
                  )}
                </h1>
            </div>
          )}
          {view === 'equipo' && role === 'admin' && (
            <div className="team-header" style={{ justifyContent: 'flex-end' }}>
              <button className="btn-add-task" onClick={() => setShowAddMember(true)}>
                <Plus size={18} /> Invitar miembro
              </button>
            </div>
          )}

          {/* Content: View routing */}
          <main id="main-content" tabIndex={-1} className="team-main">
            {view === 'reports' && (
              <TeamReports
                monthlyReport={monthlyReport}
                selectedMonth={selectedMonth}
                onMonthChange={(month) => {
                  setSelectedMonth(month);
                  loadMonthlyReport(month);
                }}
                reportMonths={REPORT_MONTHS}
              />
            )}
            {view === 'kanban' && loading && <KanbanSkeleton />}
            {view === 'kanban' && !loading && (
              <TeamKanban
                tasks={tasks}
                onTasksChange={setTasks}
                members={members}
                onMembersChange={setMembers}
                activeMember={activeMember}
                activeMemberId={activeMemberId}
                role={role}
                onLoadTasks={loadTasks}
              />
            )}
            {view === 'equipo' && (
<TeamAdmin
  members={members}
  role={role}
  accessToken={session?.access_token ?? null}
  onRefresh={() => loadMembers().then(() => loadMonthlyReport(selectedMonth))}
  showAddMember={showAddMember}
  onAddMemberDone={() => setShowAddMember(false)}
/>
            )}
          </main>
        </motion.div>
      </div>

      {/* ── Onboarding Modal (first login) ── */}
      {showOnboarding && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bienvenido a Benso Team</h2>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                Elige cómo aparecerás en el equipo
              </p>

              <label>Tu nombre</label>
              <input
                value={onboardName}
                onChange={(e) => setOnboardName(e.target.value)}
                placeholder="Tu nombre"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && !onboardSubmitting && handleOnboardingSubmit()}
              />

              <label>Cargo</label>
              <input
                value={onboardRole}
                onChange={(e) => setOnboardRole(e.target.value)}
                placeholder="Ej: Diseñador UX"
              />

              <label>Color</label>
              <div className="color-picker-row">
                {ONBOARD_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch${onboardColor === c ? ' active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setOnboardColor(c)}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={handleOnboardingSubmit}
                className="btn-primary"
                disabled={onboardSubmitting}
              >
                {onboardSubmitting ? 'Guardando...' : 'Comenzar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
