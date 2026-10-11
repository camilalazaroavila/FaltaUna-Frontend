import {
  IntegranteEquipo,
  PlanEmpresa,
  PreguntaFrecuente,
} from '../modelos/landing-empresa.model';

export const PLANES_EMPRESA: PlanEmpresa[] = [
  {
    id: 'basico',
    nombre: 'Básico',
    variante: 'azul',
    alineacion: 'izquierda',
    beneficios: [
      { texto: 'Campaña de colección personalizada', icono: 'megafono' },
      { texto: 'Mayor visibilidad para tu marca', icono: 'ojo' },
      { texto: 'Hasta 12 cartas coleccionables', icono: 'cartas' },
    ],
  },
  {
    id: 'standard',
    nombre: 'Standard',
    variante: 'violeta',
    alineacion: 'derecha',
    beneficios: [
      { texto: 'Campaña de colección personalizada', icono: 'megafono' },
      { texto: 'Estadísticas de participación', icono: 'estadisticas' },
      { texto: 'Mayor visibilidad para tu marca', icono: 'ojo' },
      { texto: 'Hasta 20 cartas coleccionables', icono: 'cartas' },
    ],
  },
  {
    id: 'premium',
    nombre: 'Premium',
    variante: 'degradado',
    alineacion: 'izquierda',
    beneficios: [
      { texto: 'Campaña de colección personalizada', icono: 'megafono' },
      { texto: 'Estadísticas de participación', icono: 'estadisticas' },
      { texto: 'Mayor visibilidad para tu marca', icono: 'ojo' },
      { texto: 'Diseño exclusivo con identidad de marca', icono: 'paleta' },
      { texto: 'Hasta 30 cartas coleccionables', icono: 'cartas' },
    ],
  },
];

export const PREGUNTAS_FRECUENTES_EMPRESA: PreguntaFrecuente[] = [
  {
    pregunta: '¿Cuánto demora la creación de mi álbum?',
    respuesta:
      'El tiempo estimado de creación de tu álbum personalizado es entre 24 y 48 horas hábiles desde que confirmás tu pedido y nos enviás toda la información necesaria.',
  },
  {
    pregunta: '¿Puedo cambiar una imagen que no me gustó?',
    respuesta:
      'Sí. Podés solicitar modificaciones en las imágenes o en el diseño dentro del plazo de revisión acordado, antes de la aprobación final para imprimir o publicar.',
  },
  {
    pregunta: '¿Puedo agregar, eliminar o editar cartas después de publicarlo?',
    respuesta:
      'Una vez publicado el álbum, las cartas no se pueden editar. Sin embargo, podés planificar cambios para una nueva campaña o versión del álbum.',
  },
  {
    pregunta: '¿Puedo tener más de un álbum activo al mismo tiempo?',
    respuesta:
      'Sí. Dependiendo de tu plan, podés gestionar múltiples campañas activas desde tu panel de empresa.',
  },
  {
    pregunta: '¿Qué pasa con el álbum cuando termina la campaña?',
    respuesta:
      'Al finalizar la campaña, el álbum pasa a estado finalizado. Los usuarios ya no podrán obtener nuevas cartas, pero conservarán las que ya coleccionaron.',
  },
  {
    pregunta: '¿Los usuarios siguen viendo las cartas de una campaña finalizada?',
    respuesta:
      'Sí. Los usuarios que participaron pueden seguir viendo su colección de esa campaña finalizada en su perfil, aunque no se generen nuevas cartas.',
  },
];

export const INTEGRANTES_EQUIPO_EMPRESA: IntegranteEquipo[] = [
  { nombre: 'Juli' },
  { nombre: 'Mateo C' },
  { nombre: 'Gonza' },
  { nombre: 'Mateo' },
  { nombre: 'Cami' },
  { nombre: 'Joaco' },
  { nombre: 'Tori' },
];
