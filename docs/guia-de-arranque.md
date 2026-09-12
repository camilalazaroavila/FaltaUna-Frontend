# Guía de arranque para el equipo — TPI 2026

> Esta guía explica cómo está armado el repo, cómo funciona la base de datos con Docker,
> qué hay que instalar, para qué sirve cada carpeta (con ejemplos) y cómo saber que el
> "localhost vacío" está corriendo bien.
> Tiempo estimado de leer: 10 minutos.

---

## 1. Stack y estructura del repositorio

| Capa | Tecnología |
|---|---|
| Frontend | Angular 20 (Standalone Components, SCSS, Jest) en `frontend/` |
| Backend | ASP.NET Core Web API sobre .NET 10 en `backend/src/TPI2026.API` |
| Base de datos | MySQL 8.4 LTS, levantada con Docker Compose (`docker-compose.yml` en la raíz) |

```
TPI-2026/
├── frontend/                  → App Angular (UI)
├── backend/
│   ├── README.md              → Arquitectura del backend a fondo
│   ├── dotnet-tools.json      → Manifest de la CLI dotnet-ef (migraciones)
│   └── src/TPI2026.API/       → Proyecto Web API (Clean Architecture, carpetas en español)
├── database/                  → Scripts SQL, diagramas y seeds (por completar)
├── docs/                      → Documentación (esta guía, consignas, reuniones)
├── docker-compose.yml         → define el MySQL del equipo
└── README.md                  → resumen + acceso rápido
```

---

## 2. Cómo funciona la base de datos con Docker Compose

**Idea central: nadie instala MySQL en su máquina.** El `docker-compose.yml` describe
la base de datos completa como un archivo de texto: versión (MySQL 8.4 LTS), credenciales,
puerto y dónde guarda los datos. Con **un solo comando** cada desarrollador la levanta.

### Qué hace exactamente `docker compose up -d`

1. Descarga la imagen oficial `mysql:8.4` (una sola vez).
2. Crea y arranca un contenedor llamado `tpi2026-mysql`.
3. Crea la base `tpi2026` con el usuario y contraseña definidos abajo.
4. Deja MySQL "expuesto" en el puerto **3306** de tu PC.

Los datos **persisten** entre apagados: viven en el volumen nombrado `mysql_data`
(`/var/lib/mysql` dentro del contenedor). Si borrás el contenedor con `docker compose down`,
la data sigue ahí. Solo `docker compose down -v` borra también los datos.

### ¿Cómo se relaciona con "una base compartida"?

Cada desarrollador tiene **su propia base local**, pero todas son **idénticas**:
misma versión (8.4), mismas credenciales, mismo puerto. El esquema (tablas) se replica
igual en todas porque se genera desde las **migraciones de EF Core** cuando existan
(`dotnet dotnet-ef database update`). Así nadie rompe la base de otro y no dependés de internet.

### Valores configurados (definidos en `docker-compose.yml`)

| Variable | Valor por defecto | ¿Cuándo lo cambiaría? |
|---|---|---|
| Imagen | `mysql:8.4` | Nunca (versión LTS fija para todos) |
| Nombre contenedor | `tpi2026-mysql` | Nunca |
| Base de datos | `tpi2026` | Solo si el grupo decide otro nombre |
| Usuario | `tpi2026` | Solo si el grupo decide cambiarlo |
| Contraseña | `tpi2026_dev` | Solo si el grupo decide cambiarla |
| Root | `root_tpi2026` | Solo si el grupo decide cambiarla |
| Puerto host | `3306` | Solo si tenés algo ocupando el 3306 (ver FAQ) |
| Volumen | `mysql_data` | Nunca (vive en Docker, no en el repo) |

> **Regla del equipo:** dejar estos valores por defecto para que la conexión del backend
> sea igual para todos. Cambios de credencial se acuerdan en grupo y se actualizan en el
> connection string del backend y en el healthcheck del `docker-compose.yml`. El único
> cambio individual tolerado es el **puerto host** si hay conflicto.

