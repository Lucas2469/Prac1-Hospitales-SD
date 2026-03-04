"""
client_manager.py – Tarea 3.4: Heartbeat con persistencia en MongoDB

Gestiona los clientes TCP activos en memoria con un diccionario thread-safe.
El monitor de Heartbeat ahora también marca nodos como NO_REPORTA en MongoDB
via db_bridge cuando superan el umbral de tiempo sin reportar.

Soporta nodos ilimitados: la arquitectura es completamente dinámica,
cada nuevo HELLO agrega una entrada al diccionario.

Concurrencia:
  - Un threading.Lock protege active_clients y last_seen de race conditions
    cuando múltiples hilos (uno por nodo) modifican el diccionario.
  - check_timeouts() corre en su propio hilo daemon y solo accede
    a los dicts dentro del Lock.
"""

import socket
import json
import threading
import time
from typing import Dict, Any
from config.settings import logger, ENCODING, TIMEOUT_SECONDS
from core import db_bridge


class ClientManager:
    def __init__(self):
        # Dict clientId → socket: registro en memoria de nodos conectados.
        # Soporta nodos ilimitados (no existe límite hardcodeado).
        self.active_clients: Dict[str, socket.socket] = {}
        self.last_seen: Dict[str, float] = {}
        # Lock único para ambos dicts → evita deadlocks
        self.lock = threading.Lock()

    # ──────────────────────────────────────────
    # Gestión básica de clientes
    # ──────────────────────────────────────────

    def add_client(self, node_id: str, conn: socket.socket):
        """Registra un nuevo nodo en memoria al conectarse (HELLO)."""
        with self.lock:
            self.active_clients[node_id] = conn
            self.last_seen[node_id] = time.time()
            logger.info(f"[+] Nodo registrado exitosamente: {node_id} | "
                        f"Total nodos activos: {len(self.active_clients)}")

    def remove_client(self, node_id: str):
        """Elimina un nodo del registro en memoria al desconectarse."""
        with self.lock:
            if node_id in self.active_clients:
                try:
                    self.active_clients[node_id].close()
                except Exception:
                    pass
                del self.active_clients[node_id]
                del self.last_seen[node_id]
                logger.warning(f"[-] Nodo eliminado del cluster: {node_id} | "
                               f"Total nodos activos: {len(self.active_clients)}")

    def update_last_seen(self, node_id: str):
        """Renueva el timestamp del último reporte de un nodo (DATA/ACK)."""
        with self.lock:
            if node_id in self.last_seen:
                self.last_seen[node_id] = time.time()

    # ──────────────────────────────────────────
    # Bidireccionalidad: envío de comandos
    # ──────────────────────────────────────────

    def send_command(self, node_id: str, action: str, value: Any) -> bool:
        """
        Envía un comando JSON al nodo via su socket TCP activo.
        Retorna True si se envió correctamente, False si el nodo no está activo.
        """
        with self.lock:
            if node_id not in self.active_clients:
                logger.error(f"[!] No se puede enviar comando. Nodo '{node_id}' no está activo.")
                logger.info(f"    Nodos activos actualmente: {list(self.active_clients.keys())}")
                return False

            conn = self.active_clients[node_id]
            payload = {
                "type": "COMMAND",
                "action": action,
                "value": value,
            }
            try:
                data = json.dumps(payload).encode(ENCODING)
                conn.sendall(data)
                logger.info(f"[→] Comando '{action}' enviado a {node_id}")
                return True
            except Exception as e:
                logger.error(f"[!] Error enviando comando a {node_id}: {e}")
                # Limpiar sin llamar a remove_client (ya tenemos el lock)
                try:
                    self.active_clients[node_id].close()
                except Exception:
                    pass
                del self.active_clients[node_id]
                del self.last_seen[node_id]
                return False

    # ──────────────────────────────────────────
    # Tarea 3.4 – Heartbeat / Monitor de caídas
    # ──────────────────────────────────────────

    def check_timeouts(self):
        """
        Bucle daemon que detecta nodos sin actividad reciente.
        Se ejecuta cada 15 segundos y evalúa todos los nodos registrados.

        Si un nodo supera TIMEOUT_SECONDS sin enviar DATA/ACK:
          1. Se marca como NO_REPORTA en MongoDB (db_bridge, asíncrono).
          2. Se elimina del registro en memoria.

        El umbral TIMEOUT_SECONDS es parametrizable via config/settings.py
        o la variable de entorno CNS_TIMEOUT (por defecto: 30 s).

        Soporta nodos ilimitados: itera sobre todos los entries del dict.
        """
        logger.info(f"[*] Monitor de Heartbeat iniciado | "
                    f"Umbral: {TIMEOUT_SECONDS}s | Revisión cada 15s")
        while True:
            time.sleep(15)  # Revisar cada 15 segundos
            current_time = time.time()
            nodos_caidos = []

            # Recolectar nodos caídos dentro del lock (solo lectura rápida)
            with self.lock:
                for node_id, last_time in self.last_seen.items():
                    elapsed = current_time - last_time
                    if elapsed > TIMEOUT_SECONDS:
                        nodos_caidos.append((node_id, elapsed))

            # Procesar caídos fuera del lock para no bloquear otros hilos
            for node_id, elapsed in nodos_caidos:
                logger.error(
                    f"[!] NODO CAÍDO: {node_id} | "
                    f"Sin reporte hace {elapsed:.0f}s (umbral: {TIMEOUT_SECONDS}s)"
                )
                # Actualizar MongoDB (async, no bloquea el bucle)
                threading.Thread(
                    target=db_bridge.mark_no_reporta,
                    args=(node_id,),
                    daemon=True,
                ).start()
                # Eliminar de memoria
                self.remove_client(node_id)