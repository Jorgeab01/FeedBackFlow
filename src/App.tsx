import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { supabase } from '@/lib/supabase';

// Lazy-loaded pages for code-splitting (reduces initial bundle size)
const LoginPage = lazy(() => import('@/sections/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/sections/RegisterPage').then(m => ({ default: m.RegisterPage })));
const PlansPage = lazy(() => import('@/sections/PlansPage').then(m => ({ default: m.PlansPage })));
const DashboardPage = lazy(() => import('@/sections/DashboardPage').then(m => ({ default: m.DashboardPage })));
const FeedbackPage = lazy(() => import('@/sections/FeedbackPage').then(m => ({ default: m.FeedbackPage })));
const MaintenancePage = lazy(() => import('@/sections/MaintenancePage').then(m => ({ default: m.MaintenancePage })));
const TermsPage = lazy(() => import('@/sections/TermsPage').then(m => ({ default: m.TermsPage })));
const OnboardingPage = lazy(() => import('@/sections/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const VerifyEmailPage = lazy(() => import('@/sections/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const EmailVerifiedPage = lazy(() => import('@/sections/EmailVerifiedPage').then(m => ({ default: m.EmailVerifiedPage })));
const ResetPasswordPage = lazy(() => import('@/sections/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const LandingPage = lazy(() => import('@/sections/LandingPage').then(m => ({ default: m.LandingPage })));
const BlogPage = lazy(() => import('@/sections/BlogPage').then(m => ({ default: m.BlogPage })));
const BlogPostPage = lazy(() => import('@/sections/BlogPostPage').then(m => ({ default: m.BlogPostPage })));
const NotFoundPage = lazy(() => import('@/sections/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
// 🆕 Página de Administración
const AdminPage = lazy(() => import('@/sections/AdminPage').then(m => ({ default: m.AdminPage })));

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Toaster } from '@/components/ui/sonner';
import type { PlanType } from '@/types';
import { toast } from 'sonner';

// Scroll to top on route change, or to hash element if present
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Poll until the element exists (lazy-loaded pages need time to render)
      let attempts = 0;
      const maxAttempts = 30; // 30 × 50ms = 1.5s max wait
      const poll = setInterval(() => {
        const el = document.getElementById(hash.slice(1));
        if (el) {
          clearInterval(poll);
          el.scrollIntoView({ behavior: 'smooth' });
        } else if (++attempts >= maxAttempts) {
          clearInterval(poll);
        }
      }, 50);
      return () => clearInterval(poll);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
}

// 🌍 Feedback público
function FeedbackRoute() {
  const { businessId } = useParams<{ businessId: string }>();
  if (!businessId) return <Navigate to="/login" replace />;
  return <FeedbackPage businessId={businessId} />;
}

// Componente de Loading centralizado
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">Cargando...</p>
      </div>
    </div>
  );
}

// 🔐 Ruta privada con protección robusta
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const hasShownContent = useRef(false);

  useEffect(() => {
    // Una vez que el contenido se muestra, no volver a ocultar por cambios de carga
    if (!isLoading && isAuthenticated && user) {
      const timer = setTimeout(() => {
        setShowContent(true);
        hasShownContent.current = true;
      }, 50);
      return () => clearTimeout(timer);
    } else if (!isAuthenticated && !isLoading) {
      // Solo ocultar si realmente perdimos la autenticación
      setShowContent(false);
      hasShownContent.current = false;
    }
  }, [isLoading, isAuthenticated, user]);

  console.log('[PrivateRoute]', { isLoading, isAuthenticated, hasUser: !!user, showContent, hasShownContent: hasShownContent.current });

  // ✅ Si ya mostramos el contenido una vez y solo está refrescando token, no mostrar loader
  if (hasShownContent.current && isAuthenticated && user) {
    if (user.businessName === 'Configurando Negocio...') {
      return <Navigate to="/onboarding" replace />;
    }
    console.log('[PrivateRoute] ✅ Content already shown, keeping it visible');
    return <>{children}</>;
  }

  // 1️⃣ Mostrar loader solo en carga inicial o durante redirect OAuth
  if (isLoading && !hasShownContent.current) {
    return <LoadingScreen />;
  }

  // 2️⃣ Si autenticado pero user es null (y no hemos mostrado contenido), seguir esperando
  if (isAuthenticated && !user && !hasShownContent.current) {
    console.warn('[PrivateRoute] ⚠️ Authenticated but user is null, waiting...');
    return <LoadingScreen />;
  }

  // 3️⃣ Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    console.log('[PrivateRoute] ❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // 3.5️⃣ Forzar Onboarding si el usuario no tiene nombre de negocio (ej: Google OAuth)
  if (user?.businessName === 'Configurando Negocio...') {
    return <Navigate to="/onboarding" replace />;
  }

  // 3.6️⃣ Forzar selección de plan si no tiene uno (ej: recién registrado por email)
  if (user?.requiresPlanSelection) {
    return <Navigate to="/plans" replace />;
  }

  // 4️⃣ Solo renderizar cuando todo está listo
  if (!showContent && !hasShownContent.current) {
    return <LoadingScreen />;
  }

  console.log('[PrivateRoute] ✅ Rendering protected content');
  return <>{children}</>;
}

// 🔓 Ruta pública (redirige a dashboard si ya está autenticado)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    console.log('[PublicRoute] User authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// 🎫 Ruta de planes (accesible solo con auth ahora que el registro es previo)
function PlansRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // 1️⃣ Si ya está autenticado, permitir acceso a los planes
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // ❌ Sin autenticación -> volver a login
  console.log('[PlansRoute] No auth, redirecting to login');
  return <Navigate to="/login" replace />;
}

