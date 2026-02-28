// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  Database, HardDrive, TrendingUp, TrendingDown, 
  Calendar, Download, RefreshCw, Server,
  AlertCircle, CheckCircle, XCircle, Clock,
  PieChart, BarChart, Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { generateHistoricalData } from '../../utils/helpers.js';

const GlobalStats = () => {
  const { nodes, globalStats } = useApp();
  const [timeRange, setTimeRange] = useState('24h');
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedView, setSelectedView] = useState('overview');

  // Generar datos históricos simulados
  useEffect(() => {
    setHistoricalData(generateHistoricalData());
  }, []);

  // Calcular estadísticas adicionales
  const totalDisks = nodes.reduce((acc, node) => acc + node.disks, 0);
  const healthyDisks = nodes.reduce((acc, node) => acc + node.disksHealthy, 0);
  const warningDisks = totalDisks - healthyDisks;
  
  const totalSpaceTB = nodes.reduce((acc, node) => {
    const space = parseInt(node.totalSpace) || 0;
    return acc + space;
  }, 0);
  
  const usedSpaceTB = nodes.reduce((acc, node) => {
    const used = parseInt(node.usedSpace) || 0;
    return acc + used;
  }, 0);
  
  const freeSpaceTB = totalSpaceTB - usedSpaceTB;
  const usagePercentage = Math.round((usedSpaceTB / totalSpaceTB) * 100) || 0;

  // Regiones con mayor uso
  const topRegions = nodes
    .map(node => ({
      name: node.location,
      usage: node.usedSpace,
      total: node.totalSpace,
      percentage: Math.round((parseInt(node.usedSpace) / parseInt(node.totalSpace)) * 100) || 0
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  return (
    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Consolidado Global del Cluster</h1>
        <p className="text-green-600 mt-1">Métricas generales de toda la red CNS</p>
      </div>

      {/* Controles */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-6 border border-green-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedView('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                selectedView === 'overview' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md shadow-green-200' 
                  : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-600 border border-green-200'
              }`}
            >
              <PieChart className="w-4 h-4" />
              Vista general
            </button>
            <button
              onClick={() => setSelectedView('trends')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                selectedView === 'trends' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md shadow-green-200' 
                  : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-600 border border-green-200'
              }`}
            >
              <BarChart className="w-4 h-4" />
              Tendencias
            </button>
          </div>

          <div className="flex gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-green-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="1y">Último año</option>
            </select>
            <button className="p-2 border border-green-200 rounded-lg hover:bg-green-50 text-green-600 transition-colors bg-white">
              <Download className="w-5 h-5" />
            </button>
            <button className="p-2 border border-green-200 rounded-lg hover:bg-green-50 text-green-600 transition-colors bg-white">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 text-white shadow-lg shadow-green-200">
          <div className="flex items-center justify-between mb-4">
            <Database className="w-10 h-10 opacity-80" />
            <span className="text-xs font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
              Total Cluster
            </span>
          </div>
          <div className="text-3xl font-bold mb-1">{totalSpaceTB} TB</div>
          <div className="text-sm opacity-80">Capacidad total instalada</div>
          <div className="mt-4 text-xs opacity-60">
            {nodes.length} nodos • {totalDisks} discos
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-6 text-white shadow-lg shadow-emerald-200">
          <div className="flex items-center justify-between mb-4">
            <HardDrive className="w-10 h-10 opacity-80" />
            <span className="text-xs font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
              Disponible
            </span>
          </div>
          <div className="text-3xl font-bold mb-1">{freeSpaceTB} TB</div>
          <div className="text-sm opacity-80">Espacio libre ({100 - usagePercentage}%)</div>
          <div className="mt-4 w-full bg-white bg-opacity-20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2"
              style={{ width: `${100 - usagePercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-lime-500 rounded-xl p-6 text-white shadow-lg shadow-green-200">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-10 h-10 opacity-80" />
            <span className="text-xs font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
              En Uso
            </span>
          </div>
          <div className="text-3xl font-bold mb-1">{usedSpaceTB} TB</div>
          <div className="text-sm opacity-80">Espacio utilizado ({usagePercentage}%)</div>
          <div className="mt-4 w-full bg-white bg-opacity-20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2"
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg shadow-teal-200">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-10 h-10 opacity-80" />
            <span className="text-xs font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
              Crecimiento
            </span>
          </div>
          <div className="text-3xl font-bold mb-1">+2.4 TB</div>
          <div className="text-sm opacity-80">Crecimiento últimos 30 días</div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>+8.3% vs mes anterior</span>
          </div>
        </div>
      </div>

      {/* Gráficos y métricas detalladas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Estado de salud del cluster */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-green-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Salud del Cluster</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Nodos activos</span>
                <span className="font-semibold text-green-600">{globalStats.activeNodes}/{globalStats.totalNodes}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full h-2"
                  style={{ width: `${(globalStats.activeNodes / globalStats.totalNodes) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Discos saludables</span>
                <span className="font-semibold text-green-600">{healthyDisks}/{totalDisks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full h-2"
                  style={{ width: `${(healthyDisks / totalDisks) * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-green-100">
              <h4 className="font-medium text-gray-700 mb-3">Resumen de estado</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-green-600">{globalStats.activeNodes}</div>
                  <div className="text-xs text-gray-600">Activos</div>
                </div>
                <div className="text-center p-3 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-yellow-600">{globalStats.warningNodes}</div>
                  <div className="text-xs text-gray-600">Advertencia</div>
                </div>
                <div className="text-center p-3 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-red-600">{globalStats.inactiveNodes}</div>
                  <div className="text-xs text-gray-600">Inactivos</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top regiones por uso */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-green-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Regiones por Uso</h3>
          
          <div className="space-y-4">
            {topRegions.map((region, index) => (
              <div key={region.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                      index === 0 ? 'bg-green-100 text-green-700' :
                      index === 1 ? 'bg-emerald-100 text-emerald-700' :
                      index === 2 ? 'bg-teal-100 text-teal-700' :
                      'bg-green-50 text-green-600'
                    }`}>
                      {index + 1}
                    </span>
                    {region.name}
                  </span>
                  <span className="font-medium">{region.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`rounded-full h-2 ${
                      region.percentage > 80 ? 'bg-red-500' :
                      region.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${region.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{region.usage} usados</span>
                  <span>{region.total} total</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-green-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Promedio de uso</span>
              <span className="font-semibold text-green-600">
                {Math.round(topRegions.reduce((acc, r) => acc + r.percentage, 0) / topRegions.length)}%
              </span>
            </div>
          </div>
        </div>

        {/* Proyecciones y alertas */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-green-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Proyecciones y Alertas</h3>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-green-800">Proyección de capacidad</h4>
                  <p className="text-sm text-green-600 mt-1">
                    Al ritmo actual de crecimiento, se alcanzará el 80% de capacidad en 45 días.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                      Recomendación: Planificar expansión
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-1" />
                <div>
                  <h4 className="font-medium text-yellow-800">Alertas activas</h4>
                  <p className="text-sm text-yellow-600 mt-1">
                    {warningDisks} discos en estado de advertencia • {globalStats.warningNodes} nodos con problemas
                  </p>
                  <div className="mt-2">
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                      Requiere atención
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-teal-600 mt-1" />
                <div>
                  <h4 className="font-medium text-teal-800">Eficiencia del cluster</h4>
                  <p className="text-sm text-teal-600 mt-1">
                    Ratio de compresión: 1.8x • Ahorro estimado: 42 TB
                  </p>
                  <div className="mt-2">
                    <span className="text-xs bg-teal-200 text-teal-800 px-2 py-1 rounded-full">
                      Eficiencia: Óptima
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de uso */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-green-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Historial de uso (últimos 6 meses)</h3>
        
        <div className="h-64 flex items-end justify-between gap-2">
          {historicalData.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-3">
              <div className="w-full bg-green-100 rounded-t-lg relative group">
                <div 
                  className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-emerald-500 rounded-t-lg transition-all group-hover:from-green-600 group-hover:to-emerald-600"
                  style={{ height: `${item.percentage}%`, maxHeight: '100%' }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                  {item.used} TB usado • {item.percentage}%
                </div>
              </div>
              <span className="text-xs text-gray-600 font-medium">{item.month}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center text-sm text-gray-500 pt-4 border-t border-green-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded"></div>
              <span>Espacio utilizado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-200 rounded"></div>
              <span>Espacio disponible</span>
            </div>
          </div>
          <span className="font-medium text-green-600">
            Crecimiento total: +22 TB en 6 meses
          </span>
        </div>
      </div>
    </div>
  );
};

export default GlobalStats;