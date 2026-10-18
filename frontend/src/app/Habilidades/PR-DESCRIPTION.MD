## 📝 Descripción
Conecta la vista "Mi baraja" con el backend: la baraja del jugador deja de usar datos mock en memoria y ahora consulta al servicio `BarajaService` los endpoints `Mazos/cartas-disponibles`, `Mazos` y `Mazos/{id}` para obtener el inventario, cargar el mazo actual y guardarlo. Además define la composición obligatoria de la baraja por rareza (2 comunes, 5 raras, 3 epicartas, 2 legendarias) acorde al contrato de la API y agrega el campo nombre al guardar.

### 💡 ¿Por qué es importante este cambio?
Permite que la baraja del jugador persista en el backend en lugar de vivir solo en memoria local, y valida la composición contra los topes definidos por el backend.

1. **[Persistencia]**: antes la baraja se guardaba en una señal local sin enviar nada al servidor; ahora se crea o actualiza un mazo real vía API (`POST`/`PUT` a `Mazos`).
2. **[Composición válida]**: los topes por rareza pasan a ser los obligatorios del backend, no cualquier combinación que sume 12.

---

## 🔍 Tipo de cambio
- [ ] Bugfix (Hotfix de seguridad)
- [x] Nueva funcionalidad
- [ ] Refactor / limpieza
- [ ] Pruebas unitarias

---

## 🛠️ Cambios Principales
- **[Modificación]** `frontend/src/app/servicios/baraja.service.ts`:
  - Ahora consume `ApiService` y los endpoints `Mazos/cartas-disponibles`, `Mazos` y `Mazos/{id}` (PUT/POST).
  - Adapta los DTOs de la API (`CartaInventarioApi`, `MazoApi`) al modelo `Carta` de la app (`mapearCartaInventario`, `mapearCartaMazo`, `mapearRareza`, `mapearCategoria`).
- **[Nuevo]** `frontend/src/app/modelos/mazo.model.ts`:
  - Interfaces de los contratos de API de mazos e inventario (`CartaInventarioApi`, `MazoCartaApi`, `MazoApi`, `GuardarMazoRequest`) y aliases de compatibilidad.
- **[Modificación]** `frontend/src/app/modelos/baraja.model.ts`:
  - `LIMITES_BARAJA` define la composición obligatoria por rareza y `completa` requiere alcanzar cada tope, no solo el total.
- **[Modificación]** `frontend/src/app/paginas/mi-baraja/mi-baraja.ts` y `mi-baraja.html`:
  - Agrega campo "Nombre de la baraja", carga el mazo actual desde el backend (`obtenerMazoActual`) y envía el nombre al guardar (`guardarBaraja(cartas, nombre)`).
- **[Modificación]** `frontend/src/app/modelos/baraja.model.spec.ts`, `mi-baraja.spec.ts`, `servicios/baraja.service.spec.ts`:
  - Cobertura actualizada para la conexión HTTP (inventario, mazo vacío, creación de mazo) y la composición obligatoria.

---

## ✅ Checklist
- [ ] Pasaron los tests (`npm test -- --watch=false`)
- [ ] Build correcto (`npm run build`)
- [ ] Sin errores de lint (`npm run lint`)
- [ ] Revisado por otro miembro del equipo

---

## 🧪 Pasos para Verificar (Cómo Probar)
1. **[Cargar inventario]**: Abrir `/usuario/mi-baraja` → Verificar que las cartas se traen del backend (`Mazos/cartas-disponibles`) y solo se muestran las obtenidas (`cantidad > 0`).
2. **[Composición válida]**: Seleccionar cartas hasta completar los topes de cada rareza → Verificar que el botón "Guardar baraja" se habilita solo con la composición válida.
3. **[Guardar con nombre]**: Ingresar un nombre y guardar → Verificar `POST`/`PUT` a `Mazos` con `{ nombre, cartasIds }`.
4. **[Cargar mazo existente]**: Recargar la página con mazo previo → Verificar que se restauran el nombre y las cartas guardadas.
5. **Ejecutar tests**: Correr `npm test -- --watch=false` y comprobar que pasen todas las suites.
