// @ts-nocheck
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';

const API = 'http://localhost:4000/api';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp debe usarse dentro de AppProvider');
  return context;
};

/**
 * Convierte un cliente de MongoDB al formato del UI.
 * El campo 'status' en Mongo es ACTIVE/NO_REPORTA → active/inactive en UI.
 */
function mapClient(c) {
  const statusMap = {
    ACTIVE: 'active',
    NO_REPORTA: 'inactive',
    WARN: 'warning',
  };
  return {
    id: c._id,
    clientId: c.clientId,
    name: c.alias || c.clientId,
    ip: c.ipAddress || '—',
    status: statusMap[c.status] ?? 'inactive',
    lastSeen: c.lastSeenAt ? timeSince(c.lastSeenAt) : '—',
    lastSeenAt: c.lastSeenAt,
    region: c.region || '',
    location: c.region || c.alias || c.clientId,
    model: 'Agente CNS',
    cpu: '—',
    ram: '—',
    // Placeholder hasta que lleguemos a /api/metrics/:id/latest
    disks: 0,
    disksHealthy: 0,
    totalSpace: '0',
    usedSpace: '0',
  };
}

/** Convierte un timestamp en "Hace X min/seg/h" */
function timeSince(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `Hace ${Math.round(diff / 1000)}s`;
  if (diff < 3_600_000) return `Hace ${Math.round(diff / 60_000)} min`;
  if (diff < 86_400_000) return `Hace ${Math.round(diff / 3_600_000)} h`;
  return `Hace ${Math.round(diff / 86_400_000)} d`;
}

export const AppProvider = ({ children }) => {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [notifications, setNotifications] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [globalStats, setGlobalStats] = useState({
    totalNodes: 0, activeNodes: 0, inactiveNodes: 0, warningNodes: 0,
  });

  const intervalRef = useRef(null);

  // ── Fetch clientes desde la API real ─────────────────────────────────────
  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch(`${API}/clients`);
      const data = await res.json();
      const mapped = Array.isArray(data) ? data.map(mapClient) : [];
      setNodes(mapped);
      updateGlobalStats(mapped);
      setLastRefresh(new Date());
      setCountdown(10);
    } catch (err) {
      console.error('[AppContext] Error al cargar clientes:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Auto-refresh cada 10 s ────────────────────────────────────────────────
  useEffect(() => {
    fetchClients();

    // Actualizar countdown cada segundo
    const countTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { fetchClients(); return 10; }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countTimer);
  }, [fetchClients]);

  const updateGlobalStats = (nodesData) => {
    setGlobalStats({
      totalNodes: nodesData.length,
      activeNodes: nodesData.filter(n => n.status === 'active').length,
      inactiveNodes: nodesData.filter(n => n.status === 'inactive').length,
      warningNodes: nodesData.filter(n => n.status === 'warning').length,
    });
  };

  // ── Notificaciones locales + envío via REST ───────────────────────────────
  const addNotification = async (notification) => {
    const newNotif = {
      id: Date.now(),
      ...notification,
      sentAt: notification.schedule === 'now' ? new Date().toISOString() : null,
      scheduledFor: notification.schedule === 'schedule' ? notification.scheduledDate : null,
      sentBy: 'Admin CNS',
      readCount: 0,
      totalRecipients: notification.regions?.length ?? 1,
      status: notification.schedule === 'now' ? 'sent' : 'scheduled',
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Si el clientId está disponible, enviar también por TCP via REST
    if (notification.clientId && notification.message) {
      try {
        await fetch(`${API}/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: notification.clientId, message: notification.message }),
        });
      } catch (e) {
        console.warn('[addNotification] No se pudo enviar TCP:', e.message);
      }
    }
  };

  const deleteNotification = (id) =>
    setNotifications(prev => prev.filter(n => n.id !== id));

  const updateNodeStatus = (nodeId, status) => {
    setNodes(prev => {
      const updated = prev.map(n => n.id === nodeId ? { ...n, status } : n);
      updateGlobalStats(updated);
      return updated;
    });
  };

  return (
    <AppContext.Provider value={{
      nodes, loading, lastRefresh, countdown,
      notifications, selectedNode, globalStats,
      setSelectedNode,
      addNotification,
      deleteNotification,
      updateNodeStatus,
      refreshNow: fetchClients,
    }}>
      {children}
    </AppContext.Provider>
  );
};