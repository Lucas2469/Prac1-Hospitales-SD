import threading
import time
from core.client_manager import ClientManager
from handlers.message_handler import MessageHandler
from core.server import CommunicationServer
from config.settings import logger, ENCODING
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

class InternalNotificationHandler(BaseHTTPRequestHandler):
    def __init__(self, manager, *args, **kwargs):
        self.manager = manager
        super().__init__(*args, **kwargs)

    def log_message(self, format, *args):
        pass

    def do_POST(self):
        if self.path == '/notify':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                client_id = data.get("clientId")
                message = data.get("message")
                msg_type = data.get("type", "NOTIFICATION")
                sent_at = data.get("sentAt", "")

                success = False
                with self.manager.lock:
                    if client_id in self.manager.active_clients:
                        conn = self.manager.active_clients[client_id]
                        payload = {
                            "type": msg_type,
                            "message": message,
                            "sentAt": sent_at
                        }
                        try:
                            conn.sendall((json.dumps(payload) + "\n").encode(ENCODING))
                            logger.info(f"[+] Notificación push enviada a {client_id}")
                            success = True
                        except Exception as e:
                            logger.error(f"[!] Error enviando notificación a {client_id}: {e}")

                self.send_response(200 if success else 404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                res = {"ok": success, "message": "Enviado" if success else "Cliente no conectado en Python"}
                self.wfile.write(json.dumps(res).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()

def run_internal_http_server(manager):
    def handler_factory(*args, **kwargs):
        return InternalNotificationHandler(manager, *args, **kwargs)
    try:
        httpd = HTTPServer(('127.0.0.1', 5002), handler_factory)
        logger.info("🚀 Servidor interno HTTP (Notificaciones) escuchando en puerto 5002")
        httpd.serve_forever()
    except Exception as e:
        logger.error(f"Internal HTTP Server failed: {e}")

def main():
    # 1. Instanciar componentes
    manager = ClientManager()
    handler = MessageHandler(manager)
    server = CommunicationServer(manager, handler)

    # 2. Iniciar el monitor de caídas (Heartbeat) en un hilo fondo
    timeout_thread = threading.Thread(target=manager.check_timeouts)
    timeout_thread.daemon = True
    timeout_thread.start()

    # 3. Iniciar el servidor TCP en un hilo fondo
    server_thread = threading.Thread(target=server.start)
    server_thread.daemon = True
    server_thread.start()

    # 4. Iniciar el servidor HTTP interno en un hilo fondo
    http_thread = threading.Thread(target=run_internal_http_server, args=(manager,))
    http_thread.daemon = True
    http_thread.start()

    # 5. Bucle principal de la consola (Simula el Dashboard / Envío de comandos)
    time.sleep(1) # Pequeña pausa para que el log del servidor imprima primero
    print("\n" + "="*50)
    print("💻 CLI DE CONTROL CNS - MÓDULO DE COMUNICACIÓN")
    print("="*50)
    
    try:
        while True:
            try:
                comando = input("\nEscribe 'cmd' para enviar orden o 'exit' para salir: ").strip().lower()
                if comando == 'exit':
                    break
                elif comando == 'cmd':
                    nodo = input("ID del Nodo (ej. LaPaz-01): ")
                    accion = input("Acción (ej. SET_INTERVAL): ")
                    valor = input("Valor (ej. 15): ")
                    manager.send_command(nodo, accion, valor)
            except EOFError:
                # If running in background without TTY, input() throws EOFError. Just keep the thread alive.
                time.sleep(10)
    except KeyboardInterrupt:
        logger.info("\nApagando el sistema limpiamente...")

if __name__ == "__main__":
    main()