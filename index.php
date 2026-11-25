<?php
declare(strict_types=1);

/**
 * PC TRONIC · Tienda Online integrada con SVA CRM
 * Verificador rápido de servicios locales.
 */

function isPortOpen(string $host, int $port, float $timeout = 0.15): bool {
    $fp = @fsockopen($host, $port, $errno, $errstr, $timeout);
    if ($fp) {
        fclose($fp);
        return true;
    }
    return false;
}

$tiendaActive = isPortOpen('127.0.0.1', 5173);
$backendActive = isPortOpen('127.0.0.1', 3100);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PC TRONIC · Tienda Online &amp; SVA CRM</title>
    <style>
        :root {
            --bg: #0b1120;
            --card: #111827;
            --border: rgba(255, 255, 255, 0.1);
            --text: #f8fafc;
            --muted: #94a3b8;
            --blue: #2563eb;
            --cyan: #00d4ff;
            --ok: #10b981;
            --warn: #f59e0b;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 1.5rem;
        }
        .card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 2rem;
            width: 100%;
            max-width: 560px;
        }
        .head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
        .pill {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            padding: 0.35rem 0.75rem;
            border-radius: 999px;
            font-size: 0.78rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }
        .pill--ok { background: rgba(16,185,129,0.12); color: var(--ok); border: 1px solid rgba(16,185,129,0.28); }
        .pill--warn { background: rgba(245,158,11,0.12); color: var(--warn); border: 1px solid rgba(245,158,11,0.28); }
        .cmd {
            background: #070b14;
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 0.85rem 1rem;
            margin-bottom: 0.9rem;
            font-family: ui-monospace, monospace;
            font-size: 0.82rem;
            color: var(--cyan);
        }
        .cmd span { display: block; color: var(--muted); font-family: system-ui, sans-serif; font-size: 0.74rem; margin-bottom: 0.25rem; }
        .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.25rem; }
        .btn {
            display: inline-flex; align-items: center; justify-content: center;
            padding: 0.72rem 1.2rem; border-radius: 10px; font-weight: 600; font-size: 0.88rem;
            text-decoration: none; border: 1px solid var(--border); color: var(--text); background: #1e293b;
        }
        .btn--primary { background: var(--blue); border-color: var(--blue); color: #fff; }
        p { color: var(--muted); font-size: 0.92rem; line-height: 1.5; margin-bottom: 1rem; }
    </style>
</head>
<body>
<div class="card">
    <div class="head">
        <div>
            <h1 style="font-size: 1.35rem;">PC TRONIC · Tienda Online</h1>
            <small style="color: var(--muted);">RIF: J-41317926-1 · CRM: SVA Online</small>
        </div>
    </div>

    <div class="pill <?= ($tiendaActive && $backendActive) ? 'pill--ok' : 'pill--warn' ?>">
        <?= $tiendaActive ? 'Tienda :5173 activa' : 'Tienda :5173 detenida' ?> ·
        <?= $backendActive ? 'API :3100 activa' : 'API :3100 detenida' ?>
    </div>

    <p>Inicia la API puente y la tienda React desde la carpeta <code>tienda-online/</code>:</p>

    <div class="cmd"><span>1. API Backend (conectada a sva_online):</span>cd backend && npm run dev</div>
    <div class="cmd"><span>2. Tienda Online (PC TRONIC):</span>cd tienda && npm run dev</div>

    <div class="actions">
        <?php if ($tiendaActive): ?>
            <a href="http://localhost:5173/" class="btn btn--primary">Abrir Tienda PC TRONIC ↗</a>
        <?php endif; ?>
        <a href="../sva_online/" class="btn">Abrir SVA CRM / ERP</a>
    </div>
</div>
</body>
</html>
