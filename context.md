# CONTEXT.md — Proyecto Falta Una (TPI 2026)

> Documento único de contexto para **Claude** y agentes de IA.
> Unifica las reglas de negocio del TCG de marcas, la arquitectura, el sistema de diseño, las convenciones de código y las reglas obligatorias de interacción.
> **Reemplaza** a la versión anterior de `context.md` y a `Reglas de negocio_ TCG de marcas.md`. Ya no existe ninguna relación con fútbol, canchas, torneos ni reservas.
>
> Convenciones del documento: **Pendiente** = falta definición del equipo. **A confirmar** = hay una regla propuesta que el equipo debe validar. **⚠️ Conflicto** = dos fuentes dicen cosas distintas (ver sección 12).

---

## 1. Visión General del Proyecto

- **Nombre:** Falta Una (Trabajo Práctico Integrador — 2026)
- **Repositorio:** `FaltaUna-Frontend`
- **Qué es:** plataforma de **coleccionismo digital** donde el jugador colecciona álbumes de marcas y los completa para **canjear cupones de descuento reales**. Tres pilares: **coleccionar, jugar e intercambiar**.
- **Quién paga:** el **jugador no paga nada**. Paga la **empresa/marca** mediante un plan, a través de Mercado Pago. No hay compra de sobres ni moneda para el jugador.
- Las "cartas de Falta Una" son una colección propia del sistema, distinta de las colecciones de las marcas.
- **Pendiente:** qué entra en esta entrega (TPI) y qué queda como visión futura.

### Flujo general del producto

1. **Dos landings** (jugador y empresa), cada una con imagen principal, carrusel de marcas, explicación de la plataforma, modo empresa, preguntas frecuentes y quiénes somos.
2. Al ingresar, el jugador ve los **tres sobres más populares** del momento y recibe **sobres genéricos gratis** (ver sección 6).
3. Abre sobres, completa **álbumes** (las colecciones de cada marca) y canjea **cupones** mostrándoselos al empleado del local con un **QR y un código alfanumérico**.
4. Revisa su **colección** (con filtros), arma **mazos**, **juega** partidas e **intercambia** cartas con otros jugadores.
5. La **empresa** se registra, sube su material, elige un plan, paga y gestiona sus colecciones y métricas desde su panel. Su **empleado** valida los cupones.

---

## 2. Roles

| Rol | Permisos |
| --- | --- |
| **Jugador** | Coleccionar, abrir sobres, armar mazos, jugar, intercambiar, canjear cupones, gestionar su perfil. |
| **Admin de empresa** | Ver métricas, ver colecciones activas, subir fotos para crear colecciones, canjear cupones. |
| **Empleado** | Pertenece a una empresa (vista dentro del modo empresa). Solo canjea cupones, ingresando el código o escaneando el QR. |
| **Admin del sistema** (equipo de desarrollo) | Crea las cartas (descripción, costo, poder), balancea, crea colecciones con las imágenes provistas por las marcas y crea los efectos de zonas. |

- Autenticación con JWT y autorización por rol. Cada empresa gestiona solo lo suyo.
- No hay moderación ni baneo por ahora.

---

## 3. Registro y onboarding

- Registro con usuario, email y contraseña (únicos).
- **Paquete de bienvenida:** 36 cartas fijas organizadas en **3 mazos base de 12 cartas**. Todos los usuarios reciben los mismos.
- Las cartas de bienvenida **no se pueden intercambiar**.
- Además recibe **1 sobre genérico** al entrar.
- **Pendiente:** verificación de email y recuperación de contraseña.
- **A confirmar:** si las cartas de bienvenida cuentan para el % de completitud de la colección "Falta Una".

### Registro de empresa

- Sube el logo de su marca, la foto de su local y las cartas de su colección (**12, 20 o 30**, según el plan).
- Define el nombre del álbum, sus redes sociales y su contacto.
- Elige si el álbum tiene duración limitada o es permanente.
- Paga el plan por **Mercado Pago**.

---

## 4. Cartas

- Atributos: nombre, descripción, **poder**, **costo** (recurso de juego), rareza, imagen y categoría. Las crea el equipo.
- Cada carta pertenece a **una sola colección** y a **una categoría**.
- **Rarezas (4):** Común, Rara, Epicarta, Legendaria.
- **Toda carta tiene habilidad.** Las de mayor rareza tienen habilidades más fuertes o complejas, pero la rareza no debe volver a la carta abrumadoramente más fuerte.
- **Momentos de activación** (el motor debe ser flexible): al jugarla, al terminar la ronda, o cuando hay otra carta de cierta categoría.
- **Ejemplos de habilidades** (la lista no es cerrada): +1 de poder cada turno; +2 de poder a las cartas de la misma zona o fila; sumar a aliados cercanos; robar una carta; reemplazar la zona por una aleatoria; reducir el poder de las cartas enemigas (por ejemplo, la que está enfrente); bonificación a cartas de la misma categoría; transformarse en otra carta al azar.
- Las cartas **no se retiran** del juego.
- **Pendiente:** rangos de poder y costo por rareza.

> **Naming a resolver:** el recurso de juego (antes "maná") ahora se llama **cupón** y se representa con la imagen de un cuponcito, pero también existen los **cupones de descuento** de las marcas (sección 13). Conviene renombrar uno de los dos (por ejemplo "energía" para el recurso de juego) para evitar confusión en código y UI. El modelo de datos actual todavía usa `Mana` (`costoCupon`, `ManaActual`).

---

## 5. Categorías, marcas y colecciones

- Las **marcas son una entidad propia**. Una marca puede tener varias colecciones (álbumes), según su plan.
- Las categorías son ampliables (Comida, Ropa, Accesorios, Tecnología, Música, etc.).
- **Planes:** definen la cantidad máxima de colecciones y las cartas por colección.
  - Básico: 12 cartas por colección.
  - Intermedio: 20 cartas por colección.
  - Premium (el más caro): 30 cartas por colección.
  - **Pendiente:** nombres, precios y cantidad de colecciones por plan.
- Las colecciones son permanentes. Algunas pueden tener fecha de inicio y fin; al vencer, se desactivan **automáticamente**.
- Una colección **inactiva** nunca se borra: las cartas siguen existiendo, se pueden jugar e intercambiar, pero la imagen de la marca se reemplaza por una ilustración genérica (dibujo a mano o IA) para no hacer publicidad.
- Las colecciones pueden **reeditarse**.
- Dar de baja una colección tiene un **cooldown** para evitar altas y bajas constantes. **Pendiente:** duración.
- El % de completitud cuenta **solo cartas únicas**; las repetidas sirven para intercambiar.
- Las colecciones de "Falta Una" son del sistema y permanentes.
- En la vista de álbumes, el jugador ve las cartas que le faltan para completar cada colección y los álbumes de cada marca que consiguió.

