import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, Palette, Lock, Star, MessageSquare } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface DashboardQRDialogProps {
    showQRDialog: boolean;
    setShowQRDialog: (show: boolean) => void;
    canCustomizeQR: boolean;
    qrRef: React.RefObject<HTMLDivElement | null>;
    qrBgColor: string;
    setQrBgColor: (color: string) => void;
    qrFgColor: string;
    setQrFgColor: (color: string) => void;
    qrBgHex: string;
    setQrBgHex: (hex: string) => void;
    qrFgHex: string;
    setQrFgHex: (hex: string) => void;
    getBusinessUrl: () => string;
    showBusinessName: boolean;
    setShowBusinessName: (show: boolean) => void;
    businessName?: string;
    isCustomPhrase: boolean;
    setIsCustomPhrase: (custom: boolean) => void;
    customPhrase: string;
    setCustomPhrase: (phrase: string) => void;
    selectedPhrase: string;
    setSelectedPhrase: (phrase: string) => void;
    qrPhrases: string[];
    QR_PRESET_BG: string[];
    QR_PRESET_FG: string[];
    setShowSettings: (show: boolean) => void;
    setSettingsTab: (tab: string) => void;
    handleDownloadQR: () => void;
    handleCopyLink: () => void;
}

export function DashboardQRDialog({
    showQRDialog,
    setShowQRDialog,
    canCustomizeQR,
    qrRef,
    qrBgColor,
    setQrBgColor,
    qrFgColor,
    setQrFgColor,
    qrBgHex,
    setQrBgHex,
    qrFgHex,
    setQrFgHex,
    getBusinessUrl,
    showBusinessName,
    setShowBusinessName,
    businessName,
    isCustomPhrase,
    setIsCustomPhrase,
    customPhrase,
    setCustomPhrase,
    selectedPhrase,
    setSelectedPhrase,
    qrPhrases,
    QR_PRESET_BG,
    QR_PRESET_FG,
    setShowSettings,
    setSettingsTab,
    handleDownloadQR,
    handleCopyLink
}: DashboardQRDialogProps) {
    return (
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto w-[95vw] mx-auto p-4 sm:p-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                        Código QR
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                        {canCustomizeQR
                            ? "Personaliza colores, texto y contenido de tu QR."
                            : "Algunos diseños están disponibles exclusivamente para usuarios Pro"
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex justify-center">
                        <div
                            ref={qrRef}
                            className="relative p-8 rounded-2xl shadow-2xl transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)]"
                            style={{ backgroundColor: qrBgColor }}
                        >
                            <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 rounded-tl-lg transition-colors duration-300" style={{ borderColor: qrFgColor }} />
                            <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 rounded-tr-lg transition-colors duration-300" style={{ borderColor: qrFgColor }} />
                            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 rounded-bl-lg transition-colors duration-300" style={{ borderColor: qrFgColor }} />
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 rounded-br-lg transition-colors duration-300" style={{ borderColor: qrFgColor }} />

                            <div className="relative inline-block hover:scale-105 transition-transform duration-300 cursor-pointer">
                                <QRCodeSVG
                                    value={getBusinessUrl()}
                                    size={220}
                                    level="H"
                                    includeMargin={false}
                                    bgColor={qrBgColor}
                                    fgColor={qrFgColor}
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center z-10 pointer-events-auto transition-colors duration-300 shadow-lg"
                                        style={{ backgroundColor: qrBgColor }}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
                                            style={{ backgroundColor: qrFgColor }}
                                        >
                                            <MessageSquare className="w-5 h-5" color={qrBgColor} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {(showBusinessName || (!isCustomPhrase || customPhrase)) && (
                                <div className="mt-6 text-center space-y-2 w-[220px] mx-auto">
                                    {showBusinessName && (
                                        <p className="font-bold text-xl leading-tight break-words px-2 tracking-tight transition-colors duration-300" style={{ color: qrFgColor }}>
                                            {businessName}
                                        </p>
                                    )}
                                    <p className="text-sm font-medium break-words px-2 transition-colors duration-300" style={{ color: qrFgColor, opacity: 0.85 }}>
                                        {isCustomPhrase ? (customPhrase || 'Escribe tu mensaje...') : selectedPhrase}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Mostrar nombre del local
                                </span>
                            </div>
                            <button
                                onClick={() => setShowBusinessName(!showBusinessName)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showBusinessName ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                                    } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900`}
                            >
                                <span className="sr-only">Mostrar nombre</span>
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showBusinessName ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Color Pickers */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-indigo-500" />
                                    Colores del QR
                                </label>
                                {!canCustomizeQR && (
                                    <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                        <Lock className="w-3 h-3 mr-1 inline" />
                                        Requiere Basic o Pro
                                    </Badge>
                                )}
                            </div>

                            {canCustomizeQR ? (
                                <div className="space-y-5 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                    {/* Background color */}
                                    <div className="space-y-3">
                                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Color de Fondo</p>
                                        <div className="flex flex-wrap gap-2.5">
                                            {QR_PRESET_BG.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => { setQrBgColor(color); setQrBgHex(color); }}
                                                    className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${qrBgColor === color ? 'border-indigo-500 scale-110 shadow-md ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900' : 'border-gray-300 dark:border-gray-600'
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                    aria-label={`Seleccionar color de fondo ${color}`}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Input
                                                value={qrBgHex}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setQrBgHex(val);
                                                    if (/^#[0-9A-F]{6}$/i.test(val)) setQrBgColor(val);
                                                }}
                                                placeholder="#ffffff"
                                                className="h-9 font-mono text-sm uppercase bg-white dark:bg-gray-900"
                                                maxLength={7}
                                            />
                                            <div className="w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 flex-shrink-0 shadow-inner" style={{ backgroundColor: qrBgColor }} />
                                        </div>
                                    </div>

                                    {/* Foreground color */}
                                    <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Color de QR y Texto</p>
                                        <div className="flex flex-wrap gap-2.5">
                                            {QR_PRESET_FG.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => { setQrFgColor(color); setQrFgHex(color); }}
                                                    className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${qrFgColor === color ? 'border-indigo-500 scale-110 shadow-md ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900' : 'border-gray-300 dark:border-gray-600'
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                    aria-label={`Seleccionar color de texto ${color}`}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Input
                                                value={qrFgHex}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setQrFgHex(val);
                                                    if (/^#[0-9A-F]{6}$/i.test(val)) setQrFgColor(val);
                                                }}
                                                placeholder="#000000"
                                                className="h-9 font-mono text-sm uppercase bg-white dark:bg-gray-900"
                                                maxLength={7}
                                            />
                                            <div className="w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 flex-shrink-0 shadow-inner" style={{ backgroundColor: qrFgColor }} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center border border-gray-100 dark:border-gray-700/50">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">QR en blanco y negro (plan gratuito)</p>
                                </div>
                            )}
                        </div>

                        {!canCustomizeQR && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2 border-amber-500/50 bg-amber-50/50 text-amber-700 hover:bg-amber-100 dark:border-amber-600/50 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 transition-all font-semibold"
                                onClick={() => {
                                    setShowQRDialog(false);
                                    setShowSettings(true);
                                    setSettingsTab('plan');
                                }}
                            >
                                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                Desbloquear todos los diseños con Basic
                            </Button>
                        )}

                        <div className="space-y-4">
                            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between">
                                <span>Mensaje del QR</span>
                                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full font-medium">
                                    {isCustomPhrase ? 'Personalizado' : 'Predefinido'}
                                </span>
                            </label>

                            <div className="flex gap-2 p-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl">
                                <button
                                    onClick={() => setIsCustomPhrase(false)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-gray-900 ${!isCustomPhrase
                                        ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    Sugerencias
                                </button>
                                <button
                                    onClick={() => setIsCustomPhrase(true)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-gray-900 ${isCustomPhrase
                                        ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    Personalizado
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {!isCustomPhrase ? (
                                    <motion.div
                                        key="presets"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex flex-wrap gap-2"
                                    >
                                        {qrPhrases.map((phrase) => (
                                            <button
                                                key={phrase}
                                                onClick={() => setSelectedPhrase(phrase)}
                                                className={`
                          px-3.5 py-2 rounded-lg text-sm font-medium transition-all text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-gray-900
                          ${selectedPhrase === phrase
                                                        ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                                                        : 'bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }
                        `}
                                            >
                                                {phrase}
                                            </button>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="custom"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-2"
                                    >
                                        <Input
                                            value={customPhrase}
                                            onChange={(e) => setCustomPhrase(e.target.value)}
                                            placeholder="Ej: ¡Valora tu experiencia!"
                                            maxLength={50}
                                            className="w-full bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <div className="flex justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400 px-1">
                                            <span>Recomendamos mensajes cortos</span>
                                            <span className={customPhrase.length > 40 ? 'text-amber-500' : ''}>{customPhrase.length}/50</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 mt-6">
                            <Button onClick={handleDownloadQR} className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-5">
                                <Download className="w-4 h-4" />
                                Descargar PNG
                            </Button>
                            <Button variant="outline" onClick={handleCopyLink} className="flex-1 gap-2 font-medium py-5 border-gray-200 dark:border-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800">
                                <Copy className="w-4 h-4" />
                                Copiar Enlace
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
