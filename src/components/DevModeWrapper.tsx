import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Smartphone, X, RotateCw, Maximize2, Sliders } from 'lucide-react';

export interface DevPreset {
  name: string;
  width: number;
  height: number;
}

export const PRESETS: DevPreset[] = [
  { name: 'iPhone 16e', width: 390, height: 844 },
  { name: 'Galaxy A43', width: 412, height: 915 },
  { name: 'iPad 11"', width: 820, height: 1180 },
  { name: 'MacBook 13"', width: 1470, height: 956 },
  { name: 'Lenovo 16"', width: 1536, height: 960 },
];

export interface DevModeContextType {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  size: { width: number; height: number };
  setSize: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>;
  isFreeMode: boolean;
  setIsFreeMode: (free: boolean) => void;
  presets: typeof PRESETS;
  toggleOrientation: () => void;
  activePresetName: string | null;
  selectPreset: (name: string) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  triggerWelcomePreview: () => void;
}

export const DevModeContext = React.createContext<DevModeContextType | null>(null);
export const useDevMode = () => React.useContext(DevModeContext);

export const DevModeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [size, setSize] = useState({ width: 390, height: 844 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isActive) {
      document.body.classList.add('dev-mode-active');
    } else {
      document.body.classList.remove('dev-mode-active');
    }
    return () => {
      document.body.classList.remove('dev-mode-active');
    };
  }, [isActive]);

  const toggleOrientation = () => {
    setSize(prev => ({ width: prev.height, height: prev.width }));
  };

  const activePresetName = useMemo(() => {
    if (isFreeMode) return 'Modo Livre';
    const found = PRESETS.find(
      p => (p.width === size.width && p.height === size.height) ||
           (p.width === size.height && p.height === size.width)
    );
    return found ? found.name : null;
  }, [isFreeMode, size]);

  const selectPreset = (name: string) => {
    setIsActive(true);
    if (name.toLowerCase() === 'livre' || name.toLowerCase() === 'modo livre') {
      setIsFreeMode(true);
      return;
    }
    const found = PRESETS.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (found) {
      setIsFreeMode(false);
      setSize({ width: found.width, height: found.height });
    }
  };

  const deactivateDevMode = () => {
    setIsActive(false);
    setIsFreeMode(false);
  };

  const handleResizeCorner = (e: React.MouseEvent) => {
    if (!isFreeMode || !isActive) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      setSize({
        width: Math.max(320, startWidth + (moveEvent.clientX - startX)),
        height: Math.max(480, startHeight + (moveEvent.clientY - startY)),
      });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleResizeRight = (e: React.MouseEvent) => {
    if (!isFreeMode || !isActive) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = size.width;
    const onMouseMove = (moveEvent: MouseEvent) => setSize(prev => ({ ...prev, width: Math.max(320, startWidth + (moveEvent.clientX - startX)) }));
    const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleResizeBottom = (e: React.MouseEvent) => {
    if (!isFreeMode || !isActive) return;
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = size.height;
    const onMouseMove = (moveEvent: MouseEvent) => setSize(prev => ({ ...prev, height: Math.max(480, startHeight + (moveEvent.clientY - startY)) }));
    const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const triggerWelcomePreview = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('drachma:open-welcome-modal'));
    }
  };

  const contextValue: DevModeContextType = {
    isActive,
    setIsActive,
    size,
    setSize,
    isFreeMode,
    setIsFreeMode,
    presets: PRESETS,
    toggleOrientation,
    activePresetName,
    selectPreset,
    isMenuOpen,
    setIsMenuOpen,
    triggerWelcomePreview,
  };

  if (!import.meta.env.DEV) {
    return <DevModeContext.Provider value={contextValue}>{children}</DevModeContext.Provider>;
  }

  return (
    <DevModeContext.Provider value={contextValue}>
      {isActive ? (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[9990] overflow-auto font-sans custom-scrollbar">
          <div className="min-h-full flex flex-col items-center justify-center py-8 px-4 sm:px-8">
            {/* Device Container Simulado */}
            <div
              ref={containerRef}
              data-testid="devmode-container"
              className="relative my-auto bg-app-background dark:bg-dark-app-background shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_24px_48px_rgba(0,0,0,0.5)] rounded-2xl flex transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                width: `${size.width}px`,
                height: `${size.height}px`,
                transition: isFreeMode ? 'none' : 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                containerType: 'inline-size',
                containerName: 'devmode',
              }}
            >
              <div className="w-full h-full overflow-hidden rounded-2xl custom-dev-mode-app-container">
                {children}
              </div>

              {isFreeMode && (
                <>
                  <div
                    data-testid="resize-right"
                    onMouseDown={handleResizeRight}
                    className="absolute top-0 -right-2 w-4 h-full cursor-e-resize z-40"
                  />
                  <div
                    data-testid="resize-bottom"
                    onMouseDown={handleResizeBottom}
                    className="absolute -bottom-2 left-0 w-full h-4 cursor-s-resize z-40"
                  />
                  <div
                    data-testid="resize-corner"
                    onMouseDown={handleResizeCorner}
                    className="absolute -bottom-2 -right-2 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 z-50 group"
                  >
                    <div className="w-3 h-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        children
      )}

      {/* Botão Flutuante Elegante no canto inferior direito */}
      <div className="fixed bottom-4 right-4 z-[9999]">
        <button
          type="button"
          onClick={() => setIsMenuOpen(prev => !prev)}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-[#0A192F] hover:bg-[#031630] text-slate-100 hover:text-white rounded-full border border-[#C8963E]/50 shadow-xl shadow-black/40 hover:border-[#D4A347] hover:scale-105 active:scale-95 transition-all duration-200 group"
          title="Alternar Proporções de Tela (Dev Mode)"
          aria-label="Abrir menu de proporções de tela do Dev Mode"
        >
          <div className="w-6 h-6 rounded-full bg-[#C8963E]/20 flex items-center justify-center text-[#D4A347] group-hover:scale-110 transition-transform">
            <Smartphone size={14} />
          </div>
          <span className="text-xs font-bold tracking-wide">Dev Mode</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#C8963E]/20 text-[#D4A347] border border-[#C8963E]/40 uppercase">
            {isActive ? (activePresetName || `${Math.round(size.width)}×${Math.round(size.height)}`) : 'Tela Cheia'}
          </span>
        </button>
      </div>

      {/* Menu / Drawer Elegante Flutuante */}
      {isMenuOpen && (
        <div
          data-testid="devmode-menu"
          className="fixed bottom-16 right-4 sm:right-6 w-80 max-w-[92vw] bg-[#071324]/95 backdrop-blur-xl border border-[#C8963E]/40 rounded-2xl shadow-2xl p-4 z-[10000] text-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#C8963E]/20 text-[#D4A347] flex items-center justify-center">
                <Smartphone size={14} />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Proporções de Tela
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="Fechar menu de proporções"
            >
              <X size={16} />
            </button>
          </div>

          {/* Dimensões atuais e botão de girar orientação */}
          <div className="flex items-center justify-between px-3 py-2 mb-3 bg-[#031630] border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dimensões</span>
              <span className="text-xs font-mono font-semibold text-[#D4A347]">
                {Math.round(size.width)} × {Math.round(size.height)} px
              </span>
            </div>
            <button
              type="button"
              onClick={toggleOrientation}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
              title="Girar tela (Paisagem / Retrato)"
              aria-label="Girar orientação"
            >
              <RotateCw size={12} className={size.width > size.height ? 'rotate-90 text-[#D4A347]' : ''} />
              <span>{size.width > size.height ? 'Paisagem' : 'Retrato'}</span>
            </button>
          </div>

          {/* Botão de Tela Cheia / Desativar */}
          <button
            type="button"
            onClick={deactivateDevMode}
            className={`w-full mb-3 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all duration-150 ${
              !isActive
                ? 'bg-[#C8963E]/20 border-[#D4A347] text-white shadow-sm'
                : 'bg-slate-900/60 hover:bg-slate-800/70 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Maximize2 size={14} className={!isActive ? 'text-[#D4A347]' : 'text-slate-400'} />
              <span>Tela Cheia (100%) / Desativar</span>
            </div>
            {!isActive && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#D4A347] text-[#0A192F]">
                Ativo
              </span>
            )}
          </button>

          {/* Botão de teste rápido: Testar Boas-vindas (Senha Google) */}
          <button
            type="button"
            onClick={() => {
              triggerWelcomePreview();
              setIsMenuOpen(false);
            }}
            className="w-full mb-3 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border bg-slate-900/60 hover:bg-slate-800/70 border-slate-800 hover:border-[#C8963E]/60 text-slate-300 hover:text-white transition-all duration-150 group"
            aria-label="Testar Boas-vindas (Senha Google)"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">👁️</span>
              <span>Testar Boas-vindas (Senha Google)</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#C8963E]/20 text-[#D4A347] border border-[#C8963E]/40 group-hover:bg-[#C8963E]/30 transition-colors">
              Modal
            </span>
          </button>

          {/* Lista de Presets */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-0.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">
              Dispositivos
            </div>
            {PRESETS.map((preset) => {
              const isSelected = isActive && !isFreeMode && (
                (size.width === preset.width && size.height === preset.height) ||
                (size.width === preset.height && size.height === preset.width)
              );
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => selectPreset(preset.name)}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between border transition-all duration-150 ${
                    isSelected
                      ? 'bg-[#C8963E]/20 border-[#D4A347] text-white shadow-sm'
                      : 'bg-slate-900/60 hover:bg-slate-800/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Smartphone size={13} className={isSelected ? 'text-[#D4A347]' : 'text-slate-400'} />
                    <span className="font-semibold">{preset.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {preset.width} × {preset.height}
                  </span>
                </button>
              );
            })}

            {/* Modo Livre */}
            <button
              type="button"
              onClick={() => selectPreset('livre')}
              className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between border transition-all duration-150 ${
                isActive && isFreeMode
                  ? 'bg-[#C8963E]/20 border-[#D4A347] text-white shadow-sm'
                  : 'bg-slate-900/60 hover:bg-slate-800/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders size={13} className={isActive && isFreeMode ? 'text-[#D4A347]' : 'text-slate-400'} />
                <span className="font-semibold">Modo Livre</span>
              </div>
              <span className="text-[10px] text-slate-400">
                Redimensionável
              </span>
            </button>
          </div>
        </div>
      )}
    </DevModeContext.Provider>
  );
};
