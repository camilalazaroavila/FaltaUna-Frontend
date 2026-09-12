# TPI2026.API — Backend

> API ASP.NET Core (net10.0) — Clean Architecture / Ports & Adapters en un solo proyecto.

## Estructura de capas

```
src/TPI2026.API/
├── Controladores/                  → Capa de Presentación (HTTP). NUNCA hablan con Repos/Proveedores.
├── DTOs/
│   ├── Solicitudes/                → Contratos de entrada (deserialización de request bodies)
│   └── Respuestas/                 → Contratos de salida (serialización de respuestas)
├── Aplicacion/
│   ├── CasosDeUso/                 → Un caso de uso por operación de negocio (1 acción de controller = 1 use case)
│   ├── Servicios/                  → Lógica compartida entre CasosDeUso (transversal a varios)
│   └── Interfaces/
│       ├── Repositorios/           → PUERTOS: IXxxRepository (fuente de datos de un agregado)
│       └── Proveedores/            → PUERTOS: IXxxProvider (integración externa / cloud)
├── Dominio/
│   └── Modelos/                    → Entidades de negocio puras (sin atributos de EF)
├── Infraestructura/
│   ├── Persistencia/
│   │   ├── AppDbContext.cs         → DbContext de EF Core (MySQL via Pomelo)
│   │   ├── Entidades/              → Clases mapeadas a la BD (separadas de Dominio/Modelos)
│   │   └── Repositorios/           → ADAPTADORES: implementan Aplicacion/Interfaces/Repositorios
│   └── Proveedores/                → ADAPTADORES: implementan Aplicacion/Interfaces/Proveedores
└── Program.cs                      → Composición de raíz (DI) + pipeline HTTP
```

> Las carpetas están en español; los namespaces de C# se mantienen en inglés
> (`TPI2026.API.Application.UseCases`, etc.), que es la convención de los frameworks.

## Regla de dependencia (no negociable)

```
Controllers ──▶ Application (UseCases) ──▶ Domain ──▶ Infrastructure
       │               │                      ▲            │
       │               └── implementaciones ───┘            │
       → DTOs                            (Domain usa los      (Infrastructure implementa
                                          contratos, no la     las interfaces de Application)
                                          implementación)
```

- **Domain no referencia a Infrastructure.** El Domain define los *puertos* (interfaces) pero no sabe quién los implementa.
- **Controllers dependen de Use Cases**, nunca directamente de Repositories/Providers.
- **Infrastructure implementa** las interfaces que `Aplicacion/Interfaces` define; nunca al revés.
- Los DTOs de entrada/salida viven en `DTOs/` (no se filtran entidades de dominio por HTTP).

## Flujo de una petición

```
HTTP Request → Controller → UseCase → (Domain, Services) → XxxRepository/XxxProvider (interface)
                                                                        │
                                                                        ▼
                            Infraestructura: XxxRepository (EF/MySQL) | XxxProvider (externo)
```

## Comandos

El proyecto vive en `src/TPI2026.API/`:

```bash
cd src/TPI2026.API
dotnet restore
dotnet run                # API en http://localhost:5142 · Swagger en /swagger
dotnet build
dotnet test               # cuando existan tests
```

### Migraciones (dotnet-ef local)

El manifest `dotnet-tools.json` está en la raíz de `backend/`, así que funciona desde cualquier subdirectorio:

```bash
cd backend
dotnet tool restore                        # instala dotnet-ef 9.0.20 (local)
cd src/TPI2026.API
dotnet dotnet-ef migrations add <Nombre>
dotnet dotnet-ef database update
```

> ⚠️ Stack de EF en rama 9.x (Pomelo 9.0.0): no mezclar con paquetes EF Core 10.

## Estado actual

- Solo el esqueleto de carpetas (Fase 2 aprobada). No hay entidades, DbContext, ni UseCases todavía.
- DbContext y connection string se configuran en un paso aparte, cuando se definan las entidades.