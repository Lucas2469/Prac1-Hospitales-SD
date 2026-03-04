// @ts-nocheck
import React, { useState } from 'react';
import {
  Server, Wifi, WifiOff, AlertCircle, HardDrive,
  MoreVertical, Activity, Clock, MapPin, Cpu,
  RefreshCw, ChevronRight, Loader2, Trash2, Eye, Plus, X
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';

const API = 'http://localhost:4000/api';

const NodeGrid = ({ setActiveTab }) => {
  const { nodes, loading, countdown, refreshNow, setSelectedNode } = useApp();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Modal Añadir Cliente
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ alias: '', ipAddress: '' });
  const [adding, setAdding] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Wifi className="w-4 h-4 text-green-600" />;
      case 'inactive': return <WifiOff className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => ({
    active: 'Activo',
    inactive: 'No Reporta',
    warning: 'Advertencia',
  }[status] || 'Desconocido');

  const getBorder = (status) => ({
    active: 'border-green-300 ring-2 ring-green-100',
    inactive: 'border-red-300   ring-2 ring-red-100',
    warning: 'border-yellow-300 ring-2 ring-yellow-100',
  }[status] || 'border-gray-200');

  const getBadge = (status) => ({
    active: 'bg-green-50  text-green-700',
    inactive: 'bg-red-50    text-red-700',
    warning: 'bg-yellow-50 text-yellow-700',
  }[status] || 'bg-gray-100 text-gray-700');

  const filtered = nodes
    .filter(n => filter === 'all' || n.status === filter)
    .filter(n =>
      n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.ip || '').includes(searchTerm) ||
      (n.location || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  const stats = {
    total: nodes.length,
    active: nodes.filter(n => n.status === 'active').length,
    inactive: nodes.filter(n => n.status === 'inactive').length,
    warning: nodes.filter(n => n.status === 'warning').length,
  };

  const handleDelete = async (e, clientId) => {
    e.stopPropagation();
    if (!window.confirm(`¿Eliminar el nodo "${clientId}" de la base de datos?\n\nEsto también borrará su historial de métricas.`)) return;
    setDeleting(clientId);
    setOpenMenu(null);
    try {
      await fetch(`${API}/clients/${encodeURIComponent(clientId)}`, { method: 'DELETE' });
      await refreshNow();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.alias || !addForm.ipAddress) return alert("Llena todos los campos");

    setAdding(true);
    try {
      const res = await fetch(`${API}/clients/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Error al añadir");

      setShowAddModal(false);
      setAddForm({ alias: '', ipAddress: '' });
      await refreshNow();
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen w-full relative">

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Monitor de Nodos CNS</h1>
          <p className="text-green-700 mt-1 font-medium">Visualiza el estado de todos los servidores regionales</p>
        </div>
      </div>

      {/* Stats premium con gradientes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total nodos', value: stats.total,
            grad: 'from-slate-600 to-slate-800',
            idle: 'bg-white text-slate-700 border-slate-200',
            glow: 'shadow-slate-200',
            icon: '🖥️', filter: 'all'
          },
          {
            label: 'Activos', value: stats.active,
            grad: 'from-emerald-500 to-green-600',
            idle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            glow: 'shadow-emerald-200',
            icon: '✅', filter: 'active'
          },
          {
            label: 'Sin reporte', value: stats.inactive,
            grad: 'from-red-500 to-rose-600',
            idle: 'bg-red-50 text-red-800 border-red-200',
            glow: 'shadow-red-100',
            icon: '💔', filter: 'inactive'
          },
          {
            label: 'Advertencia', value: stats.warning,
            grad: 'from-amber-400 to-orange-500',
            idle: 'bg-amber-50 text-amber-800 border-amber-200',
            glow: 'shadow-amber-100',
            icon: '⚠️', filter: 'warning'
          },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => setFilter(s.filter)}
            className={`rounded-2xl p-4 text-left transition-all duration-200 border ${filter === s.filter
              ? `bg-gradient-to-br ${s.grad} text-white border-transparent shadow-xl ${s.glow} scale-[1.03]`
              : `${s.idle} border hover:scale-[1.01] hover:shadow-md`
              }`}
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-3xl font-extrabold leading-none">{s.value}</span>
              <span className="text-xl mt-0.5">{s.icon}</span>
            </div>
            <div className={`text-xs font-bold tracking-wide uppercase mt-1 ${filter === s.filter ? 'text-white/80' : 'opacity-60'
              }`}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Refresh + Search row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 items-start sm:items-center">
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar nodo, IP o región..."
          className="flex-1 max-w-sm px-4 py-2.5 border border-green-200 rounded-xl bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
        />

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-green-500 text-green-700 rounded-xl text-sm font-bold hover:bg-green-50 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Añadir Nodo
        </button>

        <button
          onClick={refreshNow}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md shadow-green-200 hover:shadow-lg"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar ahora
        </button>
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-green-200 rounded-xl text-sm text-green-700 font-medium shadow-sm ml-auto sm:ml-0">
          <Clock className="w-4 h-4 text-green-500" />
          <span>en <span className="font-bold text-green-600">{countdown}s</span></span>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-green-600">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-lg font-medium">Cargando nodos desde la API...</span>
        </div>
      )}

      {/* Grid de nodos */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
          {filtered.map((node) => (
            <div
              key={node.clientId}
              className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all border overflow-hidden cursor-pointer transform hover:-translate-y-1 ${getBorder(node.status)}`}
              onClick={() => {
                setSelectedNode(node);
                setActiveTab('disks');
              }}
            >
              <div className="p-4">
                {/* Cabecera */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${node.status === 'active' ? 'bg-green-100' :
                      node.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                      <Server className={`w-5 h-5 ${node.status === 'active' ? 'text-green-600' :
                        node.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm truncate max-w-[140px]">{node.name}</h3>
                      <p className="text-xs text-green-600">{node.model}</p>
                    </div>
                  </div>
                  {/* Menú 3 puntos con dropdown */}
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === node.clientId ? null : node.clientId); }}
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {openMenu === node.clientId && (
                      <div className="absolute right-0 top-8 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 min-w-[150px]">
                        <button
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                          onClick={e => { e.stopPropagation(); setOpenMenu(null); setSelectedNode(node); setActiveTab('disks'); }}
                        >
                          <Eye className="w-4 h-4" /> Ver discos
                        </button>
                        <div className="mx-3 my-1 border-t border-gray-100" />
                        <button
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          onClick={e => handleDelete(e, node.clientId)}
                          disabled={deleting === node.clientId}
                        >
                          <Trash2 className="w-4 h-4" />
                          {deleting === node.clientId ? 'Eliminando...' : 'Eliminar nodo'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estado */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getBadge(node.status)}`}>
                    {getStatusIcon(node.status)}
                    {getStatusText(node.status)}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {node.lastSeen}
                  </span>
                </div>

                {/* IP & región */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  {node.location && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-3 h-3 text-green-600" />
                      <span className="truncate">{node.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-gray-600">
                    <Cpu className="w-3 h-3 text-green-600" />
                    <span>CPU: {node.cpu}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1 font-mono text-xs bg-green-50 p-1.5 rounded-lg text-gray-600">
                    <span className="text-green-600 font-medium">IP:</span> {node.ip}
                  </div>
                </div>

                {/* Indicador de discos (si hay métricas) */}
                {node.disks > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-green-600" />
                        <span>{node.disksHealthy}/{node.disks} discos</span>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(Math.min(node.disks, 6))].map((_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < node.disksHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${node.disks > 0 && node.disksHealthy / node.disks < 0.5 ? 'bg-red-500' :
                          node.disks > 0 && node.disksHealthy / node.disks < 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        style={{ width: `${node.disks > 0 ? (node.disksHealthy / node.disks) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-3 pt-3 border-t border-green-100 flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-mono truncate max-w-[120px]">{node.clientId}</span>
                  <div className="flex gap-3">
                    <a
                      href={`http://${node.ip || 'localhost'}:3002`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-md transition-colors"
                    >
                      Web Cliente <Eye className="w-3 h-3" />
                    </a>
                    <span className="text-green-600 text-xs font-medium flex items-center gap-1 hover:text-green-700">
                      Ver discos <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl border border-green-100">
          <Server className="w-16 h-16 text-green-300 mx-auto mb-4" />
          {nodes.length === 0 ? (
            <>
              <h3 className="text-lg font-medium text-gray-800">No hay nodos conectados</h3>
              <p className="text-gray-500 mt-1">Inicia el client-agent para conectar un nodo al servidor</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-800">No se encontraron nodos</h3>
              <p className="text-gray-500 mt-1">Prueba con otros filtros</p>
            </>
          )}
        </div>
      )}

      {/* MODAL: Añadir Cliente */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 min-h-screen">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Server className="w-5 h-5 opacity-80" /> Añadir Nuevo Nodo
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-xl border border-green-100">
                Asegúrate de que el <strong>client-agent</strong> esté ejecutándose en la IP destino y copia la IP local de su interfaz.
              </p>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nombre / Alias del Nodo</label>
                <input
                  required
                  autoFocus
                  type="text"
                  placeholder="Ej. Regional Cochabamba"
                  value={addForm.alias}
                  onChange={e => setAddForm({ ...addForm, alias: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Dirección IP</label>
                <input
                  required
                  type="text"
                  placeholder="Ej. 192.168.1.50"
                  value={addForm.ipAddress}
                  onChange={e => setAddForm({ ...addForm, ipAddress: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-6 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-green-700 hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {adding ? 'Guardando...' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeGrid;