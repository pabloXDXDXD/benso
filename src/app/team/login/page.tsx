'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { useTeamAuth } from '@/context/TeamAuthContext';
import { BensoLogo } from '@/components/BensoLogo';

export default function TeamLoginPage() {
  const { session, loading: authLoading, signIn } = useTeamAuth();
  const router = useRouter();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (!authLoading && session) {
      router.push('/team');
    }
  }, [authLoading, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!login.trim()) {
      toast.error('Introduce tu usuario o correo');
      return;
    }

    if (!password) {
      toast.error('Introduce tu contraseña');
      return;
    }

    setSubmitting(true);
    const { error } = await signIn(login, password);
    setSubmitting(false);

    if (error) {
      const isNetworkError = error.toLowerCase().includes('network') || error.toLowerCase().includes('fetch');
      const isInvalid = error.toLowerCase().includes('invalid login credentials');
      const msg = isNetworkError
        ? 'Error de conexión'
        : isInvalid
          ? 'Credenciales inválidas'
          : error;
      toast.error(msg);
      return;
    }

    router.push('/team');
  };

  // Show loading while checking initial auth state
  if (authLoading) {
    return (
      <div className="login-screen">
        <div className="team-loading">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <Loader size={24} />
          </motion.div>
          <span>Cargando sesión…</span>
        </div>
      </div>
    );
  }

  // If already authenticated, don't flash the form
  if (session) {
    return null;
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        {/* BENSO Logo */}
        <div className="login-logo">
          <BensoLogo height={48} className="login-logo-svg" />
        </div>
        <h1>Team</h1>
        <p className="login-subtitle">Acceso al panel de equipo</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Usuario o correo"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="login-input"
            aria-label="Usuario o correo"
            autoComplete="username"
            disabled={submitting}
          />

          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Contraseña"
              autoComplete="current-password"
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

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? <Loader size={18} className="spin" /> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
