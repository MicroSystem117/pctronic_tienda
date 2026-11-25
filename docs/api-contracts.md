# Contrato de Datos Inmutable — API REST v1 (PC TRONIC + SVA)

> **Regla de Gobernanza (Sección 7.2):** Fuente única de verdad entre `backend/` y `tienda/`. Ninguna clave existente puede renombrarse o eliminarse sin versionar el endpoint (`/api/v2`).

## 1. Convenciones Globales

- **Base URL:** `/api/v1` (excepto `/health/*` y archivos estáticos `/sva-media/*`).
- **Content-Type:** `application/json; charset=utf-8`.
- **Cabeceras estándar:**
  - `X-Request-Id`: UUID v4 devuelto en toda respuesta.
  - `Authorization: Bearer <access_token>`: obligatorio en `/api/v1/auth/me` y `/api/v1/store/my/orders`.
  - `Idempotency-Key: <12..100 chars>`: obligatorio en `POST /api/v1/store/orders`.

### Formato de Respuesta JSON Estándar

**Éxito:**
```json
{
  "status": "success",
  "data": {},
  "message": "Operación completada correctamente"
}
```

**Error:**
```json
{
  "status": "error",
  "data": {
    "code": "VALIDATION_ERROR",
    "details": [
      { "field": "items", "issue": "Debe incluir al menos un producto" }
    ]
  },
  "message": "Los datos enviados no son válidos"
}
```

---

## 2. Observabilidad (`/health`)

| Método | Ruta | Auth | Respuesta |
| :--- | :--- | :--- | :--- |
| `GET` | `/health/live` | Pública | `200` `{ uptime_seconds, timestamp }` |
| `GET` | `/health/ready` | Pública | `200` / `503` `{ database: "up" \| "down" }` |

---

## 3. Autenticación (`/api/v1/auth`)

- `POST /api/v1/auth/register`: Registra cliente (`usuarios.rol = 'cliente'`) y crea/vincula ficha en `clientes` dentro de transacción.
  - Request: `{ full_name, email, password, phone, document_id?, shipping_address, city }`
  - Response `201`: `{ access_token, expires_in_seconds, user }` + cookie `HttpOnly` `refresh_token`.
- `POST /api/v1/auth/login`: Verifica credenciales contra `usuarios` (soporta hashes Argon2id y bcrypt `$2y$` de SVA).
  - Request: `{ email, password }`
  - Response `200`: `{ access_token, expires_in_seconds, user }`.
- `POST /api/v1/auth/refresh`: Rota `refresh_token` almacenado con SHA-256 en `refresh_tokens`.
- `POST /api/v1/auth/logout`: Revoca el `refresh_token` actual y limpia la cookie.
- `GET /api/v1/auth/me`: Devuelve el perfil del usuario autenticado (`user_id`, `full_name`, `email`, `role`, `phone`, `shipping_address`, `city`, `document_id`).

---

## 4. Endpoints Públicos de la Tienda (`/api/v1/store`)

