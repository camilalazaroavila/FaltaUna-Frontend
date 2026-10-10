# CONTEXT.md — Proyecto Falta Una (TPI 2026)

> Documento de contexto integral para **Claude** y agentes de IA.  
> Contiene la arquitectura del sistema, el modelo de negocio, el sistema de diseño de 3 capas, las convenciones de código y las reglas obligatorias de interacción.

---

## 1. Visión General del Proyecto

- **Nombre:** Falta Una (Trabajo Práctico Integrador — 2026)
- **Repositorio:** `FaltaUna-Frontend`
- **Dominio del Negocio:** Plataforma integral para la organización de partidos de fútbol amateur complementada con un **universo gamificado de colección de cartas intercambiables**:
  - **Jugadores / Coleccionistas:** Buscan partidos, confirman asistencia, abren sobres diarios, coleccionan cartas de jugadores con diferentes rarezas (★ a ★★★★), intercambian repetidas y canjean cupones de recompensa.
  - **Empresas / Clubes / Marcas:** Administran complejos deportivos, publican canchas y torneos, ofrecen cupones promocionales y gestionan su presencia a través de un panel especializado.
  - **Administradores y Empleados:** Supervisan el estado de reservas, validan canjes de cupones y gestionan usuarios y roles.

### Identidad de marca y copy (fuente: landing pública)

- **Tono de voz:** voseo rioplatense, frases cortas e imperativas («Abrí mi primer sobre», «Comenzá a coleccionar», «Explorá el modo empresa»). El copy de marca nunca usa infinitivo de manual ni formalidad de ustedes.
- **Vocabulario de marca:** partido, cancha, torneo, asistencia, sobre diario, carta (rareza ★ a ★★★★), álbum, intercambio, cupón, marca, descuento. Evitar sinónimos inventados.
- **Claim / tagline:** «Ganá descuentos coleccionando y jugando con cartas de tus marcas preferidas» (hero de la landing).
- **Definición de producto (verbatim de la landing):** «La plataforma donde organizás partidos de fútbol amateur y coleccionás cartas de tus marcas favoritas».
- **Audiencias por modo:**
  - `[data-modo="jugador"]` → jugadores/coleccionistas: partidos, confirmación de asistencia, sobres diarios, álbum e intercambios.
  - `[data-modo="empresa"]` → clubes/marcas: «Publicá tus canchas y torneos en minutos», «Gestioná reservas desde un panel propio», cupones y métricas de campaña.
- **Gradiente de marca:** `--landing-gradiente-amarillo-verde` (amarillo-logo → teal-profundo) con utility `bg-landing-gradiente-amarillo-verde`. Es exclusivo de bloques públicos/en modo jugador; en modo empresa la landing usa superficie crema.
- **Logos según fondo:** `Imagotipo_Alt.svg` (oscuro) sobre amarillo o gradiente claro; `Imagotipo_claro.svg` sobre fondos oscuros; `Imagotipo_Empresa.svg` en modo empresa.
- **Open decisions de marca (sin resolver):** tagline oficial definitiva, propuesta de valor consolidada para empresas y guía de tono formal — no existen como documento en el repo.

### Documentos de contexto: desalineación conocida (sin resolver)

Tres documentos describen el modelo de negocio de forma distinta y conviven sin reconciliar:

1. `context.md` (este archivo): fútbol amateur + cartas (igual que la landing).
2. `Reglas de negocio_ TCG de marcas.md`: TCG puro con pilares de cartas/sobres/misiones.
3. `FaltaUna-auth/context.md`: versión detallada alineada al modelo TCG.

**Decisión:** queda solo documentada; no se unificó a propósito (pendiente de decisión de los equipos).

---

## 2. Stack Tecnológico y Entorno de Ejecución

### Frontend
- **Framework:** Angular 20 (Standalone Components, Signals API, `ChangeDetectionStrategy.OnPush`).
- **Estilos:** Tailwind CSS v4 (vía `@tailwindcss/postcss`), SCSS modular y sistema de diseño en 3 capas dividido por dominio en `src/estilos/` (índice en `styles.css`).
- **Iconografía:** `@ng-icons/phosphor-icons` y `@ng-icons/heroicons` (registrados centralizadamente en `app.config.ts`), más `@fortawesome/fontawesome-free`.
- **Notificaciones (Toasts):** `ngx-sonner` (`<ngx-sonner-toaster>`) acoplado a los tokens de feedback.
- **Animaciones:** GSAP 3.15+ encapsulado en `GsapService`.
- **Testing:** Jest 30 (`jest-preset-angular`) — *no Karma*.
- **Linter & Formateo:** ESLint + Prettier.
- **Puerto de desarrollo:** `http://localhost:4300` (definido en `angular.json`).

