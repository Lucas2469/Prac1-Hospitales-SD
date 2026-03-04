// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  HardDrive, AlertCircle, CheckCircle, XCircle,
  Activity, Clock, RefreshCw, Wifi, WifiOff, Cpu,
  ChevronDown, ChevronUp, Send, X, Bell, Inbox
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';

const API = 'http://localhost:4000/api';

// ──────────────────────────────────────
// Modal de Notificación
// ──────────────────────────────────────
const NotifModal = ({ node, onClose }) => {
  const { addNotification } = useApp();
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    await addNotification({
      clientId: node.clientId,
      title: `Notificación a ${node.name}`,
      message: message.trim(),
      type: 'info',
      priority,
      regions: [node.region || node.clientId],
      schedule: 'now',
    });
    setSending(false);
    setSent(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-green-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Bell className="w-6 h-6" />
            <div>
              <h3 className="font-bold text-lg">Enviar Notificación</h3>
              <p className="text-green-100 text-sm truncate max-w-[220px]">→ {node.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">¡Notificación enviada!</p>
            <p className="text-gray-500 text-sm mt-1">El cliente recibirá el mensaje vía TCP</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <div className="flex gap-2">
                {['low', 'medium', 'high', 'urgent'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition-all ${priority === p
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                      }`}
                  >
                    {{ low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente' }[p]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                placeholder="Escribe el mensaje que recibirá el cliente..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none bg-gray-50"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="flex-1 py-2.5 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────
// Componente principal DiskDetail
// ──────────────────────────────────────
const DiskDetail = ({ setActiveTab }) => {
  const { selectedNode, setSelectedNode } = useApp();
  const [disks, setDisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [expandedDisk, setExpandedDisk] = useState(null);
  const [showNotif, setShowNotif] = useState(false);

  const fetchDisks = useCallback(async () => {
    if (!selectedNode?.clientId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/metrics/${encodeURIComponent(selectedNode.clientId)}/latest`);
      if (!res.ok) throw new Error('Sin datos');
      const data = await res.json();
      // Mapear los discos del MetricModel al formato del UI
      const mapped = (data.disks || []).map((d, i) => ({
        id: i + 1,
        name: d.name || d.mountPoint || `Disco ${i + 1}`,
        mountPoint: d.name || d.mountPoint || '—',
        filesystem: d.type || d.filesystem || 'NTFS',
        // Schema Metric: name, total, used, free, percent (en GB, 0-100)
        capacity: d.total != null ? `${Number(d.total).toFixed(2)} GB` : '? GB',
        used: d.used != null ? `${Number(d.used).toFixed(2)} GB` : '? GB',
        available: d.free != null ? `${Number(d.free).toFixed(2)} GB` : '? GB',
        usedPercent: Number(d.percent ?? 0),
        totalBytes: d.total ? Number(d.total) * 1024 ** 3 : 0,
        usedBytes: d.used ? Number(d.used) * 1024 ** 3 : 0,
        status: Number(d.percent ?? 0) > 85 ? 'critical' :
          Number(d.percent ?? 0) > 70 ? 'warning' : 'healthy',
        iops: d.iopsSimulated ?? '—',
        temperature: null,
        smartStatus: 'N/A',
        readSpeed: '—',
        writeSpeed: '—',
      }));
      setDisks(mapped);
      setLastUpdate(new Date());
      setCountdown(10);

    } catch (err) {
      console.warn('[DiskDetail] Sin métricas:', err.message);
      setDisks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedNode?.clientId]);

  // Auto-refresh cada 10 segundos
  useEffect(() => {
    fetchDisks();
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { fetchDisks(); return 10; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchDisks]);

  if (!selectedNode) return null;

  const getStatusColor = (s) => ({
    healthy: 'text-green-600 bg-green-100 border-green-200',
    warning: 'text-yellow-600 bg-yellow-100 border-yellow-200',
    critical: 'text-red-600 bg-red-100 border-red-200',
  }[s] || 'text-gray-600 bg-gray-100 border-gray-200');

  const getBarColor = (s) => ({
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500',
  }[s] || 'bg-gray-400');

  const stats = {
    total: disks.length,
    healthy: disks.filter(d => d.status === 'healthy').length,
    warning: disks.filter(d => d.status === 'warning').length,
    critical: disks.filter(d => d.status === 'critical').length,
  };

  return (
    <>
      {showNotif && <NotifModal node={selectedNode} onClose={() => setShowNotif(false)} />}

      <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-emerald-50">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <HardDrive className="w-7 h-7 flex-shrink-0" />
                <span className="truncate">
                  {selectedNode.status === 'active'
                    ? <Wifi className="inline w-5 h-5 mr-1 text-green-200" />
                    : <WifiOff className="inline w-5 h-5 mr-1 text-red-300" />
                  }
                  {selectedNode.name}
                </span>
              </h2>
              <p className="text-green-100 text-sm mt-1 truncate">
                {selectedNode.ip}
                {selectedNode.location && ` • ${selectedNode.location}`}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Auto-refresh indicator */}
              <div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5 text-sm font-medium">
                <Clock className="w-4 h-4" />
                {countdown}s
              </div>

              {/* Botón Refresh manual */}
              <button
                onClick={fetchDisks}
                className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                title="Actualizar ahora"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* 🔔 Botón ENVIAR NOTIFICACIÓN */}
              <button
                onClick={() => setShowNotif(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-green-700 hover:bg-green-50 rounded-xl transition-colors font-medium text-sm shadow-lg"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notificar</span>
              </button>

              {/* Cerrar */}
              <button
                onClick={() => setActiveTab('nodes')}
                className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats de discos */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white/60">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total discos', value: stats.total, color: 'from-green-600 to-emerald-600' },
              { label: 'Saludables', value: stats.healthy, color: 'from-emerald-500 to-teal-500' },
              { label: 'Advertencia', value: stats.warning, color: 'from-yellow-500 to-amber-500' },
              { label: 'Críticos', value: stats.critical, color: 'from-red-500 to-rose-500' },
            ].map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white shadow-md`}>
                <div className="text-3xl font-bold">{s.value}</div>
                <div className="text-xs opacity-80 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de discos */}
        <div className="flex-1 px-6 py-5">
          {loading ? (
            <div className="text-center py-16">
              <RefreshCw className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Cargando datos de discos...</p>
            </div>
          ) : disks.length === 0 ? (
            <div className="text-center py-16 bg-white/80 rounded-xl border border-green-100">
              <Inbox className="w-14 h-14 text-green-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800">Sin datos de discos aún</h3>
              <p className="text-gray-500 mt-1 text-sm">
                El agente enviará métricas al conectarse al servidor TCP.<br />
                Los datos aparecerán automáticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {disks.map(disk => (
                <div
                  key={disk.id}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-green-100 overflow-hidden hover:shadow-lg transition-all"
                >
                  {/* Cabecera del disco */}
                  <div
                    className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => setExpandedDisk(expandedDisk === disk.id ? null : disk.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl border ${getStatusColor(disk.status)} flex-shrink-0`}>
                        {disk.status === 'healthy' ? <CheckCircle className="w-6 h-6" /> :
                          disk.status === 'warning' ? <AlertCircle className="w-6 h-6" /> :
                            <XCircle className="w-6 h-6" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-800 text-base truncate">{disk.name}</h3>
                            <p className="text-sm text-gray-500 font-mono">{disk.filesystem}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(disk.status)}`}>
                              {disk.status === 'healthy' ? 'Saludable' :
                                disk.status === 'warning' ? 'Advertencia' : 'Crítico'}
                            </span>
                            {expandedDisk === disk.id
                              ? <ChevronUp className="w-5 h-5 text-gray-400" />
                              : <ChevronDown className="w-5 h-5 text-gray-400" />
                            }
                          </div>
                        </div>

                        {/* Métricas rápidas */}
                        <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                          <div>
                            <div className="font-semibold text-gray-800">{disk.capacity}</div>
                            <div className="text-xs text-gray-500">Total</div>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{disk.used}</div>
                            <div className="text-xs text-gray-500">Usado</div>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{disk.available}</div>
                            <div className="text-xs text-gray-500">Libre</div>
                          </div>
                        </div>

                        {/* Barra de uso */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Uso del disco</span>
                            <span className="font-semibold">{disk.usedPercent.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getBarColor(disk.status)}`}
                              style={{ width: `${Math.min(disk.usedPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalles expandidos */}
                  {expandedDisk === disk.id && (
                    <div className="px-5 pb-5 pt-3 border-t border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="bg-white rounded-xl p-3 border border-green-100">
                          <div className="text-xs text-gray-500 mb-1">Punto de montaje</div>
                          <div className="font-mono text-sm font-medium truncate">{disk.mountPoint}</div>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-green-100">
                          <div className="text-xs text-gray-500 mb-1">Sistema de archivos</div>
                          <div className="text-sm font-medium">{disk.filesystem}</div>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-green-100">
                          <div className="text-xs text-gray-500 mb-1">IOPS (simulado)</div>
                          <div className="text-sm font-medium">{disk.iops}</div>
                        </div>
                      </div>

                      {disk.status !== 'healthy' && (
                        <div className={`mt-3 p-3 rounded-xl flex items-start gap-3 ${disk.status === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                          }`}>
                          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${disk.status === 'critical' ? 'text-red-600' : 'text-yellow-600'}`} />
                          <div>
                            <h4 className={`font-medium text-sm ${disk.status === 'critical' ? 'text-red-800' : 'text-yellow-800'}`}>
                              {disk.status === 'critical' ? 'Uso crítico de disco' : 'Uso elevado de disco'}
                            </h4>
                            <p className={`text-xs mt-0.5 ${disk.status === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}>
                              {disk.status === 'critical'
                                ? `El disco supera el 85% de uso (${disk.usedPercent.toFixed(1)}%). Considera liberar espacio urgentemente.`
                                : `El disco supera el 70% de uso (${disk.usedPercent.toFixed(1)}%). Monitorea de cerca.`
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-green-100 bg-white/50 px-6 py-3 flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {lastUpdate
              ? `Actualizado: ${lastUpdate.toLocaleTimeString()}`
              : 'Sin datos aún'
            }
          </div>
          <button onClick={() => setActiveTab('nodes')} className="text-green-600 hover:text-green-800 font-medium">
            ← Volver
          </button>
        </div>
      </div>
    </>
  );
};

export default DiskDetail;