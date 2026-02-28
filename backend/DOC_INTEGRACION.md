# 📘 GUÍA DE INTEGRACIÓN - MÓDULO 1 (Core de Sockets TCP)

**Proyecto:** Storage Cluster - Caja Nacional de Salud (CNS)
**Módulo:** 1 (Core de Sockets y Comunicación)
**Estado:** 🟢 Operativo y Testeado (Listo para integrar)

---

## 📌 1. Alcance de este Módulo (El "Túnel" de Comunicación)
 Mantiene las conexiones vivas con los 9 nodos (Multihilo), enruta los mensajes en formato JSON, maneja la codificación `UTF-8` para compatibilidad Windows/Linux, y detecta caídas de red mediante un sistema de "Heartbeat".
* **Qué NO hace este módulo:** **No lee discos duros, no consulta la memoria RAM, ni guarda en bases de datos.** Esas tareas corresponden a los Módulos 2 y 3. El servidor solo transporta la información.

> ⚠️ **Aviso sobre `test_client.py`:** El script `test_client.py` que se encuentra en este repositorio es **únicamente un cliente de prueba (Dummy)** con datos falsos (quemados) que utilicé para probar la concurrencia del servidor. **NO es el cliente final.**

---
---

## 🚀 5. ¿Cómo probar que el servidor está funcionando hoy mismo? (Prueba en Red)

Si quieres verificar que la comunicación bidireccional ya está operando al 100% antes de programar tu propio módulo, puedes usar el script `test_client.py` incluido en este repositorio. 

Sigue estos pasos para conectar tu computadora (Cliente) con la mía (Servidor central):

### Paso 1: Configuración en mi PC (Servidor Módulo 1)
1. Me aseguraré de estar conectado a la **misma red Wi-Fi** que tú.
2. Buscaré mi IP privada (ej. `192.168.1.45`).
3. (Solo Windows) Desactivaré temporalmente mi Firewall o abriré el puerto `5000` para permitir tu conexión.
4. Ejecutaré el servidor: `python main.py`

### Paso 2: Configuración en tu PC (Cualquier otro Módulo)
1. Descarga el archivo `test_client.py`.
2. Ábrelo en tu editor de código y busca la línea que dice:
   ```python
   cliente.connect(('127.0.0.1', 5000))

Cambia 127.0.0.1 por la IP que yo te pase. Quedará algo así:

cliente.connect(('192.168.1.45', 5000))


Paso 3:
Ejecuta el script en tu terminal: python test_client.py

Lo que verás tú: Tu consola dirá que te conectaste exitosamente y empezará a enviar reportes falsos de disco cada 10 segundos.

Lo que veré yo: Mi servidor registrará tu conexión de inmediato (Nodo registrado exitosamente).

Prueba Bidireccional (El ACK): Desde mi terminal, yo te enviaré un comando (ej. SET_INTERVAL). Verás aparecer un mensaje en tu pantalla que dice [!] ORDEN DEL JEFE, y automáticamente mi servidor recibirá tu confirmación visual (✅ [ACK]).

Con esta prueba confirmamos que el túnel de red está listo y que la plataforma es 100% compatible entre Windows y Linux.