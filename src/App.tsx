import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';

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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// 🔓 NUEVO: Guard para rutas públicas
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { user, isAuthenticated, isLoading, login, logout, register } = useAuth();
  const themeProps = useTheme();
  const navigate = useNavigate();

  // Flujo de registro
  const [registrationData, setRegistrationData] = useState<{
    businessName: string;
    email: string;
    password: string;
  } | null>(null);

  const handleSelectPlan = async (plan: PlanType) => {
    if (!registrationData) return;

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
    navigate('/dashboard', { replace: true });
  };

  // Loader global
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando…
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* 🌍 Pública - siempre accesible */}
        <Route path="/feedback/:businessId" element={<FeedbackRoute />} />

        {/* 🔓 Rutas públicas protegidas */}
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

        {/* 🔐 Rutas privadas */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage
                user={user!}
                onLogout={logout}
                themeProps={themeProps}
              />
            </PrivateRoute>
          }
        />

        <Route
          path="/plans"
          element={
            <PrivateRoute>
              <PlansPage
                onSelectPlan={handleSelectPlan}
                isAuthenticated={true}
                user={user!}
                themeProps={themeProps}
              />
            </PrivateRoute>
          }
        />

        {/* Fallback según estado */}
        <Route 
          path="*" 
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          } 
        />
      </Routes>

      <Toaster />
    </>
  );
}
