import logging
import os

# Constantes de red
HOST = os.getenv('CNS_HOST', '0.0.0.0') # Escucha en todas las interfaces (LAN/WiFi)
PORT = int(os.getenv('CNS_PORT', 5000))
BUFFER_SIZE = 4096
ENCODING = 'utf-8'
TIMEOUT_SECONDS = 60 # Tiempo antes de marcar un nodo como caído

# Configuración profesional de Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("CoreServer")