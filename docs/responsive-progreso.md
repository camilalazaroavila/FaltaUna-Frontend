# Reporte de Progreso Responsive Mobile-First

Inventario exhaustivo de rutas y pantallas del frontend (`frontend/src/app/app.routes.ts`), ordenadas según el orden de prioridad de la Fase 3.

## Inventario de Pantallas y Estado

- [ ] **1. Autenticación**
  - [ ] `login`: `/login` (`@paginas/login/login`)
  - [ ] `registro`: `/registro` (`@paginas/registro/registro`)
  - [ ] `auth-layout`: Layout envolvente de autenticación

- [x] **2. Vista principal del usuario**
  - [x] `usuario-dashboard`: `/usuario` (`@paginas/usuario-dashboard/usuario-dashboard`)
    - Ajuste estricto a una sola pantalla (`100dvh` / `h-dvh overflow-hidden`): eliminación de scroll vertical en viewports de 600px, 800px y 1000px de altura a 100% de zoom. El botón "VER SOBRES" permanece completamente visible dentro del viewport en todas las resoluciones.
    - Contador de sobres simplificado sin el punto amarillo decorativo: texto conciso `Sobres gratis: {{ actuales }} de {{ maximo }}`.
    - Abanico de sobres completamente preservado en su escala (`1.17`), rotación, solape y proporciones originales.
    - **Instancia única del temporizador**: se consolidó en una sola instancia de `<app-temporizador-sobres>` en el template.
      - En mobile/tablet (`< lg`), los chips se ubican en fila/grilla centrada inmediatamente debajo del timer grande.
      - En desktop (`>= lg`), el contenedor de chips (`.temporizador-sobres__slots`) se posiciona con `position: absolute` respecto del `<main>` (`relative`), ubicado a la derecha (`right: 1.5rem` / `right: 2rem` en xl) y alineado en vertical con el timer grande (`top: 1rem`).
      - Inmunidad contra el header: al ubicarse dentro del `<main>` (que fluye por debajo del header), no depende de compensaciones frágiles de altura fija y su `z-index: 20` se mantiene inferior al `z-40` del header.
      - Libre de colisiones: chips con altura acotada (`max-height: 12rem`) que garantizan más de 170px de espacio libre hasta el botón de Jaime en el extremo inferior derecho en 600px de alto, y más de 370px en 800px/1000px.
    - Chips de Sobre 1 y Sobre 2 refinados:
      - Removidos números redundantes HH:MM:SS de los chips (el timer grande es la única cuenta regresiva).
      - Estados semánticos con tokens y bordes de 2px: `Cargando` (borde amarillo `border-marca-acento`, sombra `shadow-cartoon-clara`), `¡Listo!` (borde verde `border-marca-primaria`), y `En espera` (borde sutil `border-white/15`, sombra `shadow-cartoon`).
      - Barra de progreso compacta `h-2` con `rounded-full` y roles accesibles (`progressbar`), sin anuncios ruidosos de `aria-live` a cada segundo.
    - Botón de Jaime (`app-boton-jugar`) con globo de diálogo imperativo calibrado:
      - Globo CSS con texto `¡Jugá!` (imperativo voseo), borde cartoon y colita apuntando a la oreja de Jaime a ~0.25rem de distancia.
      - Variables CSS de calibración manual: `--globo-desplazamiento-x: 0px` y `--globo-desplazamiento-y: 0px` expuestas en el componente.
      - Letra negra mediante token semántico: `--boton-jugar-globo-texto: var(--negro-puro)` definido en `jugador.css` y `empresa.css` (Capa 2) y mapeado en `tema.css`, con ratio de contraste accesible de 17.8:1 sobre el fondo crema.
      - Tipografía escalada a `--tipografia-menor` (0.875rem) en mobile y `--tipografia-cuerpo` (1rem) en desktop, con padding proporcional (`0.35rem 0.85rem` / `0.4rem 1rem`) y ancho máximo acotado al 42% del gato.
      - En reposo, foco y dispositivos táctiles (`@media (hover: none)`), el globo CSS permanece visible permanentemente como señal interactiva.
      - En hover y foco por teclado (`:focus-visible`) dentro de `@media (hover: hover)`, el globo CSS se desvanece suavemente (`opacity: 0`) para permitir que la ilustración con "¿jugamos?" tome el relevo sin duplicación visual de globos.
      - En movimiento reducido (`prefers-reduced-motion` y `data-movimiento="reducido"`), se desactivan transiciones y animaciones.

