import React, { useState, useEffect } from 'react';
import { Activity, Clock, Server, AlertTriangle, CheckCircle, Search, RefreshCw, Layers } from 'lucide-react';

interface ServerLog {
    _id: string;
    clientId: string;
    timestamp: string;
    level: string;
    message: string;
}

const ServerLogs: React.FC = () => {
    const [logs, setLogs] = useState<ServerLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('ALL');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // Tomamos logs generales, como no tenemos un endpoint global en logs.controller sin clientId,
            // usaremos el cluster-summary para obtener loss nodos activos,
            // si existe un endpoint global para logs podríamos usarlo.
            // Modificaremos o agregaremos un fetch genérico provisoriamente.
            const res = await fetch('http://localhost:4000/api/logs/all'); // Asumiremos que crearemos esto
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error("Error fetching server logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 15000); // Actualizar cada 15s
        return () => clearInterval(interval);
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
        return matchesSearch && matchesLevel;
    });

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'INFO': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'WARN': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'ERROR': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
            default: return <Activity className="w-5 h-5 text-blue-500" />;
        }
    };

    const getLevelBadge = (level: string) => {
        switch (level) {
            case 'INFO': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'WARN': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'ERROR': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl">
                            <Layers className="w-6 h-6 text-indigo-600" />
                        </div>
                        Registros del Servidor
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Historial de actividad de los nodos (Heartbeat y Estado)
                    </p>
                </div>

                <button
                    onClick={fetchLogs}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Actualizando...' : 'Actualizar'}
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)]">

                {/* Filtros */}
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por Nodo o Mensaje..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                        {['ALL', 'INFO', 'WARN', 'ERROR'].map(level => (
                            <button
                                key={level}
                                onClick={() => setFilterLevel(level)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${filterLevel === level
                                        ? 'bg-slate-800 text-white shadow-sm'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                    }`}
                            >
                                {level === 'ALL' ? 'Todos' : level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabla Lista de Logs */}
                <div className="overflow-y-auto flex-1 p-0">
                    {loading && logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500/50" />
                            <p className="text-sm font-medium">Cargando registros...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 p-8 text-center ml-2 mr-2">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-2 border border-slate-100">
                                <Search className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-600 font-medium">No se encontraron registros</p>
                            <p className="text-sm">Ajusta los filtros de búsqueda para ver más resultados.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100/80">
                            {filteredLogs.map((log) => (
                                <div key={log._id || Math.random().toString()} className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row gap-4 items-start">

                                    <div className="flex-shrink-0 mt-0.5">
                                        {getLevelIcon(log.level)}
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border ${getLevelBadge(log.level)}`}>
                                                {log.level}
                                            </span>
                                            <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 break-all">
                                                <Server className="w-3.5 h-3.5 text-slate-400" />
                                                {log.clientId}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                            {log.message}
                                        </p>
                                    </div>

                                    <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 whitespace-nowrap bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex-shrink-0">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(log.timestamp).toLocaleString(undefined, {
                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                                        })}
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ServerLogs;
