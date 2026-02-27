import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
    BarChart3,
    ChevronDown,
    Calendar,
    Clock,
    X,
    TrendingUp,
    TrendingDown,
    Activity,
    LineChart,
    Lock
} from 'lucide-react';
import { CalendarComponent } from './CalendarComponent';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardChartProps {
    canAccessAdvancedStats: boolean;
    filteredComments: any[];
    showAdvancedStats: boolean;
    setShowAdvancedStats: (show: boolean) => void;
    dateRange: { from: Date | undefined; to: Date | undefined };
    setDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void;
    dateRangeText: string;
    clearDateFilter: () => void;
    activePreset: any;
    setActivePreset: (preset: any) => void;
    statsDatePresets: any[];
    applyDatePreset: (preset: any) => void;
    showCustomDatePicker: boolean;
    setShowCustomDatePicker: (show: boolean) => void;
    dateBounds: { minDate: Date; maxDate: Date } | null;
    setShowSettings: (show: boolean) => void;
    setSettingsTab: (tab: string) => void;
}

export function DashboardChart({
    canAccessAdvancedStats,
    filteredComments,
    showAdvancedStats,
    setShowAdvancedStats,
    dateRange,
    setDateRange,
    dateRangeText,
    clearDateFilter,
    activePreset,
    setActivePreset,
    statsDatePresets,
    applyDatePreset,
    showCustomDatePicker,
    setShowCustomDatePicker,
    dateBounds,
    setShowSettings,
    setSettingsTab
}: DashboardChartProps) {
    const advancedChartData = useMemo(() => {
        if (!canAccessAdvancedStats || !filteredComments || filteredComments.length === 0) return null;

        try {
            const sortedComments = [...filteredComments].sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );

            const satisfactionValues = { happy: 2, neutral: 1, sad: 0 };

            const dates = sortedComments.map(c => new Date(c.createdAt)).filter(d => !isNaN(d.getTime()));
            if (dates.length === 0) return null;

            const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
            const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

            const allDays = eachDayOfInterval({
                start: dateRange.from || minDate,
                end: dateRange.to || maxDate
            });

            const byDay = new Map();

            allDays.forEach(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                byDay.set(dateKey, {
                    date: dateKey,
                    count: 0,
                    totalScore: 0,
                    happy: 0,
                    neutral: 0,
                    sad: 0,
                    dateFormatted: format(day, 'dd MMM', { locale: es })
                });
            });

            sortedComments.forEach(comment => {
                const date = format(parseISO(comment.createdAt), 'yyyy-MM-dd');
                if (byDay.has(date)) {
                    const day = byDay.get(date);
                    day.count++;
                    day.totalScore += satisfactionValues[comment.satisfaction as keyof typeof satisfactionValues] || 0;
                    day[comment.satisfaction]++;
                }
            });

            const dailyData: Array<typeof byDay extends Map<string, infer V> ? V & { avgSatisfaction: number; satisfactionPercentage: number } : never> = [];
            let cumulativeScore = 0;
            let cumulativeCount = 0;
            Array.from(byDay.values()).forEach(day => {
                cumulativeScore += day.totalScore;
                cumulativeCount += day.count;
                dailyData.push({
                    ...day,
                    avgSatisfaction: cumulativeCount > 0 ? (cumulativeScore / cumulativeCount) : 0,
                    satisfactionPercentage: cumulativeCount > 0 ? ((cumulativeScore / cumulativeCount) / 2) * 100 : 0,
                });
            });

            const midpoint = Math.floor(dailyData.length / 2);
            const firstHalf = dailyData.slice(0, midpoint);
            const secondHalf = dailyData.slice(midpoint);

            const firstAvg = firstHalf.length > 0
                ? firstHalf.reduce((acc, d) => acc + d.avgSatisfaction, 0) / firstHalf.length
                : 0;
            const secondAvg = secondHalf.length > 0
                ? secondHalf.reduce((acc, d) => acc + d.avgSatisfaction, 0) / secondHalf.length
                : 0;

            const trend = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

            const weekdayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const byWeekday = Array(7).fill(0).map(() => ({ count: 0, totalScore: 0 }));

            sortedComments.forEach(comment => {
                const day = new Date(comment.createdAt).getDay();
                byWeekday[day].count++;
                byWeekday[day].totalScore += satisfactionValues[comment.satisfaction as keyof typeof satisfactionValues] || 0;
            });

            const weekdayData = byWeekday.map((data, i) => {
                const avgSatisfaction = data.count > 0 ? data.totalScore / data.count : 0;
                const satisfactionPercentage = (avgSatisfaction / 2) * 100;

                let colorClass;
                if (satisfactionPercentage < 40) colorClass = 'bg-red-500';
                else if (satisfactionPercentage < 60) colorClass = 'bg-orange-500';
                else if (satisfactionPercentage < 80) colorClass = 'bg-yellow-500';
                else colorClass = 'bg-green-500';

                return {
                    day: weekdayNames[i],
                    count: data.count,
                    avgSatisfaction,
                    satisfactionPercentage,
                    colorClass
                };
            });

            return {
                dailyData,
                trend,
                trendDirection: trend >= 0 ? 'up' : 'down',
                weekdayData,
                maxDailyCount: Math.max(...dailyData.map(d => d.count), 1),
                avgPerDay: dailyData.length > 0 ? filteredComments.length / dailyData.length : 0,
                periodDays: dailyData.length,
                totalComments: filteredComments.length,
            };
        } catch (e) {
            console.error('Error calculating chart data:', e);
            return null;
        }
    }, [filteredComments, canAccessAdvancedStats, dateRange.from?.getTime(), dateRange.to?.getTime()]);

    return canAccessAdvancedStats ? (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
        >
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl dark:shadow-gray-900/50 overflow-hidden">
                <CardHeader
                    className="cursor-pointer pb-4"
                    onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    Estadísticas Avanzadas
                                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                        Basic
                                    </Badge>
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Análisis detallado de la satisfacción a lo largo del tiempo
                                </p>
                            </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showAdvancedStats ? 'rotate-180' : ''}`} />
                    </div>
                </CardHeader>

                <AnimatePresence>
                    {showAdvancedStats && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CardContent className="pt-0 border-t border-gray-100 dark:border-gray-700">
                                {/* Control de período de tiempo - Solo mostrar si hay datos */}
                                {advancedChartData && (
                                    <div className="py-6 border-b border-gray-100 dark:border-gray-700">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-purple-500" />
                                                    Período de análisis
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Selecciona el rango de fechas para analizar tus estadísticas
                                                </p>
                                            </div>

                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${dateRange.from || dateRange.to
                                                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800'
                                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                                }`}>
                                                <Clock className={`w-4 h-4 ${dateRange.from || dateRange.to
                                                    ? 'text-purple-600 dark:text-purple-400'
                                                    : 'text-gray-600 dark:text-gray-400'
                                                    }`} />
                                                <span className={`text-sm font-medium ${dateRange.from || dateRange.to
                                                    ? 'text-purple-700 dark:text-purple-300'
                                                    : 'text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {dateRangeText}
                                                </span>
                                                {(dateRange.from || dateRange.to) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            clearDateFilter();
                                                        }}
                                                        className="ml-2 hover:text-purple-900 dark:hover:text-purple-200"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {statsDatePresets.map((preset) => {
                                                const Icon = preset.icon;
                                                const isActive = activePreset === preset.days;

                                                return (
                                                    <Button
                                                        key={preset.label}
                                                        variant={isActive ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => applyDatePreset(preset.days)}
                                                        className={`gap-2 h-9 ${isActive ? 'bg-purple-600 hover:bg-purple-700' : 'dark:border-gray-600 dark:text-gray-300'}`}
                                                    >
                                                        <Icon className="w-3.5 h-3.5" />
                                                        {preset.label}
                                                    </Button>
                                                );
                                            })}

                                            <Popover open={showCustomDatePicker} onOpenChange={setShowCustomDatePicker}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={activePreset === 'custom' ? "default" : "outline"}
                                                        size="sm"
                                                        className={`gap-2 h-9 ${activePreset === 'custom' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'dark:border-gray-600 dark:text-gray-300'}`}
                                                    >
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        Personalizado
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <CalendarComponent
                                                        onSelect={(range: { from: Date | undefined, to: Date | undefined }) => {
                                                            setDateRange(range);
                                                            setActivePreset('all');
                                                            if (range.from && range.to) {
                                                                setShowCustomDatePicker(false);
                                                            }
                                                        }}
                                                        selectedRange={dateRange}
                                                        onClose={() => setShowCustomDatePicker(false)}
                                                        bounds={dateBounds}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                )}

                                {advancedChartData ? (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-b border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${advancedChartData.trend >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                                                    }`}>
                                                    {advancedChartData.trend >= 0 ? (
                                                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                    ) : (
                                                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Tendencia</p>
                                                    <p className={`text-lg font-bold ${advancedChartData.trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                        }`}>
                                                        {advancedChartData.trend >= 0 ? '+' : ''}{advancedChartData.trend.toFixed(1)}%
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                                    <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Media por día</p>
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {advancedChartData.avgPerDay.toFixed(1)} comentarios
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                                                    <LineChart className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Período analizado</p>
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {advancedChartData.periodDays} {advancedChartData.periodDays === 1 ? 'día' : 'días'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                                    <BarChart3 className="w-4 h-4" />
                                                    Volumen de comentarios por día
                                                </h4>
                                                <div className="h-48 flex items-end gap-1">
                                                    {(() => {
                                                        const rawData = advancedChartData.dailyData;
                                                        const useWeekly = rawData.length > 30;
                                                        const barData = useWeekly
                                                            ? rawData.reduce((acc: Array<{ label: string; count: number; happy: number; neutral: number; sad: number; dateFormatted: string }>, day: any, i: number) => {
                                                                const weekIndex = Math.floor(i / 7);
                                                                if (!acc[weekIndex]) {
                                                                    acc[weekIndex] = { label: day.dateFormatted.split(' ').slice(0, 2).join(' '), count: 0, happy: 0, neutral: 0, sad: 0, dateFormatted: day.dateFormatted };
                                                                }
                                                                acc[weekIndex].count += day.count;
                                                                acc[weekIndex].happy += day.happy;
                                                                acc[weekIndex].neutral += day.neutral;
                                                                acc[weekIndex].sad += day.sad;
                                                                if ((i + 1) % 7 === 0 || i === rawData.length - 1) {
                                                                    acc[weekIndex].dateFormatted = `${acc[weekIndex].label} - ${day.dateFormatted}`;
                                                                }
                                                                return acc;
                                                            }, [])
                                                            : rawData;
                                                        const maxCount = Math.max(...barData.map(d => d.count), 1);
                                                        return barData.map((day, i) => (
                                                            <div key={i} className="flex-1 min-w-0 flex flex-col items-center gap-1 group relative">
                                                                <div className="relative w-full">
                                                                    <div
                                                                        className="w-full bg-green-500/20 dark:bg-green-400/20 rounded-t transition-all duration-300 group-hover:bg-green-500/40"
                                                                        style={{ height: `${(day.count / maxCount) * 120}px` }}
                                                                    >
                                                                        {(() => {
                                                                            const hasNeutral = day.neutral > 0;
                                                                            const hasSad = day.sad > 0;
                                                                            const topSegment = hasSad ? 'sad' : hasNeutral ? 'neutral' : 'happy';
                                                                            return (
                                                                                <>
                                                                                    <div
                                                                                        className={`absolute bottom-0 w-full bg-green-500 dark:bg-green-400 ${topSegment === 'happy' ? 'rounded-t' : ''} transition-all duration-300`}
                                                                                        style={{ height: `${day.count > 0 ? (day.happy / day.count) * 100 : 0}%`, opacity: 0.9 }}
                                                                                    />
                                                                                    <div
                                                                                        className={`absolute bottom-0 w-full bg-yellow-500 dark:bg-yellow-400 ${topSegment === 'neutral' ? 'rounded-t' : ''} transition-all duration-300`}
                                                                                        style={{
                                                                                            height: `${day.count > 0 ? (day.neutral / day.count) * 100 : 0}%`,
                                                                                            bottom: `${day.count > 0 ? (day.happy / day.count) * 100 : 0}%`,
                                                                                            opacity: 0.9
                                                                                        }}
                                                                                    />
                                                                                    <div
                                                                                        className={`absolute bottom-0 w-full bg-red-500 dark:bg-red-400 ${topSegment === 'sad' ? 'rounded-t' : ''} transition-all duration-300`}
                                                                                        style={{
                                                                                            height: `${day.count > 0 ? (day.sad / day.count) * 100 : 0}%`,
                                                                                            bottom: `${day.count > 0 ? ((day.happy + day.neutral) / day.count) * 100 : 0}%`,
                                                                                            opacity: 0.9
                                                                                        }}
                                                                                    />
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                    <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl">
                                                                        <div className="font-semibold mb-1">{day.dateFormatted}</div>
                                                                        <div className="text-gray-300 mb-1">{day.count} comentarios</div>
                                                                        <div className="flex items-center gap-2 text-[10px]">
                                                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400"></div> {day.happy}</span>
                                                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> {day.neutral}</span>
                                                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> {day.sad}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] text-gray-400 rotate-45 origin-left translate-y-2">
                                                                    {useWeekly ? (day as any).label || day.dateFormatted.split(' ')[0] : day.dateFormatted.split(' ')[0]}
                                                                </span>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                                <div className="flex justify-center gap-8 mt-8 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-3 h-3 bg-green-500 rounded-sm" />
                                                        <span className="text-gray-600 dark:text-gray-400">Felices</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-3 h-3 bg-yellow-500 rounded-sm" />
                                                        <span className="text-gray-600 dark:text-gray-400">Neutros</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-3 h-3 bg-red-500 rounded-sm" />
                                                        <span className="text-gray-600 dark:text-gray-400">Insatisfechos</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                                    <LineChart className="w-4 h-4" />
                                                    Evolución de la satisfacción acumulada
                                                </h4>
                                                <div className="h-48 relative pl-10">
                                                    <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-[10px] text-gray-400 pr-2 text-right">
                                                        <span>100%</span>
                                                        <span>75%</span>
                                                        <span>50%</span>
                                                        <span>25%</span>
                                                        <span>0%</span>
                                                    </div>
                                                    <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                                                        {[0, 25, 50, 75, 100].map((y, i) => (
                                                            <line
                                                                key={i}
                                                                x1="0"
                                                                y1={120 - (y / 100) * 120}
                                                                x2="300"
                                                                y2={120 - (y / 100) * 120}
                                                                stroke="currentColor"
                                                                strokeDasharray="4,4"
                                                                className="text-gray-200 dark:text-gray-700"
                                                            />
                                                        ))}

                                                        {advancedChartData.dailyData.length > 0 && (() => {
                                                            const points = advancedChartData.dailyData.map((day, i) => ({
                                                                x: advancedChartData.dailyData.length === 1 ? 150 : (i / (advancedChartData.dailyData.length - 1)) * 300,
                                                                y: 120 - (day.satisfactionPercentage * 1.2)
                                                            }));

                                                            const smoothPath = (pts: typeof points) => {
                                                                if (pts.length < 2) return `M ${pts[0].x} ${pts[0].y}`;
                                                                if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

                                                                let d = `M ${pts[0].x} ${pts[0].y}`;
                                                                for (let i = 0; i < pts.length - 1; i++) {
                                                                    const p0 = pts[Math.max(0, i - 1)];
                                                                    const p1 = pts[i];
                                                                    const p2 = pts[i + 1];
                                                                    const p3 = pts[Math.min(pts.length - 1, i + 2)];

                                                                    const tension = 0.3;
                                                                    const cp1x = p1.x + (p2.x - p0.x) * tension;
                                                                    const cp1y = p1.y + (p2.y - p0.y) * tension;
                                                                    const cp2x = p2.x - (p3.x - p1.x) * tension;
                                                                    const cp2y = p2.y - (p3.y - p1.y) * tension;

                                                                    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
                                                                }
                                                                return d;
                                                            };

                                                            const curvePath = smoothPath(points);
                                                            const lastPt = points[points.length - 1];
                                                            const firstPt = points[0];

                                                            return (
                                                                <>
                                                                    <path
                                                                        d={`${curvePath} L ${lastPt.x} 120 L ${firstPt.x} 120 Z`}
                                                                        className="fill-green-500/10 dark:fill-green-400/10"
                                                                    />
                                                                    <path
                                                                        d={curvePath}
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        className="text-green-500 dark:text-green-400"
                                                                    />
                                                                </>
                                                            );
                                                        })()}
                                                    </svg>
                                                </div>
                                                <div className="flex justify-between mt-2 text-xs text-gray-500 px-2">
                                                    <span>{advancedChartData.dailyData[0]?.dateFormatted}</span>
                                                    <span>{advancedChartData.dailyData[advancedChartData.dailyData.length - 1]?.dateFormatted}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                                Satisfacción media por día de la semana
                                            </h4>
                                            <div className="grid grid-cols-7 gap-2">
                                                {advancedChartData.weekdayData.map((day, i) => {
                                                    const maxCount = Math.max(...advancedChartData.weekdayData.map(d => d.count));
                                                    const percentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

                                                    return (
                                                        <div key={i} className="flex flex-col items-center gap-2 group">
                                                            <div className="relative w-full h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                                                <div
                                                                    className={`absolute bottom-0 w-full transition-all duration-500 ${day.colorClass} opacity-80 group-hover:opacity-100`}
                                                                    style={{ height: `${percentage}%` }}
                                                                />
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <span className="text-lg font-bold text-white drop-shadow-md">
                                                                        {day.count}
                                                                    </span>
                                                                </div>

                                                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                                    {day.satisfactionPercentage.toFixed(0)}% satisfacción
                                                                </div>
                                                            </div>
                                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{day.day}</span>
                                                            <span className="text-[10px] text-gray-400">{day.satisfactionPercentage.toFixed(0)}%</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="flex justify-center items-center gap-6 mt-4 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-3 h-3 bg-red-500 rounded-sm" />
                                                    <span className="text-gray-600 dark:text-gray-400">0-40%</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-3 h-3 bg-orange-500 rounded-sm" />
                                                    <span className="text-gray-600 dark:text-gray-400">40-60%</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-3 h-3 bg-yellow-500 rounded-sm" />
                                                    <span className="text-gray-600 dark:text-gray-400">60-80%</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-3 h-3 bg-green-500 rounded-sm" />
                                                    <span className="text-gray-600 dark:text-gray-400">80-100%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-16 px-6 text-center border-t border-gray-100 dark:border-gray-700">
                                        <div className="mx-auto w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mb-4 border border-purple-100 dark:border-purple-800/30">
                                            <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400 opacity-80" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            Aún no hay suficientes datos
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                                            Necesitas recibir comentarios para generar las estadísticas avanzadas. Puedes ampliar el rango de fechas en el selector general de la parte inferior.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    ) : (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
        >
            <Card className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                                <Lock className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    Estadísticas Avanzadas
                                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                                        Básico
                                    </Badge>
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                                    Actualiza a Básico para desbloquear análisis detallados, gráficas de evolución temporal y métricas de tendencia.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => {
                                setShowSettings(true);
                                setSettingsTab('plan');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Actualizar a Básico
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
