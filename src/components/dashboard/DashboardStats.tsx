import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { FeedbackFlowLogo } from '@/components/landing/logo';
import { TrendingUp, Smile, Star, Users } from 'lucide-react';

interface DashboardStatsProps {
    stats: {
        total: number;
        happyPercentage: number;
        happy: number;
        satisfactionScore: number;
    };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/50">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Comentarios</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                            <FeedbackFlowLogo className="w-6 h-6" color="#4f46e5" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/50">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Satisfacción</p>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.happyPercentage}%</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/50">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Clientes Felices</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.happy}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                            <Smile className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/50">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Puntuación</p>
                            <div className="flex items-center gap-1">
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.satisfactionScore.toFixed(1)}</p>
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
