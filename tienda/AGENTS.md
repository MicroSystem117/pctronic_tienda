# Reglas de Capa: Frontend Tienda Online (`tienda/`)

- **Alcance permitido:** Exclusivamente `tienda/`.
- **Prohibido:** Modificar archivos dentro de `backend/`, `database/` o `../sva_online/`. Si un componente necesita un dato que la API aún no expone, documentar la solicitud en `docs/api-contracts.md` o usar un mock tipado alineado al contrato sin tocar el backend en el mismo paso.
- **Lineamientos de UI y UX (`frontend-ui-ux-standard` + `../UI DESING/`):**
  - Orientación visual obligatoria basada en `../UI DESING/834d2659ddbcc7db1c88dd254652aa86.jpg` y el logo oficial de **PC TRONIC** (`RIF: J-41317926-1`).
  - **Estándar Emil Kowalski:** Curvas `--ease-out-expo` y `--ease-tactile`, tiempos `120ms-180ms` (micro) y `200ms-300ms` (paneles/drawers), feedback `:active` con `scale(0.975)`, solo animar `transform` y `opacity`, soporte `prefers-reduced-motion: reduce`.
  - **Estándar Impeccable:** Escala espacial múltiplo de `4px`/`8px`, `font-variant-numeric: tabular-nums` en precios USD/Bs, tasas y stock, bordes finos `1px`, contrastes AA/AAA.
  - **Mobile-First & Zero CLS (`CLS = 0`):** Dimensiones/aspect-ratio reservados en banners, categorías y tarjetas de producto.
  - **Skeleton Screens & Empty States:** Esqueletos geométricos en carga y estados vacíos claros.
  - **Atomic Design:** Organizar UI reutilizable en `src/shared/ui/{atoms,molecules,organisms,templates}`.
