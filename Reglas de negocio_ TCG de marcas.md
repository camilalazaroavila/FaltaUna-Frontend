# Reglas de negocio: TCG de marcas (TPI 2026)

> Versión 1 · Basada en el relevamiento por temas. Los puntos marcados **Pendiente** o **A confirmar** necesitan definición del equipo. **Nota:** `Context.md` quedó desactualizado (habla de fútbol amateur, Oro, canchas y torneos). Este documento lo reemplaza para el juego de cartas.

---

## 1. Visión y alcance

- Juego de cartas coleccionables web con tres pilares: **coleccionar, jugar e intercambiar**, más recompensas reales de marcas (cupones).
- El jugador **no paga nada**. Quien paga es la **empresa/marca**, mediante un plan.
- No existe monetización para el jugador: no hay compra de sobres ni moneda.
- Ya no es un juego de fútbol. Las "cartas de Falta Una" son una colección propia del juego, distinta de las colecciones de marcas.
- **Pendiente:** qué entra en esta entrega (TPI) y qué queda como visión futura.

## 2. Roles

| Rol | Permisos |
| --- | --- |
| **Jugador** | Coleccionar, abrir sobres, armar mazos, jugar, intercambiar, canjear cupones, gestionar su perfil. |
| **Admin de empresa** | Ver métricas, ver colecciones activas, subir fotos para crear colecciones, canjear cupones. |
| **Empleado** | Pertenece a una empresa. Solo canjea cupones (ingresando código o escaneando QR). |
| **Admin del sistema** (equipo de desarrollo) | Crea las cartas (descripción, costo de cupón, poder), balancea, crea colecciones con las imágenes provistas, crea efectos de zonas. |

- Autenticación con JWT y autorización por rol. Cada empresa gestiona solo lo suyo.
- No hay moderación ni baneo por ahora.

## 3. Registro y onboarding

- Registro con usuario, email y contraseña (únicos).
- **Paquete de bienvenida:** 36 cartas fijas, organizadas en **3 mazos base de 12 cartas**. Todos los usuarios reciben los mismos.
- Las cartas de bienvenida **no se pueden intercambiar**.
- Además recibe **1 sobre genérico** al entrar.
- **Pendiente:** verificación de email y recuperación de contraseña.
- **A confirmar:** si las cartas de bienvenida cuentan para el % de completitud de la colección "Falta Una".

## 4. Cartas

- Atributos: nombre, descripción, **poder**, **costo de cupón**, rareza, imagen, categoría. Las crea el equipo.
- Cada carta pertenece a **una sola colección** y a **una categoría**.
- **Rarezas (4):** Común, Rara, Epicarta, Legendaria.
- **Toda carta tiene habilidad.** Las de mayor rareza tienen habilidades más fuertes o complejas, pero la rareza no debe volver a la carta abrumadoramente más fuerte.
- **Momentos de activación** (el motor debe ser flexible): al jugarla, al terminar la ronda, o cuando hay otra carta de cierta categoría.
- **Ejemplos de habilidades:** +1 de poder cada turno; +2 de poder a las cartas de la misma zona; robar una carta; reemplazar la zona; reducir el poder de las cartas enemigas; transformarse en otra carta al azar.
- Las cartas **no se retiran** del juego.
- **Pendiente:** rangos de poder y costo por rareza.

> **Naming a resolver:** el "maná" ahora se llama **cupón**, pero también existen los **cupones de descuento** de las marcas (sección 13). Conviene renombrar uno de los dos (por ejemplo "energía" para el recurso de juego) para evitar confusión en código y UI.

## 5. Categorías, marcas y colecciones

- Las **marcas son una entidad propia**. Una marca puede tener varias colecciones, según su plan.
- Las categorías son ampliables (Comida, Ropa, Accesorios, etc.).
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

## 6. Sobres

| Tipo | Cartas por sobre |
| --- | --- |
| Genérico | 5 |
| De categoría | 3 |
| De marca | 1 |

