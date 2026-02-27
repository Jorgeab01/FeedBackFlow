import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Calendar, X, ChevronDown, FileDown, Lock,
    Smile, Meh, Frown, MessageSquareDashed, Trash2
} from 'lucide-react';
import { CalendarComponent } from '@/components/dashboard/CalendarComponent';

interface DashboardCommentsProps {
    filteredComments: any[];
    filteredStats: { total: number; happy: number; neutral: number; sad: number };
    isLoading: boolean;
    isFiltering: boolean;
    dateRange: { from: Date | undefined; to: Date | undefined };
    setDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void;
    dateRangeText: string;
    clearDateFilter: () => void;
    applyDatePreset: (preset: any) => void;
    statsDatePresets: any[];
    activePreset: any;
    setActivePreset: (preset: any) => void;
    showDatePicker: boolean;
    setShowDatePicker: (show: boolean) => void;
    dateBounds: { minDate: Date; maxDate: Date } | null;
    canExport: boolean;
    setShowExportDialog: (show: boolean) => void;
    setShowSettings: (show: boolean) => void;
    setSettingsTab: (tab: string) => void;
    handleDeleteCommentClick: (id: string) => void;
}

export const getSatisfactionIcon = (level: string) => {
    switch (level) {
        case 'happy': return <Smile className="w-5 h-5 text-green-500" />;
        case 'neutral': return <Meh className="w-5 h-5 text-yellow-500" />;
        case 'sad': return <Frown className="w-5 h-5 text-red-500" />;
        default: return <Meh className="w-5 h-5 text-gray-500" />;
    }
};

export const getSatisfactionBadge = (level: string) => {
    switch (level) {
        case 'happy':
            return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Satisfecho</Badge>;
        case 'neutral':
            return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">Neutro</Badge>;
        case 'sad':
            return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">Insatisfecho</Badge>;
        default:
            return <Badge variant="outline">Desconocido</Badge>;
    }
};

const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Fecha inválida';

        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) return 'Hace un momento';
        if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
        if (diffInHours < 24) return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `Ayer, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
        }

        if (diffInDays < 7) {
            const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            return `${days[date.getDay()]}, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
        }

        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'Fecha inválida';
    }
};

const COMMENTS_BATCH_SIZE = 20;

interface CommentsListProps {
    comments: Array<{
        id: string;
        text: string;
        satisfaction: string;
        createdAt: string;
    }>;
    isLoading: boolean;
    onDeleteClick: (id: string) => void;
    getSatisfactionIcon: (level: string) => React.ReactNode;
    getSatisfactionBadge: (level: string) => React.ReactNode;
}