Si tu PC ya tiene un MySQL/SQL Server local, **no hace falta desinstalarlo**: podés cambiar
el lado izquierdo del mapeo `"3306:3306"` a algo libre, por ejemplo `"3307:3306"`, y anotarlo
para que el connection string del backend use 3307 en TU máquina.

---

## 3. Requisitos previos (todo lo que hay que instalar)

| Herramienta | Versión | Para qué sirve | Instalación |
|---|---|---|---|
| Git | cualquier | bajar/consistir el repo | https://git-scm.com |
| Node.js | **20.19+ o 22 LTS+** | correr Angular | https://nodejs.org |
| .NET SDK | **10.x** (el proyecto apunta a `net10.0`) | compilar/correr la API | https://dotnet.microsoft.com/download/dotnet/10.0 |
| Docker Desktop | últ. estable | dar de alta el MySQL | https://www.docker.com/products/docker-desktop/ (requiere WSL2 y virtualización activa) |

> **No se instala MySQL, ni MySQL Workbench, ni nada más.** Todo lo de la base viene en Docker.

Para chequear que estás listo:

```bash
node -v         # y
npm  -v
dotnet --list-sdks        # debe incluir una versión 10.x
docker --version
docker compose version
```

---

## 4. Primer arranque (paso a paso, por máquina)

```bash
# 1) Traer el repo
git clone <url-del-repo>.git
cd TPI-2026

# 2) Levantar la base de datos (descarga la imagen la primera vez)
docker compose up -d
docker compose ps        # debe mostrar tpi2026-mysql con estado "running" y "healthy"

# 3) Instalar dependencias del frontend
cd frontend
npm install

# 4) Instalar la CLI de migraciones del backend (local, una sola vez)
cd ../backend
dotnet tool restore
cd src/TPI2026.API
dotnet build             # debe terminar en 0 errores / 0 advertencias

# 5) Correr el frontend (activo en http://localhost:4300)
cd ../../../frontend
npm start

# 6) Correr el backend (activo en http://localhost:5142, Swagger en /swagger)
cd ../backend/src/TPI2026.API
dotnet run
```

> Verificación final: abrí http://localhost:4300 (debe mostrar el `app-root` de Angular,
> hoy con contenido por defecto) y http://localhost:5142/swagger (debe abrir la UI de Swagger,
> hoy sin endpoints porque todavía no hay controllers de negocio).

---

## 5. Estado actual (qué está y qué falta)

| Componente | Estado | Cómo se ve |
|---|---|---|
| Frontend | ✅ corre en vacío | `npm start` → http://localhost:4300 responde 200 |
| Backend | ✅ compila y corre en vacío | `http://localhost:5142/swagger` responde 200 (no toca la base) |
| MySQL | ▶️ se levanta con Docker | no hay tablas todavía |
| Entidades / DbContext | ⏳ pendiente | se genera cuando definamos el feature list del negocio |
| Migraciones | ⏳ pendiente | `dotnet dotnet-ef database update` los crea igual en todos |

> Hoy el backend **no necesita** MySQL corriendo para arrancar (todavía no configura el
> DbContext). En cuanto metamos entidades, el orden será: Docker arriba → migraciones → API.
> La URL del frontend es **http://localhost:4300** (el 4200 del README genérico de Angular no aplica).

---

## 6. Estructura de carpetas del backend — para qué sirve cada una (con ejemplos)

El backend sigue **Clean Architecture / Ports & Adapters**. La regla de oro:

> **El flujo siempre es**: `Controladores → Aplicacion (CasosDeUso) → Interfaces (puertos)
> → Infraestructura (implementaciones)`. Nunca al revés, y el Dominio no sabe nada de EF ni MySQL.

