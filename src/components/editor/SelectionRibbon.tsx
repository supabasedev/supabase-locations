import React, { useState, useRef, useEffect } from 'react';
import { 
  Trash2, 
  Link as LinkIcon, 
  Unlink, 
  Sparkles,
  Rows,
  Columns,
  Database,
  Minimize2,
  Split,
  Copy,
  LocateFixed
} from 'lucide-react';
import { ViewMode, VisualNode, LogicalLocation } from '../../types';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'motion/react';
import { findNodeById } from '../../lib/structureUtils';

interface SelectionRibbonProps {
  viewMode: ViewMode;
  selectedNode: VisualNode | null;
  selectedNodes: VisualNode[];
  selectedLocation: LogicalLocation | null;
  selectedFrontCellIds: string[];
  onSetViewMode: (mode: ViewMode) => void;
  onClone: () => void;
  onRemove: () => void;
  onLink: () => void;
  onUnlink: () => void;
  onFrontSplit?: (direction: 'horizontal' | 'vertical') => void;
  onBatchMap?: () => void;
  onCreateLocation?: () => void;
  onVisualizeLocation?: (locId: string) => void;
}

export default function SelectionRibbon({
  viewMode,
  selectedNode,
  selectedNodes,
  selectedLocation,
  selectedFrontCellIds,
  onSetViewMode,
  onClone,
  onRemove,
  onLink,
  onUnlink,
  onFrontSplit,
  onBatchMap,
  onCreateLocation,
  onVisualizeLocation
}: SelectionRibbonProps) {
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);

  const hasSelection = !!selectedNode || !!selectedLocation || selectedNodes.length > 0;
  const isFrontMode = viewMode === ViewMode.FRONT;

  const hasContainerSelected = selectedFrontCellIds.some(id => {
    if (!selectedNode?.structure) return false;
    const node = findNodeById(selectedNode.structure, id);
    return node?.type === 'container';
  });

  const hasLockedSelected = selectedFrontCellIds.some(id => {
    if (!selectedNode?.structure) return false;
    const node = findNodeById(selectedNode.structure, id);
    return node?.locked;
  });

  const RibbonButton = ({ 
    icon: Icon, 
    onClick, 
    label, 
    disabled = false,
    color = "slate",
    active = false,
    hasFlyout = false
  }: { 
    icon: any, 
    onClick: () => void, 
    label: string, 
    disabled?: boolean,
    color?: "slate" | "sky" | "amber" | "emerald" | "red",
    active?: boolean,
    hasFlyout?: boolean
  }) => {
    const colorClasses = {
      slate: "text-slate-400 hover:text-white hover:bg-slate-800",
      sky: "text-sky-400 hover:text-sky-300 hover:bg-sky-500/10",
      amber: "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10",
      emerald: "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10",
      red: "text-red-400 hover:text-red-300 hover:bg-red-500/10"
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 group relative",
          colorClasses[color],
          (active || activeFlyout === label) && "bg-slate-800 text-white shadow-sm border border-slate-700",
          disabled && "opacity-20 cursor-not-allowed grayscale"
        )}
      >
        <Icon className="w-5 h-5" />
        {/* Tooltip (only show if no flyout is open) */}
        {!activeFlyout && (
          <div className="absolute right-full mr-3 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] font-black text-white uppercase tracking-widest opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-xl">
            {label}
            {hasFlyout && <span className="ml-2 text-slate-500">→</span>}
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      <AnimatePresence>
        {activeFlyout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/5 cursor-default pointer-events-auto"
            onMouseDown={(e) => {
              e.stopPropagation();
              setActiveFlyout(null);
            }}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-2 p-1.5 bg-slate-900 h-full animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-auto w-12 shrink-0 relative z-50 overflow-visible">
        {!hasSelection || (isFrontMode && selectedFrontCellIds.length > 0 && (hasContainerSelected || hasLockedSelected)) || (!isFrontMode && selectedNodes.length > 1) ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10">
            <div className="w-px h-full bg-slate-700" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full">
            <div className="flex flex-col gap-2">
              {/* Front View Specific Actions */}
              {isFrontMode && selectedNode && selectedFrontCellIds.length === 1 && (
                <div className="relative" ref={activeFlyout === 'Split' ? flyoutRef : null}>
                  <div className="mt-2 text-center">
                    <RibbonButton 
                      icon={Split} 
                      onClick={() => setActiveFlyout(activeFlyout === 'Split' ? null : 'Split')} 
                      label="Split" 
                      color="sky"
                      hasFlyout
                    />
                    <RibbonButton 
                      icon={Sparkles} 
                      onClick={() => onBatchMap?.()} 
                      label="Batch Map" 
                      color="amber"
                    />
                  </div>
                  
                  <AnimatePresence>
                    {activeFlyout === 'Split' && (
                      <motion.div 
                        initial={{ opacity: 0, x: 10, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 10, scale: 0.95 }}
                        className="absolute right-full mr-2 top-0 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 min-w-[140px] z-50"
                      >
                        <button 
                          onClick={() => { onFrontSplit?.('horizontal'); setActiveFlyout(null); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Rows className="w-4 h-4 text-sky-400" />
                          Split to Rows
                        </button>
                        <button 
                          onClick={() => { onFrontSplit?.('vertical'); setActiveFlyout(null); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Columns className="w-4 h-4 text-sky-400" />
                          Split to Cols
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="w-6 h-px bg-slate-800 mx-auto my-1" />
                </div>
              )}

              {/* Connection Actions */}
              {selectedNode && (
                <>
                  {!selectedNode.locationId ? (
                    <RibbonButton 
                      icon={LinkIcon} 
                      onClick={onLink} 
                      label="Link Location" 
                      color="sky"
                    />
                  ) : (
                    <RibbonButton 
                      icon={Unlink} 
                      onClick={onUnlink} 
                      label="Unlink Location" 
                      color="amber"
                    />
                  )}

                  {!selectedNode.locationId && (
                    <RibbonButton 
                        icon={Database} 
                        onClick={onCreateLocation} 
                        label="Generate Location" 
                        color="emerald"
                    />
                  )}
                  <div className="w-6 h-px bg-slate-800 mx-auto my-1" />
                </>
              )}

              {/* Location-only actions */}
              {selectedLocation && !selectedNode && (
                <>
                   <RibbonButton 
                    icon={LocateFixed} 
                    onClick={() => onVisualizeLocation?.(selectedLocation.id)} 
                    label="Visualize on Map" 
                    color="sky"
                  />
                  <div className="w-6 h-px bg-slate-800 mx-auto my-1" />
                </>
              )}
            </div>

            {/* Danger Zone */}
            <div className="mt-auto pt-2 border-t border-slate-800 flex flex-col gap-2">
              {!isFrontMode && (
                <RibbonButton 
                  icon={Copy} 
                  onClick={onClone} 
                  label="Clone Node" 
                  color="sky"
                />
              )}
              <RibbonButton 
                icon={Trash2} 
                onClick={onRemove} 
                label="Delete" 
                color="red"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
