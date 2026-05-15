import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Monitor, 
  Box, 
  Layers, 
  Settings2,
  Lock,
  Link as LinkIcon,
  Maximize2,
  LayoutGrid,
  Rows,
  Columns,
  Grid,
  Unlink,
  Sparkles,
  MousePointer2,
  Hand,
  GripHorizontal,
  GripVertical,
  Check,
  Info,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Grid3X3,
  Box as BoxIcon,
  MousePointer
} from 'lucide-react';
import { VisualNode, StructureNode, LogicalLocation, LayoutSplitDivider, LocationRole } from '../../types';
import { cn } from "@/lib/utils";
import { SECTION_SKINS, SectionSkin } from '../../constants/skins';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

interface FrontViewEditorProps {
  node: VisualNode;
  locations: LogicalLocation[];
  onUpdateNode: (id: string, updates: Partial<VisualNode>) => void;
  onAddLocations?: (locations: LogicalLocation[]) => void;
  selectedCellIds: string[];
  onSelectCells: (ids: string[] | ((prev: string[]) => string[])) => void;
  selectedDividerIds: string[];
  onSelectDividers: (ids: string[]) => void;
  tool?: string;
  triggerSplit?: 'horizontal' | 'vertical' | null;
  onClearSplitTrigger?: () => void;
  triggerBatchMap?: boolean;
  onClearBatchMapTrigger?: () => void;
  onCancel?: () => void;
  onDeselect?: () => void;
  fitTrigger?: number;
}

const CORNER_PRESETS = [
  { id: 'sharp', label: 'Sharp', values: [0, 0, 0, 0] },
  { id: 'slightly_rounded', label: 'Slightly Rounded', values: [4, 4, 4, 4] },
  { id: 'rounded', label: 'Rounded', values: [12, 12, 12, 12] },
  { id: 'modern_cabinet', label: 'Modern Cabinet', values: [8, 8, 8, 8] },
  { id: 'plastic_bin', label: 'Plastic Bin', values: [24, 24, 24, 24] },
  { id: 'soft_industrial', label: 'Soft Industrial', values: [4, 4, 16, 16] },
];

