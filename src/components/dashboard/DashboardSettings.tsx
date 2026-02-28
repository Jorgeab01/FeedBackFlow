import { useEffect } from 'react';
import type { ChangelogItem } from '@/data/changelog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    Settings, Save, Mail, AlertCircle, Check, Lock, Copy,
    CreditCard, ExternalLink, Crown, AlertTriangle, Trash2, X, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

type PlanType = 'free' | 'basic' | 'pro';

interface DashboardSettingsProps {
    showSettings: boolean;
    setShowSettings: (show: boolean) => void;
    settingsTab: string;
    setSettingsTab: (tab: string) => void;
    user: any;
    businessName: string;
    setBusinessName: (name: string) => void;
    handleSaveName: () => void;
    isSavingName: boolean;
    showEmailForm: boolean;
    setShowEmailForm: (show: boolean) => void;
    newEmail: string;
    setNewEmail: (email: string) => void;
    emailPassword: string;
    setEmailPassword: (password: string) => void;
    handleChangeEmail: () => void;
    isChangingEmail: boolean;
    showPasswordForm: boolean;
    togglePasswordForm: () => void;
    newPassword: string;
    setNewPassword: (password: string) => void;
    confirmNewPassword: string;
    setConfirmNewPassword: (password: string) => void;
    passwordErrors: { newPassword?: string; confirmNewPassword?: string };
    handlePasswordChange: () => void;
    isChangingPassword: boolean;
    handleManageBilling: () => void;
    isManagingBilling: boolean;
    isYearly: boolean;
    setIsYearly: (yearly: boolean) => void;
    handleChangePlan: (plan: PlanType) => void;
    isChangingPlan: boolean;
    showDeleteConfirm: boolean;
    setShowDeleteConfirm: (show: boolean) => void;
    deleteConfirmText: string;
    setDeleteConfirmText: (text: string) => void;
    handleDeleteAccount: () => void;
    hasUnread?: boolean;
    markAsRead?: () => void;
    changelogData?: ChangelogItem[];
}

export function DashboardSettings({
    showSettings,
    setShowSettings,
    settingsTab,
    setSettingsTab,
    user,
    businessName,
    setBusinessName,
    handleSaveName,
    isSavingName,
    showEmailForm,
    setShowEmailForm,
    newEmail,
    setNewEmail,
    emailPassword,
    setEmailPassword,
    handleChangeEmail,
    isChangingEmail,
    showPasswordForm,
    togglePasswordForm,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    passwordErrors,
    handlePasswordChange,
    isChangingPassword,
    handleManageBilling,
    isManagingBilling,
    isYearly,
    setIsYearly,
    handleChangePlan,
    isChangingPlan,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleteConfirmText,
    setDeleteConfirmText,
    handleDeleteAccount,
    hasUnread,
    markAsRead,
    changelogData = []
}: DashboardSettingsProps) {

    useEffect(() => {
        if (showSettings && settingsTab === 'changelog' && markAsRead) {
            markAsRead();
        }
    }, [showSettings, settingsTab, markAsRead]);
    return (
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
                    <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="billing">Suscripción</TabsTrigger>
                        <TabsTrigger value="support">Soporte</TabsTrigger>
                        <TabsTrigger value="changelog" className="relative">
                            Novedades
                            {hasUnread && (
                                <span className="absolute top-1.5 right-2 flex h-2 w-2">
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                            )}
                        </TabsTrigger>
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
                                Envía un correo a soporte@feedback-flow.com
                            </p>

                            <div className="flex flex-col gap-2">
                                <Button
                                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                                    onClick={() => {
                                        const subject = encodeURIComponent(`Soporte - ${user.businessName}`);
                                        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=soporte@feedback-flow.com&su=${subject}`, '_blank');
                                    }}
                                >
                                    <Mail className="w-4 h-4" />
                                    Abrir en Gmail
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                    onClick={() => {
                                        navigator.clipboard.writeText('soporte@feedback-flow.com');
                                        toast.success('Correo copiado', {
                                            description: 'La dirección de soporte se ha copiado al portapapeles.'
                                        });
                                    }}
                                >
                                    <Copy className="w-4 h-4" />
                                    Copiar correo
                                </Button>
                            </div>
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

                    <TabsContent value="changelog" className="space-y-6 mt-4">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">Últimas novedades</h3>
                            <div className="space-y-6">
                                {changelogData.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                                        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-4 rounded-full text-indigo-500 mb-2">
                                            <Sparkles className="w-8 h-8 opacity-50" />
                                        </div>
                                        <h4 className="text-gray-900 dark:text-white font-medium text-lg">Aún no hay novedades</h4>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
                                            Pronto publicaremos nuevas actualizaciones y mejoras para el panel de control. ¡Mantente atento!
                                        </p>
                                    </div>
                                ) : (
                                    changelogData.map((item) => (
                                        <div key={item.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg">
                                                    <Sparkles className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-base">{item.title}</h4>
                                                        <Badge variant="outline" className="text-xs bg-white dark:bg-gray-800">{item.version}</Badge>
                                                    </div>
                                                    <time className="text-xs text-gray-500 dark:text-gray-400 font-medium">{item.date}</time>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 ml-14">
                                                {item.description}
                                            </p>
                                            <ul className="space-y-2 ml-14">
                                                {item.features.map((feat, i) => (
                                                    <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                                        <span className="text-indigo-500 mt-1 flex-shrink-0">•</span>
                                                        <span>{feat}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