```
backend/src/TPI2026.API/
├── Controladores/            → Contratos HTTP: reciben el request, validan formato y delegan en un CasoDeUso
├── DTOs/
│   ├── Solicitudes/          → lo que ENTRÁ en el cuerpo de un POST/PUT
│   └── Respuestas/           → lo que SALE (para no filtrar entidades de dominio por HTTP)
├── Aplicacion/
│   ├── CasosDeUso/           → 1 clase por acción de negocio. Es el corazón del sistema
│   ├── Servicios/            → lógica compartida entre varios CasosDeUso (opcional, vacía por ahora)
│   └── Interfaces/
│       ├── Repositorios/     → PUERTOS de datos: IXxxRepositorio (qué necesito, no cómo)
│       └── Proveedores/      → PUERTOS a servicios externos (pagos, mail, cloud). Solo si lo necesita el TPI
├── Dominio/
│   └── Modelos/              → entidades de negocio puras, sin atributos de EF
├── Infraestructura/
│   ├── Persistencia/
│   │   ├── AppDbContext.cs   → DbContext de EF Core (se crea más adelante, con tu OK)
│   │   ├── Entidades/        → clases mapeadas a las tablas MySQL (separadas del Dominio)
│   │   └── Repositorios/     → ADAPTADORES: implementan los puertos hablando con EF/MySQL
│   └── Proveedores/          → ADAPTADORES: implementan los puertos externos
└── Program.cs                → composición raíz: registra todo en el contenedor de DI y arma el pipeline
```

### Ejemplo ilustrativo (futuro): la feature "Producto"

**Controlador** — solo recibe HTTP y delega (nunca toca la base):

```csharp
[ApiController]
[Route("api/productos")]
public class ProductosController : ControllerBase
{
    private readonly CrearProductoCasoDeUso _casoDeUso;
    public ProductosController(CrearProductoCasoDeUso casoDeUso) => _casoDeUso = casoDeUso;

    [HttpPost]
    public async Task<IActionResult> Crear(CrearProductoSolicitud solicitud)
    {
        var resultado = await _casoDeUso.EjecutarAsync(solicitud);
        return CreatedAtAction(nameof(Crear), new { id = resultado.Id }, resultado);
    }
}
```

**DTO/Solicitud** — el contrato de entrada:

```csharp
public class CrearProductoSolicitud
{
    public required string Nombre { get; set; }
    public decimal Precio { get; set; }
}
```

**CasoDeUso** — la acción de negocio en sí. Depende de una *interfaz*, no de EF:

```csharp
public class CrearProductoCasoDeUso
{
    private readonly IProductoRepositorio _repositorio;
    public CrearProductoCasoDeUso(IProductoRepositorio repositorio) => _repositorio = repositorio;

    public async Task<CrearProductoRespuesta> EjecutarAsync(CrearProductoSolicitud solicitud)
    {
        var producto = new Producto(solicitud.Nombre, solicitud.Precio);
        await _repositorio.AgregarAsync(producto);
        return new CrearProductoRespuesta { Id = producto.Id, Nombre = producto.Nombre };
    }
}
```

**Puerto (Interfaces/Repositorios)** — el contrato de datos:

```csharp
public interface IProductoRepositorio
{
    Task<Producto?> ObtenerPorIdAsync(int id);
    Task AgregarAsync(Producto producto);
}
```

**Dominio/Modelos** — entidad pura, sin saber de MySQL:

```csharp
public class Producto
{
    public int Id { get; private set; }
    public string Nombre { get; private set; }
    public decimal Precio { get; private set; }

    public Producto(string nombre, decimal precio)
    {
        Nombre = nombre;
        Precio = precio;
    }
}
```

**Infraestructura/Persistencia/Repositorios** — el adaptador que SÍ conoce EF:

```csharp
public class ProductoRepositorio : IProductoRepositorio
{
    private readonly AppDbContext _db;
    public ProductoRepositorio(AppDbContext db) => _db = db;

    public async Task AgregarAsync(Producto producto)
    {
        _db.Productos.Add(producto);
        await _db.SaveChangesAsync();
    }
}
```

**Program.cs** — se registra el adaptador contra el puerto:

```csharp
builder.Services.AddScoped<IProductoRepositorio, ProductoRepositorio>();
builder.Services.AddScoped<CrearProductoCasoDeUso>();
```