function FrontSetupWizard({ 
  node, 
  locations, 
  onComplete,
  wizardStep,
  setWizardStep,
  setupData,
  setSetupData,
  onCancel
}: { 
  node: VisualNode; 
  locations: LogicalLocation[]; 
  onComplete: () => void;
  wizardStep: number;
  setWizardStep: React.Dispatch<React.SetStateAction<number>>;
  setupData: any;
  setSetupData: React.Dispatch<React.SetStateAction<any>>;
  onCancel?: () => void;
}) {
  const linkedLoc = node.locationId ? locations.find(l => l.id === node.locationId) : null;
  const [selectedCorner, setSelectedCorner] = useState<string | null>(null);
  
  const inputRefs = {
    cornerRadiusTopLeft: useRef<HTMLInputElement>(null),
    cornerRadiusTopRight: useRef<HTMLInputElement>(null),
    cornerRadiusBottomLeft: useRef<HTMLInputElement>(null),
    cornerRadiusBottomRight: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    if (selectedCorner && (inputRefs as any)[selectedCorner]?.current) {
      (inputRefs as any)[selectedCorner].current.focus();
      (inputRefs as any)[selectedCorner].current.select();
    }
  }, [selectedCorner]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617] p-8 overflow-y-auto">
      <div className="max-w-4xl w-full flex flex-col gap-8 py-12">
        {/* Context Summary */}
        <div className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl">
           <div className="p-4 bg-sky-500/10 rounded-3xl border border-sky-500/20">
              <BoxIcon className="w-8 h-8 text-sky-400" />
           </div>
           <div className="flex-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Context Identification</p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">{node.label}</h3>
                {linkedLoc && (
                  <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                    Linked: {linkedLoc.code}
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                 <span>Footprint: {node.width}x{node.depth || 0}cm</span>
                 <span className="w-1 h-1 rounded-full bg-slate-800" />
                 <span>Rotation: {node.rotation}°</span>
              </div>
           </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(step => (
            <div 
              key={step} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step <= wizardStep ? 'bg-sky-500' : 'bg-slate-800'}`} 
            />
          ))}
        </div>

        <motion.div
          key={wizardStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          {wizardStep === 1 && (
            <>
              <div className="space-y-2">
                <span className="text-sky-400 font-black text-[10px] uppercase tracking-widest">Step 1 of 4</span>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">Logical Dimensions</h2>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Set the physical scale of this object's front face. Width and Depth are prefilled from its top-down footprint.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Front Height (cm)</label>
                  <input 
                    type="number"
                    step="1"
                    required
                    value={setupData.height}
                    onChange={(e) => setSetupData((prev: any) => ({ ...prev, height: Math.round(parseFloat(e.target.value) || 0) }))}
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-6 py-4 text-white font-black text-xl outline-none focus:ring-2 focus:ring-sky-500 tracking-tight"
                    placeholder="e.g. 200"
                  />
                  <div className="flex gap-2">
                    {[120, 180, 200, 240].map(h => (
                      <button 
                        key={h}
                        onClick={() => setSetupData((prev: any) => ({ ...prev, height: h }))}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                      Front Width (cm)
                      <button 
                        onClick={() => setSetupData((prev: any) => ({ ...prev, useCustomWidth: !prev.useCustomWidth, width: node.width }))}
                        className={`text-[9px] lowercase italic transition-colors ${setupData.useCustomWidth ? 'text-sky-400' : 'text-slate-600'}`}
                      >
                        {setupData.useCustomWidth ? 'sync with footprint' : 'use custom width'}
                      </button>
                    </label>
                    <input 
                      type="number"
                      step="1"
                      disabled={!setupData.useCustomWidth}
                      value={setupData.width}
                      onChange={(e) => setSetupData((prev: any) => ({ ...prev, width: Math.round(parseFloat(e.target.value) || 0) }))}
                      className={`w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-6 py-4 text-white font-black text-xl outline-none transition-all tracking-tight ${!setupData.useCustomWidth ? 'opacity-30 cursor-not-allowed' : 'focus:ring-2 focus:ring-sky-500'}`}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Footprint Depth (cm)</label>
                    <div className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-6 py-4 text-slate-500 font-black text-xl opacity-30 select-none tracking-tight">
                      {node.depth || 0}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {wizardStep === 2 && (
            <>
              <div className="space-y-2">
                <span className="text-sky-400 font-black text-[10px] uppercase tracking-widest">Step 2 of 4</span>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">Front Orientation</h2>
                <p className="text-slate-400 text-sm font-medium">
                  Which side of the top-down footprint represents the "Front" face you are editing?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 items-center">
                <div className="bg-slate-900 aspect-square rounded-[3rem] border border-slate-800 relative flex items-center justify-center p-12 overflow-hidden">
                   <div 
                     className="absolute inset-x-12 inset-y-16 border-2 border-slate-700 rounded-xl bg-slate-950 flex items-center justify-center shadow-2xl transition-transform duration-500"
                     style={{ transform: `rotate(${node.rotation}deg)` }}
                   >
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest rotate-[-90deg]">FOOTPRINT</span>
                      
                      {/* Highlights */}
                      <div className={`absolute bottom-0 inset-x-0 h-1 bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)] transition-opacity duration-300 ${setupData.frontSide === 'bottom' ? 'opacity-100' : 'opacity-0'}`} />
                      <div className={`absolute top-0 inset-x-0 h-1 bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)] transition-opacity duration-300 ${setupData.frontSide === 'top' ? 'opacity-100' : 'opacity-0'}`} />
                      <div className={`absolute left-0 inset-y-0 w-1 bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)] transition-opacity duration-300 ${setupData.frontSide === 'left' ? 'opacity-100' : 'opacity-0'}`} />
                      <div className={`absolute right-0 inset-y-0 w-1 bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)] transition-opacity duration-300 ${setupData.frontSide === 'right' ? 'opacity-100' : 'opacity-0'}`} />
                   </div>

                   <button onClick={() => setSetupData((prev: any) => ({ ...prev, frontSide: 'top' }))} className={`absolute top-4 left-1/2 -translate-x-1/2 p-4 rounded-2xl border transition-all ${setupData.frontSide === 'top' ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-800 text-slate-500 border-slate-750 hover:bg-slate-700'}`}>
                      <ArrowUp className="w-6 h-6" />
                   </button>
                   <button onClick={() => setSetupData((prev: any) => ({ ...prev, frontSide: 'bottom' }))} className={`absolute bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-2xl border transition-all ${setupData.frontSide === 'bottom' ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-800 text-slate-500 border-slate-750 hover:bg-slate-700'}`}>
                      <ArrowDown className="w-6 h-6" />
                   </button>
                   <button onClick={() => setSetupData((prev: any) => ({ ...prev, frontSide: 'left' }))} className={`absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-2xl border transition-all ${setupData.frontSide === 'left' ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-800 text-slate-500 border-slate-750 hover:bg-slate-700'}`}>
                      <ArrowLeft className="w-6 h-6" />
                   </button>
                   <button onClick={() => setSetupData((prev: any) => ({ ...prev, frontSide: 'right' }))} className={`absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-2xl border transition-all ${setupData.frontSide === 'right' ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-800 text-slate-500 border-slate-750 hover:bg-slate-700'}`}>
                      <ArrowRight className="w-6 h-6" />
                   </button>
                </div>

                <div className="space-y-4">
                   <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                      Current selection: <span className="text-sky-400 uppercase">{setupData.frontSide} edge</span>. 
                      Usually, this is determined by the aisle facing. If this is a static rack, Choose bottom for the default front projection.
                   </p>
                </div>
              </div>
            </>
          )}

          {wizardStep === 3 && (
            <>
              <div className="space-y-2">
                <span className="text-sky-400 font-black text-[10px] uppercase tracking-widest">Step 3 of 4</span>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">Front View Structure</h2>
                <p className="text-slate-400 text-sm font-medium">
                  Choose a starting template for the front view of this object.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'blank', label: 'Blank', icon: <BoxIcon /> },
                  { id: 'shelves', label: 'Shelves', icon: <Rows /> },
                  { id: 'columns', label: 'Columns', icon: <Columns /> },
                  { id: 'grid', label: 'Grid', icon: <Grid3X3 /> },
                  { id: 'wall_bins', label: 'Wall Bins', icon: <Plus /> },
                  { id: 'pallet_rack', label: 'Pallet Rack', icon: <Layers /> },
                ].map(tmpl => (
                  <button 
                    key={tmpl.id}
                    onClick={() => setSetupData((prev: any) => ({ ...prev, template: tmpl.id as any }))}
                    className={`flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition-all ${setupData.template === tmpl.id ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700'}`}
                  >
                    {React.cloneElement(tmpl.icon as React.ReactElement<any>, { className: 'w-8 h-8' })}
                    <span className="text-[10px] font-black uppercase tracking-widest">{tmpl.label}</span>
                  </button>
                ))}
              </div>

              {(setupData.template === 'shelves' || setupData.template === 'rows' || setupData.template === 'grid' || setupData.template === 'wall_bins') && (
                <div className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center gap-8">
                   <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Number of Rows/Levels</label>
                      <input 
                        type="range" min="1" max="15" step="1"
                        value={setupData.rowCount}
                        onChange={(e) => setSetupData((prev: any) => ({ ...prev, rowCount: parseInt(e.target.value) }))}
                        className="w-full accent-sky-500"
                      />
                   </div>
                   <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-xl font-black text-white">
                      {setupData.rowCount}
                   </div>
                   <div className="w-48 space-y-2 border-l border-slate-800 pl-6 border-dashed">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Row Divider (cm)</label>
                      <input 
                        type="number" step="1"
                        value={setupData.dividerRowThickness}
                        onChange={(e) => setSetupData((prev: any) => ({ ...prev, dividerRowThickness: Math.round(parseFloat(e.target.value) || 0) }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white font-black text-xs outline-none focus:ring-1 focus:ring-sky-500"
                      />
                   </div>
                   <div className="w-32 space-y-2 border-l border-slate-800 pl-6 border-dashed">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Type</label>
                      <select 
                        value={setupData.dividerRowType}
                        onChange={(e) => setSetupData((prev: any) => ({ ...prev, dividerRowType: e.target.value as any }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white font-black text-[10px] uppercase tracking-widest outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                      >
                         <option value="solid">Solid</option>
                         <option value="gap">Gap</option>
                      </select>
                   </div>
                   <div className="w-40 space-y-2 border-l border-slate-800 pl-6 border-dashed">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Material</label>
                      <select 
                        value={setupData.dividerRowMaterial}
                        onChange={(e) => setSetupData((prev: any) => ({ ...prev, dividerRowMaterial: e.target.value as any }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white font-black text-[10px] uppercase tracking-widest outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                      >
                         <option value="wood">Wood</option>
                         <option value="metal">Metal</option>
                         <option value="plastic">Plastic</option>
                         <option value="empty">Empty</option>
                         <option value="custom">Custom</option>
                      </select>
                   </div>
                </div>
              )}

              {(setupData.template === 'columns' || setupData.template === 'grid' || setupData.template === 'wall_bins') && (
                <div className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center gap-8">
                   <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Number of Columns</label>
                      <input 
                        type="range" min="1" max="15" step="1"
                        value={setupData.colCount}
                        onChange={(e) => setSetupData((prev: any) => ({ ...prev, colCount: parseInt(e.target.value) }))}
                        className="w-full accent-sky-500"
                      />
                   </div>
                   <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-xl font-black text-white">
                      {setupData.colCount}
                   </div>
                   <div className="w-48 space-y-2 border-l border-slate-800 pl-6 border-dashed">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Col Divider (cm)</label>
                      <input 
                        type="number" step="1"
                        value={setupData.dividerColThickness}
                        onChange={(e) => setSetupData((prev: any) => ({ ...prev, dividerColThickness: Math.round(parseFloat(e.target.value) || 0) }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white font-black text-xs outline-none focus:ring-1 focus:ring-sky-500"
                      />
                   </div>
                   <div className="w-32 space-y-2 border-l border-slate-800 pl-6 border-dashed">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Type</label>
                      <select 
                        value={setupData.dividerColType}
                        onChange={(e) => setSetupData((prev: any) => ({ ...prev, dividerColType: e.target.value as any }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white font-black text-[10px] uppercase tracking-widest outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                      >
                         <option value="solid">Solid</option>
                         <option value="gap">Gap</option>
                      </select>
                   </div>
                   <div className="w-40 space-y-2 border-l border-slate-800 pl-6 border-dashed">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Material</label>
                      <select 
                        value={setupData.dividerColMaterial}
                        onChange={(e) => setSetupData((prev: any) => ({ ...prev, dividerColMaterial: e.target.value as any }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white font-black text-[10px] uppercase tracking-widest outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                      >
                         <option value="wood">Wood</option>
                         <option value="metal">Metal</option>
                         <option value="plastic">Plastic</option>
                         <option value="empty">Empty</option>
                         <option value="custom">Custom</option>
                      </select>
                   </div>
                </div>
              )}

              {(setupData.template === 'grid' || setupData.template === 'wall_bins') && (
                <div className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center justify-between gap-6">
                   <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Primary Divider (Continuous across object)</label>
                      <div className="grid grid-cols-2 gap-2">
                         <button 
                           onClick={() => setSetupData((prev: any) => ({ ...prev, primaryDivider: 'row' }))}
                           className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex flex-col items-center gap-1 ${setupData.primaryDivider === 'row' ? 'bg-sky-500 border-sky-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                         >
                            <span>Row Dividers</span>
                            <span className="text-[8px] opacity-70 normal-case tracking-normal">(Horizontal dividers run full width)</span>
                         </button>
                         <button 
                           onClick={() => setSetupData((prev: any) => ({ ...prev, primaryDivider: 'col' }))}
                           className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex flex-col items-center gap-1 ${setupData.primaryDivider === 'col' ? 'bg-sky-500 border-sky-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                         >
                            <span>Column Dividers</span>
                            <span className="text-[8px] opacity-70 normal-case tracking-normal">(Vertical dividers run full height)</span>
                         </button>
                      </div>
                   </div>
                </div>
              )}

              {/* Outer Frame Settings - Moved into Step 3 */}
              <div className="space-y-6 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <h4 className="text-sm font-black text-white uppercase tracking-tight italic">Outer Frame</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Border around the object</p>
                   </div>
                   <button 
                     onClick={() => setSetupData((prev: any) => ({ ...prev, hasFrame: !prev.hasFrame }))}
                     className={`w-12 h-6 rounded-full transition-all relative ${setupData.hasFrame ? 'bg-sky-500' : 'bg-slate-800'}`}
                   >
                     <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${setupData.hasFrame ? 'left-7' : 'left-1'}`} />
                   </button>
                </div>

                {setupData.hasFrame && (
                   <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/50 overflow-hidden"
                   >
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Frame Thickness (cm)</label>
                         <input 
                           type="number"
                           step="1"
                           value={setupData.frameThickness}
                           onChange={(e) => setSetupData((prev: any) => ({ ...prev, frameThickness: Math.round(parseFloat(e.target.value) || 0) }))}
                           className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-3 text-white font-black text-xs outline-none focus:ring-1 focus:ring-sky-500"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Frame Type</label>
                         <div className="grid grid-cols-2 gap-2">
                            {['solid', 'gap'].map(type => (
                               <button 
                                 key={type}
                                 onClick={() => setSetupData((prev: any) => ({ ...prev, frameType: type as any }))}
                                 className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${setupData.frameType === type ? 'bg-sky-500 border-sky-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                               >
                                  {type}
                               </button>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Material</label>
                         <select 
                           value={setupData.frameMaterial}
                           onChange={(e) => setSetupData((prev: any) => ({ ...prev, frameMaterial: e.target.value as any }))}
                           className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-3 text-white font-black text-[10px] uppercase tracking-widest outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                         >
                            <option value="wood">Wood</option>
                            <option value="metal">Metal</option>
                            <option value="plastic">Plastic</option>
                            <option value="empty">Empty</option>
                            <option value="custom">Custom</option>
                         </select>
                      </div>
                   </motion.div>
                )}
              </div>

              <div className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-[11px] font-black text-white uppercase tracking-tight">Sync Inventory logic</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">Create logical storage units matching visual nodes</p>
                 </div>
                 <button 
                   onClick={() => setSetupData((prev: any) => ({ ...prev, generateLocations: !prev.generateLocations }))}
                   className={`w-12 h-6 rounded-full transition-all relative ${setupData.generateLocations ? 'bg-sky-500' : 'bg-slate-800'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${setupData.generateLocations ? 'left-7' : 'left-1'}`} />
                 </button>
              </div>
            </>
          )}

          {wizardStep === 4 && (
            <>
              <div className="space-y-2">
                <span className="text-sky-400 font-black text-[10px] uppercase tracking-widest">Step 4 of 4</span>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">Front Shape & Corners</h2>
                <p className="text-slate-400 text-sm font-medium">
                  Define the visual rounding of this object's front projection.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 items-start">
                 <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                       <div className="flex items-center gap-3">
                          {setupData.isCornerRadiusLocked ? <LinkIcon className="w-4 h-4 text-sky-400" /> : <Unlink className="w-4 h-4 text-slate-500" />}
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Lock Corners</span>
                       </div>
                       <button 
                         onClick={() => setSetupData((prev: any) => ({ ...prev, isCornerRadiusLocked: !prev.isCornerRadiusLocked }))}
                         className={`w-10 h-5 rounded-full transition-all relative ${setupData.isCornerRadiusLocked ? 'bg-sky-500' : 'bg-slate-800'}`}
                       >
                         <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${setupData.isCornerRadiusLocked ? 'left-6' : 'left-1'}`} />
                       </button>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Presets</label>
                       <div className="grid grid-cols-2 gap-2">
                          {CORNER_PRESETS.map(preset => (
                            <button 
                              key={preset.id}
                              onClick={() => setSetupData((prev: any) => ({
                                ...prev,
                                cornerRadiusTopLeft: preset.values[0],
                                cornerRadiusTopRight: preset.values[1],
                                cornerRadiusBottomRight: preset.values[2],
                                cornerRadiusBottomLeft: preset.values[3],
                              }))}
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all text-left"
                            >
                              {preset.label}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-800">
                       {setupData.isCornerRadiusLocked ? (
                         <div className="space-y-3">
                            <div className="flex justify-between items-center">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Corner Radius</label>
                               <span className="text-xs font-black text-sky-400">{setupData.cornerRadiusTopLeft}px</span>
                            </div>
                            <input 
                              type="range" min="0" max="100" step="1"
                              value={setupData.cornerRadiusTopLeft}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setSetupData((prev: any) => ({
                                  ...prev,
                                  cornerRadiusTopLeft: val,
                                  cornerRadiusTopRight: val,
                                  cornerRadiusBottomRight: val,
                                  cornerRadiusBottomLeft: val,
                                }));
                              }}
                              className="w-full accent-sky-500"
                            />
                         </div>
                       ) : (
                         <div className="grid grid-cols-2 gap-4">
                            {[
                              { id: 'cornerRadiusTopLeft', label: 'Top Left' },
                              { id: 'cornerRadiusTopRight', label: 'Top Right' },
                              { id: 'cornerRadiusBottomLeft', label: 'Bottom Left' },
                              { id: 'cornerRadiusBottomRight', label: 'Bottom Right' },
                            ].map(corner => (
                              <div 
                                key={corner.id} 
                                className={`space-y-2 p-3 rounded-2xl border transition-all ${selectedCorner === corner.id ? 'bg-sky-500/5 border-sky-500/50' : 'bg-transparent border-transparent'}`}
                              >
                                 <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center justify-between">
                                   {corner.label}
                                   {selectedCorner === corner.id && <MousePointer className="w-3 h-3 text-sky-400" />}
                                 </label>
                                 <input 
                                   ref={(inputRefs as any)[corner.id]}
                                   type="number"
                                   value={(setupData as any)[corner.id]}
                                   onFocus={() => setSelectedCorner(corner.id)}
                                   onChange={(e) => setSetupData((prev: any) => ({ ...prev, [corner.id]: parseInt(e.target.value) || 0 }))}
                                   className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-black text-white outline-none focus:ring-1 focus:ring-sky-500"
                                 />
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="flex flex-col gap-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Live Preview</label>
                    <div className="aspect-[4/3] bg-slate-950 rounded-[2.5rem] border border-slate-800 flex items-center justify-center p-8 relative overflow-hidden">
                       <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #808080 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                       <div 
                         className="bg-sky-500/10 border-2 border-sky-500/40 relative shadow-2xl shadow-sky-500/5 transition-all duration-300 overflow-hidden"
                         style={{
                            width: '80%',
                            height: '80%',
                            borderTopLeftRadius: `${setupData.cornerRadiusTopLeft}px`,
                            borderTopRightRadius: `${setupData.cornerRadiusTopRight}px`,
                            borderBottomRightRadius: `${setupData.cornerRadiusBottomRight}px`,
                            borderBottomLeftRadius: `${setupData.cornerRadiusBottomLeft}px`,
                         }}
                       >
                          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px opacity-20">
                             {Array.from({ length: 9 }).map((_, i) => (
                               <div key={i} className="border border-sky-400/20" />
                             ))}
                          </div>
                          
                          {/* Corner selection areas */}
                          {!setupData.isCornerRadiusLocked && (
                            <div className="absolute inset-0 z-10">
                              <div 
                                onClick={() => setSelectedCorner('cornerRadiusTopLeft')}
                                className={`absolute top-0 left-0 w-1/3 h-1/3 cursor-pointer transition-colors ${selectedCorner === 'cornerRadiusTopLeft' ? 'bg-sky-500/10' : 'hover:bg-sky-500/5'}`} 
                              />
                              <div 
                                onClick={() => setSelectedCorner('cornerRadiusTopRight')}
                                className={`absolute top-0 right-0 w-1/3 h-1/3 cursor-pointer transition-colors ${selectedCorner === 'cornerRadiusTopRight' ? 'bg-sky-500/10' : 'hover:bg-sky-500/5'}`} 
                              />
                              <div 
                                onClick={() => setSelectedCorner('cornerRadiusBottomLeft')}
                                className={`absolute bottom-0 left-0 w-1/3 h-1/3 cursor-pointer transition-colors ${selectedCorner === 'cornerRadiusBottomLeft' ? 'bg-sky-500/10' : 'hover:bg-sky-500/5'}`} 
                              />
                              <div 
                                onClick={() => setSelectedCorner('cornerRadiusBottomRight')}
                                className={`absolute bottom-0 right-0 w-1/3 h-1/3 cursor-pointer transition-colors ${selectedCorner === 'cornerRadiusBottomRight' ? 'bg-sky-500/10' : 'hover:bg-sky-500/5'}`} 
                              />
                            </div>
                          )}
                       </div>
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 italic text-center">
                      {setupData.isCornerRadiusLocked ? 'Preview reflects chosen corner shape' : 'Click corners in preview to select'}
                    </p>
                 </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Actions */}
        <div className="pt-8 border-t border-slate-800 flex justify-between items-center bg-[#020617] sticky bottom-0 py-8">
          <button 
            onClick={() => {
              if (wizardStep === 1) {
                onCancel?.();
              } else {
                setWizardStep(prev => prev - 1);
              }
            }}
            className="px-8 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors"
          >
            {wizardStep === 1 ? 'Discard Setup' : 'Back'}
          </button>
          <button 
            onClick={() => {
              if (wizardStep === 4) {
                onComplete();
              } else {
                setWizardStep(prev => prev + 1);
              }
            }}
            disabled={wizardStep === 1 && setupData.height <= 0}
            className="px-12 py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-2xl shadow-sky-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {wizardStep === 4 ? 'Initialize Projection' : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FrontViewEditor({ 
  node, 
  locations, 
  onUpdateNode, 
  onAddLocations,
  selectedCellIds,
  onSelectCells,
  selectedDividerIds,
  onSelectDividers,
  tool,
  triggerSplit,
  onClearSplitTrigger,
  triggerBatchMap,
  onClearBatchMapTrigger,
  onCancel,
  onDeselect,
  fitTrigger = 0
}: FrontViewEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedFrameEdge, setSelectedFrameEdge] = useState<{ nodeId: string, edge: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [showNamingPanel, setShowNamingPanel] = useState<{ id: string, direction: 'horizontal' | 'vertical' } | null>(null);

  useEffect(() => {
    if (triggerSplit && selectedCellIds.length > 0) {
      handleSplit(triggerSplit, selectedCellIds[selectedCellIds.length - 1]);
      onClearSplitTrigger?.();
    }
  }, [triggerSplit, selectedCellIds]);

  useEffect(() => {
    if (triggerBatchMap) {
      handleBatchMap();
      onClearBatchMapTrigger?.();
    }
  }, [triggerBatchMap]);

  const [namingConfig, setNamingConfig] = useState({
    type: 'rows' as StructureNode['splitType'],
    prefix: '',
    startNumber: 1,
    padding: 0,
    count: 2,
    dividerThickness: 2,
    dividerType: 'solid' as 'solid' | 'gap',
    dividerMaterial: 'metal' as any,
    dividerColor: '#475569',
    inheritLocationIdx: 0 as number | null // null means clear link
  });

  // Setup Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [setupData, setSetupData] = useState({
    width: node.width,
    height: node.height || node.width,
    depth: node.depth || 0,
    useCustomWidth: false,
    frontSide: node.frontSide || 'bottom',
    template: 'shelves' as 'blank' | 'shelves' | 'rows' | 'columns' | 'grid' | 'wall_bins' | 'pallet_rack' | 'drawer_cabinet' | 'custom',
    generateLocations: false,
    rowCount: 5,
    colCount: 3,
    dividerRowThickness: 5,
    dividerColThickness: 5,
    dividerRowMaterial: 'metal' as any,
    dividerColMaterial: 'metal' as any,
    dividerRowColor: '#475569',
    dividerColColor: '#475569',
    dividerRowType: 'solid' as 'solid' | 'gap',
    dividerColType: 'solid' as 'solid' | 'gap',
    primaryDivider: 'row' as 'row' | 'col',
    hasFrame: true,
    frameThickness: 5,
    frameType: 'solid' as 'solid' | 'gap',
    frameMaterial: 'metal' as any,
    cornerRadiusTopLeft: node.style?.cornerRadiusTopLeft || 0,
    cornerRadiusTopRight: node.style?.cornerRadiusTopRight || 0,
    cornerRadiusBottomRight: node.style?.cornerRadiusBottomRight || 0,
    cornerRadiusBottomLeft: node.style?.cornerRadiusBottomLeft || 0,
    isCornerRadiusLocked: node.style?.isCornerRadiusLocked ?? true,
  });

  // Reset wizard state when node changes
  useEffect(() => {
    setWizardStep(1);
    setSetupData({
      width: node.width,
      height: node.height || node.width,
      depth: node.depth || 0,
      useCustomWidth: false,
      frontSide: node.frontSide || 'bottom',
      template: 'shelves' as 'blank' | 'shelves' | 'rows' | 'columns' | 'grid' | 'wall_bins' | 'pallet_rack' | 'drawer_cabinet' | 'custom',
      generateLocations: false,
      rowCount: 5,
      colCount: 3,
      dividerRowThickness: 5,
      dividerColThickness: 5,
      dividerRowMaterial: 'metal' as any,
      dividerColMaterial: 'metal' as any,
      dividerRowColor: '#475569',
      dividerColColor: '#475569',
      dividerRowType: 'solid' as 'solid' | 'gap',
      dividerColType: 'solid' as 'solid' | 'gap',
      primaryDivider: 'row' as 'row' | 'col',
      hasFrame: true,
      frameThickness: 5,
      frameType: 'solid' as 'solid' | 'gap',
      frameMaterial: 'metal' as any,
      cornerRadiusTopLeft: node.style?.cornerRadiusTopLeft || 0,
      cornerRadiusTopRight: node.style?.cornerRadiusTopRight || 0,
      cornerRadiusBottomRight: node.style?.cornerRadiusBottomRight || 0,
      cornerRadiusBottomLeft: node.style?.cornerRadiusBottomLeft || 0,
      isCornerRadiusLocked: node.style?.isCornerRadiusLocked ?? true,
    });
  }, [node.id]);

  const resizeTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setDimensions({
            width: clientWidth,
            height: clientHeight
          });
        }
      }
    };
    
    // Initial call to catch current size
    updateDimensions();
    
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    // Extra check after setup to ensure layout has settled
    const timeout = setTimeout(updateDimensions, 100);
    
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [node.frontSetupDone]); // Re-run when setup state changes to catch the new containerRef

  const fitToScreen = () => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      const padding = 120;
      const targetWidth = node.width || 1000;
      const targetHeight = node.height || 2000;
      
      const scaleX = (dimensions.width - padding) / targetWidth;
      const scaleY = (dimensions.height - padding) / targetHeight;
      const fitScale = Math.min(scaleX, scaleY);
      
      setBaseScale(fitScale);
      setZoomLevel(1);
      setPan({
        x: (dimensions.width - targetWidth * fitScale) / 2,
        y: (dimensions.height - targetHeight * fitScale) / 2
      });
    }
  };

  // Initial fit logic - robust trigger
  useEffect(() => {
    if (node.frontSetupDone && dimensions.width > 0) {
      // Use a small delay for the very first fit after setup to ensure everything is rendered
      const timer = setTimeout(fitToScreen, 60);
      return () => clearTimeout(timer);
    }
  }, [node.id, node.frontSetupDone, dimensions.width, dimensions.height, node.width, node.height, fitTrigger]);

  // Total scale (cumulative)
  const totalScale = useMemo(() => baseScale * zoomLevel, [baseScale, zoomLevel]);

  // Local state for the structure to avoid constant top-level re-renders during interactive operations
  const [localStructure, setLocalStructure] = useState<StructureNode>(() => {
    if (node.structure) return node.structure;
    return {
      id: `root-${node.id}`,
      type: 'cell' as const,
      size: 1,
      label: node.label
    };
  });

  // Keep local structure in sync with prop updates (but not vice versa to allow local editing)
  useEffect(() => {
    if (node.structure) {
      setLocalStructure(node.structure);
    }
  }, [node.id, node.structure]);

  const updateStructure = (newStructure: StructureNode) => {
    setLocalStructure(newStructure);
    // Debounced global update
    if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    resizeTimeoutRef.current = setTimeout(() => {
      onUpdateNode(node.id, { structure: newStructure });
    }, 200);
  };

  const structure = localStructure;

  const findNodeById = (root: StructureNode, id: string): StructureNode | null => {
    if (root.id === id) return root;
    if (root.children) {
      for (const child of root.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const replaceNodeById = (root: StructureNode, id: string, newNode: StructureNode): StructureNode => {
    if (root.id === id) return newNode;
    if (root.children) {
      return {
        ...root,
        children: root.children.map(child => replaceNodeById(child, id, newNode))
      };
    }
    return root;
  };

  const isAnyNodeInSubtreeLocked = (n: StructureNode): boolean => {
    if (n.locked) return true;
    if (n.children) {
      return n.children.some(isAnyNodeInSubtreeLocked);
    }
    return false;
  };

  const updateCell = (id: string, updates: Partial<StructureNode>) => {
    const target = findNodeById(structure, id);
    if (!target) return;
    updateStructure(replaceNodeById(structure, id, { ...target, ...updates }));
  };

  const handleBatchMap = () => {
    const usedInThisStructure = new Set<string>();
    const collectUsed = (s: StructureNode) => {
      if (s.locationId) usedInThisStructure.add(s.locationId);
      s.children?.forEach(collectUsed);
    };
    collectUsed(structure);

    const unlinkedLocations = locations.filter(l => 
      l.role !== LocationRole.WAREHOUSE && 
      l.role !== LocationRole.ZONE &&
      !usedInThisStructure.has(l.id)
    );

    // Filter available locations by priority:
    // 1. Children of this node's linked location
    // 2. Others
    const parentLocChildren = node.locationId 
      ? unlinkedLocations.filter(l => l.parentId === node.locationId)
      : [];
    
    const otherAvailable = unlinkedLocations.filter(l => !parentLocChildren.some(pl => pl.id === l.id));
    const available = [...parentLocChildren, ...otherAvailable];

    let locIdx = 0;
    const processBatch = (sNode: StructureNode): StructureNode => {
      if (sNode.type === 'cell') {
        if (!sNode.locationId && locIdx < available.length) {
          const loc = available[locIdx++];
          return { 
            ...sNode, 
            locationId: loc.id, 
            label: loc.code,
            displayLabel: loc.code.split('-').pop() || loc.code
          };
        }
        return sNode;
      }
      return {
        ...sNode,
        children: sNode.children?.map(processBatch)
      };
    };

    updateStructure(processBatch(structure));
  };

  const findParentById = (root: StructureNode, id: string, parent: StructureNode | null = null): StructureNode | null => {
    if (root.id === id) return parent;
    if (root.children) {
      for (const child of root.children) {
        const found = findParentById(child, id, root);
        if (found) return found;
      }
    }
    return null;
  };

  const findDividerInStructure = (root: StructureNode, dividerId: string): { divider: LayoutSplitDivider, parent: StructureNode } | null => {
    if (root.dividers) {
      const found = root.dividers.find(d => d?.id === dividerId);
      if (found) return { divider: found, parent: root };
    }
    if (root.frame) {
      for (const edge of ['top', 'bottom', 'left', 'right'] as const) {
        if (root.frame[edge as keyof typeof root.frame]?.id === dividerId) {
          return { divider: root.frame[edge as keyof typeof root.frame]!, parent: root };
        }
      }
    }
    if (root.children) {
      for (const child of root.children) {
        const found = findDividerInStructure(child, dividerId);
        if (found) return found;
      }
    }
    return null;
  };

  const updateDividers = (dividerIds: string[], updates: Partial<LayoutSplitDivider>) => {
    let newStructure = structure;
    for (const dividerId of dividerIds) {
      const result = findDividerInStructure(newStructure, dividerId);
      if (!result) continue;
      const { parent } = result;

      const newParent = { ...parent };
      if (newParent.dividers) {
        newParent.dividers = newParent.dividers.map(d => d?.id === dividerId ? { ...d, ...updates } as LayoutSplitDivider : d);
      }
      if (newParent.frame) {
        const newFrame = { ...newParent.frame };
        for (const edge of ['top', 'bottom', 'left', 'right'] as const) {
          if (newFrame[edge as keyof typeof newFrame]?.id === dividerId) {
            newFrame[edge as keyof typeof newFrame] = { ...newFrame[edge as keyof typeof newFrame]!, ...updates };
          }
        }
        newParent.frame = newFrame;
      }
      newStructure = replaceNodeById(newStructure, parent.id, newParent);
    }
    updateStructure(newStructure);
  };

  const selectSiblingDividers = () => {
    if (selectedDividerIds.length === 0) return;
    const result = findDividerInStructure(structure, selectedDividerIds[0]);
    if (!result || !result.parent.dividers) return;
    onSelectDividers(result.parent.dividers.map(d => d!.id));
  };

  const selectAlignedDividers = () => {
    if (selectedDividerIds.length === 0) return;
    const result = findDividerInStructure(structure, selectedDividerIds[0]);
    if (!result) return;
    
    const { parent: initialParent, divider: initialDivider } = result;
    const isHorizontal = initialParent.split === 'horizontal';
    
    // Find the index of the divider in its parent
    const dividerIndex = initialParent.dividers?.indexOf(initialDivider);
    if (dividerIndex === undefined || dividerIndex === -1) return;

    const alignedIds: string[] = [];
    
    const collectAligned = (root: StructureNode) => {
      if (root.type === 'container' && root.split === initialParent.split && root.dividers && root.dividers.length === initialParent.dividers?.length) {
        const d = root.dividers[dividerIndex];
        if (d) alignedIds.push(d.id);
      }
      root.children?.forEach(collectAligned);
    };

    collectAligned(structure);
    if (alignedIds.length > 0) {
      onSelectDividers(alignedIds);
    }
  };

  const getFullPath = (root: StructureNode, targetId: string, currentPath: string[] = []): string => {
    if (root.id === targetId) return [...currentPath, root.displayLabel || root.label || ''].filter(Boolean).join(' / ');
    if (root.children) {
      for (const child of root.children) {
        const path = getFullPath(child, targetId, [...currentPath, root.displayLabel || root.label || ''].filter(Boolean));
        if (path) return path;
      }
    }
    return '';
  };

  const selectedNode = useMemo(() => 
    selectedCellIds.length > 0 ? findNodeById(structure, selectedCellIds[selectedCellIds.length - 1]) : null
  , [selectedCellIds, structure]);

  const fullPath = useMemo(() => 
    selectedCellIds.length > 0 ? getFullPath(structure, selectedCellIds[selectedCellIds.length - 1]) : ''
  , [selectedCellIds, structure]);

  const linkedLocation = useMemo(() => 
    selectedNode?.locationId ? locations.find(l => l.id === selectedNode.locationId) : null
  , [selectedNode, locations]);

  const selectedDivider = useMemo(() => 
    selectedDividerIds.length > 0 ? findDividerInStructure(structure, selectedDividerIds[0]) : null
  , [selectedDividerIds, structure]);

  const generateLabel = (type: StructureNode['splitType'], index: number, config: typeof namingConfig) => {
    const prefix = config.prefix || {
      rows: 'R',
      columns: 'C',
      shelves: 'S',
      bins: 'K',
      drawers: 'D',
      positions: 'P'
    }[type!] || '';
    
    const num = (config.startNumber + index).toString().padStart(config.padding, '0');
    return `${prefix}${num}`;
  };

  const handleSplitConfirm = () => {
    if (!showNamingPanel) return;
    const { id, direction } = showNamingPanel;
    
    const target = findNodeById(structure, id);
    if (!target || target.type !== 'cell') return;

    const newChildren: StructureNode[] = Array.from({ length: namingConfig.count }).map((_, i) => ({
      id: `cell-${Math.random().toString(36).substr(2, 9)}`,
      type: 'cell',
      size: 1 / namingConfig.count,
      displayLabel: generateLabel(namingConfig.type, i, namingConfig),
      label: `${target.label || 'Cell'} ${i + 1}`, // Internal descriptive name
      locationId: (i === namingConfig.inheritLocationIdx && target.locationId) ? target.locationId : null,
    }));

    const newContainer: StructureNode = {
      id: `container-${Math.random().toString(36).substr(2, 9)}`,
      type: 'container',
      label: `${target.displayLabel || target.label || 'Cell'} Split`,
      split: direction,
      splitType: namingConfig.type,
      size: target.size,
      children: newChildren,
      dividers: Array.from({ length: namingConfig.count - 1 }).map(() => ({
        id: `divider-${Math.random().toString(36).substr(2, 9)}`,
        type: namingConfig.dividerType,
        thickness: namingConfig.dividerThickness,
        material: namingConfig.dividerMaterial,
        color: namingConfig.dividerColor
      }))
    };

    updateStructure(replaceNodeById(structure, id, newContainer));
    onSelectCells([newChildren[0].id]);
    setShowNamingPanel(null);
  };

  const handleSplit = (direction: 'horizontal' | 'vertical', targetId?: string) => {
    const idToSplit = targetId || (selectedCellIds.length > 0 ? selectedCellIds[selectedCellIds.length - 1] : null);
    if (!idToSplit) return;
    
    setNamingConfig(prev => ({
      ...prev,
      type: direction === 'horizontal' ? 'rows' : 'columns',
      count: 2
    }));
    setShowNamingPanel({ id: idToSplit, direction });
  };

  const handleWheel = (e: React.WheelEvent) => {
    const scaleFactor = 1.1;
    const direction = e.deltaY < 0 ? 1 : -1;
    const newZoom = direction > 0 ? zoomLevel * scaleFactor : zoomLevel / scaleFactor;
    setZoomLevel(Math.max(0.1, Math.min(5, newZoom)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && (e.altKey || tool === 'pan'))) {
      if (e.button === 1) e.preventDefault();
      setIsPanning(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleCompleteSetup = () => {
    const rootId = `root-${node.id}`;
    const newLocations: LogicalLocation[] = [];
    const parentLocId = node.locationId;

    const createLoc = (label: string, code: string, role: string) => {
      const id = `l-${Math.random().toString(36).substr(2, 9)}`;
      newLocations.push({
        id,
        branchId: locations[0]?.branchId || 'main-branch',
        code: code,
        name: `${node.label} - ${label}`,
        parentId: parentLocId,
        role: role as any,
        capabilities: {
            canStoreInventory: true,
            canReceive: true,
            canPick: true,
            canShip: false,
            canReserve: true,
            isVirtual: false,
            isTemporary: false
        },
        status: 'active',
        pathCode: code,
        pathName: `${node.label} - ${label}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return id;
    };

    const createDivider = (type: 'solid' | 'gap', thickness: number, material: 'wood' | 'metal' | 'plastic' | 'empty' | 'custom') => ({
      id: `divider-${Math.random().toString(36).substr(2, 9)}`,
      type,
      thickness,
      material,
      color: material === 'wood' ? '#78350f' : material === 'metal' ? '#475569' : material === 'plastic' ? '#0ea5e9' : undefined,
    });

    let initialStructure: StructureNode = {
      id: rootId,
      type: 'cell',
      size: 1,
      label: node.label,
      displayLabel: node.label.toUpperCase()
    };

    // Helper to add frame to root
    const wrapWithFrame = (s: StructureNode): StructureNode => {
      if (!setupData.hasFrame) return s;
      const material = setupData.frameMaterial;
      const color = material === 'wood' ? '#78350f' : material === 'metal' ? '#475569' : material === 'plastic' ? '#0ea5e9' : undefined;
      
      return {
        ...s,
        frame: {
          top: { id: 'frame-t', type: setupData.frameType, thickness: setupData.frameThickness, material: setupData.frameMaterial, color },
          bottom: { id: 'frame-b', type: setupData.frameType, thickness: setupData.frameThickness, material: setupData.frameMaterial, color },
          left: { id: 'frame-l', type: setupData.frameType, thickness: setupData.frameThickness, material: setupData.frameMaterial, color },
          right: { id: 'frame-r', type: setupData.frameType, thickness: setupData.frameThickness, material: setupData.frameMaterial, color },
        }
      };
    };

    // Template logic
    if (setupData.template === 'shelves' || setupData.template === 'rows') {
      const count = setupData.rowCount;
      const type = setupData.template === 'shelves' ? 'shelves' : 'rows';
      const locType = setupData.template === 'shelves' ? 'shelf' : 'rack';

      const children: StructureNode[] = Array.from({ length: count }).map((_, i) => {
        const shortCode = `${setupData.template === 'shelves' ? 'S' : 'R'}${i + 1}`;
        const locId = setupData.generateLocations ? createLoc(`${type.slice(0, -1)} ${i + 1}`, `${node.label}-${shortCode}`, locType) : null;
        
        return {
          id: `cell-${Math.random().toString(36).substr(2, 9)}`,
          type: 'cell',
          size: 1 / count,
          displayLabel: shortCode,
          label: `${setupData.template === 'shelves' ? 'Shelf' : 'Row'} ${i + 1}`,
          splitType: type as any,
          locationId: locId
        };
      });

      initialStructure = {
        id: `root-${node.id}`, // Use consistent root ID
        type: 'container',
        label: node.label,
        displayLabel: node.label.toUpperCase(),
        split: 'horizontal',
        splitType: type as any,
        size: 1,
        children,
        dividers: Array.from({ length: count - 1 }).map(() => createDivider(setupData.dividerRowType, setupData.dividerRowThickness, setupData.dividerRowMaterial))
      };
    } else if (setupData.template === 'columns') {
      const count = setupData.colCount;
      const children: StructureNode[] = Array.from({ length: count }).map((_, i) => {
        const shortCode = `C${i + 1}`;
        const locId = setupData.generateLocations ? createLoc(`Column ${i + 1}`, `${node.label}-${shortCode}`, 'rack') : null;

        return {
          id: `cell-${Math.random().toString(36).substr(2, 9)}`,
          type: 'cell',
          size: 1 / count,
          displayLabel: shortCode,
          label: `Column ${i + 1}`,
          splitType: 'columns',
          locationId: locId
        };
      });

      initialStructure = {
        id: `root-${node.id}`, // Use consistent root ID
        type: 'container',
        label: node.label,
        displayLabel: node.label.toUpperCase(),
        split: 'vertical',
        splitType: 'columns',
        size: 1,
        children,
        dividers: Array.from({ length: count - 1 }).map(() => createDivider(setupData.dividerColType, setupData.dividerColThickness, setupData.dividerColMaterial))
      };
    } else if (setupData.template === 'grid') {
      const rows = setupData.rowCount;
      const cols = setupData.colCount;
      
      if (setupData.primaryDivider === 'col') {
        const colChildren: StructureNode[] = Array.from({ length: cols }).map((_, cIdx) => {
          const rowChildren: StructureNode[] = Array.from({ length: rows }).map((_, rIdx) => {
            const shortCode = `R${rIdx + 1}C${cIdx + 1}`;
            const locId = setupData.generateLocations ? createLoc(`Position R${rIdx + 1} C${cIdx + 1}`, `${node.label}-${shortCode}`, 'bin') : null;

            return {
              id: `cell-${Math.random().toString(36).substr(2, 9)}`,
              type: 'cell',
              size: 1 / rows,
              displayLabel: shortCode,
              label: `Position R${rIdx + 1} C${cIdx + 1}`,
              locationId: locId
            };
          });

          return {
            id: `col-${Math.random().toString(36).substr(2, 9)}`,
            type: 'container',
            split: 'horizontal',
            size: 1 / cols,
            children: rowChildren,
            dividers: Array.from({ length: rows - 1 }).map(() => createDivider(setupData.dividerRowType, setupData.dividerRowThickness, setupData.dividerRowMaterial))
          };
        });

        initialStructure = {
          id: `root-${node.id}`, // Use consistent root ID
          type: 'container',
          label: node.label,
          displayLabel: node.label.toUpperCase(),
          split: 'vertical',
          size: 1,
          children: colChildren,
          dividers: Array.from({ length: cols - 1 }).map(() => createDivider(setupData.dividerColType, setupData.dividerColThickness, setupData.dividerColMaterial))
        };
      } else {
        const rowChildren: StructureNode[] = Array.from({ length: rows }).map((_, rIdx) => {
          const colChildren: StructureNode[] = Array.from({ length: cols }).map((_, cIdx) => {
            const shortCode = `R${rIdx + 1}C${cIdx + 1}`;
            const locId = setupData.generateLocations ? createLoc(`Position R${rIdx + 1} C${cIdx + 1}`, `${node.label}-${shortCode}`, 'bin') : null;

            return {
              id: `cell-${Math.random().toString(36).substr(2, 9)}`,
              type: 'cell',
              size: 1 / cols,
              displayLabel: shortCode,
              label: `Position R${rIdx + 1} C${cIdx + 1}`,
              locationId: locId
            };
          });

          return {
            id: `row-${Math.random().toString(36).substr(2, 9)}`,
            type: 'container',
            split: 'vertical',
            size: 1 / rows,
            children: colChildren,
            dividers: Array.from({ length: cols - 1 }).map(() => createDivider(setupData.dividerColType, setupData.dividerColThickness, setupData.dividerColMaterial))
          };
        });

        initialStructure = {
          id: `root-${node.id}`, // Use consistent root ID
          type: 'container',
          label: node.label,
          displayLabel: node.label.toUpperCase(),
          split: 'horizontal',
          size: 1,
          children: rowChildren,
          dividers: Array.from({ length: rows - 1 }).map(() => createDivider(setupData.dividerRowType, setupData.dividerRowThickness, setupData.dividerRowMaterial))
        };
      }
    } else if (setupData.template === 'wall_bins') {
      const rows = setupData.rowCount;
      const cols = setupData.colCount;

      if (setupData.primaryDivider === 'col') {
        const colChildren: StructureNode[] = Array.from({ length: cols }).map((_, cIdx) => {
          const rowChildren: StructureNode[] = Array.from({ length: rows }).map((_, rIdx) => {
            const binNum = (rIdx * cols + cIdx + 1).toString().padStart(2, '0');
            const shortCode = `K${binNum}`;
            const locId = setupData.generateLocations ? createLoc(`Bin ${rIdx * cols + cIdx + 1}`, `${node.label}-${shortCode}`, 'bin') : null;

            return {
              id: `cell-${Math.random().toString(36).substr(2, 9)}`,
              type: 'cell',
              size: 1 / rows,
              displayLabel: shortCode,
              label: `Bin ${rIdx * cols + cIdx + 1}`,
              splitType: 'bins',
              locationId: locId
            };
          });

          return {
            id: `bin-col-${Math.random().toString(36).substr(2, 9)}`,
            type: 'container',
            split: 'horizontal',
            size: 1 / cols,
            children: rowChildren,
            dividers: Array.from({ length: rows - 1 }).map(() => createDivider(setupData.dividerRowType, setupData.dividerRowThickness, setupData.dividerRowMaterial))
          };
        });

        initialStructure = {
          id: `root-${node.id}`, // Use consistent root ID
          type: 'container',
          label: node.label,
          displayLabel: node.label.toUpperCase(),
          split: 'vertical',
          size: 1,
          children: colChildren,
          dividers: Array.from({ length: cols - 1 }).map(() => createDivider(setupData.dividerColType, setupData.dividerColThickness, setupData.dividerColMaterial))
        };
      } else {
        const rowChildren: StructureNode[] = Array.from({ length: rows }).map((_, rIdx) => {
          const colChildren: StructureNode[] = Array.from({ length: cols }).map((_, cIdx) => {
            const binNum = (rIdx * cols + cIdx + 1).toString().padStart(2, '0');
            const shortCode = `K${binNum}`;
            const locId = setupData.generateLocations ? createLoc(`Bin ${rIdx * cols + cIdx + 1}`, `${node.label}-${shortCode}`, 'bin') : null;

            return {
              id: `cell-${Math.random().toString(36).substr(2, 9)}`,
              type: 'cell',
              size: 1 / cols,
              displayLabel: shortCode,
              label: `Bin ${rIdx * cols + cIdx + 1}`,
              splitType: 'bins',
              locationId: locId
            };
          });

          return {
            id: `bin-row-${Math.random().toString(36).substr(2, 9)}`,
            type: 'container',
            split: 'vertical',
            size: 1 / rows,
            children: colChildren,
            dividers: Array.from({ length: cols - 1 }).map(() => createDivider(setupData.dividerColType, setupData.dividerColThickness, setupData.dividerColMaterial))
          };
        });

        initialStructure = {
          id: `root-${node.id}`, // Use consistent root ID
          type: 'container',
          label: node.label,
          displayLabel: node.label.toUpperCase(),
          split: 'horizontal',
          size: 1,
          children: rowChildren,
          dividers: Array.from({ length: rows - 1 }).map(() => createDivider(setupData.dividerRowType, setupData.dividerRowThickness, setupData.dividerRowMaterial))
        };
      }
    }

    initialStructure = wrapWithFrame(initialStructure);

    onUpdateNode(node.id, {
      width: setupData.width,
      height: setupData.height,
      depth: setupData.depth,
      frontSide: setupData.frontSide,
      frontSetupDone: true,
      structure: initialStructure,
      style: {
        ...node.style,
        cornerRadiusTopLeft: setupData.cornerRadiusTopLeft,
        cornerRadiusTopRight: setupData.cornerRadiusTopRight,
        cornerRadiusBottomRight: setupData.cornerRadiusBottomRight,
        cornerRadiusBottomLeft: setupData.cornerRadiusBottomLeft,
        isCornerRadiusLocked: setupData.isCornerRadiusLocked,
      }
    });

    if (newLocations.length > 0 && onAddLocations) {
      onAddLocations(newLocations);
    }
  };

  const handleUpdateCell = (cellId: string, updates: Partial<StructureNode>) => {
    const updateRecursive = (node: StructureNode): StructureNode => {
      if (node.id === cellId) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return { ...node, children: node.children.map(updateRecursive) };
      }
      return node;
    };
    const newStructure = updateRecursive(structure);
    onUpdateNode(node.id, { structure: newStructure });
  };

  const handleResize = (containerId: string, layout: Record<string, number>) => {
    const container = findNodeById(structure, containerId);
    if (!container || !container.children) return;

    const newChildren = container.children.map((child) => ({
      ...child,
      size: (layout[child.id] || (child.size * 100)) / 100
    }));

    updateStructure(replaceNodeById(structure, containerId, { ...container, children: newChildren }));
  };

  const AdaptiveLabel = ({ node, isSelected, skin }: { node: StructureNode, isSelected: boolean, skin?: SectionSkin | null }) => {
    const label = node.displayLabel || node.label || '...';
    
    if (skin?.labelPosition) {
      return (
        <div 
          className="absolute flex items-center justify-center overflow-hidden"
          style={{
            left: `${skin.labelPosition.x}%`,
            top: `${skin.labelPosition.y}%`,
            width: `${skin.labelPosition.width}%`,
            height: `${skin.labelPosition.height}%`,
          }}
        >
          <span 
            className="text-[9px] font-black text-white/90 uppercase tracking-tighter truncate px-1 bg-slate-950/20 backdrop-blur-[1px] rounded-[1px]"
            title={label}
          >
            {label}
          </span>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center p-1">
        <div className="flex flex-col items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-300 uppercase tracking-widest break-all text-center leading-tight">
            {label}
          </span>
        </div>
      </div>
    );
  };

  const renderRecursive = (sNode: StructureNode): React.ReactNode => {
    if (sNode.type === 'cell') {
      const isSelected = selectedCellIds?.includes(sNode.id);
      const linkedLocation = sNode.locationId ? locations.find(l => l.id === sNode.locationId) : null;
      const skin = sNode.skin ? SECTION_SKINS.find(s => s.id === sNode.skin) : null;

      return (
        <div
          key={sNode.id}
          id={sNode.id}
          onClick={(e) => {
            e.stopPropagation();
            if (e.shiftKey) {
              onSelectCells(prev => 
                prev?.includes(sNode.id) ? prev.filter(id => id !== sNode.id) : [...(prev || []), sNode.id]
              );
            } else {
              onSelectCells([sNode.id]);
            }
            onSelectDividers([]);
            setSelectedFrameEdge(null);
          }}
          className={`relative group flex-1 h-full border transition-all overflow-hidden
            ${sNode.locked ? 'cursor-not-allowed' : 'cursor-pointer'}
            ${isSelected 
              ? (skin 
                  ? (sNode.locked ? 'bg-amber-500/5 border-transparent z-10' : 'bg-sky-500/5 border-transparent z-10')
                  : (sNode.locked 
                      ? 'bg-amber-500/10 border-amber-500 z-10 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                      : 'bg-sky-500/10 border-sky-500 z-10 shadow-[0_0_15px_rgba(14,165,233,0.1)]')) 
              : 'bg-slate-900 border-slate-800/50 hover:border-slate-600 hover:bg-slate-800/50'
            }
          `}
        >
          {skin && (
            <>
              <div className="absolute inset-0 z-0">
                 {skin.render(sNode.color || node.color)}
              </div>
              {isSelected && (
                <div className={`absolute inset-0 z-10 pointer-events-none ${sNode.locked ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'drop-shadow-[0_0_8px_rgba(14,165,233,0.8)]'}`}>
                   {skin.render(sNode.locked ? '#f59e0b' : '#0ea5e9', 2)}
                </div>
              )}
            </>
          )}
          
          <div className="absolute inset-0 pointer-events-none">
             <AdaptiveLabel node={sNode} isSelected={isSelected} skin={skin} />
          </div>

          <div className="absolute top-1 right-1 flex items-center gap-1 z-20">
            {sNode.locked && (
              <div className="w-4 h-4 bg-slate-900/80 rounded flex items-center justify-center border border-slate-700/50 backdrop-blur-sm" title="Locked">
                <Lock className="w-2.5 h-2.5 text-slate-400" />
              </div>
            )}
  
            {linkedLocation && (
              <div className="w-4 h-4 bg-emerald-500/10 rounded flex items-center justify-center border border-emerald-500/20 backdrop-blur-sm" title="Mapped to Location">
                <LinkIcon className="w-2.5 h-2.5 text-emerald-500" />
              </div>
            )}
          </div>
        </div>
      );
    }

    const isHorizontal = sNode.split === 'horizontal';

    const content = (
      <ResizablePanelGroup 
        key={`${sNode.id}-${sNode.children?.length}`}
        orientation={isHorizontal ? 'vertical' : 'horizontal'}
        onLayoutChange={(layout) => handleResize(sNode.id, layout)}
        className="flex-1 h-full w-full"
      >
        {sNode.children?.map((child, idx) => {
          const divider = sNode.dividers?.[idx];
          const isLast = idx === sNode.children!.length - 1;
          const nextChild = !isLast ? sNode.children![idx + 1] : null;

          // A divider is locked if it touches ANY locked node in its subtrees
          const isHandleLocked = sNode.locked || isAnyNodeInSubtreeLocked(child) || (nextChild ? isAnyNodeInSubtreeLocked(nextChild) : false);

          return (
            <React.Fragment key={child.id}>
              <ResizablePanel 
                id={child.id}
                defaultSize={(child.size || 1) * 100}
                minSize={5}
                className="flex flex-col"
              >
                {renderRecursive(child)}
              </ResizablePanel>
              {!isLast && (
                <ResizableHandle 
                  disabled={isHandleLocked}
                  style={{
                    backgroundColor: divider?.type === 'solid' ? (divider.color || '#475569') : 'transparent',
                    width: !isHorizontal ? `${(divider?.thickness || 1) * totalScale}px` : '100%',
                    height: isHorizontal ? `${(divider?.thickness || 1) * totalScale}px` : '100%',
                    opacity: divider?.opacity ?? 1,
                  }}
                  className={cn(
                    "relative transition-all !bg-opacity-100",
                    isHandleLocked && "opacity-80 pointer-events-none",
                    selectedDividerIds?.includes(divider?.id || '') ? "ring-2 ring-sky-500 z-30" : "hover:bg-sky-500/30",
                    divider?.type === 'gap' && "border-slate-800/20 shadow-inner"
                  )}
                  onClick={(e) => {
                    if (isHandleLocked) return;
                    if (divider) {
                      e.stopPropagation();
                      if (e.metaKey || e.ctrlKey) {
                        onSelectDividers(
                          selectedDividerIds?.includes(divider.id) ? selectedDividerIds.filter(id => id !== divider.id) : [...(selectedDividerIds || []), divider.id]
                        );
                      } else {
                        onSelectDividers([divider.id]);
                      }
                      onSelectCells([]);
                      setSelectedFrameEdge(null);
                    }
                  }}
                >
                  {/* Hit Area */}
                  <div className={cn(
                    "absolute z-10 cursor-pointer",
                    isHorizontal 
                      ? "-top-2 -bottom-2 left-0 right-0" 
                      : "-left-2 -right-2 top-0 bottom-0"
                  )} />

                  {divider?.type === 'gap' && (
                    <div className="absolute inset-0 border border-dashed border-slate-700/20 pointer-events-none" />
                  )}
                </ResizableHandle>
              )}
            </React.Fragment>
          );
        })}
      </ResizablePanelGroup>
    );

    // Apply frame if present for this container
    if (sNode.frame) {
      const { top, bottom, left, right } = sNode.frame;
      return (
        <div className="flex-1 h-full w-full flex flex-col bg-slate-900">
           {top && (
             <div 
               onClick={(e) => { e.stopPropagation(); onSelectDividers([top.id]); onSelectCells([]); }}
               className={`shrink-0 transition-all cursor-pointer ${selectedDividerIds?.includes(top.id) ? 'ring-2 ring-sky-500 z-30' : 'hover:bg-sky-500/10'}`}
               style={{ height: `${top.thickness * totalScale}px`, backgroundColor: top.type === 'solid' ? top.color || '#1e293b' : 'transparent' }}
             />
           )}
           <div className="flex-1 flex flex-row min-h-0">
              {left && (
                <div 
                  onClick={(e) => { e.stopPropagation(); onSelectDividers([left.id]); onSelectCells([]); }}
                  className={`shrink-0 transition-all cursor-pointer ${selectedDividerIds?.includes(left.id) ? 'ring-2 ring-sky-500 z-30' : 'hover:bg-sky-500/10'}`}
                  style={{ width: `${left.thickness * totalScale}px`, backgroundColor: left.type === 'solid' ? left.color || '#1e293b' : 'transparent' }}
                />
              )}

              <div className="flex-1 min-w-0 flex flex-col">
                {content}
              </div>
              {right && (
                <div 
                  onClick={(e) => { e.stopPropagation(); onSelectDividers([right.id]); onSelectCells([]); }}
                  className={`shrink-0 transition-all cursor-pointer ${selectedDividerIds?.includes(right.id) ? 'ring-2 ring-sky-500 z-30' : 'hover:bg-sky-500/10'}`}
                  style={{ width: `${right.thickness * totalScale}px`, backgroundColor: right.type === 'solid' ? right.color || '#1e293b' : 'transparent' }}
                />
              )}
           </div>
           {bottom && (
             <div 
               onClick={(e) => { e.stopPropagation(); onSelectDividers([bottom.id]); onSelectCells([]); }}
               className={`shrink-0 transition-all cursor-pointer ${selectedDividerIds?.includes(bottom.id) ? 'ring-2 ring-sky-500 z-30' : 'hover:bg-sky-500/10'}`}
               style={{ height: `${bottom.thickness * totalScale}px`, backgroundColor: bottom.type === 'solid' ? bottom.color || '#1e293b' : 'transparent' }}
             />
           )}
        </div>
      );
    }

    return content;
  };

  const Ruler = ({ orientation }: { orientation: 'horizontal' | 'horizontal-bottom' | 'vertical' | 'vertical-right' }) => {
    if (dimensions.width === 0) return null;
    
    const isHorizontal = orientation.startsWith('horizontal');
    const isBottom = orientation === 'horizontal-bottom';
    const isRight = orientation === 'vertical-right';
    
    const majorStep = 50; // 50cm
    const minorStep = 10; // 10cm
    const ticks = [];
    
    // Bounds for world coordinates in cm
    const startWorldCm = (0 - (isHorizontal ? pan.x : pan.y)) / totalScale;
    const endWorldCm = ((isHorizontal ? dimensions.width : dimensions.height) - (isHorizontal ? pan.x : pan.y)) / totalScale;
    
    const limit = isHorizontal ? node.width : node.height;
    const startTick = Math.max(0, Math.floor(startWorldCm / minorStep) * minorStep);
    const endTick = Math.min(limit, Math.ceil(endWorldCm / minorStep) * minorStep);

    for (let val = startTick; val <= endTick; val += minorStep) {
      const isMajor = val % majorStep === 0;
      const px = (val * totalScale) + (isHorizontal ? pan.x : pan.y);
      
      ticks.push(
        <div 
          key={val}
          className={`absolute ${isMajor ? 'bg-slate-400' : 'bg-slate-700'}`}
          style={{
            [isHorizontal ? 'left' : 'top']: px,
            [isHorizontal ? 'width' : 'height']: '1.5px',
            [isHorizontal ? 'height' : 'width']: isMajor ? '100%' : '30%',
            [isHorizontal ? (isBottom ? 'top' : 'bottom') : (isRight ? 'left' : 'right')]: 0,
          }}
        >
          {isMajor && (
            <span 
              className={`absolute text-[8px] font-bold text-slate-500 whitespace-nowrap ${isHorizontal ? 'left-1' : 'top-1'} ${isHorizontal ? (isBottom ? 'top-1' : 'bottom-1') : (isRight ? 'left-1 rotate-90 origin-top-left' : 'right-1 rotate-90 origin-top-right')}`}
            >
              {val / 100}m
            </span>
          )}
        </div>
      );
    }

    return (
      <div 
        className={`absolute bg-[#0f172a]/90 backdrop-blur-sm border-slate-800 ${isHorizontal ? 'left-0 right-0 h-6' : 'top-0 bottom-0 w-6'} z-40`}
        style={{
          [isHorizontal ? 'top' : 'left']: isHorizontal ? (isBottom ? undefined : 0) : (isRight ? undefined : 0),
          bottom: isBottom ? 0 : undefined,
          right: isRight ? 0 : undefined,
          [isHorizontal ? 'borderBottomWidth' : 'borderRightWidth']: (isHorizontal && !isBottom) || (!isHorizontal && !isRight) ? '1px' : 0,
          [isHorizontal ? 'borderTopWidth' : 'borderLeftWidth']: (isHorizontal && isBottom) || (!isHorizontal && isRight) ? '1px' : 0,
          borderStyle: 'solid'
        }}
      >
        {ticks}
      </div>
    );
  };

  const cursorClass = useMemo(() => {
    if (isPanning) return 'cursor-grabbing';
    if (tool === 'pan') return 'cursor-grab';
    return 'cursor-default';
  }, [isPanning, tool]);

  if (!node.frontSetupDone) {
    return (
      <FrontSetupWizard 
        node={node} 
        locations={locations} 
        onComplete={handleCompleteSetup}
        wizardStep={wizardStep}
        setWizardStep={setWizardStep}
        setupData={setupData}
        setSetupData={setSetupData}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#020617] overflow-hidden relative" id="front-view-root">
      {/* Editor Main Canvas Area */}
      <div 
        ref={containerRef}
        className={cn("flex-1 relative overflow-hidden", cursorClass)}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            // Only clear internal selection if it exists
            if (selectedCellIds.length > 0 || selectedDividerIds.length > 0) {
              onSelectCells([]);
              onSelectDividers([]);
            }
            // We do NOT call onDeselect() here because it would deselect the node and exit front view
          }
        }}
      >
        {/* Naming Options Panel Overlay */}
        {createPortal(
          <AnimatePresence>
            {showNamingPanel && (
              <motion.div 
                key="naming-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-sm overflow-y-auto p-4 flex pointer-events-auto"
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
              >
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-slate-900 border border-slate-700 p-8 rounded-[2rem] shadow-2xl max-w-md w-full m-auto h-auto shrink-0 flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-4 mb-8 shrink-0">
                    <div className="p-3 bg-sky-500/10 rounded-2xl">
                      <Settings2 className="w-6 h-6 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">Split Options</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Define new compartment labels</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Split Type</label>
                      <select 
                        value={namingConfig.type}
                        onChange={(e) => setNamingConfig(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:ring-1 focus:ring-sky-500"
                      >
                        <option value="rows">Rows</option>
                        <option value="columns">Columns</option>
                        <option value="shelves">Shelves</option>
                        <option value="bins">Bins</option>
                        <option value="drawers">Drawers</option>
                        <option value="positions">Positions</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Quantity</label>
                      <input 
                        type="number"
                        min="2"
                        max="20"
                        value={namingConfig.count}
                        onChange={(e) => setNamingConfig(prev => ({ ...prev, count: parseInt(e.target.value) || 2 }))}
                        className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8 shrink-0">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Prefix</label>
                      <input 
                        type="text"
                        placeholder="e.g. R"
                        value={namingConfig.prefix}
                        onChange={(e) => setNamingConfig(prev => ({ ...prev, prefix: e.target.value }))}
                        className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Start At</label>
                      <input 
                        type="number"
                        value={namingConfig.startNumber}
                        onChange={(e) => setNamingConfig(prev => ({ ...prev, startNumber: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Padding</label>
                      <input 
                        type="number"
                        min="0"
                        max="4"
                        value={namingConfig.padding}
                        onChange={(e) => setNamingConfig(prev => ({ ...prev, padding: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-950/30 rounded-2xl p-4 mb-6 border border-white/5 space-y-4 shrink-0">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">New Divider Settings</label>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">Thickness (cm)</label>
                        <input 
                          type="number"
                          step="1"
                          value={namingConfig.dividerThickness}
                          onChange={(e) => setNamingConfig(prev => ({ ...prev, dividerThickness: Math.round(parseFloat(e.target.value) || 0) }))}
                          className="w-full bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-black text-white outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">Type</label>
                        <select 
                          value={namingConfig.dividerType}
                          onChange={(e) => setNamingConfig(prev => ({ ...prev, dividerType: e.target.value as any }))}
                          className="w-full bg-slate-800 border-none rounded-xl px-3 py-2 text-[10px] font-black text-white outline-none focus:ring-1 focus:ring-sky-500 uppercase tracking-widest"
                        >
                          <option value="solid">Solid</option>
                          <option value="gap">Gap</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">Material</label>
                        <select 
                          value={namingConfig.dividerMaterial}
                          onChange={(e) => setNamingConfig(prev => ({ 
                            ...prev, 
                            dividerMaterial: e.target.value as any,
                            dividerColor: e.target.value === 'wood' ? '#78350f' : e.target.value === 'metal' ? '#475569' : e.target.value === 'plastic' ? '#0ea5e9' : prev.dividerColor
                          }))}
                          className="w-full bg-slate-800 border-none rounded-xl px-3 py-2 text-[10px] font-black text-white outline-none focus:ring-1 focus:ring-sky-500 uppercase tracking-widest"
                        >
                          <option value="wood">Wood</option>
                          <option value="metal">Metal</option>
                          <option value="plastic">Plastic</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">Color</label>
                        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl">
                          <input 
                            type="color"
                            value={namingConfig.dividerColor}
                            onChange={(e) => setNamingConfig(prev => ({ ...prev, dividerColor: e.target.value }))}
                            className="w-6 h-6 rounded-lg border-none bg-transparent cursor-pointer"
                          />
                          <span className="text-[9px] font-mono font-bold text-slate-400">{(namingConfig.dividerColor).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#020617]/50 rounded-2xl p-4 mb-8 border border-white/5 shrink-0">
                    <div className="flex flex-col gap-4">
                      {findNodeById(structure, showNamingPanel.id)?.locationId && (
                        <div className="pt-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Preserve Location Link</label>
                           <div className="flex flex-wrap gap-2">
                              {Array.from({ length: namingConfig.count }).map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setNamingConfig(prev => ({ ...prev, inheritLocationIdx: i }))}
                                  className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${namingConfig.inheritLocationIdx === i ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-transparent text-slate-500 hover:text-white'}`}
                                >
                                  {(generateLabel(namingConfig.type, i, namingConfig))}
                                </button>
                              ))}
                              <button
                                onClick={() => setNamingConfig(prev => ({ ...prev, inheritLocationIdx: null }))}
                                className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${namingConfig.inheritLocationIdx === null ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-slate-800 border-transparent text-slate-500 hover:text-white'}`}
                              >
                                None (Clear)
                              </button>
                           </div>
                           <p className="text-[8px] text-slate-600 mt-2 font-bold italic">This section is linked to a location. Choose which child takes over the mapping.</p>
                        </div>
                      )}

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Preview</label>
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: Math.min(namingConfig.count, 6) }).map((_, i) => (
                            <div key={i} className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-black text-sky-400">
                              {generateLabel(namingConfig.type, i, namingConfig)}
                            </div>
                          ))}
                          {namingConfig.count > 6 && <span className="text-[10px] font-black text-slate-700 self-center">...</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 shrink-0">
                    <button 
                      onClick={() => setShowNamingPanel(null)}
                      className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSplitConfirm}
                      className="flex-1 py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_10px_30px_rgba(14,165,233,0.3)]"
                    >
                      Confirm Split
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
        {/* Rulers that follow the container */}
        <Ruler orientation="horizontal" />
        <Ruler orientation="horizontal-bottom" />
        <Ruler orientation="vertical" />
        <Ruler orientation="vertical-right" />

        {/* The Structure Container */}
        <div 
          className="absolute origin-top-left flex flex-col bg-slate-900 border-2 border-slate-800 shadow-2xl overflow-hidden"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            width: `${node.width * totalScale}px`,
            height: `${node.height * totalScale}px`,
            borderTopLeftRadius: `${(node.style?.cornerRadiusTopLeft || 0) * totalScale}px`,
            borderTopRightRadius: `${(node.style?.cornerRadiusTopRight || 0) * totalScale}px`,
            borderBottomRightRadius: `${(node.style?.cornerRadiusBottomRight || 0) * totalScale}px`,
            borderBottomLeftRadius: `${(node.style?.cornerRadiusBottomLeft || 0) * totalScale}px`,
          }}
        >
          {renderRecursive(structure)}
          
          {/* Grid Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-5"
            style={{
              backgroundImage: 'radial-gradient(circle, #808080 1px, transparent 1px)',
              backgroundSize: `${10 * totalScale}px ${10 * totalScale}px`
            }}
          />
        </div>
      </div>
    </div>
  );
}

