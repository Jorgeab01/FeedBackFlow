export interface ChangelogItem {
    id: string;
    version: string;
    date: string;
    title: string;
    description: string;
    features: string[];
}

export const changelogData: ChangelogItem[] = [
    // {
    //     id: 'v1.1.2',
    //     version: '1.1.2',
    //     date: '28 Feb 2026',
    //     title: 'Análisis Inteligente y Código QR mejorado',
    //     description: 'Hemos añadido potentes funciones de inteligencia artificial para ayudarte a entender mejor a tus clientes y solucionado el problema con la descarga de los códigos QR.',
    //     features: [
    //         'Nuevo widget "AI Helper" (Pro) para generar resúmenes ejecutivos de tus comentarios recientes.',
    //         'Identificación automática de las 3 fortalezas y 3 debilidades principales de tu negocio.',
    //         'Chat contextual asistido por IA para hacer preguntas específicas sobre el feedback recibido.',
    //         'El código QR ahora se descarga como una imagen perfecta con bordes curvos y tu logotipo incluido.',
    //         'Rediseño en la disposición del panel de control para una lectura más cómoda en todos tus dispositivos.'
    //     ]
    // }
];
