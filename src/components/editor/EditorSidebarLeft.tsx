import { 
  Database, 
  Layers, 
  Shapes, 
  ChevronRight, 
  ChevronDown, 
  Box, 
  Eye, 
  EyeOff,
  Search,
  Filter,
  Copy,
  Package,
  Plus,
  Layout as LayoutIcon,
  DoorOpen,
  Square,
  Warehouse,
  Wind,
  Lock,
  Unlock,
  Link as LinkIcon
} from 'lucide-react';
import React, { useState } from 'react';
import { LogicalLocation, VisualNode, ViewMode } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { findNodeById, replaceNodeById } from '../../lib/structureUtils';
import { PRESET_CATEGORIES } from '../../constants/presets';

interface SidebarLeftProps {
  locations: LogicalLocation[];
  visuals: VisualNode[];
  selectedId: string | null;
  selectedIds: string[];
  onSelect: (id: string | null) => void;
  onSelectMultiple: (ids: string[]) => void;
  onCloneNode?: (id: string) => void;
  onAddPreset: (preset: any) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedFrontCellIds: string[];
  onSelectFrontCell: (ids: string[] | ((prev: string[]) => string[])) => void;
  onUpdateNode?: (id: string, updates: Partial<VisualNode>) => void;
}

type Tab = 'visuals' | 'presets' | 'locations' | 'layers' | 'structure';

