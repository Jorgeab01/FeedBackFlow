import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FeedbackFlowLogo } from '@/components/landing/logo';
import { toast } from 'sonner';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import {
    LogOut,
    Users,
    DollarSign,
    CreditCard,
    Brain,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Shield,
    Crown,
    Zap,
    User,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    BarChart3,
    PieChart as PieChartIcon,
    LineChart as LineChartIcon
} from 'lucide-react';
import type { useTheme } from '@/hooks/useTheme';

interface AdminPageProps {
    themeProps: {
        theme: ReturnType<typeof useTheme>['theme'];
        setTheme: ReturnType<typeof useTheme>['setTheme'];
    };
}

// Colores para las gráficas
const COLORS = {
    free: '#9ca3af',
    basic: '#3b82f6',
    pro: '#f59e0b',
    revenue: '#10b981',
    openai: '#8b5cf6',
    primary: '#6366f1'
};

const PIE_COLORS = [COLORS.free, COLORS.basic, COLORS.pro];

// Componente de Loading
function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">Cargando panel de admin...</p>
            </div>
        </div>
    );
}

// Componente de Acceso Denegado
function AccessDenied() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-8 max-w-md"
            >
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Acceso Denegado
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    No tienes permisos para acceder al panel de administración.
                    Esta área está reservada solo para administradores.
                </p>
                <Button
                    onClick={() => navigate('/dashboard')}
                    className="bg-indigo-600 hover:bg-indigo-700"
                >
                    Volver al Dashboard
                </Button>
            </motion.div>
        </div>
    );
}

