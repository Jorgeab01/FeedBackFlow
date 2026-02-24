import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase'

import {
  LogOut,
  QrCode,
  MessageSquare,
  TrendingUp,
  Users,
  Smile,
  Meh,
  Frown,
  Download,
  Copy,
  Star,
  Palette,
  Settings,
  CreditCard,
  Trash2,
  AlertTriangle,
  Save,
  X,
  Check,
  FileDown,
  FileSpreadsheet,
  FileText,
  Calendar,
  ChevronDown,
  BarChart3,
  LineChart,
  Lock,
  TrendingDown,
  Activity,
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  Mail,
  AlertCircle,
  Crown,
  Zap,
  ExternalLink
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { PlanType } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import type { User } from '@/types';
import { useComments } from '@/hooks/useComments';
import { useBusiness } from '@/hooks/useBusiness';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { useTheme } from '@/hooks/useTheme';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  format,
  subDays,
  isWithinInterval,
  startOfDay,
  endOfDay,
  parseISO,
  eachDayOfInterval,
  isSameDay,
  startOfMonth,
  addMonths,
  subMonths,
  getDay,
  getDaysInMonth,
  isToday,
  isBefore,
  isAfter
} from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
  themeProps: {
    theme: ReturnType<typeof useTheme>['theme'];
    setTheme: ReturnType<typeof useTheme>['setTheme'];
  };
}

// CONFIGURACIÓN DE LÍMITES POR PLAN
const PLAN_LIMITS = {
  free: {
    maxCommentsPerMonth: 30,
    canExport: false,
    canAccessAdvancedStats: false,
    canCustomizeQR: false,
    allowedQRStyles: ['classic'],
    canExportPDF: false,
    allowedExportFormats: [],
    label: 'Gratis'
  },
  basic: {
    maxCommentsPerMonth: 200,
    canExport: true,
    canAccessAdvancedStats: false,
    canCustomizeQR: true,
    allowedQRStyles: ['classic', 'modern', 'colorful', 'elegant', 'dark'],
    canExportPDF: false,
    allowedExportFormats: ['csv'],
    label: 'Básico'
  },
  pro: {
    maxCommentsPerMonth: Infinity,
    canExport: true,
    canAccessAdvancedStats: true,
    canCustomizeQR: true,
    allowedQRStyles: ['classic', 'modern', 'colorful', 'elegant', 'dark'],
    canExportPDF: true,
    allowedExportFormats: ['csv', 'pdf'],
    label: 'Pro'
  }
};

// Colores predefinidos para el selector de QR
const QR_PRESET_BG = [
  '#ffffff', '#1e293b', '#0f172a', '#fef3c7', '#faf5ff', '#f0fdf4', '#fff1f2', '#f0f9ff',
];
const QR_PRESET_FG = [
  '#000000', '#1e293b', '#6366f1', '#a855f7', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
];

const qrPhrases = [
  '¡Escanea y déjanos tu opinión!',
  'Ayúdanos a mejorar',
  'Cuéntanos tu experiencia',
  '¿Cómo fue tu visita?',
  '¡Queremos saber de ti!',
];

type DatePreset = 'all' | 'month' | 7 | 30 | 90 | 'custom';

const statsDatePresets = [
  { label: '7 días', days: 7 as const, icon: Clock },
  { label: '30 días', days: 30 as const, icon: Calendar },
  { label: '90 días', days: 90 as const, icon: CalendarDays },
  { label: 'Este mes', days: 'month' as const, icon: CalendarDays },
  { label: 'Todo', days: 'all' as const, icon: Clock },
];

// Hook para tracking de uso mensual desde Supabase
function useMonthlyUsage(businessId: string, plan: PlanType) {
  const [usage, setUsage] = useState({
    count: 0,
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });
  const [isLoading, setIsLoading] = useState(true);
  const limits = PLAN_LIMITS[plan];

  const fetchUsage = useCallback(async () => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 1-12 para PostgreSQL

    try {
      // Usar maybeSingle() en lugar de single() para evitar error si no existe
      const { data, error } = await supabase
        .from('monthly_usage')
        .select('comment_count')
        .eq('business_id', businessId)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle(); // ✅ No da error 406 si no hay fila

      if (error) {
        console.error('Error fetching usage:', error);
        // Si es 406, probablemente la tabla no existe o no hay permisos
        if (error.code === '406') {
          console.warn('Tabla monthly_usage no encontrada o sin permisos');
        }
      }

      setUsage({
        count: data?.comment_count || 0,
        month: currentDate.getMonth(), // 0-11 para UI
        year: year
      });
    } catch (err) {
      console.error('Error in fetchUsage:', err);
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage, businessId]);

  const remaining = limits.maxCommentsPerMonth === Infinity
    ? Infinity
    : Math.max(0, limits.maxCommentsPerMonth - usage.count);

  const percentage = limits.maxCommentsPerMonth === Infinity
    ? 0
    : Math.min(100, (usage.count / limits.maxCommentsPerMonth) * 100);

  const isLimitReached = limits.maxCommentsPerMonth !== Infinity && usage.count >= limits.maxCommentsPerMonth;
  const isNearLimit = limits.maxCommentsPerMonth !== Infinity && percentage >= 80 && percentage < 100;

  return { usage, remaining, percentage, isLimitReached, isNearLimit, isLoading, limits, refreshUsage: fetchUsage };
}


