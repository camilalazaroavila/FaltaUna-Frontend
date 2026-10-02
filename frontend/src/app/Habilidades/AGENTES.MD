# AGENTS.md — [Nombre del Proyecto] (Backend)

Instrucciones generales que se aplican a toda tarea que se te asigne en este repositorio (backend), sin importar si es un feat, fix, refactor, chore o hotfix.

---

## Estimación previa obligatoria

Antes de empezar a ejecutar cualquier tarea, SIEMPRE debés clasificarla y comunicar la estimación antes de tocar código. El formato es:

```
📋 Estimación de tarea
Dificultad: [Baja / Media / Alta]
Tiempo estimado: [rango en minutos]
Motivo: [una línea explicando por qué cae en esa categoría]
```

### Criterios de clasificación

**Baja (2-10 min)**
Cambios acotados a un solo archivo o componente, sin tocar lógica de negocio compleja. Ejemplos: ajustar un mensaje de respuesta, eliminar código muerto ya identificado, agregar un campo a un DTO o interfaz existente.

**Media (10-30 min)**
Cambios que afectan 2 a 4 archivos relacionados, o que requieren entender el flujo de datos entre controller/service/repositorio, o tocar un servicio y su consumidor. Ejemplos: corregir una validación que depende de otro módulo, refactor de un servicio puntual, agregar un endpoint nuevo con su DTO.

**Alta (30+ min)**
Cambios que afectan múltiples capas (backend + frontend), requieren migración de schema/base de datos, tocan lógica de negocio central (cálculos, permisos, estados de un proceso), o tienen alto riesgo de romper funcionalidad existente en otros módulos. Ejemplos: cambios en un modelo de datos compartido por varios módulos, refactor de servicios compartidos, cambios en flujos críticos (autenticación, pagos, pedidos).

Si después de empezar a investigar el código la tarea resulta más compleja de lo estimado inicialmente, está permitido reclasificarla y avisar antes de seguir, en lugar de continuar en silencio.

---

## Idioma de respuesta

Todas tus respuestas, resúmenes de cambios, explicaciones y comentarios en consola deben estar SIEMPRE en español. Esto incluye los resúmenes de tipo "Summary of Changes" al finalizar una tarea: deben titularse y redactarse en español ("Resumen de cambios"), sin mezclar inglés salvo en nombres propios de código (nombres de archivos, variables, funciones, clases) que no se traducen.

---

## Reglas de ejecución

- No instalar dependencias nuevas sin preguntar primero.
- No modificar código fuera del scope indicado en el prompt sin avisar y justificar por qué es necesario.
- Si una tarea de dificultad Alta requiere tocar backend y frontend, dividir el trabajo en pasos y confirmar cada paso antes de seguir al siguiente.
- Al finalizar, correr los tests/build relevantes y mostrar el resultado real, no asumir que todo funciona.
- Si la tarea es ambigua o falta contexto del negocio, preguntar antes de asumir comportamiento.

---

## Contexto técnico del proyecto (Backend)

- **Tecnologías**: Framework .NET 10 — ASP.NET Core Web API (Controllers) — Entity Framework Core (Pomelo, rama 9.x) — MySQL 8.4.
- **Arquitectura**: Clean Architecture / Ports & Adapters
- **Dominio**: El dominio del sistema gira en torno al universo de **FaltaUna**, que es un juego de colección de cartas.
- **Autenticación/Autorización**: Autenticación basada en JWT y roles