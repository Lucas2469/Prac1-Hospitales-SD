// @ts-nocheck
import { LayoutGrid, Globe, Bell, HardDrive, Menu, X, LogOut, Settings } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: 'nodes', name: 'Nodos', icon: LayoutGrid, color: 'green' },
    { id: 'stats', name: 'Estadísticas', icon: Globe, color: 'green' },
    { id: 'notifications', name: 'Notificaciones', icon: Bell, color: 'green' },
  ];

  const getColorClasses = (color, isActive) => {
    const colors = {
      green: {
        active: 'bg-green-600 text-white border-green-400',
        inactive: 'text-green-100 hover:bg-green-700 hover:text-white'
      }
    };
    return isActive ? colors[color].active : colors[color].inactive;
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar con fondo verdoso */}
      <div className={`
        fixed lg:static inset-y-0 left-0 transform 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 transition-transform duration-300 ease-in-out
        w-64 bg-gradient-to-b from-green-800 to-green-900 shadow-xl z-30 flex flex-col
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-green-700">
          <div className="flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-green-300" />
            <span className="font-bold text-lg text-white">CNS Admin</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 hover:bg-green-700 rounded text-green-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menú */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                      border-l-4 ${isActive ? 'border-l-4 border-green-300' : 'border-l-4 border-transparent'}
                      ${getColorClasses(item.color, isActive)}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                    {item.id === 'notifications' && (
                      <span className="ml-auto bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        3
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-green-700">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-green-100 hover:bg-green-700 hover:text-white rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Configuración</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors mt-1">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>

        {/* Versión del sistema */}
        <div className="px-4 pb-4 text-xs text-green-400 text-center">
          CNS Dashboard v1.0.0
        </div>
      </div>
    </>
  );
};

export default Sidebar;