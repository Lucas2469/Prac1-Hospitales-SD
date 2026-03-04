/**
 * socket.registry.js – Registro en memoria de sockets TCP activos
 *
 * Singleton que mapea clientId → socket TCP activo.
 * Importado tanto por el servidor TCP (Tarea 3.3) como por el
 * controlador de notificaciones para poder enviar mensajes
 * a cualquier nodo conectado en tiempo real.
 *
 * Concurrencia: Node.js es single-threaded, no hay race conditions.
 * El Map es seguro para operaciones síncronas.
 */

/** @type {Map<string, import('net').Socket>} */
const socketRegistry = new Map();

/**
 * Registra un socket activo asociado a un clientId.
 * Si ya existía uno anterior, lo destruye primero (reconexión).
 * @param {string} clientId
 * @param {import('net').Socket} socket
 */
export function registerSocket(clientId, socket) {
    if (socketRegistry.has(clientId)) {
        const old = socketRegistry.get(clientId);
        if (!old.destroyed) old.destroy();
    }
    socketRegistry.set(clientId, socket);
    console.log(`[SocketRegistry] Nodo registrado: ${clientId}`);
}

/**
 * Elimina el socket de un cliente desconectado.
 * @param {string} clientId
 */
export function unregisterSocket(clientId) {
    socketRegistry.delete(clientId);
    console.log(`[SocketRegistry] Nodo desconectado: ${clientId}`);
}

/**
 * Envía un mensaje JSON a un cliente via su socket TCP activo.
 * @param {string} clientId
 * @param {object} payload - Objeto que se serializa a JSON
 * @returns {{ sent: boolean, reason?: string }}
 */
export function sendToClient(clientId, payload) {
    const socket = socketRegistry.get(clientId);

    if (!socket) {
        return { sent: false, reason: "Cliente no encontrado en registro de sockets activos" };
    }
    if (socket.destroyed || socket.readyState !== "open") {
        socketRegistry.delete(clientId);
        return { sent: false, reason: "Socket del cliente está cerrado o destruido" };
    }

    try {
        const data = JSON.stringify(payload);
        socket.write(data + "\n"); // \n como delimitador de mensaje
        console.log(`[SocketRegistry] Mensaje enviado a ${clientId}: ${data}`);
        return { sent: true };
    } catch (err) {
        console.error(`[SocketRegistry] Error enviando a ${clientId}:`, err.message);
        return { sent: false, reason: err.message };
    }
}

/**
 * Devuelve lista de clientIds actualmente conectados.
 * @returns {string[]}
 */
export function getActiveClients() {
    return [...socketRegistry.keys()];
}
