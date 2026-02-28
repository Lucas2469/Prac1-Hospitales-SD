import socket
import threading
import json
from config.settings import HOST, PORT, BUFFER_SIZE, ENCODING, logger
from core.client_manager import ClientManager
from handlers.message_handler import MessageHandler

class CommunicationServer:
    def __init__(self, client_manager: ClientManager, msg_handler: MessageHandler):
        self.manager = client_manager
        self.handler = msg_handler
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        # SO_REUSEADDR evita el error de puerto ocupado si reiniciamos rápido
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    def handle_client(self, conn: socket.socket, addr: tuple):
        logger.info(f"[+] Nueva conexión entrante desde {addr}")
        while True:
            try:
                # Recibir y decodificar estrictamente en UTF-8 (Multiplataforma)
                data_bytes = conn.recv(BUFFER_SIZE)
                if not data_bytes:
                    break # Cliente cerró conexión limpiamente
                
                data_str = data_bytes.decode(ENCODING)
                data_json = json.loads(data_str)
                
                # Delegar al handler
                self.handler.process_message(data_json, conn)
                
            except ConnectionResetError:
                # Muy común en Windows si se cierra el cliente de golpe
                logger.error(f"[!] Conexión reseteada bruscamente por {addr}")
                break
            except json.JSONDecodeError:
                logger.error(f"[!] Error decodificando JSON de {addr}")
                break
            except Exception as e:
                logger.error(f"[!] Error inesperado con {addr}: {e}")
                break
                
        conn.close()

    def start(self):
        self.server_socket.bind((HOST, PORT))
        self.server_socket.listen(10) # Soporta hasta 9 nodos CNS + 1 de margen
        logger.info(f"🚀 Servidor CNS iniciado. Escuchando en {HOST}:{PORT}")
        
        try:
            while True:
                conn, addr = self.server_socket.accept()
                # Un hilo por cliente para no bloquear el sistema
                client_thread = threading.Thread(target=self.handle_client, args=(conn, addr))
                client_thread.daemon = True
                client_thread.start()
        except Exception as e:
            logger.error(f"Error crítico en servidor: {e}")
        finally:
            self.server_socket.close()