function CommentsList({ comments, isLoading, onDeleteClick, getSatisfactionIcon, getSatisfactionBadge }: CommentsListProps) {
    const [visibleCount, setVisibleCount] = useState(COMMENTS_BATCH_SIZE);

    // Reset visible count when comments change (tab switch, date filter, etc.)
    useEffect(() => {
        setVisibleCount(COMMENTS_BATCH_SIZE);
    }, [comments]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (comments.length === 0) {
        return (
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/50">
                <CardContent className="py-16 px-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 border border-gray-200 dark:border-gray-700">
                        <MessageSquareDashed className="w-8 h-8 text-gray-400 dark:text-gray-500 opacity-80" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No hay comentarios en este período
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Prueba ajustando los filtros de fecha para ver comentarios anteriores.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const visibleComments = comments.slice(0, visibleCount);
    const hasMore = visibleCount < comments.length;
    const remaining = comments.length - visibleCount;

    return (
        <div>
            <div className="space-y-4">
                <AnimatePresence>
                    {visibleComments.map((comment, index) => (
                        <motion.div
                            key={comment.id}
                            initial={index >= visibleCount - COMMENTS_BATCH_SIZE ? { opacity: 0, y: 20 } : false}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index >= visibleCount - COMMENTS_BATCH_SIZE ? (index - (visibleCount - COMMENTS_BATCH_SIZE)) * 0.03 : 0 }}
                        >
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-shadow dark:shadow-gray-900/30">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                {getSatisfactionIcon(comment.satisfaction)}
                                                {getSatisfactionBadge(comment.satisfaction)}
                                                <span className="text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                                    {formatDate(comment.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed break-words">{comment.text}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDeleteClick(comment.id)}
                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 flex-shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {hasMore && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 text-center"
                >
                    <Button
                        variant="outline"
                        onClick={() => setVisibleCount(prev => prev + COMMENTS_BATCH_SIZE)}
                        className="rounded-full px-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    >
                        Cargar más comentarios ({remaining} restantes)
                    </Button>
                </motion.div>
            )}
        </div>
    );
}

export function DashboardComments({
    filteredComments,
    filteredStats,
    isLoading,
    isFiltering,
    dateRange,
    setDateRange,
    dateRangeText,
    clearDateFilter,
    applyDatePreset,
    statsDatePresets,
    showDatePicker,
    setShowDatePicker,
    dateBounds,
    canExport,
    setShowExportDialog,
    setShowSettings,
    setSettingsTab,
    handleDeleteCommentClick
}: DashboardCommentsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <Tabs defaultValue="all" className="w-full">
                <div className="flex flex-col gap-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`gap-2 dark:border-gray-600 dark:text-gray-300 h-10 justify-between min-w-[200px] ${dateRange.from || dateRange.to
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-500'
                                            : ''
                                            }`}
                                    >
                                        <Calendar className="w-4 h-4" />
                                        <span className="truncate">{dateRangeText}</span>
                                        {dateRange.from || dateRange.to ? (
                                            <X
                                                className="w-4 h-4 hover:text-red-600"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearDateFilter();
                                                }}
                                            />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 opacity-50" />
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                        <p className="text-sm font-medium mb-2">Rango rápido</p>
                                        <div className="flex flex-wrap gap-1">
                                            {statsDatePresets.map((preset) => (
                                                <Button
                                                    key={preset.label}
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => applyDatePreset(preset.days)}
                                                    className="text-xs h-8"
                                                >
                                                    {preset.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <CalendarComponent
                                        onSelect={(range: { from: Date | undefined, to: Date | undefined }) => {
                                            setDateRange(range);
                                            if (range.from && range.to) {
                                                setShowDatePicker(false);
                                            }
                                        }}
                                        selectedRange={dateRange}
                                        onClose={() => setShowDatePicker(false)}
                                        bounds={dateBounds}
                                    />
                                </PopoverContent>
                            </Popover>

                            {(dateRange.from || dateRange.to) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearDateFilter}
                                    className="text-xs text-gray-500 h-10"
                                >
                                    <X className="w-3 h-3 mr-1" />
                                    Limpiar filtro
                                </Button>
                            )}
                        </div>

                        {canExport ? (
                            <Button
                                variant="outline"
                                onClick={() => setShowExportDialog(true)}
                                className="gap-2 dark:border-gray-600 dark:text-gray-300 whitespace-nowrap h-10 px-4"
                                disabled={filteredComments.length === 0}
                            >
                                <FileDown className="w-4 h-4" />
                                <span className="hidden sm:inline">Exportar datos</span>
                                <span className="sm:hidden">Exportar</span>
                                {filteredComments.length > 0 && (
                                    <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                                        {filteredComments.length}
                                    </span>
                                )}
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowSettings(true);
                                    setSettingsTab('plan');
                                }}
                                className="gap-2 dark:border-gray-600 dark:text-gray-300 whitespace-nowrap h-10 px-4"
                            >
                                <Lock className="w-4 h-4" />
                                <span className="hidden sm:inline">Exportar</span>
                            </Button>
                        )}
                    </div>

                    <TabsList className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm h-10 self-start">
                        <TabsTrigger value="all" className="h-10">Todos ({filteredStats.total})</TabsTrigger>
                        <TabsTrigger value="happy" className="gap-2 h-10">
                            <Smile className="w-4 h-4" />
                            <span className="hidden sm:inline">Felices</span> ({filteredStats.happy})
                        </TabsTrigger>
                        <TabsTrigger value="neutral" className="gap-2 h-10">
                            <Meh className="w-4 h-4" />
                            <span className="hidden sm:inline">Neutros</span> ({filteredStats.neutral})
                        </TabsTrigger>
                        <TabsTrigger value="sad" className="gap-2 h-10">
                            <Frown className="w-4 h-4" />
                            <span className="hidden sm:inline">Insatisfechos</span> ({filteredStats.sad})
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="all" className="mt-0">
                    <CommentsList
                        comments={filteredComments}
                        isLoading={isLoading || isFiltering}
                        onDeleteClick={handleDeleteCommentClick}
                        getSatisfactionIcon={getSatisfactionIcon}
                        getSatisfactionBadge={getSatisfactionBadge}
                    />
                </TabsContent>

                <TabsContent value="happy" className="mt-0">
                    <CommentsList
                        comments={filteredComments.filter(c => c.satisfaction === 'happy')}
                        isLoading={isLoading || isFiltering}
                        onDeleteClick={handleDeleteCommentClick}
                        getSatisfactionIcon={getSatisfactionIcon}
                        getSatisfactionBadge={getSatisfactionBadge}
                    />
                </TabsContent>

                <TabsContent value="neutral" className="mt-0">
                    <CommentsList
                        comments={filteredComments.filter(c => c.satisfaction === 'neutral')}
                        isLoading={isLoading || isFiltering}
                        onDeleteClick={handleDeleteCommentClick}
                        getSatisfactionIcon={getSatisfactionIcon}
                        getSatisfactionBadge={getSatisfactionBadge}
                    />
                </TabsContent>

                <TabsContent value="sad" className="mt-0">
                    <CommentsList
                        comments={filteredComments.filter(c => c.satisfaction === 'sad')}
                        isLoading={isLoading}
                        onDeleteClick={handleDeleteCommentClick}
                        getSatisfactionIcon={getSatisfactionIcon}
                        getSatisfactionBadge={getSatisfactionBadge}
                    />
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}
