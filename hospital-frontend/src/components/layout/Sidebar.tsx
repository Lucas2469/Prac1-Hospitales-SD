// @ts-nocheck
import React from 'react';
import { LayoutGrid, Globe, Bell, HardDrive, X, LogOut, Settings, Wifi } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { notifications } = useApp();
  const unread = notifications.filter(n => n.status === 'sent').length;

  const menuItems = [
    { id: 'nodes', name: 'Nodos', icon: LayoutGrid, badge: null },
    { id: 'stats', name: 'Estadísticas', icon: Globe, badge: null },
    { id: 'notifications', name: 'Notificaciones', icon: Bell, badge: unread > 0 ? unread : null },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300 ease-in-out
        w-60 z-30 flex flex-col
        bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800
        border-r border-white/5 shadow-2xl
      `}>

        {/* ── Logo ── */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-900/50">
              <HardDrive className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-tight">CNS Admin</div>
              <div className="text-gray-500 text-xs">Sistema de Monitoreo</div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Status pill ── */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Sistema operativo</span>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <div className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
            Menú principal
          </div>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
                    className={`
                      group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200 relative overflow-hidden font-medium text-sm
                      ${isActive
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-900/40'
                        : 'text-gray-400 hover:text-white hover:bg-white/8'
                      }
                    `}
                  >
                    {/* Active glow effect */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent pointer-events-none" />
                    )}

                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive
                        ? 'bg-white/20'
                        : 'bg-white/5 group-hover:bg-white/10'
                      }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <span className="flex-1 text-left truncate">{item.name}</span>

                    {item.badge != null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ${isActive
                          ? 'bg-white/30 text-white'
                          : 'bg-green-500/20 text-green-400'
                        }`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Footer ── */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-white/8 rounded-xl transition-all group text-sm font-medium">
            <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-all">
              <Settings className="w-4 h-4" />
            </div>
            Configuración
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group text-sm font-medium">
            <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-red-500/10 flex items-center justify-center transition-all">
              <LogOut className="w-4 h-4" />
            </div>
            Cerrar sesión
          </button>
        </div>

        {/* Version */}
        <div className="px-5 pb-3 text-[10px] text-gray-700 flex items-center gap-2">
          <Wifi className="w-3 h-3" />
          CNS Dashboard v1.0.0
        </div>
      </div>
    </>
  );
};

export default Sidebar;