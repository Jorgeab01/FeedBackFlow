import { useState, useEffect } from 'react';
import { LoginPage } from '@/sections/LoginPage';
import { RegisterPage } from '@/sections/RegisterPage';
import { PlansPage } from '@/sections/PlansPage';
import { DashboardPage } from '@/sections/DashboardPage';
import { FeedbackPage } from '@/sections/FeedbackPage';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Toaster } from '@/components/ui/sonner';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PlanType } from '@/types';
import { toast } from 'sonner';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { user, isAuthenticated, isLoading, login, logout, register } = useAuth();
  const themeProps = useTheme();
  
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isLoading, isAuthenticated]);

  // Estado para el flujo de registro
  const [registrationData, setRegistrationData] = useState<{
    businessName: string;
    email: string;
    password: string;
  } | null>(null);

  // Sincronizar URL con estado
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const handleSelectPlan = async (plan: PlanType) => {
    if (!registrationData) return;

    try {
      await register(
        registrationData.businessName,
        registrationData.email,
        registrationData.password,
        plan
      );

      setRegistrationData(null);
      navigate('/dashboard');

    } catch (err: any) {
      if (err.message === 'EMAIL_EXISTS') {
        toast.error('Este correo ya está registrado', {
          description: 'Inicia sesión para continuar'
        });

        setRegistrationData(null);
        navigate('/login');
      } else {
        console.error(err);
        toast.error('No se pudo crear la cuenta');
      }
    }
  };



  // Placeholder mientras carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-50"
            />
            <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              FeedbackFlow
            </h2>
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <span className="text-sm font-medium">Cargando</span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                className="text-sm"
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                className="text-sm"
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                className="text-sm"
              >
                .
              </motion.span>
            </div>
          </div>

          <div className="w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            />
          </div>
        </div>
      </div>
    );
  }

  // Ruta de feedback para clientes (pública, no requiere auth)
  if (currentPath.startsWith('/feedback/')) {
    const businessId = currentPath.split('/')[2];
    return (
      <>
        <FeedbackPage businessId={businessId} />
        <Toaster />
      </>
    );
  }

  // Página de registro
  if (currentPath === '/register') {
    return (
      <>
        <RegisterPage
          onNavigate={navigate}
          onSetRegistrationData={setRegistrationData}
          themeProps={themeProps}
        />
        <Toaster />
      </>
    );
  }

  // Página de planes (requiere haber pasado por registro o estar autenticado)
  if (currentPath === '/plans') {
    // Si está autenticado, puede cambiar de plan
    // Si no está autenticado pero tiene registrationData, es flujo de registro
    if (!isAuthenticated && !registrationData) {
      navigate('/register');
      return null;
    }
    
    return (
      <>
        <PlansPage
          onNavigate={navigate}
          onSelectPlan={handleSelectPlan}
          isAuthenticated={isAuthenticated}
          user={user}
          themeProps={themeProps}
        />
        <Toaster />
      </>
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage 
          onLogin={login} 
          onNavigate={navigate}
          themeProps={themeProps}
        />
        <Toaster />
      </>
    );
  }

  if (!user) {
    return null;
  }

  // Usuario autenticado - mostrar dashboard
  return (
    <>
      <DashboardPage 
        user={user} 
        onLogout={logout}
        onNavigate={navigate}
        themeProps={themeProps}
      />
      <Toaster />
    </>
  );
}

export default App;
