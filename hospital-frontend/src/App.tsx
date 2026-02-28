import React, { useState } from 'react';
import { AppProvider } from './context/AppContext'; // Ajusta la ruta según tu estructura
import Sidebar from './components/layout/Sidebar'; // Ajusta las rutas según tu estructura
import Header from './components/layout/Header';
import NodeGrid from './components/dashboard/NodeGrid';
import GlobalStats from './components/dashboard/GlobalStats';
import NotificationPanel from './components/dashboard/NotificationPanel';
import DiskDetail from './components/dashboard/DiskDetail';


function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('nodes');

  const renderContent = () => {
    switch(activeTab) {
      case 'nodes':
        return <NodeGrid setActiveTab={setActiveTab} />;
      case 'stats':
        return <GlobalStats />;
      case 'notifications':
        return <NotificationPanel />;
      case 'disks':
        return <DiskDetail setActiveTab={setActiveTab} />;
      default:
        return <NodeGrid setActiveTab={setActiveTab} />;
    }
  };  // <-- Esta llave debe estar aquí

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
        
        <div className="flex-1 flex flex-col">
          <Header setIsOpen={setSidebarOpen} />
          <main className="flex-1 overflow-auto w-full">
            {renderContent()}
          </main>
        </div>
      </div>
    </AppProvider>
  );
}

export default App;