# TPI 2026 — [Nombre del Proyecto]

> Trabajo Práctico Integrador — [Nombre de la materia] — [Año/Cuatrimestre]

> 📘 **Para entender cómo funciona todo (Docker, base de datos, carpetas con ejemplos y
> verificación del localhost): leer [docs/guia-de-arranque.md](docs/guia-de-arranque.md).**

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Angular 20 (Standalone Components, SCSS, Jest) |
| Backend | .NET 10 — ASP.NET Core Web API (Controllers) |
| Base de datos | MySQL |

## Integrantes

| Nombre | Legajo | Rol |
|---|---|---|
| (Nombre 1) | (Legajo) | - |
| (Nombre 2) | (Legajo) | - |
| (Nombre 3) | (Legajo) | - |

> ✏️ *Completar con los datos del equipo.*

---

## Estructura del repositorio

```
TPI-2026/
├── frontend/       → App Angular
├── backend/        → API ASP.NET Core (ver backend/README.md)
├── database/       → Scripts SQL, diagrama ER, seeds
├── docs/           → Documentación del proyecto (empezar por docs/guia-de-arranque.md)
├── .gitignore
├── docker-compose.yml  → Base de datos MySQL para desarrollo
└── README.md
```

---

## Instalación y ejecución local

### Requisitos previos

- Node.js ≥ 20 y npm ≥ 10
- .NET SDK ≥ 10
- Docker Engine + Docker Compose (para la base de datos)
- MySQL ≥ 8 (solo si no se usa Docker)

### Frontend

```bash
cd frontend
npm i
npm start
# App disponible en http://localhost:4200 (dev en http://localhost:4300)
```

Scripts útiles:

| Script | Descripción |
|---|---|
| `npm start` | Servidor de desarrollo (puerto 4300) |
| `npm test` | Tests con Jest |
| `npm run lint` | ESLint (reglas de Mercado Sinérgico) — corrige automáticamente |
| `npm run format` | Prettier sobre `src/` |

### Backend

```bash
cd backend/src/TPI2026.API
dotnet restore
dotnet run
# API disponible en http://localhost:5142
# Swagger en http://localhost:5142/swagger
```

EF Core usa Pomelo `9.0.20` (rama 9.x) sobre .NET 10. La CLI de migraciones es una herramienta local (manifest en la raíz de `backend/`):

```bash
cd backend
dotnet tool restore        # instala dotnet-ef 9.0.20 (local)
cd src/TPI2026.API
dotnet dotnet-ef --version
```

> ⚠️ No mezclar con paquetes EF Core 10: Pomelo 9.0.0 fija el stack a 9.0.x.

### Base de datos

Levantar MySQL (versión LTS `8.4`) con Docker, sin instalación local:

```bash
docker compose up -d
# MySQL disponible en localhost:3306
# Datos persistidos en el volumen nombrado `mysql_data`
```

Credenciales de desarrollo por defecto (definidas en `docker-compose.yml`):

| Variable | Valor |
|---|---|
| Base de datos | `tpi2026` |
| Usuario | `tpi2026` |
| Contraseña | `tpi2026_dev` |
| Root | `root_tpi2026` |

Para bajar el contenedor: `docker compose down` (agregar `-v` para borrar también el volumen de datos).

> El connection string del backend se configura en un paso aparte, una vez definidas las entidades.

---

## Convenciones de branches

| Tipo | Nombre |
|---|---|
| Features | `feat/<descripcion>` |
| Correcciones | `fix/<descripcion>` |
| Documentación | `docs/<descripcion>` |

> Rama principal: `main` — Rama de desarrollo: `dev`

---

## Licencia

Uso académico — [Institución educativa].
