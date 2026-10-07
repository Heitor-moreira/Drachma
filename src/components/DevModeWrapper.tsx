import React, { useState, useRef, useEffect } from 'react';
import { Smartphone } from 'lucide-react';

const PRESETS = [
  { name: 'iPhone 16e', width: 390, height: 844 },
  { name: 'Galaxy A43', width: 412, height: 915 },
  { name: 'iPad 11"', width: 820, height: 1180 },
  { name: 'MacBook 13"', width: 1470, height: 956 },
  { name: 'Lenovo 16"', width: 1536, height: 960 },
];

export const DevModeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [size, setSize] = useState({ width: 390, height: 844 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isActive) {
      document.body.classList.add('dev-mode-active');
    } else {
      document.body.classList.remove('dev-mode-active');
    }
  }, [isActive]);

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

  if (!import.meta.env.DEV) {
    return <>{children}</>;
  }

  if (!isActive) {
    return (
      <>
        <button
          onClick={() => setIsActive(true)}
          className="fixed top-4 right-4 z-[9999] bg-slate-800 text-white px-3 py-1 rounded text-xs font-bold opacity-50 hover:opacity-100 transition-opacity"
        >
          Dev Mode
        </button>
        {children}
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[9999] overflow-auto font-sans custom-scrollbar">
      <div className="min-h-full flex flex-col items-center justify-start py-24 px-4 sm:px-8">
        
        {/* Toolbar - Floating Pill (Hallmark style) */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 bg-[#141413] border border-[#333] rounded-full shadow-2xl z-[10000] backdrop-blur-md">
          <button
            onClick={() => setIsActive(false)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#262626] text-white hover:bg-red-500 hover:text-white transition-colors group"
            title="Sair do Dev Mode"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          <div className="w-px h-5 bg-[#333] mx-1" />

          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setIsFreeMode(false);
                setSize({ width: preset.width, height: preset.height });
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 ${
                !isFreeMode && size.width === preset.width && size.height === preset.height
                  ? 'bg-white text-[#141413] shadow-sm'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#262626]'
              }`}
            >
              {preset.name}
            </button>
          ))}
          
          <div className="w-px h-5 bg-[#333] mx-1" />

          <button
            onClick={() => setIsFreeMode(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 ${
              isFreeMode ? 'bg-white text-[#141413] shadow-sm' : 'text-[#A1A1AA] hover:text-white hover:bg-[#262626]'
            }`}
          >
            Livre
          </button>

          <button
            onClick={() => setSize(prev => ({ width: prev.height, height: prev.width }))}
            className="flex items-center justify-center px-3 py-1.5 rounded-full text-[#A1A1AA] hover:text-white hover:bg-[#262626] transition-colors ml-1"
            title="Girar tela (Paisagem / Retrato)"
          >
            <Smartphone size={14} strokeWidth={2.5} className={`transition-transform duration-300 ${size.width > size.height ? '-rotate-90' : 'rotate-0'}`} />
          </button>

          <div className="pl-3 pr-4 text-[11px] font-mono tracking-wider text-[#71717A] min-w-[90px] text-right">
            {Math.round(size.width)} × {Math.round(size.height)}
          </div>
        </div>

        {/* Device Container */}
        <div 
          ref={containerRef}
          className="relative bg-app-background dark:bg-dark-app-background shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_24px_48px_rgba(0,0,0,0.5)] rounded-2xl flex transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
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
              {/* Right edge */}
              <div
                onMouseDown={handleResizeRight}
                className="absolute top-0 -right-2 w-4 h-full cursor-e-resize z-40"
              />
              {/* Bottom edge */}
              <div
                onMouseDown={handleResizeBottom}
                className="absolute -bottom-2 left-0 w-full h-4 cursor-s-resize z-40"
              />
              {/* Corner */}
              <div
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
  );
};
