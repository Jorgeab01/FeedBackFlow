import { ArrowLeft, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';

export function TermsPage({ themeProps }: { themeProps: { theme: ReturnType<typeof useTheme>['theme']; setTheme: ReturnType<typeof useTheme>['setTheme'] } }) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8">
            {/* Theme Toggle */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle theme={themeProps.theme} setTheme={themeProps.setTheme} />
            </div>

            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate(-1)} // Vuelve a la página anterior
                className="fixed top-4 left-4 gap-2 text-gray-600 dark:text-gray-300 z-50"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver
            </Button>

            <div className="max-w-4xl mx-auto mt-12 mb-12">
                <div className="text-center mb-10">
                    <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6">
                        <ScrollText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                        Términos y Condiciones
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400">
                        Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                    <CardContent className="p-8 sm:p-12 prose prose-indigo dark:prose-invert max-w-none">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-0">1. Aceptación de los Términos</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Al acceder y registrarse en nuestra plataforma de software (en adelante, el "Servicio"), usted confirma que acepta estar sujeto a estos Términos y Condiciones.
                            Si está abriendo una cuenta en nombre de una empresa, entidad legal o negocio, usted declara y garantiza que tiene la autoridad para obligar a dicha entidad legal a estos términos.
                            Si no acepta alguno de estos términos, le rogamos que no utilice el Servicio.
                        </p>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8">2. Descripción del Servicio</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Proveemos una solución B2B (Software as a Service) que permite a los negocios, restaurantes y establecimientos capturar, gestionar y redirigir
                            el feedback de sus clientes en tiempo real mediante el escaneo de códigos QR o enlaces directos. Nuestro objetivo es ayudar a las empresas a
                            reducir reseñas negativas públicas y fomentar el feedback interno constructivo. Nos reservamos el derecho de agregar, modificar o discontinuar
                            características del Servicio en cualquier momento.
                        </p>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8">3. Uso Aceptable y Licencia</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Le otorgamos una licencia limitada, no exclusiva e intransferible para acceder y utilizar nuestra plataforma para sus fines comerciales internos.
                            Usted se compromete a no utilizar el Servicio para ningún propósito ilegal o no autorizado, incluyendo, entre otros:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                            <li>Infringir la privacidad, los derechos de propiedad intelectual, u otros derechos de los consumidores finales;</li>
                            <li>Intentar realizar ingeniería inversa, descompilar o extraer el código fuente de nuestra plataforma;</li>
                            <li>Revender, sublicenciar o distribuir el Servicio a terceros sin nuestro consentimiento expreso;</li>
                            <li>Utilizar el Servicio para enviar spam, malware o cualquier contenido abusivo u ofensivo.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8">4. Privacidad y Datos de los Clientes</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            En su calidad de negocio usuario, usted reconoce que actuamos como Procesador de Datos de la información (feedback) introducida por sus clientes.
                            Usted es responsable de garantizar que la recopilación de este feedback cumple con las regulaciones de protección de datos vigentes (como el RGPD europeo),
                            notificando adecuadamente a sus clientes en el punto de contacto. Toda la información suministrada se procesa cifrada y de manera confidencial y
                            nunca se vende a terceros.
                        </p>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8">5. Facturación y Suscripciones</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Nuestros servicios premium operan bajo un modelo de suscripción renovable automáticamente.
                            Usted autoriza que se le cobre recurrentemente dependiendo del ciclo seleccionado a través del método de pago de Stripe proporcionado.
                            Puede cancelar la suscripción en cualquier momento accediendo al "Portal de Pagos", tras lo cual el Servicio permanecerá activo hasta
                            finalizar el periodo prepagado y no se realizarán nuevos cargos.
                        </p>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8">6. Limitación de Responsabilidad</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Proporcionamos la plataforma "tal cual" y no podemos garantizar que el Servicio sea ininterrumpido o esté completamente libre de errores.
                            En ningún caso el equipo detrás del Software, los directores, empleados o afiliados serán responsables de daños indirectos, incidentales o
                            pérdida de beneficios resultantes del uso o imposibilidad de usar el Servicio (por ejemplo, pérdida de reseñas debido a caídas del sistema).
                        </p>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8">7. Ley Aplicable y Jurisdicción</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Estos términos se regirán e interpretarán de acuerdo con las leyes vigentes en el Espacio Económico Europeo (y específicamente en España).
                            Para la resolución de cualquier conflicto derivado del uso del servicio, las partes se someten a la jurisdicción de los tribunales correspondientes de origen del Servicio.
                        </p>


                        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-0">
                                Si tiene alguna pregunta sobre estos Términos, comuníquese con nosotros a través de nuestro soporte técnico.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
