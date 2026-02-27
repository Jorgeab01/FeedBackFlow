import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Copy, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface DashboardShareLinkProps {
    isPro: boolean;
    remaining: number;
    percentage: number;
    isNearLimit: boolean;
    businessUrl: string;
    setShowQRDialog: (show: boolean) => void;
    handleCopyLink: () => void;
}

export function DashboardShareLink({
    isPro,
    remaining,
    percentage,
    isNearLimit,
    businessUrl,
    setShowQRDialog,
    handleCopyLink
}: DashboardShareLinkProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
        >
            <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 shadow-xl">
                <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="text-center lg:text-left">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Comparte tu enlace de feedback
                            </h2>
                            <p className="text-indigo-100 mb-4">
                                Tus clientes pueden dejar comentarios escaneando el código QR o visitando el enlace.
                            </p>

                            {/* Advertencia de límite para plan gratuito */}
                            {!isPro && (
                                <div className="mb-4 p-3 bg-white/10 rounded-lg border border-white/20">
                                    <div className="flex items-center gap-2 text-white/90 text-sm">
                                        <Zap className="w-4 h-4" />
                                        <span>
                                            {remaining !== Infinity && remaining > 0
                                                ? `${remaining} comentarios disponibles este mes`
                                                : remaining === 0
                                                    ? 'Límite mensual alcanzado'
                                                    : 'Comentarios ilimitados'}
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/20 rounded-full mt-2">
                                        <div
                                            className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-amber-400' : 'bg-white'}`}
                                            style={{ width: `${Math.min(100, percentage)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowQRDialog(true)}
                                    className="gap-2"
                                >
                                    <QrCode className="w-4 h-4" />
                                    Ver QR
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleCopyLink}
                                    className="gap-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copiar enlace
                                </Button>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-lg">
                            <QRCodeSVG
                                value={businessUrl}
                                size={120}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
