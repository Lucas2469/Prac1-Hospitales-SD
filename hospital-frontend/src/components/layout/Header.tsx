// @ts-nocheck
import { Menu, Bell, User, Search } from 'lucide-react';

const Header = ({ setIsOpen }: { setIsOpen: any }) => {
  return (
    <header className="bg-green-800 border-b border-green-700 h-16 flex items-center px-4 lg:px-6 shadow-md">
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 hover:bg-green-700 rounded-lg mr-4 text-green-100 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 flex items-center justify-between">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar nodos, regiones o discos..."
              className="w-full pl-10 pr-4 py-2 border border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-900 placeholder-green-400 text-green-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 hover:bg-green-700 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-green-100" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          </button>
          
          <div className="flex items-center gap-3 ml-4">
            <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center shadow-md border-2 border-green-500">
              <User className="w-4 h-4 text-green-100" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-green-100">Admin CNS</p>
              <p className="text-xs text-green-400">Administrador</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;