### Backend
- **Framework:** .NET 10 — ASP.NET Core Web API (Controllers).
- **Arquitectura:** Clean Architecture / Ports & Adapters con carpetas en español (`Controladores`, `Aplicacion/CasosDeUso`, `Aplicacion/Interfaces`, `Dominio/Modelos`, `Infraestructura/Persistencia`).
- **ORM:** Entity Framework Core con proveedor Pomelo MySQL (`9.0.20`, fijado a la rama 9.x).
- **Seguridad:** Autenticación basada en JWT y autorización por roles.
- **Puerto de la API:** `http://localhost:5142` (Swagger disponible en `/swagger`).

### Base de Datos
- **Motor:** MySQL 8.4 LTS administrado mediante Docker Compose (`docker-compose.yml`).
- **Contenedor:** `tpi2026-mysql` en puerto `3306` (Base: `tpi2026`, Usuario: `tpi2026`, Password: `tpi2026_dev`).
- **Persistencia:** Volumen Docker `mysql_data`.

---

## 3. Sistema de Diseño (Impeccable Design System)

El diseño está dividido por dominio en `frontend/src/estilos/` y se importa desde `frontend/src/styles.css`, que ahora es solo un **índice** de `@import` (no contiene reglas). `frontend/src/styles.scss` sigue importando `styles.css`, por lo que `angular.json` y los consumidores no cambian. Sigue una estricta **arquitectura en 3 capas** auditada con 0 anti-patrones por la herramienta **Impeccable**:

```
Capa 1: Primitivos   → Colores base (#hex crudos)
Capa 2: Semánticos   → Tokens de rol y función para [data-modo="jugador"] y [data-modo="empresa"]
Capa 3: Componentes  → Clases y utilidades Tailwind que consumen SOLO semánticos
```

Estructura de `src/estilos/` (cada archivo agrupa un dominio y conserva sus comentarios):

```
estilos-fundamentos/  primitivos.css (Capa 1), base.css (ESTILOS BASE + TIPOGRAFÍAS)
estilos-roles/        jugador.css, empresa.css (Capa 2: identidad, superficies, auth, sombras, texto)
estilos-feedback/     feedback.css (5 tokens por estado), alertas.css (--estado-*), toast.css (ngx-sonner)
estilos-componentes/  botones.css (--btn-*), cartas.css (rarezas y --carta-*), sobres.css (--sobre-*)
estilos-paginas/      landing.css (LANDING PÚBLICA + escala fluida), layout.css (ESTRUCTURA DE PÁGINA)
estilos-tailwind/     tema.css (@theme inline completo), utilidades.css (@custom-variant habilitado + @utility)
estilos-animaciones/  animaciones.css (keyframes, .animate-*, reduced-motion)
```

> ⚠️ **REGLA DE ORO DE DISEÑO:** Los componentes nunca usan valores `#hex` directos. Si se necesita un nuevo color o variante, primero se define el token semántico.

### ¿Dónde agrego un token nuevo?
Elegí el archivo por **dominio**, no por capa: color de marca/superficie → `estilos-roles/jugador.css` y `estilos-roles/empresa.css`; un estado de feedback → `estilos-feedback/feedback.css`; un badge de estado → `estilos-feedback/alertas.css`; un botón → `estilos-componentes/botones.css`; carta/rareza o vista "Mis cartas" → `estilos-componentes/cartas.css`; sobre → `estilos-componentes/sobres.css`; landing → `estilos-paginas/landing.css`; layout → `estilos-paginas/layout.css`. Si el token es de un modo (jugador/empresa), va en el archivo de su dominio con el bloque de **jugador primero y empresa después**. Después, si debe generar utilidad Tailwind, agregá el mapeo en `estilos-tailwind/tema.css`.

