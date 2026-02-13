import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

import { LoginPage } from '@/sections/LoginPage';
import { RegisterPage } from '@/sections/RegisterPage';
import { PlansPage } from '@/sections/PlansPage';
import { DashboardPage } from '@/sections/DashboardPage';
import { FeedbackPage } from '@/sections/FeedbackPage';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Toaster } from '@/components/ui/sonner';
import type { PlanType } from '@/types';
import { toast } from 'sonner';

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
    console.log('[PrivateRoute] ✅ Content already shown, keeping it visible');
    return <>{children}</>;
  }

  // 1️⃣ Mostrar loader solo en carga inicial
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

// 🎫 Ruta de planes (accesible con o sin auth)
function PlansRoute({ 
  children, 
  hasRegistrationData 
}: { 
  children: React.ReactNode;
  hasRegistrationData: boolean;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Permitir si está autenticado O si tiene datos de registro
  if (isAuthenticated || hasRegistrationData) {
    return <>{children}</>;
  }

  // ❌ Sin autenticación ni datos de registro -> volver a register
  console.log('[PlansRoute] No auth and no registration data, redirecting to register');
  return <Navigate to="/register" replace />;
}

export default function App() {
  const { user, isAuthenticated, login, isLoading, logout, register } = useAuth();
  const themeProps = useTheme();
  const navigate = useNavigate();

  // Flujo de registro
  const [registrationData, setRegistrationData] = useState<{
    businessName: string;
    email: string;
    password: string;
  } | null>(null);

  const handleSelectPlan = async (plan: PlanType) => {
    if (!registrationData) {
      console.error('[handleSelectPlan] No registration data');
      return;
    }

    console.log('[handleSelectPlan] Registering with plan:', plan);

    const ok = await register(
      registrationData.businessName,
      registrationData.email,
      registrationData.password,
      plan
    );

    if (!ok) {
      toast.error('No se pudo crear la cuenta');
      navigate('/register', { replace: true });
      return;
    }

    setRegistrationData(null);
    
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 200);
  };

  console.log('[App] State:', { isLoading, isAuthenticated, hasUser: !!user });

  return (
    <>
      <Routes>
        {/* 🌍 Pública - siempre accesible */}
        <Route path="/feedback/:businessId" element={<FeedbackRoute />} />

        {/* 🔓 Rutas públicas */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage onLogin={login} themeProps={themeProps} />
            </PublicRoute>
          }
        />
        
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage 
                onSetRegistrationData={setRegistrationData} 
                themeProps={themeProps} 
              />
            </PublicRoute>
          }
        />
        
        <Route
          path="/plans"
          element={
            <PlansRoute hasRegistrationData={!!registrationData}>
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

        {/* 🏠 Ruta raíz */}
        <Route 
          path="/" 
          element={
            isLoading ? (
              <LoadingScreen />
            ) : (
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
            )
          } 
        />

        {/* ⚠️ Fallback - cualquier otra ruta */}
        <Route 
          path="*" 
          element={
            isLoading ? (
              <LoadingScreen />
            ) : (
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
            )
          } 
        />
      </Routes>

      <Toaster />
    </>
  );
}