### 4.1 Banners (`GET /api/v1/store/banners`)
Lee `banners_carrusel` (`activo = 1 ORDER BY orden ASC, id ASC`):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "banner_id": 1,
        "badge_text": "NUEVA GENERACIÓN TECH",
        "title": "Potencia Tu Mundo",
        "highlight_text": "Digital Hoy",
        "subtitle": "Equipos, componentes, periféricos y soporte técnico especializado PC TRONIC.",
        "image_url": "",
        "image_alt": "Banner principal PC TRONIC",
        "cta_label": "Explorar Catálogo",
        "cta_url": "/catalogo",
        "color_start": "#0b1120",
        "color_end": "#0369a1",
        "gradient_angle": 135,
        "display_order": 1
      }
    ]
  },
  "message": "Banners activos obtenidos"
}
```

### 4.2 Categorías (`GET /api/v1/store/categories`)
Lee `categorias` activas con conteo de productos activos:
- Item: `{ category_id, name, slug, subtitle, description, icon, image_url, display_order, active_products_count }`.

### 4.3 Catálogo (`GET /api/v1/store/products`)
- Query params: `q`, `category_slug`, `in_stock` (`true|false`), `min_price`, `max_price`, `sort` (`popular|bestsellers|most_searched|price_asc|price_desc|newest|rating_desc`), `page` (default `1`), `page_size` (default `12`, máx `48`).
- Item: `{ product_id, sku, name, slug, category_id, category_name, brand, compatibility_or_model, short_description, price, compare_at_price, currency, stock_quantity, in_stock, rating_average, rating_count, thumbnail_url, is_featured, sold_count, search_count, popularity_score }`.
- `pagination`: `{ page, page_size, total_items, total_pages }`.

### 4.4 Búsquedas Populares (`GET /api/v1/store/trending-searches?limit=6`)
- Devuelve `{ items: [{ term, search_count }] }` desde `product_search_terms` (o vacío si la tabla auxiliar no ha sido migrada).

### 4.5 Detalle de Producto (`GET /api/v1/store/products/:slug`)
- Acepta `slug` (`nombre-slugificado`), `codigo` (SKU) o `id`.
- Incluye `description`, `images[]`, `variants[]` (desde `producto_variantes` si existen tallas/modelos/colores con stock y precio) y `specs`.

### 4.6 Configuración y Métodos de Pago (`GET /api/v1/store/settings`)
Lee `configuracion` y `metodos_pago` activos en `sva_online`:
```json
{
  "status": "success",
  "data": {
    "company_name": "PC TRONIC",
    "company_rif": "J-41317926-1",
    "company_phone": "+58 414-0000000",
    "company_email": "contacto@pctronic.local",
    "company_address": "Venezuela",
    "free_shipping_threshold": 150,
    "free_shipping_enabled": true,
    "currency": "USD",
    "bcv_rate": 88.0,
    "binance_rate": 95.0,
    "show_bs_prices": true,
    "payment_accounts": {
      "pago_movil": { "enabled": true, "bank": "...", "phone": "...", "document_id": "...", "holder_name": "...", "instructions": "..." },
      "transferencia": { "enabled": true, "bank": "...", "account_number": "...", "account_type": "Corriente", "document_id": "...", "holder_name": "...", "instructions": "..." },
      "zelle": { "enabled": true, "email": "...", "holder_name": "...", "instructions": "..." },
      "binance": { "enabled": true, "pay_id": "...", "email": "...", "holder_name": "...", "instructions": "..." },
      "efectivo": { "enabled": true, "instructions": "..." }
    }
  },
  "message": "Configuración de tienda obtenida"
}
```

### 4.7 Pedidos Online (`POST /api/v1/store/orders`)
- **Headers obligatorios:** `Idempotency-Key: <uuid-v4>`
- **Request:**
  ```json
  {
    "customer": {
      "full_name": "María Pérez",
      "email": "maria@example.com",
      "phone": "04141234567",
      "document_id": "V-20123456",
      "shipping_address": "Av. Principal, Edif. Centro",
      "city": "Valencia"
    },
    "delivery_type": "delivery",
    "payment_method": "pago_movil",
    "payment_reference": "12345678",
    "payment_receipt_data": "data:image/png;base64,...",
    "notes": "Entregar en horario de la tarde",
    "items": [
      { "product_id": 12, "variant_id": null, "quantity": 1 }
    ]
  }
  ```
- **Response `201`:**
  ```json
  {
    "status": "success",
    "data": {
      "order_id": 10,
      "order_number": "PED-00003",
      "order_status": "pendiente_verificacion",
      "delivery_code": "482910",
      "delivery_type": "delivery",
      "subtotal": 120.0,
      "tax_amount": 0,
      "total_amount": 120.0,
      "currency": "USD",
      "bcv_rate": 88.0,
      "created_at": "2026-11-24T13:00:00.000Z"
    },
    "message": "Pedido registrado correctamente"
  }
  ```

### 4.8 Consulta de Pedido y Mis Pedidos (`/api/v1/store/orders/:order_number` y `/api/v1/store/my/orders`)
- `GET /api/v1/store/orders/:order_number?contact=<email_o_telefono>`: Consulta segura por número de pedido (`PED-00001` o número) validando coincidencia con correo o teléfono del cliente; devuelve estado real de `sva_online` (`pendiente_verificacion`, `pago_aprobado`, `listo_para_retirar`, `en_delivery`, `entregado`, `rechazado`), `delivery_code`, `rejection_reason`, `courier_name`, `courier_phone`, `items[]` y totales.
- `GET /api/v1/store/my/orders`: Requiere `Authorization: Bearer <token>`. Lista los pedidos vinculados al cliente autenticado.
