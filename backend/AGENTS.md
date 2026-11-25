# Reglas de Capa: Backend (`backend/`)

- **Alcance permitido:** Exclusivamente `backend/` y migraciones en `database/`.
- **Prohibido:** Modificar archivos dentro de `tienda/` o `../sva_online/`.
- **Arquitectura obligatoria:** DDD + Ports & Adapters (`domain/`, `application/`, `infrastructure/`) por módulo (`health`, `auth`, `catalog`, `banners`, `sales`, `settings`).
- **Reglas técnicas clave:**
  - TypeScript en modo estricto (`"strict": true`, sin `any` implícitos).
  - Consultas preparadas parametrizadas obligatorias (prevención de SQLi).
  - Ninguna cadena HTML o CSS embebida en controladores o servicios.
  - Contrato JSON inmutable `{ status, data, message }` según `docs/api-contracts.md`.
  - Compatibilidad de contraseñas con `sva_online`: verificación dual Argon2id (`$argon2...`) y bcrypt PHP (`$2y$`/`$2b$`/`$2a$`), generando nuevos hashes con Argon2id.
  - Endpoint `POST /api/v1/store/orders` protegido con `Idempotency-Key` y transacción ACID (`FOR UPDATE`).
