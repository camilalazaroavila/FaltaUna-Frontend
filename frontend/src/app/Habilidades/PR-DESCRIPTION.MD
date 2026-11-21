## 📝 Descripción
Conecta las vistas de **Estadísticas de Empresa** (`/empresa/panel/estadisticas`) y **Álbumes de Empresa** (`/empresa/panel/albumes`) con los datos reales del backend en la rama `estadisticas`, reemplazando los datos simulados de `empresa-estadisticas.mock.ts` y `empresa.mock.ts`. Incorpora el servicio `EstadisticasEmpresaService` (`GET /api/EstadisticasEmpresa/estadisticas`), agrega filtrado interactivo por marca cuando la empresa posee múltiples marcas, y vincula las métricas reales de cada colección y carta (rareza, poder, costo de cupón, jugadores que la tienen, favoritos, intercambios y partidas).

### 💡 ¿Por qué es importante este cambio?
Permite que las empresas consulten indicadores reales sobre el desempeño de sus marcas, álbumes y cartas a partir de la actividad efectiva de los jugadores en la plataforma, dejando atrás las cifras estáticas de demostración (Grido mock).

1. **[Tablero de estadísticas conectado al backend con filtro por marca]**: antes `EmpresaEstadisticas` consumía constantes locales (`KPIS_EMPRESA`, `EVOLUCION_FAVORITOS`, `CARTAS_EMPRESA`); ahora consulta `EstadisticasEmpresaService.obtenerEstadisticas(marcaId?)`, permitiendo alternar entre **"Todas"** las marcas de la empresa o filtrar KPIs, favoritos por álbum, distribución por rareza, top cartas y evolución mensual por una marca específica.
2. **[Métricas reales por álbum y por carta en `EmpresaAlbumes`]**: antes la grilla y el detalle de álbumes calculaban rarezas, completados, favoritos, intercambios y estadísticas del modal de carta con valores fijos o generados por `ESTADISTICAS_CARTA`; ahora cruza las colecciones de `AlbumesService.obtenerMisAlbumes()` con las estadísticas por `marcaId` y los contadores individuales de cada imagen (`totalObtenidas`, `totalFavoritos`, `totalIntercambios`, `totalPartidas`).
3. **[Atributos reales de carta desde la API]**: `ImagenAlbumRespuesta` incorpora `rareza`, `poder`, `costoCupon` y métricas de uso, mapeando cada carta del álbum con su rareza y atributos reales en lugar de valores hardcodeados (`'comun'`, `10`, `10`).

---

## 🔍 Tipo de cambio
- [ ] Bugfix (Hotfix de seguridad)
- [x] Nueva funcionalidad
- [x] Refactor / limpieza
- [ ] Pruebas unitarias

---

## 🛠️ Cambios Principales
- **[Nuevo]** `frontend/src/app/servicios/estadisticas-empresa-service.ts`:
  - Crea `EstadisticasEmpresaService` con el método `obtenerEstadisticas(marcaId?: number)` que consume `GET ${environment.apiUrl}/EstadisticasEmpresa/estadisticas` enviando `marcaId` como query param opcional.
- **[Eliminado]** `frontend/src/app/paginas/empresa-estadisticas/empresa-estadisticas.mock.ts`:
  - Se elimina el archivo de mocks estáticos de KPIs y evolución de favoritos del panel de estadísticas.
- **[Modificación]** `frontend/src/app/paginas/empresa-estadisticas/empresa-estadisticas.ts` y `empresa-estadisticas.html`:
  - Define los contratos `EstadisticasEmpresaRespuesta`, `FavoritoPorAlbum`, `FavoritoPorRareza`, `CartaMasQuerida` y `EvolucionFavorito`.
  - Obtiene las marcas disponibles del usuario a partir de `AlbumesService.obtenerMisAlbumes()` y renderiza píldoras de filtro (**Todas** / cada marca) cuando la empresa gestiona más de una marca.
  - Transforma reactivamente la respuesta de la API en las señales computadas `kpis`, `favoritosPorAlbum`, `distribucionRareza`, `topCartas`, `totalFavoritosRareza` y `evolucion`.
- **[Modificación]** `frontend/src/app/modelos/album.model.ts`:
  - Amplía `ImagenAlbumRespuesta` con `rareza`, `poder`, `costoCupon`, `totalObtenidas`, `totalFavoritos`, `totalIntercambios` y `totalPartidas`.
- **[Modificación]** `frontend/src/app/paginas/empresa-albumes/empresa-albumes.ts` y `empresa-albumes.html`:
  - Consume `EstadisticasEmpresaService` (general y por cada `marcaId`) junto con `AlbumesService.obtenerMisAlbumes()`.
  - Calcula `totalUsuarios()`, `jugadoresCompletaron`, `favoritos`, `intercambios`, `porcentajeCompletado` y el reparto de rarezas por álbum a partir de los datos del backend.
  - Mapea las cartas del álbum usando `rarezaDesdeNombre(img.rareza)`, `img.poder` y `img.costoCupon`, y actualiza `obtenerEstadisticasCarta(id)` para poblar el modal de detalle de carta con las métricas reales devueltas por el backend.

---

## ✅ Checklist
- [ ] Pasaron los tests (`npm test -- --watch=false`)
- [x] Build correcto (`npm run build`)
- [ ] Sin errores de lint (`npm run lint`)
- [ ] Revisado por otro miembro del equipo

---

## 🧪 Pasos para Verificar (Cómo Probar)
1. **[Estadísticas generales de empresa]**: Iniciar sesión con una cuenta de empresa → ir a `/empresa/panel/estadisticas` → verificar que se realiza la petición a `GET /api/EstadisticasEmpresa/estadisticas` y se visualizan el nombre de marca/categoría, total de jugadores, los 4 KPIs con su porcentaje de tendencia, *Favoritos por álbum*, gráfico donut *Por rareza*, ranking *Cartas más queridas* y *Evolución de favoritos*.
2. **[Filtro por marca]**: Con una empresa que tenga colecciones de más de una marca, verificar que aparecen los botones de filtro (**Todas** y cada marca) en el encabezado de `/empresa/panel/estadisticas` y que al seleccionarlos se recargan las métricas filtradas por `marcaId`.
3. **[Listado y resumen de álbumes]**: Navegar a `/empresa/panel/albumes` → comprobar que el contador de jugadores, la barra de reparto por rareza, los favoritos, intercambios y porcentaje de completado de cada tarjeta de álbum reflejan los datos reales del backend.
4. **[Detalle de álbum y modal de estadísticas de carta]**: Entrar al detalle de un álbum → verificar que las cartas muestran su rareza y atributos (`poder` / `costoCupon`) reales → hacer clic sobre una carta y corroborar que el modal muestra la cantidad y porcentaje de jugadores que la tienen, favoritos, intercambios y partidas.