> ⚠️ **REGLA DE ORDEN (jugador → empresa):** `:root, [data-modo="jugador"]` y `[data-modo="empresa"]` tienen la misma especificidad, así que gana el último bloque cargado. Por eso, para cada token, el bloque de empresa va **siempre después** del de jugador: dentro de un mismo archivo de dominio (feedback, alertas, botones) o en un archivo que se importe más tarde (`estilos-roles/empresa.css` se importa después de `estilos-roles/jugador.css`). El orden de los `@import` del índice está definido para respetar esta regla.

### Modos y Temas (`data-modo`)
Se alternan cambiando el atributo en el elemento raíz (por ejemplo `<html data-modo="jugador">`):

| Atributo | Tema | Descripción Visual y Paleta |
| :--- | :--- | :--- |
| `[data-modo="jugador"]` *(Default)* | **Oscuro Deportivo** | Fondo teal profundo (`#0D3B40`, `#214448`), marca principal verde cancha (`#3BD972`), acentos amarillo crema cálido (`#F2EEAE`) y texto blanco suave (`#F4FAF6`). |
| `[data-modo="empresa"]` | **Claro Editorial** | Fondo crema suave (`#FCEFE0`), tarjetas blancas, marca violeta corporativo (`#675679`), acento verde institucional de alto contraste (`#04862B`) y texto teal profundo (`#0A2E36` con ratio WCAG AAA > 11:1). |

### Escala de Feedback (5 Tokens por Estado)
Cada estado de interacción provee 5 variantes para evitar la fatiga visual y asegurar contraste accesible:
- **Éxito (`--exito`)**: Partidos confirmados, canjes aceptados y reservas acreditadas.
- **Error (`--error`)**: Cupos agotados, pagos rechazados o fallos de red.
- **Advertencia (`--advertencia`)**: Asistencia pendiente de confirmación o tiempos límite.
- **Atención (`--atencion`)**: Cartas nuevas, sobres diarios disponibles y anuncios destacados.
- **Información (`--info`)**: Tips, reglas de la cancha y descripciones informativas.

### Tipografías
- **Headings / Títulos:** `'Russo One'`, `'Rock Salt'` (Google Fonts, estilo display rústico/urbano similar a Rockstone).
- **Lectura / Cuerpo:** `'Merriweather'` (serifa de pantalla con excelente legibilidad y contraste visual).
- **Controles UI:** `system-ui` (botones, formularios, tablas y badges).

### Tokens de Forma y Sombra
- **Radios:** `--radio-sm` (`0.375rem`), `--radio-md` (`0.75rem`), `--radio-lg` (`1.25rem`), `--radio-pildora` (`9999px`), `--radio-circulo` (`50%`).
- **Sombras:** `--sombra-baja`, `--sombra-media`, `--sombra-alta`, `--sombra-brillo-verde` (adaptadas automáticamente al modo oscuro o claro).

---

## 4. Estructura de Directorios

```
FaltaUna-Frontend/
├── .agent/                    → Workflows y skills para agentes IA (Impeccable, etc.)
├── .github/                   → Workflows de CI/CD
├── backend/                   → API ASP.NET Core (.NET 10)
│   ├── src/TPI2026.API/
│   │   ├── Controladores/     → Endpoints HTTP
│   │   ├── Aplicacion/        → CasosDeUso e Interfaces (Puertos)
│   │   ├── Dominio/           → Entidades puras de negocio
│   │   └── Infraestructura/   → Adaptadores EF Core, repositorios y base de datos
│   └── dotnet-tools.json
├── database/                  → Scripts SQL y seeds de prueba
├── docs/                      → Documentación técnica y guía de arranque
├── frontend/                  → Aplicación cliente Angular 20
│   ├── src/
│   │   ├── app/
│   │   │   ├── compartidos/ui/→ Componentes de UI atómicos (boton, badge, etc.)
│   │   │   ├── modelos/       → Interfaces TypeScript de dominio
│   │   │   ├── servicios/     → Servicios HTTP y utilidades (usuario.service, gsap.service)
│   │   │   ├── app.config.ts  → Configuración global (iconos, routing, providers)
│   │   │   ├── app.html / ts  → Componente raíz
│   │   │   └── app.routes.ts  → Definición de rutas
│   │   ├── estilos/           → Sistema de diseño dividido por dominio (lo importa styles.css)
│   │   │   ├── estilos-fundamentos/  → primitivos.css, base.css
│   │   │   ├── estilos-roles/        → jugador.css, empresa.css
│   │   │   ├── estilos-feedback/     → feedback.css, alertas.css, toast.css
│   │   │   ├── estilos-componentes/  → botones.css, cartas.css, sobres.css
│   │   │   ├── estilos-paginas/      → landing.css, layout.css
│   │   │   ├── estilos-tailwind/     → tema.css, utilidades.css
│   │   │   └── estilos-animaciones/  → animaciones.css
│   │   ├── styles.css         → Índice: importa el sistema de diseño de src/estilos/
│   │   └── styles.scss        → Importador maestro de estilos
│   ├── angular.json           → Configuración de build y serve (puerto 4300)
│   ├── package.json           → Dependencias y scripts
│   └── tsconfig.json
├── docker-compose.yml         → Servicio MySQL 8.4 local
└── context.md                 → Este archivo
```

