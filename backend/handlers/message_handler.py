"""
message_handler.py – Tarea 3.1: Integración TCP → MongoDB

Procesa los mensajes JSON recibidos por el servidor TCP y los persiste
en MongoDB via db_bridge (HTTP a la REST API de Node.js).

Tipos de mensaje soportados:
  HELLO – Auto-registro del nodo en MongoDB (Tarea 3.1)
  DATA  – Guardar historial de métricas de disco (Tarea 3.1)
  ACK   – Confirmación de comando recibido (bidireccionalidad)

Concurrencia: cada conexión TCP tiene su propio hilo, pero db_bridge
usa urllib que es thread-safe. Las llamadas HTTP se hacen en background
para no bloquear el recv() del hilo del socket.
"""

import socket
import threading
from typing import Dict
from core.client_manager import ClientManager
from core import db_bridge
from config.settings import logger


class MessageHandler:
    def __init__(self, client_manager: ClientManager):
        self.manager = client_manager

    def process_message(self, data_json: Dict, conn: socket.socket):
        """Enruta el mensaje según su tipo y persiste en MongoDB de forma asíncrona."""
        msg_type = data_json.get("type")
        node_id  = data_json.get("node_id", "DESCONOCIDO")

        # ─────────────────────────────────────────
        # HELLO – Tarea 3.1: Auto-adición en MongoDB
        # ─────────────────────────────────────────
        if msg_type == "HELLO":
            # Extraer IP de red del payload (enviado por el agente)
            client_info = data_json.get("clientInfo", {})
            ip_address = client_info.get("ip", conn.getpeername()[0] if conn else "0.0.0.0")
            region     = data_json.get("region", "")

            # Registrar en memoria (inmediato, para el heartbeat en-proceso)
            self.manager.add_client(node_id, conn)

            # Persistir en MongoDB de forma no bloqueante:
            # Un hilo daemon para no detener el recv() principal del socket
            threading.Thread(
                target=db_bridge.auto_register_client,
                args=(node_id, ip_address, region),
                daemon=True,
            ).start()

        # ─────────────────────────────────────────
        # DATA – Tarea 3.1: Guardar historial de disco
        # ─────────────────────────────────────────
        elif msg_type == "DATA":
            self.manager.update_last_seen(node_id)
            logger.info(f"[DATA] Métricas recibidas de {node_id}")

            # Extraer datos de disco (soporta campo 'disk_data' o 'disks')
            disk_data = data_json.get("disks", data_json.get("disk_data"))
            if disk_data:
                threading.Thread(
                    target=db_bridge.save_metrics,
                    args=(node_id, disk_data),
                    daemon=True,
                ).start()
            else:
                logger.warning(f"[DATA] {node_id} no envió datos de disco válidos")

        # ─────────────────────────────────────────
        # ACK – Confirmación de comando (bidireccional)
        # ─────────────────────────────────────────
        elif msg_type == "ACK":
            self.manager.update_last_seen(node_id)
            status = data_json.get("status", "")
            logger.info(f"✅ [ACK] El nodo {node_id} confirmó el comando. Estado: {status}")

        else:
            logger.warning(f"[?] Mensaje desconocido de {node_id}: {msg_type}")