---

## 6. Sobres

| Tipo | Cartas por sobre |
| --- | --- |
| Genérico | 5 |
| De categoría | 3 (solo de esa categoría) |
| De marca | 1 |

- **Probabilidades (sobre genérico, por carta):** 50 % Común · 30 % Rara · 15 % Epicarta · 5 % Legendaria. **Pendiente:** tablas de categoría y marca.
- Se pueden obtener **repetidas dentro del mismo sobre**.
- **Pity (garantía) por barras de progreso:** el usuario tiene una barra por tipo de sobre (genérico, categoría, marca) para no frustrarse con las legendarias. Por ejemplo, 50 sobres genéricos garantizan una legendaria. Los sobres de categoría y marca requieren menos aperturas porque son más difíciles de conseguir. El usuario puede elegir qué barra avanzar. Al salir una legendaria, la barra **vuelve a 0**. **Pendiente:** valores para categoría y marca, y si hay una barra por categoría/marca o una global por tipo.
- **Sobres diarios:** 2 por día, genéricos y no elegibles, uno cada 12 horas. No se acumulan. **A confirmar:** si es un sobre a las 00:00 y otro a las 12:00.
- Los sobres **no se compran**: se obtienen por misiones, bienvenida y otras recompensas.
- Se abren **de inmediato**. Si la apertura se interrumpe, las cartas van directo a la colección.
- Un sobre de marca **no se puede abrir** si la marca se desafilió o la colección se dio de baja.
- Hay un **límite diario de aperturas**. El intento de abrir un sobre diario de más es rechazado.
- **El servidor decide siempre qué carta sale.**

---

## 7. Economía

- **No hay moneda en el juego**: ni Oro, ni monedas de intercambio, ni cosmética por ahora.
- Las recompensas son **sobres, cartas, iconos de jugador y títulos**.
- No existe pay-to-win ni pago dentro de la app para el jugador.

---

## 8. Misiones

- **Diarias:** iniciar sesión, jugar una partida, abrir sobres (misión escalonada: 1 y luego 2).
- **Semanales:** jugar partidas, misión **escalonada** con tramos (10 / 20 / 30), con premios distintos (usualmente sobres genéricos).
- Las **victorias cuentan doble** para el progreso de la misión.
- **Por categoría:** por ejemplo, conseguir 10 cartas de Comida da un sobre de marca a elección; jugar con 1 carta de Comida en el mazo da un sobre de Comida.
- **De marca:** misiones de **una sola vez**.
- **Por volumen de partidas:** sobres genéricos, de categoría y, a mayor juego, de marca.
- **Logros/hitos:** puede haber (primera victoria, etc.).
- **Reinicio:** los martes a las 21:00. La recompensa no reclamada **se pierde**. **A confirmar:** si esto aplica también a las diarias y a qué hora se reinician.
- El premio se reclama **manualmente**, con un botón **"Reclamar todo"**.
- Algunas misiones dan más progreso por jugar en matchmaking.
- **Estado de implementación:** la vista `/usuario/misiones` consume `GET /api/Misiones` y `POST /api/Misiones/{id}/reclamar` con JWT. Las misiones diarias y semanales salen de `SeedMisiones` (equivalente a `database/seeds/05_misiones.sql`), que corre junto con `SeedSobres` al arrancar la API, así que cada recompensa apunta a un sobre real. La pestaña **Permanente** queda como placeholder y el **PT System** sigue alimentado con datos de prueba. Al reclamar, el modal abre el sobre por su `sobreId` acreditado y nunca cae al sobre diario (ese tiene su propio límite de cargas).

---

## 9. Mazos

- **12 cartas exactas**, sin copias repetidas.
- **Composición obligatoria:** 5 Comunes, 4 Raras, 2 Epicartas, 1 Legendaria.
- Máximo **20 mazos** por usuario, con nombre.
- Se puede mezclar cualquier marca y categoría.
- Si se intercambia una carta del mazo, el mazo queda **inhabilitado** hasta reemplazarla.
- Si una marca se va, solo se reemplaza la imagen de la carta; el mazo sigue válido.
- Los 3 mazos base de bienvenida son fijos.

---

## 10. Partidas

- **1 vs 1**, **6 rondas**, ambos jugadores actúan **a la vez** (estilo Marvel Snap). **Límite de 60 segundos por ronda.** (A confirmar por el backend; actualmente el backend envía 40 s).
- **Mano:** cada jugador empieza con **3 cartas** en mano y roba **1 carta por ronda**, empezando en la primera. Por eso en la primera ronda ya tiene 4.
- **Recurso de juego ("cupón"):** empieza en 1 y sube 1 por ronda hasta 6. Determina qué cartas se pueden jugar según su costo.
- **Zonas:** hay exactamente **2 zonas a la vez** (una a la izquierda y otra a la derecha) que **rotan cada turno por zonas aleatorias distintas**. Las cartas pertenecen al **LUGAR** (izquierda/derecha), no a la zona: al rotar la zona, las cartas se quedan donde estaban y solo cambian la foto, el marco y el efecto, recalculándose los puntajes de inmediato (un jugador puede pasar de golpe a tener ventaja o desventaja). Tienen efectos que afectan a ambos lados, y las cartas tienen sus propios efectos. Cada zona representa un local real de una marca (ver sección 11).
- **Revelado:** las cartas se revelan de a una, en orden; primero la del jugador que tiene el turno y luego la del rival.
- **A confirmar (revelado):** la regla exacta de quién revela primero en cada ronda.
- **Puntaje:** los puntos de las cartas jugadas quedan en el lugar/zona. Al final de cada ronda se compara: el jugador con más puntos en la zona suma **la diferencia** (ej.: 6 contra 2, gana 4; 6 contra 5, gana 1 y el rival no suma). Los puntos del rival restan a los propios, para generar competencia entre cartas. Para impedir que el rival sume hay que tener **al menos los mismos puntos** que él en esa zona. La resolución ocurre al finalizar la ronda.
- **Tablero:** las cartas se bajan desde la mano hacia los slots de cada zona. Las barras de puntos laterales, el botón de turno y el timer cuentan con medidas moderadamente ampliadas usando clamp y cqw. El botón de turno expone permanentemente su estado de acción y el contador de turno como insignia anexa ('n/6', ej. 'Realizar 1/6', 'Esperando 1/6', 'Realizando 1/6', 'Ronda final 6/6'), manteniendo el contador visible incluso en columnas angostas. Las zonas muestran a su lado un indicador visual con los íconos de las categorías afectadas (+ verde para mejoras, − rojo para reducciones). **A confirmar:** si son 6 slots por lado y la cantidad de cartas jugables por ronda.
- **Resultado:** victoria, empate o derrota. Ganás si sumaste más puntos que tu rival, empatás si sumaron lo mismo y perdés si sumaste menos. El empate no se resuelve.
- **Condición de victoria (definida por el equipo):** la partida termina por una de dos vías. Gana quien llega primero a **100 puntos acumulados**, o, si nadie los alcanza, gana quien suma **más puntos tras las 6 rondas**. Si ambos suman lo mismo al final, es empate.
- **A confirmar (detalle de la regla de 100 puntos):** qué pasa si ambos jugadores superan los 100 puntos en la misma ronda (por la resolución simultánea al final de la ronda), y si los 100 puntos son alcanzables dentro de las 6 rondas con el balance actual de cartas y zonas.
- **Desconexión y abandono** cuentan como derrota. Hay botón de **rendirse**.
- **Modos:** contra bot (práctica) y amistoso con otro usuario. Habrá **matchmaking** al final del proyecto, sin ranking ni ELO.
- **Todo cálculo se valida en el servidor.**

