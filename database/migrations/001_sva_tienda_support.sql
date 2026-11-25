-- =============================================================================
-- Migración 001: Tablas auxiliares para Tienda Online PC TRONIC sobre sva_online
-- Principios:
--   - 100% compatible y no destructiva sobre el esquema existente de sva_online.
--   - FK tipadas con INT(11) coincidiendo exactamente con usuarios.id y productos.id.
--   - Database as a Storage: sin triggers ni stored procedures.
-- =============================================================================

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `refresh_token_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`          INT(11)         NOT NULL,
  `token_hash`       CHAR(64)        NOT NULL,
  `user_agent`       VARCHAR(255)    NULL,
  `ip_address`       VARCHAR(45)     NULL,
  `expires_at`       DATETIME(3)     NOT NULL,
  `revoked_at`       DATETIME(3)     NULL,
  `created_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`refresh_token_id`),
  UNIQUE KEY `uq_refresh_tokens_hash` (`token_hash`),
  KEY `idx_refresh_tokens_user_expires` (`user_id`, `expires_at`),
  CONSTRAINT `fk_tienda_refresh_tokens_user`
    FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `idempotency_keys` (
  `idempotency_id`   BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `idempotency_key`  VARCHAR(100)      NOT NULL,
  `endpoint`         VARCHAR(150)      NOT NULL,
  `request_hash`     CHAR(64)          NOT NULL,
  `response_status`  SMALLINT UNSIGNED NOT NULL,
  `response_body`    LONGTEXT          NOT NULL CHECK (JSON_VALID(`response_body`)),
  `created_at`       DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expires_at`       DATETIME(3)       NOT NULL,
  PRIMARY KEY (`idempotency_id`),
  UNIQUE KEY `uq_idempotency_key_endpoint` (`idempotency_key`, `endpoint`),
  KEY `idx_idempotency_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_search_terms` (
  `term`             VARCHAR(120) NOT NULL,
  `search_count`     INT UNSIGNED NOT NULL DEFAULT 1,
  `last_searched_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`term`),
  KEY `idx_search_terms_top` (`search_count` DESC, `last_searched_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_search_counts` (
  `producto_id`      INT(11)      NOT NULL,
  `search_count`     INT UNSIGNED NOT NULL DEFAULT 0,
  `last_searched_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`producto_id`),
  KEY `idx_psc_count` (`search_count` DESC),
  CONSTRAINT `fk_psc_producto`
    FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