// 🛡️ Ruta de Admin - Solo accesible para administradores
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  // Determinar si es admin de forma síncrona
  const ADMIN_EMAIL = 'jorgeab496@gmail.com';
  const isUserAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || user?.isAdmin === true;

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isUserAdmin) {
    console.warn('[AdminRoute] Acceso Denegado:', {
      email: user?.email,
      required: ADMIN_EMAIL,
      isAdminMetadata: user?.isAdmin
    });

    toast.error('Acceso denegado', {
      description: 'No tienes permisos de administrador.'
    });
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { user, isAuthenticated, login, loginWithGoogle, isLoading, logout, updateUser } = useAuth();
  const themeProps = useTheme();
  const navigate = useNavigate();

  const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

  if (isMaintenanceMode) {
    return (
      <>
        <MaintenancePage />
        <Toaster />
      </>
    );
  }

  const handleSelectPlan = async (plan: PlanType): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      console.error('[handleSelectPlan] No user authenticated');
      navigate('/login', { replace: true });
      return false;
    }

    console.log('[handleSelectPlan] Updating plan to:', plan);

    try {
      const { error } = await supabase
        .from('businesses')
        .update({ plan })
        .eq('owner_id', user.id);

      if (error) {
        console.error('Error updating plan:', error);
        toast.error('Error al guardar el plan');
        return false;
      }

      toast.success('¡Plan seleccionado correctamente!');
      updateUser({ plan, requiresPlanSelection: false });

      // Limpiar el flag de la base de datos — awaited para que el token se refresque
      // antes de navegar, evitando que TOKEN_REFRESHED restaure requiresPlanSelection: true
      await supabase.auth.updateUser({
        data: { requires_plan_selection: null }
      });

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);

      return true;
    } catch (err) {
      console.error('Exception updating plan:', err);
      toast.error('Error de conexión');
      return false;
    }
  };

  console.log('[App] State:', { isLoading, isAuthenticated, hasUser: !!user });

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Páginas Legales */}
          <Route path="/terminos-y-condiciones" element={<TermsPage themeProps={themeProps} />} />

          {/* 🌍 Pública - siempre accesible */}
          <Route path="/feedback/:businessId" element={<FeedbackRoute />} />

          {/* 📝 Blog — público */}
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />

          {/* 🔓 Rutas públicas */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage onLogin={login} onGoogleLogin={loginWithGoogle} themeProps={themeProps} />
              </PublicRoute>
            }
          />

          <Route
            path="/verify-email"
            element={<VerifyEmailPage themeProps={themeProps} />}
          />

          <Route
            path="/email-verified"
            element={<EmailVerifiedPage themeProps={themeProps} />}
          />

          <Route
            path="/reset-password"
            element={
              <ResetPasswordPage themeProps={themeProps} />
            }
          />

          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage
                  onGoogleLogin={loginWithGoogle}
                  themeProps={themeProps}
                />
              </PublicRoute>
            }
          />

          <Route
            path="/plans"
            element={
              <PlansRoute>
                <PlansPage
                  onSelectPlan={handleSelectPlan}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  themeProps={themeProps}
                />
              </PlansRoute>
            }
          />

          {/* 🔐 Ruta privada - DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                {user ? (
                  <DashboardPage
                    user={user}
                    onLogout={logout}
                    themeProps={themeProps}
                  />
                ) : (
                  <LoadingScreen />
                )}
              </PrivateRoute>
            }
          />

          {/* 🛡️ Ruta de ADMIN - Solo para administradores */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage themeProps={themeProps} />
              </AdminRoute>
            }
          />

          {/* 📋 Ruta Onboarding para Google Users */}
          <Route
            path="/onboarding"
            element={
              !isLoading && isAuthenticated && user ? (
                user.businessName === 'Configurando Negocio...' ? (
                  <OnboardingPage user={user} themeProps={themeProps} />
                ) : user.requiresPlanSelection ? (
                  <Navigate to="/plans" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              ) : (
                <LoadingScreen />
              )
            }
          />

          {/* 🏠 Ruta raíz — renderiza landing inmediatamente, redirige si ya está autenticado */}
          <Route
            path="/"
            element={
              !isLoading && isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LandingPage />
              )
            }
          />

          {/* ⚠️ Fallback - 404 o redirigir */}
          <Route
            path="*"
            element={
              isLoading ? (
                <LoadingScreen />
              ) : isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <NotFoundPage />
              )
            }
          />
        </Routes>
      </Suspense>

      <Toaster />
    </>
  );
}