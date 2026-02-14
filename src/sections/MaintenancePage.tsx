import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Construction, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

export function MaintenancePage() {

    const maintenanceUntil = import.meta.env.VITE_MAINTENANCE_UNTIL;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm overflow-hidden">
          {/* Banner superior */}
          <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600" />
          
          <CardContent className="p-8 sm:p-12 text-center">
            {/* Icono animado */}
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mb-6"
            >
              <Construction className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Estamos en{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  mantenimiento
                </span>
              </h1>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
            >
              Estamos realizando mejoras para ofrecerte una mejor experiencia. 
              Volveremos en breve.
            </motion.p>

            {/* Info adicional */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8"
            >
              <div className="flex items-center justify-center gap-2 text-amber-800 dark:text-amber-200 text-sm font-medium mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Servicio temporalmente no disponible</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300 text-xs">
                <Clock className="w-3 h-3" />
                <span>Tiempo estimado: {maintenanceUntil} minutos</span>
              </div>
            </motion.div>

            {/* Botones */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Button
                onClick={() => window.location.reload()}
                className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <RefreshCw className="w-4 h-4" />
                Intentar de nuevo
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('mailto:soporte@feedbackflow.com', '_blank')}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                Contactar soporte
              </Button>
            </motion.div>

            {/* Footer */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 text-xs text-gray-400 dark:text-gray-500"
            >
              FeedbackFlow • Mantenimiento programado
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}