- **Probabilidades (sobre genérico, por carta):** 50 % Común · 30 % Rara · 15 % Epicarta · 5 % Legendaria. **Pendiente:** tablas de categoría y marca.
- Se pueden obtener **repetidas dentro del mismo sobre**.
- **Pity (garantía) por barras de progreso:** el usuario tiene una barra por tipo de sobre (genérico, categoría, marca). Por ejemplo, 50 sobres genéricos garantizan una legendaria. Los sobres de categoría y marca requieren menos aperturas porque son más difíciles de conseguir. El usuario puede elegir qué barra avanzar. Al salir una legendaria, la barra **vuelve a 0**. **Pendiente:** valores para categoría y marca, y si hay una barra por categoría/marca o una global por tipo.
- **Sobres diarios:** 2 por día, genéricos y no elegibles. No se acumulan. Se resetean a medianoche y luego cada 12 h. **A confirmar:** si es un sobre cada 12 h a partir de medianoche (00:00 y 12:00).
- Los sobres **no se compran**: se obtienen por misiones, bienvenida y otras recompensas.
- Se abren **de inmediato**. Si la apertura se interrumpe, las cartas van directo a la colección.
- Un sobre de marca **no se puede abrir** si la marca se desafilió o la colección se dio de baja.
- Hay un **límite diario de aperturas**; el límite de sobres diarios es 2. El intento de abrir un tercero es rechazado.
- El servidor decide siempre qué carta sale.

## 7. Economía

- **No hay moneda en el juego**: ni Oro, ni monedas de intercambio, ni cosmética por ahora.
- Las recompensas son **sobres, cartas, iconos de jugador y títulos**.
- No existe pay-to-win ni pago dentro de la app para el jugador.

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

## 9. Mazos

- **12 cartas exactas**, sin copias repetidas.
- **Composición obligatoria:** 5 Comunes, 4 Raras, 2 Epicartas, 1 Legendaria.
- Máximo **20 mazos** por usuario, con nombre.
- Se puede mezclar cualquier marca y categoría.
- Si se intercambia una carta del mazo, el mazo queda **inhabilitado** hasta reemplazarla.
- Si una marca se va, solo se reemplaza la imagen de la carta; el mazo sigue válido.
- Los 3 mazos base de bienvenida son fijos.

## 10. Partidas

- **1 vs 1**, **6 rondas**, ambos jugadores actúan **a la vez** (estilo Marvel Snap). **Límite de 40 segundos por ronda.**
- **Inicio:** cada jugador roba 4 cartas. Luego roba 1 por ronda.
- **Cupón (recurso de juego):** empieza en 1 y sube 1 por ronda hasta 6. Determina qué cartas se pueden jugar según su costo.
- **Puntaje:** los puntos jugados quedan en la zona. Al final de cada ronda se compara: el jugador con más puntos en la zona suma **la diferencia** (ej.: 6 contra 2, gana 4; 10 contra 9, gana 1). Los puntos del rival restan a los propios.
- Para impedir que el rival sume hay que tener **al menos los mismos puntos** que él en esa zona.
- **Gana la partida** quien acumula más puntos tras las 6 rondas.
- **Zonas:** se asignan al azar y se revelan de inmediato. Cambian cada ronda, una a la vez. Tienen efectos que afectan a ambos lados, y las cartas tienen sus propios efectos. Ganar una zona es anecdótico: solo aporta puntos.
- **Empate:** no se resuelve, queda empate.
- **Desconexión y abandono** cuentan como derrota. Hay botón de **rendirse**.
- **Modos:** contra bot (práctica) y amistoso con otro usuario. Habrá **matchmaking** al final del proyecto, sin ranking ni ELO.
- Todo cálculo se valida en el servidor.
- **A confirmar:** cuántas zonas hay en el tablero a la vez (el modelo de datos tiene 2 por partida, pero el texto dice que cambian una a la vez), cuántas cartas se pueden jugar por ronda y qué pasa con la mano si se llega al máximo.

## 11. Zonas

