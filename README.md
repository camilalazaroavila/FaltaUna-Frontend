# TPI 2026 — [Nombre del Proyecto]

> Trabajo Práctico Integrador — [Nombre de la materia] — [Año/Cuatrimestre]

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
├── backend/        → API ASP.NET Core
├── database/       → Scripts SQL, diagrama ER, seeds
├── docs/           → Documentación del proyecto
├── .gitignore
└── README.md
```

---

## Instalación y ejecución local

### Requisitos previos

- Node.js ≥ 20 y npm ≥ 10
- .NET SDK ≥ 10
- MySQL ≥ 8

### Frontend

```bash
cd frontend
npm install
npm start
# App disponible en http://localhost:4200
```

### Backend

```bash
cd backend
dotnet restore
dotnet run
# API disponible en http://localhost:5000
# Swagger en http://localhost:5000/swagger
```

### Base de datos

> Instrucciones de configuración de MySQL próximamente.

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