---

## 5. Convenciones de Desarrollo Frontend

1. **Componentes Standalone:** Todo componente nuevo debe ser `standalone: true` (comportamiento por defecto en Angular 20) e importar explícitamente solo lo que utiliza en su arreglo `imports`.
2. **Angular Signals:** Priorizar el uso de Signals para estado e inputs (`input()`, `input.required()`, `output()`, `computed()`, `signal()`).
3. **Change Detection:** Aplicar siempre `changeDetection: ChangeDetectionStrategy.OnPush`.
4. **Separación de Responsabilidades:** Los componentes nunca realizan peticiones HTTP directas ni gestionan lógica de persistencia; delegan siempre en un archivo dentro de `servicios/`.
5. **Accesibilidad (A11y):**
   - Todo botón o enlace sin texto visual debe incluir `aria-label` o `aria-labelledby`.
   - Mantener el foco visible con `:focus-visible`.
   - Respetar `prefers-reduced-motion` en animaciones.
6. **Idiomas:**
   - Código de negocio, modelos, variables y comentarios en **español** (`usuario`, `partido`, `boton`, `obtenerUsuarios`).
   - Respetar nombres técnicos universales de librerías (`inject`, `computed`, `OnInit`).

---

## 6. Reglas Obligatorias para Claude (Instrucciones de AGENTS.md)

Al interactuar con este repositorio y ejecutar tareas, Claude debe seguir estrictamente estas directivas:

### 1. Estimación Previa Obligatoria
Antes de modificar código, clasificar la tarea y emitir la estimación con el formato exacto:
```
📋 Estimación de tarea
Dificultad: [Baja / Media / Alta]
Tiempo estimado: [rango en minutos]
Motivo: [una línea justificando la categoría]
```
- **Baja (2-10 min):** Cambios acotados a 1 archivo/componente sin lógica compleja (ej. añadir un badge, campo menor en modelo).
- **Media (10-30 min):** Afecta 2 a 4 archivos relacionados (ej. nuevo componente UI con tests, servicio + consumidor).
- **Alta (30+ min):** Multi-capa, cambios en modelos compartidos, flujos críticos (auth, pagos) o migraciones.

### 2. Idioma de Respuesta
- **Todas las respuestas, explicaciones, resúmenes de cambio y comentarios deben estar 100% en español.**
- Los resúmenes al finalizar una tarea deben titularse `Resumen de cambios`.

### 3. Reglas de Ejecución y Calidad
- **No instalar dependencias nuevas** sin consultar y justificar previamente.
- **No modificar archivos fuera del alcance** solicitado sin aviso previo.
- **Validación continua:** Al finalizar cambios en frontend, correr y verificar:
  - `npm run lint` en `frontend/` (0 advertencias/errores).
  - `npm test -- --watch=false` en `frontend/` (todas las pruebas pasando con Jest).
  - `npm run build` en `frontend/` (compilación exitosa).

---

## 7. Comandos Frecuentes

```bash
# Frontend
cd frontend
npm start              # Servidor local en http://localhost:4300
npm run lint           # ESLint con corrección automática
npm test               # Ejecutar suites con Jest
npm run build          # Compilar bundle de producción

# Backend
cd backend/src/TPI2026.API
dotnet run             # Levantar API en http://localhost:5142

# Base de datos
docker compose up -d   # Iniciar MySQL 8.4 local
docker compose ps      # Verificar estado y salud
docker compose down    # Detener manteniendo datos
```
