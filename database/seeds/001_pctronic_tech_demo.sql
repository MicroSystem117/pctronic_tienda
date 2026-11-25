-- =============================================================================
-- Seed Opcional: Datos iniciales de PC TRONIC para pruebas locales sobre sva_online
-- No borra datos existentes; inserta solo si no existen los códigos/nombres.
-- =============================================================================

-- 1. Identidad comercial de PC TRONIC en configuración de SVA
INSERT INTO `configuracion` (`clave`, `valor`, `descripcion`) VALUES
('empresa_nombre', 'PC TRONIC', 'Nombre comercial de la empresa'),
('empresa_rif', 'J-41317926-1', 'RIF oficial de PC TRONIC'),
('empresa_slogan', 'Tecnología, Computación y Soporte Especializado', 'Eslogan comercial'),
('empresa_email', 'ventas@pctronic.com.ve', 'Correo oficial')
ON DUPLICATE KEY UPDATE `valor` = VALUES(`valor`);

-- 2. Categorías tecnológicas PC TRONIC
INSERT IGNORE INTO `categorias` (`nombre`, `prefijo`, `descripcion`, `estado`, `icono`) VALUES
('Laptops y Portátiles', 'LAP', 'Equipos portátiles para oficina, diseño y gaming', 'activo', 'fa-solid fa-laptop'),
('Componentes PC', 'CMP', 'Procesadores, tarjetas madre, memorias RAM y GPU', 'activo', 'fa-solid fa-microchip'),
('Monitores', 'MON', 'Pantallas IPS, curvas y gaming de alta tasa de refresco', 'activo', 'fa-solid fa-desktop'),
('Gaming', 'GAM', 'Controles, teclados mecánicos, mouse y setups gamer', 'activo', 'fa-solid fa-gamepad'),
('Audio y Sonido', 'AUD', 'Audífonos inalámbricos, micrófonos y cornetas', 'activo', 'fa-solid fa-headphones'),
('Almacenamiento', 'ALM', 'Unidades SSD NVMe, discos externos y memorias USB', 'activo', 'fa-solid fa-hard-drive'),
('Redes y Conectividad', 'RED', 'Routers Wi-Fi 6, switches, repetidores y cableado', 'activo', 'fa-solid fa-wifi'),
('Periféricos y Accesorios', 'PER', 'Teclados, mouse, webcams, bases y mochilas', 'activo', 'fa-solid fa-keyboard');

-- 3. Productos demo de PC TRONIC (compatibles con tabla productos + productos_depositos)
INSERT IGNORE INTO `productos`
  (`codigo`, `nombre`, `descripcion`, `categoria_id`, `talla`, `color`, `costo_usd`, `porcentaje_utilidad`, `porcentaje_iva`, `precio_usd`, `stock_actual`, `stock_minimo`, `estado`)
SELECT 'PCT-LAP-001', 'Laptop ProBook 15 Ryzen 7 16GB / 512GB NVMe', 'Pantalla FHD IPS 15.6", SSD PCIe 4.0 y chasis de aluminio ultraligero.', c.id, '15.6" FHD · Ryzen 7 7730U · 16GB RAM', 'HP / Plata', 520.00, 25.00, 16.00, 650.00, 8, 2, 'activo'
FROM `categorias` c WHERE c.nombre = 'Laptops y Portátiles' LIMIT 1;

INSERT IGNORE INTO `productos`
  (`codigo`, `nombre`, `descripcion`, `categoria_id`, `talla`, `color`, `costo_usd`, `porcentaje_utilidad`, `porcentaje_iva`, `precio_usd`, `stock_actual`, `stock_minimo`, `estado`)
SELECT 'PCT-ALM-002', 'SSD NVMe Kingston NV2 1TB M.2 PCIe 4.0', 'Lectura hasta 3500 MB/s ideal para acelerar laptops y PC de escritorio.', c.id, 'M.2 2280 · PCIe 4.0 x4', 'Kingston', 48.00, 35.00, 16.00, 68.00, 18, 4, 'activo'
FROM `categorias` c WHERE c.nombre = 'Almacenamiento' LIMIT 1;

INSERT IGNORE INTO `productos`
  (`codigo`, `nombre`, `descripcion`, `categoria_id`, `talla`, `color`, `costo_usd`, `porcentaje_utilidad`, `porcentaje_iva`, `precio_usd`, `stock_actual`, `stock_minimo`, `estado`)
SELECT 'PCT-MON-003', 'Monitor Gaming 27" IPS 165Hz 1ms', 'Resolución Full HD, FreeSync Premium, panel IPS sin bordes y ajuste inclinable.', c.id, '27" · 165Hz · HDMI/DP', 'LG UltraGear', 165.00, 30.00, 16.00, 219.00, 6, 2, 'activo'
FROM `categorias` c WHERE c.nombre = 'Monitores' LIMIT 1;

INSERT IGNORE INTO `productos`
  (`codigo`, `nombre`, `descripcion`, `categoria_id`, `talla`, `color`, `costo_usd`, `porcentaje_utilidad`, `porcentaje_iva`, `precio_usd`, `stock_actual`, `stock_minimo`, `estado`)
SELECT 'PCT-GAM-004', 'Teclado Mecánico RGB 75% Hot-Swap', 'Switches lineales prelubricados, retroiluminación RGB por tecla y cable USB-C.', c.id, 'Español · Switches Red · USB-C', 'Redragon', 34.00, 40.00, 16.00, 49.00, 14, 3, 'activo'
FROM `categorias` c WHERE c.nombre = 'Gaming' LIMIT 1;

