import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { User } from '@/types';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingPageProps {
    user: User;
    themeProps: {
        theme: ReturnType<typeof useTheme>['theme'];
        setTheme: ReturnType<typeof useTheme>['setTheme'];
    };
}

export function OnboardingPage({ user, themeProps }: OnboardingPageProps) {
    const [businessName, setBusinessName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const navigate = useNavigate();
    const { updateUser } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (businessName.trim().length < 3) {
            setError('El nombre debe tener al menos 3 caracteres');
            return;
        }

        if (!termsAccepted) {
            toast.error('Debes aceptar los términos y condiciones para continuar');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Actualizar nombre del negocio en la DB
            const { error: updateError } = await supabase
                .from('businesses')
                .update({ name: businessName.trim() })
                .eq('owner_id', user.id);

            if (updateError) throw updateError;

            // 2. Marcar que el usuario necesita seleccionar plan
            // Esto garantiza que PrivateRoute lo redirija a /plans de forma fiable
            await supabase.auth.updateUser({
                data: { requires_plan_selection: true }
            });

            // 3. Actualizar estado local ANTES de navegar para evitar la condición de carrera
            // donde PrivateRoute detecta businessName='Configurando Negocio...' y redirige a /onboarding
            updateUser({ businessName: businessName.trim(), requiresPlanSelection: true });

            toast.success('¡Negocio creado!', {
                description: 'Elige tu plan para continuar...',
            });

            // 4. Navegar después de actualizar el estado
            navigate('/plans', { replace: true });

        } catch (err) {
            console.error('Error updating business:', err);
            toast.error('Error al guardar el negocio', {
                description: 'Inténtalo de nuevo en unos momentos.'
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            {/* Theme Toggle */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle theme={themeProps.theme} setTheme={themeProps.setTheme} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
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
                            <Building2 className="w-8 h-8 text-white" />
                        </motion.div>
                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                            ¡Bienvenido a FeedbackFlow!
                        </CardTitle>
                        <CardDescription className="text-gray-500 dark:text-gray-400">
                            Para empezar, dinos cómo se llama tu negocio
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="businessName" className="text-gray-700 dark:text-gray-200 font-medium">
                                    Nombre del local
                                </Label>
                                <Input
                                    id="businessName"
                                    type="text"
                                    placeholder="Ej: Restaurante El Sabor"
                                    value={businessName}
                                    onChange={(e) => {
                                        setBusinessName(e.target.value);
                                        if (error && e.target.value.trim().length >= 3) setError(null);
                                    }}
                                    className={`h-12 dark:bg-gray-700 dark:text-white transition-all ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-indigo-500'
                                        }`}
                                    maxLength={30}
                                />
                                {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
                            </div>

                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="terms"
                                    checked={termsAccepted}
                                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                                    className="mt-0.5 border-2 border-gray-400 dark:border-gray-500 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                />
                                <Label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 leading-snug cursor-pointer">
                                    He leído y acepto los{' '}
                                    <Link
                                        to="/terminos-y-condiciones"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300"
                                    >
                                        términos y condiciones
                                    </Link>
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || !termsAccepted}
                                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Elegir mi plan
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