---

## 11. Zonas

- Están **atadas a una marca real** (por ejemplo, un local de una marca adherida). La marca solo sube la foto de su local.
- Si la marca se va, la zona se reemplaza por una genérica.
- Hay exactamente **2 zonas simultáneas en el tablero** (izquierda y derecha) que **rotan por turno** por otras aleatorias. Las cartas jugadas pertenecen al lugar y se mantienen fijas en su posición al rotar la zona.
- Tienen **efectos que potencian cartas**, creados por los desarrolladores. Se sortean al azar.
- **Pendiente:** si conservan el bonus de poder por categoría (`ZonaCategoria`) o se reemplaza por efectos.

---

## 12. Intercambios, favoritas y contradicciones abiertas

### Intercambios

- **Flujo (reglas v1, asincrónico, estilo Pokémon Pocket):** el usuario elige **una** carta suya para ofrecer, según las favoritas del rival o las que le faltan, y queda en espera. El receptor ve la oferta, acepta y elige una carta propia a cambio. Luego se confirma.
- Solo se pueden intercambiar cartas de la **misma rareza**.
- Se pueden dar repetidas o únicas; si es la única copia, solo se muestra un aviso.
- Las **cartas de bienvenida no son intercambiables**.
- **Reserva y vencimiento:** la oferta vence a los **3 días**. Las cartas ofrecidas quedan reservadas y no se pueden usar mientras tanto.
- **Sugerencias:** el sistema sugiere usuarios según favoritas y faltantes de ambos, mostrando arriba a quienes tienen las cartas que el usuario más quiere.
- **Límites:** 3 intentos de intercambio al día (se resetea al día siguiente) y máximo 10 intercambios exitosos por día.
- **Favoritas:** hasta 20 por usuario, visibles en el perfil. Sirven para saber qué cartas del usuario interesan en el panel de intercambio.
- La transferencia es **atómica**: no duplica ni intercambia dos veces la misma carta.
- **A confirmar:** qué cuenta como "intento" (¿rechazos, ofertas enviadas?).
- Se guarda en la base de datos; no hay historial visible.
- **Idea del equipo, no incluida en las reglas v1:** al finalizar un intercambio, enviar una solicitud de amistad desde el mismo panel. No hay sistema de amistades definido todavía.

### Contradicciones a resolver entre las dos fuentes

| # | Tema | Explicación del equipo | Reglas v1 |
| --- | --- | --- | --- |
| 1 | Condición de victoria | ✅ **Resuelto:** valen ambas (primero en llegar a 100 puntos, o más puntos tras 6 rondas). Queda por confirmar el desempate si ambos superan 100 en la misma ronda | — |
| 2 | Tipo de intercambio | Sincrónico (ambos conectados) | Asincrónico, con vencimiento de 3 días |
| 3 | Tablero | Slots por lado y cartas jugables por ronda (la mano ya quedó definida: 3 iniciales + 1 por ronda) | A confirmar si son 6 slots por lado y cartas jugables por ronda |
| 4 | Zonas simultáneas | ✅ **Resuelto:** exactamente 2 zonas a la vez (izquierda y derecha) que rotan cada turno por otras aleatorias; las cartas pertenecen al lugar y se mantienen al rotar | — |
| 5 | Sobres populares al ingresar | Se muestran los 3 más populares | No lo menciona |
| 6 | Solicitud de amistad | Posible tras un intercambio | No existe en el alcance |
| 7 | Nombre del recurso de juego | "Maná" como cuponcito | Se llama "cupón" y choca con los cupones de marca |
| 8 | Códigos promocionales | — | Se dijo que no hay, y también que un código se usa "una vez en total": aclarar si aplica al futuro |

---

## 13. Cupones de marca

- Se obtienen **completando una colección** (los álbumes se completan solo por colección). La marca define los hitos y los descuentos.
- El cupón es de **un solo uso** y **único por usuario**.
- **Estados:** disponible, usado, vencido.
- Se canjea mostrando al empleado un **QR y un código alfanumérico**. El empleado valida ingresando el código o escaneando el QR desde su panel.
- La marca define los **locales adheridos** al armar la colección y el **máximo de canjes** de la campaña (ej.: 10.000).
- Si el usuario pierde cartas por intercambio después de canjear, **conserva el cupón** y puede intercambiar las cartas libremente.

### Obtención de cartas fuera de sobres

- Códigos promocionales/QR: **no en esta versión**.
- Otras fuentes: recompensas por **partidas y misiones**; eventos a futuro.

---

## 14. Perfil, cosméticos, administración y métricas

- No hay nivel de usuario. El perfil incluye avatar, favoritas y estadísticas. El usuario elige un **icono** entre varios (no sube imágenes propias).
- El perfil puede ser **público o privado**. La visibilidad pública se implementa **al final** del proyecto.
- **Cosméticos:** futuro, fuera de esta etapa. **A confirmar:** hay una tensión entre "globales por usuario" y "viajan con la carta" en un intercambio; definir si se asocian a cada carta o al perfil.
- **Métricas para la marca** (en su panel de empresa). Ejemplos mencionados: partidas jugadas con sus cartas, cantidad de sobres coleccionados y cantidad de veces que sus cartas fueron marcadas como favoritas. **Pendiente:** definición final (cartas obtenidas, canjes, etc.).
- La **marca** solo ve métricas y sube fotos para crear colecciones. El **admin del sistema** crea y balancea.

---

## 15. Integridad y antifraude

