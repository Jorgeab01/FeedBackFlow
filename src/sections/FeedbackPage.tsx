import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useBusiness } from '@/hooks/useBusiness';
import { useComments } from '@/hooks/useComments';
import type { SatisfactionLevel, PlanType } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  Store,
  Send,
  CheckCircle,
  Star,
  Moon,
  Sun,
} from 'lucide-react';

interface FeedbackPageProps {
  businessId: string;
}

// Hook interno para tracking de uso (invisible para el usuario)
function useMonthlyUsage(businessId: string, plan: PlanType | undefined) {
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const limits: Record<PlanType, number> = {
    free: 30,
    basic: 200,
    pro: Infinity
  };

  const checkUsage = useCallback(async () => {
    if (!businessId || !plan) {
      setIsLoading(false);
      return;
    }

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    try {
      const { data, error } = await supabase
        .from('monthly_usage')
        .select('comment_count')
        .eq('business_id', businessId)
        .eq('year', year)
        .eq('month', month)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching usage:', error);
      }

      const count = data?.comment_count || 0;
      const limit = limits[plan] ?? 30;

      setIsLimitReached(limit !== Infinity && count >= limit);
    } catch (err) {
      console.error('Error checking usage:', err);
    } finally {
      setIsLoading(false);
    }
  }, [businessId, plan]);

  useEffect(() => {
    checkUsage();
  }, [checkUsage]);

  return { isLimitReached, isLoading };
}

export function FeedbackPage({ businessId }: FeedbackPageProps) {
  const { business, isLoading: businessLoading } = useBusiness(businessId);
  const { addComment } = useComments(businessId);

  // Tracking invisible - no se muestra en la UI
  const { isLimitReached } = useMonthlyUsage(
    businessId,
    business?.plan || 'free'
  );

  const [selectedSatisfaction, setSelectedSatisfaction] = useState<SatisfactionLevel | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Detectar tema del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleSubmit = async () => {
    if (!selectedSatisfaction) {
      toast.error('Selecciona una carita', {
        description: 'Por favor, indica tu nivel de satisfacción.',
      });
      return;
    }

    if (!comment.trim()) {
      toast.error('Escribe un comentario', {
        description: 'Por favor, comparte tu experiencia con nosotros.',
      });
      return;
    }

    setIsSubmitting(true);

    // Solo guardar si NO se ha alcanzado el límite
    // Si se alcanzó el límite, hace como que envía pero realmente no hace nada
    if (!isLimitReached) {
      try {
        await addComment(comment, selectedSatisfaction);
      } catch (error) {
        // Silenciar errores para no alertar al usuario
        console.error('Error saving comment:', error);
      }
    }

    // Siempre mostrar éxito, independientemente de si se guardó o no
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (businessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <Store className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Negocio no encontrado</h2>
            <p className="text-gray-500 dark:text-gray-400">El enlace que has utilizado no es válido.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors duration-300 ${isDark ? 'dark bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
      }`}>
      {/* Theme Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg"
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-yellow-500" />
        ) : (
          <Moon className="w-5 h-5 text-gray-600" />
        )}
      </button>

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl mb-6 shadow-xl"
          >
            <Store className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
          >
            {business.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 dark:text-gray-300"
          >
            {'Tu opinión nos importa'}
          </motion.p>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLimitReached ? (
            <motion.div
              key="limit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-8 sm:p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <Store className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
                  >
                    Límite alcanzado
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 dark:text-gray-300 mb-8"
                  >
                    Este negocio no acepta más reseñas por ahora.
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          ) : !isSubmitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6 sm:p-8">

                  {/* Satisfaction Selector - Siempre habilitado */}
                  <div className="mb-8">
                    <label className="block text-center text-lg font-semibold text-gray-900 dark:text-white mb-6">
                      ¿Cómo fue tu experiencia?
                    </label>
                    <div className="flex justify-center gap-4 sm:gap-6">
                      <FaceButton
                        level="happy"
                        selected={selectedSatisfaction === 'happy'}
                        onClick={() => setSelectedSatisfaction('happy')}
                        emoji="😊"
                        label="Excelente"
                        color="green"
                      />
                      <FaceButton
                        level="neutral"
                        selected={selectedSatisfaction === 'neutral'}
                        onClick={() => setSelectedSatisfaction('neutral')}
                        emoji="😐"
                        label="Regular"
                        color="yellow"
                      />
                      <FaceButton
                        level="sad"
                        selected={selectedSatisfaction === 'sad'}
                        onClick={() => setSelectedSatisfaction('sad')}
                        emoji="😞"
                        label="Mala"
                        color="red"
                      />
                    </div>
                  </div>

                  {/* Comment Input - Siempre habilitado */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cuéntanos más sobre tu experiencia
                    </label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Escribe tu comentario aquí..."
                      className="min-h-[120px] resize-none border-gray-200 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 transition-all dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Submit Button - Siempre habilitado */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-lg rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Enviar comentario
                        <Send className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-4">
                    Powered by FeedbackFlow
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-8 sm:p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
                  >
                    ¡Gracias por tu comentario!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 dark:text-gray-300 mb-8"
                  >
                    Tu opinión nos ayuda a mejorar. ¡Esperamos verte pronto!
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-1 text-yellow-500"
                  >
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 fill-yellow-500" />
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface FaceButtonProps {
  level: SatisfactionLevel;
  selected: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  color: 'green' | 'yellow' | 'red';
  disabled?: boolean;
}

function FaceButton({ selected, onClick, emoji, label, color, disabled }: FaceButtonProps) {
  const colorClasses = {
    green: 'hover:bg-green-50 dark:hover:bg-green-900/30 hover:border-green-300 dark:hover:border-green-700 data-[selected=true]:bg-green-100 dark:data-[selected=true]:bg-green-900/50 data-[selected=true]:border-green-500 data-[selected=true]:shadow-green-200 dark:data-[selected=true]:shadow-green-900/30',
    yellow: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/30 hover:border-yellow-300 dark:hover:border-yellow-700 data-[selected=true]:bg-yellow-100 dark:data-[selected=true]:bg-yellow-900/50 data-[selected=true]:border-yellow-500 data-[selected=true]:shadow-yellow-200 dark:data-[selected=true]:shadow-yellow-900/30',
    red: 'hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700 data-[selected=true]:bg-red-100 dark:data-[selected=true]:bg-red-900/50 data-[selected=true]:border-red-500 data-[selected=true]:shadow-red-200 dark:data-[selected=true]:shadow-red-900/30',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      data-selected={selected}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      className={`
        flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-transparent
        transition-all duration-300 cursor-pointer
        ${colorClasses[color]}
        ${selected ? 'shadow-lg scale-110' : 'bg-white dark:bg-gray-700 shadow-md'}
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
      `}
    >
      <span className="text-4xl sm:text-5xl">{emoji}</span>
      <span className={`text-xs sm:text-sm font-medium ${selected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
        {label}
      </span>
    </motion.button>
  );
}