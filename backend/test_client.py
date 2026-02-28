import socket
import json
import threading
import time

def escuchar_servidor(sock, node_id):
    """Hilo que escucha las órdenes del servidor"""
    while True:
        try:
            data = sock.recv(4096).decode('utf-8')
            if not data: break
            
            mensaje = json.loads(data)
            if mensaje.get("type") == "COMMAND":
                print(f"\n[!] ORDEN DEL JEFE: {mensaje['action']} -> {mensaje['value']}")
                
                # Responder con el ACK (Tarea 1.4 de la rúbrica)
                ack = {
                    "type": "ACK",
                    "node_id": node_id,
                    "status": "Comando ejecutado con éxito"
                }
                sock.send(json.dumps(ack).encode('utf-8'))
                print("[+] ACK enviado de vuelta al servidor.")
        except:
            print("\n[-] Conexión con el servidor perdida.")
            break

def iniciar_cliente():
    mi_nodo = "LaPaz-01"
    cliente = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    try:
        # Conectarse al servidor local
        cliente.connect(('127.0.0.1', 5000))
        print(f"[*] Conectado al servidor central como {mi_nodo}")

        # 1. Enviar saludo inicial (HELLO) para registrarse
        hello_msg = {"type": "HELLO", "node_id": mi_nodo}
        cliente.send(json.dumps(hello_msg).encode('utf-8'))

        # 2. Iniciar el hilo para escuchar comandos (Bidireccionalidad)
        hilo_escucha = threading.Thread(target=escuchar_servidor, args=(cliente, mi_nodo))
        hilo_escucha.daemon = True
        hilo_escucha.start()

        # 3. Bucle infinito enviando datos para que el Heartbeat no nos elimine
        while True:
            datos = {
                "type": "DATA",
                "node_id": mi_nodo,
                "disk_data": {"libre": 500}
            }
            cliente.send(json.dumps(datos).encode('utf-8'))
            print("[>] Reporte de disco enviado...")
            time.sleep(10) # Enviar cada 10 segundos

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    iniciar_cliente()