- El servidor decide cartas, valida partidas y límites.
- Sobres: límite diario; intento extra rechazado.
- Intercambios: 3 intentos y 10 exitosos por día, transferencia atómica.
- Cupones únicos e irrepetibles; colecciones inactivas no generan cartas ni sobres.
- Aperturas e intercambios se guardan en la BD (sin historial visible).

---

## 16. Estado del modelo de datos

La migración inicial (`InitialCreate`, EF Core + MySQL) define las tablas: `categoria`, `coleccion`, `Usuario`, `zona`, `carta`, `cupon`, `sobre`, `intercambio`, `mazo`, `partida`, `zonacategoria`, `coleccioncarta`, `habilidad`, `usuariocarta`, `usuariocupon`, `aperturasobre`, `intercambiocarta`, `intercambiomoneda`, `matchmaking`, `mazocarta`, `jugadorpartida`, `ronda`, `zonapartida`, `aperturasobrecarta`, `cartapartida`, `resultadozona` y `zonaronda`.

Cambios necesarios para alinearlo con las reglas de negocio:

| Cambio | Detalle |
| --- | --- |
| **Eliminar** | `Usuario.Oro`, `Usuario.MonedasIntercambio`, tabla `IntercambioMoneda`; `JugadorPartida.Vida`; `DanioJugador1/2` en `ResultadoZona`. |
| **Agregar** | `Marca`, `Plan`, `Mision` y progreso por usuario, favoritas por usuario, progreso de pity por tipo de sobre, inventario de sobres, local/sucursal por colección, rol de usuario y su empresa, visibilidad del perfil, icono de perfil. |
| **Revisar** | `Cupon` hoy cuelga de `Coleccion`; debe vincularse a `Marca` e hitos. `Intercambio` necesita fecha de vencimiento y reserva de cartas. `Carta` con una sola colección (hoy `ColeccionCarta` es N:N). Cartas de bienvenida marcadas como no intercambiables. `Ronda.FechaFin` es obligatoria y debería ser opcional. Renombrar `Mana` según la decisión de naming (sección 4). `ZonaPartida` hoy tiene `ZonaId` fijo y `CartaPartida` apunta a `ZonaPartidaId`: para que las cartas no se muevan al rotar, `ZonaPartida` debe representar el lugar físico y la zona activa debe variar por ronda (`ZonaRonda` podría cubrirlo); pendiente de revisión del backend. |

> El frontend ya tiene componentes de misiones, pity, apertura de sobres y suscripción de empresa (ver estructura en la sección 5). **Misiones ya está respaldada por el backend** (`GET /api/Misiones`, `POST /api/Misiones/{id}/reclamar`) y por los seeds `SeedSobres`/`SeedMisiones`; el **PT System** y la pestaña **Permanente** siguen siendo mock/placeholder.

### Estado del tablero de partida

El tablero ([`frontend/src/app/compartidos/componentes/partida/`](frontend/src/app/compartidos/componentes/partida/)) tiene dos modos:

- **Partida real contra el bot:** `PartidaServicio` adapta el contrato de `PartidasController`/`PartidasJuegoController` y el servidor es la única fuente de verdad. La pantalla `/juego/ia` elige un mazo completo y crea la partida con `POST /api/Partidas/bot`. El front no calcula puntajes, cupones, ganadores de zona ni resultado.
- **Maqueta/galería:** sin partida real, `PartidaServicio` delega en `PartidaEstadoService` (mock), que conserva el tablero demostrativo y sus cálculos locales para la galería de componentes.

- **Jugar una carta** pasa por una única vía, `PartidaServicio.jugarCarta(carta, lugar, indice)`, reutilizada por el arrastre y por el botón de cada casilla. En modo real envía `POST /api/Partidas/{id}/jugar` con `Idempotency-Key` y aplica el estado que devuelve el servidor, sin eco optimista. En modo mock delega en `PartidaEstadoService.jugarCarta`.
- **Disponibilidad de cartas:** la mano real trae `jugable` resuelto por el servidor; una carta no jugable se muestra atenuada y no se puede arrastrar ni seleccionar. El cliente no recalcula el costo/cupón. El límite de cartas jugables por ronda sigue pendiente (sección 10).
- **Sincronización real:** reloj local cada 1 s, heartbeat cada 20 s, polling del estado cada 5 s solo con la pestaña visible y GET inmediato al volver a la pestaña. Al vencer el tiempo se envía `finalizar`; al terminar o abandonar se limpian los timers. La partida activa se guarda en `localStorage` (`faltauna_partida_activa`) para reconectar.
- **Cierre y resultado:** `finalizar` puede devolver `200` con el resultado de la ronda o `202` con el estado en espera del rival; después se relee el estado. Al finalizar la partida (por rondas, 100 puntos, rendición o abandono), se lee el resultado definitivo del servidor (`ResultadoPartidaApi` vía `ultimoResultado.fin` o `GET Partidas/{id}/resultado`) y se presenta la `PantallaResultado` modal (Victoria, Derrota, Empate o Neutro) con puntos finales, motivo accesible y botones "Jugar otra vez" y "Volver al menú". La rendición y el abandono se computan como derrota.
- **Indicadores de categoría en zonas:** cada zona del tablero consume `efectosCategoria` adaptados por el servicio a partir del contrato (`modificadores` estructurados o parseo de `zona.efecto`), representados mediante `app-indicador-categorias-habilidad` junto a la foto de la zona. Si la zona no afecta categorías, no muestra nada.
- **Cartas ocultas del rival:** el contrato manda `oculta: true`, `carta: null` y `poderActual: null`; el tablero dibuja un reverso y nunca inventa nombre, poder ni rareza.
- **Revelado y fuentes del rival (comportamiento frontend actual):** las cartas jugadas por el bot se consolidan a partir de `cartasEnMesa` y `cartasReveladas` (sustituyendo cartas ocultas previas por la carta revelada correspondiente e indexando por `cartaPartidaId` sin alterar cartas propias). Únicamente si el bot no figura en ninguna de esas dos fuentes se recurre a `zonas[].cartas` como respaldo (discrepancia de contrato pendiente de revisión con backend). Si `cartasEnMesa` llega vacío con la partida aún activa, no se reconstruye el tablero artificialmente y se registra `console.warn`.
- **Ubicación en zonas y slots:** se respetan `zonaPartidaId` e `indice` provenientes del servidor. Las zonas rotadas se indexan incorporando las zonas presentes en `zonas[].cartas` y `zonasNuevas`. Ante `indice` nulo u ocupado, se asigna el primer slot libre registrando `console.warn`. Si `zonaPartidaId` es nulo o desconocido, se emite `console.warn` y no se inventa ubicación.
- **Accesibilidad y anuncios:** al revelarse cartas del bot (detectadas contra el estado inmediato anterior, no en cada sondeo), se anuncia en `anuncioSignal` ("El bot jugó {nombre} con poder {poder} en {zona}") apoyado en el `aria-live="polite"` del tablero. El reverso mantiene `aria-label="Carta oculta del rival"` y la carta revelada el de `app-carta`.
- **Animación de revelado:** `Zona` detecta los slots rivales que se descubren y ejecuta una animación de giro y opacidad (`rotateY`, `opacity`) mediante `GsapService.duracionPartida('revelado-carta')`, desactivada si el usuario tiene activado `movimientoReducido()`.
- **Panel de resultado:** `ResultadoRonda` incluye `cartasReveladasRival`, listando de forma compacta en `app-caja` las jugadas del bot ("El bot jugó: Nombre · poder N · Zona") con componentes y tokens tipográficos existentes sin alterar el layout del tablero.
- **Dos formas de jugar:** arrastre con Pointer Events (mouse y táctil) y, como alternativa accesible, selección de la carta con la tecla **Espacio** (resalta las casillas propias vacías) y botón de la casilla; **Enter** mantiene el detalle de la carta.
- El fantasma del arrastre es `position: fixed`; su containing block es el div `.tablero` (`contain: layout` en ese div, **no** en `:host`: los popups usan `fixed` y están fuera de él, así siguen anclados al viewport). Las coordenadas se corrigen restando el rect del tablero (se le pasa como `referencia` a `app-mano`, que comparte origen con el div).
- **Chips de jugador:** sin `width: max-content` ni `container-type` propios; el nombre se muestra completo (`whitespace-nowrap`, sin `truncate`) dentro del ancho de su celda. A ~375 px el chip tiene ~276 px disponibles y los nombres mock (~10 caracteres) entran sin problemas; solo nombres de 30+ caracteres correrían riesgo de recorte.
- **Reversos de la mano rival:** `--carta-reverso` es `var(--color-teal-profundo)` con borde `var(--color-gris-teal)` y `shadow-cartoon`; cada reverso recibe `--angulo` (`-12°..12°`, abanico calculado en `Tablero.reversosRival`) y se rota con `transform-origin: bottom center`. Es un `<span>` con `role="img"` y aria-label, no un componente nuevo.

