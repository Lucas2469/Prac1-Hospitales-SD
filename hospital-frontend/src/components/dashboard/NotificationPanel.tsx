// @ts-nocheck
import React, { useState } from 'react';
import {
  Send, Bell, AlertCircle, Info, CheckCircle,
  AlertTriangle, X, Users, Clock, Mail, MessageSquare,
  Plus, Trash2, Edit, Eye, Filter, Calendar,
  ChevronDown, ChevronUp, Download
} from 'lucide-react';
import { formatDate } from '../../utils/helpers.js';
import { useNotifications } from '../../hooks/useNotifications.js';
import { useApp } from '../../context/AppContext.tsx';

const NotificationPanel = () => {
  const { notifications, addNotification, deleteNotification } = useNotifications();
  const { nodes } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    schedule: 'now',
    scheduledDate: '',
    expiresIn: '24h'
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'info': return <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />;
      case 'critical': return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />;
      case 'success': return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;
      default: return <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />;
    }
  };

  const getTypeBg = (type) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'success': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedClientId) {
      alert("Por favor selecciona un nodo destinatario");
      return;
    }

    const notificationData = {
      ...formData,
      clientId: selectedClientId,
      regions: [selectedClientId],
      sentAt: new Date().toISOString(),
    };

    addNotification(notificationData);

    // Resetear formulario
    setFormData({
      title: '',
      message: '',
      type: 'info',
      priority: 'medium',
      schedule: 'now',
      scheduledDate: '',
      expiresIn: '24h'
    });
    setSelectedClientId('');
    setShowForm(false);
  };

  const filteredNotifications = notifications.filter(n =>
    filterStatus === 'all' || n.status === filterStatus
  );

  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    scheduled: notifications.filter(n => n.status === 'scheduled').length,
    critical: notifications.filter(n => n.type === 'critical').length,
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 w-full max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 w-full">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-800">
              <span className="bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                Panel de Notificaciones
              </span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-green-700 mt-0.5 sm:mt-1 md:mt-2">
              Gestiona y envía mensajes a las regionales
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2.5 md:py-3 lg:py-4 bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded-lg sm:rounded-xl hover:from-green-800 hover:to-emerald-800 flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-md sm:shadow-lg shadow-green-300 font-medium text-xs sm:text-sm md:text-base lg:text-lg"
          >
            {showForm ? <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" /> : <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />}
            <span className="truncate">{showForm ? 'Cancelar' : 'Nueva notificación'}</span>
          </button>
        </div>

        {/* Stats Cards - Mejorados con colores verdes */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8 mb-4 sm:mb-6 md:mb-8 w-full">
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg sm:rounded-xl md:rounded-2xl shadow-md sm:shadow-lg md:shadow-xl p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 hover:shadow-xl transition-all text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg text-green-100 font-medium">Total</p>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg sm:rounded-xl md:rounded-2xl shadow-md sm:shadow-lg md:shadow-xl p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 hover:shadow-xl transition-all text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg text-green-100 font-medium">Enviadas</p>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white">{stats.sent}</p>
              </div>
              <div className="p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg sm:rounded-xl md:rounded-2xl shadow-md sm:shadow-lg md:shadow-xl p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 hover:shadow-xl transition-all text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg text-yellow-100 font-medium">Programadas</p>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white">{stats.scheduled}</p>
              </div>
              <div className="p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-rose-500 rounded-lg sm:rounded-xl md:rounded-2xl shadow-md sm:shadow-lg md:shadow-xl p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 hover:shadow-xl transition-all text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg text-red-100 font-medium">Críticas</p>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white">{stats.critical}</p>
              </div>
              <div className="p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros - Mejorados */}
        <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-md sm:shadow-lg md:shadow-xl p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 mb-4 sm:mb-6 md:mb-8 border border-green-200 w-full">
          <div className="flex flex-row flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 w-full">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 xl:py-4 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all flex-1 sm:flex-none min-w-[60px] sm:min-w-[80px] md:min-w-[90px] lg:min-w-[100px] xl:min-w-[120px] ${filterStatus === 'all'
                ? 'bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-md sm:shadow-lg shadow-green-300'
                : 'bg-green-50 text-green-800 hover:bg-green-100 border border-green-300'
                }`}
            >
              <span className="whitespace-nowrap">Todas</span>
              <span className={`ml-1 sm:ml-1.5 md:ml-2 px-1 sm:px-1.5 md:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] md:text-xs lg:text-sm ${filterStatus === 'all' ? 'bg-white/20 text-white' : 'bg-green-200 text-green-800'
                }`}>
                {stats.total}
              </span>
            </button>
            <button
              onClick={() => setFilterStatus('sent')}
              className={`px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 xl:py-4 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all flex-1 sm:flex-none min-w-[60px] sm:min-w-[80px] md:min-w-[90px] lg:min-w-[100px] xl:min-w-[120px] ${filterStatus === 'sent'
                ? 'bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-md sm:shadow-lg shadow-green-300'
                : 'bg-green-50 text-green-800 hover:bg-green-100 border border-green-300'
                }`}
            >
              <span className="whitespace-nowrap">Enviadas</span>
              <span className={`ml-1 sm:ml-1.5 md:ml-2 px-1 sm:px-1.5 md:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] md:text-xs lg:text-sm ${filterStatus === 'sent' ? 'bg-white/20 text-white' : 'bg-green-200 text-green-800'
                }`}>
                {stats.sent}
              </span>
            </button>
            <button
              onClick={() => setFilterStatus('scheduled')}
              className={`px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 xl:py-4 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all flex-1 sm:flex-none min-w-[60px] sm:min-w-[80px] md:min-w-[90px] lg:min-w-[100px] xl:min-w-[120px] ${filterStatus === 'scheduled'
                ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-md sm:shadow-lg shadow-yellow-300'
                : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border border-yellow-300'
                }`}
            >
              <span className="whitespace-nowrap">Programadas</span>
              <span className={`ml-1 sm:ml-1.5 md:ml-2 px-1 sm:px-1.5 md:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] md:text-xs lg:text-sm ${filterStatus === 'scheduled' ? 'bg-white/20 text-white' : 'bg-yellow-200 text-yellow-800'
                }`}>
                {stats.scheduled}
              </span>
            </button>
          </div>
        </div>

        {/* Formulario nueva notificación - Mejorado con colores verdes */}
        {showForm && (
          <div className="mb-4 sm:mb-6 md:mb-8 bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg sm:shadow-xl md:shadow-2xl p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 border-2 border-green-300 w-full">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold text-green-800 mb-3 sm:mb-4 md:mb-5 lg:mb-6 flex items-center gap-1.5 sm:gap-2">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-green-700" />
              Crear nueva notificación
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
              {/* Tipo y prioridad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                <div>
                  <label className="block text-[10px] sm:text-xs md:text-sm lg:text-base font-medium text-green-800 mb-0.5 sm:mb-1 md:mb-2">
                    Tipo de notificación
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-3 border border-green-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 text-green-900 text-xs sm:text-sm md:text-base lg:text-lg"
                  >
                    <option value="info">Información</option>
                    <option value="warning">Advertencia</option>
                    <option value="critical">Crítica</option>
                    <option value="success">Éxito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs md:text-sm lg:text-base font-medium text-green-800 mb-0.5 sm:mb-1 md:mb-2">
                    Prioridad
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-3 border border-green-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 text-green-900 text-xs sm:text-sm md:text-base lg:text-lg"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm lg:text-base font-medium text-green-800 mb-0.5 sm:mb-1 md:mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Mantenimiento programado en regional norte"
                  className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-3 border border-green-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 text-green-900 placeholder-green-500 text-xs sm:text-sm md:text-base lg:text-lg"
                  required
                />
              </div>

              {/* Mensaje */}
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm lg:text-base font-medium text-green-800 mb-0.5 sm:mb-1 md:mb-2">
                  Mensaje
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows="3"
                  placeholder="Escribe el contenido detallado de la notificación..."
                  className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-3 border border-green-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 text-green-900 placeholder-green-500 text-xs sm:text-sm md:text-base lg:text-lg"
                  required
                />
              </div>

              {/* Cliente Específico */}
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm lg:text-base font-medium text-green-800 mb-0.5 sm:mb-1 md:mb-2">
                  Nodo destinatario
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-3 border border-green-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 text-green-900 text-xs sm:text-sm md:text-base lg:text-lg"
                  required
                >
                  <option value="" disabled>Selecciona un nodo...</option>
                  {nodes.map(node => (
                    <option key={node.clientId} value={node.clientId}>
                      {node.name} ({node.ip})
                    </option>
                  ))}
                </select>
              </div>

              {/* Programación */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6">
                <div>
                  <label className="block text-[10px] sm:text-xs md:text-sm lg:text-base font-medium text-green-800 mb-0.5 sm:mb-1 md:mb-2">
                    Cuándo enviar
                  </label>
                  <select
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-3 border border-green-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 text-green-900 text-xs sm:text-sm md:text-base lg:text-lg"
                  >
                    <option value="now">Enviar ahora</option>
                    <option value="schedule">Programar</option>
                  </select>
                </div>

                {formData.schedule === 'schedule' && (
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] sm:text-xs md:text-sm lg:text-base font-medium text-green-800 mb-0.5 sm:mb-1 md:mb-2">
                      Fecha y hora
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-3 border border-green-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 text-green-900 text-xs sm:text-sm md:text-base lg:text-lg"
                      required
                    />
                  </div>
                )}

                <div className={formData.schedule === 'schedule' ? '' : 'sm:col-start-3'}>
                  <label className="block text-[10px] sm:text-xs md:text-sm lg:text-base font-medium text-green-800 mb-0.5 sm:mb-1 md:mb-2">
                    Expira después de
                  </label>
                  <select
                    value={formData.expiresIn}
                    onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                    className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-3 border border-green-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 text-green-900 text-xs sm:text-sm md:text-base lg:text-lg"
                  >
                    <option value="1h">1 hora</option>
                    <option value="6h">6 horas</option>
                    <option value="12h">12 horas</option>
                    <option value="24h">24 horas</option>
                    <option value="7d">7 días</option>
                    <option value="never">No expira</option>
                  </select>
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 md:pt-5 lg:pt-6 border-t border-green-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-full sm:w-auto px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-1.5 sm:py-2 md:py-2.5 lg:py-3 border border-green-300 rounded-lg sm:rounded-xl hover:bg-green-100 transition-colors font-medium text-green-800 text-xs sm:text-sm md:text-base lg:text-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-1.5 sm:py-2 md:py-2.5 lg:py-3 bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded-lg sm:rounded-xl hover:from-green-800 hover:to-emerald-800 flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-md sm:shadow-lg shadow-green-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs sm:text-sm md:text-base lg:text-lg"
                  disabled={!selectedClientId || !formData.title || !formData.message}
                >
                  <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                  {formData.schedule === 'now' ? 'Enviar ahora' : 'Programar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de notificaciones */}
        <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5 xl:space-y-6 w-full">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-md sm:shadow-lg md:shadow-xl p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16 text-center border border-green-200 w-full">
              <Bell className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 text-green-400 mx-auto mb-2 sm:mb-3 md:mb-4" />
              <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-medium text-green-800">No hay notificaciones</h3>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-green-600 mt-1 sm:mt-2">Crea tu primera notificación usando el botón "Nueva notificación"</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-md sm:shadow-lg md:shadow-xl hover:shadow-lg transition-all border border-green-200 overflow-hidden w-full"
              >
                {/* Cabecera */}
                <div
                  className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 cursor-pointer hover:bg-green-50"
                  onClick={() => setExpandedId(expandedId === notification.id ? null : notification.id)}
                >
                  <div className="flex flex-row items-start gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6">
                    <div className={`p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 rounded-lg sm:rounded-xl flex-shrink-0 ${getTypeBg(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
                        <div className="flex-1 min-w-0 w-full">
                          <h3 className="font-semibold text-green-900 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl mb-0.5 break-words">
                            {notification.title}
                          </h3>
                          <p className="text-green-700 line-clamp-2 text-[10px] sm:text-xs md:text-sm lg:text-base break-words">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex flex-row flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 flex-shrink-0">
                          <span className={`px-1.5 sm:px-2 md:px-2.5 lg:px-3 xl:px-4 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] md:text-xs lg:text-sm font-medium whitespace-nowrap ${getPriorityColor(notification.priority)}`}>
                            {notification.priority === 'urgent' ? 'Urgente' :
                              notification.priority === 'high' ? 'Alta' :
                                notification.priority === 'medium' ? 'Media' : 'Baja'}
                          </span>
                          <span className={`px-1.5 sm:px-2 md:px-2.5 lg:px-3 xl:px-4 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] md:text-xs lg:text-sm font-medium whitespace-nowrap ${notification.status === 'sent'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                            }`}>
                            {notification.status === 'sent' ? 'Enviada' : 'Programada'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 xl:gap-4 mt-1.5 sm:mt-2 md:mt-3">
                        <div className="flex items-center gap-0.5 sm:gap-1 text-green-700 bg-green-50 px-1.5 sm:px-2 md:px-2.5 lg:px-3 xl:px-4 py-0.5 sm:py-1 rounded-full border border-green-200">
                          <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
                          <span className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm truncate max-w-[60px] sm:max-w-[80px] md:max-w-[100px] lg:max-w-[120px] xl:max-w-[150px]">
                            {notification.regions.join(', ')}
                          </span>
                        </div>

                        {notification.status === 'sent' ? (
                          <>
                            <div className="flex items-center gap-0.5 sm:gap-1 text-green-700 bg-green-50 px-1.5 sm:px-2 md:px-2.5 lg:px-3 xl:px-4 py-0.5 sm:py-1 rounded-full border border-green-200">
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
                              <span className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm whitespace-nowrap">
                                {formatDate(notification.sentAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 sm:gap-1 text-green-700 bg-green-50 px-1.5 sm:px-2 md:px-2.5 lg:px-3 xl:px-4 py-0.5 sm:py-1 rounded-full border border-green-200">
                              <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
                              <span className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm whitespace-nowrap">
                                {notification.readCount || 0}/{notification.totalRecipients || 0}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-0.5 sm:gap-1 text-yellow-700 bg-yellow-50 px-1.5 sm:px-2 md:px-2.5 lg:px-3 xl:px-4 py-0.5 sm:py-1 rounded-full border border-yellow-200">
                            <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
                            <span className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm truncate max-w-[80px] sm:max-w-[100px] md:max-w-[120px] lg:max-w-[150px]">
                              {formatDate(notification.scheduledFor)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-0.5 sm:gap-1 text-green-700 bg-green-50 px-1.5 sm:px-2 md:px-2.5 lg:px-3 xl:px-4 py-0.5 sm:py-1 rounded-full border border-green-200">
                          <span className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm truncate max-w-[40px] sm:max-w-[50px] md:max-w-[60px] lg:max-w-[70px] xl:max-w-[80px]">
                            {notification.sentBy}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center flex-shrink-0 self-center">
                      {expandedId === notification.id ?
                        <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-green-500" /> :
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-green-500" />
                      }
                    </div>
                  </div>
                </div>

                {/* Detalles expandidos */}
                {expandedId === notification.id && (
                  <div className="px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 pb-3 sm:pb-4 md:pb-5 lg:pb-6 xl:pb-8 pt-1.5 sm:pt-2 md:pt-2.5 border-t border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-6 mb-2 sm:mb-3 md:mb-4">
                      <div className="bg-white p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 rounded-lg sm:rounded-xl border border-green-200">
                        <div className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm text-green-600 mb-0.5">Tipo</div>
                        <div className="font-medium capitalize text-[10px] sm:text-xs md:text-sm lg:text-base text-green-900">{notification.type}</div>
                      </div>
                      <div className="bg-white p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 rounded-lg sm:rounded-xl border border-green-200">
                        <div className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm text-green-600 mb-0.5">Prioridad</div>
                        <div className="font-medium capitalize text-[10px] sm:text-xs md:text-sm lg:text-base text-green-900">{notification.priority}</div>
                      </div>
                      <div className="bg-white p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 rounded-lg sm:rounded-xl border border-green-200">
                        <div className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm text-green-600 mb-0.5">Expira</div>
                        <div className="font-medium text-[10px] sm:text-xs md:text-sm lg:text-base text-green-900">{notification.expiresIn || '24h'}</div>
                      </div>
                      <div className="bg-white p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 rounded-lg sm:rounded-xl border border-green-200">
                        <div className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm text-green-600 mb-0.5">Regiones</div>
                        <div className="font-medium text-[10px] sm:text-xs md:text-sm lg:text-base text-green-900">{notification.regions.length}</div>
                      </div>
                    </div>

                    {/* Mensaje completo */}
                    <div className="bg-white p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-6 rounded-lg sm:rounded-xl border border-green-200 mb-2 sm:mb-3 md:mb-4">
                      <h4 className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-green-700 mb-1 sm:mb-1.5 md:mb-2">Mensaje completo:</h4>
                      <p className="text-green-900 leading-relaxed text-[10px] sm:text-xs md:text-sm lg:text-base break-words">{notification.message}</p>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 justify-end">
                      {notification.status === 'sent' ? (
                        <>
                          <button className="px-2 sm:px-2.5 md:px-3 lg:px-4 xl:px-5 py-1 sm:py-1.5 text-[8px] sm:text-[10px] md:text-xs lg:text-sm bg-white border border-green-300 rounded-lg sm:rounded-xl hover:bg-green-100 flex items-center gap-0.5 sm:gap-1 transition-colors text-green-800">
                            <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                            <span className="hidden sm:inline">Ver detalles</span>
                            <span className="sm:hidden">Ver</span>
                          </button>
                          <button className="px-2 sm:px-2.5 md:px-3 lg:px-4 xl:px-5 py-1 sm:py-1.5 text-[8px] sm:text-[10px] md:text-xs lg:text-sm bg-white border border-green-300 rounded-lg sm:rounded-xl hover:bg-green-100 flex items-center gap-0.5 sm:gap-1 transition-colors text-green-800">
                            <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                            <span className="hidden sm:inline">Respuestas</span>
                            <span className="sm:hidden">Resp.</span>
                          </button>
                          <button className="px-2 sm:px-2.5 md:px-3 lg:px-4 xl:px-5 py-1 sm:py-1.5 text-[8px] sm:text-[10px] md:text-xs lg:text-sm bg-white border border-green-300 rounded-lg sm:rounded-xl hover:bg-green-100 flex items-center gap-0.5 sm:gap-1 transition-colors text-green-800">
                            <Download className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                            <span className="hidden sm:inline">Exportar</span>
                            <span className="sm:hidden">Exp.</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="px-2 sm:px-2.5 md:px-3 lg:px-4 xl:px-5 py-1 sm:py-1.5 text-[8px] sm:text-[10px] md:text-xs lg:text-sm bg-white border border-green-300 rounded-lg sm:rounded-xl hover:bg-green-100 flex items-center gap-0.5 sm:gap-1 transition-colors text-green-800">
                            <Edit className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                            <span className="hidden sm:inline">Editar</span>
                            <span className="sm:hidden">Edit</span>
                          </button>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="px-2 sm:px-2.5 md:px-3 lg:px-4 xl:px-5 py-1 sm:py-1.5 text-[8px] sm:text-[10px] md:text-xs lg:text-sm bg-red-50 text-red-800 border border-red-300 rounded-lg sm:rounded-xl hover:bg-red-100 flex items-center gap-0.5 sm:gap-1 transition-colors"
                          >
                            <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                            <span className="hidden sm:inline">Cancelar</span>
                            <span className="sm:hidden">Elim.</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;