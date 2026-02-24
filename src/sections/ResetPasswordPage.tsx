import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

interface ResetPasswordPageProps {
    themeProps: {
        theme: ReturnType<typeof useTheme>['theme'];
        setTheme: ReturnType<typeof useTheme>['setTheme'];
    };
}

export function ResetPasswordPage({ themeProps }: ResetPasswordPageProps) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isValidSession, setIsValidSession] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        // Check if the user really arrived here with a valid recovery session
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error || !session) {
                    toast.error('Sesión inválida', {
                        description: 'El enlace de recuperación es inválido o ha expirado.'
                    });
                    navigate('/login', { replace: true });
                    return;
                }
                setIsValidSession(true);
            } catch (err) {
                toast.error('Error al verificar sesión');
                navigate('/login', { replace: true });
            } finally {
                setIsChecking(false);
            }
        };

        checkSession();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                toast.error('Error al actualizar', {
                    description: error.message
                });
                return;
            }

            toast.success('Contraseña actualizada', {
                description: 'Por favor, inicia sesión con tu nueva contraseña.'
            });

            // Usamos la función global logout para limpiar toda la caché y redirigir
            await logout();

        } catch (err: any) {
            toast.error('Error inesperado', {
                description: err.message || 'Ha ocurrido un error al actualizar la contraseña.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isChecking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isValidSession) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            {/* Theme Toggle */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle theme={themeProps.theme} setTheme={themeProps.setTheme} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-600" />

                    <CardHeader className="space-y-1 pb-6 pt-10 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center mb-4"
                        >
                            <ShieldCheck className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                        </motion.div>
                        <CardTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Nueva Contraseña
                        </CardTitle>
                        <CardDescription className="text-gray-500 dark:text-gray-400 mt-2 px-4">
                            Ingresa una nueva contraseña segura para tu cuenta.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-3">
                                <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">
                                    Nueva contraseña
                                </Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="pl-10 h-12 bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
                                    Confirmar contraseña
                                </Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="pl-10 h-12 bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Actualizar Contraseña
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