---

## 17. Stack Tecnológico y Entorno de Ejecución

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
- **Arquitectura:** Clean Architecture / Ports & Adapters con carpetas en español (`Controladores`, `Aplicacion/CasosDeUso`, `Aplicacion/Interfaces`, `Dominio`, `Infraestructura/Persistencia`).
- **ORM:** Entity Framework Core con proveedor Pomelo MySQL (`9.0.20`, fijado a la rama 9.x).
- **Seguridad:** Autenticación basada en JWT y autorización por roles.
- **Pagos:** Mercado Pago (pago de planes de empresa).
- **Puerto de la API:** `http://localhost:5142` (Swagger disponible en `/swagger`).

### Base de Datos
- **Motor:** MySQL 8.4 LTS administrado mediante Docker Compose (`docker-compose.yml`).
- **Contenedor:** `tpi2026-mysql` en puerto `3306` (Base: `tpi2026`, Usuario: `tpi2026`, Password: `tpi2026_dev`; solo desarrollo local).
- **Persistencia:** Volumen Docker `mysql_data`.

---

## 18. Sistema de Diseño (Impeccable Design System)

El diseño está dividido por dominio en `frontend/src/estilos/` y se importa desde `frontend/src/styles.css`, que es solo un **índice** de `@import` (no contiene reglas). `frontend/src/styles.scss` sigue importando `styles.css`. Sigue una estricta **arquitectura en 3 capas**:

```
Capa 1: Primitivos   → Colores base (#hex crudos)
Capa 2: Semánticos   → Tokens de rol y función para [data-modo="jugador"] y [data-modo="empresa"]
Capa 3: Componentes  → Clases y utilidades Tailwind que consumen SOLO semánticos
```

Estructura de `src/estilos/` (cada archivo agrupa un dominio y conserva sus comentarios):

```
estilos-fundamentos/  primitivos.css (Capa 1), base.css (ESTILOS BASE + TIPOGRAFÍAS)
estilos-roles/        jugador.css, empresa.css (Capa 2: identidad, superficies, auth, sombras, texto, escala tipográfica)
estilos-feedback/     feedback.css (5 tokens por estado), alertas.css (--estado-*), toast.css (ngx-sonner)
estilos-componentes/  botones.css (--btn-*), cartas.css (rarezas y --carta-*), sobres.css (--sobre-*)
estilos-paginas/      landing.css (LANDING PÚBLICA + escala fluida), layout.css (ESTRUCTURA DE PÁGINA)
estilos-tailwind/     tema.css (@theme inline completo), utilidades.css (@custom-variant habilitado + @utility)
estilos-animaciones/  animaciones.css (keyframes, .animate-*, reduced-motion)
```

> ⚠️ **REGLA DE ORO DE DISEÑO:** Los componentes nunca usan valores `#hex` directos ni familias de fuente directas. Si se necesita un nuevo color, tamaño o variante, primero se define el token semántico.

### ¿Dónde agrego un token nuevo?
Elegí el archivo por **dominio**, no por capa: color de marca/superficie/texto/escala tipográfica → `estilos-roles/jugador.css` y `estilos-roles/empresa.css`; un estado de feedback → `estilos-feedback/feedback.css`; un badge de estado → `estilos-feedback/alertas.css`; un botón → `estilos-componentes/botones.css`; carta/rareza o vista "Mis cartas" → `estilos-componentes/cartas.css`; sobre → `estilos-componentes/sobres.css`; landing → `estilos-paginas/landing.css`; layout → `estilos-paginas/layout.css`. Después, si debe generar utilidad Tailwind, agregá el mapeo en `estilos-tailwind/tema.css`.

> ⚠️ **REGLA DE ORDEN (jugador → empresa):** `:root, [data-modo="jugador"]` y `[data-modo="empresa"]` tienen la misma especificidad, así que gana el último bloque cargado. Por eso, para cada token, el bloque de empresa va **siempre después** del de jugador: dentro de un mismo archivo de dominio o en un archivo que se importe más tarde (`estilos-roles/empresa.css` se importa después de `estilos-roles/jugador.css`). El orden de los `@import` del índice respeta esta regla.