> **`Interfaces/Proveedores` e `Infraestructura/Proveedores`** solo importan si el TPI
> integra algo externo (por ej. un gateway de pagos como MercadoPago, mails, o una API de terceros).
> Si el dominio no lo pide, esas carpetas quedan vacías sin problema.

### Frontend (resumen)

```
frontend/src/
├── app/
│   ├── components/    → piezas de UI reutilizables
│   ├── services/      → llamadas HTTP a la API (Angular HttpClient)
│   └── *.ts           → módulos de la app
├── styles.scss        → estilos globales (importa Font Awesome)
└── ...
```

Regla simple: **los componentes NO llaman a la API directamente**; pasan por un
`service`. Se llenan a medida que definamos pantallas.

---

## 7. Comandos útiles

| Comando (desde la carpeta indicada) | Qué hace |
|---|---|
| `frontend`: `npm start` | dev server en http://localhost:4300 |
| `frontend`: `npm run lint` | ESLint corregido automáticamente (reglas estilo Mercado Sinérgico) |
| `frontend`: `npm run format` | Prettier sobre `src/` |
| `frontend`: `npm test` | Tests de Jest (hoy 2/2) |
| `backend/src/TPI2026.API`: `dotnet build` | compila la API (0 errores / 0 warnings) |
| `backend/src/TPI2026.API`: `dotnet run` | arranca la API en http://localhost:5142 |
| `backend/src/TPI2026.API`: `dotnet dotnet-ef database update` | aplica migraciones (cuando existan) en tu MySQL |
| `backend/src/TPI2026.API`: `dotnet dotnet-ef migrations add <Nombre>` | crea una migración desde las entidades |
| raíz: `docker compose up -d` | levanta MySQL |
| raíz: `docker compose ps` | estado del contenedor |
| raíz: `docker compose down` | apaga MySQL (mantiene los datos) |
| raíz: `docker compose down -v` | apaga MySQL y BORRA los datos |

---

## 8. FAQ / problemas comunes

**"El puerto 3306 ya está en uso"**
Algo (otro MySQL, una app) ocupa el 3306. Cambiá el mapeo en `docker-compose.yml` a
`"3307:3306"` (solo el lado izquierdo) y avisá al grupo qué puerto local usás para que tu
connection string use ese.

**"`docker compose up -d` tarda mucho la primera vez"**
Es normal: descarga la imagen `mysql:8.4` (~600 MB). Las siguientes veces es instantáneo.

**"Docker Desktop dice que WSL2 no está habilitado"**
Habilitá WSL2 (`wsl --install` en PowerShell como admin) y activá la virtualización en la BIOS.
Requerimiento del propio Docker Desktop.

**"¿Tengo que abrir Docker cada vez que apago la PC?"**
Si Docker Desktop no está corriendo, el contenedor no puede estar arriba. Abrí Docker Desktop
y después `docker compose up -d`.

**"¿Y si no quiero usar Docker?"**
Instalá MySQL 8 y creá la base `tpi2026` con las mismas credenciales que el compose
(usuario `tpi2026`, password `tpi2026_dev`, root `root_tpi2026`). El resto del flujo no cambia.
Puede ser la alternativa para máquinas sin virtualización.

**"El backend pega error de HTTPS / certificado"**
No usamos el perfil `https` para la vida diaria. Con `dotnet run` se usa el perfil `http`
y va por http://localhost:5142 sin certificados.

---

## 9. Decisión clara para el equipo

1. Se usa **Docker Compose para MySQL**: cada uno levanta su base local idéntica con
   `docker compose up -d`. Sin instalar MySQL. Sin nube.
2. Backend con **Clean Architecture**: carpetas en español, flujo siempre
   `Controlador → CasoDeUso → Interfaz → Implementación`.
3. **Primeros pasos de hoy**: frontend y backend ya corren en vacío (4300 y 5142).
   El próximo feature list del TPI define qué entidades y qué endpoints agregamos primero.