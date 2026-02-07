# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

🚨 Estado actual: NO hagas publicidad todavía

Ahora mismo es un MVP técnico/demo, no un producto listo para clientes reales pagando. El problema crítico es el localStorage:

Si el dueño del restaurante borra caché del navegador → pierde todos los comentarios y datos
No puede acceder desde el móvil y PC simultáneamente (datos desincronizados)
Cualquiera puede ver las contraseñas abriendo DevTools
No hay notificaciones cuando llega un comentario nuevo
Hacer publicidad ahora sería como abrir un restaurante con la cocina en obras. Los primeros clientes se frustrarán y nunca volverán.
✅ Cuando SÍ tendrá potencial (roadmap mínimo):

1. Backend real (imprescindible)
Firebase (gratis para empezar) o Supabase
Base de datos PostgreSQL/MongoDB
Autenticación segura (Firebase Auth)
Notificaciones push cuando llegue un comentario

2. Sistema de pagos real
Stripe integrado para cobrar los planes automáticamente
Trial de 14 días sin tarjeta (para que prueben sin compromiso)

3. Features que diferencian (competir con Google Forms/TripAdvisor):
Análisis IA: "Tus clientes se quejan principalmente del tiempo de espera los fines de semana"
Competencia: Benchmark contra negocios similares de la zona ("Tu satisfacción es 20% mayor que la media")
Respuestas automáticas: Plantillas para contestar a críticas rápidamente

4. Onboarding perfecto
El camarero escanea el QR y en 30 segundos entiende cómo funciona
Tutorial interactivo para el dueño del negocio

📊 Potencial de éxito (si lo haces bien):
Mercado: SÍ existe. Los pequeños negocios (restaurantes, peluquerías, tiendas) odian depender de Google Reviews públicos donde cualquier troll les hunde la nota. Quieren feedback privado y constructivo para mejorar internamente.

Competencia directa débil:
Google Forms es feo y genérico
TripAdvisor es público y tóxico
Apps específicas como "Feedbackly" o "Belly" son caras y complejas
Tu nicho: Pequeños negocios locales que quieren algo simple, bonito y barato para escuchar a sus clientes sin complicaciones.
💡 Estrategia de lanzamiento (cuando esté lista):
Beta cerrada: 5-10 restaurantes/amigos gratis durante 2 meses para pulir bugs
Lanzamiento local: Solo en tu ciudad, visitando negocios físicamente
Viralidad orgánica: El QR de la app lleva "Powered by FeedbackFlow" pequeñito (growth hack barato)
Nicho específico: Enfócate solo en restaurantes al principio, luego expandes
Veredicto: El concepto es bueno y tiene mercado, pero ahora mismo está en "modo desarrollo". Termínala bien antes de gastar en publicidad, o quemarás la primera impresión.

🚨 Crítico (arreglar ya)

Seguridad básica: Las contraseñas siguen en texto plano en localStorage. Cualquiera puede abrir DevTools y verlas.

Solución rápida: Usar btoa() mínimo, idealmente bcrypt (aunque sin backend es limitado).


Limpieza de datos mock: Quita la lógica que inyecta automáticamente "Restaurante El Sabor" y comentarios falsos. Crea un botón "Cargar datos demo" opcional, pero que no se mezclen con datos reales.

Validación de sesión: Si borro el localStorage manualmente o caduca, la app debería redirigir al login, no quedarse en blanco o con datos rotos.


🛠️ Funcionalidades MVP que faltan

-Editar perfil del negocio: No veo dónde cambiar el nombre, descripción o agregar un logo. Ahora mismo "Nordeste" aparece sin descripción ("Tu opinión nos importa" es genérico).

Notificaciones visuales: Un badge o indicador cuando llega un nuevo comentario (ahora hay que recargar para verlos).

-Fechas reales: Los comentarios muestran "5 feb 2026" (futuro), deberían ser timestamps reales.
Búsqueda/filtros avanzados: Buscar comentarios por palabra clave, filtrar por fechas (últimos 7 días, mes, etc.).

✨ UX/UI mejoras

Página pública del negocio: Ahora vas directo al formulario. Sería mejor que /feedback/[id] muestre primero una mini-página del local (foto, descripción, rating promedio) y luego el botón "Dejar comentario".

-Skeleton loading: En lugar del spinner genérico, usar placeholders tipo Facebook mientras cargan los datos.

🚀 Features para planes Pro/Enterprise (monetización real)
Exportar datos: Botón "Descargar Excel/PDF" con todos los comentarios y stats (mencionado en tus planes pero no implementado).

Estadísticas evolutivas: Gráfico de líneas mostrando satisfacción a lo largo del tiempo, no solo números actuales.

Múltiples locales: Para el plan Enterprise, poder cambiar entre "Nordeste Sucursal Centro", "Nordeste Sucursal Norte", etc.

Personalización del QR: Subir logo propio en el centro del QR, cambiar colores a los de la marca (ya tienes estilos predefinidos, pero faltaría custom hex colors).

Comentarios con fotos: Permitir adjuntar imágenes (plan Pro).
💡 Quick wins que puedes hacer hoy

Borrar datos de prueba: Limpiar ese feedbackflow_businesses huérfano.
Página 404: Si accedo a /feedback/biz_inventado, mostrar "Negocio no encontrado" bonito en lugar de crash.