### Modos y Temas (`data-modo`)
Se alternan cambiando el atributo en el elemento raíz (por ejemplo `<html data-modo="jugador">`). Como los tokens usan selectores `[data-modo="…"]` puros, el atributo también puede aplicarse a un **contenedor anidado** (la galería lo usa para mostrar ambos modos a la vez). Un contenedor anidado debe declarar su propio fondo (`bg-fondo-app`) y color de texto (`text-texto-primario`), porque el `body` no cambia.

| Atributo | Tema | Descripción Visual y Paleta |
| :--- | :--- | :--- |
| `[data-modo="jugador"]` *(Default)* | **Oscuro** | Fondo teal profundo (`#0D3B40`, `#214448`), marca principal verde vibrante (`#3BD972`), acentos amarillo crema cálido (`#F2EEAE`) y texto blanco suave (`#F4FAF6`). |
| `[data-modo="empresa"]` | **Claro Editorial** | Fondo crema suave (`#FCEFE0`), tarjetas blancas, marca violeta corporativo (`#675679`), acento verde institucional de alto contraste (`#04862B`) y texto teal profundo (`#0A2E36`, ratio WCAG AAA > 11:1). |

### Escala de Feedback (5 Tokens por Estado)
Cada estado provee 5 variantes (base, fondo, borde, texto, sobre) para evitar la fatiga visual y asegurar contraste accesible. Nunca depender solo del color: acompañar con ícono o texto.
- **Éxito (`--exito`)**: canjes aceptados, álbum completado, pago acreditado, victoria.
- **Error (`--error`)**: pago rechazado, cupón vencido, fallo de red, derrota.
- **Advertencia (`--advertencia`)**: oferta de intercambio por vencer, recompensa sin reclamar, tiempos límite.
- **Atención (`--atencion`)**: cartas nuevas, sobres disponibles y anuncios destacados.
- **Información (`--info`)**: tips, reglas del juego y descripciones informativas.

### Tipografías (normalizadas)
- **Titulares:** `'Russo One'` (token `--fuente-titulo`, utilidad `font-titulo`).
- **Lectura / cuerpo:** `'Merriweather'` (token `--fuente-cuerpo`, utilidad `font-cuerpo`).
- **Controles de UI:** `system-ui` (token `--fuente-interfaz`, utilidad `font-interfaz`). Es la única **excepción** documentada: botones, formularios, tablas, badges y etiquetas.
- No se usa ninguna otra familia (ni `font-mono`, ni fuentes decorativas).

### Escala tipográfica semántica
Definida en `estilos-roles/jugador.css` (empresa hereda) y mapeada a Tailwind en `estilos-tailwind/tema.css`:
- **Tamaños:** `--tipografia-display|titulo|subtitulo|cuerpo|menor|etiqueta`.
- **Pesos:** `--peso-titular|lectura|etiqueta`.
- **Interlineado:** `--interlineado-titulo|cuerpo`. **Interletrado:** `--interletrado-titulo|etiqueta`.
- Los componentes usan esta escala y no tamaños arbitrarios (`text-[0.6875rem]`, etc.). Las vistas existentes que todavía usan tamaños o fuentes sueltas no están migradas.

### Tokens de Forma y Sombra
- **Radios:** `--radio-sm` (`0.375rem`), `--radio-md` (`0.75rem`), `--radio-lg` (`1.25rem`), `--radio-pildora` (`9999px`), `--radio-circulo` (`50%`).
- **Sombras:** `--sombra-baja`, `--sombra-media`, `--sombra-alta`, `--sombra-brillo-verde` (adaptadas automáticamente al modo oscuro o claro; misma intensidad en ambos modos).

### Tokens de partida
Definidos en `estilos-roles/jugador.css` (la partida es exclusiva del dominio de jugador y no lleva bloque en empresa) y mapeados en `estilos-tailwind/tema.css`:
- **Tablero y slots:** `--background-image-tablero-fondo: var(--tablero-fondo)`, `--color-slot-rival-fondo`, `--color-slot-propio-fondo`, `--color-slot-borde`, `--color-slot-resaltado`, `--color-slot-resaltado-anillo`.
- **Zonas y puntajes:** `--color-zona-marco`, `--color-zona-marco-destacado`, `--color-puntaje-zona-{ganando,perdiendo,empate}-{fondo,texto}`.
- **Recursos y barras:** cupón de recurso (`--color-cupon-{fondo,borde,texto,perforacion}`), barra de puntos (`--color-barra-puntos-{fondo,borde,sombra,propio-relleno,rival-relleno}`).
- **Sombras cartoon:** `--shadow-cartoon`, `--shadow-cartoon-gruesa`, `--shadow-cartoon-clara` (sólidas, sin difuminar).
- **Tiempos de animación:** duraciones en CSS (`--duracion-revelado-carta`, `--duracion-cambio-zona`, `--duracion-vuelo-carta`, `--duracion-micro: 300ms`), no mapeadas a Tailwind; las lee `GsapService` mediante `duracionPartida()`.

### Contraste del texto apagado
- Empresa: `--texto-apagado` es `#566467` y cumple AA (≥ 4.5:1) sobre fondo-app, superficie, elevado y hundido.
- Jugador: `--texto-apagado` es `#7A9F9B` y **no** alcanza AA sobre fondo-app, superficie ni elevado (solo sobre hundido). **Pendiente de corrección.**
- **Regla de uso:** no usar texto apagado sobre superficies elevadas.

### Componentes base de contenido
Ubicación: `compartidos/componentes/textual/`, `compartidos/componentes/contenedor/` y `compartidos/componentes/partida/`.

- **Textuales** (directivas de atributo que se aplican sobre etiquetas nativas; el nivel semántico lo da la etiqueta y el nivel visual lo da el input):
  - `app-titulo` (h1–h6): `tamano` (display, lg, md, sm; default md) y `color` (default heredar).
  - `app-subtitulo` (p, span, h1–h6): `tamano` (md, sm) y `color` (default secundario).
  - `app-texto` (p, span): `variante` (normal, secundario, apagado, heredar) y `tamano` (cuerpo, menor).
  - `app-sobretitulo` (p, span): fuente de interfaz, mayúsculas, color por defecto apagado.
  - Colores disponibles: heredar, primario, secundario, apagado, marca (`colores.ts`).
- **Caja** (`app-caja`): `variante` (base, elevada, hundida, destacada, éxito, error, advertencia, atención, info), `sombra` (ninguna, baja, media, alta), `padding` (sm, md, lg), `radio` (sm, md, lg), `acento` (ninguno, derecha; default ninguno) y slots de contenido `encabezado` y `pie`. Las variantes de superficie fijan `text-texto-primario`; las de feedback fijan el color de texto de su estado. Ningún color propio.
  - **Acento:** `acento="derecha"` dibuja una franja fina recortada contra el radio de la caja (suma `relative overflow-hidden`, solo con acento, así no genera scroll horizontal a 375 px). Su color es `var(--marca-primaria)` por defecto y el consumidor lo cambia definiendo `--acento-caja` en la caja (siempre con tokens: `--exito`, `--error`). Acento en el borde **derecho**; nunca a la izquierda y nunca más de uno por tarjeta.
