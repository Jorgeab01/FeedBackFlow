import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileDown, FileSpreadsheet, Download, FileText, Lock } from 'lucide-react';

interface DashboardExportDialogProps {
    showExportDialog: boolean;
    setShowExportDialog: (show: boolean) => void;
    filteredComments: any[];
    dateRange: { from: Date | undefined; to: Date | undefined };
    dateRangeText: string;
    isExporting: boolean;
    handleExportExcel: () => void;
    handleExportPDF: () => void;
    limits: { canExportPDF: boolean };
}

export function DashboardExportDialog({
    showExportDialog,
    setShowExportDialog,
    filteredComments,
    dateRange,
    dateRangeText,
    isExporting,
    handleExportExcel,
    handleExportPDF,
    limits
}: DashboardExportDialogProps) {
    return (
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileDown className="w-5 h-5 text-indigo-600" />
                        Exportar datos
                    </DialogTitle>
                    <DialogDescription>
                        {filteredComments.length} comentarios seleccionados
                        {dateRange.from && ` • ${dateRangeText}`}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <button
                        onClick={handleExportExcel}
                        disabled={isExporting || filteredComments.length === 0}
                        className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileSpreadsheet className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Excel (.csv)</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Perfecto para analizar en Excel o Google Sheets
                            </p>
                        </div>
                        {isExporting ? (
                            <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Download className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
                        )}
                    </button>

                    {limits.canExportPDF ? (
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting || filteredComments.length === 0}
                            className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">PDF</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Reporte profesional listo para imprimir
                                </p>
                            </div>
                            {isExporting ? (
                                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Download className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                            )}
                        </button>
                    ) : (
                        <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 opacity-60">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                                <Lock className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    PDF
                                    <Badge variant="secondary">Pro</Badge>
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Actualiza a Pro para desbloquear
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