export default function EditorSidebarLeft({ 
  locations, 
  visuals, 
  selectedId, 
  selectedIds,
  onSelect, 
  onSelectMultiple,
  onCloneNode,
  onAddPreset,
  viewMode,
  setViewMode,
  selectedFrontCellIds,
  onSelectFrontCell,
  onUpdateNode
}: SidebarLeftProps) {
  const [activeTab, setActiveTab] = useState<Tab>(viewMode === ViewMode.FRONT ? 'structure' : 'visuals');
  const [expandedIds, setExpandedIds] = useState<string[]>(['l1']);
  const [expandedStructureIds, setExpandedStructureIds] = useState<string[]>([]);

  const isFrontMode = viewMode === ViewMode.FRONT;
  const selectedNode = visuals.find(v => v.id === (selectedId || selectedIds[0]));

  const toggleSelection = (id: string, isShift: boolean) => {
    if (isShift) {
      if (selectedIds.includes(id)) {
        onSelectMultiple(selectedIds.filter(i => i !== id));
      } else {
        onSelectMultiple([...selectedIds, id]);
      }
    } else {
      onSelect(id);
    }
  };

  const toggleLock = (id: string) => {
    if (!selectedNode?.structure || !onUpdateNode) return;
    const targetNode = findNodeById(selectedNode.structure, id);
    if (targetNode) {
      const newStructure = replaceNodeById(selectedNode.structure, id, { ...targetNode, locked: !targetNode.locked });
      onUpdateNode(selectedNode.id, { structure: newStructure });
    }
  };

  // Auto-expand parents of selected cell
  React.useEffect(() => {
    if (selectedFrontCellIds.length > 0 && selectedNode?.structure) {
      const lastId = selectedFrontCellIds[selectedFrontCellIds.length - 1];
      const getPath = (root: any, id: string, path: string[] = []): string[] | null => {
        if (root.id === id) return path;
        if (root.children) {
          for (const child of root.children) {
            const result = getPath(child, id, [...path, root.id]);
            if (result) return result;
          }
        }
        return null;
      };
      const path = getPath(selectedNode.structure, lastId);
      if (path) {
        setExpandedStructureIds(prev => Array.from(new Set([...prev, ...path])));
      }
    }
  }, [selectedFrontCellIds, selectedNode?.structure]);

  // Sync tab when viewMode changes
  React.useEffect(() => {
    if (viewMode === ViewMode.FRONT) {
      setActiveTab('structure');
    } else {
      setActiveTab('visuals');
    }
  }, [viewMode]);

  const rootVisual = visuals.find(v => v.parentId === null && v.type === 'zone');
  const otherVisuals = visuals.filter(v => v !== rootVisual);

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-30">
      <div className="flex bg-slate-950/50 border-b border-slate-800">
        {isFrontMode ? (
          <TabBtn icon={<LayoutIcon />} active={activeTab === 'structure'} onClick={() => setActiveTab('structure')} title="Object Structure" />
        ) : (
          <TabBtn icon={<Shapes />} active={activeTab === 'visuals'} onClick={() => setActiveTab('visuals')} title="Visuals List" />
        )}
        <TabBtn icon={<Package />} active={activeTab === 'presets'} onClick={() => setActiveTab('presets')} title="Object Presets" />
        <TabBtn icon={<Database />} active={activeTab === 'locations'} onClick={() => setActiveTab('locations')} title="Connected Locations" />
        <TabBtn icon={<Layers />} active={activeTab === 'layers'} onClick={() => setActiveTab('layers')} title="Layers" />
      </div>

      <div className="p-3 border-b border-slate-800 bg-slate-900">
         <div className="relative group">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500 transition-colors group-focus-within:text-sky-500" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-bold uppercase tracking-widest text-white placeholder-slate-700 focus:ring-1 focus:ring-sky-500 transition-all outline-none"
            />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 p-2">
        {activeTab === 'structure' && isFrontMode && (
          <div className="space-y-4">
             {selectedNode?.structure ? (
               <div>
                  <div 
                    onClick={() => setViewMode(ViewMode.TOP_DOWN)}
                    className="flex items-center justify-between px-2 py-1.5 mb-2 rounded-lg cursor-pointer hover:bg-sky-500/5 transition-all text-sky-400 group border border-transparent hover:border-sky-500/20"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest italic">{selectedNode.label}</p>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity rotate-180" />
                  </div>
                  <StructureTreeItem 
                    node={selectedNode.structure} 
                    selectedCellIds={selectedFrontCellIds} 
                    onSelectCell={(id: string, shift: boolean) => {
                      if (shift) {
                        onSelectFrontCell(prev => 
                          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                        );
                      } else {
                        onSelectFrontCell([id]);
                      }
                    }}
                    onSelectRecursive={(ids: string[]) => {
                      onSelectFrontCell(prev => Array.from(new Set([...prev, ...ids])));
                    }}
                    depth={0} 
                    expandedIds={expandedStructureIds}
                    onToggleExpand={(id: string) => setExpandedStructureIds(prev => 
                      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                    )}
                    onToggleLock={toggleLock}
                  />
               </div>
             ) : (
               <div className="p-8 text-center text-slate-700 text-[10px] uppercase font-bold italic tracking-widest opacity-40">
                 Front view not initialized
               </div>
             )}
          </div>
        )}

        {activeTab === 'visuals' && (
          <div className="space-y-4">
             {rootVisual && (
               <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 mb-2 italic">Physical Footprint</p>
                  <div 
                    onClick={(e) => toggleSelection(rootVisual.id, e.shiftKey)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedIds.includes(rootVisual.id) ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-slate-800/40 border-slate-700 hover:border-slate-600 text-slate-400'
                    }`}
                  >
                     <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-700 shrink-0">
                        <Warehouse className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-tight text-white">{rootVisual.label}</p>
                        <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                          {rootVisual.width/10}cm x {rootVisual.depth/10}cm Total
                        </p>
                     </div>
                  </div>
               </div>
             )}

             <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 mb-2 italic">Visual Nodes ({otherVisuals.length})</p>
                {otherVisuals.map(visual => (
                  <VisualListItem 
                    key={visual.id} 
                    visual={visual} 
                    selected={selectedIds.includes(visual.id)} 
                    onSelect={(shift: boolean) => toggleSelection(visual.id, shift)} 
                    onClone={() => onCloneNode?.(visual.id)}
                    onUpdate={(updates: Partial<VisualNode>) => onUpdateNode?.(visual.id, updates)}
                  />
                ))}
                {otherVisuals.length === 0 && (
                  <div className="p-8 text-center text-slate-700 text-[10px] uppercase font-bold italic tracking-widest opacity-40">
                    No child objects placed yet
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'presets' && (
          <div className="space-y-6">
             {PRESET_CATEGORIES.map(cat => (
               <div key={cat.name}>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 mb-3 italic">{cat.name}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {cat.items.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => onAddPreset(item)}
                        className="group p-3 rounded-xl bg-slate-800/40 border border-slate-700 hover:border-sky-500/50 hover:bg-slate-800 transition-all cursor-grab active:cursor-grabbing flex items-center gap-3"
                      >
                         <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-750 text-slate-500 group-hover:text-sky-400 transition-colors">
                            <item.icon className="w-5 h-5" />
                         </div>
                         <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-tight text-slate-200 group-hover:text-white">{item.label}</p>
                            <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                              {item.w/10}x{item.d/10}cm Surface
                            </p>
                         </div>
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-6 h-6 rounded-md bg-sky-500 text-slate-900 flex items-center justify-center">
                               <Plus className="w-3.5 h-3.5" />
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="space-y-1">
             <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 mb-2 italic">Hierarchy</p>
             {locations.filter(l => l.parentId === null).map(loc => (
               <LocationTreeItem 
                 key={loc.id} 
                 location={loc} 
                 allLocations={locations} 
                 visuals={visuals}
                 expandedIds={expandedIds}
                 setExpandedIds={setExpandedIds}
                 selectedId={selectedId}
                 onSelect={onSelect}
                 toggleSelection={toggleSelection}
                 depth={0}
               />
             ))}
          </div>
        )}

        {activeTab === 'layers' && (
           <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-30">
             <Layers className="w-10 h-10 text-slate-600" />
             <p className="text-[10px] font-black uppercase tracking-widest italic">Layer stack coming soon</p>
           </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic">Active filter: none</span>
         </div>
      </div>
    </div>
  );
}

function TabBtn({ icon, active, onClick, badge, title }: { icon: React.ReactElement, active: boolean, onClick: () => void, badge?: number, title?: string }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={`
        flex-1 flex items-center justify-center p-4 transition-all relative
        ${active ? 'text-sky-400 bg-slate-800 shadow-[inset_0_-2px_0_0_#38bdf8]' : 'text-slate-600 hover:text-slate-400'}
      `}
    >
      {React.cloneElement(icon, { className: 'w-4 h-4' } as any)}
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-3 w-3.5 h-3.5 bg-sky-500 rounded-full flex items-center justify-center text-[8px] font-black text-slate-950 border border-slate-900 shadow-[0_0_8px_rgba(56,189,248,0.3)]">
           {badge}
        </span>
      )}
    </button>
  );
}

function LocationTreeItem({ location, allLocations, visuals, expandedIds, setExpandedIds, selectedId, selectedIds, onSelect, toggleSelection, depth }: any) {
  const children = allLocations.filter((l: any) => l.parentId === location.id);
  const isExpanded = expandedIds.includes(location.id);
  const isSelected = selectedIds.includes(location.id) || selectedId === location.id;
  const isMapped = visuals.some((v: any) => v.locationId === location.id);
  const hasChildren = children.length > 0;

  const toggle = (e: any) => {
    e.stopPropagation();
    setExpandedIds((prev: any) => 
      prev.includes(location.id) ? prev.filter((i: any) => i !== location.id) : [...prev, location.id]
    );
  };

  return (
    <div className="select-none">
      <div 
        className={`
          flex items-center gap-2 p-1 py-1.5 rounded-md cursor-pointer group transition-all mb-0.5
          ${isSelected ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'hover:bg-slate-800 text-slate-500 hover:text-slate-200'}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={(e) => toggleSelection(location.id, e.shiftKey)}
      >
        <div onClick={toggle} className={`hover:text-white transition-colors ${!hasChildren && 'opacity-0 pointer-events-none'}`}>
           {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
        <Box className={`w-3.5 h-3.5 ${isMapped ? 'text-sky-500/40' : isSelected ? 'text-sky-400' : 'text-slate-700'}`} />
        <span className="text-[10px] font-bold flex-1 truncate uppercase tracking-tight">{location.code}</span>
        {isMapped && <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]"></div>}
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {children.map((child: any) => (
               <LocationTreeItem 
                 key={child.id} 
                 location={child} 
                 allLocations={allLocations} 
                 visuals={visuals}
                 expandedIds={expandedIds}
                 setExpandedIds={setExpandedIds}
                 selectedId={selectedId}
                 onSelect={onSelect}
                 toggleSelection={toggleSelection}
                 depth={depth + 1}
               />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VisualListItem({ visual, selected, onSelect, onClone, onUpdate }: any) {
  return (
    <div 
      className={`
        flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border mb-1 group
        ${selected ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.05)]' : 'hover:bg-slate-800 text-slate-500 border-transparent hover:text-slate-200'}
        ${visual.locked ? 'opacity-75' : ''}
      `}
      onClick={(e) => onSelect(e.shiftKey)}
    >
      <div className="flex items-center gap-2">
         <div className={`w-4 h-4 border rounded flex items-center justify-center p-0.5 ${selected ? (visual.locked ? 'border-amber-500' : 'border-sky-500') : 'border-slate-700'}`}>
            <div className={`w-full h-full rounded-sm ${selected ? (visual.locked ? 'bg-amber-500' : 'bg-sky-500') : 'bg-slate-700'}`}></div>
         </div>
         <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-black uppercase tracking-tight ${selected ? 'text-white' : ''}`}>{visual.label}</span>
              {visual.locked && <Lock className="w-2.5 h-2.5 text-amber-500/70" />}
            </div>
            <span className="text-[8px] text-slate-600 font-mono italic">{visual.locationId ? 'Mapped-ID' : 'Virtual'}</span>
         </div>
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onUpdate?.({ locked: !visual.locked });
          }}
          className={`p-1 transition-colors ${visual.locked ? 'text-amber-500' : 'text-slate-600 hover:text-white opacity-0 group-hover:opacity-100'}`}
          title={visual.locked ? "Unlock Object" : "Lock Object"}
        >
          {visual.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onClone?.(); }}
          className={`p-1 transition-colors ${selected ? 'text-sky-400' : 'hover:text-white opacity-0 group-hover:opacity-100'}`}
          title="Clone Node"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function StructureTreeItem({ node, selectedCellIds, onSelectCell, onSelectRecursive, depth, expandedIds, onToggleExpand, onToggleLock }: any) {
  const isSelected = selectedCellIds?.includes(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds?.includes(node.id);

  const getAllChildrenIds = (n: any): string[] => {
    let ids = n.type === 'cell' ? [n.id] : [];
    if (n.children) {
      n.children.forEach((c: any) => {
        ids = [...ids, ...getAllChildrenIds(c)];
      });
    }
    return ids;
  };
  
  return (
    <div className="select-none">
      <div 
        onClick={(e) => onSelectCell(node.id, e.shiftKey)}
        className={`
          flex items-center gap-2 p-1 py-1.5 rounded-md cursor-pointer group transition-all mb-0.5
          ${isSelected 
              ? (node.locked ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20') 
              : 'hover:bg-slate-800 text-slate-500 hover:text-slate-200'}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(node.id);
          }}
          className={`hover:text-white transition-colors p-0.5 rounded hover:bg-slate-700 ${!hasChildren && 'opacity-0 pointer-events-none'}`}
        >
           {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
        <div className={`flex items-center gap-2 flex-1 min-w-0 ${node.locked ? 'opacity-50' : ''}`}>
           {node.type === 'container' ? <LayoutIcon className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
           <span className="text-[10px] font-bold flex-1 truncate uppercase tracking-tight">{node.displayLabel || node.label || node.id}</span>
        </div>
        
        {node.locationId && (
          <div title="Mapped to Location">
            <LinkIcon className="w-3 h-3 text-emerald-500 shrink-0" />
          </div>
        )}

        {node.locked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock(node.id);
            }}
            className="p-1 hover:bg-slate-700/50 rounded transition-all shrink-0 ml-1 text-slate-500 hover:text-white"
            title="Unlock section"
          >
            <Lock className="w-3 h-3" />
          </button>
        )}
        
        {!node.locked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock(node.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700/50 text-slate-500 hover:text-white rounded transition-all shrink-0 ml-1"
            title="Lock section"
          >
            <Unlock className="w-3 h-3" />
          </button>
        )}

        {node.type === 'container' && !node.locked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectRecursive(getAllChildrenIds(node));
            }}
            title="Select all children"
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-sky-500/20 text-sky-500 rounded transition-all shrink-0"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {node.children.map((child: any) => (
              <StructureTreeItem 
                key={child.id} 
                node={child} 
                selectedCellIds={selectedCellIds} 
                onSelectCell={onSelectCell} 
                onSelectRecursive={onSelectRecursive}
                depth={depth + 1} 
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                onToggleLock={onToggleLock}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
