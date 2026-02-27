import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeedbackFlowLogo } from '@/components/landing/logo';
import { AlertTriangle, Crown, LogOut, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { useTheme } from '@/hooks/useTheme';
import type { User } from '@/types';

interface DashboardHeaderProps {
    user: User;
    isLimitReached: boolean;
    isNearLimit: boolean;
    remaining: number;
    percentage: number;
    limits: any;
    isPro: boolean;
    onLogout: () => void;
    setShowSettings: (show: boolean) => void;
    setSettingsTab: (tab: string) => void;
    themeProps: {
        theme: ReturnType<typeof useTheme>['theme'];
        setTheme: ReturnType<typeof useTheme>['setTheme'];
    };
    getPlanBadge: () => React.ReactNode;
}

export function DashboardHeader({
    user,
    isLimitReached,
    isNearLimit,
    remaining,
    percentage,
    limits,
    isPro,
    onLogout,
    setShowSettings,
    setSettingsTab,
    themeProps,
    getPlanBadge
}: DashboardHeaderProps) {
    return (
        <>
            {/* Banner de límite alcanzado o cercano */}
            {(isLimitReached || isNearLimit) && (
                <motion.div
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    className={`sticky top-0 z-50 ${isLimitReached ? 'bg-red-600' : 'bg-amber-500'} text-white px-4 py-3 shadow-lg`}
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5" />
                            <div>
                                <p className="font-semibold text-sm">
                                    {isLimitReached
                                        ? `Has alcanzado el límite de ${limits.maxCommentsPerMonth} comentarios mensuales`
                                        : `Estás cerca del límite: ${remaining} comentarios restantes este mes`}
                                </p>
                                <p className="text-xs text-white/90">
                                    {isLimitReached
                                        ? `Los comentarios eliminados siguen contando para el límite mensual`
                                        : `Dejarás de recibir comentarios de usuarios pronto`}
                                </p>
                            </div>
                        </div>
                        {user.plan !== 'pro' && (
                            <Button
                                size="sm"
                                className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
                                onClick={() => {
                                    setShowSettings(true);
                                    setSettingsTab('plan');
                                }}
                            >
                                <Crown className="w-4 h-4 mr-2" />
                                Actualizar a Pro
                            </Button>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40"
            >
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
                        {/* Logo y nombre - más compacto en móvil */}
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FeedbackFlowLogo className="w-4 h-4 sm:w-5 sm:h-5" color="#ffffff" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">FeedbackFlow</h1>
                                    {/* Badge solo en desktop o muy pequeño en móvil */}
                                    <div className="hidden sm:block">
                                        {getPlanBadge()}
                                    </div>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-[200px]">
                                    {user.businessName}
                                </p>
                            </div>
                        </div>

                        {/* Acciones derecha - más compactas en móvil */}
                        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                            {/* Badge en móvil (solo el plan sin texto "Plan") */}
                            <div className="sm:hidden">
                                <Badge className={`text-[10px] px-1.5 py-0.5 ${user.plan === 'free' ? 'bg-gray-100 text-gray-700' :
                                    user.plan === 'basic' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                    {user.plan === 'free' ? 'Gratis' : user.plan === 'basic' ? 'Básico' : 'Pro'}
                                </Badge>
                            </div>

                            {/* Indicador de uso - solo en desktop */}
                            {!isPro && (
                                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <div className="w-16 xl:w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                        {remaining}
                                    </span>
                                </div>
                            )}

                            {/* Email - solo en desktop grande */}
                            <span className="text-sm text-gray-600 dark:text-gray-300 hidden xl:inline truncate max-w-[150px]">
                                {user.email}
                            </span>

                            <ThemeToggle theme={themeProps.theme} setTheme={themeProps.setTheme} />

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowSettings(true)}
                                className="dark:border-gray-600 dark:text-gray-300 h-8 w-8 sm:h-9 sm:w-9"
                                title="Ajustes"
                            >
                                <Settings className="w-4 h-4" />
                            </Button>

                            <Button
                                variant="outline"
                                onClick={onLogout}
                                className="gap-2 dark:border-gray-600 dark:text-gray-300 h-8 sm:h-9 px-2 sm:px-4"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline text-sm">Cerrar sesión</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.header>
        </>
    );
}
