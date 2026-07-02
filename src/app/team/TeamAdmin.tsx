'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { Pencil, Trash2, Users, Mail, Settings, Eye, EyeOff } from 'lucide-react';
import { AdminTableSkeleton } from './TeamSkeleton';
import type { TeamMember, TeamProfileWithMember } from '@/types/team';

const FN_URL = 'https://irhbkkfvcawklbahivii.supabase.co/functions/v1';

async function apiPost(name: string, body: unknown, accessToken: string) {
	  const controller = new AbortController();
	  const timeoutId = setTimeout(() => {
	    console.warn(`apiPost: aborting ${name} after 20s`);
	    controller.abort();
	  }, 20000);

	  try {
	    const res = await fetch(`${FN_URL}/${name}`, {
	      method: 'POST',
	      headers: {
	        'Content-Type': 'application/json',
	        Authorization: `Bearer ${accessToken}`,
	      },
	      body: JSON.stringify(body),
	      signal: controller.signal,
	    });
	    clearTimeout(timeoutId);

	    if (!res.ok) {
	      console.error(`apiPost: HTTP ${res.status} for ${name}`);
	    }
	    const text = await res.text();
	    try {
      return JSON.parse(text);
    } catch {
      console.error('apiPost: invalid JSON response', text.slice(0, 300));
      throw new Error('Respuesta inválida del servidor');
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.error(`apiPost: request aborted for ${name}`);
      throw new Error('TimeoutError');
    }
    throw err;
  }
}

// ─────────────────────────────────────────────
// Props Interface
// ─────────────────────────────────────────────

export interface TeamAdminProps {
  members: TeamMember[];
  role: 'admin' | 'user' | null;
  accessToken: string | null;
  onRefresh: () => void;
  showAddMember?: boolean;
  onAddMemberDone?: () => void;
}

// ─────────────────────────────────────────────
// TeamAdmin Component
// ─────────────────────────────────────────────