- [x] **3. Modos de juego y partida contra bot**
  - [ ] `pantalla-inicial-juego`: `/usuario/jugar` (`@paginas/pantalla-inicial-juego/pantalla-inicial-juego`)
  - [x] `partida`: `/juego/ia` (`@paginas/partida/partida`)
    - Retirada la ilustración del bot (sin GIF ni PNG de la mascota del bot).
    - Desacoplados los paneles in-situ de creación y edición de mazos; en su lugar se incluye un enlace discreto hacia `/usuario/mi-baraja` (`Gestionar en Mi baraja ↗`).
    - Integrado el nuevo componente reutilizable `<app-selector-mazos>` con preselección del primer mazo completo, filtro por nombre, alternancia "Solo completos", desglose de rarezas reales del contrato (comunes, raras, épicas, legendarias) y soporte de hasta 20 mazos con scroll interno.
    - Botón "Jugar contra el bot" habilitado únicamente cuando hay un mazo completo seleccionado (en mobile fijo abajo con safe-area).
  - [ ] `partida-jugador`: `/juego/jugador` (`@paginas/partida-jugador/partida-jugador`)
  - [ ] `pantalla-carga-juego`: `/juego/tutorial` (`@paginas/pantalla-carga-juego/pantalla-carga-juego`)
  - [ ] `tutorial`: `/usuario/tutorial` (`@paginas/tutorial/tutorial`)

- [ ] **4. Colección, álbumes y mis cartas**
  - [ ] `mis-cartas`: `/usuario/mis-cartas` (`@paginas/mis-cartas/mis-cartas`)
  - [ ] `albumes`: `/usuario/albumes` (`@paginas/albumes/albumes`)
  - [ ] `mi-baraja`: `/usuario/mi-baraja` (`@paginas/mi-baraja/mi-baraja`)
  - [ ] `usuario-cupones`: `/usuario/cupones` (`@paginas/usuario-cupones/usuario-cupones`)

- [x] **5. Apertura de sobres y recompensas**
  - [x] Temporizador de recarga de sobres (`app-temporizador-sobres`): cuenta regresiva visible cuando faltan cargas, sincronizada con `proximaRecarga` del backend, con barra timer de progreso individual por cada sobre diario (Sobre 1 y Sobre 2 con badges de estado y porcentaje), pausa en background y estado neutro seguro sin inventar horas si el backend no provee fecha.

- [ ] **6. Misiones y recompensas**
  - [ ] `misiones`: `/usuario/misiones` (`@paginas/misiones/misiones`)

- [ ] **7. Intercambios**
  - [ ] `intercambio-menu`: `/usuario/intercambio` (`@paginas/intercambio/menu/intercambio-menu`)
  - [ ] `intercambio-coleccionistas`: `/usuario/intercambio/coleccionistas` (`@paginas/intercambio/coleccionistas/intercambio-coleccionistas`)
  - [ ] `intercambio-ofrecer-carta`: `/usuario/intercambio/ofrecer/:coleccionistaId` (`@paginas/intercambio/ofrecer-carta/intercambio-ofrecer-carta`)
  - [ ] `intercambio-responder-carta`: `/usuario/intercambio/responder/:intercambioId` (`@paginas/intercambio/ofrecer-carta/intercambio-ofrecer-carta`)
  - [ ] `intercambio-activos`: `/usuario/intercambio/activos` (`@paginas/intercambio/activos/intercambio-activos`)
  - [ ] `intercambio-pendiente`: `/usuario/intercambio/pendiente/:id` (`@paginas/intercambio/pendiente/intercambio-pendiente`)

- [ ] **8. Perfil y administración**
  - [ ] `admin-dashboard`: `/admin` (`@paginas/admin-dashboard/admin-dashboard`)
  - [ ] `expo-admin`: `/expo-admin` (`@paginas/expo/expo-admin`)