export function DashboardPage({ user, onLogout, themeProps }: DashboardPageProps) {
  const { comments, isLoading, deleteComment, getStats } = useComments(user.businessId);
  const { business, getBusinessUrl } = useBusiness(user.businessId);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Tracking de uso mensual desde Supabase
  const {
    remaining,
    percentage,
    isLimitReached,
    isNearLimit,
    limits
  } = useMonthlyUsage(user.businessId, user.plan);

  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrBgColor, setQrBgColor] = useState('#ffffff');
  const [qrFgColor, setQrFgColor] = useState('#000000');
  const [qrBgHex, setQrBgHex] = useState('#ffffff');
  const [qrFgHex, setQrFgHex] = useState('#000000');
  const [selectedPhrase, setSelectedPhrase] = useState(qrPhrases[0]);
  const qrRef = useRef<HTMLDivElement>(null);

  // Estados de UI
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');
  const [businessName, setBusinessName] = useState(user.businessName);

  // Estados para confirmación de eliminar comentario
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false);

  // Estados para exportar
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Estados para filtros de fecha
  const [activePreset, setActivePreset] = useState<DatePreset>('all');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>(() => ({
    from: undefined,
    to: undefined,
  }));

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  // Estados de formularios
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  const [showBusinessName, setShowBusinessName] = useState(true);
  const [isCustomPhrase, setIsCustomPhrase] = useState(false);
  const [customPhrase, setCustomPhrase] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // NUEVO: Estado para cambio de plan
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  // Verificar permisos según plan
  const canExport = limits.canExport;
  const canAccessAdvancedStats = limits.canAccessAdvancedStats;
  const canCustomizeQR = limits.canCustomizeQR;

  // Resetear colores si no está permitido customizar
  useEffect(() => {
    if (!canCustomizeQR) {
      setQrBgColor('#ffffff');
      setQrFgColor('#000000');
      setQrBgHex('#ffffff');
      setQrFgHex('#000000');
    }
  }, [canCustomizeQR]);

  // Verificar si es plan Pro
  const isPro = user.plan === 'pro';

  // Calcular bounds de fechas
  const dateBounds = useMemo(() => {
    if (!comments || comments.length === 0) return null;

    const validDates = comments
      .map(c => new Date(c.createdAt))
      .filter(d => !isNaN(d.getTime()));

    if (validDates.length === 0) return null;

    const minDate = new Date(Math.min(...validDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...validDates.map(d => d.getTime())));

    return {
      minDate: startOfDay(minDate),
      maxDate: endOfDay(maxDate)
    };
  }, [comments]);

  // Filtrar comentarios por fecha
  const filteredComments = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return comments || [];
    if (!comments) return [];

    return comments.filter(comment => {
      try {
        const commentDate = new Date(comment.createdAt);
        if (isNaN(commentDate.getTime())) return false;

        if (dateRange.from && dateRange.to) {
          return isWithinInterval(commentDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to)
          });
        } else if (dateRange.from) {
          return !isBefore(commentDate, startOfDay(dateRange.from));
        } else if (dateRange.to) {
          return !isAfter(commentDate, endOfDay(dateRange.to));
        }
        return true;
      } catch (e) {
        return false;
      }
    });
  }, [comments, dateRange.from?.getTime(), dateRange.to?.getTime()]);

  // Calcular stats
  const filteredStats = useMemo(() => {
    const total = filteredComments.length;
    const happy = filteredComments.filter(c => c.satisfaction === 'happy').length;
    const neutral = filteredComments.filter(c => c.satisfaction === 'neutral').length;
    const sad = filteredComments.filter(c => c.satisfaction === 'sad').length;
    const happyPercentage = total > 0 ? Math.round((happy / total) * 100) : 0;
    const satisfactionScore = total > 0 ? Math.round((happy * 5 + neutral * 3 + sad * 1) / total) : 0;

    return { total, happy, neutral, sad, happyPercentage, satisfactionScore };
  }, [filteredComments]);

  const stats = getStats();

  // Funciones de manejo
  const [isSavingName, setIsSavingName] = useState(false);

  const handleSaveName = useCallback(async () => {
    const trimmedName = businessName.trim();

    // Validaciones frontend (coinciden con tu CHECK constraint)
    if (trimmedName === '') {
      toast.error('El nombre no puede estar vacío');
      return;
    }

    if (trimmedName.length < 3) {
      toast.error('El nombre debe tener al menos 3 caracteres');
      return;
    }

    if (trimmedName.length > 30) {
      toast.error('El nombre no puede tener más de 30 caracteres');
      return;
    }

    setIsSavingName(true);

    try {
      // Actualización directa en Supabase
      const { error } = await supabase
        .from('businesses')
        .update({
          name: trimmedName,
          updated_at: new Date().toISOString() // Actualizamos el timestamp manualmente
        })
        .eq('id', user.businessId)
        .eq('owner_id', user.id); // Verificación de seguridad: solo el dueño puede editar

      if (error) {
        console.error('Error actualizando negocio:', error);

        // Manejo específico de errores
        if (error.code === '23514') { // check_violation
          toast.error('El nombre debe tener entre 3 y 30 caracteres');
        } else if (error.code === '42501') { // insufficient_privilege (RLS)
          toast.error('No tienes permisos para editar este negocio');
        } else {
          toast.error('No se pudo actualizar el nombre');
        }
        return;
      }

      toast.success('Nombre actualizado correctamente');

      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (err) {
      console.error('Error inesperado:', err);
      toast.error('Error inesperado al guardar');
    } finally {
      setIsSavingName(false);
    }
  }, [businessName, user.businessId, user.id]);

  const handlePasswordChange = useCallback(async () => {
    // Timeout de seguridad: forzar reset después de 10 segundos
    const timeoutId = setTimeout(() => {
      setIsChangingPassword(false);
      toast.error('Tiempo de espera agotado. Intenta de nuevo.');
    }, 10000);

    setIsChangingPassword(true);

    try {
      const errors: Record<string, string> = {}

      if (!newPassword || newPassword.length < 6) {
        errors.newPassword = 'Debe tener al menos 6 caracteres'
      }
      if (newPassword !== confirmNewPassword) {
        errors.confirmNewPassword = 'Las contraseñas no coinciden'
      }

      if (Object.keys(errors).length > 0) {
        setPasswordErrors(errors)
        toast.error('Corrige los errores')
        return
      }

      // Verificar sesión primero
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.user?.email) {
        toast.error('Sesión expirada. Inicia sesión de nuevo.')
        return
      }

      // Cambiar contraseña directamente usando la sesión activa
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        toast.error(error.message || 'Error al cambiar contraseña')
        return
      }

      toast.success('Contraseña actualizada correctamente', {
        description: 'Por favor, inicia sesión con tu nueva contraseña.'
      })

      // Limpiar todo y cerrar sesión
      setNewPassword('')
      setConfirmNewPassword('')
      setShowPasswordForm(false)
      setPasswordErrors({})

      onLogout()

    } catch (err: any) {
      console.error('Error cambiando password:', err)
      toast.error('Error inesperado: ' + (err?.message || 'Desconocido'))
    } finally {
      clearTimeout(timeoutId); // Limpiar timeout
      setIsChangingPassword(false); // SIEMPRE desactivar
    }
  }, [newPassword, confirmNewPassword, onLogout])


  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangeEmail = useCallback(async () => {
    const trimmedEmail = newEmail.trim();

    if (!trimmedEmail || !emailPassword) {
      toast.error('Completa todos los campos');
      return;
    }

    if (trimmedEmail === user.email) {
      toast.error('El email es igual al actual');
      return;
    }

    setIsChangingEmail(true);

    try {
      // 1. Verificar la contraseña actual antes de permitir el cambio
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: emailPassword
      });

      if (signInError) {
        if (signInError.status === 429) {
          toast.error('Límite de intentos alcanzado. Espera unos minutos.');
        } else {
          toast.error('La contraseña actual es incorrecta.');
        }
        return;
      }

      // 2. Intentar actualizar email
      const { error: authError } = await supabase.auth.updateUser({
        email: trimmedEmail
      });

      if (authError) {
        console.error('Auth error:', authError);

        // Manejo específico de rate limiting (Error 429)
        if (authError.status === 429 || authError.message?.toLowerCase().includes('rate limit')) {
          toast.error(
            'Límite alcanzado',
            {
              duration: 8000,
              description: 'Contacta con soporte para cambiar tu correo.'
            }
          );
          return;
        }

        if (authError.message?.includes('already registered') || authError.code === 'email_exists') {
          toast.error('Este email ya está registrado por otro usuario');
          return;
        }

        toast.error(authError.message || 'Error al solicitar el cambio de email');
        return;
      }

      // IMPORTANTE: Ya no necesitamos actualizar la tabla 'businesses' manualmente aquí.
      // Hemos creado un Trigger en PostgreSQL (on_auth_user_email_updated) que clonará
      // el nuevo email a la tabla businesses automáticamente SÓLO cuando el usuario 
      // verifique su nuevo correo haciendo clic en el enlace.

      toast.success(
        'Solicitud enviada. Revisa tu correo nuevo (y también la carpeta de spam) para confirmar el cambio.',
        { duration: 6000 }
      );

      setShowEmailForm(false);
      setNewEmail('');
      setEmailPassword('');

    } catch (err: any) {
      console.error('Error completo:', err);
      toast.error('Error inesperado al cambiar email');
    } finally {
      setIsChangingEmail(false);
    }
  }, [newEmail, emailPassword, user.email, user.businessId, user.id]);


  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== user.businessName) {
      toast.error('El nombre no coincide')
      return
    }

    const { error: rpcError } = await supabase.rpc('delete_user');

    if (rpcError) {
      console.error('Error deleting user:', rpcError);
      toast.error('Error al eliminar la cuenta')
      return
    }

    await supabase.auth.signOut()
    toast.success('Cuenta eliminada')
    onLogout()
  }, [deleteConfirmText, user.businessName, onLogout])


  const handleDeleteCommentClick = useCallback((commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteCommentDialog(true);
  }, []);

  const confirmDeleteComment = useCallback(() => {
    if (commentToDelete) {
      deleteComment(commentToDelete);
      toast.success('Comentario eliminado', {
        description: 'El comentario ha sido eliminado.',
      });
    }
    setShowDeleteCommentDialog(false);
    setCommentToDelete(null);
  }, [commentToDelete, deleteComment]);

  const handleCopyLink = useCallback(() => {
    const url = getBusinessUrl();
    navigator.clipboard.writeText(url);
    toast.success('Enlace copiado', {
      description: 'El enlace ha sido copiado al portapapeles.',
    });
  }, [getBusinessUrl]);

  const handleDownloadQR = useCallback(() => {
    if (!qrRef.current) return;

    const container = qrRef.current;
    const rect = container.getBoundingClientRect();
    const scale = 3;
    const canvas = document.createElement('canvas');
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.scale(scale, scale);
    ctx.fillStyle = qrBgColor;
    ctx.roundRect(0, 0, rect.width, rect.height, 16);
    ctx.fill();

    // Draw corner accents
    const cs = 28; // corner size
    const cm = 16; // corner margin
    const bw = 4;  // border width
    ctx.strokeStyle = qrFgColor;
    ctx.lineWidth = bw;
    // top-left
    ctx.beginPath(); ctx.moveTo(cm + cs, cm); ctx.lineTo(cm, cm); ctx.lineTo(cm, cm + cs); ctx.stroke();
    // top-right
    ctx.beginPath(); ctx.moveTo(rect.width - cm - cs, cm); ctx.lineTo(rect.width - cm, cm); ctx.lineTo(rect.width - cm, cm + cs); ctx.stroke();
    // bottom-left
    ctx.beginPath(); ctx.moveTo(cm, rect.height - cm - cs); ctx.lineTo(cm, rect.height - cm); ctx.lineTo(cm + cs, rect.height - cm); ctx.stroke();
    // bottom-right
    ctx.beginPath(); ctx.moveTo(rect.width - cm - cs, rect.height - cm); ctx.lineTo(rect.width - cm, rect.height - cm); ctx.lineTo(rect.width - cm, rect.height - cm - cs); ctx.stroke();

    // Draw QR SVG
    const svg = container.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const svgEl = container.querySelector('svg')!;
      const svgRect = svgEl.getBoundingClientRect();
      const offsetX = svgRect.left - rect.left;
      const offsetY = svgRect.top - rect.top;
      ctx.drawImage(img, offsetX, offsetY, svgRect.width, svgRect.height);
      URL.revokeObjectURL(url);

      // Draw center icon
      const iconSize = 40;
      const iconX = rect.width / 2 - iconSize / 2;
      const iconY = offsetY + svgRect.height / 2 - iconSize / 2;
      ctx.fillStyle = qrBgColor;
      ctx.beginPath(); ctx.roundRect(iconX - 4, iconY - 4, iconSize + 8, iconSize + 8, 8); ctx.fill();
      ctx.fillStyle = qrFgColor;
      ctx.beginPath(); ctx.roundRect(iconX, iconY, iconSize, iconSize, 6); ctx.fill();

      // Draw text
      const textY = offsetY + svgRect.height + 16;
      ctx.fillStyle = qrFgColor;
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      if (showBusinessName && business?.name) {
        ctx.fillText(business.name, rect.width / 2, textY);
      }
      const phrase = isCustomPhrase ? (customPhrase || '') : selectedPhrase;
      if (phrase) {
        ctx.globalAlpha = 0.8;
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillText(phrase, rect.width / 2, textY + (showBusinessName && business?.name ? 18 : 0));
        ctx.globalAlpha = 1;
      }

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-${business?.name || 'negocio'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success('QR descargado', { description: 'El código QR ha sido descargado correctamente.' });
    };
    img.src = url;
  }, [business?.name, qrBgColor, qrFgColor, showBusinessName, isCustomPhrase, customPhrase, selectedPhrase]);

  const handleExportExcel = useCallback(() => {
    if (!canExport) {
      toast.error('Función no disponible', {
        description: 'Actualiza tu plan para exportar datos.',
      });
      return;
    }

    setIsExporting(true);

    setTimeout(() => {
      const headers = ['Fecha', 'Tipo', 'Comentario', 'Satisfacción'];
      const rows = filteredComments.map(c => [
        new Date(c.createdAt).toLocaleDateString('es-ES'),
        c.satisfaction,
        `"${c.text.replace(/"/g, '""')}"`,
        c.satisfaction === 'happy' ? 'Satisfecho' :
          c.satisfaction === 'neutral' ? 'Neutral' : 'Insatisfecho'
      ]);

      const csvContent = [
        '\ufeff',
        headers.join(';'),
        ...rows.map(r => r.join(';'))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      let dateSuffix = '';
      if (dateRange.from && dateRange.to) {
        dateSuffix = `-${format(dateRange.from, 'dd-MM')}-a-${format(dateRange.to, 'dd-MM')}`;
      } else if (dateRange.from) {
        dateSuffix = `-desde-${format(dateRange.from, 'dd-MM')}`;
      }

      link.setAttribute('href', url);
      link.setAttribute('download', `feedback-${business?.name || 'datos'}${dateSuffix}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(false);
      setShowExportDialog(false);
      toast.success('Excel descargado', {
        description: `${filteredComments.length} comentarios exportados correctamente.`,
      });
    }, 1000);
  }, [filteredComments, dateRange, business?.name, canExport]);

  const handleExportPDF = useCallback(() => {
    if (!limits.canExportPDF) {
      toast.error('Función no disponible', {
        description: 'Actualiza a Pro para exportar en PDF.',
      });
      return;
    }

    setIsExporting(true);

    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Error', { description: 'Permite las ventanas emergentes para exportar PDF' });
        setIsExporting(false);
        return;
      }

      const dateRangeText = dateRange.from && dateRange.to
        ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
        : dateRange.from
          ? `Desde ${format(dateRange.from, 'dd/MM/yyyy')}`
          : 'Todo el período';

      const htmlContent = `
        <html>
          <head>
            <title>Feedback - ${business?.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
              h1 { color: #6366f1; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
              .header { margin-bottom: 30px; }
              .date-range { color: #6b7280; font-size: 14px; margin-top: 5px; }
              .stat { display: inline-block; margin-right: 30px; margin-bottom: 20px; }
              .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
              .stat-value { font-size: 24px; font-weight: bold; color: #111; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; }
              td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
              .happy { color: #16a34a; }
              .neutral { color: #ca8a04; }
              .sad { color: #dc2626; }
              .footer { margin-top: 40px; font-size: 12px; color: #9ca3af; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${business?.name || 'Mi Negocio'}</h1>
              <p>Reporte de Feedback - ${new Date().toLocaleDateString('es-ES')}</p>
              <p class="date-range">Período: ${dateRangeText}</p>
            </div>
            
            <div class="stats">
              <div class="stat">
                <div class="stat-label">Total Comentarios</div>
                <div class="stat-value">${filteredStats.total}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Satisfacción</div>
                <div class="stat-value">${filteredStats.happyPercentage}%</div>
              </div>
              <div class="stat">
                <div class="stat-label">Clientes Felices</div>
                <div class="stat-value">${filteredStats.happy}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Satisfacción</th>
                  <th>Comentario</th>
                </tr>
              </thead>
              <tbody>
                ${filteredComments.map(c => `
                  <tr>
                    <td>${new Date(c.createdAt).toLocaleDateString('es-ES')}</td>
                    <td class="${c.satisfaction}">
                      ${c.satisfaction === 'happy' ? 'Satisfecho' :
          c.satisfaction === 'neutral' ? 'Neutral' : 'Insatisfecho'}
                    </td>
                    <td>${c.text}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              Generado por FeedbackFlow - ${filteredComments.length} comentarios
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();

      setIsExporting(false);
      setShowExportDialog(false);
      toast.success('PDF generado', {
        description: `${filteredComments.length} comentarios exportados. Selecciona "Guardar como PDF" para descargar.`,
      });
    }, 1000);
  }, [business?.name, filteredStats, filteredComments, dateRange, limits.canExportPDF]);

  const applyDatePreset = useCallback((presetValue: DatePreset) => {
    if (!dateBounds) return;
    setIsFiltering(true);
    const today = new Date();
    setActivePreset(presetValue);
    if (presetValue === 'all') {
      setDateRange({ from: undefined, to: undefined });
    } else if (presetValue === 'month') {
      const startOfCurrentMonth = startOfMonth(today);
      const from = isBefore(startOfCurrentMonth, dateBounds.minDate) ? dateBounds.minDate : startOfCurrentMonth;
      const to = isAfter(today, dateBounds.maxDate) ? dateBounds.maxDate : today;
      setDateRange({ from, to });
    } else if (typeof presetValue === 'number') {
      const requestedFrom = subDays(today, presetValue);
      const from = isBefore(requestedFrom, dateBounds.minDate) ? dateBounds.minDate : requestedFrom;
      const to = isAfter(today, dateBounds.maxDate) ? dateBounds.maxDate : today;
      setDateRange({ from, to });
    }
    setShowDatePicker(false);
    setShowCustomDatePicker(false);
    setTimeout(() => setIsFiltering(false), 300);
  }, [dateBounds]);

  const clearDateFilter = useCallback(() => {
    setIsFiltering(true);
    setActivePreset('all');
    setDateRange({ from: undefined, to: undefined });
    setTimeout(() => setIsFiltering(false), 300);
  }, []);

  const togglePasswordForm = () => {
    setShowPasswordForm(!showPasswordForm);
    if (showPasswordForm) {
      setPasswordErrors({});
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  const getSatisfactionIcon = useCallback((level: string) => {
    switch (level) {
      case 'happy':
        return <Smile className="w-5 h-5 text-green-500" />;
      case 'neutral':
        return <Meh className="w-5 h-5 text-yellow-500" />;
      case 'sad':
        return <Frown className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  }, []);

  const getSatisfactionBadge = useCallback((level: string) => {
    switch (level) {
      case 'happy':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">Satisfecho</Badge>;
      case 'neutral':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400">Neutral</Badge>;
      case 'sad':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">Insatisfecho</Badge>;
      default:
        return null;
    }
  }, []);

  const getPlanBadge = useCallback(() => {
    const planColors = {
      free: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      basic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      pro: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    const planNames = {
      free: 'Gratis',
      basic: 'Básico',
      pro: 'Pro',
    };
    return (
      <Badge className={planColors[user.plan]}>
        Plan {planNames[user.plan]}
      </Badge>
    );
  }, [user.plan]);

  const dateRangeText = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return 'Todo el tiempo';
    if (dateRange.from && dateRange.to && isSameDay(dateRange.from, dateRange.to)) {
      return format(dateRange.from, 'dd MMM yyyy', { locale: es });
    }
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'dd MMM', { locale: es })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: es })}`;
    }
    if (dateRange.from) return `Desde ${format(dateRange.from, 'dd MMM yyyy', { locale: es })}`;
    if (dateRange.to) return `Hasta ${format(dateRange.to, 'dd MMM yyyy', { locale: es })}`;
    return '';
  }, [dateRange.from?.getTime(), dateRange.to?.getTime()]);

  // Datos para gráficas
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

      const dailyData = Array.from(byDay.values()).map(day => ({
        ...day,
        avgSatisfaction: day.count > 0 ? (day.totalScore / day.count) : 0,
        satisfactionPercentage: day.count > 0 ? ((day.totalScore / day.count) / 2) * 100 : 0,
      }));

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

  // Componente Calendario
  const CalendarComponent = useCallback(({ onSelect, selectedRange, onClose, bounds }: {
    onSelect: (range: { from: Date | undefined; to: Date | undefined }) => void;
    selectedRange: { from: Date | undefined; to: Date | undefined };
    onClose: () => void;
    bounds: { minDate: Date; maxDate: Date } | null;
  }) => {
    const [currentMonth, setCurrentMonth] = useState(selectedRange.from || bounds?.minDate || new Date());
    const [selecting, setSelecting] = useState(!selectedRange.to && !!selectedRange.from);

    if (!bounds) return null;

    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = startOfMonth(currentMonth);
    const startDay = getDay(firstDayOfMonth);

    const handleDateClick = (day: number) => {
      const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

      if (isBefore(clickedDate, startOfDay(bounds.minDate)) || isAfter(clickedDate, endOfDay(bounds.maxDate))) {
        return;
      }

      if (!selecting || !selectedRange.from) {
        onSelect({ from: clickedDate, to: undefined });
        setSelecting(true);
      } else {
        if (isBefore(clickedDate, selectedRange.from)) {
          onSelect({ from: clickedDate, to: selectedRange.from });
        } else {
          onSelect({ from: selectedRange.from, to: clickedDate });
        }
        setSelecting(false);
      }
    };

    const isSelected = (day: number) => {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      if (selectedRange.from && isSameDay(date, selectedRange.from)) return 'start';
      if (selectedRange.to && isSameDay(date, selectedRange.to)) return 'end';
      if (selectedRange.from && selectedRange.to && isWithinInterval(date, {
        start: startOfDay(selectedRange.from),
        end: endOfDay(selectedRange.to)
      })) return 'between';
      return false;
    };

    const isDisabled = (day: number) => {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      return isBefore(date, startOfDay(bounds.minDate)) || isAfter(date, endOfDay(bounds.maxDate));
    };

    const canGoPrevious = !isSameDay(startOfMonth(currentMonth), startOfMonth(bounds.minDate)) &&
      isAfter(startOfMonth(currentMonth), startOfMonth(bounds.minDate));

    const canGoNext = !isSameDay(startOfMonth(currentMonth), startOfMonth(bounds.maxDate)) &&
      isBefore(startOfMonth(currentMonth), startOfMonth(bounds.maxDate));

    const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    return (
      <div className="p-3 w-[280px]">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            disabled={!canGoPrevious}
            className={`p-1 rounded transition-colors ${canGoPrevious ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : 'opacity-30 cursor-not-allowed'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-sm capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            disabled={!canGoNext}
            className={`p-1 rounded transition-colors ${canGoNext ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : 'opacity-30 cursor-not-allowed'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs text-gray-400 font-medium py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDay === 0 ? 6 : startDay - 1 }, (_, i) => (
            <div key={`empty-${i}`} className="h-8" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const selectionType = isSelected(day);
            const disabled = isDisabled(day);
            const isTodayDate = isToday(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));

            return (
              <button
                key={day}
                onClick={() => !disabled && handleDateClick(day)}
                disabled={disabled}
                className={`
                  h-8 w-8 rounded-full text-xs font-medium transition-all relative
                  ${selectionType === 'start' || selectionType === 'end'
                    ? 'bg-indigo-600 text-white'
                    : selectionType === 'between'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                      : disabled
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }
                  ${isTodayDate && !selectionType ? 'ring-1 ring-indigo-500' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 mb-3 text-center">
            Disponible: {format(bounds.minDate, 'dd/MM/yyyy')} - {format(bounds.maxDate, 'dd/MM/yyyy')}
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {selectedRange.from && (
                <span>
                  {format(selectedRange.from, 'dd/MM')}
                  {selectedRange.to && ` - ${format(selectedRange.to, 'dd/MM')}`}
                  {!selectedRange.to && ' (inicio)'}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => onSelect({ from: bounds.minDate, to: bounds.maxDate })}
              >
                Todo
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                onClick={onClose}
                disabled={!selectedRange.from || !selectedRange.to}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }, []);

  const handleChangePlan = async (newPlan: PlanType) => {
    if (newPlan === user.plan) {
      toast.info('Ya tienes este plan activo');
      return;
    }

    setIsChangingPlan(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Si el plan actual es gratis, enviarlo a checkout para crear su primera suscripción
      if (user.plan === 'free') {
        const priceId = newPlan === 'basic'
          ? (isYearly ? import.meta.env.VITE_STRIPE_BASIC_YEARLY_PRICE_ID : import.meta.env.VITE_STRIPE_BASIC_MONTHLY_PRICE_ID)
          : (isYearly ? import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID : import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID);

        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: {
            priceId,
            successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/dashboard`
          },
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined
        });

        if (error || !data?.url) throw error || new Error('No URL returned');
        window.location.href = data.url;
        return;
      }

      // Si ya tiene plan de pago, enviarlo al portal de Stripe para cambiar su suscripción
      const { data, error } = await supabase.functions.invoke('create-portal', {
        body: { returnUrl: window.location.origin + '/dashboard' },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined
      });

      if (error || !data?.url) throw error || new Error('No URL returned');
      window.location.href = data.url;

    } catch (err) {
      console.error('Error gestionando plan:', err);
      toast.error('Error al contactar con la pasarela de pagos.');
      setIsChangingPlan(false);
    }
  };

  const [isManagingBilling, setIsManagingBilling] = useState(false);

  const handleManageBilling = async () => {
    setIsManagingBilling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('create-portal', {
        body: { returnUrl: window.location.origin + '/dashboard' },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined
      });

      if (error || !data?.url) throw error || new Error('No URL returned');
      window.location.href = data.url;
    } catch (err) {
      console.error('Error abriendo portal:', err);
      toast.error('Error al contactar con el portal de pagos.');
      setIsManagingBilling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Banner de límite alcanzado o cercano */}
      {(isLimitReached || isNearLimit) && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className={`sticky top-0 z-50 ${isLimitReached ? 'bg-red-600' : 'bg-amber-500'} text-white px-4 py-3 shadow-lg`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-semibold text-sm">
                  {isLimitReached
                    ? `Has alcanzado el límite de ${limits.maxCommentsPerMonth} comentarios mensuales`
                    : `Estás cerca del límite: ${remaining} comentarios restantes este mes`}
                </p>
                <p className="text-xs text-white/90">
                  {isLimitReached
                    ? `Los comentarios eliminados siguen contando para el límite mensual`
                    : `Dejarás de recibir comentarios de usuarios pronto`}
                </p>
              </div>
            </div>
            {user.plan !== 'pro' && (
              <Button
                size="sm"
                className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
                onClick={() => {
                  setShowSettings(true);
                  setSettingsTab('plan');
                }}
              >
                <Crown className="w-4 h-4 mr-2" />
                Actualizar a Pro
              </Button>
            )}
          </div>
        </motion.div>
      )
      }

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Logo y nombre - más compacto en móvil */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">FeedbackFlow</h1>
                  {/* Badge solo en desktop o muy pequeño en móvil */}
                  <div className="hidden sm:block">
                    {getPlanBadge()}
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-[200px]">
                  {user.businessName}
                </p>
              </div>
            </div>

            {/* Acciones derecha - más compactas en móvil */}
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              {/* Badge en móvil (solo el plan sin texto "Plan") */}
              <div className="sm:hidden">
                <Badge className={`text-[10px] px-1.5 py-0.5 ${user.plan === 'free' ? 'bg-gray-100 text-gray-700' :
                  user.plan === 'basic' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                  {user.plan === 'free' ? 'Gratis' : user.plan === 'basic' ? 'Básico' : 'Pro'}
                </Badge>
              </div>

              {/* Indicador de uso - solo en desktop */}
              {!isPro && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="w-16 xl:w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {remaining}
                  </span>
                </div>
              )}

              {/* Email - solo en desktop grande */}
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden xl:inline truncate max-w-[150px]">
                {user.email}
              </span>

              <ThemeToggle theme={themeProps.theme} setTheme={themeProps.setTheme} />

              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="dark:border-gray-600 dark:text-gray-300 h-8 w-8 sm:h-9 sm:w-9"
                title="Ajustes"
              >
                <Settings className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                onClick={onLogout}
                className="gap-2 dark:border-gray-600 dark:text-gray-300 h-8 sm:h-9 px-2 sm:px-4"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Cerrar sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
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
                  <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
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
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.satisfactionScore}</p>
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

        {/* Estadísticas Avanzadas - Solo Pro */}
        {canAccessAdvancedStats ? (
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
                        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          Pro
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
                      {/* Control de período de tiempo */}
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
                                onClick={() => applyDatePreset(preset.days as DatePreset)}
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
                                className={`gap-2 h-9 ${activePreset === 'custom' ? 'bg-purple-600 hover:bg-purple-700' : 'dark:border-gray-600 dark:text-gray-300'}`}
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                Personalizado
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                onSelect={(range) => {
                                  setDateRange(range);
                                  setActivePreset('custom');
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

                      {advancedChartData && (
                        <>
                          {/* KPIs adicionales */}
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

                          {/* Gráficos */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
                            {/* Gráfico de barras */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Volumen de comentarios por día
                              </h4>
                              <div className="h-48 flex items-end justify-center gap-1">
                                {advancedChartData.dailyData.slice(-14).map((day, i) => (
                                  <div key={i} className="flex-1 min-w-0 max-w-[40px] flex flex-col items-center gap-1 group relative">
                                    <div className="relative w-full">
                                      <div
                                        className="w-full bg-green-500/20 dark:bg-green-400/20 rounded-t transition-all duration-300 group-hover:bg-green-500/40"
                                        style={{ height: `${(day.count / (advancedChartData.maxDailyCount || 1)) * 120}px` }}
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
                                      {day.dateFormatted.split(' ')[0]}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-center gap-4 mt-6 text-xs">
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

                            {/* Gráfico de líneas */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                <LineChart className="w-4 h-4" />
                                Evolución de la satisfacción media
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

                                  {advancedChartData.dailyData.length > 0 && (
                                    <path
                                      d={`
                                        M ${advancedChartData.dailyData.length === 1 ? 150 : 0} ${120 - (advancedChartData.dailyData[0]?.satisfactionPercentage || 0) * 1.2}
                                        ${advancedChartData.dailyData.map((day, i) => {
                                        const x = advancedChartData.dailyData.length === 1 ? 150 : (i / (advancedChartData.dailyData.length - 1)) * 300;
                                        const y = 120 - (day.satisfactionPercentage * 1.2);
                                        return `L ${x} ${y}`;
                                      }).join(' ')}
                                        L ${advancedChartData.dailyData.length === 1 ? 150 : 300} 120 L ${advancedChartData.dailyData.length === 1 ? 150 : 0} 120 Z
                                      `}
                                      className="fill-green-500/10 dark:fill-green-400/10"
                                    />
                                  )}

                                  {advancedChartData.dailyData.length > 0 && (
                                    <path
                                      d={`
                                        M ${advancedChartData.dailyData.length === 1 ? 150 : 0} ${120 - (advancedChartData.dailyData[0]?.satisfactionPercentage || 0) * 1.2}
                                        ${advancedChartData.dailyData.map((day, i) => {
                                        const x = advancedChartData.dailyData.length === 1 ? 150 : (i / (advancedChartData.dailyData.length - 1)) * 300;
                                        const y = 120 - (day.satisfactionPercentage * 1.2);
                                        return `L ${x} ${y}`;
                                      }).join(' ')}
                                      `}
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      className="text-green-500 dark:text-green-400"
                                    />
                                  )}

                                  {advancedChartData.dailyData.map((day, i) => {
                                    const x = advancedChartData.dailyData.length === 1 ? 150 : (i / (advancedChartData.dailyData.length - 1)) * 300;
                                    const y = 120 - (day.satisfactionPercentage * 1.2);

                                    let pointColor;
                                    if (day.satisfactionPercentage < 40) pointColor = '#ef4444';
                                    else if (day.satisfactionPercentage < 60) pointColor = '#f97316';
                                    else if (day.satisfactionPercentage < 80) pointColor = '#eab308';
                                    else pointColor = '#22c55e';

                                    return (
                                      <circle
                                        key={i}
                                        cx={x}
                                        cy={y}
                                        r="3"
                                        fill={pointColor}
                                        className="hover:r-5 transition-all cursor-pointer"
                                      >
                                        <title>{day.dateFormatted}: {day.satisfactionPercentage.toFixed(0)}% satisfacción</title>
                                      </circle>
                                    );
                                  })}
                                </svg>

                              </div>
                              <div className="flex justify-between mt-2 text-xs text-gray-500 px-2">
                                <span>{advancedChartData.dailyData[0]?.dateFormatted}</span>
                                <span>{advancedChartData.dailyData[advancedChartData.dailyData.length - 1]?.dateFormatted}</span>
                              </div>
                            </div>
                          </div>

                          {/* Distribución por día de la semana */}
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

                            <div className="flex justify-center items-center gap-4 mt-4 text-xs">
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
                        <Badge variant="secondary">Pro</Badge>
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                        Actualiza a Pro para desbloquear análisis detallados, gráficas de evolución temporal y métricas de tendencia.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setShowSettings(true);
                      setSettingsTab('plan');
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Actualizar a Pro
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* QR Code Section */}
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
                    value={getBusinessUrl()}
                    size={120}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Comments Section */}
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
                              onClick={() => applyDatePreset(preset.days as DatePreset)}
                              className="text-xs h-8"
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <CalendarComponent
                        onSelect={(range) => {
                          setDateRange(range);
                          setActivePreset('custom');
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
      </main>

      {/* QR Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Código QR
            </DialogTitle>
            <DialogDescription>
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
                className="relative p-8 rounded-2xl shadow-2xl"
                style={{ backgroundColor: qrBgColor }}
              >
                <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 rounded-tl-lg" style={{ borderColor: qrFgColor }} />
                <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 rounded-tr-lg" style={{ borderColor: qrFgColor }} />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 rounded-bl-lg" style={{ borderColor: qrFgColor }} />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 rounded-br-lg" style={{ borderColor: qrFgColor }} />

                <div className="relative inline-block">
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
                      className="w-12 h-12 rounded-xl flex items-center justify-center z-10 pointer-events-auto"
                      style={{ backgroundColor: qrBgColor }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: qrFgColor }}
                      >
                        <MessageSquare className="w-5 h-5" style={{ color: qrBgColor }} />
                      </div>
                    </div>
                  </div>
                </div>

                {(showBusinessName || (!isCustomPhrase || customPhrase)) && (
                  <div className="mt-4 text-center space-y-1 w-[220px] mx-auto">
                    {showBusinessName && (
                      <p className="font-bold text-lg leading-tight break-words px-2" style={{ color: qrFgColor }}>
                        {business?.name}
                      </p>
                    )}
                    <p className="text-sm break-words px-2" style={{ color: qrFgColor, opacity: 0.8 }}>
                      {isCustomPhrase ? (customPhrase || 'Escribe tu mensaje...') : selectedPhrase}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mostrar nombre del local
                  </span>
                </div>
                <button
                  onClick={() => setShowBusinessName(!showBusinessName)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showBusinessName ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showBusinessName ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {/* Color Pickers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Colores del QR
                  </label>
                  {!canCustomizeQR && (
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="w-3 h-3 mr-1" />
                      Requiere Basic o Pro
                    </Badge>
                  )}
                </div>

                {canCustomizeQR ? (
                  <div className="space-y-4">
                    {/* Background color */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fondo</p>
                      <div className="flex flex-wrap gap-2">
                        {QR_PRESET_BG.map(color => (
                          <button
                            key={color}
                            onClick={() => { setQrBgColor(color); setQrBgHex(color); }}
                            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${qrBgColor === color ? 'border-indigo-500 scale-110 shadow-md' : 'border-gray-300 dark:border-gray-600'
                              }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">#</span>
                        <Input
                          value={qrBgHex.replace('#', '')}
                          onChange={e => {
                            const raw = '#' + e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                            setQrBgHex(raw);
                            if (raw.length === 7) setQrBgColor(raw);
                          }}
                          placeholder="ffffff"
                          className="h-8 font-mono text-sm"
                          maxLength={6}
                        />
                        <div className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0" style={{ backgroundColor: qrBgColor }} />
                      </div>
                    </div>

                    {/* Foreground color */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Componentes (QR y texto)</p>
                      <div className="flex flex-wrap gap-2">
                        {QR_PRESET_FG.map(color => (
                          <button
                            key={color}
                            onClick={() => { setQrFgColor(color); setQrFgHex(color); }}
                            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${qrFgColor === color ? 'border-indigo-500 scale-110 shadow-md' : 'border-gray-300 dark:border-gray-600'
                              }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">#</span>
                        <Input
                          value={qrFgHex.replace('#', '')}
                          onChange={e => {
                            const raw = '#' + e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                            setQrFgHex(raw);
                            if (raw.length === 7) setQrFgColor(raw);
                          }}
                          placeholder="000000"
                          className="h-8 font-mono text-sm"
                          maxLength={6}
                        />
                        <div className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0" style={{ backgroundColor: qrFgColor }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">QR en blanco y negro (plan gratuito)</p>
                  </div>
                )}
              </div>

              {!canCustomizeQR && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 border-amber-500 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/30"
                  onClick={() => {
                    setShowQRDialog(false);
                    setShowSettings(true);
                    setSettingsTab('plan');
                  }}
                >
                  <Star className="w-4 h-4" />
                  Desbloquear todos los diseños con Basic
                </Button>
              )}

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                  <span>Mensaje del QR</span>
                  <span className="text-xs text-gray-400 font-normal">
                    {isCustomPhrase ? 'Personalizado' : 'Predefinido'}
                  </span>
                </label>

                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <button
                    onClick={() => setIsCustomPhrase(false)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${!isCustomPhrase
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                      }`}
                  >
                    Frases sugeridas
                  </button>
                  <button
                    onClick={() => setIsCustomPhrase(true)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${isCustomPhrase
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                      }`}
                  >
                    Personalizado
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {!isCustomPhrase ? (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-wrap gap-2"
                    >
                      {qrPhrases.map((phrase) => (
                        <button
                          key={phrase}
                          onClick={() => setSelectedPhrase(phrase)}
                          className={`
                            px-3 py-2 rounded-lg text-sm transition-all text-left
                            ${selectedPhrase === phrase
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }
                          `}
                        >
                          {phrase}
                        </button>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="space-y-2"
                    >
                      <Input
                        value={customPhrase}
                        onChange={(e) => setCustomPhrase(e.target.value)}
                        placeholder="Escribe tu mensaje personalizado..."
                        maxLength={50}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Máximo 50 caracteres recomendados para mejor legibilidad</span>
                        <span>{customPhrase.length}/50</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={handleDownloadQR} className="flex-1 gap-2">
                  <Download className="w-4 h-4" />
                  Descargar QR
                </Button>
                <Button variant="outline" onClick={handleCopyLink} className="flex-1 gap-2">
                  <Copy className="w-4 h-4" />
                  Copiar enlace
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Ajustes
            </DialogTitle>
            <DialogDescription>
              Gestiona tu negocio, plan y cuenta
            </DialogDescription>
          </DialogHeader>

          <Tabs value={settingsTab} onValueChange={setSettingsTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="billing">Suscripción</TabsTrigger>
              <TabsTrigger value="support">Soporte</TabsTrigger>
              <TabsTrigger value="danger" className="text-red-600">Cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nombre del local</Label>
                <div className="flex gap-2">
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Nombre de tu negocio"
                    maxLength={30}
                  />
                  <Button onClick={handleSaveName} size="sm" disabled={isSavingName}>
                    {isSavingName ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Este nombre aparecerá en tu página de feedback y en el QR.</span>
                  <span>{businessName.length}/30</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Correo electrónico</Label>
                    <p className="text-xs text-gray-500 mt-1">Email actual: {user.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmailForm(!showEmailForm)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {showEmailForm ? 'Cancelar' : 'Cambiar email'}
                  </Button>
                </div>

                {showEmailForm && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="newEmail" className="text-sm">Nuevo correo electrónico</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="nuevo@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailPassword" className="text-sm">Contraseña</Label>
                      <Input
                        id="emailPassword"
                        type="password"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        placeholder="Tu contraseña actual"
                      />
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 text-sm text-amber-800 dark:text-amber-200 mb-4">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      Solo puedes cambiar tu email 1 vez por hora. Asegúrate de que el nuevo email sea correcto.
                    </div>
                    <Button
                      onClick={handleChangeEmail}
                      className="w-full"
                      disabled={!newEmail || !emailPassword || isChangingEmail}
                    >
                      {isChangingEmail ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Actualizando...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Confirmar cambio de email
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Contraseña</Label>
                    <p className="text-xs text-gray-500 mt-1">••••••••</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePasswordForm}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {showPasswordForm ? 'Cancelar' : 'Cambiar contraseña'}
                  </Button>
                </div>

                {showPasswordForm && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm">Nueva contraseña</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className={passwordErrors.newPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                      />
                      {passwordErrors.newPassword ? (
                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{passwordErrors.newPassword}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPassword" className="text-sm">Confirmar nueva contraseña</Label>
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Repite la nueva contraseña"
                        className={passwordErrors.confirmNewPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                      />
                      {passwordErrors.confirmNewPassword && (
                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{passwordErrors.confirmNewPassword}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handlePasswordChange}
                      className="w-full"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Actualizando...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Actualizar contraseña
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>ID del negocio</Label>
                <div className="flex gap-2">
                  <Input value={user.businessId} disabled className="bg-gray-100 dark:bg-gray-800 font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(user.businessId);
                      toast.success('ID copiado');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Este ID es único para tu negocio. Lo necesitarás para configuraciones avanzadas.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4 mt-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Estado de tu Suscripción</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.plan === 'free'
                        ? 'Actualmente estás utilizando la versión gratuita. Elige un plan Pro para desbloquear todas las funciones.'
                        : 'Gestiona tus métodos de pago, facturas y tipo de plan a través de nuestro portal seguro de Stripe.'}
                    </p>
                  </div>
                </div>

                {user.plan !== 'free' && (
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Portal de Cliente seguro</span>
                        <span className="text-xs text-gray-500">Descarga facturas, cambia entre planes o gestiona tu tarjeta de crédito.</span>
                      </div>
                      <Button
                        onClick={handleManageBilling}
                        disabled={isManagingBilling}
                        className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {isManagingBilling ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}
                        Gestionar Suscripción
                      </Button>
                    </div>
                  </div>
                )}

                {user.plan === 'free' && (
                  <div className="grid gap-4 mt-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Planes Disponibles</h4>
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg self-start sm:self-auto w-full sm:w-auto">
                        <button
                          onClick={() => setIsYearly(false)}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-all ${!isYearly ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                        >
                          Mensual
                        </button>
                        <button
                          onClick={() => setIsYearly(true)}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${isYearly ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                        >
                          Anual
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-bold">
                            -20%
                          </span>
                        </button>
                      </div>
                    </div>
                    {(['free', 'basic', 'pro'] as PlanType[]).map((plan) => {
                      const planNames: Record<PlanType, string> = {
                        free: 'Gratis',
                        basic: 'Básico',
                        pro: 'Pro'
                      };
                      const planPrices: Record<PlanType, string> = {
                        free: '0€',
                        basic: isYearly ? '59.90€' : '5.99€',
                        pro: isYearly ? '99.90€' : '9.99€'
                      };
                      const planDescriptions: Record<PlanType, string> = {
                        free: '30 comentarios/mes',
                        basic: '200 comentarios/mes + CSV',
                        pro: 'Ilimitado + Estadísticas'
                      };
                      const isCurrent = user.plan === plan;

                      return (
                        <div
                          key={plan}
                          className={`
                          p-4 rounded-lg flex flex-col sm:flex-row sm:items-center items-start gap-4 transition-all bg-white dark:bg-gray-900 border
                          ${isCurrent ? 'border-indigo-500 border-2 shadow-sm' : 'border-gray-200 dark:border-gray-700'}
                        `}
                        >
                          <div className="flex-1 w-full">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-gray-900 dark:text-white">{planNames[plan]}</h3>
                              {isCurrent && (
                                <Badge className="bg-indigo-600 hover:bg-indigo-700 text-xs py-0 h-5">
                                  <Check className="w-3 h-3 mr-1" />
                                  Tu plan actual
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {planDescriptions[plan]}
                            </p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                              {planPrices[plan]}
                              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                /{plan === 'free' ? 'siempre' : 'mes'}
                              </span>
                            </p>
                          </div>

                          {!isCurrent && (
                            <Button
                              size="sm"
                              className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700"
                              disabled={isChangingPlan}
                              onClick={() => handleChangePlan(plan)}
                            >
                              {isChangingPlan ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Crown className="w-4 h-4" />
                                  Suscribirme
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="support" className="space-y-4 mt-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Centro de ayuda</h3>
                    <p className="text-sm text-gray-500">Estamos aquí para ayudarte</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  ¿Tienes problemas técnicos, preguntas sobre tu facturación o necesitas ayuda con la configuración?
                  Envía un correo a soporte@feedbackflow.com
                </p>

                <Button
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    window.open(`mailto:soporte@feedbackflow.com?subject=Soporte - ${user.businessName}`, '_blank');
                  }}
                >
                  <Mail className="w-4 h-4" />
                  Contactar soporte
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="danger" className="space-y-4 mt-4">
              <div className="border-2 border-red-200 dark:border-red-900/50 rounded-lg p-6 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-100">Zona de peligro</h3>
                    <p className="text-sm text-red-600 dark:text-red-300">Estas acciones son irreversibles</p>
                  </div>
                </div>

                <Separator className="my-4 bg-red-200 dark:bg-red-800" />

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Eliminar cuenta</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Esto eliminará permanentemente tu negocio, todos los comentarios y datos asociados. No se puede deshacer.
                    </p>

                    {!showDeleteConfirm ? (
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar mi cuenta
                      </Button>
                    ) : (
                      <div className="space-y-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-300">
                        <p className="text-sm font-medium text-red-600">
                          Escribe <strong>{user.businessName}</strong> para confirmar:
                        </p>
                        <Input
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Escribe el nombre de tu negocio"
                          className="border-red-300"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeleteConfirmText('');
                            }}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmText !== user.businessName}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Confirmar eliminación
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar comentario */}
      <Dialog open={showDeleteCommentDialog} onOpenChange={setShowDeleteCommentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              ¿Eliminar comentario?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="pt-4 space-y-3">
                <div>
                  Estás a punto de eliminar este comentario de la vista.
                </div>

                {!isPro && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg space-y-1">
                    <div className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                      Importante: Este comentario seguirá contando para tu límite mensual.
                    </div>
                    <div className="text-sm text-amber-700 dark:text-amber-300">
                      Has usado {limits.maxCommentsPerMonth - remaining} de {limits.maxCommentsPerMonth} comentarios este mes.
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  Eliminar este comentario no hará que el problema desaparezca, solo evitará que puedas solucionarlo.
                </div>
              </div>
            </DialogDescription>


          </DialogHeader>

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowDeleteCommentDialog(false);
                setCommentToDelete(null);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={confirmDeleteComment}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Sí, eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exportar Datos */}
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
    </div >
  );
}

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

function CommentsList({ comments, isLoading, onDeleteClick, getSatisfactionIcon, getSatisfactionBadge }: CommentsListProps) {
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
        <CardContent className="p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">No hay comentarios en este período.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Prueba ajustando los filtros de fecha.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-4">
        <AnimatePresence>
          {comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
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
    </ScrollArea>
  );
}