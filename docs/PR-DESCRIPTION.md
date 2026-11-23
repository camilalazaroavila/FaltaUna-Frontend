# Frontend: Renombre del recurso de juego de "cupones" a "tickets"

Rama: `refactor/recurso-juego-tickets` -> `dev` / `main`

## Descripción

Este Pull Request renueva la nomenclatura del recurso de juego utilizado durante las partidas (el recurso que empieza en 1 en la ronda 1 y aumenta hasta 6 para jugar cartas) para llamarse **"ticket / tickets"** (género masculino: *el ticket*, *los tickets*), diferenciándolo tajantemente de los cupones comerciales de descuento.

> [!IMPORTANT]
> **Alcance:**  
> Los cupones de descuento comercial de marcas (`TarjetaCupon`, códigos alfanuméricos, canjes y validaciones por QR, y la vista de `/usuario/cupones`) **NO fueron tocados**.

---

## Cambios principales

### 1. Componente del Recurso
- Eliminado `cupon-recurso` y creado en su lugar el componente `ticket-recurso` (`app-ticket-recurso`, clase `TicketRecurso`).
- Selector, templates, estilos y tests dedicados a mostrar los tickets disponibles con su icono y conteo correspondiente.

### 2. Estilos, Tokens y Utilidades Tailwind
- Tokens actualizados: `--ticket-fondo`, `--ticket-borde`, `--ticket-texto`, `--ticket-perforacion`.
- Utilidades actualizadas: `@utility muesca-ticket`, `@utility ticket-contorno`.
- Respetado el orden de estilos jugador -> empresa.

### 3. Tablero, Mano y Control de Turno
- Vistas de partida adaptadas al nuevo componente y propiedades: `ticketsActuales`, `ticketsMaximos`, `costeTicket`.
- Badges de costo en cartas adaptados.

### 4. Tutorial Guiado
- Textos actualizados con voseo: *"Empezás con 1 ticket y ganás 1 más por ronda"*, *"Los tickets son el costo para jugar cartas"*, *"Tenés X tickets"*.
- Ancla del tutorial actualizada a `data-tutorial="tickets"`.

### 5. Adaptador Retrocompatible de Contrato
- En `partida-estado.service.ts` y `partida-servicio.ts`, la traducción del contrato API es retrocompatible:
  Acepta tanto `ticketsActuales` como `cuponActual`, aislando el resto de los componentes del frontend.

### 6. Galería de Componentes
- Actualizadas las secciones de Partida y Tutorial en `/galeria` para reflejar el componente y ejemplos de Tickets.

---

## Tests y Verificación

- **Linter:** `npm run lint` -> 0 errores.
- **Build:** `npm run build` -> Compilación exitosa.
- **Unit Tests:** `npm test -- --watch=false` -> **119 suites pasadas, 897 tests pasados (100%)**.

---

## Checklist
- [x] Componente `TicketRecurso` creado y probado.
- [x] Utilidades Tailwind y variables CSS migradas.
- [x] Tutorial y textos adaptados con voseo.
- [x] Adaptador de servicio retrocompatible con backend.
- [x] 897 tests unitarios en verde.
