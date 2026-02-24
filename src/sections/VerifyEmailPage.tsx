import { motion } from 'framer-motion';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/hooks/useTheme';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function VerifyEmailPage({ themeProps }: { themeProps: { theme: ReturnType<typeof useTheme>['theme']; setTheme: ReturnType<typeof useTheme>['setTheme'] } }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { resendVerification } = useAuth();

    const email = location.state?.email as string | undefined;
    const [countdown, setCountdown] = useState(60);
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    const handleResend = async () => {
        if (!email) return;
        setIsResending(true);
        const { success, error } = await resendVerification(email);
        setIsResending(false);

        if (success) {
            toast.success('Correo de verificación reenviado. Revisa tu bandeja de entrada.');
            setCountdown(60);
        } else {
            toast.error(error || 'Error al reenviar el correo. Inténtalo más tarde.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle theme={themeProps.theme} setTheme={themeProps.setTheme} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md text-center"
            >
                <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                    <CardHeader className="space-y-1 pb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center mb-6"
                        >
                            <Mail className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                        </motion.div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            ¡Revisa tu correo!
                        </CardTitle>
                        <CardDescription className="text-gray-500 dark:text-gray-400 text-lg mt-2">
                            Te hemos enviado un enlace mágico para confirmar tu cuenta y activar tu acceso.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-left border border-indigo-100 dark:border-indigo-800">
                            <p className="text-sm text-indigo-800 dark:text-indigo-300">
                                <strong>💡 Consejo:</strong> Si no ves el correo en unos minutos, revisa tu carpeta de Spam o Correo no deseado.
                            </p>
                        </div>

                        {email && (
                            <Button
                                onClick={handleResend}
                                disabled={countdown > 0 || isResending}
                                variant="outline"
                                className="w-full h-12 text-indigo-600 border-indigo-200 dark:text-indigo-400 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
                                {countdown > 0
                                    ? `Reenviar correo en ${countdown}s`
                                    : 'Reenviar correo de verificación'}
                            </Button>
                        )}

                        <Button
                            onClick={() => navigate('/login')}
                            className="w-full h-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium transition-all group"
                        >
                            Volver al Inicio de Sesión
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
