"""
db_bridge.py – Módulo puente Python ↔ Node.js REST API

Permite que el servidor TCP en Python persista datos en MongoDB
llamando a la REST API de Node.js (puerto 4000) sin instalar
drivers de MongoDB directamente en Python.

Concurrencia: todas las funciones son thread-safe porque usan
urllib que libera el GIL durante I/O, y cada hilo-cliente
genera su propia request independiente.
"""

import json
import logging
import urllib.request
import urllib.error
import os

logger = logging.getLogger("CoreServer")

# Base URL de la REST API Node.js
REST_BASE = os.getenv("REST_API_BASE", "http://localhost:4000")


def _post(path: str, payload: dict) -> dict | None:
    """Realiza una petición POST JSON a la REST API. Thread-safe."""
    url = f"{REST_BASE}{path}"
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        logger.error(f"[db_bridge] HTTP {e.code} en POST {path}: {e.read().decode()}")
    except urllib.error.URLError as e:
        logger.error(f"[db_bridge] No se pudo conectar a REST API: {e.reason}")
    except Exception as e:
        logger.error(f"[db_bridge] Error inesperado en POST {path}: {e}")
    return None


def _patch(path: str, payload: dict) -> dict | None:
    """Realiza una petición PATCH JSON a la REST API. Thread-safe."""
    url = f"{REST_BASE}{path}"
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="PATCH",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        logger.error(f"[db_bridge] HTTP {e.code} en PATCH {path}: {e.read().decode()}")
    except urllib.error.URLError as e:
        logger.error(f"[db_bridge] No se pudo conectar a REST API: {e.reason}")
    except Exception as e:
        logger.error(f"[db_bridge] Error inesperado en PATCH {path}: {e}")
    return None


# ─────────────────────────────────────────────
# Tarea 3.1 – Auto-registro de cliente en MongoDB
# ─────────────────────────────────────────────
def auto_register_client(node_id: str, ip_address: str, region: str = "") -> dict | None:
    """
    Registra o actualiza un cliente en MongoDB cuando se conecta por TCP (HELLO).
    Usa upsert en el backend: si el cliente ya existe lo actualiza a ACTIVE,
    si no existe lo crea. Soporta nodos ilimitados.
    """
    logger.info(f"[db_bridge] Auto-registrando cliente: {node_id} ({ip_address})")
    result = _post("/api/clients/register", {
        "clientId": node_id,
        "ipAddress": ip_address,
        "region": region,
    })
    if result:
        logger.info(f"[db_bridge] ✅ Cliente {node_id} registrado/actualizado en MongoDB")
    return result


# ─────────────────────────────────────────────
# Tarea 3.1 – Persistir métricas de disco en historial
# ─────────────────────────────────────────────
def save_metrics(node_id: str, disks) -> dict | None:
    """
    Guarda el historial de métricas de disco cuando el cliente envía tipo DATA.
    Acepta tanto campos del schema Metric (total/used/free/percent) como los
    del diskCollector.js del agente (totalGB/usedGB/freeGB/usedPercent).
    Si recibe un dict con 'disksFull' (array de discos), lo expande.
    """
    # Si es un dict con campo 'disksFull', extraer la lista completa
    if isinstance(disks, dict):
        if "disksFull" in disks:
            disks = disks["disksFull"]
        else:
            disks = [disks]  # normalizar a lista de 1 disco

    if not isinstance(disks, list):
        disks = []

    # Validar/completar campos mínimos por disco
    normalized = []
    for d in disks:
        if not isinstance(d, dict):
            continue

        # Soporte para campos del agente Node.js (totalGB) Y del schema Mongo (total)
        total   = float(d.get("total",   d.get("totalGB",   0)))
        used    = float(d.get("used",    d.get("usedGB",    0)))
        free    = float(d.get("free",    d.get("freeGB",    0)))
        percent = float(d.get("percent", d.get("usedPercent", 0)))

        # Si total no vino, calcularlo
        if total == 0 and (used + free) > 0:
            total = used + free

        # Nombre/punto de montaje
        name = d.get("name", d.get("mountPoint", "disco0"))

        normalized.append({
            "name":    name,
            "type":    d.get("type", d.get("filesystem", "")),
            "total":   total,
            "used":    used,
            "free":    free,
            "percent": percent,
        })

    if not normalized:
        logger.warning(f"[db_bridge] {node_id} no tiene discos válidos para guardar")
        return None

    logger.info(f"[db_bridge] Guardando métricas de {node_id}: {len(normalized)} disco(s)")
    return _post("/api/metrics/report", {
        "clientId": node_id,
        "disks": normalized,
    })


# ─────────────────────────────────────────────
# Tarea 3.4 – Marcar nodo como NO_REPORTA en MongoDB
# ─────────────────────────────────────────────
def mark_no_reporta(node_id: str) -> dict | None:
    """
    Invocado por check_timeouts() cuando un nodo supera el umbral sin reportar.
    Actualiza el campo 'status' a NO_REPORTA en MongoDB.
    """
    logger.warning(f"[db_bridge] Marcando {node_id} como NO_REPORTA en MongoDB")
    return _patch(f"/api/clients/{node_id}/status", {"status": "NO_REPORTA"})