- **Reglas de uso:**
  - Un solo `h1` por página.
  - Dentro de cajas de feedback, usar `color="heredar"` en títulos, subtítulos y textos; el subtítulo por defecto es gris neutro y desentona con el estado, y el apagado no cumple AA ahí.
  - Todo componente nuevo se muestra en la galería, en ambos modos.
- **Tarjeta de indicador** (`app-tarjeta-kpi`): informativa, no clickeable y sin gráficos. Apoyada en `app-caja` con `acento="derecha"`. Inputs: `etiqueta` (requerido), `valor`, `variacion` (`{ valor, positiva }`, opcional), `contexto` (opcional) y `estado` (`listo`, `cargando`, `sin-datos`, `error`; default `listo`). Sin ícono ni input `tono`: el color del acento es el de marca y pasa a `--exito`/`--error` con una variación; el estado `error` cambia la caja a la variante de feedback.

### Galería de componentes
- Ruta `/componentes`, con **17 secciones** (incluidas "Texto", "Cajas", "Partida", "Tablero" y `app-navegacion-inferior-mobile`).
- Las secciones de texto, cajas y navegación inferior mobile muestran **jugador y empresa a la vez** con contenedores `data-modo` propios; el resto usa el interruptor global de modo.
- Simula movimiento reducido con `data-movimiento="reducido"` (afecta solo a CSS, no a GSAP).
- El spec de la galería valida que la cantidad y el orden de las secciones coincidan entre `secciones.ts`, `galeria-componentes.ts` y `galeria-componentes.html`.

---

