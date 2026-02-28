// @ts-nocheck
import React, { useState } from 'react';
import { 
  Server, Wifi, WifiOff, AlertCircle, HardDrive, 
  MoreVertical, Activity, Clock, MapPin, Cpu, 
  ChevronDown, ChevronUp, Filter, Search,
  LayoutGrid, Database, ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { useNodes } from '../../hooks/useNodes.js';

const NodeGrid = ({ setActiveTab }) => {
  const nodes = useNodes();
  const { setSelectedNode } = useApp();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active': return <Wifi className="w-5 h-5 text-green-600" />;
      case 'inactive': return <WifiOff className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'active': return 'Activo';
      case 'inactive': return 'No Reporta';
      case 'warning': return 'Advertencia';
      default: return 'Desconocido';
    }
  };

  const getStatusBgClass = (status) => {
    switch(status) {
      case 'active': return 'bg-green-50 text-green-700';
      case 'inactive': return 'bg-red-50 text-red-700';
      case 'warning': return 'bg-yellow-50 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Filtrar y ordenar nodos
  const filteredNodes = nodes
    .filter(node => filter === 'all' || node.status === filter)
    .filter(node => 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.ip.includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      if (sortBy === 'location') return a.location.localeCompare(b.location);
      return 0;
    });

  const stats = {
    total: nodes.length,
    active: nodes.filter(n => n.status === 'active').length,
    inactive: nodes.filter(n => n.status === 'inactive').length,
    warning: nodes.filter(n => n.status === 'warning').length,
  };

  // Determinar si estamos en vista de advertencia o inactivo con pocos nodos
  const isExpandedView = (filter === 'warning' || filter === 'inactive') && filteredNodes.length <= 3;

  return (
    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Monitor de Nodos CNS</h1>
        <p className="text-green-600 mt-1">Visualiza el estado de todos los servidores regionales</p>
      </div>

      {/* Grid de Nodos - SOLO DISEÑO, SIN FILTROS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 w-full">
        {filteredNodes.map((node) => (
          <div 
            key={node.id}
            className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all border overflow-hidden cursor-pointer transform hover:-translate-y-1 ${
              node.status === 'warning' ? 'border-yellow-300 ring-2 ring-yellow-200' :
              node.status === 'inactive' ? 'border-red-300 ring-2 ring-red-200' :
              node.status === 'active' ? 'border-green-300 ring-2 ring-green-200' :
              'border-green-100'
            }`}
            onClick={() => {
              setSelectedNode(node);
              setActiveTab('disks');
            }}
          >
            <div className="p-4">
              {/* Cabecera del nodo */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    node.status === 'active' ? 'bg-green-100' :
                    node.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <Server className={`w-5 h-5 ${
                      node.status === 'active' ? 'text-green-600' :
                      node.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">{node.name}</h3>
                    <p className="text-xs text-green-600">{node.model}</p>
                  </div>
                </div>
                <button className="p-1 hover:bg-green-50 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4 text-green-600" />
                </button>
              </div>

              {/* Estado y última conexión */}
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusBgClass(node.status)}`}>
                  {getStatusIcon(node.status)}
                  {getStatusText(node.status)}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {node.lastSeen}
                </span>
              </div>

              {/* Información de ubicación e IP */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="w-3 h-3 text-green-600" />
                  <span>{node.location}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Cpu className="w-3 h-3 text-green-600" />
                  <span>CPU: {node.cpu}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 col-span-2 font-mono text-xs bg-green-50 p-1.5 rounded-lg">
                  <span className="text-green-600 font-medium">IP:</span> {node.ip}
                </div>
              </div>

              {/* Métricas de disco */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-gray-600">
                      {node.disksHealthy}/{node.disks}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(node.disks)].map((_, i) => (
                      <div 
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          i < node.disksHealthy ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Uso de espacio */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Uso</span>
                    <span>{node.usedSpace}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        parseInt(node.usedSpace) / parseInt(node.totalSpace) * 100 > 80 ? 'bg-red-500' :
                        parseInt(node.usedSpace) / parseInt(node.totalSpace) * 100 > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(parseInt(node.usedSpace) / parseInt(node.totalSpace)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-green-100 flex justify-between items-center">
                <span className="text-xs text-gray-400">ID: {node.id}</span>
                <span className="text-green-600 text-xs font-medium hover:text-green-800 transition-colors flex items-center gap-1">
                  Ver discos
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje si no hay resultados */}
      {filteredNodes.length === 0 && (
        <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl border border-green-100">
          <Server className="w-16 h-16 text-green-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800">No se encontraron nodos</h3>
          <p className="text-gray-500">Intenta con otros filtros o términos de búsqueda</p>
        </div>
      )}
    </div>
  );
};

export default NodeGrid;