// Tarjeta de estadística
function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendUp,
    color
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    trend?: string;
    trendUp?: boolean;
    color: string;
}) {
    return (
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/50 hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
                        )}
                        {trend && (
                            <div className={`flex items-center gap-1 mt-2 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                                {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                <span className="text-sm font-medium">{trend}</span>
                            </div>
                        )}
                    </div>
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                    >
                        <Icon className="w-6 h-6" style={{ color }} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function AdminPage({ themeProps }: AdminPageProps) {
    const { isAdmin, isLoading, stats, isLoadingStats, loadStats } = useAdmin();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    // Redirigir si no es admin
    useEffect(() => {
        if (!isLoading && !isAdmin) {
            toast.error('Acceso denegado', {
                description: 'No tienes permisos de administrador'
            });
        }
    }, [isLoading, isAdmin]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isAdmin) {
        return <AccessDenied />;
    }

    // Datos para gráfica de planes
    const planData = stats ? [
        { name: 'Gratis', value: stats.usersByPlan.free, color: COLORS.free },
        { name: 'Básico', value: stats.usersByPlan.basic, color: COLORS.basic },
        { name: 'Pro', value: stats.usersByPlan.pro, color: COLORS.pro }
    ] : [];

    // Calcular porcentajes
    const totalPaidUsers = (stats?.usersByPlan.basic || 0) + (stats?.usersByPlan.pro || 0);
    const conversionRate = stats?.totalUsers
        ? ((totalPaidUsers / stats.totalUsers) * 100).toFixed(1)
        : '0';

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo y título */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                                <FeedbackFlowLogo className="w-5 h-5" color="#ffffff" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">FeedbackFlow</h1>
                                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                        <Shield className="w-3 h-3 mr-1" />
                                        Admin
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Panel de Administración</p>
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadStats}
                                disabled={isLoadingStats}
                                className="gap-2 dark:border-gray-600 dark:text-gray-300"
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Actualizar</span>
                            </Button>

                            <ThemeToggle theme={themeProps.theme} setTheme={themeProps.setTheme} />

                            <Button
                                variant="outline"
                                onClick={() => navigate('/dashboard')}
                                className="gap-2 dark:border-gray-600 dark:text-gray-300"
                            >
                                <User className="w-4 h-4" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </Button>

                            <Button
                                variant="outline"
                                onClick={logout}
                                className="gap-2 dark:border-gray-600 dark:text-gray-300"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Cerrar sesión</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                >
                    <StatCard
                        title="Total Usuarios"
                        value={stats?.totalUsers || 0}
                        subtitle={`${totalPaidUsers} usuarios de pago`}
                        icon={Users}
                        trend={`${conversionRate}% conversión`}
                        trendUp={true}
                        color={COLORS.primary}
                    />

                    <StatCard
                        title="Ingresos Totales"
                        value={`€${(stats?.totalRevenue || 0).toLocaleString()}`}
                        subtitle="Desde el inicio"
                        icon={DollarSign}
                        color={COLORS.revenue}
                    />

                    <StatCard
                        title="Usuarios Pro"
                        value={stats?.usersByPlan.pro || 0}
                        subtitle="Plan más popular"
                        icon={Crown}
                        color={COLORS.pro}
                    />

                    <StatCard
                        title="Uso OpenAI"
                        value={stats?.openAIUsage.totalRequests || 0}
                        subtitle={`${stats?.openAIUsage.totalTokens.toLocaleString() || 0} tokens`}
                        icon={Brain}
                        color={COLORS.openai}
                    />
                </motion.div>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-1">
                            <TabsTrigger value="overview" className="gap-2">
                                <Activity className="w-4 h-4" />
                                <span className="hidden sm:inline">Resumen</span>
                            </TabsTrigger>
                            <TabsTrigger value="revenue" className="gap-2">
                                <BarChart3 className="w-4 h-4" />
                                <span className="hidden sm:inline">Ingresos</span>
                            </TabsTrigger>
                            <TabsTrigger value="users" className="gap-2">
                                <PieChartIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Usuarios</span>
                            </TabsTrigger>
                            <TabsTrigger value="openai" className="gap-2">
                                <Brain className="w-4 h-4" />
                                <span className="hidden sm:inline">OpenAI</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab: Overview */}
                        <TabsContent value="overview" className="space-y-6">
                            {/* Gráfica de Ingresos */}
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-green-600" />
                                                Ingresos Mensuales
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Evolución de ingresos por suscripciones
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="dark:border-gray-600">
                                            Stripe
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={stats.monthlyRevenue}>
                                                    <defs>
                                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={COLORS.revenue} stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor={COLORS.revenue} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                                    <XAxis
                                                        dataKey="month"
                                                        stroke="#6b7280"
                                                        fontSize={12}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        stroke="#6b7280"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        tickFormatter={(value) => `€${value}`}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            color: '#fff'
                                                        }}
                                                        formatter={(value: number) => [`€${value.toLocaleString()}`, 'Ingresos']}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="amount"
                                                        stroke={COLORS.revenue}
                                                        strokeWidth={2}
                                                        fill="url(#revenueGradient)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400">
                                                <div className="text-center">
                                                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                    <p>No hay datos de ingresos disponibles</p>
                                                    <p className="text-sm">Los datos aparecerán cuando haya suscripciones activas</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Dos gráficas en fila */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Distribución de Planes */}
                                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                                    <CardHeader className="pb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <PieChartIcon className="w-5 h-5 text-indigo-600" />
                                            Distribución de Planes
                                        </h3>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64">
                                            {stats && stats.totalUsers > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={planData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            {planData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                color: '#fff'
                                                            }}
                                                            formatter={(value: number, name: string) => [value, name]}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-gray-400">
                                                    Sin datos disponibles
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-center gap-4 mt-4">
                                            {planData.map((plan) => (
                                                <div key={plan.name} className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: plan.color }}
                                                    />
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        {plan.name}: {plan.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Uso de OpenAI */}
                                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                                    <CardHeader className="pb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Brain className="w-5 h-5 text-purple-600" />
                                            Uso de OpenAI
                                        </h3>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64">
                                            {stats?.openAIUsage.monthlyUsage && stats.openAIUsage.monthlyUsage.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={stats.openAIUsage.monthlyUsage}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                                        <XAxis
                                                            dataKey="month"
                                                            stroke="#6b7280"
                                                            fontSize={12}
                                                            tickLine={false}
                                                        />
                                                        <YAxis
                                                            stroke="#6b7280"
                                                            fontSize={12}
                                                            tickLine={false}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                color: '#fff'
                                                            }}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="requests"
                                                            stroke={COLORS.openai}
                                                            strokeWidth={2}
                                                            dot={{ fill: COLORS.openai }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-gray-400">
                                                    <div className="text-center">
                                                        <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                        <p>No hay datos de uso de OpenAI</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Tab: Revenue */}
                        <TabsContent value="revenue" className="space-y-6">
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Análisis de Ingresos
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Ingresos detallados por mes y suscripciones
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-green-600">
                                                €{(stats?.totalRevenue || 0).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-500">Ingresos totales</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-96">
                                        {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats.monthlyRevenue}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                                    <XAxis
                                                        dataKey="month"
                                                        stroke="#6b7280"
                                                        fontSize={12}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        stroke="#6b7280"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        tickFormatter={(value) => `€${value}`}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            color: '#fff'
                                                        }}
                                                        formatter={(value: number, name: string) => {
                                                            if (name === 'amount') return [`€${value.toLocaleString()}`, 'Ingresos'];
                                                            return [value, name];
                                                        }}
                                                    />
                                                    <Bar dataKey="amount" fill={COLORS.revenue} radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400">
                                                <div className="text-center">
                                                    <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                                    <p className="text-lg">No hay datos de ingresos</p>
                                                    <p className="text-sm">Los ingresos aparecerán cuando los usuarios se suscriban</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab: Users */}
                        <TabsContent value="users" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Tarjetas de resumen */}
                                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                                                <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Plan Gratis</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {stats?.usersByPlan.free || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Plan Básico</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {stats?.usersByPlan.basic || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                                                <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Plan Pro</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {stats?.usersByPlan.pro || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Gráfica de usuarios */}
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                                <CardHeader>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Distribución Visual de Usuarios
                                    </h3>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        {stats && stats.totalUsers > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={planData} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                                                    <YAxis
                                                        dataKey="name"
                                                        type="category"
                                                        stroke="#6b7280"
                                                        fontSize={12}
                                                        width={80}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            color: '#fff'
                                                        }}
                                                    />
                                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                        {planData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400">
                                                No hay usuarios registrados
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab: OpenAI */}
                        <TabsContent value="openai" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <StatCard
                                    title="Total de Peticiones"
                                    value={stats?.openAIUsage.totalRequests || 0}
                                    icon={Brain}
                                    color={COLORS.openai}
                                />
                                <StatCard
                                    title="Total de Tokens"
                                    value={stats?.openAIUsage.totalTokens.toLocaleString() || 0}
                                    icon={Activity}
                                    color={COLORS.primary}
                                />
                            </div>

                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                                <CardHeader>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Uso Mensual de OpenAI
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Peticiones y tokens consumidos por mes
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-96">
                                        {stats?.openAIUsage.monthlyUsage && stats.openAIUsage.monthlyUsage.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={stats.openAIUsage.monthlyUsage}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                                    <XAxis
                                                        dataKey="month"
                                                        stroke="#6b7280"
                                                        fontSize={12}
                                                        tickLine={false}
                                                    />
                                                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            color: '#fff'
                                                        }}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="requests"
                                                        stroke={COLORS.openai}
                                                        strokeWidth={2}
                                                        name="Peticiones"
                                                        dot={{ fill: COLORS.openai }}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="tokens"
                                                        stroke={COLORS.primary}
                                                        strokeWidth={2}
                                                        name="Tokens"
                                                        dot={{ fill: COLORS.primary }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400">
                                                <div className="text-center">
                                                    <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                                    <p className="text-lg">No hay datos de uso de OpenAI</p>
                                                    <p className="text-sm">Los datos aparecerán cuando se usen las funciones de IA</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </motion.div>

                {/* Footer info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700"
                >
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>Panel de Administración Seguro</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Última actualización: {new Date().toLocaleString('es-ES')}</span>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}