import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

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

// 🔐 Wrapper para rutas privadas
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}

// 🌍 Feedback público
function FeedbackRoute() {
  const { businessId } = useParams();
  return <FeedbackPage businessId={businessId!} />;
}

export default function App() {
  const { user, isAuthenticated, isLoading, login, logout, register } = useAuth();
  const themeProps = useTheme();
  const navigate = useNavigate();

  // 🔁 Redirección automática tras login
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Estado para flujo de registro
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
      navigate('/register');
      return;
    }

    setRegistrationData(null);
    navigate('/dashboard', { replace: true });
  };

  // 🔄 Loader global
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
        {/* 🌍 Pública */}
        <Route path="/feedback/:businessId" element={<FeedbackRoute />} />

        {/* 🔓 No autenticado */}
        {!isAuthenticated && (
          <>
            <Route
              path="/login"
              element={
                <LoginPage
                  onLogin={login}
                  onNavigate={navigate}
                  themeProps={themeProps}
                />
              }
            />
            <Route
              path="/register"
              element={
                <RegisterPage
                  onNavigate={navigate}
                  onSetRegistrationData={setRegistrationData}
                  themeProps={themeProps}
                />
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}

        {/* 🔐 Autenticado */}
        {isAuthenticated && user && (
          <>
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage
                    user={user}
                    onLogout={logout}
                    onNavigate={navigate}
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
                    onNavigate={navigate}
                    onSelectPlan={handleSelectPlan}
                    isAuthenticated={isAuthenticated}
                    user={user}
                    themeProps={themeProps}
                  />
                </PrivateRoute>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>

      <Toaster />
    </>
  );
}
