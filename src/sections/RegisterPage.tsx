import { useState } from 'react'
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
import type { useTheme } from '@/hooks/useTheme'
import { toast } from 'sonner'

interface RegisterPageProps {
  onNavigate: (path: string) => void;
  onSetRegistrationData: (data: { businessName: string; email: string; password: string }) => void;
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
}


export function RegisterPage({ onNavigate, onSetRegistrationData, themeProps }: RegisterPageProps) {
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Verificar si el email ya existe en la base de datos
  const checkEmailExists = async (email: string) => {
    const { data, error } = await supabase
      .from('businesses')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()
    
    if (error && error.code === 'PGRST116') {
      // No se encontró el email (es bueno, significa que no existe)
      return false
    }
    
    return !!data
  }

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
            onClick: () => onNavigate('/login')
          },
          cancel: {
            label: 'Cerrar',
            onClick: () => {}
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

      toast.success('¡Datos guardados!', {
        description: 'Ahora elige tu plan'
      })
      
      onNavigate('/plans')
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
        onClick={() => onNavigate('/login')}
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

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              ¿Ya tienes una cuenta?{' '}
              <button 
                onClick={() => onNavigate('/login')}
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