- Están **atadas a una marca real** (ej.: un local de McDonald's). Si la marca se va, se reemplaza por una zona genérica.
- Tienen **efectos que potencian cartas**, creados por los desarrolladores. La marca solo sube la foto de su local.
- Se sortean al azar. **Pendiente:** si conservan el bonus de poder por categoría (`ZonaCategoria`) o se reemplaza por efectos.

## 12. Intercambios

- Asincrónicos, estilo Pokémon Pocket.
- **Flujo:** el usuario elige **una** carta suya para ofrecer, según las favoritas del rival o las que le faltan, y queda en espera. El receptor ve la oferta, acepta y elige una carta propia a cambio. Luego se confirma.
- Solo se pueden intercambiar cartas de la **misma rareza**.
- Se pueden dar repetidas o únicas; si es la única copia, solo se muestra un aviso.
- Las **cartas de bienvenida no son intercambiables**.
- **Reserva y vencimiento:** la oferta vence a los **3 días**. Las cartas ofrecidas quedan reservadas y no se pueden usar mientras tanto.
- **Sugerencias:** el sistema sugiere según favoritas y faltantes de ambos.
- **Límites:** 3 intentos de intercambio al día (se resetea al día siguiente) y máximo 10 intercambios exitosos por día.
- **Favoritas:** hasta 20 por usuario, visibles en el perfil.
- La transferencia es **atómica**: no duplica ni intercambia dos veces la misma carta.
- **A confirmar:** qué cuenta como "intento" (¿rechazos, ofertas enviadas?). Qué pasa con el cosmético si la carta cambia de dueño (sección 16).
- Se guarda en la base de datos; no hay historial visible.

## 13. Cupones de marca

- Se obtienen **completando una colección** (los álbumes se completan solo por colección). La marca define los hitos y los descuentos.
- El cupón es de **un solo uso** y **único por usuario**.
- **Estados:** disponible, usado, vencido.
- El **empleado** valida ingresando el código o escaneando el QR desde su panel.
- La marca define los **locales adheridos** al armar la colección, y el **máximo de canjes** de la campaña (ej.: 10.000).
- Si el usuario pierde cartas por intercambio después de canjear, **conserva el cupón** y puede intercambiar las cartas libremente.

## 14. Obtención de cartas fuera de sobres

- Códigos promocionales/QR: **no en esta versión**.
- Otras fuentes: recompensas por **partidas y misiones**; eventos a futuro.
- **Contradicción a resolver:** se respondió que no hay códigos promocionales y también que un código se usa "una vez en total". Aclarar si esa regla aplica al futuro.

## 15. Perfil

- No hay nivel de usuario.
- Incluye avatar, favoritas y estadísticas. El usuario elige un **icono** entre varios (no sube imágenes propias).
- El perfil puede ser **público o privado**, a elección.
- La visibilidad pública se implementa **al final** del proyecto.

## 16. Cosméticos

- **Futuro**, fuera de esta etapa.
- Son **globales por usuario**, y el cosmético **viaja con la carta** en un intercambio.
- **A confirmar:** hay una tensión entre "globales por usuario" y "viaja con la carta". Definir si el cosmético se asocia a cada carta o al perfil.

## 17. Administración y métricas

- El **admin del sistema** son los desarrolladores: crean y balancean cartas, crean colecciones con imágenes provistas por las marcas.
- La **marca** solo ve métricas y sube fotos para crear colecciones.
- Hay **métricas** para la marca. **Pendiente:** cuáles (cartas obtenidas, canjes, etc.).
- Canchas, torneos y reservas **quedan fuera del alcance**.

## 18. Integridad y antifraude

- El servidor decide cartas, valida partidas y límites.
- Sobres: límite diario; intento extra rechazado.
- Intercambios: 3 intentos y 10 exitosos por día, transferencia atómica.
- Cupones únicos e irrepetibles; colecciones inactivas no generan cartas ni sobres.
- Aperturas e intercambios se guardan en la BD (sin historial visible).

---

## Impacto en el modelo de datos

| Cambio | Detalle |
| --- | --- |
| **Eliminar** | `Usuario.Oro`, `Usuario.MonedasIntercambio`, tabla `IntercambioMoneda`; `JugadorPartida.Vida`; `DanioJugador1/2` en `ResultadoZona`. |
| **Agregar** | `Marca`, `Plan`, `Mision` y progreso por usuario, favoritas por usuario, progreso de pity por tipo de sobre, inventario de sobres, local/sucursal por colección, rol de usuario y su empresa, visibilidad del perfil, icono de perfil. |
| **Revisar** | `Cupon` hoy cuelga de `Coleccion`; debe vincularse a `Marca` e hitos. `Intercambio` necesita fecha de vencimiento y reserva de cartas. `Carta` con una sola colección (hoy `ColeccionCarta` es N:N). Cartas de bienvenida marcadas como no intercambiables. `Ronda.FechaFin` es obligatoria y debería ser opcional. |

---

## Resumen de pendientes

1. Alcance de la entrega (TPI).
2. Nombre alternativo para el recurso de juego (conflicto "cupón").
3. Probabilidades y valores de pity para sobres de categoría y marca.
4. Planes: nombres, precios, cantidad de colecciones y duración del cooldown.
5. Reglas exactas de reinicio de misiones diarias.
6. Zonas por partida y cartas jugables por ronda.
7. Definición de "intento" en intercambios.
8. Cosméticos: global o por carta.
9. Métricas de la marca.
10. Verificación de email y recuperación de contraseña.