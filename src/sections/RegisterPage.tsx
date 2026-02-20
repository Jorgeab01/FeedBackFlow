import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Store,
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Mail,
  Lock,
  AlertCircle
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useTheme } from '@/hooks/useTheme'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom';

interface RegisterPageProps {
  onSetRegistrationData: (data: { businessName: string; email: string; password: string }) => void;
  onGoogleLogin: () => void;
  themeProps: {
    theme: ReturnType<typeof useTheme>['theme'];
    setTheme: ReturnType<typeof useTheme>['setTheme'];
  };
}

interface FormErrors {
  businessName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}


export function RegisterPage({ onSetRegistrationData, onGoogleLogin, themeProps }: RegisterPageProps) {
  const [businessName, setBusinessName] = useState(() => sessionStorage.getItem('reg_businessName') || '')
  const [email, setEmail] = useState(() => sessionStorage.getItem('reg_email') || '')
  const [password, setPassword] = useState(() => sessionStorage.getItem('reg_password') || '')
  const [confirmPassword, setConfirmPassword] = useState(() => sessionStorage.getItem('reg_confirmPassword') || '')
  const [acceptedTerms, setAcceptedTerms] = useState(() => sessionStorage.getItem('reg_acceptedTerms') === 'true')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const navigate = useNavigate();

  // Guardar estado en sessionStorage para no perderlo al navegar a Términos
  useEffect(() => {
    sessionStorage.setItem('reg_businessName', businessName);
    sessionStorage.setItem('reg_email', email);
    sessionStorage.setItem('reg_password', password);
    sessionStorage.setItem('reg_confirmPassword', confirmPassword);
    sessionStorage.setItem('reg_acceptedTerms', String(acceptedTerms));
  }, [businessName, email, password, confirmPassword, acceptedTerms]);

  // Limpiar sesión al finalizar el registro con éxito
  const clearSessionStorage = () => {
    sessionStorage.removeItem('reg_businessName');
    sessionStorage.removeItem('reg_email');
    sessionStorage.removeItem('reg_password');
    sessionStorage.removeItem('reg_confirmPassword');
    sessionStorage.removeItem('reg_acceptedTerms');
  };

  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!businessName.trim() || businessName.trim().length < 3) {
      newErrors.businessName = 'El nombre debe tener al menos 3 caracteres'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Introduce un correo válido'
    }

    if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (!acceptedTerms) {
      newErrors.terms = 'Debes aceptar los Términos y Condiciones'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Verificar si el email ya existe en la base de datos de forma segura
  const checkEmailExists = async (email: string) => {
    const { data, error } = await supabase
      .rpc('check_email_exists', { email_to_check: email.trim().toLowerCase() });

    if (error) {
      console.error('Error checking email:', error);
      return true; // Asumir que existe para ser conservadores
    }

    return !!data;
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Verificar si el email ya está registrado
      const emailExists = await checkEmailExists(email)

      if (emailExists) {
        toast.error('Este correo ya está registrado', {
          description: '¿Quieres iniciar sesión con esta cuenta?',
          duration: 6000,
          action: {
            label: 'Ir a Login',
            onClick: () => navigate('/login')
          },
          cancel: {
            label: 'Cerrar',
            onClick: () => { }
          }
        })
        setIsLoading(false)
        return
      }

      // Si no existe, continuar con el registro
      onSetRegistrationData({
        businessName: businessName.trim(),
        email: email.trim(),
        password
      })

      clearSessionStorage();

      toast.success('¡Datos guardados!', {
        description: 'Ahora elige tu plan'
      })

      navigate('/plans')

    } catch (error) {
      console.error('Error verificando email:', error)
      toast.error('Error al verificar el correo', {
        description: 'Intenta de nuevo en unos momentos'
      })
    } finally {
      setIsLoading(false)
    }
  }


  // Limpiar error al escribir
  const handleBusinessNameChange = (value: string) => {
    setBusinessName(value);
    if (errors.businessName && value.trim().length >= 3) {
      setErrors(prev => ({ ...prev, businessName: undefined }));
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password && value.length >= 6) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
    // Validar coincidencia en tiempo real si ya hay confirmPassword
    if (confirmPassword && value !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
    } else if (confirmPassword && value === confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.confirmPassword && password === value) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  // Clase condicional para inputs
  const getInputClass = (hasError: boolean) => `
    h-12 transition-all duration-200 dark:bg-gray-700 dark:text-white
    ${hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
      : 'border-gray-200 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
    }
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle theme={themeProps.theme} setTheme={themeProps.setTheme} />
      </div>

      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/login')}
        className="fixed top-4 left-4 gap-2 text-gray-600 dark:text-gray-300"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Button>

      {/* Badge de paso */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Badge className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-4 py-1">
          Paso 1 de 2
        </Badge>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4"
            >
              <Store className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Crear tu cuenta
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Registra tu negocio y empieza a recibir feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleContinue} className="space-y-5">
              {/* Nombre del local */}
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Nombre del local
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="Ej: Restaurante El Sabor"
                  value={businessName}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  className={getInputClass(!!errors.businessName)}
                  maxLength={30}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  {errors.businessName ? (
                    <span className="text-red-600 dark:text-red-400">{errors.businessName}</span>
                  ) : (
                    <span>Entre 3 y 30 caracteres</span>
                  )}
                  <span>{businessName.length}/30</span>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={getInputClass(!!errors.email)}
                  maxLength={100}
                />
                {errors.email && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mt-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={getInputClass(!!errors.password)}
                  maxLength={50}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  {errors.password ? (
                    <span className="text-red-600 dark:text-red-400">{errors.password}</span>
                  ) : (
                    <span>Entre 6 y 50 caracteres</span>
                  )}
                  <span>{password.length}/50</span>
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Confirmar contraseña
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  className={getInputClass(!!errors.confirmPassword)}
                  maxLength={50}
                />
                {errors.confirmPassword && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mt-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.confirmPassword}</span>
                  </div>
                )}
              </div>

              {/* Términos y condiciones */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => {
                      setAcceptedTerms(checked as boolean);
                      if (checked) {
                        setErrors(prev => ({ ...prev, terms: undefined }));
                      }
                    }}
                    className={`w-5 h-5 min-w-[1.25rem] border-2 bg-white dark:bg-gray-800 rounded flex items-center justify-center shrink-0 ${errors.terms ? "border-red-500" : "border-gray-300 dark:border-gray-500"} mt-0.5`}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm text-gray-700 dark:text-gray-300 leading-snug cursor-pointer select-none pt-0.5"
                    >
                      He leído y acepto los{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/terminos-y-condiciones');
                        }}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline focus:outline-none focus:underline"
                      >
                        Términos y Condiciones
                      </button>
                    </label>
                  </div>
                </div>
                {errors.terms && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mt-1 animate-in fade-in slide-in-from-top-1 ml-7">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.terms}</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-6"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between">
              <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/4"></span>
              <span className="text-xs text-center text-gray-500 uppercase dark:text-gray-400">o entra con</span>
              <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/4"></span>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                onClick={onGoogleLogin}
                className="w-full h-12 gap-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
            </div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              ¿Ya tienes una cuenta?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Inicia sesión
              </button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}