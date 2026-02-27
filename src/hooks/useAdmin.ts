import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Email del administrador - Cambia esto por tu email de admin
const ADMIN_EMAIL = 'jorgeab496@gmail.com';

export interface AdminStats {
    totalUsers: number;
    usersByPlan: {
        free: number;
        basic: number;
        pro: number;
    };
    totalRevenue: number;
    monthlyRevenue: Array<{
        month: string;
        amount: number;
        subscriptions: number;
    }>;
    openAIUsage: {
        totalRequests: number;
        totalTokens: number;
        monthlyUsage: Array<{
            month: string;
            requests: number;
            tokens: number;
        }>;
    };
    recentUsers: Array<{
        id: string;
        email: string;
        businessName: string;
        plan: string;
        createdAt: string;
    }>;
}

export function useAdmin() {
    const { user, isAuthenticated } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);

    // Verificar si el usuario es admin
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setIsAdmin(false);
            setIsLoading(false);
            return;
        }

        // Verificar por email
        const checkAdmin = async () => {
            try {
                // Primero verificar por email hardcodeado o metadatos
                if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || (user as any).isAdmin === true) {
                    setIsAdmin(true);
                    setIsLoading(false);
                    return;
                }

            } catch (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAdmin();
    }, [user, isAuthenticated]);

    // Cargar estadísticas de admin
    const loadStats = useCallback(async () => {
        if (!isAdmin) return;

        setIsLoadingStats(true);
        try {
            // 1. Obtener todos los usuarios/businesses
            const { data: businesses, error: businessesError } = await supabase
                .from('businesses')
                .select('id, name, plan, owner_id, created_at')
                .order('created_at', { ascending: false });

            if (businessesError) throw businessesError;

            // 2. Contar usuarios por plan
            const usersByPlan = {
                free: businesses?.filter(b => b.plan === 'free').length || 0,
                basic: businesses?.filter(b => b.plan === 'basic').length || 0,
                pro: businesses?.filter(b => b.plan === 'pro').length || 0,
            };

            // 3. Obtener datos de suscripciones de Stripe (si existe la tabla)
            let monthlyRevenue: AdminStats['monthlyRevenue'] = [];
            let totalRevenue = 0;

            try {
                const { data: subscriptions } = await supabase
                    .from('subscriptions')
                    .select('amount, created_at, status')
                    .eq('status', 'active')
                    .order('created_at', { ascending: true });

                if (subscriptions && subscriptions.length > 0) {
                    // Calcular ingresos totales
                    totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);

                    // Agrupar por mes
                    const revenueByMonth = new Map<string, { amount: number; subscriptions: number }>();

                    subscriptions.forEach(sub => {
                        const date = new Date(sub.created_at);
                        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        const monthLabel = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

                        const existing = revenueByMonth.get(monthKey) || { amount: 0, subscriptions: 0 };
                        revenueByMonth.set(monthKey, {
                            amount: existing.amount + (sub.amount || 0),
                            subscriptions: existing.subscriptions + 1
                        });
                    });

                    monthlyRevenue = Array.from(revenueByMonth.entries())
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([month, data]) => ({
                            month: new Date(month + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
                            amount: data.amount,
                            subscriptions: data.subscriptions
                        }));
                }
            } catch (e) {
                console.log('No subscriptions table or error fetching:', e);
            }

            // 4. Obtener uso de OpenAI (si existe la tabla)
            let openAIUsage: AdminStats['openAIUsage'] = {
                totalRequests: 0,
                totalTokens: 0,
                monthlyUsage: []
            };

            try {
                const { data: aiUsage } = await supabase
                    .from('ai_usage')
                    .select('requests, tokens, created_at')
                    .order('created_at', { ascending: true });

                if (aiUsage && aiUsage.length > 0) {
                    openAIUsage.totalRequests = aiUsage.reduce((sum, u) => sum + (u.requests || 0), 0);
                    openAIUsage.totalTokens = aiUsage.reduce((sum, u) => sum + (u.tokens || 0), 0);

                    // Agrupar por mes
                    const usageByMonth = new Map<string, { requests: number; tokens: number }>();

                    aiUsage.forEach(usage => {
                        const date = new Date(usage.created_at);
                        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                        const existing = usageByMonth.get(monthKey) || { requests: 0, tokens: 0 };
                        usageByMonth.set(monthKey, {
                            requests: existing.requests + (usage.requests || 0),
                            tokens: existing.tokens + (usage.tokens || 0)
                        });
                    });

                    openAIUsage.monthlyUsage = Array.from(usageByMonth.entries())
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([month, data]) => ({
                            month: new Date(month + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
                            requests: data.requests,
                            tokens: data.tokens
                        }));
                }
            } catch (e) {
                console.log('No ai_usage table or error fetching:', e);
            }

            // 5. Obtener usuarios recientes
            const recentUsers = businesses?.slice(0, 10).map(b => ({
                id: b.id,
                email: b.owner_id, // Temporalmente usamos owner_id
                businessName: b.name,
                plan: b.plan,
                createdAt: b.created_at
            })) || [];

            // Intentar obtener emails de auth.users (esto puede fallar por permisos)
            try {
                const { data: authUsers } = await supabase
                    .from('businesses')
                    .select('owner_id, name, plan, created_at')
                    .limit(10);

                // Nota: No podemos acceder directamente a auth.users desde el cliente
                // Necesitarías una Edge Function para esto
            } catch (e) {
                console.log('Could not fetch auth users:', e);
            }

            setStats({
                totalUsers: businesses?.length || 0,
                usersByPlan,
                totalRevenue,
                monthlyRevenue,
                openAIUsage,
                recentUsers
            });

        } catch (error: any) {
            console.error('Error loading admin stats:', error);
            toast.error('Error al cargar estadísticas', {
                description: error.message
            });
        } finally {
            setIsLoadingStats(false);
        }
    }, [isAdmin]);

    // Cargar stats automáticamente cuando se confirma que es admin
    useEffect(() => {
        if (isAdmin && !stats && !isLoadingStats) {
            loadStats();
        }
    }, [isAdmin, stats, isLoadingStats, loadStats]);

    // Función para hacer admin a un usuario (solo para el admin principal)
    const makeUserAdmin = useCallback(async (userId: string) => {
        if (!isAdmin) {
            toast.error('No tienes permisos');
            return false;
        }

        try {
            const { error } = await supabase.auth.admin.updateUserById(userId, {
                user_metadata: { is_admin: true }
            });

            if (error) throw error;

            toast.success('Usuario convertido a admin');
            return true;
        } catch (error: any) {
            console.error('Error making user admin:', error);
            toast.error('Error', { description: error.message });
            return false;
        }
    }, [isAdmin]);

    return {
        isAdmin,
        isLoading,
        stats,
        isLoadingStats,
        loadStats,
        makeUserAdmin
    };
}