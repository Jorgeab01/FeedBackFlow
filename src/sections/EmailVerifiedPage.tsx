import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/hooks/useTheme';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useNavigate } from 'react-router-dom';

export function EmailVerifiedPage({ themeProps }: { themeProps: { theme: ReturnType<typeof useTheme>['theme']; setTheme: ReturnType<typeof useTheme>['setTheme'] } }) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle theme={themeProps.theme} setTheme={themeProps.setTheme} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md text-center"
            >
                <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-green-500" />

                    <CardHeader className="space-y-1 pb-8 pt-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="mx-auto w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-full flex items-center justify-center mb-6"
                        >
                            <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                        </motion.div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            ¡Correo Verificado!
                        </CardTitle>
                        <CardDescription className="text-gray-500 dark:text-gray-400 text-lg mt-2 px-4">
                            Proceso completado exitosamente. Tu cuenta ya está lista.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <Button
                            onClick={() => navigate('/dashboard')}
                            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 shadow-lg shadow-emerald-500/30 text-lg font-medium transition-all group rounded-xl"
                        >
                            Continuar a mi cuenta
                            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
