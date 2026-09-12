# Base de datos — TPI 2026

Motor: **MySQL**

## Estructura

| Carpeta | Contenido |
|---|---|
| `migrations/` | Scripts SQL versionados (`V001_create_tables.sql`, `V002_...`) |
| `seeds/` | Datos de prueba e inicialización |
| `diagrams/` | Diagrama ER (`.drawio` / `.png` / `.dbml`) |

## Convención de nomenclatura

Los scripts de migración siguen el patrón:

```
V<número>__<descripcion_en_snake_case>.sql
```

Ejemplo: `V001__create_usuarios_table.sql`

> ⚠️ No modificar scripts ya aplicados. Para revertir, crear un nuevo script de rollback.
