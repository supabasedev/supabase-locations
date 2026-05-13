import React from 'react';
import { 
  ArrowLeft, 
  Grid, 
  ZoomIn, 
  ZoomOut, 
  Save, 
  ChevronRight,
  Maximize,
  Map
} from 'lucide-react';
import { ViewMode } from '../../types';

interface ToolbarProps {
  layoutName: string;
  viewMode: ViewMode;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  showRulers: boolean;
  setShowRulers: (show: boolean) => void;
  selectedNodeId: string | null;
  isFrontDisabled: boolean;
  onBack: () => void;
  setViewMode: (mode: ViewMode) => void;
  onFitScreen: () => void;
}

export default function EditorToolbar({
  layoutName,
  viewMode,
  zoomLevel,
  setZoomLevel,
  showGrid,
  setShowGrid,
  snapToGrid,
  setSnapToGrid,
  gridSize,
  setGridSize,
  showRulers,
  setShowRulers,
  selectedNodeId,
  isFrontDisabled,
  onBack,
  setViewMode,
  onFitScreen
}: ToolbarProps) {
  return (
    <div className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col border-l border-slate-700 pl-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
             <span>Blueprint</span>
             <ChevronRight className="w-2.5 h-2.5" />
             <span className="text-sky-500">Workspace</span>
          </div>
          <h2 className="text-xs font-bold text-white uppercase tracking-tight">{layoutName}</h2>
        </div>

        <div className="h-6 w-px bg-slate-700 mx-2"></div>

        {/* View Switcher */}
        <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800">
           <ViewModeBtn 
             active={viewMode === ViewMode.TOP_DOWN} 
             onClick={() => setViewMode(ViewMode.TOP_DOWN)}
             label="Top"
           />
           <ViewModeBtn 
             active={viewMode === ViewMode.FRONT} 
             onClick={() => !isFrontDisabled && setViewMode(ViewMode.FRONT)}
             disabled={isFrontDisabled}
             label="Front"
           />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1">
           <button 
             onClick={onFitScreen}
             className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
             title="Fit to Screen"
           >
              <Maximize className="w-3.5 h-3.5" />
           </button>
           <div className="w-px h-4 bg-slate-700 mx-1"></div>
           <div className="flex items-center gap-1">
             <button onClick={() => setZoomLevel(Math.max(0.1, zoomLevel - 0.1))} className="p-1.5 text-slate-500 hover:text-white"><ZoomOut className="w-3.5 h-3.5" /></button>
             <span className="text-[10px] font-mono font-bold text-slate-400 w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
             <button onClick={() => setZoomLevel(Math.min(5, zoomLevel + 0.1))} className="p-1.5 text-slate-500 hover:text-white"><ZoomIn className="w-3.5 h-3.5" /></button>
           </div>
        </div>

        <div className="flex items-center gap-1 border-l border-slate-700 pl-3">
          {selectedNodeId && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-sky-500/10 border border-sky-500/20 rounded-lg mr-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></div>
              <span className="text-[10px] font-black text-sky-400/80 uppercase">Selection</span>
            </div>
          )}
          <ToolbarToggle 
            icon={<Grid className="w-3.5 h-3.5" />} 
            active={showGrid} 
            onClick={() => setShowGrid(!showGrid)} 
            title="Toggle Grid"
          />
          <ToolbarToggle 
            icon={<Map className="w-3.5 h-3.5" />} 
            active={showRulers} 
            onClick={() => setShowRulers(!showRulers)} 
            title="Toggle Rulers"
          />
          
          <div className="flex items-center gap-1 ml-2 bg-slate-950/50 rounded-lg px-2 py-1 border border-slate-800">
             <span className="text-[8px] font-black text-slate-600 uppercase">Snap</span>
             <input 
               type="checkbox" 
               checked={snapToGrid} 
               onChange={(e) => setSnapToGrid(e.target.checked)}
               className="w-3 h-3 accent-sky-500"
             />
             <div className="w-px h-3 bg-slate-800 mx-1"></div>
             <select 
               value={gridSize} 
               onChange={(e) => setGridSize(Number(e.target.value))}
               className="bg-transparent text-[9px] font-bold text-slate-400 outline-none cursor-pointer"
             >
                <option value={1}>1cm</option>
                <option value={5}>5cm</option>
                <option value={10}>10cm</option>
                <option value={20}>20cm</option>
                <option value={50}>50cm</option>
                <option value={100}>1m</option>
             </select>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-1.5 bg-sky-500 text-slate-900 rounded-lg font-bold text-xs hover:bg-sky-400 shadow-lg shadow-sky-500/20 transition-all ml-2">
          <Save className="w-3.5 h-3.5" />
          Commit
        </button>
      </div>
    </div>
  );
}

function ToolbarToggle({ icon, active, onClick, title }: { icon: React.ReactNode, active: boolean, onClick: () => void, title: string }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-all ${active ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[0_0_10px_rgba(14,165,233,0.1)]' : 'text-slate-500 border border-transparent hover:bg-slate-800'}`}
    >
      {icon}
    </button>
  );
}

function ViewModeBtn({ active, onClick, label, disabled }: { active: boolean, onClick: () => void, label: string, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
        ${active ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'text-slate-500 hover:text-slate-300'}
        ${disabled ? 'opacity-30 cursor-not-allowed grayscale' : ''}
      `}
    >
      {label}
    </button>
  );
}
