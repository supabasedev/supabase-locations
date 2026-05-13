import React, { useState, useRef, useEffect } from 'react';
import { 
  MousePointer2, 
  Hand, 
  Plus, 
  Ruler,
  Split,
  Square,
  Minus
} from 'lucide-react';
import { ViewMode } from '../../types';
import { EditorTool } from './EditorPage';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'motion/react';

interface ToolRibbonProps {
  selectedTool: EditorTool;
  setSelectedTool: (tool: EditorTool) => void;
  onAdd: () => void;
  isFrontMode?: boolean;
  onSelectAllDividers?: (type?: 'horizontal' | 'vertical' | 'frame') => void;
}

export default function ToolRibbon({
  selectedTool,
  setSelectedTool,
  onAdd,
  isFrontMode = false,
  onSelectAllDividers
}: ToolRibbonProps) {
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
        setActiveFlyout(null);
      }
    };

    if (activeFlyout) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeFlyout]);

  const ToolButton = ({ 
    icon: Icon, 
    onClick, 
    label, 
    active = false,
    color = "slate",
    hasFlyout = false
  }: { 
    icon: any, 
    onClick: () => void, 
    label: string,
    active?: boolean,
    color?: "slate" | "sky",
    hasFlyout?: boolean
  }) => {
    return (
      <button
        onClick={onClick}
        title={hasFlyout ? undefined : label}
        className={cn(
          "w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 group relative",
          active || activeFlyout === label
            ? color === "sky" ? "bg-sky-500 text-slate-900 shadow-lg shadow-sky-500/20" : "bg-slate-800 text-white shadow-sm border border-slate-700"
            : "text-slate-400 hover:text-white hover:bg-slate-800"
        )}
      >
        <Icon className="w-4 h-4" />
        <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] font-black text-white uppercase tracking-widest opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-xl">
          {label}
          {hasFlyout && <span className="ml-2 text-slate-500">→</span>}
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2 p-1.5 bg-slate-900 border-r border-slate-800 h-full animate-in fade-in slide-in-from-left-4 duration-300 pointer-events-auto w-12 shrink-0 relative z-50 overflow-visible">
      {/* Editor Tools */}
      <div className="flex flex-col gap-1 items-center">
        <div className="relative" ref={activeFlyout === 'Select' ? flyoutRef : null}>
          <ToolButton 
            icon={MousePointer2} 
            onClick={() => {
              if (isFrontMode) {
                setActiveFlyout(activeFlyout === 'Select' ? null : 'Select');
              } else {
                setSelectedTool('select');
              }
            }} 
            label="Select" 
            active={selectedTool === 'select'}
            hasFlyout={isFrontMode}
          />

          <AnimatePresence>
            {activeFlyout === 'Select' && (
              <motion.div 
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.95 }}
                className="absolute left-full ml-2 top-0 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 min-w-[170px] z-50"
              >
                <button 
                  onClick={() => { setSelectedTool('select'); setActiveFlyout(null); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors",
                    selectedTool === 'select' ? "bg-sky-500 text-slate-900" : "text-slate-300 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <MousePointer2 className="w-4 h-4" />
                  Select Tool
                </button>
                <div className="h-px bg-slate-800 my-1 mx-2" />
                <button 
                  onClick={() => { onSelectAllDividers?.(); setActiveFlyout(null); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Split className="w-4 h-4 text-sky-400" />
                  All Dividers
                </button>
                <button 
                  onClick={() => { onSelectAllDividers?.('frame'); setActiveFlyout(null); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Square className="w-4 h-4 text-sky-400" />
                  Frame Only
                </button>
                <div className="h-px bg-slate-800 my-1 mx-2" />
                <button 
                  onClick={() => { onSelectAllDividers?.('horizontal'); setActiveFlyout(null); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Minus className="w-4 h-4 text-sky-400" />
                  Horizontal 
                </button>
                <button 
                  onClick={() => { onSelectAllDividers?.('vertical'); setActiveFlyout(null); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <div className="rotate-90">
                    <Minus className="w-4 h-4 text-sky-400" />
                  </div>
                  Vertical
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ToolButton 
          icon={Hand} 
          onClick={() => setSelectedTool('pan')} 
          label="Pan tool" 
          active={selectedTool === 'pan'}
        />
        <div className="w-6 h-px bg-slate-800 mx-auto my-1" />
        <ToolButton 
          icon={Plus} 
          onClick={onAdd}
          label="Add Object" 
          active={selectedTool === 'add'}
          color="sky"
        />
        <ToolButton 
          icon={Ruler} 
          onClick={() => setSelectedTool('measure')} 
          label="Measure tool" 
          active={selectedTool === 'measure'}
        />
      </div>
    </div>
  );
}
