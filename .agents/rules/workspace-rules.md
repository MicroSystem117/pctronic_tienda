# Reglas del Workspace: Tienda Online PC TRONIC + SVA CRM

Este documento complementa las **Reglas Globales de Ingeniería** y define el rol, los límites estrictos de directorios y las convenciones operativas para este proyecto.

## 1. Rol del Workspace y Stack Oficial

- **Rol:** Arquitectura Full-Stack bajo **Protocolo Estricto de Aislamiento por Capas** (Sección 7 de las reglas globales).
- **CRM / ERP Oficial (`../sva_online/`):** El sistema **SVA Online (PHP MVC)** existente en el proyecto padre actúa como CRM, ERP, POS, facturación y gestor de inventario, categorías, banners, clientes, métodos de pago y pedidos. **No se debe duplicar una carpeta `crm/` en este repositorio.**
- **Backend Puente (`backend/`):** API REST stateless en **Node.js 22+ / TypeScript** con arquitectura **DDD + Ports & Adapters (Hexagonal)** conectada a la base de datos MariaDB de `sva_online` mediante consultas preparadas.
- **Base de Datos (`database/`):** Scripts SQL incrementales compatibles con el esquema MariaDB de `sva_online` (tablas auxiliares `refresh_tokens`, `idempotency_keys`, `product_search_terms` y seeds opcionales).
- **Frontend Tienda (`tienda/`):** Aplicación pública en **React + Vite + TypeScript** para **PC TRONIC** (`RIF: J-41317926-1`), basada en la orientación visual de `../UI DESING/834d2659ddbcc7db1c88dd254652aa86.jpg` y aplicando los estándares **Emil Kowalski + Impeccable** (`frontend-ui-ux-standard`).

## 2. Mapa de Fronteras y Directorios Permitidos / Prohibidos

| Capa / Tipo de tarea | Directorios permitidos | Directorios PROHIBIDOS |
| :--- | :--- | :--- |
| **Backend / API / Dominio** | `backend/`, `database/`, `docs/api-contracts.md` | `tienda/`, `../UI DESING/`, `../sva_online/` |
| **Frontend Tienda (UI pública)** | `tienda/`, `docs/design-system.md` | `backend/`, `database/`, `../UI DESING/`, `../sva_online/` |
| **Referencia Visual** | Solo lectura en `../UI DESING/` | Nunca modificar ni eliminar archivos en `../UI DESING/` |
| **SVA CRM** | Solo lectura de esquema/modelos en `../sva_online/` | No alterar la lógica interna de `../sva_online/` sin solicitud explícita |

### Regla de Ejecución Secuencial (Full-Stack)
Cuando una funcionalidad nueva requiera cambios en varias capas, es **obligatorio** ejecutarla en pasos separados:
1. **Paso 1 — Contrato:** Definir o actualizar el contrato de datos en `docs/api-contracts.md`.
2. **Paso 2 — Backend / SQL:** Implementar, validar y probar el módulo en `backend/` y migraciones en `database/`.
3. **Paso 3 — Frontend:** Implementar las vistas en `tienda/` consumiendo el contrato documentado.

Queda estrictamente prohibido editar simultáneamente la lógica de servidor/SQL y los componentes visuales/CSS en el mismo paso de ejecución.

## 3. Reglas Inmutables del Proyecto

1. **Contrato JSON estándar (Sección 7.2):**
   ```json
   {
     "status": "success | error",
     "data": {},
     "message": "Descripción legible"
   }
   ```
   Jamás renombrar claves existentes sin versionar la API (`/api/v1` -> `/api/v2`).
2. **Stateless by Design:** Cero sesiones en memoria local de Node.js. JWT de corta duración + refresh tokens persistidos con hash SHA-256 en MariaDB (`refresh_tokens`).
3. **Idempotencia obligatoria:** `POST /api/v1/store/orders` exige cabecera `Idempotency-Key` respaldada por `idempotency_keys`.
4. **Sin doble descuento de inventario:** `sva_online` descuenta `productos.stock_actual` al aprobar el pago (`Pedido::aprobarPagoYFacturar`). El backend de la tienda verifica stock disponible descontando reservas en estado `pendiente_verificacion` bajo bloqueo `FOR UPDATE` sin descontar `stock_actual` anticipadamente.
5. **Fail Fast & Validación en Frontera:** Validar variables de entorno al inicio y todo `body`, `params` y `query` con Zod antes de invocar casos de uso o SQL.
6. **Twelve-Factor App:** Prohibido hardcodear contraseñas, secretos JWT o rutas absolutas de servidor. Todo se configura vía `.env`.
