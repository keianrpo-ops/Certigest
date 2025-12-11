import React, { useState, useEffect } from 'react';
import { ViewState, Country, LogEntry } from './types';
import Login from './components/Login';
import CCCForm from './components/CCCForm';
import Button from './components/Button';
import { 
  LogOut, 
  MapPin, 
  FileText, 
  Activity, 
  ChevronLeft, 
  Globe,
  Terminal
} from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentCountry, setCurrentCountry] = useState<Country>(null);
  const [currentView, setCurrentView] = useState<ViewState>('START');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // --- Actions ---
  const addLog = (message: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    addLog('Usuario autenticado correctamente.');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentCountry(null);
    setCurrentView('START');
    setLogs([]);
  };

  const handleCountrySelect = (country: Country) => {
    setCurrentCountry(country);
    setCurrentView('START');
    addLog(`País seleccionado: ${country}`);
  };

  const handleViewChange = (view: ViewState) => {
    setCurrentView(view);
    addLog(`Navegación: ${view}`);
  };

  // --- Sub-components for Conditional Rendering ---

  // 1. Not Logged In
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // 2. Main Layout
  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Topbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center text-black font-bold text-xs shadow-lg shadow-cyan-900/50">
            CG
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-widest text-sm text-cyan-400 uppercase">CertiGest</span>
            <span className="text-[10px] text-slate-500 font-medium">Enterprise Edition 2025</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs text-slate-400">Sesión iniciada como</span>
            <span className="text-sm font-semibold text-slate-200">Administrador</span>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="!p-2 text-slate-400 hover:text-red-400">
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-slate-800/50">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Navegación</h3>
            
            {/* Country Selector Mode */}
            {!currentCountry ? (
              <div className="space-y-2">
                <Button variant="menu" onClick={() => handleCountrySelect('COLOMBIA')}>
                  <Globe size={16} /> Colombia
                </Button>
                <Button variant="menu" onClick={() => handleCountrySelect('PERU')}>
                  <Globe size={16} /> Perú
                </Button>
                <Button variant="menu" onClick={() => handleCountrySelect('ECUADOR')}>
                  <Globe size={16} /> Ecuador
                </Button>
              </div>
            ) : (
              /* Specific Country Menu */
              <div className="space-y-2 animate-fadeIn">
                 <Button variant="ghost" onClick={() => setCurrentCountry(null)} className="mb-4 text-xs !justify-start pl-2">
                  <ChevronLeft size={14} /> Volver a Países
                </Button>
                
                <div className="px-2 mb-2 text-xs font-semibold text-cyan-500 uppercase">
                  {currentCountry}
                </div>

                {currentCountry === 'COLOMBIA' ? (
                  <>
                    <Button 
                      variant="menu" 
                      active={currentView === 'CCC_FORM'}
                      onClick={() => handleViewChange('CCC_FORM')}
                    >
                      <FileText size={16} /> Cámara Comercio
                    </Button>
                    <Button 
                      variant="menu" 
                      active={currentView === 'SANIDAD_FORM'}
                      onClick={() => handleViewChange('SANIDAD_FORM')}
                    >
                      <Activity size={16} /> Sanidad
                    </Button>
                  </>
                ) : (
                  <div className="p-3 rounded bg-slate-900 border border-slate-800 text-xs text-slate-500 italic">
                    Opciones no disponibles para este país aún.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Logs Area (Sidebar bottom) */}
          <div className="mt-auto p-4 bg-slate-900/30 border-t border-slate-800 h-64 flex flex-col">
             <div className="flex items-center gap-2 mb-2 text-slate-500">
                <Terminal size={14} />
                <span className="text-[10px] uppercase font-bold tracking-wider">System Log</span>
             </div>
             <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {logs.length === 0 && <span className="text-xs text-slate-600 italic">Sistema listo...</span>}
                {logs.map(log => (
                  <div key={log.id} className="text-[10px] text-slate-400 font-mono leading-tight border-l-2 border-slate-700 pl-2 py-0.5">
                    <span className="text-slate-600 block mb-0.5">{log.timestamp}</span>
                    {log.message}
                  </div>
                ))}
             </div>
          </div>
        </aside>

        {/* Mobile Nav (Top) - Simplified for brevity */}
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {/* Background Decorative Blobs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-10 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto">
            
            {/* View Switching */}
            {currentView === 'START' && (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20 backdrop-blur-sm p-8">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 text-slate-600">
                  <MapPin size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-200 mb-2">Bienvenido a CertiGest</h2>
                <p className="text-slate-400 max-w-md">
                  {!currentCountry 
                    ? "Selecciona un país en el menú lateral para ver los certificados disponibles."
                    : `Has seleccionado ${currentCountry}. Elige un tipo de certificado en el menú para comenzar.`
                  }
                </p>
                {currentCountry && (
                  <div className="mt-6 flex gap-3">
                     <Button variant="primary" onClick={() => handleViewChange('CCC_FORM')}>
                        Nuevo Certificado
                     </Button>
                  </div>
                )}
              </div>
            )}

            {currentView === 'CCC_FORM' && (
              <CCCForm 
                onCancel={() => handleViewChange('START')} 
                onLog={addLog}
              />
            )}

            {currentView === 'SANIDAD_FORM' && (
              <div className="flex flex-col items-center justify-center h-96 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <Activity size={48} className="text-slate-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-300">Módulo de Sanidad</h3>
                <p className="text-slate-500 mt-2">Próximamente disponible</p>
                <Button variant="secondary" className="mt-6" onClick={() => handleViewChange('START')}>Volver</Button>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