INSERT IGNORE INTO `productos`
  (`codigo`, `nombre`, `descripcion`, `categoria_id`, `talla`, `color`, `costo_usd`, `porcentaje_utilidad`, `porcentaje_iva`, `precio_usd`, `stock_actual`, `stock_minimo`, `estado`)
SELECT 'PCT-AUD-005', 'Audífonos Inalámbricos Studio ANC Pro', 'Cancelación activa de ruido, Bluetooth 5.3 y hasta 40 horas de autonomía.', c.id, 'Bluetooth 5.3 · USB-C', 'Sony', 55.00, 35.00, 16.00, 79.00, 11, 3, 'activo'
FROM `categorias` c WHERE c.nombre = 'Audio y Sonido' LIMIT 1;

INSERT IGNORE INTO `productos`
  (`codigo`, `nombre`, `descripcion`, `categoria_id`, `talla`, `color`, `costo_usd`, `porcentaje_utilidad`, `porcentaje_iva`, `precio_usd`, `stock_actual`, `stock_minimo`, `estado`)
SELECT 'PCT-CMP-006', 'Memoria RAM DDR5 32GB (2x16GB) 6000MHz', 'Kit dual channel de alto rendimiento con disipador térmico de perfil bajo.', c.id, 'DDR5 6000MT/s CL30', 'Corsair', 85.00, 32.00, 16.00, 118.00, 9, 2, 'activo'
FROM `categorias` c WHERE c.nombre = 'Componentes PC' LIMIT 1;

INSERT IGNORE INTO `productos`
  (`codigo`, `nombre`, `descripcion`, `categoria_id`, `talla`, `color`, `costo_usd`, `porcentaje_utilidad`, `porcentaje_iva`, `precio_usd`, `stock_actual`, `stock_minimo`, `estado`)
SELECT 'PCT-RED-007', 'Router Wi-Fi 6 AX3000 Doble Banda', '4 antenas de alta ganancia, puertos Gigabit y tecnología OFDMA para baja latencia.', c.id, 'Wi-Fi 6 · AX3000 · 4x GbE', 'TP-Link', 46.00, 38.00, 16.00, 65.00, 12, 3, 'activo'
FROM `categorias` c WHERE c.nombre = 'Redes y Conectividad' LIMIT 1;

INSERT IGNORE INTO `productos`
  (`codigo`, `nombre`, `descripcion`, `categoria_id`, `talla`, `color`, `costo_usd`, `porcentaje_utilidad`, `porcentaje_iva`, `precio_usd`, `stock_actual`, `stock_minimo`, `estado`)
SELECT 'PCT-PER-008', 'Mouse Inalámbrico Ergonómico 26000 DPI', 'Sensor óptico de precisión, batería recargable USB-C y 6 botones programables.', c.id, 'Wireless 2.4GHz + BT', 'Logitech', 38.00, 42.00, 16.00, 56.00, 16, 4, 'activo'
FROM `categorias` c WHERE c.nombre = 'Periféricos y Accesorios' LIMIT 1;

-- Sincronizar existencias al depósito principal (id=1) para los productos recién insertados
INSERT IGNORE INTO `productos_depositos` (`producto_id`, `deposito_id`, `stock_actual`, `stock_minimo`)
SELECT p.id, 1, p.stock_actual, p.stock_minimo
FROM `productos` p
WHERE p.codigo LIKE 'PCT-%';

-- 4. Banners iniciales de PC TRONIC (se insertan solo si no existen banners PC TRONIC)
INSERT INTO `banners_carrusel`
  (`titulo`, `subtitulo`, `tag`, `texto_destacado`, `color_fondo_inicio`, `color_fondo_fin`, `gradiente_angulo`, `imagen_url`, `enlace_url`, `texto_boton`, `icono`, `orden`, `activo`)
SELECT
  'Tecnología de Alto Nivel',
  'Laptops, componentes, monitores y periféricos originales con stock real sincronizado en SVA.',
  'PC TRONIC TECH',
  'Para Tu Setup Hoy',
  '#0b1120',
  '#0369a1',
  135,
  NULL,
  '/catalogo',
  'Explorar Catálogo',
  'fa-solid fa-microchip',
  1,
  1
WHERE NOT EXISTS (SELECT 1 FROM `banners_carrusel` WHERE `tag` = 'PC TRONIC TECH');

INSERT INTO `banners_carrusel`
  (`titulo`, `subtitulo`, `tag`, `texto_destacado`, `color_fondo_inicio`, `color_fondo_fin`, `gradiente_angulo`, `imagen_url`, `enlace_url`, `texto_boton`, `icono`, `orden`, `activo`)
SELECT
  'Arma o Actualiza Tu PC',
  'SSD NVMe, memorias DDR5, monitores 165Hz y routers Wi-Fi 6 con despacho rápido y garantía directa.',
  'PC TRONIC GAMING',
  'Máximo Rendimiento',
  '#090d16',
  '#1d4ed8',
  135,
  NULL,
  '/catalogo?sort=bestsellers',
  'Ver Más Vendidos',
  'fa-solid fa-bolt',
  2,
  1
WHERE NOT EXISTS (SELECT 1 FROM `banners_carrusel` WHERE `tag` = 'PC TRONIC GAMING');
