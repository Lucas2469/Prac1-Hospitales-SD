import socket
import json
import threading
import time
from typing import Dict, Any
from config.settings import logger, ENCODING, TIMEOUT_SECONDS

class ClientManager:
    def __init__(self):
        # Diccionarios tipados para guardar sockets y la última vez que reportaron
        self.active_clients: Dict[str, socket.socket] = {}
        self.last_seen: Dict[str, float] = {}
        self.lock = threading.Lock() # Para evitar race conditions en multihilo

    def add_client(self, node_id: str, conn: socket.socket):
        with self.lock:
            self.active_clients[node_id] = conn
            self.last_seen[node_id] = time.time()
            logger.info(f"[+] Nodo registrado exitosamente: {node_id}")

    def remove_client(self, node_id: str):
        with self.lock:
            if node_id in self.active_clients:
                try:
                    self.active_clients[node_id].close()
                except:
                    pass
                del self.active_clients[node_id]
                del self.last_seen[node_id]
                logger.warning(f"[-] Nodo eliminado del cluster: {node_id}")

    def update_last_seen(self, node_id: str):
        with self.lock:
            if node_id in self.last_seen:
                self.last_seen[node_id] = time.time()

    def send_command(self, node_id: str, action: str, value: Any) -> bool:
        """Envía un comando JSON al nodo (Bidireccionalidad)"""
        with self.lock:
            if node_id not in self.active_clients:
                logger.error(f"[!] No se puede enviar comando. Nodo {node_id} no está activo.")
                return False
            
            conn = self.active_clients[node_id]
            payload = {
                "type": "COMMAND",
                "action": action,
                "value": value
            }
            try:
                # Serializar a JSON y codificar a UTF-8
                data = json.dumps(payload).encode(ENCODING)
                conn.sendall(data)
                logger.info(f"[->] Comando {action} enviado a {node_id}")
                return True
            except Exception as e:
                logger.error(f"[!] Error enviando comando a {node_id}: {e}")
                self.remove_client(node_id)
                return False

    def check_timeouts(self):
        """Bucle demonio que detecta nodos que perdieron conexión o WiFi"""
        logger.info("[*] Monitor de Heartbeat iniciado.")
        while True:
            time.sleep(5) # Revisa cada 5 segundos
            current_time = time.time()
            nodos_caidos = []
            
            with self.lock:
                for node_id, last_time in self.last_seen.items():
                    if (current_time - last_time) > TIMEOUT_SECONDS:
                        nodos_caidos.append(node_id)
            
            for node_id in nodos_caidos:
                logger.error(f"[!] NODO CAÍDO (Timeout): {node_id} no reporta hace {TIMEOUT_SECONDS}s.")
                self.remove_client(node_id)