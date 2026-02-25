import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, ArrowLeft, Sparkles, Zap, Crown, Star } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';
import type { PlanType, User } from '@/types';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom';

interface PlansPageProps {
  onSelectPlan: (plan: PlanType) => Promise<boolean | void> | void;
  isAuthenticated: boolean;
  user: User | null;
  themeProps: {
    theme: ReturnType<typeof useTheme>['theme'];
    setTheme: ReturnType<typeof useTheme>['setTheme'];
  };
}

export function PlansPage({ onSelectPlan, isAuthenticated, user, themeProps }: PlansPageProps) {
  const [isYearly, setIsYearly] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const navigate = useNavigate();

  // Si está autenticado, mostrar el nombre del negocio actual
  useEffect(() => {
    if (isAuthenticated && user) {
      setBusinessName(user.businessName)
    }
  }, [isAuthenticated, user])

  // Elegir plan
  const handleSelectPlan = async (plan: PlanType) => {
    setIsLoading(true);

    try {
      // 1. Si elige "free"
      if (plan === 'free') {
        if (isAuthenticated) {
          // Si ya tiene el plan gratis (ej. Onboarding de Google) o acaba de registrarse por email
          if (user?.plan === 'free') {
            if (user?.requiresPlanSelection) {
              // Si requiere selección de plan (ej: recién registrado por email), usar el flujo normal
              await onSelectPlan(plan);
            } else {
              // Si ya lo tiene y no requiere selección, navegar directo
              navigate('/dashboard', { replace: true });
            }
            setIsLoading(false);
            return;
          }

          // Si no tiene plan aún (seguridad extra) o es 'none' (mock temporal de useAuth), asignar plan gratis directamente
          if (!user?.plan || (user.plan as string) === 'none') {
            await onSelectPlan(plan);
            setIsLoading(false);
            return;
          }

          // Si ya está autenticado y estaba en otro plan, redirigir al portal para cancelar
          let { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            const { data: refreshed } = await supabase.auth.refreshSession();
            session = refreshed.session;
          }
          if (!session) {
            toast.error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
            setIsLoading(false);
            return;
          }
          const { data, error } = await supabase.functions.invoke('create-portal', {
            body: { returnUrl: window.location.origin + '/dashboard' },
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          if (error || !data?.url) {
            toast.error('Para bajar al plan Free, usa "Gestionar Suscripción" en el Dashboard.');
          } else {
            window.location.href = data.url;
          }
        } else {
          // Registro nuevo con plan gratis
          await onSelectPlan(plan);
        }
        setIsLoading(false);
        return;
      }

      // 2. Si elige "basic" o "pro"
      let priceId = '';
      if (plan === 'basic') {
        priceId = isYearly ? import.meta.env.VITE_STRIPE_BASIC_YEARLY_PRICE_ID : import.meta.env.VITE_STRIPE_BASIC_MONTHLY_PRICE_ID;
      } else if (plan === 'pro') {
        priceId = isYearly ? import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID : import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID;
      }

      // Si no está autenticado (registro nuevo), registramos el usuario primero
      if (!isAuthenticated) {
        const success = await onSelectPlan(plan);
        if (success === false) {
          setIsLoading(false);
          return;
        }
      }

      // 3. Generar sesión de pago y redirigir
      const frontendUrl = window.location.origin;
      let { data: { session } } = await supabase.auth.getSession();

      // Si no hay sesión (puede ocurrir justo tras el registro), intentar refrescar
      if (!session) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        session = refreshed.session;
      }

      if (!session) {
        toast.error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId,
          successUrl: `${frontendUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${frontendUrl}/plans`
        },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) {
        console.error(error);
        toast.error('Error al contactar con el sistema de pagos');
        setIsLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Error al generar el pago');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error seleccionando plan:', err);
      toast.error('Error al generar el proceso de pago');
      setIsLoading(false);
    }
  };

  // Precios
  const prices = {
    basic: {
      monthly: 5.99,
      yearly: 4.79
    },
    pro: {
      monthly: 9.99,
      yearly: 7.99
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-8 px-4">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle theme={themeProps.theme} setTheme={themeProps.setTheme} />
      </div>

      {/* Back Button */}
      {!user?.requiresPlanSelection && (
        <Button
          variant="ghost"
          onClick={() => isAuthenticated ? navigate('/dashboard') : navigate('/register')}
          className="fixed top-4 left-4 gap-2 text-gray-600 dark:text-gray-300 z-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      )}

      <div className="max-w-6xl mx-auto pt-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Badge className="mb-4 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
            {isAuthenticated ? 'Cambiar plan' : 'Paso 2 de 2'}
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Elige tu plan
          </h1>
          {businessName && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {isAuthenticated ? 'Negocio:' : 'Registrando:'}{" "}
              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                {businessName}
              </span>
            </p>
          )}
        </motion.div>

        {/* Toggle Mensual/Anual */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-10"
        >
          <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            Mensual
          </span>
          <div className="flex items-center gap-2">
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-indigo-600"
            />
            <span className={`text-sm font-medium ${isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Anual
            </span>
          </div>
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
            Ahorra 20%
          </Badge>
        </motion.div>

        {/* Tres columnas: Free | Basic | Pro */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">

          {/* FREE - GRATIS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full"
          >
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm h-full flex flex-col">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Gratis</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Para probar</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">0€</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">/mes</span>
                </div>

                <div className="h-6 mb-4 flex items-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Para siempre. Sin tarjeta.
                  </p>
                </div>

                <ul className="space-y-3 mb-6 text-gray-600 dark:text-gray-300 flex-grow text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>QR básico</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>30 comentarios / mes</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 dark:text-gray-500">
                    <span className="w-4 h-4 flex items-center justify-center text-xs">×</span>
                    <span>Sin exportar datos</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 dark:text-gray-500">
                    <span className="w-4 h-4 flex items-center justify-center text-xs">×</span>
                    <span>Sin estadísticas avanzadas</span>
                  </li>
                  <li className="flex items-start gap-2 text-transparent select-none">
                    <span className="w-4 h-4 flex items-center justify-center text-xs">•</span>
                    <span>Placeholder</span>
                  </li>
                </ul>

                <Button
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 h-10 mt-auto"
                  onClick={() => handleSelectPlan('free')}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Empezar gratis'
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* BASIC - $5.99 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="h-full"
          >
            <Card className="border-2 border-indigo-200 dark:border-indigo-800 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm h-full flex flex-col relative">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Básico</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Para negocios pequeños</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {isYearly ? prices.basic.yearly : prices.basic.monthly}€
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">/mes</span>
                </div>

                <div className="h-6 mb-2 flex items-center">
                  {isYearly ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(prices.basic.yearly * 12).toFixed(0)}€ / año
                    </p>
                  ) : (
                    <span className="text-xs text-transparent select-none">Mensual</span>
                  )}
                </div>

                <ul className="space-y-3 mb-6 text-gray-600 dark:text-gray-300 flex-grow text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>QR personalizado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>200 comentarios / mes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Exportar CSV</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 dark:text-gray-500">
                    <span className="w-4 h-4 flex items-center justify-center text-xs">×</span>
                    <span>Sin estadísticas avanzadas</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 dark:text-gray-500">
                    <span className="w-4 h-4 flex items-center justify-center text-xs">×</span>
                    <span>Sin exportar PDF</span>
                  </li>
                </ul>

                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-10 mt-auto"
                  onClick={() => handleSelectPlan('basic')}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Elegir Básico'
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* PRO - $9.99 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="h-full"
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-b from-indigo-600 to-purple-700 text-white h-full flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-400 text-indigo-900 text-center py-1.5 text-xs font-bold">
                RECOMENDADO
              </div>

              <CardContent className="p-6 pt-12 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Crown className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Pro</h3>
                    <p className="text-xs text-indigo-200">Análisis completo</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold">
                    {isYearly ? prices.pro.yearly : prices.pro.monthly}€
                  </span>
                  <span className="text-indigo-200 text-sm">/mes</span>
                </div>

                <div className="h-6 mb-2 flex items-center">
                  {isYearly ? (
                    <p className="text-xs text-indigo-200">
                      {(prices.pro.yearly * 12).toFixed(0)}€ / año
                    </p>
                  ) : (
                    <span className="text-xs text-transparent select-none">Mensual</span>
                  )}
                </div>

                <ul className="space-y-3 mb-6 text-indigo-100 flex-grow text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                    <span>Todo lo del Básico</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                    <span>Comentarios ilimitados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                    <span>Estadísticas avanzadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                    <span>Exportar Excel/PDF</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                    <span>Soporte prioritario</span>
                  </li>
                </ul>

                <Button
                  className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-yellow-950 font-bold h-10 mt-auto shadow-lg hover:shadow-xl transition-all border-0"
                  onClick={() => handleSelectPlan('pro')}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-yellow-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Elegir Pro'
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Frase de cierre */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 mb-8 text-center"
        >
          <p className="text-lg text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-2xl">🍔</span>
            <span>
              Por menos de lo que cuesta un <strong className="text-gray-900 dark:text-white">menú del día</strong>, descubre qué piensan realmente tus clientes
            </span>
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Cancela cuando quieras. Sin permanencia.
          </p>
        </motion.div>

        {/* Características adicionales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Empieza gratis</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">El plan Free es gratis para siempre</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Mejora cuando quieras</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sube de plan según crezca tu negocio</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Sin compromiso</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cancela cuando quieras</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}