## 📝 Descripción
Implementa el flujo completo de **Partida 1 vs 1 contra otro jugador** en el frontend (`partida-sala`): habilita el acceso desde el menú principal de modos de juego, incorpora el servicio `SalaJuegoService` conectado por WebSockets (SignalR) al Hub del backend (`/hubs/juego`) para emparejamiento automático y salas privadas con código, construye la pantalla interactiva de lobby en `/juego/jugador` con selección de mazo reglamentario (12 cartas) y adapta `PartidaServicio`, el tablero y la pantalla de resultado para sincronizar y mostrar el estado de un rival humano en tiempo real.

### 💡 ¿Por qué es importante este cambio?
Permite que dos usuarios reales puedan enfrentarse en línea de punta a punta, ya sea buscando rival en la cola pública o compartiendo un código de sala privada, con retroalimentación clara durante cada ronda sin bloquear el turno del jugador que aún sigue pensando su jugada.

1. **[Emparejamiento y salas privadas en tiempo real]**: antes la vista `/juego/jugador` mostraba un cartel estático indicando que el modo no estaba disponible; ahora conecta vía SignalR para buscar partida rápida (`BuscarPartida` / `CancelarBusqueda`) o crear/unirse a salas con código (`CrearSala` / `UnirseASala`).
2. **[Sincronización de turnos entre humanos]**: antes `PartidaServicio` asumía siempre un rival bot (`esBot: true`) y detenía el polling o bloqueaba la fase al esperar; ahora distingue si el rival es humano, informa visualmente cuando el oponente ya cerró su turno (`rivalListo`) y acelera el polling (cada 2 s) tras confirmar el turno propio para resolver la ronda apenas ambos estén listos.
3. **[Bloqueo seguro tras confirmar jugada]**: impide arrastrar nuevas cartas cuando el jugador propio ya marcó su turno como listo (`servicio.propioListo()`) mientras aguarda la confirmación del rival.

---

## 🔍 Tipo de cambio
- [ ] Bugfix (Hotfix de seguridad)
- [x] Nueva funcionalidad
- [x] Refactor / limpieza
- [ ] Pruebas unitarias

---

## 🛠️ Cambios Principales
- **[Nuevo]** `frontend/src/app/servicios/sala-juego.service.ts`:
  - Gestiona la conexión SignalR autenticada con JWT hacia `environment.hubUrl`.
  - Expone señales reactivas (`codigoSala`, `buscandoRival`, `partidaIniciada`, `cargando`, `error`) y los métodos `buscarPartida`, `cancelarBusqueda`, `crearSala`, `unirseASala` y `desconectar`.
- **[Modificación]** `frontend/src/app/paginas/partida-jugador/partida-jugador.ts` y `partida-jugador.html`:
  - Carga los mazos del usuario (`BarajaService.obtenerMazos`), filtra los mazos completos de 12 cartas (`mazosValidos`) y preselecciona el primero disponible.
  - Implementa las vistas de **Partida Rápida (1 vs 1)** y **Buscando oponente** en el lobby.
  - Al recibir el evento `PartidaIniciada`, guarda `faltauna_partida_activa` en `localStorage` y redirige automáticamente al tablero de juego (`/juego/ia`).
- **[Modificación]** `frontend/src/app/paginas/pantalla-inicial-juego/pantalla-inicial-juego.ts`:
  - Desbloquea la opción **Partida contra jugador** (`/juego/jugador`) en el menú de selección de modo.
- **[Modificación]** `frontend/src/app/servicios/servicios-partida/partida-servicio.ts` y `frontend/src/app/modelos/partida.model.ts`:
  - Agrega `turnoActivoUsuarioId` y `esMiTurno` a `EstadoPartidaApi`.
  - Incorpora señales computadas `rivalListo`, `rivalEsBot`, `propioListo` y `esMiTurno`, mapeando `estado.rival.esBot` y `estado.rival.listo` reales en lugar de fijar `esBot: true`.
  - En `fase()`, proyecta `'esperando'` únicamente cuando el jugador propio confirmó (`estado.listo`), y acelera la consulta de estado cada 2 segundos mientras espera al rival.
- **[Modificación]** `frontend/src/app/compartidos/componentes/partida/tablero/tablero.html` y `frontend/src/app/paginas/partida/partida.ts`:
  - Muestra el badge `✅ Listo` junto al rival y el aviso `⚡ Tu rival ya terminó su turno` cuando el oponente confirma primero.
  - Bloquea el arrastre de cartas de la mano propia cuando `servicio.propioListo()` es `true`.
  - Muestra el nombre real del rival humano en el mensaje de victoria al terminar la partida (`"La partida la ganó <nombre>"`).

---

## ✅ Checklist
- [x] Pasaron los tests (`npm test -- --watch=false`)
- [x] Build correcto (`npm run build`)
- [ ] Sin errores de lint (`npm run lint`)
- [ ] Revisado por otro miembro del equipo

---

## 🧪 Pasos para Verificar (Cómo Probar)
1. **[Acceso y validación de mazo]**: Ingresar a `/usuario/jugar` → elegir **Partida contra jugador** (`/juego/jugador`) → verificar que se listan únicamente los mazos completos de 12 cartas (o alerta hacia *Mis Mazos* si no tiene ninguno).
2. **[Emparejamiento rápido 1 vs 1]**: Abrir dos sesiones con usuarios distintos en `/juego/jugador` → presionar **🎮 Buscar Partida** en ambos → verificar que pasa al estado *"Buscando oponente..."* y que al emparejarse ambos navegan automáticamente al tablero de la misma partida.
3. **[Sala privada con código]**: En el usuario A desplegar *"O jugar partida privada con código"* y tocar **Crear Sala** → copiar el código de 5 caracteres → en el usuario B pegar el código y tocar **Unirse** → verificar que inicia la partida entre ambos.
4. **[Sincronización de turno y resolución]**: Jugar cartas con el usuario A y confirmar fin de turno → verificar que en A se bloquea el arrastre de cartas y pasa a espera, mientras en el usuario B aparece `✅ Listo` y `⚡ Tu rival ya terminó su turno` pudiendo seguir jugando → confirmar turno en B y verificar que la ronda se resuelve en ambas pantallas.
