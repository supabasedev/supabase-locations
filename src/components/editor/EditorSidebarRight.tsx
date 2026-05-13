import { 
  VisualNode, 
  LogicalLocation, 
  Layout,
  ViewMode
} from '../../types';
import { 
  Info, 
  Maximize2, 
  Move, 
  Palette, 
  Link as LinkIcon, 
  Link2Off, 
  Trash2, 
  Archive, 
  Box, 
  QrCode, 
  ChevronRight,
  Package,
  History,
  AlertTriangle,
  Settings2,
  Database,
  Search,
  Plus,
  Map as MapIcon,
  Eye,
  Unlink,
  Layers,
  Square,
  Grid3X3,
  RotateCcw,
  RotateCw,
  LayoutGrid,
  GripHorizontal,
  Rows,
  Columns,
  Sparkles,
  Info as InfoIcon,
  Check,
  ChevronDown,
  Lock,
  Unlock,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  ArrowRightLeft,
  ArrowUpDown,
  Maximize
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  findNodeById, 
  findDividerInStructure, 
  getFullPath,
  replaceNodeById 
} from '../../lib/structureUtils';
import { StructureNode } from '../../types';
import { SECTION_SKINS } from '../../constants/skins';

interface SidebarRightProps {
  layout: Layout;
  selectedNode: VisualNode | null;
  selectedNodes: VisualNode[];
  selectedLocation: LogicalLocation | null;
  locations: LogicalLocation[];
  visuals: VisualNode[];
  viewMode: ViewMode;
  selectedFrontCellIds: string[];
  selectedFrontDividerIds: string[];
  onSelectFrontCell: (ids: string[] | ((prev: string[]) => string[])) => void;
  onSelectFrontDividers: (ids: string[]) => void;
  onUnlink: (nodeId: string) => void;
  onRemoveVisual: (nodeId: string) => void;
  onAssignLocation: (locationId: string) => void;
  onUpdateNode: (id: string, updates: Partial<VisualNode>) => void;
  onUpdateNodes: (updates: { id: string, updates: Partial<VisualNode> }[]) => void;
  onCreateLocationFromVisual: () => void;
  onSetViewMode: (mode: ViewMode) => void;
  onFrontSplit: (direction: 'horizontal' | 'vertical') => void;
  onBatchMap?: () => void;
  isLinking?: boolean;
  setIsLinking?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function EditorSidebarRight({ 
  layout,
  selectedNode, 
  selectedNodes,
  selectedLocation, 
  locations,
  visuals,
  viewMode,
  selectedFrontCellIds,
  selectedFrontDividerIds,
  onSelectFrontCell,
  onSelectFrontDividers,
  onUnlink,
  onRemoveVisual,
  onAssignLocation,
  onUpdateNode,
  onUpdateNodes,
  onCreateLocationFromVisual,
  onSetViewMode,
  onFrontSplit,
  onBatchMap,
  isLinking = false,
  setIsLinking = () => {}
}: SidebarRightProps) {
  
  const [rotationStep, setRotationStep] = useState(90);

  // Front View Selection Helpers
  const frontCells = useMemo(() => {
    if (selectedFrontCellIds.length === 0 || !selectedNode?.structure) return [];
    return selectedFrontCellIds.map(id => findNodeById(selectedNode.structure!, id)).filter((n): n is StructureNode => !!n);
  }, [selectedFrontCellIds, selectedNode?.structure]);

  const frontCell = frontCells.length === 1 ? frontCells[0] : null;

  const frontDivider = useMemo(() => {
    if (selectedFrontDividerIds.length === 0 || !selectedNode?.structure) return null;
    return findDividerInStructure(selectedNode.structure, selectedFrontDividerIds[0]);
  }, [selectedFrontDividerIds, selectedNode?.structure]);

  const frontPath = useMemo(() => {
    if (selectedFrontCellIds.length === 0 || !selectedNode?.structure) return '';
    return getFullPath(selectedNode.structure, selectedFrontCellIds[selectedFrontCellIds.length - 1]);
  }, [selectedFrontCellIds, selectedNode?.structure]);

  const updateFrontCells = (ids: string[], updates: Partial<StructureNode>) => {
    if (!selectedNode?.structure) return;
    let newStructure = selectedNode.structure;
    for (const id of ids) {
       const node = findNodeById(newStructure, id);
       if (node) {
         newStructure = replaceNodeById(newStructure, id, { ...node, ...updates });
       }
    }
    onUpdateNode(selectedNode.id, { structure: newStructure });
  };

  const updateFrontDividers = (ids: string[], updates: any) => {
    if (!selectedNode?.structure) return;
    
    let newStructure = selectedNode.structure;
    for (const id of ids) {
      const res = findDividerInStructure(newStructure, id);
      if (!res) continue;
      const { parent, divider } = res;
      const newParent = { ...parent };
      
      if (newParent.dividers) {
        newParent.dividers = newParent.dividers.map(d => 
          d?.id === id ? { ...d, ...updates } : d
        );
      }
      
      if (newParent.frame) {
        const newFrame = { ...newParent.frame };
        for (const edge of ['top', 'bottom', 'left', 'right'] as const) {
          if (newFrame[edge as keyof typeof newFrame]?.id === id) {
            newFrame[edge as keyof typeof newFrame] = { ...newFrame[edge as keyof typeof newFrame]!, ...updates };
          }
        }
        newParent.frame = newFrame;
      }
      
      newStructure = replaceNodeById(newStructure, parent.id, newParent);
    }
    onUpdateNode(selectedNode.id, { structure: newStructure });
  };

  const deleteFrontCells = (ids: string[]) => {
    if (!selectedNode?.structure) return;
    
    let newStructure: StructureNode | null = selectedNode.structure;
    
    const deleteNode = (root: StructureNode, id: string): StructureNode | null => {
      if (root.id === id) return null;
      if (!root.children) return root;

      const filteredChildren = root.children
        .map(c => deleteNode(c, id))
        .filter((c): c is StructureNode => c !== null);

      if (filteredChildren.length === 0) {
         return { ...root, type: 'cell', children: undefined };
      }
      
      if (filteredChildren.length === 1) {
        return filteredChildren[0];
      }

      return { ...root, children: filteredChildren };
    };

    for (const id of ids) {
      if (newStructure) {
        // Prevent deleting root
        if (id === selectedNode.structure.id) continue;
        newStructure = deleteNode(newStructure, id);
      }
    }

    if (newStructure) {
      onUpdateNode(selectedNode.id, { structure: newStructure });
      onSelectFrontCell([]);
    }
  };

  const deleteFrontDividers = (ids: string[]) => {
    if (!selectedNode?.structure) return;
    let newStructure = selectedNode.structure;
    
    for (const idToDelete of ids) {
        const res = findDividerInStructure(newStructure, idToDelete);
        if (!res) continue;
        const { parent } = res;
        const newParent = { ...parent };
        if (newParent.dividers) {
           newParent.dividers = newParent.dividers.map(d => d?.id === idToDelete ? null : d);
        }
        if (newParent.frame) {
           const newFrame = { ...newParent.frame };
           for (const edge of ['top', 'bottom', 'left', 'right'] as const) {
              if (newFrame[edge as keyof typeof newFrame]?.id === idToDelete) {
                 delete newFrame[edge as keyof typeof newFrame];
              }
           }
           newParent.frame = newFrame;
        }
        newStructure = replaceNodeById(newStructure, parent.id, newParent);
    }
    onUpdateNode(selectedNode.id, { structure: newStructure });
    onSelectFrontDividers([]);
  };

  const hasFrontSubSelection = viewMode === ViewMode.FRONT && (selectedFrontCellIds.length > 0 || (!!frontDivider && selectedFrontDividerIds.length > 0));

  if (!selectedNode && !selectedLocation) {
    const rootVisual = visuals.find(v => v.parentId === null && v.type === 'zone');
    
    return (
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden z-30">
        <div className="flex border-b border-slate-800 bg-slate-950/50">
           <div className="p-4 flex-1 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Summary</h3>
              <Settings2 className="w-3.5 h-3.5 text-slate-700" />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-800">
           {/* Blueprint Info */}
           <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4 shadow-lg shadow-sky-500/10">
                 <MapIcon className="w-8 h-8" />
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Active Project</p>
                 <h2 className="text-xl font-bold text-white tracking-tight uppercase">{layout.name}</h2>
                 <p className="text-[10px] text-slate-600 font-bold mt-1 uppercase">Root: {rootVisual?.label || 'Spatial Environment'}</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                 <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-750">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Spatial Bounds</p>
                    <div className="flex items-center justify-between">
                       <p className="text-xs font-bold text-slate-300">Dimensions</p>
                       <p className="text-xs font-mono font-bold text-sky-400">{rootVisual ? `${rootVisual.width / 10}cm x ${rootVisual.depth / 10}cm` : 'N/A'}</p>
                    </div>
                 </div>

                 <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-750">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Project Statistics</p>
                    <div className="space-y-3">
                       <StatRow label="Visual Nodes" value={visuals.length.toString()} />
                       <StatRow label="Mapped" value={visuals.filter(v => v.locationId).length.toString()} />
                       <StatRow label="Logical Root" value={rootVisual?.locationId ? 'Linked' : 'Spatial-First'} />
                    </div>
                 </div>
              </div>

              <div className="space-y-2 pt-4">
                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 italic">Quick actions</p>
                 <button className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between group">
                    View Entire Plan
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                 </button>
                 <button className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between group">
                    Export Metadata
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Linked state
  const isLinked = selectedNode && selectedNode.locationId !== null;
  // Visual only state
  const isVisualOnly = selectedNode && selectedNode.locationId === null;
  // Location only state (selected from tree but not placed)
  const isLocationOnly = !selectedNode && selectedLocation;

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden z-30">
      <div className="flex border-b border-slate-800 bg-slate-950/50">
         <div className="p-4 flex-1 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Inspector</h3>
            <Settings2 className="w-3.5 h-3.5 text-slate-700" />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 p-4 space-y-8">
        
        {/* TOP DOWN MULTI-SELECTION */}
        {selectedNodes.length > 1 && viewMode === ViewMode.TOP_DOWN && (
          <section className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <SectionHeader icon={<Layers />} label={`${selectedNodes.length} Objects Selected`} />
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    const allLocked = selectedNodes.every(n => n.locked);
                    onUpdateNodes(selectedNodes.map(n => ({ id: n.id, updates: { locked: !allLocked } })));
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${selectedNodes.every(n => n.locked) ? 'bg-amber-500/10 text-amber-400' : 'hover:bg-slate-800 text-slate-500 hover:text-white'}`}
                  title="Toggle Lock for All"
                >
                  {selectedNodes.every(n => n.locked) ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            
              <div className="space-y-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-750">
                {/* Vertical Alignment - Aligns X values */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Vertical Alignment (X-Axis)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => {
                        const bboxes = selectedNodes.map(n => {
                          const rad = (n.rotation || 0) * Math.PI / 180;
                          const cos = Math.abs(Math.cos(rad));
                          const sin = Math.abs(Math.sin(rad));
                          const rw = n.width * cos + n.depth * sin;
                          return { id: n.id, x1: (n.x + n.width / 2) - rw / 2, rw, w: n.width, locked: n.locked };
                        });
                        const minX1 = Math.min(...bboxes.map(b => b.x1));
                        onUpdateNodes(bboxes.filter(b => !b.locked).map(b => ({ 
                          id: b.id, 
                          updates: { x: Math.round(minX1 + b.rw / 2 - b.w / 2) } 
                        })));
                      }}
                      className="p-2 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 rounded-xl flex flex-col items-center gap-1 transition-all group"
                    >
                      <AlignStartVertical className="w-4 h-4 text-slate-400 group-hover:text-white" />
                      <span className="text-[8px] font-black uppercase text-slate-500">Left</span>
                    </button>
                    <button 
                      onClick={() => {
                        const centers = selectedNodes.map(n => n.x + n.width / 2);
                        const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
                        onUpdateNodes(selectedNodes.filter(n => !n.locked).map(n => ({ id: n.id, updates: { x: Math.round(avgCenter - n.width / 2) } })));
                      }}
                      className="p-2 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 rounded-xl flex flex-col items-center gap-1 transition-all group"
                    >
                      <AlignCenterVertical className="w-4 h-4 text-slate-400 group-hover:text-white" />
                      <span className="text-[8px] font-black uppercase text-slate-500">Center</span>
                    </button>
                    <button 
                      onClick={() => {
                        const bboxes = selectedNodes.map(n => {
                          const rad = (n.rotation || 0) * Math.PI / 180;
                          const cos = Math.abs(Math.cos(rad));
                          const sin = Math.abs(Math.sin(rad));
                          const rw = n.width * cos + n.depth * sin;
                          return { id: n.id, x2: (n.x + n.width / 2) + rw / 2, rw, w: n.width, locked: n.locked };
                        });
                        const maxX2 = Math.max(...bboxes.map(b => b.x2));
                        onUpdateNodes(bboxes.filter(b => !b.locked).map(b => ({ 
                          id: b.id, 
                          updates: { x: Math.round(maxX2 - b.rw / 2 - b.w / 2) } 
                        })));
                      }}
                      className="p-2 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 rounded-xl flex flex-col items-center gap-1 transition-all group"
                    >
                      <AlignEndVertical className="w-4 h-4 text-slate-400 group-hover:text-white" />
                      <span className="text-[8px] font-black uppercase text-slate-500">Right</span>
                    </button>
                  </div>
                </div>

                {/* Horizontal Alignment - Aligns Y values (Depth) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Horizontal Alignment (Y-Axis)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => {
                        const bboxes = selectedNodes.map(n => {
                          const rad = (n.rotation || 0) * Math.PI / 180;
                          const cos = Math.abs(Math.cos(rad));
                          const sin = Math.abs(Math.sin(rad));
                          const rh = n.width * sin + n.depth * cos;
                          return { id: n.id, y1: (n.y + n.depth / 2) - rh / 2, rh, d: n.depth, locked: n.locked };
                        });
                        const minY1 = Math.min(...bboxes.map(b => b.y1));
                        onUpdateNodes(bboxes.filter(b => !b.locked).map(b => ({ 
                          id: b.id, 
                          updates: { y: Math.round(minY1 + b.rh / 2 - b.d / 2) } 
                        })));
                      }}
                      className="p-2 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 rounded-xl flex flex-col items-center gap-1 transition-all group"
                    >
                      <AlignStartHorizontal className="w-4 h-4 text-slate-400 group-hover:text-white" />
                      <span className="text-[8px] font-black uppercase text-slate-500">Top</span>
                    </button>
                    <button 
                      onClick={() => {
                        const centers = selectedNodes.map(n => n.y + n.depth / 2);
                        const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
                        onUpdateNodes(selectedNodes.filter(n => !n.locked).map(n => ({ id: n.id, updates: { y: Math.round(avgCenter - n.depth / 2) } })));
                      }}
                      className="p-2 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 rounded-xl flex flex-col items-center gap-1 transition-all group"
                    >
                      <AlignCenterHorizontal className="w-4 h-4 text-slate-400 group-hover:text-white" />
                      <span className="text-[8px] font-black uppercase text-slate-500">Middle</span>
                    </button>
                    <button 
                      onClick={() => {
                        const bboxes = selectedNodes.map(n => {
                          const rad = (n.rotation || 0) * Math.PI / 180;
                          const cos = Math.abs(Math.cos(rad));
                          const sin = Math.abs(Math.sin(rad));
                          const rh = n.width * sin + n.depth * cos;
                          return { id: n.id, y2: (n.y + n.depth / 2) + rh / 2, rh, d: n.depth, locked: n.locked };
                        });
                        const maxY2 = Math.max(...bboxes.map(b => b.y2));
                        onUpdateNodes(bboxes.filter(b => !b.locked).map(b => ({ 
                          id: b.id, 
                          updates: { y: Math.round(maxY2 - b.rh / 2 - b.d / 2) } 
                        })));
                      }}
                      className="p-2 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 rounded-xl flex flex-col items-center gap-1 transition-all group"
                    >
                      <AlignEndHorizontal className="w-4 h-4 text-slate-400 group-hover:text-white" />
                      <span className="text-[8px] font-black uppercase text-slate-500">Bottom</span>
                    </button>
                  </div>
                </div>

                {/* Distribution */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Distribute Space</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                        if (selectedNodes.length < 3) return;
                        const bboxes = selectedNodes.map(n => {
                          const rad = (n.rotation || 0) * Math.PI / 180;
                          const cos = Math.abs(Math.cos(rad));
                          const sin = Math.abs(Math.sin(rad));
                          const rw = n.width * cos + n.depth * sin;
                          return { id: n.id, x1: (n.x + n.width / 2) - rw / 2, rw, w: n.width, locked: n.locked };
                        });
                        const sorted = [...bboxes].sort((a, b) => a.x1 - b.x1);
                        const first = sorted[0];
                        const last = sorted[sorted.length - 1];
                        const totalSpan = (last.x1 + last.rw) - first.x1;
                        const totalWidths = sorted.reduce((sum, n) => sum + n.rw, 0);
                        const gap = (totalSpan - totalWidths) / (sorted.length - 1);
                        let currentX1 = first.x1;
                        onUpdateNodes(sorted.map(n => {
                          const targetX1 = currentX1;
                          currentX1 += n.rw + gap;
                          if (n.locked) return { id: n.id, updates: {} };
                          return { id: n.id, updates: { x: Math.round(targetX1 + n.rw / 2 - n.w / 2) } };
                        }).filter(u => Object.keys(u.updates).length > 0));
                      }}
                      className="p-2 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 rounded-xl flex flex-col items-center gap-1 transition-all group"
                    >
                      <ArrowRightLeft className="w-4 h-4 text-slate-400 group-hover:text-white" />
                      <span className="text-[8px] font-black uppercase text-slate-500">Horizontal</span>
                    </button>
                    <button 
                      onClick={() => {
                        if (selectedNodes.length < 3) return;
                        const bboxes = selectedNodes.map(n => {
                          const rad = (n.rotation || 0) * Math.PI / 180;
                          const cos = Math.abs(Math.cos(rad));
                          const sin = Math.abs(Math.sin(rad));
                          const rh = n.width * sin + n.depth * cos;
                          return { id: n.id, y1: (n.y + n.depth / 2) - rh / 2, rh, d: n.depth, locked: n.locked };
                        });
                        const sorted = [...bboxes].sort((a, b) => a.y1 - b.y1);
                        const first = sorted[0];
                        const last = sorted[sorted.length - 1];
                        const totalSpan = (last.y1 + last.rh) - first.y1;
                        const totalDepths = sorted.reduce((sum, n) => sum + n.rh, 0);
                        const gap = (totalSpan - totalDepths) / (sorted.length - 1);
                        let currentY1 = first.y1;
                        onUpdateNodes(sorted.map(n => {
                          const targetY1 = currentY1;
                          currentY1 += n.rh + gap;
                          if (n.locked) return { id: n.id, updates: {} };
                          return { id: n.id, updates: { y: Math.round(targetY1 + n.rh / 2 - n.d / 2) } };
                        }).filter(u => Object.keys(u.updates).length > 0));
                      }}
                      className="p-2 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 rounded-xl flex flex-col items-center gap-1 transition-all group"
                    >
                      <ArrowUpDown className="w-4 h-4 text-slate-400 group-hover:text-white" />
                      <span className="text-[8px] font-black uppercase text-slate-500">Vertical</span>
                    </button>
                  </div>
                </div>

              {/* Bulk Rotation */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bulk Rotation</label>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onUpdateNodes(selectedNodes.filter(n => !n.locked).map(n => ({ id: n.id, updates: { rotation: ((n.rotation || 0) + 90) % 360 } })))}
                      className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono text-sky-400">VARIES°</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 90, 180, 270].map(angle => (
                    <button
                      key={angle}
                      onClick={() => onUpdateNodes(selectedNodes.filter(n => !n.locked).map(n => ({ id: n.id, updates: { rotation: angle } })))}
                      className="py-2 bg-slate-900 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-400 hover:text-sky-400 hover:border-sky-500/50 transition-all"
                    >
                      {angle}°
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FRONT MULTI-SELECTION */}
        {selectedFrontCellIds.length > 1 && viewMode === ViewMode.FRONT && (
          <section className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <SectionHeader icon={<LayoutGrid />} label={`${selectedFrontCellIds.length} Compartments`} />
              <button 
                onClick={() => onSelectFrontCell([])}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-750">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Selected Items</label>
                <div className="space-y-1 mt-2">
                   {frontCells.slice(0, 5).map(cell => (
                     <div key={cell.id} className="text-[10px] text-slate-400 p-2 bg-slate-900/50 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span className="font-bold truncate max-w-[120px]">{cell.displayLabel || cell.label}</span>
                        <span className="text-[8px] opacity-50 font-mono">{cell.id.slice(0, 8)}...</span>
                     </div>
                   ))}
                   {frontCells.length > 5 && (
                     <div className="text-[8px] text-slate-600 italic px-2">+ {frontCells.length - 5} more...</div>
                   )}
                </div>
              </div>

              <div className="pt-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1 mb-2">Bulk Skin Assignment</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => updateFrontCells(selectedFrontCellIds, { skin: undefined })}
                    className="p-3 rounded-xl border border-slate-700 bg-slate-900/50 text-slate-500 hover:border-slate-600 transition-all flex flex-col items-center gap-2"
                  >
                    <Square className="w-5 h-5" />
                    <span className="text-[8px] font-black uppercase text-center">Standard</span>
                  </button>
                  {SECTION_SKINS.map(skin => (
                    <button
                      key={skin.id}
                      onClick={() => updateFrontCells(selectedFrontCellIds, { skin: skin.id })}
                      className="p-3 rounded-xl border border-slate-700 bg-slate-900/50 text-slate-500 hover:border-slate-600 transition-all flex flex-col items-center gap-2"
                    >
                      <skin.icon className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase text-center">{skin.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={() => deleteFrontCells(selectedFrontCellIds)}
                disabled={frontCells.some(c => c.type === 'container' && c.children && c.children.length > 0)}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {frontCells.some(c => c.type === 'container' && c.children && c.children.length > 0) 
                  ? "Contains Sections (Cannot Delete)" 
                  : "Delete All Selected"}
              </button>
            </div>
          </section>
        )}

        {/* SINGLE SELECTION / INDIVIDUAL OPTIONS (ONLY IF NOT IN MULTI-SELECT) */}
        {selectedNodes.length <= 1 && selectedFrontCellIds.length <= 1 && (
          <>
            {/* Front View Selection Inspectors */}
            {viewMode === ViewMode.FRONT && (
              <>
                {frontCell && (
                  <section className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                      <SectionHeader icon={<LayoutGrid />} label={frontCell.type === 'container' ? 'Container Section' : 'Compartment'} />
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => updateFrontCells([frontCell.id], { locked: !frontCell.locked })}
                          className={`p-1.5 rounded-lg transition-colors ${frontCell.locked ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'hover:bg-slate-800 text-slate-400 hover:text-rose-400'}`}
                          title={frontCell.locked ? "Unlock Section" : "Lock Section"}
                        >
                          {frontCell.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <div className="w-px h-3 bg-slate-700 mx-0.5" />
                        
                        {!frontCell.locked && frontCell.type !== 'container' && (
                          <>
                            <button 
                              onClick={() => {
                                onFrontSplit?.('horizontal');
                              }}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-400 transition-colors"
                              title="Split into Rows"
                            >
                              <Rows className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                onFrontSplit?.('vertical');
                              }}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-400 transition-colors"
                              title="Split into Columns"
                            >
                              <Columns className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-px h-3 bg-slate-700 mx-0.5" />
                            {onBatchMap && (
                              <button 
                                onClick={onBatchMap}
                                className="p-1.5 hover:bg-slate-800 rounded-lg text-sky-400 hover:text-sky-300 transition-colors"
                                title="Batch Map Locations"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <div className="w-px h-3 bg-slate-700 mx-0.5" />
                          </>
                        )}
                        <button 
                          onClick={() => onSelectFrontCell([])}
                          className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                </div>

                <div className="space-y-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-750">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Display Label</label>
                    <input 
                      type="text"
                      value={frontCell.displayLabel || frontCell.label || frontCell.id}
                      onChange={(e) => updateFrontCells([frontCell.id], { displayLabel: e.target.value.toUpperCase() })}
                      disabled={frontCell.locked}
                      className={`w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-black text-sm outline-none transition-all ${frontCell.locked ? 'opacity-50 cursor-not-allowed' : 'focus:ring-1 focus:ring-sky-500'}`}
                      placeholder="LABEL"
                    />
                  </div>

                  {!frontCell.locked && frontCell.type !== 'container' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Logical mapping</label>
                        <select 
                          value={frontCell.locationId || ''}
                          onChange={(e) => updateFrontCells([frontCell.id], { locationId: e.target.value || null })}
                          className="w-full bg-slate-900/50 border border-slate-700 text-xs font-black text-slate-300 rounded-xl px-4 py-2.5 outline-none cursor-pointer hover:bg-slate-800 transition-all focus:ring-1 focus:ring-sky-500 appearance-none"
                        >
                          <option value="">Virtual Node (Only)</option>
                          {locations.filter(l => l.locationType !== 'warehouse' && l.locationType !== 'zone').map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.code} - {loc.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="pt-2">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 italic">Structural Path</p>
                        <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 break-all leading-relaxed">{frontPath}</p>
                        </div>
                      </div>
                    </>
                  )}

                    {frontCell.id !== selectedNode?.structure?.id && (
                      <button 
                        onClick={() => deleteFrontCells([frontCell.id])}
                        disabled={frontCell.type === 'container' && frontCell.children && frontCell.children.length > 0}
                        className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
                        title={frontCell.type === 'container' && frontCell.children && frontCell.children.length > 0 ? "Cannot delete a container with sections inside" : "Delete section"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {frontCell.type === 'container' && frontCell.children && frontCell.children.length > 0 ? "Sections Protected" : "Delete"}
                      </button>
                    )}
                </div>

                {!frontCell.locked && (
                  <div className="pt-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1 mb-2">Compartment Skin</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => updateFrontCells([frontCell.id], { skin: undefined })}
                        className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${!frontCell.skin ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                      >
                        <Square className="w-5 h-5" />
                        <span className="text-[8px] font-black uppercase">Standard</span>
                      </button>
                      {SECTION_SKINS.map(skin => (
                        <button
                          key={skin.id}
                          onClick={() => updateFrontCells([frontCell.id], { skin: skin.id })}
                          className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${frontCell.skin === skin.id ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                        >
                          <skin.icon className="w-5 h-5" />
                          <span className="text-[8px] font-black uppercase text-center">{skin.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {frontDivider && selectedFrontDividerIds.length > 0 && (
              <section className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <SectionHeader icon={<Layers />} label={selectedFrontDividerIds.length > 1 ? `${selectedFrontDividerIds.length} Dividers` : 'Divider Property'} />
                  <button 
                    onClick={() => onSelectFrontDividers([])}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-5 p-4 rounded-2xl bg-slate-800/40 border border-slate-750">
                  {selectedFrontDividerIds.length === 1 && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Label</label>
                      <input 
                        type="text"
                        value={frontDivider.divider.label || ''}
                        onChange={(e) => updateFrontDividers(selectedFrontDividerIds, { label: e.target.value })}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-black text-sm outline-none focus:ring-1 focus:ring-sky-500 transition-all"
                        placeholder="DIVIDER"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Thickness (cm)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number"
                        step="1"
                        value={frontDivider.divider.thickness}
                        onChange={(e) => updateFrontDividers(selectedFrontDividerIds, { thickness: Math.max(0, Math.round(parseFloat(e.target.value)) || 0) })}
                        className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-black text-sm outline-none focus:ring-1 focus:ring-sky-500 transition-all"
                      />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-950 px-3 py-2.5 rounded-xl border border-slate-800">CM</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Material & Appearance</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        value={frontDivider.divider.material || 'wood'}
                        onChange={(e) => updateFrontDividers(selectedFrontDividerIds, { 
                          material: e.target.value as any,
                          color: e.target.value === 'wood' ? '#78350f' : e.target.value === 'metal' ? '#475569' : e.target.value === 'plastic' ? '#0ea5e9' : frontDivider.divider.color
                        })}
                        className="bg-slate-900/50 border border-slate-700 text-xs font-black text-slate-300 rounded-xl px-4 py-2.5 outline-none cursor-pointer appearance-none"
                      >
                         <option value="wood">Wood</option>
                         <option value="metal">Metal</option>
                         <option value="plastic">Plastic</option>
                         <option value="empty">Empty</option>
                         <option value="custom">Custom</option>
                      </select>
                      <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700 p-1.5 rounded-xl">
                        <input 
                          type="color"
                          value={frontDivider.divider.color || '#475569'}
                          onChange={(e) => updateFrontDividers(selectedFrontDividerIds, { color: e.target.value })}
                          className="w-full h-full rounded-lg border-none bg-transparent cursor-pointer overflow-hidden p-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Structure Type</label>
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                       {['solid', 'gap'].map(type => (
                         <button 
                           key={type}
                           onClick={() => updateFrontDividers(selectedFrontDividerIds, { type: type as any })}
                           className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${frontDivider.divider.type === type ? 'bg-sky-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-white'}`}
                         >
                           {type}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button 
                      onClick={() => deleteFrontDividers(selectedFrontDividerIds)}
                      className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Separator if we have a node selection too */}
            {(frontCell || frontDivider) && <div className="border-t border-slate-800" />}
          </>
        )}

        {!hasFrontSubSelection && (
          <>
            {viewMode === ViewMode.FRONT && selectedNode?.structure && (
              <section className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <SectionHeader icon={<Maximize />} label="Structure Outer Frame" />
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-750 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {(['top', 'bottom', 'left', 'right'] as const).map(edge => {
                      const isActive = !!selectedNode.structure?.frame?.[edge];
                      return (
                        <button
                          key={edge}
                          onClick={() => {
                            const structure = { ...selectedNode.structure! };
                            const frame = { ...(structure.frame || {}) };
                            if (isActive) {
                              delete frame[edge];
                            } else {
                              frame[edge] = {
                                id: `frame-${edge}-${Math.random().toString(36).substr(2, 9)}`,
                                thickness: 2,
                                type: 'solid',
                                material: 'wood',
                                color: '#78350f'
                              };
                            }
                            onUpdateNode(selectedNode.id, { structure: { ...structure, frame } });
                          }}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${isActive ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest">{edge}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-sky-400 animate-pulse' : 'bg-slate-800'}`} />
                        </button>
                      );
                    })}
                  </div>

                  {selectedNode.structure.frame && Object.keys(selectedNode.structure.frame).length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-750">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Thickness</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="number"
                            value={Object.values(selectedNode.structure.frame).find(f => !!f)?.thickness || 2}
                            onChange={(e) => {
                              const thickness = Math.max(0, parseInt(e.target.value) || 0);
                              const structure = { ...selectedNode.structure! };
                              const frame = { ...structure.frame };
                              for (const key in frame) {
                                if (frame[key as keyof typeof frame]) {
                                  frame[key as keyof typeof frame] = { ...frame[key as keyof typeof frame]!, thickness };
                                }
                              }
                              onUpdateNode(selectedNode.id, { structure: { ...structure, frame } });
                            }}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono text-xs outline-none focus:ring-1 focus:ring-sky-500 transition-all"
                          />
                          <span className="text-[10px] font-black text-slate-600">CM</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Material</label>
                        <div className="flex gap-2">
                          {(['wood', 'metal', 'plastic'] as const).map(m => (
                            <button
                              key={m}
                              onClick={() => {
                                const structure = { ...selectedNode.structure! };
                                const frame = { ...structure.frame };
                                const color = m === 'wood' ? '#78350f' : m === 'metal' ? '#475569' : '#0ea5e9';
                                for (const key in frame) {
                                  if (frame[key as keyof typeof frame]) {
                                    frame[key as keyof typeof frame] = { ...frame[key as keyof typeof frame]!, material: m as any, color };
                                  }
                                }
                                onUpdateNode(selectedNode.id, { structure: { ...structure, frame } });
                              }}
                              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${Object.values(selectedNode.structure!.frame!).find(f => !!f)?.material === m ? 'bg-sky-500 border-sky-500 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'}`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
            {/* State Badges */}
            <div className="flex flex-wrap gap-2">
                {isLinked && <Badge color="sky" label="Linked-State" icon={<LinkIcon className="w-3 h-3" />} />}
                {isVisualOnly && <Badge color="amber" label="Virtual Node" icon={<AlertTriangle className="w-3 h-3" />} />}
                {isLocationOnly && <Badge color="slate" label="Logical Unit" icon={<Database className="w-3 h-3" />} />}
                {selectedLocation?.status === 'archived' && <Badge color="red" label="Archived" icon={<Archive className="w-3 h-3" />} />}
            </div>

            {/* Visual Properties Section */}
            {selectedNode && (
              <section className="space-y-4">
                 <div className="flex items-center justify-between">
                   <SectionHeader icon={<Maximize2 />} label="Geometry" />
                   <button 
                     onClick={() => onUpdateNode(selectedNode.id, { locked: !selectedNode.locked })}
                     className={`p-1.5 rounded-lg transition-colors ${selectedNode.locked ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'hover:bg-slate-800 text-slate-400 hover:text-amber-500'}`}
                     title={selectedNode.locked ? "Unlock Object" : "Lock Object"}
                   >
                     {selectedNode.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                   </button>
                 </div>
             <div className="grid grid-cols-2 gap-3">
                {viewMode === ViewMode.TOP_DOWN ? (
                  <>
                    <EditablePropBox 
                      label="Pos-X" 
                      value={selectedNode.x} 
                      unit="cm"
                      onChange={(val) => onUpdateNode(selectedNode.id, { x: val })} 
                      disabled={selectedNode.locked}
                    />
                    <EditablePropBox 
                      label="Pos-Y" 
                      value={selectedNode.y} 
                      unit="cm"
                      onChange={(val) => onUpdateNode(selectedNode.id, { y: val })} 
                      disabled={selectedNode.locked}
                    />
                    <EditablePropBox 
                      label="Width" 
                      value={selectedNode.width} 
                      unit="cm"
                      onChange={(val) => onUpdateNode(selectedNode.id, { width: val })} 
                      disabled={selectedNode.locked}
                    />
                    <EditablePropBox 
                      label="Depth" 
                      value={selectedNode.depth} 
                      unit="cm"
                      onChange={(val) => onUpdateNode(selectedNode.id, { depth: val })} 
                      disabled={selectedNode.locked}
                    />
                  </>
                ) : (
                  <>
                    <EditablePropBox 
                      label="Width" 
                      value={selectedNode.width} 
                      unit="cm"
                      onChange={(val) => onUpdateNode(selectedNode.id, { width: val })} 
                    />
                    <EditablePropBox 
                      label="Height" 
                      value={selectedNode.height} 
                      unit="cm"
                      onChange={(val) => onUpdateNode(selectedNode.id, { height: val })} 
                    />
                    <EditablePropBox 
                      label="Elev-Z" 
                      value={selectedNode.z} 
                      unit="cm"
                      onChange={(val) => onUpdateNode(selectedNode.id, { z: val })} 
                    />
                    <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-750 flex items-center justify-center">
                       <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">Z-Axis Focus</span>
                    </div>
                  </>
                )}
                <div className="col-span-2">
                   <EditablePropBox 
                     label="Rotation" 
                     value={selectedNode.rotation} 
                     unit="°"
                     onChange={(val) => onUpdateNode(selectedNode.id, { rotation: val })} 
                   />
                   <div className="flex gap-2 mt-2">
                     <select 
                        value={rotationStep}
                        onChange={(e) => setRotationStep(parseFloat(e.target.value))}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-slate-300 font-black text-[10px] uppercase tracking-widest outline-none focus:border-sky-500 hover:border-slate-700 cursor-pointer transition-all"
                     >
                       <option value={15}>15°</option>
                       <option value={30}>30°</option>
                       <option value={45}>45°</option>
                       <option value={90}>90°</option>
                       <option value={135}>135°</option>
                       <option value={180}>180°</option>
                     </select>
                     <button 
                       onClick={() => onUpdateNode(selectedNode.id, { rotation: (selectedNode.rotation || 0) - rotationStep })}
                       className="p-1.5 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-white rounded-xl transition-all shadow-sm"
                       title={`Rotate Left ${rotationStep}°`}
                     >
                       <RotateCcw className="w-3.5 h-3.5" />
                     </button>
                     <button 
                       onClick={() => onUpdateNode(selectedNode.id, { rotation: (selectedNode.rotation || 0) + rotationStep })}
                       className="p-1.5 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-white rounded-xl transition-all shadow-sm"
                       title={`Rotate Right ${rotationStep}°`}
                     >
                       <RotateCw className="w-3.5 h-3.5" />
                     </button>
                   </div>
                </div>
             </div>
             
             <div className="pt-2">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 italic">Material skin</p>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-750">
                   <div 
                     className="w-10 h-10 rounded-lg border border-white/10 shadow-inner" 
                     style={{ backgroundColor: selectedNode.color }}
                   ></div>
                   <div className="flex-1">
                      <p className="text-[10px] font-bold text-white uppercase tracking-tight">Main Surface</p>
                      <p className="text-[9px] text-slate-600 font-mono italic">HEX: {selectedNode.color}</p>
                   </div>
                   <Palette className="w-4 h-4 text-slate-700" />
                </div>
             </div>
             {/* Zone Specific Settings */}
             {selectedNode.type === 'zone' && (
               <section className="space-y-4 pt-4 border-t border-slate-800">
                 <SectionHeader icon={<MapIcon />} label="Zone Configuration" />
                 <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-750 space-y-4">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Zone Type</label>
                     <select 
                       value={selectedNode.zoneType || 'operational'}
                       onChange={(e) => onUpdateNode(selectedNode.id, { zoneType: e.target.value as any })}
                       className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white font-black text-xs outline-none focus:ring-1 focus:ring-sky-500 transition-all appearance-none cursor-pointer"
                     >
                       <option value="operational">Operational</option>
                       <option value="no_access">No Access</option>
                       <option value="elevator">Elevator</option>
                       <option value="stairs">Staircase</option>
                       <option value="infrastructure">Infrastructure</option>
                       <option value="storage">Storage</option>
                     </select>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Primary Color</label>
                       <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 group">
                         <input 
                           type="color" 
                           value={selectedNode.color || '#334155'}
                           onChange={(e) => onUpdateNode(selectedNode.id, { color: e.target.value })}
                           className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer" 
                         />
                         <span className="text-[10px] font-mono text-slate-500 uppercase">{selectedNode.color}</span>
                       </div>
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Secondary Color</label>
                       <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 group">
                         <input 
                           type="color" 
                           value={selectedNode.secondaryColor || '#000000'}
                           onChange={(e) => onUpdateNode(selectedNode.id, { secondaryColor: e.target.value })}
                           className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer" 
                         />
                         <span className="text-[10px] font-mono text-slate-500 uppercase">{selectedNode.secondaryColor || '#----'}</span>
                       </div>
                     </div>
                   </div>

                    <div className="space-y-6 pt-2 border-t border-slate-800/50">
                      {/* Opacity Controls */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-slate-400">Whole Zone Opacity</label>
                            <span className="text-[10px] font-mono text-sky-400">{Math.round((selectedNode.opacity ?? 1) * 100)}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="1" step="0.01"
                            value={selectedNode.opacity ?? 1}
                            onChange={(e) => onUpdateNode(selectedNode.id, { opacity: parseFloat(e.target.value) })}
                            className="w-full accent-sky-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-slate-400">Primary</label>
                              <span className="text-[9px] font-mono text-sky-400">{Math.round((selectedNode.primaryOpacity ?? 0.3) * 100)}%</span>
                            </div>
                            <input 
                              type="range" min="0" max="1" step="0.01"
                              value={selectedNode.primaryOpacity ?? 0.3}
                              onChange={(e) => onUpdateNode(selectedNode.id, { primaryOpacity: parseFloat(e.target.value) })}
                              className="w-full accent-sky-400 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-slate-400">Secondary</label>
                              <span className="text-[9px] font-mono text-sky-400">{Math.round((selectedNode.secondaryOpacity ?? 0.3) * 100)}%</span>
                            </div>
                            <input 
                              type="range" min="0" max="1" step="0.01"
                              value={selectedNode.secondaryOpacity ?? 0.3}
                              onChange={(e) => onUpdateNode(selectedNode.id, { secondaryOpacity: parseFloat(e.target.value) })}
                              className="w-full accent-pink-400 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Pattern Selector */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Pattern</label>
                        <div className="grid grid-cols-4 gap-1">
                          {(['solid', 'stripes-thin', 'stripes-wide', 'diagonal-thin', 'diagonal-wide', 'dots', 'grid'] as const).map(pattern => (
                            <button
                              key={pattern}
                              onClick={() => onUpdateNode(selectedNode.id, { zonePattern: pattern })}
                              className={`py-2 rounded-lg border text-[7px] font-black uppercase transition-all ${selectedNode.zonePattern === pattern || (!selectedNode.zonePattern && pattern === 'solid') ? 'bg-sky-500 border-sky-500 text-slate-950 shadow-[0_0_10px_rgba(14,165,233,0.3)]' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white hover:border-slate-700'}`}
                              title={pattern.replace('-', ' ')}
                            >
                              {pattern === 'solid' ? 'SLD' : 
                               pattern === 'stripes-thin' ? 'ST' : 
                               pattern === 'stripes-wide' ? 'SW' : 
                               pattern === 'diagonal-thin' ? 'DT' : 
                               pattern === 'diagonal-wide' ? 'DW' : 
                               pattern === 'dots' ? 'DOT' : 'GRD'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                   <div className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-xl mt-2">
                     <div className="flex items-center gap-2">
                       <AlertTriangle className={`w-3.5 h-3.5 ${selectedNode.blockPlacement ? 'text-rose-500' : 'text-slate-600'}`} />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Block Placement</span>
                     </div>
                     <button 
                       onClick={() => onUpdateNode(selectedNode.id, { blockPlacement: !selectedNode.blockPlacement })}
                       className={`w-8 h-4 rounded-full transition-all relative ${selectedNode.blockPlacement ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]' : 'bg-slate-800'}`}
                     >
                       <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${selectedNode.blockPlacement ? 'left-4' : 'left-0.5'}`} />
                     </button>
                   </div>
                 </div>
               </section>
             )}

             {viewMode === ViewMode.FRONT && selectedNode.frontSetupDone && (
               <div className="pt-4 border-t border-slate-800 space-y-4">
                 <SectionHeader icon={<Palette />} label="Front Shape & Corners" />
                 
                 <div className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-750 rounded-xl">
                   <div className="flex items-center gap-2">
                     {selectedNode.style?.isCornerRadiusLocked ? <LinkIcon className="w-3.5 h-3.5 text-sky-400" /> : <Unlink className="w-3.5 h-3.5 text-slate-500" />}
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lock Corners</span>
                   </div>
                   <button 
                     onClick={() => onUpdateNode(selectedNode.id, { 
                       style: { 
                         ...selectedNode.style, 
                         isCornerRadiusLocked: !(selectedNode.style?.isCornerRadiusLocked ?? true) 
                       } 
                     })}
                     className={`w-8 h-4 rounded-full transition-all relative ${selectedNode.style?.isCornerRadiusLocked ? 'bg-sky-500' : 'bg-slate-700'}`}
                   >
                     <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${selectedNode.style?.isCornerRadiusLocked ? 'left-4' : 'left-0.5'}`} />
                   </button>
                 </div>

                 {selectedNode.style?.isCornerRadiusLocked ? (
                   <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                         <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Global Radius</label>
                         <span className="text-[10px] font-black text-sky-400">{selectedNode.style?.cornerRadiusTopLeft || 0}px</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" step="1"
                        value={selectedNode.style?.cornerRadiusTopLeft || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          onUpdateNode(selectedNode.id, {
                            style: {
                              ...selectedNode.style,
                              cornerRadiusTopLeft: val,
                              cornerRadiusTopRight: val,
                              cornerRadiusBottomRight: val,
                              cornerRadiusBottomLeft: val,
                            }
                          });
                        }}
                        className="w-full accent-sky-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                   </div>
                 ) : (
                   <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'cornerRadiusTopLeft', label: 'TL' },
                        { id: 'cornerRadiusTopRight', label: 'TR' },
                        { id: 'cornerRadiusBottomLeft', label: 'BL' },
                        { id: 'cornerRadiusBottomRight', label: 'BR' },
                      ].map(corner => (
                        <div key={corner.id} className="p-2 bg-slate-800/40 border border-slate-750 rounded-xl">
                           <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">{corner.label}</label>
                           <input 
                             type="number"
                             value={(selectedNode.style as any)?.[corner.id] || 0}
                             onChange={(e) => onUpdateNode(selectedNode.id, {
                               style: {
                                 ...selectedNode.style,
                                 [corner.id]: parseInt(e.target.value) || 0
                               }
                             })}
                             className="w-full bg-transparent border-none p-0 text-[10px] font-bold text-slate-300 font-mono outline-none"
                           />
                        </div>
                      ))}
                   </div>
                 )}

                 <div className="grid grid-cols-3 gap-1">
                   {[
                     { label: 'Sharp', values: [0, 0, 0, 0] },
                     { label: 'Slight', values: [4, 4, 4, 4] },
                     { label: 'Round', values: [12, 12, 12, 12] },
                     { label: 'Modern', values: [8, 8, 8, 8] },
                     { label: 'Bin', values: [24, 24, 24, 24] },
                     { label: 'Soft', values: [4, 4, 16, 16] },
                   ].map(preset => (
                     <button 
                       key={preset.label}
                       onClick={() => onUpdateNode(selectedNode.id, {
                         style: {
                           ...selectedNode.style,
                           cornerRadiusTopLeft: preset.values[0],
                           cornerRadiusTopRight: preset.values[1],
                           cornerRadiusBottomRight: preset.values[2],
                           cornerRadiusBottomLeft: preset.values[3],
                         }
                       })}
                       className="py-1 px-2 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-750 rounded-lg text-[8px] font-black text-slate-500 hover:text-white transition-all uppercase"
                     >
                       {preset.label}
                     </button>
                   ))}
                 </div>

                 <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden group/prev">
                    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #808080 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                    <div 
                       className="bg-sky-500/10 border border-sky-500/40 w-16 h-20 transition-all duration-300"
                       style={{
                         borderTopLeftRadius: `${(selectedNode.style?.cornerRadiusTopLeft || 0) / 4}px`,
                         borderTopRightRadius: `${(selectedNode.style?.cornerRadiusTopRight || 0) / 4}px`,
                         borderBottomRightRadius: `${(selectedNode.style?.cornerRadiusBottomRight || 0) / 4}px`,
                         borderBottomLeftRadius: `${(selectedNode.style?.cornerRadiusBottomLeft || 0) / 4}px`,
                       }}
                    ></div>
                    <span className="absolute bottom-2 right-2 text-[7px] font-black text-slate-700 uppercase tracking-widest opacity-0 group-hover/prev:opacity-100 transition-opacity">Mini-Preview</span>
                 </div>
               </div>
             )}
          </section>
        )}

        {/* Location Properties Section */}
        {(selectedLocation || isLinked) && (
          <section className="space-y-4">
             <SectionHeader icon={<Info />} label="Logical mapping" />
             <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-750 space-y-4 relative group">
                <div className="absolute top-4 right-4 text-emerald-500/30 group-hover:text-emerald-500 transition-colors">
                   <LinkIcon className="w-4 h-4" />
                </div>

                <div className="flex items-center gap-3">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg ${isLinked ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-slate-700/50 border-slate-600 text-slate-500'}`}>
                      <Box className="w-6 h-6" />
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-black text-white uppercase tracking-tight truncate">{selectedLocation?.code || "NULL-POINTER"}</p>
                      <p className="text-[9px] text-slate-600 font-mono uppercase tracking-widest italic">{selectedLocation?.locationType}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-750 pt-4">
                    <Detail label="Volumetric" value={selectedLocation?.allowsStock ? "Allowed" : "Restricted"} />
                    <Detail label="SKU Density" value={selectedLocation?.skuCount?.toString() || "0"} />
                    <Detail label="Stock Level" value={selectedLocation?.stockCount?.toString() || "0 UNIT"} />
                    <Detail label="Parent Node" value={locations.find(l => l.id === selectedLocation?.parentId)?.code || "ROOT-SYS"} />
                </div>

                <div className="flex gap-2 pt-2">
                   <ActionButton icon={<QrCode className="w-3.5 h-3.5" />} label="Identity" />
                   <ActionButton icon={<History className="w-3.5 h-3.5" />} label="History" />
                   <ActionButton icon={<Package className="w-3.5 h-3.5" />} label="SKUs" />
                </div>
             </div>
          </section>
        )}

        {/* Contextual Views Section */}
        {selectedNode && selectedNode.supportsFrontView && (
          <section className="space-y-3">
             <SectionHeader icon={<Eye />} label="Contextual Editing" />
             {!selectedNode.frontSetupDone && selectedNode.supportsFrontView && (
               <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10 mb-2">
                 <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest mb-1 italic">Setup Required</p>
                 <p className="text-[10px] text-slate-500 font-medium">This object has no front view projection yet. Height and rotation must be defined.</p>
               </div>
             )}
             <div className="grid grid-cols-1 gap-2">
                {selectedNode.supportsFrontView && (
                   <PrimaryBtn 
                     icon={selectedNode.frontSetupDone ? <Maximize2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
                     label={selectedNode.frontSetupDone ? "Edit Front View" : "Set up front view"} 
                     onClick={() => onSetViewMode(ViewMode.FRONT)} 
                     variant={selectedNode.frontSetupDone ? "outline" : "solid"}
                   />
                )}
             </div>
          </section>
        )}

        {/* Action Logic Buttons */}
        <section className="pt-6 border-t border-slate-800 space-y-3">
          {isLinked && (
            <>
               <SecondaryBtn 
                 icon={<Link2Off className="w-4 h-4" />} 
                 label="Sever link" 
                 onClick={() => onUnlink(selectedNode.id)}
               />
               <SecondaryBtn 
                 icon={<Trash2 className="w-4 h-4" />} 
                 label="Purge visual" 
                 color="text-rose-500/60"
                 onClick={() => onRemoveVisual(selectedNode.id)}
               />
            </>
          )}

          {isVisualOnly && (
            <>
               <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-4">
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1 italic">Void state</p>
                  <p className="text-[10px] text-slate-500 font-medium">This node has no logical anchor. It is a visual wrapper only.</p>
               </div>
               <PrimaryBtn 
                 icon={<LinkIcon className="w-4 h-4" />} 
                 label="Bind existing" 
                 onClick={() => setIsLinking(true)} 
               />
               <PrimaryBtn 
                 icon={<Plus className="w-4 h-4" />} 
                 label="Synthesize logic" 
                 onClick={onCreateLocationFromVisual}
                 variant="outline"
               />
               <SecondaryBtn 
                 icon={<Trash2 className="w-4 h-4" />} 
                 label="Purge visual" 
                 color="text-rose-500/60"
                 onClick={() => onRemoveVisual(selectedNode.id)}
               />
            </>
          )}

          {isLocationOnly && (
             <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-2xl border-2 border-dashed border-slate-800">
               <Move className="w-8 h-8 text-slate-700" />
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Logical ref selected. Drop into plan to visualize.</p>
             </div>
          )}
        </section>
       </>
     )}
      </div>

      <AnimatePresence>
        {isLinking && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 bg-slate-900/98 backdrop-blur-md z-50 p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-white text-[10px] uppercase tracking-widest">Select anchor</h3>
              <button onClick={() => setIsLinking(false)} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
              {locations.filter(l => !visuals.some(v => v.locationId === l.id)).map(loc => (
                <div 
                  key={loc.id}
                  onClick={() => {
                    if (selectedNode) {
                      onAssignLocation(loc.id);
                      setIsLinking(false);
                    }
                  }}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-750 hover:bg-sky-500/10 hover:border-sky-500/40 transition-all cursor-pointer group"
                >
                  <p className="text-[11px] font-black text-white group-hover:text-sky-400 uppercase tracking-tight transition-colors">{loc.code}</p>
                  <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest italic">{loc.name}</p>
                </div>
              ))}
              {locations.filter(l => !visuals.some(v => v.locationId === l.id)).length === 0 && (
                <div className="p-12 text-center opacity-30">
                  <Search className="w-8 h-8 text-slate-600 mx-auto mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest italic">No unmapped locations</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
       {React.cloneElement(icon as React.ReactElement, { className: 'w-3.5 h-3.5' } as any)}
       <span>{label}</span>
    </div>
  );
}

function StatRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 last:border-0 last:pb-0">
       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{label}</span>
       <span className="text-[10px] font-mono font-bold text-slate-300">{value}</span>
    </div>
  );
}

function EditablePropBox({ label, value, unit, onChange, disabled }: { label: string, value: number, unit: string, onChange: (val: number) => void, disabled?: boolean }) {
  // Convert mm internal to cm UI if unit is cm
  const displayValue = value;
  
  return (
    <div className={`p-3 bg-slate-800/40 border border-slate-750 rounded-xl relative group focus-within:border-sky-500/50 transition-all ${disabled ? 'opacity-50' : ''}`}>
      <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest absolute top-2 right-3 italic group-hover:text-sky-500/40 transition-colors">{unit}</span>
      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">{label}</p>
      <input 
        type="number"
        value={displayValue}
        disabled={disabled}
        onChange={(e) => {
          const val = Math.round(Number(e.target.value));
          onChange(val);
        }}
        className={`w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-300 font-mono tracking-tighter outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${disabled ? 'cursor-not-allowed' : ''}`}
      />
    </div>
  );
}

function PropBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-3 bg-slate-800/40 border border-slate-750 rounded-xl relative group">
      <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest absolute top-2 right-3 italic group-hover:text-sky-500/40 transition-colors">Val</span>
      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">{label}</p>
      <p className="text-[11px] font-bold text-slate-300 font-mono tracking-tighter">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string, value: string }) {
  return (
    <div>
       <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
       <p className="text-[11px] font-bold text-slate-300 uppercase tracking-tight">{value}</p>
    </div>
  );
}

function ActionButton({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-800/40 border border-slate-750 hover:bg-slate-700 transition-all group">
       <div className="text-slate-600 group-hover:text-sky-400 transition-colors">
          {icon}
       </div>
       <span className="text-[8px] font-black text-slate-600 group-hover:text-slate-400 transition-colors uppercase tracking-widest">{label}</span>
    </button>
  );
}

function PrimaryBtn({ icon, label, onClick, variant = 'solid' }: { icon: React.ReactNode, label: string, onClick: () => void, variant?: 'solid' | 'outline' }) {
  return (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
        ${variant === 'solid' 
          ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/10 hover:bg-sky-400' 
          : 'bg-transparent border border-sky-500/30 text-sky-400 hover:bg-sky-500/5'}
      `}
    >
      {icon}
      {label}
    </button>
  );
}

function SecondaryBtn({ icon, label, onClick, color = 'text-slate-500' }: { icon: React.ReactNode, label: string, onClick?: () => void, color?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl hover:bg-slate-800 transition-all group border border-transparent hover:border-slate-750 ${color}`}
    >
      <div className="opacity-40 group-hover:opacity-100 transition-opacity">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest transition-colors">{label}</span>
    </button>
  );
}

function Badge({ color, label, icon }: { color: 'sky' | 'amber' | 'red' | 'slate', label: string, icon: React.ReactNode }) {
  const styles = {
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-[0_0_8px_rgba(56,189,248,0.1)]',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]',
    red: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]',
    slate: 'bg-slate-800/50 text-slate-500 border-slate-700'
  };

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${styles[color]}`}>
       {icon}
       {label}
    </div>
  );
}
