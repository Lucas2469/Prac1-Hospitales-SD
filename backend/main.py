import threading
import time
from core.client_manager import ClientManager
from handlers.message_handler import MessageHandler
from core.server import CommunicationServer
from config.settings import logger

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

    # 4. Bucle principal de la consola (Simula el Dashboard / Envío de comandos)
    time.sleep(1) # Pequeña pausa para que el log del servidor imprima primero
    print("\n" + "="*50)
    print("💻 CLI DE CONTROL CNS - MÓDULO DE COMUNICACIÓN")
    print("="*50)
    
    try:
        while True:
            comando = input("\nEscribe 'cmd' para enviar orden o 'exit' para salir: ").strip().lower()
            if comando == 'exit':
                break
            elif comando == 'cmd':
                nodo = input("ID del Nodo (ej. LaPaz-01): ")
                accion = input("Acción (ej. SET_INTERVAL): ")
                valor = input("Valor (ej. 15): ")
                manager.send_command(nodo, accion, valor)
    except KeyboardInterrupt:
        logger.info("\nApagando el sistema limpiamente...")

if __name__ == "__main__":
    main()