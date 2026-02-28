// @ts-nocheck
import React, { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [nodes, setNodes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [globalStats, setGlobalStats] = useState({
    totalCapacity: '256 TB',
    usedSpace: '142 TB',
    freeSpace: '114 TB',
    usedPercentage: 55,
    freePercentage: 45,
    totalNodes: 0,
    activeNodes: 0,
    inactiveNodes: 0,
    warningNodes: 0,
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = () => {
    // Datos de ejemplo de nodos
    const mockNodes = [
      { 
        id: 1, 
        name: 'Regional Norte', 
        ip: '192.168.1.10', 
        status: 'active', 
        lastSeen: 'Hace 2 min', 
        uptime: '99.9%', 
        disks: 4,
        disksHealthy: 4,
        location: 'Barranquilla',
        cpu: '45%',
        ram: '62%',
        model: 'Dell PowerEdge R740',
        totalSpace: '8TB',
        usedSpace: '4.2TB'
      },
      { 
        id: 2, 
        name: 'Regional Sur', 
        ip: '192.168.1.11', 
        status: 'active', 
        lastSeen: 'Hace 1 min', 
        uptime: '99.5%', 
        disks: 3,
        disksHealthy: 3,
        location: 'Cali',
        cpu: '32%',
        ram: '48%',
        model: 'HPE ProLiant DL380',
        totalSpace: '6TB',
        usedSpace: '3.8TB'
      },
      { 
        id: 3, 
        name: 'Regional Oriente', 
        ip: '192.168.1.12', 
        status: 'inactive', 
        lastSeen: 'Hace 2 horas', 
        uptime: '95.2%', 
        disks: 2,
        disksHealthy: 1,
        location: 'Bucaramanga',
        cpu: '0%',
        ram: '0%',
        model: 'Dell PowerEdge R740',
        totalSpace: '4TB',
        usedSpace: '3.2TB'
      },
      { 
        id: 4, 
        name: 'Regional Occidente', 
        ip: '192.168.1.13', 
        status: 'active', 
        lastSeen: 'Hace 5 min', 
        uptime: '98.7%', 
        disks: 5,
        disksHealthy: 5,
        location: 'Medellín',
        cpu: '28%',
        ram: '44%',
        model: 'Cisco UCS C240',
        totalSpace: '10TB',
        usedSpace: '6.5TB'
      },
      { 
        id: 5, 
        name: 'Regional Centro', 
        ip: '192.168.1.14', 
        status: 'warning', 
        lastSeen: 'Hace 10 min', 
        uptime: '97.1%', 
        disks: 3,
        disksHealthy: 2,
        location: 'Bogotá',
        cpu: '78%',
        ram: '82%',
        model: 'HPE ProLiant DL380',
        totalSpace: '6TB',
        usedSpace: '5.1TB'
      },
      { 
        id: 6, 
        name: 'Regional Insular', 
        ip: '192.168.1.15', 
        status: 'inactive', 
        lastSeen: 'Hace 1 día', 
        uptime: '88.3%', 
        disks: 2,
        disksHealthy: 0,
        location: 'San Andrés',
        cpu: '0%',
        ram: '0%',
        model: 'Dell PowerEdge R640',
        totalSpace: '4TB',
        usedSpace: '3.9TB'
      },
    ];

    // Datos de ejemplo de notificaciones
    const mockNotifications = [
      {
        id: 1,
        title: 'Mantenimiento programado',
        message: 'Actualización de firmware en nodos regionales para el próximo sábado',
        type: 'warning',
        priority: 'high',
        regions: ['Norte', 'Sur', 'Occidente'],
        status: 'sent',
        sentAt: '2024-01-15T10:30:00',
        sentBy: 'Admin CNS',
        readCount: 45,
        totalRecipients: 48
      },
      {
        id: 2,
        title: 'Nueva política de almacenamiento',
        message: 'Se actualizan las cuotas de almacenamiento por región. Revisar documentación.',
        type: 'info',
        priority: 'medium',
        regions: ['Todas las regiones'],
        status: 'sent',
        sentAt: '2024-01-14T15:20:00',
        sentBy: 'Admin CNS',
        readCount: 120,
        totalRecipients: 156
      },
      {
        id: 3,
        title: 'ALERTA: Nodo Oriental sin conexión',
        message: 'El nodo de la regional oriental no reporta desde hace 30 minutos. Personal técnico asignado.',
        type: 'critical',
        priority: 'urgent',
        regions: ['Oriente'],
        status: 'sent',
        sentAt: '2024-01-14T08:15:00',
        sentBy: 'Sistema Automático',
        readCount: 12,
        totalRecipients: 12
      },
    ];

    setNodes(mockNodes);
    setNotifications(mockNotifications);
    updateGlobalStats(mockNodes);
  };

  const updateGlobalStats = (nodesData) => {
    const totalNodes = nodesData.length;
    const activeNodes = nodesData.filter(n => n.status === 'active').length;
    const inactiveNodes = nodesData.filter(n => n.status === 'inactive').length;
    const warningNodes = nodesData.filter(n => n.status === 'warning').length;

    setGlobalStats(prev => ({
      ...prev,
      totalNodes,
      activeNodes,
      inactiveNodes,
      warningNodes,
    }));
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: notifications.length + 1,
      ...notification,
      sentAt: notification.schedule === 'now' ? new Date().toISOString() : null,
      scheduledFor: notification.schedule === 'schedule' ? notification.scheduledDate : null,
      sentBy: 'Admin CNS',
      readCount: 0,
      totalRecipients: notification.regions.length * 4,
      status: notification.schedule === 'now' ? 'sent' : 'scheduled'
    };
    
    setNotifications([newNotification, ...notifications]);
    
    // Si es una notificación crítica, actualizar estado de nodos
    if (notification.type === 'critical' && notification.regions[0] !== 'Todas las regiones') {
      const updatedNodes = nodes.map(node => {
        if (notification.regions.includes(node.location.split(' ')[1])) {
          return { ...node, status: 'warning' };
        }
        return node;
      });
      setNodes(updatedNodes);
      updateGlobalStats(updatedNodes);
    }
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const updateNodeStatus = (nodeId, status) => {
    const updatedNodes = nodes.map(node => 
      node.id === nodeId ? { ...node, status } : node
    );
    setNodes(updatedNodes);
    updateGlobalStats(updatedNodes);
  };

  return (
    <AppContext.Provider value={{
      nodes,
      notifications,
      selectedNode,
      globalStats,
      setSelectedNode,
      addNotification,
      deleteNotification,
      updateNodeStatus,
    }}>
      {children}
    </AppContext.Provider>
  );
};