# PC TRONIC · Tienda Online integrada con SVA CRM

Vitrina e-commerce desacoplada para **PC TRONIC** (`RIF: J-41317926-1`), inspirada en la estructura de `@NEXORA` y conectada en tiempo real a [sva_online](../sva_online) como CRM/ERP oficial.

## Estructura

```text
PC TRONIC/
├── sva_online/              # CRM / ERP / POS oficial (PHP MVC + MariaDB)
├── UI DESING/               # Logo oficial PC TRONIC y referencia visual
└── tienda-online/
    ├── .agents/rules/       # Reglas de aislamiento por capas
    ├── docs/                # Arquitectura, contratos API v1 y sistema de diseño
    ├── database/            # Migración auxiliar compatible con sva_online + seeds tech demo
    ├── backend/             # API REST Node.js + TypeScript (DDD + Hexagonal) -> :3100
    ├── tienda/              # Frontend Tienda Online (React + Vite + TypeScript) -> :5173
    └── index.php            # Lanzador / verificador rápido de entorno local
```

## Puesta en marcha

1. **Base de datos (`sva_online`):**
   Asegura que la base de datos de `sva_online` esté creada (`../sva_online/database/install.sql`) y aplica la migración auxiliar no destructiva:
   ```bash
   mariadb -u root -p sva_online < database/migrations/001_sva_tienda_support.sql
   ```
   *(Opcional para pruebas si la BD está vacía: `database/seeds/001_pctronic_tech_demo.sql`).*

2. **Backend (`backend/`):**
   ```bash
   cd backend
   cp .env.example .env
   # Configura DB_NAME, DB_USER, DB_PASSWORD, JWT_ACCESS_SECRET y SVA_ROOT_DIR
   npm install
   npm run dev
   ```

3. **Tienda Online (`tienda/`):**
   ```bash
   cd tienda
   cp .env.example .env
   npm install
   npm run dev
   ```
