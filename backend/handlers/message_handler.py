import socket
from typing import Dict
from core.client_manager import ClientManager
from config.settings import logger

class MessageHandler:
    def __init__(self, client_manager: ClientManager):
        self.manager = client_manager

    def process_message(self, data_json: Dict, conn: socket.socket):
        """Enruta el mensaje según su tipo"""
        msg_type = data_json.get("type")
        node_id = data_json.get("node_id", "DESCONOCIDO")

        if msg_type == "HELLO":
            self.manager.add_client(node_id, conn)
            # TODO (Modulo 3): Llamar función BD para Auto-registro de nodo en MongoDB

        elif msg_type == "DATA":
            self.manager.update_last_seen(node_id)
            logger.info(f"[DATA] Métricas recibidas de {node_id}")
            # TODO (Modulo 3): Llamar función BD para guardar historial de disco

        elif msg_type == "ACK":
            self.manager.update_last_seen(node_id)
            status = data_json.get("status", "")
            logger.info(f"✅ [ACK] El nodo {node_id} confirmó el comando. Estado: {status}")

        else:
            logger.warning(f"[?] Mensaje desconocido de {node_id}: {msg_type}")