export default function TeamAdmin({ members, role, accessToken, onRefresh, showAddMember, onAddMemberDone }: TeamAdminProps) {
  // Member CRUD state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Safety timeout: reset submitting if stuck for >25s ──
  useEffect(() => {
    if (!submitting) return;
    const id = setTimeout(() => {
      console.warn('submitting stuck >25s, force reset');
      setSubmitting(false);
    }, 25000);
    return () => clearTimeout(id);
  }, [submitting]);

  // Account state
  const [profiles, setProfiles] = useState<TeamProfileWithMember[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);



  // ── Watch external trigger to open add member modal ──
  useEffect(() => {
    if (showAddMember) {
      openAddMember();
      onAddMemberDone?.();
    }
  }, [showAddMember]);

  // ── Load profiles ──
  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    setProfilesLoading(true);
    try {
      const { data, error } = await supabase.from('team_profiles').select('*');
      if (error) throw error;
      setProfiles(data || []);
    } catch (e) {
      console.error('Error loading profiles:', e);
      toast.error('Error al cargar perfiles');
    } finally {
      setProfilesLoading(false);
    }
  }

  // ── Permissions guard ──
  if (role !== 'admin') {
    return (
      <div className="team-loading">
        <Settings size={32} opacity={0.3} />
        <span>No tienes permisos</span>
      </div>
    );
  }

  // ── Member helpers ──
  function resetMemberForm() {
    setMemberName('');
    setMemberEmail('');
    setMemberPassword('');
    setShowPassword(false);
    setInviteRole('user');
    setEditingMember(null);
    setShowMemberModal(false);
  }

  function openAddMember() {
    resetMemberForm();
    setShowMemberModal(true);
  }

  function openEditMember(member: TeamMember) {
    setMemberName(member.name);
    setEditingMember(member);
    setShowMemberModal(true);
  }

  async function handleAddMember() {
    if (!memberName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!memberEmail.trim()) {
      toast.error('El correo electrónico es obligatorio');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberEmail)) {
      toast.error('Correo electrónico inválido');
      return;
    }
    if (!memberPassword || memberPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      if (!accessToken) {
        toast.error('Sesión no disponible. Cierra sesión y vuelve a iniciarla.');
        return;
      }

      const data = await apiPost('invite-team-user', {
        name: memberName.trim(),
        email: memberEmail.trim().toLowerCase(),
        password: memberPassword,
        role: inviteRole,
      }, accessToken);

      if (!data.success) {
        toast.error(data.error || 'Error al añadir miembro');
        return;
      }

      toast.success(`¡${memberName.trim()} añadido al equipo!`);
      resetMemberForm();
      onRefresh();
      loadProfiles();
    } catch (err: any) {
      if (err.message === 'TimeoutError') {
        toast.error('El servidor no responde. Intenta de nuevo.');
      } else {
        toast.error('Error de conexión al añadir miembro');
      }
      console.error('Add member error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Member CRUD ──
  async function handleMemberSubmit() {
    setSubmitting(true);
    try {
      if (editingMember) {
        if (!memberName.trim()) {
          toast.error('El nombre es obligatorio');
          return;
        }

        const { error } = await supabase
          .from('team_members')
          .update({ name: memberName.trim() })
          .eq('id', editingMember.id);

        if (error) {
          toast.error('Error: ' + error.message);
          return;
        }
        toast.success('Miembro actualizado');
      }

      resetMemberForm();
      onRefresh();
      loadProfiles();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteMember(memberId: number) {
    setDeleting(true);
    try {
      if (!accessToken) {
        toast.error('Sesión no disponible. Cierra sesión y vuelve a iniciarla.');
        return;
      }

      const data = await apiPost('delete-team-member', { memberId }, accessToken);

      if (!data.success) {
        toast.error(data.error || 'Error al eliminar miembro');
        return;
      }

      toast.success('Miembro eliminado (cuenta y acceso revocados)');
      setConfirmDelete(null);
      onRefresh();
      loadProfiles();
    } catch (err: any) {
      if (err.message === 'TimeoutError') {
        toast.error('El servidor no responde. Intenta de nuevo.');
      } else {
        toast.error('Error de conexión al eliminar miembro');
      }
      console.error('Delete member error:', err);
    } finally {
      setDeleting(false);
    }
  }

  // ── Render ──
  return (
    <div className="admin-view">
      {/* Skeleton mientras cargan profiles — evita el flash de "Sin cuenta" */}
      {profilesLoading && members.length > 0 ? (
        <AdminTableSkeleton />
      ) : members.length === 0 ? (
        <div className="team-loading" style={{ minHeight: '20vh' }}>
          <Users size={32} opacity={0.3} />
          <span>No hay miembros aún. Añade uno.</span>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cuenta vinculada</th>
                <th>Rol</th>
                <th style={{ width: '100px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const memberProfile = member.profile_id
                  ? profiles.find((p) => p.id === member.profile_id)
                  : null;

                return (
                  <tr key={member.id}>
                    <td className="admin-name">{member.name}</td>
                    <td className="admin-account-cell">
                      {memberProfile ? (
                        <span className="admin-linked-account">
                          <Mail size={12} />
                          {memberProfile.email}
                        </span>
                      ) : (
                        <span className="admin-no-account">Sin cuenta</span>
                      )}
                    </td>
                    <td className="admin-role">
                      {memberProfile ? (
                        <span className={`role-badge role-${memberProfile.role}`}>
                          {memberProfile.role === 'admin' ? 'Admin' : 'Miembro'}
                        </span>
                      ) : (
                        <span className="role-badge role-pending">Pendiente</span>
                      )}
                    </td>
                    <td className="admin-actions">
                      <button
                        className="admin-action-btn"
                        onClick={() => openEditMember(member)}
                        title="Editar"
                        aria-label="Editar miembro"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="admin-action-btn admin-action-delete"
                        onClick={() => setConfirmDelete(member.id)}
                        title="Eliminar"
                        aria-label="Eliminar miembro"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}



      {/* ── Add/Edit Member Modal ── */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={resetMemberForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMember ? 'Editar Miembro' : 'Añadir Miembro'}</h2>
              <button onClick={resetMemberForm} className="btn-close">&times;</button>
            </div>
            <div className="modal-body">
              {editingMember ? (
                <>
                  <label>Nombre</label>
                  <input
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Nombre del miembro"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && !submitting && handleMemberSubmit()}
                  />
                </>
              ) : (
                <div className="invite-link-section">
                  <label>Tipo de acceso</label>
                  <div className="invite-role-selector">
                    <button
                      type="button"
                      className={`invite-role-btn${inviteRole === 'user' ? ' active' : ''}`}
                      onClick={() => setInviteRole('user')}
                    >
                      <Users size={18} />
                      <span>
                        <strong>Miembro</strong>
                        <small>Accede al kanban, crea y mueve tareas</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`invite-role-btn${inviteRole === 'admin' ? ' active' : ''}`}
                      onClick={() => setInviteRole('admin')}
                    >
                      <Settings size={18} />
                      <span>
                        <strong>Admin</strong>
                        <small>Gestiona miembros, reportes y configuración</small>
                      </span>
                    </button>
                  </div>

                  <hr className="invite-divider" />

                  <div>
                    <label>Nombre *</label>
                    <input
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="Nombre del miembro"
                      className="login-input"
                      autoFocus
                      disabled={submitting}
                    />

                    <label style={{ marginTop: '1rem' }}>Correo electrónico *</label>
                    <input
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="login-input"
                      disabled={submitting}
                    />

                    <label style={{ marginTop: '1rem' }}>Contraseña *</label>
                    <div className="password-field" style={{ marginBottom: 0 }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={memberPassword}
                        onChange={(e) => setMemberPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="login-input"
                        autoComplete="new-password"
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        tabIndex={-1}
                        disabled={submitting}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                      La contraseña se la compartes al nuevo miembro. No podrás verla después.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {editingMember ? (
                <>
                  <button onClick={resetMemberForm} className="btn-cancel">Cancelar</button>
                  <button
                    onClick={handleMemberSubmit}
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={resetMemberForm} className="btn-cancel" disabled={submitting}>
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddMember}
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Añadiendo…' : 'Añadir miembro'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {confirmDelete !== null && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div
            className="modal-content admin-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Eliminar miembro</h2>
              <button onClick={() => setConfirmDelete(null)} className="btn-close">&times;</button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar este miembro?</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setConfirmDelete(null)} className="btn-cancel">
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteMember(confirmDelete!)}
                className="btn-primary"
                style={{ background: '#d32f2f' }}
                disabled={deleting}
              >
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