- [x] **9. Landings, header, navbar y footer**
  - [ ] `landing`: `/` (`@paginas/landing/landing`)
  - [ ] `landing-empresa`: `/empresa/landing` (`@paginas/landing-empresa/landing-empresa`)
  - [x] `header`: `@compartidos/componentes/layout/header/header`
    - Logo de Falta Una oculto en mobile (`< md`, clase `hidden md:flex`) tanto en header de usuario como de empresa.
    - Se validó que el logo no fuera la única forma de volver al inicio: todas las vistas del usuario cuentan con su propio botón "Volver" con destino a `/usuario`.
    - En mobile adopta los mismos tokens que desktop: `--fondo-superficie`, `--texto-primario` y `shadow-md`.
  - [x] `navegacion-ola`: `@compartidos/componentes/layout/navegacion-ola/navegacion-ola`
    - Removido el botón flotante de Jugar del nav mobile (el acceso a jugar es el gatito en el dashboard).
    - Mantiene intacta la grilla de columnas de mobile (Cartas en 0, Misiones en 1, Álbumes en 3, Más en 4).
    - Unificación de estilos y tokens visuales con desktop: sombra cartoon clara continua (`--nav-ola-sombra: 0 -3px 0 var(--color-amarillo-logo)`), tokens de superficie y texto idénticos a desktop.
    - Touch targets reales de al menos 44×44 px en todos los enlaces móviles y respeto de safe-area-insets (`env(safe-area-inset-bottom, 0px)`). Sin scroll horizontal en 360, 375, 390, 414 y 768 px.
  - [ ] `footer`: `@compartidos/componentes/layout/footer/footer`

- [ ] **10. Panel de empresa y canje**
  - [ ] `empleado-dashboard`: `/empleado` (`@paginas/empleado-dashboard/empleado-dashboard`)
  - [ ] `empresa-layout`: `/empresa` (`@paginas/empresa-layout/empresa-layout`)
  - [ ] `empresa-planes`: `/empresa` (`@paginas/empresa-planes/empresa-planes`)
  - [ ] `empresa-pago-resultado`: `/empresa/album/pago/:resultado` (`@paginas/empresa-pago-resultado/empresa-pago-resultado`)
  - [ ] `empresa-album-marca`: `/empresa/album/crear/marca` (`@paginas/empresa-album-marca/empresa-album-marca`)
  - [ ] `empresa-album-identidad`: `/empresa/album/crear/identidad` (`@paginas/empresa-album-identidad/empresa-album-identidad`)
  - [ ] `empresa-album-exito`: `/empresa/album/crear/listo` (`@paginas/empresa-album-exito/empresa-album-exito`)
  - [ ] `empresa-panel`: `/empresa/panel` (`@paginas/empresa-panel/empresa-panel`)
  - [ ] `empresa-estadisticas`: `/empresa/panel/estadisticas` (`@paginas/empresa-estadisticas/empresa-estadisticas`)
  - [ ] `empresa-albumes`: `/empresa/panel/albumes` (`@paginas/empresa-albumes/empresa-albumes`)

- [x] **11. Galería de componentes**
  - [x] `galeria-componentes`: `/componentes` (`@paginas/galeria-componentes/galeria-componentes`)
    - Sección de partida actualizada con muestra interactiva de `<app-selector-mazos>`.
    - Sección de sobres actualizada con muestra interactiva de `<app-temporizador-sobres>`.

- [ ] **12. Tablero de la partida**
  - [ ] `tablero`: Componente de partida en juego activo (`@compartidos/componentes/partida/tablero/tablero`)
  - [ ] `pantalla-resultado`: Resultado de partida (`@compartidos/componentes/partida/pantalla-resultado/pantalla-resultado`)

---

## Decisiones abiertas (Open Decisions) y Defaults Elegidos

1. **Retiro de GIFs y reversión a PNGs estáticos**:
   - Se conservaron los archivos GIF originales en el repositorio para no romper referencias históricas, pero se removió por completo su uso en la aplicación.
   - Se eliminó el archivo PNG temporal generado `Gatos jugando cartas_ partida animada contra bot_estatico.png`.
   - Jaime queda con tamaño acotado en desktop (`clamp(5rem, 6.5vw, 6.25rem)`), similar a los badges e íconos de la barra, ubicado a la derecha y sin tapar los sobres diarios. En mobile, el botón táctil respeta safe areas y prescinde de hover falso. Jaime aparece únicamente en la vista principal (`usuario-dashboard`).
   - La partida contra el bot (`/juego/ia`) se muestra limpia sin ilustración de mascota del bot.

