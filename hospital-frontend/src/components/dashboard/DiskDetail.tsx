// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  HardDrive, AlertCircle, CheckCircle, XCircle, 
  Thermometer, Activity, Zap, Clock, BarChart3,
  Download, RefreshCw, Wifi, WifiOff, Cpu, Save,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';

const DiskDetail = ({ setActiveTab }) => {
  const { selectedNode, setSelectedNode } = useApp();
  const [disks, setDisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDisk, setExpandedDisk] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Simular carga de discos
  useEffect(() => {
    if (!selectedNode) return;

    const loadDisks = () => {
      setLoading(true);
      
      // Generar discos basados en el nodo seleccionado
      const mockDisks = [];
      for (let i = 1; i <= selectedNode.disks; i++) {
        const isHealthy = i <= selectedNode.disksHealthy;
        const status = isHealthy ? 'healthy' : (i === selectedNode.disks ? 'critical' : 'warning');
        
        mockDisks.push({
          id: i,
          name: `Disco ${i} - ${i === 1 ? 'Sistema' : i === 2 ? 'Datos' : i === 3 ? 'Backups' : 'Almacenamiento'}`,
          model: i % 2 === 0 ? 'Samsung SSD 870 EVO' : 'WD Red',
          type: i % 2 === 0 ? 'SSD' : 'HDD',
          capacity: i % 2 === 0 ? '1TB' : '4TB',
          used: i % 2 === 0 ? '650GB' : '3.2TB',
          available: i % 2 === 0 ? '350GB' : '800GB',
          status: status,
          temperature: isHealthy ? 42 : 58,
          health: isHealthy ? '98%' : '65%',
          readSpeed: i % 2 === 0 ? '560 MB/s' : '210 MB/s',
          writeSpeed: i % 2 === 0 ? '530 MB/s' : '200 MB/s',
          partition: `/dev/sd${String.fromCharCode(97 + i)}1`,
          mountPoint: i === 1 ? '/' : i === 2 ? '/data' : '/backup',
          smartStatus: isHealthy ? 'PASSED' : 'WARNING',
          powerOnHours: Math.floor(1000 + Math.random() * 9000) + ' h',
          errors: isHealthy ? 0 : Math.floor(Math.random() * 100),
          reallocatedSectors: isHealthy ? 0 : Math.floor(Math.random() * 50),
        });
      }
      
      setDisks(mockDisks);
      setLoading(false);
    };

    loadDisks();

    // Auto-refresh cada 30 segundos
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadDisks, 30000);
    }
    return () => clearInterval(interval);
  }, [selectedNode, autoRefresh]);

  if (!selectedNode) return null;

  const getStatusColor = (status) => {
    switch(status) {
      case 'healthy': return 'text-green-600 bg-green-100 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />;
      case 'critical': return <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />;
      default: return <HardDrive className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />;
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'SSD': return <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />;
      case 'NVMe': return <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />;
      default: return <HardDrive className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />;
    }
  };

  const stats = {
    total: disks.length,
    healthy: disks.filter(d => d.status === 'healthy').length,
    warning: disks.filter(d => d.status === 'warning').length,
    critical: disks.filter(d => d.status === 'critical').length,
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-emerald-50">
        {/* Header - SIN PADDING HORIZONTAL */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
            <div className="w-full sm:w-auto">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                <HardDrive className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                <span className="truncate max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[800px]">
                  Discos - {selectedNode.name}
                </span>
              </h2>
              <p className="text-green-100 text-xs sm:text-sm md:text-base mt-1 truncate max-w-[350px] sm:max-w-[450px] md:max-w-[550px] lg:max-w-[650px] xl:max-w-[850px]">
                {selectedNode.location} • {selectedNode.ip} • {selectedNode.model}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 sm:p-2.5 md:p-3 rounded-xl transition-colors shadow-lg ${
                  autoRefresh ? 'bg-green-500 text-white' : 'bg-green-500 text-white hover:bg-green-400'
                }`}
                title={autoRefresh ? 'Auto-refresh activado' : 'Activar auto-refresh'}
              >
                <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 ${autoRefresh ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setActiveTab('nodes')}
                className="p-2 sm:p-2.5 md:p-3 hover:bg-green-700 rounded-xl transition-colors"
              >
                <XCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
            </div>
          </div>
        </div>

        {/* Resumen rápido - SIN PADDING HORIZONTAL */}
        <div className="border-b border-gray-200">
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
              {/* Total */}
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-4 sm:p-5 md:p-6 text-white shadow-lg shadow-green-200">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <HardDrive className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 opacity-80" />
                  <span className="text-[10px] sm:text-xs font-medium bg-white bg-opacity-20 px-2 sm:px-3 py-1 rounded-full">
                    Total
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">{stats.total}</div>
                <div className="text-xs sm:text-sm opacity-80">Discos totales</div>
              </div>

              {/* Saludables */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-4 sm:p-5 md:p-6 text-white shadow-lg shadow-emerald-200">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <CheckCircle className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 opacity-80" />
                  <span className="text-[10px] sm:text-xs font-medium bg-white bg-opacity-20 px-2 sm:px-3 py-1 rounded-full">
                    Saludables
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">{stats.healthy}</div>
                <div className="text-xs sm:text-sm opacity-80">Discos OK</div>
                <div className="mt-3 sm:mt-4 w-full bg-white bg-opacity-20 rounded-full h-1.5 sm:h-2">
                  <div 
                    className="bg-white rounded-full h-1.5 sm:h-2"
                    style={{ width: `${(stats.healthy / stats.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Advertencia */}
              <div className="bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl p-4 sm:p-5 md:p-6 text-white shadow-lg shadow-yellow-200">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <AlertCircle className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 opacity-80" />
                  <span className="text-[10px] sm:text-xs font-medium bg-white bg-opacity-20 px-2 sm:px-3 py-1 rounded-full">
                    Advertencia
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">{stats.warning}</div>
                <div className="text-xs sm:text-sm opacity-80">Discos con alertas</div>
                <div className="mt-3 sm:mt-4 w-full bg-white bg-opacity-20 rounded-full h-1.5 sm:h-2">
                  <div 
                    className="bg-white rounded-full h-1.5 sm:h-2"
                    style={{ width: `${(stats.warning / stats.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Crítico */}
              <div className="bg-gradient-to-br from-red-500 to-rose-500 rounded-xl p-4 sm:p-5 md:p-6 text-white shadow-lg shadow-red-200">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <XCircle className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 opacity-80" />
                  <span className="text-[10px] sm:text-xs font-medium bg-white bg-opacity-20 px-2 sm:px-3 py-1 rounded-full">
                    Crítico
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">{stats.critical}</div>
                <div className="text-xs sm:text-sm opacity-80">Discos críticos</div>
                <div className="mt-3 sm:mt-4 w-full bg-white bg-opacity-20 rounded-full h-1.5 sm:h-2">
                  <div 
                    className="bg-white rounded-full h-1.5 sm:h-2"
                    style={{ width: `${(stats.critical / stats.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Estado Nodo */}
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 sm:p-5 md:p-6 text-white shadow-lg shadow-purple-200">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  {selectedNode.status === 'active' ? <Wifi className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 opacity-80" /> :
                   selectedNode.status === 'warning' ? <AlertCircle className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 opacity-80" /> :
                   <WifiOff className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 opacity-80" />}
                  <span className="text-[10px] sm:text-xs font-medium bg-white bg-opacity-20 px-2 sm:px-3 py-1 rounded-full">
                    Estado Nodo
                  </span>
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 truncate">
                  {selectedNode.status === 'active' ? 'Activo' :
                   selectedNode.status === 'warning' ? 'Advertencia' : 'Inactivo'}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm opacity-80 truncate">
                  CPU: {selectedNode.cpu} • RAM: {selectedNode.ram}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de discos - SIN PADDING HORIZONTAL */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
            {loading ? (
              <div className="text-center py-12 sm:py-16">
                <RefreshCw className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-green-500 animate-spin mx-auto mb-4 sm:mb-5 md:mb-6" />
                <p className="text-sm sm:text-base md:text-lg text-gray-600">Cargando información de discos...</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {disks.map((disk) => (
                  <div 
                    key={disk.id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-green-100 overflow-hidden transition-all hover:shadow-xl"
                  >
                    {/* Cabecera del disco */}
                    <div 
                      className="p-4 sm:p-5 md:p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={() => setExpandedDisk(expandedDisk === disk.id ? null : disk.id)}
                    >
                      <div className="flex flex-col lg:flex-row items-start gap-3 sm:gap-4">
                        <div className={`p-2 sm:p-2.5 md:p-3 rounded-xl ${getStatusColor(disk.status)}`}>
                          {getStatusIcon(disk.status)}
                        </div>
                        
                        <div className="flex-1 w-full lg:w-auto">
                          <div className="flex flex-col lg:flex-row items-start justify-between gap-3 lg:gap-4">
                            <div className="flex-1 w-full">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                <h3 className="font-semibold text-gray-800 text-base sm:text-lg md:text-xl truncate max-w-[200px] sm:max-w-[250px] md:max-w-[300px] lg:max-w-[400px] xl:max-w-[500px]">
                                  {disk.name}
                                </h3>
                                {getTypeIcon(disk.type)}
                                <span className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">
                                  {disk.type}
                                </span>
                                <span className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[180px] md:max-w-[220px]">
                                  {disk.model}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-2 sm:mt-3">
                                <div>
                                  <div className="text-xs sm:text-sm font-medium text-gray-800">{disk.capacity}</div>
                                  <div className="text-[8px] sm:text-xs text-gray-500">Capacidad</div>
                                </div>
                                
                                <div>
                                  <div className="text-xs sm:text-sm font-medium text-gray-800">{disk.used}</div>
                                  <div className="text-[8px] sm:text-xs text-gray-500">Usado</div>
                                </div>
                                
                                <div>
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <Thermometer className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                      disk.temperature > 60 ? 'text-red-500' : 
                                      disk.temperature > 50 ? 'text-yellow-500' : 'text-green-500'
                                    }`} />
                                    <span className="text-xs sm:text-sm font-medium">{disk.temperature}°C</span>
                                  </div>
                                  <div className="text-[8px] sm:text-xs text-gray-500">Temperatura</div>
                                </div>
                                
                                <div className="col-span-2 sm:col-span-1">
                                  <span className={`inline-block px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-xs font-medium ${getStatusColor(disk.status)} whitespace-nowrap`}>
                                    {disk.status === 'healthy' ? 'Saludable' : 
                                     disk.status === 'warning' ? 'Advertencia' : 'Crítico'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center self-end lg:self-center">
                              {expandedDisk === disk.id ? 
                                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-400" /> : 
                                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-400" />
                              }
                            </div>
                          </div>

                          {/* Barra de uso */}
                          <div className="mt-3 sm:mt-4">
                            <div className="flex justify-between text-[8px] sm:text-xs md:text-sm text-gray-500 mb-1">
                              <span>Uso del disco</span>
                              <span>{Math.round((parseInt(disk.used) / parseInt(disk.capacity)) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 md:h-2.5">
                              <div 
                                className={`h-1.5 sm:h-2 md:h-2.5 rounded-full ${
                                  disk.status === 'healthy' ? 'bg-green-500' :
                                  disk.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${(parseInt(disk.used) / parseInt(disk.capacity)) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detalles expandidos */}
                    {expandedDisk === disk.id && (
                      <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6 border-t border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 py-4 sm:py-5 md:py-6">
                          <div className="bg-white p-2 sm:p-3 md:p-4 rounded-xl border border-green-100">
                            <div className="text-[8px] sm:text-xs md:text-sm text-gray-500 mb-1">Partición</div>
                            <div className="font-mono text-xs sm:text-sm md:text-base font-medium truncate">{disk.partition}</div>
                          </div>
                          <div className="bg-white p-2 sm:p-3 md:p-4 rounded-xl border border-green-100">
                            <div className="text-[8px] sm:text-xs md:text-sm text-gray-500 mb-1">Punto montaje</div>
                            <div className="font-mono text-xs sm:text-sm md:text-base font-medium truncate">{disk.mountPoint}</div>
                          </div>
                          <div className="bg-white p-2 sm:p-3 md:p-4 rounded-xl border border-green-100">
                            <div className="text-[8px] sm:text-xs md:text-sm text-gray-500 mb-1">Salud SMART</div>
                            <span className={`inline-block px-2 sm:px-2.5 md:px-3 py-1 rounded-full text-[8px] sm:text-xs md:text-sm font-medium ${
                              disk.smartStatus === 'PASSED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {disk.smartStatus}
                            </span>
                          </div>
                          <div className="bg-white p-2 sm:p-3 md:p-4 rounded-xl border border-green-100">
                            <div className="text-[8px] sm:text-xs md:text-sm text-gray-500 mb-1">Horas encendido</div>
                            <div className="text-xs sm:text-sm md:text-base font-medium truncate">{disk.powerOnHours}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-4 sm:mb-5 md:mb-6">
                          <div className="bg-white p-2 sm:p-3 md:p-4 rounded-xl border border-green-100">
                            <div className="text-[8px] sm:text-xs md:text-sm text-gray-500 mb-1">Velocidad lectura</div>
                            <div className="text-xs sm:text-sm md:text-base font-medium truncate">{disk.readSpeed}</div>
                          </div>
                          <div className="bg-white p-2 sm:p-3 md:p-4 rounded-xl border border-green-100">
                            <div className="text-[8px] sm:text-xs md:text-sm text-gray-500 mb-1">Velocidad escritura</div>
                            <div className="text-xs sm:text-sm md:text-base font-medium truncate">{disk.writeSpeed}</div>
                          </div>
                          <div className="bg-white p-2 sm:p-3 md:p-4 rounded-xl border border-green-100">
                            <div className="text-[8px] sm:text-xs md:text-sm text-gray-500 mb-1">Errores</div>
                            <div className={`text-xs sm:text-sm md:text-base font-medium ${disk.errors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {disk.errors}
                            </div>
                          </div>
                        </div>

                        {/* Alertas si hay problemas */}
                        {disk.status !== 'healthy' && (
                          <div className={`p-3 sm:p-4 rounded-xl mb-4 sm:mb-5 md:mb-6 ${
                            disk.status === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                          }`}>
                            <div className="flex items-start gap-2 sm:gap-3">
                              {disk.status === 'critical' ? 
                                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" /> :
                                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" />
                              }
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-medium text-sm sm:text-base md:text-lg ${
                                  disk.status === 'critical' ? 'text-red-800' : 'text-yellow-800'
                                }`}>
                                  {disk.status === 'critical' ? 'Alerta Crítica' : 'Advertencia'}
                                </h4>
                                <p className={`text-xs sm:text-sm md:text-base ${
                                  disk.status === 'critical' ? 'text-red-600' : 'text-yellow-600'
                                }`}>
                                  {disk.status === 'critical' 
                                    ? 'El disco está en riesgo de fallar. Se recomienda respaldar datos inmediatamente.'
                                    : 'El disco muestra signos de degradación. Monitorear de cerca.'}
                                </p>
                                {disk.reallocatedSectors > 0 && (
                                  <p className="text-[10px] sm:text-xs md:text-sm mt-2 text-gray-600">
                                    Sectores reasignados: {disk.reallocatedSectors}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Acciones */}
                        <div className="flex flex-wrap gap-2 sm:gap-3 justify-end">
                          <button className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base bg-white border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-1 sm:gap-2 transition-colors shadow-sm">
                            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">Exportar logs SMART</span>
                            <span className="sm:hidden">Exportar</span>
                          </button>
                          <button className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-1 sm:gap-2 transition-colors shadow-lg shadow-green-200">
                            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">Ejecutar diagnóstico</span>
                            <span className="sm:hidden">Diagnóstico</span>
                          </button>
                          <button className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-1 sm:gap-2 transition-colors shadow-lg shadow-emerald-200">
                            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">Programar respaldo</span>
                            <span className="sm:hidden">Respaldo</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer - SIN PADDING HORIZONTAL */}
        <div className="border-t border-green-100 bg-white/50 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-xs sm:text-sm md:text-base">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6">
              <span className="text-gray-600 flex items-center gap-1 sm:gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="truncate max-w-[180px] sm:max-w-[250px] md:max-w-[350px] lg:max-w-[450px] xl:max-w-[550px]">
                  Última actualización: {new Date().toLocaleString()}
                </span>
              </span>
              <span className="text-gray-400 hidden sm:inline">|</span>
              <span className="text-gray-600 flex items-center gap-1 sm:gap-2">
                <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] xl:max-w-[400px]">
                  CPU: {selectedNode.cpu} • RAM: {selectedNode.ram}
                </span>
              </span>
            </div>
            <button 
              onClick={() => setActiveTab('nodes')}
              className="text-green-600 hover:text-green-800 font-medium text-sm sm:text-base md:text-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
  );
};

export default DiskDetail;