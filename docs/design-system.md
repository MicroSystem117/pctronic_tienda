# Sistema de Diseño Visual — PC TRONIC

- **Referencia de orientación UI:** [834d2659ddbcc7db1c88dd254652aa86.jpg](file:///home/maguey/Proyectos/PC%20TRONIC/UI%20DESING/834d2659ddbcc7db1c88dd254652aa86.jpg)
- **Identidad y Logo:** [logo pctronic (1).bmp](file:///home/maguey/Proyectos/PC%20TRONIC/UI%20DESING/logo%20pctronic%20%281%29.bmp) (`PC TRONIC`, `RIF: J-41317926-1`)
- **Estándares UI/UX:** `frontend-ui-ux-standard` (**Emil Kowalski** para física/micro-interacciones + **Impeccable** para escala espacial, tipografía tabular y precisión visual).

---

## 1. Paleta de Color y Tokens (Derivada del Logo PC TRONIC + Referencia UI)

La referencia `UI DESING` combina un **cuerpo luminoso y limpio** (fondo blanco/gris hielo para lectura cómoda de catálogo y tarjetas) con **franjas de alto contraste oscuro tecnológico** (top bar, hero banner y newsletter) y **acentos azul eléctrico / cian** presentes directamente en el logotipo de PC TRONIC.

| Token CSS | Valor | Uso Principal |
| :--- | :--- | :--- |
| `--color-bg-page` | `#F8FAFC` | Fondo general de la tienda (superficie clara Impeccable) |
| `--color-surface` | `#FFFFFF` | Header, barra de categorías, tarjetas de producto y modales |
| `--color-surface-muted` | `#F1F5F9` | Contenedores de categorías circulares, fondo de imagen de producto |
| `--color-border` | `#E2E8F0` | Bordes finos `1px` de tarjetas, inputs y divisores |
| `--color-bg-dark` | `#0B1120` | Top utility bar, Hero Banner tech, Banner Flash Offers y Newsletter |
| `--color-surface-dark` | `#111827` | Superficies elevadas sobre fondo oscuro |
| `--color-border-dark` | `rgba(255, 255, 255, 0.12)` | Divisores sutiles en bloques oscuros |
| `--color-brand-primary` | `#2563EB` | Azul eléctrico principal (botón buscar, CTAs primarios, badge carrito) |
| `--color-brand-primary-hover` | `#1D4ED8` | Estado hover de botones primarios |
| `--color-brand-cyan` | `#00D4FF` | Cian luminoso de la letra "C" del logo PC TRONIC (acentos sobre oscuro) |
| `--color-brand-sky` | `#0EA5E9` | Enlaces destacados, iconos de garantías y foco accesible |
| `--color-accent-deals` | `#EF4444` | Etiqueta "Ofertas" y alertas de urgencia / Flash Offers |
| `--color-text` | `#0F172A` | Títulos y texto principal sobre fondo claro |
| `--color-text-muted` | `#64748B` | Subtítulos, descripciones, SKU y metadatos |
| `--color-text-on-dark` | `#F8FAFC` | Texto principal sobre hero y franjas oscuras |
| `--color-text-muted-dark` | `#94A3B8` | Texto secundario sobre oscuro |
| `--color-rating` | `#F59E0B` | Estrellas de valoración |
| `--color-success` | `#16A34A` | Stock disponible, envío gratis, pedido entregado |
| `--color-warning` | `#D97706` | Stock bajo, verificación pendiente |

---

## 2. Tipografía y Precisión Numérica (Impeccable)

- **Display / Encabezados:** `Plus Jakarta Sans`, tracking `-0.025em`, `line-height: 1.15`.
- **Cuerpo / UI:** `Inter`, pesos `400`, `500`, `600`, `700`.
- **Cifras y códigos:** `JetBrains Mono` / `tabular-nums` obligatorio (`font-variant-numeric: tabular-nums`) en precios USD, cantidades de stock, contadores y números de orden (y equivalentes en Bs / tasa BCV **exclusivamente en el Checkout**).

---

## 3. Física y Micro-interacciones (Emil Kowalski)

- `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)` para drawer de carrito, dropdown de categorías y modales (`200ms–280ms`).
- `--ease-tactile: cubic-bezier(0.32, 0.72, 0, 1)` para botones, chips, tabs y tarjetas (`120ms–180ms`).
- `:active` en botones y tarjetas interactivas: `transform: scale(0.975)`.
- Solo animar `transform` y `opacity` (GPU-safe) con soporte `@media (prefers-reduced-motion: reduce)`.
- `CLS = 0`: `aspect-ratio` fijo en hero, círculos de categorías y miniaturas de productos.

---

## 4. Estructura de la Portada (Mapeada a `834d2659ddbcc7db1c88dd254652aa86.jpg`)

1. **Top Utility Bar (Oscura `#0B1120`):** Mensajes clave (Envío nacional / Retiro en tienda, Respaldo SVA en tiempo real), RIF oficial y `Rastrear Pedido`.
2. **Header Principal (Blanco `#FFFFFF`, sticky):** Logo oficial de **PC TRONIC** (`RIF: J-41317926-1`), buscador central prominente con botón azul, y acciones: `Mi Cuenta`, `Favoritos` (con badge) y `Carrito` (con badge azul).
3. **Barra de Categorías (Blanca con borde inferior `1px`):** Botón desplegable `Todas las Categorías` + enlaces rápidos de categorías activas de `sva_online` + `Ofertas`.
4. **Hero Carrusel Tech (Oscuro `#0B1120`, alimentado desde `banners_carrusel` de `sva_online`):** Titular blanco + acento cian/azul, subtítulo, botón pill CTA, 3 insignias de confianza (`Hardware Certificado`, `Garantía PC TRONIC`, `Stock Real SVA`) y controles de carrusel.
5. **Categorías Circulares Rápidas:** Fila horizontal/responsive de círculos claros (`aspect-ratio: 1/1`) con icono/categoría y etiqueta.
6. **Productos Destacados / Tendencias:** Grid 4-5 columnas con tarjetas blancas borde `1px`, botón corazón de favoritos, imagen `aspect-ratio: 4/3`, título, descripción breve, precio USD y estrellas. *(La tasa BCV y su equivalente en Bs se muestran únicamente en el Checkout).*
7. **Banners Promocionales Divididos:** Izquierda oscuro (`OFERTAS FLASH` con temporizador en tiempo real) + derecha claro (`NUEVOS INGRESOS` con badge `NUEVO`).
8. **Recomendados / Más Vendidos:** Segunda grilla de productos ordenada por ventas reales/popularidad en `sva_online`.
9. **Franja de 4 Garantías:** Iconos circulares azul claro (`Envío Seguro`, `Garantía Directa`, `Atención Técnica`, `Equipos Originales`).
10. **Franja Oscura de Newsletter / Contacto + Footer Claro:** Logo PC TRONIC, RIF `J-41317926-1`, columnas de navegación y métodos de pago activos (`Pago Móvil`, `Transferencia`, `Zelle`, `Binance`, `Efectivo`).