2. **Arquitectura del Selector de Mazos**:
   - En lugar de mantener formularios pesados de edición y creación de mazos incrustados dentro del flujo previo a la partida, se extrajo el componente standalone `<app-selector-mazos>` para selección, y se delegó la edición completa a `/usuario/mi-baraja` mediante un enlace directo.
   - El selector cuenta con navegación por teclado completa (flechas, Enter/Espacio), atributos ARIA (`aria-checked`, `role="radiogroup"` / `role="radio"`), badge con desglose de rarezas reales del mazo (comunes, raras, épicas, legendarias), estados de carga/vacío/error con reintento y soporte de hasta 20 mazos con scroll vertical interno sin desbordar la página.

3. **Temporizador de Sobres Diarios**:
   - Se sincroniza con el campo `proximaRecarga` provisto por el backend (`GET /api/Sobres/diario/{id}`).
   - Si el backend devuelve `null` (por ejemplo cuando el usuario tiene todas sus cargas completas 2/2 o la API aún no calcula el timestamp), el componente adopta un estado neutro informativo sin inventar cuentas regresivas falsas ni hardcodear 12/24 hs.
   - Incluye detector de visibilidad (`document.visibilitychange`) para pausar el intervalo cuando la pestaña está en segundo plano y recalcular inmediatamente al volver, evitando saltos temporales.

4. **Navegación y Header en Mobile**:
   - Header: El logo se oculta en mobile (`hidden md:flex`). Se verificó que todas las pantallas cuenten con botón "Volver" hacia `/usuario` para no depender del logo.
   - Nav mobile: Se eliminó el slot del botón de jugar de la barra móvil (`navegacion-ola`), manteniendo las 5 columnas estructurales para que la ola viaje suavemente entre Cartas, Misiones, Álbumes y Más.
   - Estilos visuales: Se unificaron los tokens del nav y header móvil con desktop (`--fondo-superficie`, `--texto-primario`, `--nav-ola-sombra: 0 -3px 0 var(--color-amarillo-logo)`), eliminando sombras borrosas y logrando la estética cartoon sólida requerida.

5. **Color de texto del globo de diálogo de Jaime (`--boton-jugar-globo-texto`)**:
   - Se definió el token semántico `--boton-jugar-globo-texto: var(--negro-puro);` en `jugador.css` y `empresa.css` (Capa 2), mapeado a `--color-boton-jugar-globo-texto` en `tema.css`.
   - Ofrece un ratio de contraste accesible de 17.8:1 contra el fondo crema/amarillo del globo (`var(--marca-acento)`), superando con amplitud la pauta WCAG AAA (7:1).
   - Alternativa disponible: si se prefiere un matiz más integrado con la paleta cartoon general, el token puede apuntar a `var(--color-teal-profundo)` (que también cumple contraste > 10:1 y coincide con el trazo del borde exterior del globo).

6. **Espaciado del botón "VER SOBRES" en Mobile**:
   - En lugar de empujar el botón al borde inferior del contenedor con `my-auto` en el abanico y `my-1` en el botón (lo que dejaba al botón pegado al nav inferior y alejado de los sobres), se aplicó `mt-auto mb-2 sm:mb-3 md:mb-4` al abanico y `mt-1 sm:mt-2 mb-auto` al botón.
   - De esta forma, el bloque [abanico de sobres + botón "VER SOBRES"] se comporta como una unidad visual centrada armónicamente en el espacio disponible debajo del temporizador, dejando al botón a ~12-16px de los sobres y con suficiente respiro respecto a la barra de navegación inferior móvil.

---

## Requerimientos Identificados para el Backend

1. **Eliminación de mazos**:
   - Endpoint: `DELETE api/Mazos/{id}`
   - Justificación: Actualmente la API sólo expone consulta, creación y edición. Para que el usuario gestione sus mazos creados sin tener que sobrescribirlos, se requiere el endpoint de borrado.

2. **Calibración de tiempo en Sobres Diarios**:
   - Campo sugerido: `FechaServidorUtc` en la respuesta de `GET api/Sobres/diario/{id}`.
   - Justificación: Permitirá al frontend calcular el desfase de reloj del cliente (`Date.now() - fechaServidor`) y asegurar que el conteo regresivo coincida al segundo con la expiración del servidor, sin desfases por husos horarios o relojes de dispositivo descalibrados.