## 19. Estructura de Directorios

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
│   │   │   ├── compartidos/
│   │   │   │   ├── componentes/   → UI organizada por tema:
│   │   │   │   │   ├── controles/ → boton, boton-flotante, boton-icono, boton-jugar, boton-opcion-juego, boton-navegacion-circular, campo-texto, campo-select, etiqueta-campo, encabezado-paso, desplegable-seleccion, subida-imagen, grilla-imagenes, panel-desplazable, calendario-mensual
│   │   │   │   │   ├── cartas/    → carta, carta-popup, carta-seleccionable, estrella-rareza, barra-rareza, icono-categoria, sobre-marca, flujo-apertura-sobres, tarjeta-album
│   │   │   │   │   ├── layout/    → body, header, header-empresa, navbar, auth-layout, navegacion-inferior-mobile
│   │   │   │   │   ├── landing/   → hero, carousel-marcas, acordeon-preguntas, faq-item, faq-section, team-section
│   │   │   │   │   ├── empresa/   → stepper-suscripcion, plan-card, plans-section, tarjeta-plan, tarjeta-kpi, faq-item-empresa, faq-section-empresa
│   │   │   │   │   ├── usuario/   → tarjeta-mision, panel-misiones, tarjeta-pity, tarjeta-recompensa
│   │   │   │   │   ├── feedback/  → badge, barra-progreso, info-tooltip
│   │   │   │   │   ├── textual/   → titulo, subtitulo, texto, sobretitulo (+ colores.ts)
│   │   │   │   │   ├── contenedor/→ caja
│   │   │   │   │   └── partida/   → barra-puntos, cupon-recurso, indicador-turno, jugador-chip, puntaje-zona, slot-carta
│   │   │   │   ├── directivas/    → Directivas compartidas
│   │   │   │   ├── ilustraciones/ → Ilustraciones y assets asociados
│   │   │   │   ├── SVGs/          → Assets SVG (alias @svgs/*)
│   │   │   │   └── utilidades/    → Utilidades compartidas
│   │   │   ├── modelos/       → Interfaces TypeScript de dominio
│   │   │   ├── servicios/     → Servicios HTTP y utilidades (api.service, usuario.service, gsap.service)
│   │   │   ├── paginas/       → Páginas/vistas por ruta (incluye galeria-componentes)
│   │   │   ├── guardias/      → Route guards (rol, auth, pago-aprobado)
│   │   │   ├── interceptores/ → HTTP interceptors (auth)
│   │   │   ├── datos/         → Datos estáticos (landing-empresa.data)
│   │   │   ├── app.config.ts  → Configuración global (iconos, routing, providers)
│   │   │   ├── app.html / ts  → Componente raíz
│   │   │   └── app.routes.ts  → Definición de rutas
│   │   ├── estilos/           → Sistema de diseño dividido por dominio (lo importa styles.css)
│   │   ├── styles.css         → Índice: importa el sistema de diseño de src/estilos/
│   │   └── styles.scss        → Importador maestro de estilos
│   ├── angular.json           → Configuración de build y serve (puerto 4300)
│   ├── package.json           → Dependencias y scripts
│   └── tsconfig.json
├── docker-compose.yml         → Servicio MySQL 8.4 local
└── context.md                 → Este archivo
```

---

## 20. Identidad de marca y copy

- **Tono de voz:** voseo rioplatense, frases cortas e imperativas («Abrí tu sobre diario», «Comenzá a coleccionar», «Explorá el modo empresa»). Nunca infinitivo de manual ni formalidad de ustedes.
- **Vocabulario de marca:** sobre diario, carta (rareza), álbum, colección, intercambio, mazo, partida, zona, cupón, marca, descuento. Evitar sinónimos inventados.
- **Claim vigente en el login:** «Ganá descuentos coleccionando y jugando con cartas de tus marcas preferidas».
- **Audiencias por modo:**
  - `[data-modo="jugador"]` → coleccionistas: sobres diarios, álbumes, mazos, partidas, intercambios y cupones.
  - `[data-modo="empresa"]` → marcas: publicar colecciones, gestionar el panel, métricas y validación de cupones por empleados.
- **Gradiente de marca:** `--landing-gradiente-amarillo-verde` (amarillo-logo → teal-profundo) con utility `bg-landing-gradiente-amarillo-verde`. Exclusivo de bloques públicos y modo jugador; en modo empresa la landing usa superficie crema.
- **Logos según fondo:** `Imagotipo_Alt.svg` (oscuro) sobre amarillo o gradiente claro; `Imagotipo_claro.svg` sobre fondos oscuros; `Imagotipo_Empresa.svg` en modo empresa.
- **Pendiente — copy visible desactualizado:** la definición de producto de la landing y el copy de la landing de empresa (por ejemplo, el texto del panel de imagen del registro de empresa) todavía pueden mencionar fútbol, canchas, torneos y reservas. Auditar los textos visibles y reescribirlos con el dominio real. No se cambiaron en esta unificación.
- **Open decisions de marca:** tagline oficial definitiva, propuesta de valor consolidada para empresas y guía de tono formal; no existen como documento en el repo.

---

## 21. Convenciones de Desarrollo Frontend

1. **Componentes Standalone:** Todo componente nuevo debe ser `standalone: true` (comportamiento por defecto en Angular 20) e importar explícitamente solo lo que utiliza en su arreglo `imports`.
2. **Angular Signals:** Priorizar el uso de Signals para estado e inputs (`input()`, `input.required()`, `output()`, `computed()`, `signal()`).
3. **Change Detection:** Aplicar siempre `changeDetection: ChangeDetectionStrategy.OnPush`.
4. **Separación de Responsabilidades:** Los componentes nunca realizan peticiones HTTP directas ni gestionan lógica de persistencia; delegan siempre en un archivo dentro de `servicios/`.
5. **Ubicación de componentes compartidos:** Todo componente compartido nuevo va dentro de `compartidos/componentes/<tema>/` (controles, cartas, layout, landing, empresa, usuario, feedback, textual, contenedor, partida). Si no encaja en ningún tema, preguntar antes de crear uno nuevo.
6. **Acceso al backend vía `ApiService`:** Todo consumo de la API pasa por `servicios/api.service.ts`, que centraliza `HttpClient` y `environment`. Es el **único** archivo de `servicios/` que inyecta `HttpClient` o importa `environment` para URLs. Los servicios de dominio llaman a `api.get/post/put/patch/delete` con **rutas relativas a `/api`** (por ejemplo `'Pagos/configuracion'`) y no arman URLs absolutas ni construyen `HttpParams` a mano. Para concatenar base y ruta usar la función pura exportada `unirUrl(base, ruta)`.
7. **Accesibilidad (A11y):**
   - Todo botón o enlace sin texto visual debe incluir `aria-label` o `aria-labelledby`.
   - Mantener el foco visible con `:focus-visible`.
   - Respetar `prefers-reduced-motion` en animaciones.
   - Jerarquía de encabezados correcta; contraste verificado en ambos modos.
8. **Idiomas:**
   - Código de negocio, modelos, variables y comentarios en **español** (`usuario`, `carta`, `boton`, `obtenerCartas`).
   - Respetar nombres técnicos universales de librerías (`inject`, `computed`, `OnInit`).
9. **Lógica sensible en el servidor:** las decisiones que el usuario podría manipular (qué carta sale de un sobre, resultados de partidas, límites diarios, canje de cupones, transferencia de cartas) se validan siempre en el backend.
10. **Animaciones con GSAP y GSAP Draggable:** Las animaciones complejas y de arrastre usan GSAP y GSAP Draggable (sin dependencias adicionales). Al invocar `GsapService.crearContexto()` fuera de un contexto de inyección (por ejemplo en `ngAfterViewInit` o effects), se debe capturar `DestroyRef` como campo de clase (`private readonly destroyRef = inject(DestroyRef)`) y pasarlo como argumento al método para garantizar la reversión automática de tweens y listeners al destruirse el componente.

### Path aliases (tsconfig.json + jest.config.ts)

- `@app/*` → `src/app/*`
- `@compartidos/*` → `src/app/compartidos/*`
- `@modelos/*` → `src/app/modelos/*`
- `@servicios/*` → `src/app/servicios/*`
- `@paginas/*` → `src/app/paginas/*`
- `@svgs/*` → `src/app/compartidos/SVGs/*`
- `@environments/*` → `src/environments/*`

Regla: los imports entre carpetas usan alias; los imports dentro de la misma carpeta usan `./`. Nunca `../`.

---

## 22. Reglas Obligatorias para Claude (Instrucciones de AGENTS.md)

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
- **No inventar reglas de negocio:** si una regla está marcada como **Pendiente**, **A confirmar** o **⚠️ Conflicto**, no resolverla por cuenta propia; avisar y pedir la decisión.
- **Mantener este documento al día:** cuando una tarea cambie, defina o resuelva una regla de negocio, una decisión de diseño o un pendiente, actualizar `context.md` en la misma tarea: modificar la sección correspondiente, quitar o marcar como resuelto el ítem en la tabla de contradicciones (sección 12) y en el resumen de pendientes (sección 24), y agregar los pendientes nuevos que surjan. Incluir esa actualización en el `Resumen de cambios`. No modificar reglas de negocio en el documento si la decisión no fue confirmada por el equipo.
- **Validación continua:** Al finalizar cambios en frontend, correr y verificar:
  - `npm run lint` en `frontend/` (0 advertencias/errores).
  - `npm test -- --watch=false` en `frontend/` (todas las pruebas pasando con Jest).
  - `npm run build` en `frontend/` (compilación exitosa).

---

## 23. Comandos Frecuentes

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

---

## 24. Resumen de pendientes

1. Alcance de la entrega (TPI) frente a la visión futura.
2. Resolver las contradicciones abiertas de la sección 12 (intercambio sincrónico o asincrónico, slots y cartas jugables por ronda, sobres populares, amistades) y el detalle de la victoria por 100 puntos (empate si ambos la superan en la misma ronda).
3. Nombre alternativo para el recurso de juego (conflicto "cupón") y renombrado de `Mana` en el modelo.
4. Probabilidades y valores de pity para sobres de categoría y marca.
5. Planes: nombres, precios, cantidad de colecciones y duración del cooldown.
6. Reglas exactas de reinicio de misiones diarias.
7. Slots por lado y cartas jugables por ronda (las 2 zonas simultáneas fijas con rotación por turno quedaron resueltas).
8. Definición de "intento" en intercambios.
9. Cosméticos: globales o por carta.
10. Métricas finales de la marca.
11. Verificación de email y recuperación de contraseña.
12. Reescribir el copy visible que todavía hable de fútbol.
13. Corregir `--texto-apagado` del modo jugador.
14. Alinear el modelo de datos (sección 16) y verificar qué respalda el backend.
15. Regla de quién revela primero en cada ronda.
16. Navegación inferior mobile (`app-navegacion-inferior-mobile`): validar los 4 destinos definitivos cuando se habiliten Intercambios/Perfil, si llevan etiqueta de texto además del ícono, posición definitiva del botón flotante (izquierda como en la referencia o centrado), alto exacto de la franja asomada al ocultarse, si el panel de empresa también adopta esta barra, si se oculta siempre durante la partida y si muestra indicador de misiones/sobres disponibles.