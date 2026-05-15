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
  Link as LinkIcon,
  Home
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { LogicalLocation, VisualNode, ViewMode, Layout } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { findNodeById, replaceNodeById } from '../../lib/structureUtils';
import { PRESET_CATEGORIES } from '../../constants/presets';

interface SidebarLeftProps {
  layout: Layout;
  locations: LogicalLocation[];
  visuals: VisualNode[];
  selectedId: string | null;
  selectedIds: string[];
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onSelect: (id: string | null) => void;
  onSelectMultiple: (ids: string[]) => void;
  onCloneNode?: (id: string) => void;
  onAddPreset: (preset: any) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedFrontCellIds: string[];
  onSelectFrontCell: (ids: string[] | ((prev: string[]) => string[])) => void;
  onUpdateNode?: (id: string, updates: Partial<VisualNode>) => void;
  onVisualizeLocation?: (locId: string) => void;
  onNavigateToMapping?: (location: LogicalLocation) => void;
}

export type Tab = 'visuals' | 'presets' | 'locations' | 'layers' | 'structure';

export default function EditorSidebarLeft({ 
  layout,
  locations, 
  visuals, 
  selectedId, 
  selectedIds,
  activeTab,
  onTabChange,
  onSelect, 
  onSelectMultiple,
  onCloneNode,
  onAddPreset,
  viewMode,
  setViewMode,
  selectedFrontCellIds,
  onSelectFrontCell,
  onUpdateNode,
  onVisualizeLocation,
  onNavigateToMapping
}: SidebarLeftProps) {
  const rootLocationId = layout.rootLocationId;
  const [expandedIds, setExpandedIds] = useState<string[]>(rootLocationId ? [rootLocationId] : (locations[0] ? [locations[0].id] : []));
  const [expandedWorkspaceIds, setExpandedWorkspaceIds] = useState<string[]>([]);

  const isFrontMode = viewMode === ViewMode.FRONT;
  const selectedNode = visuals.find(v => v.id === (selectedId || selectedIds[0]));

  const toggleSelection = (id: string, isShift: boolean) => {
    if (isShift) {
      if (selectedIds?.includes(id)) {
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

  // Search logic or other memoized state could go here if needed

  const toggleExpandWorkspace = (id: string) => {
    setExpandedWorkspaceIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...(prev || []), id]
    );
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-30">
      <div className="flex bg-slate-950/50 border-b border-slate-800">
        <TabBtn icon={<Database />} active={activeTab === 'locations'} onClick={() => onTabChange('locations')} title="Connected Locations" />
        <TabBtn icon={<Shapes />} active={activeTab === 'visuals' || activeTab === 'structure'} onClick={() => onTabChange('visuals')} title="Workspace Objects" />
        <TabBtn icon={<Package />} active={activeTab === 'presets'} onClick={() => onTabChange('presets')} title="Object Presets" />
        <TabBtn icon={<Layers />} active={activeTab === 'layers'} onClick={() => onTabChange('layers')} title="Layers" />
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
        {(activeTab === 'visuals' || activeTab === 'structure') && (
          <div className="space-y-6">
             <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 mb-3 italic">Workspace Objects</p>
                <div className="space-y-0.5">
                   {visuals.filter(v => !v.parentId && v.locationId).map(visual => (
                     <UnifiedSidebarItem 
                        key={visual.id}
                        node={visual}
                        type="visual"
                        depth={0}
                        locations={locations}
                        visuals={visuals}
                        selectedIds={selectedIds}
                        selectedFrontCellIds={selectedFrontCellIds}
                        expandedIds={expandedWorkspaceIds}
                        onToggleExpand={toggleExpandWorkspace}
                        onSelect={onSelect}
                        onSelectFrontCell={onSelectFrontCell}
                        setViewMode={setViewMode}
                        onUpdateNode={onUpdateNode}
                        onCloneNode={onCloneNode}
                        onNavigateToMapping={onNavigateToMapping}
                     />
                   ))}
                   {visuals.filter(v => !v.parentId && v.locationId).length === 0 && (
                     <p className="text-[10px] text-slate-700 italic px-4 py-2">No linked objects</p>
                   )}
                </div>
             </div>

             {visuals.filter(v => !v.parentId && !v.locationId && v.nodeRole !== 'infrastructure').length > 0 && (
               <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 mb-3 italic">Unassigned Storage</p>
                  <div className="space-y-0.5">
                    {visuals.filter(v => !v.parentId && !v.locationId && v.nodeRole !== 'infrastructure').map(visual => (
                      <UnifiedSidebarItem 
                        key={visual.id}
                        node={visual}
                        type="visual"
                        depth={0}
                        locations={locations}
                        visuals={visuals}
                        selectedIds={selectedIds}
                        selectedFrontCellIds={selectedFrontCellIds}
                        expandedIds={expandedWorkspaceIds}
                        onToggleExpand={toggleExpandWorkspace}
                        onSelect={onSelect}
                        onSelectFrontCell={onSelectFrontCell}
                        setViewMode={setViewMode}
                        onUpdateNode={onUpdateNode}
                        onCloneNode={onCloneNode}
                        onNavigateToMapping={onNavigateToMapping}
                      />
                    ))}
                  </div>
               </div>
             )}

             {visuals.filter(v => !v.parentId && v.nodeRole === 'infrastructure').length > 0 && (
               <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 mb-3 italic">Infrastructure / Context</p>
                  <div className="space-y-0.5">
                    {visuals.filter(v => !v.parentId && v.nodeRole === 'infrastructure').map(visual => (
                      <UnifiedSidebarItem 
                        key={visual.id}
                        node={visual}
                        type="visual"
                        depth={0}
                        locations={locations}
                        visuals={visuals}
                        selectedIds={selectedIds}
                        selectedFrontCellIds={selectedFrontCellIds}
                        expandedIds={expandedWorkspaceIds}
                        onToggleExpand={toggleExpandWorkspace}
                        onSelect={onSelect}
                        onSelectFrontCell={onSelectFrontCell}
                        setViewMode={setViewMode}
                        onUpdateNode={onUpdateNode}
                        onCloneNode={onCloneNode}
                        onNavigateToMapping={onNavigateToMapping}
                      />
                    ))}
                  </div>
               </div>
             )}
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
             <div className="px-2 mb-2 flex items-center justify-between">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Logical Hierarchy</p>
                {rootLocationId && (
                  <div className="flex items-center gap-1 text-[8px] font-black text-sky-500 uppercase tracking-widest bg-sky-500/5 px-1.5 py-0.5 rounded border border-sky-500/10">
                    <Home className="w-2.5 h-2.5" /> Scoped
                  </div>
                )}
             </div>
             {locations.filter(l => rootLocationId ? l.id === rootLocationId : l.parentId === null).map(loc => (
               <LocationTreeItem 
                 key={loc.id} 
                 location={loc} 
                 allLocations={locations} 
                 visuals={visuals}
                 expandedIds={expandedIds}
                 setExpandedIds={setExpandedIds}
                 selectedId={selectedId}
                 selectedIds={selectedIds}
                 onSelect={onSelect}
                 toggleSelection={toggleSelection}
                 onVisualizeLocation={onVisualizeLocation}
                 onNavigateToMapping={onNavigateToMapping}
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

function LocationTreeItem({ 
  location, 
  allLocations, 
  visuals, 
  expandedIds, 
  setExpandedIds, 
  selectedId, 
  selectedIds, 
  onSelect, 
  toggleSelection, 
  onVisualizeLocation,
  onNavigateToMapping,
  depth 
}: any) {
  const children = allLocations.filter((l: any) => l.parentId === location.id);
  const isExpanded = expandedIds?.includes(location.id);
  const isSelected = selectedIds?.includes(location.id) || selectedId === location.id;
  
  const linkedVisual = visuals.find((v: any) => v.locationId === location.id);
  const isMappedTopDown = !!linkedVisual;
  
  const findsInStructure = (node: any): boolean => {
     if (node.locationId === location.id) return true;
     if (node.children) return node.children.some(findsInStructure);
     return false;
  };
  const parentNodeWithFrontMapping = visuals.find((v: any) => v.structure && findsInStructure(v.structure));
  const isMappedFrontCell = !!parentNodeWithFrontMapping;

  const isMapped = isMappedTopDown || isMappedFrontCell;
  const hasChildren = children.length > 0;

  const toggle = (e: any) => {
    e.stopPropagation();
    setExpandedIds((prev: any) => 
      prev?.includes(location.id) ? prev.filter((i: any) => i !== location.id) : [...(prev || []), location.id]
    );
  };

  return (
    <div className="select-none">
      <div 
        className={`
          flex items-center gap-2 p-1 py-1.5 rounded-md cursor-pointer group transition-all mb-0.5
          ${isSelected ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[inset_0_1px_0_0_rgba(56,189,248,0.05)]' : 'hover:bg-slate-800 text-slate-500 hover:text-slate-200'}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={(e) => toggleSelection(location.id, e.shiftKey)}
      >
        <div onClick={toggle} className={`hover:text-white transition-colors p-0.5 rounded ${!hasChildren && 'opacity-0 pointer-events-none'}`}>
           {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
        <Box className={`w-3.5 h-3.5 ${isMapped ? 'text-sky-500/60' : isSelected ? 'text-sky-400' : 'text-slate-700'}`} />
        <span className="text-[10px] font-bold flex-1 truncate uppercase tracking-tight">{location.code}</span>
        
        {!isMapped && (
          <button 
            onClick={(e) => { e.stopPropagation(); onVisualizeLocation?.(location.id); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 bg-sky-500 text-slate-950 rounded hover:bg-sky-400 transition-all shadow-[0_0_8px_rgba(56,189,248,0.3)]"
            title="Visualize on map"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
        
        {isMappedTopDown && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToMapping?.(location);
            }}
            className="p-1 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-slate-950 transition-all border border-sky-500/20 group-hover:shadow-[0_0_10px_rgba(14,165,233,0.3)]"
            title="Go to Top-Down visual node"
          >
            <LinkIcon className="w-2.5 h-2.5" />
          </button>
        )}
        {isMappedFrontCell && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToMapping?.(location);
            }}
            className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all border border-emerald-500/20 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            title="Go to Front-View cell"
          >
            <LayoutIcon className="w-2.5 h-2.5" />
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
            {children.map((child: any) => (
               <LocationTreeItem 
                 key={child.id} 
                 location={child} 
                 allLocations={allLocations} 
                 visuals={visuals}
                 expandedIds={expandedIds}
                 setExpandedIds={setExpandedIds}
                 selectedId={selectedId}
                 selectedIds={selectedIds}
                 onSelect={onSelect}
                 toggleSelection={toggleSelection}
                 onVisualizeLocation={onVisualizeLocation}
                 onNavigateToMapping={onNavigateToMapping}
                 depth={depth + 1}
               />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UnifiedSidebarItem({ 
  node, 
  type, 
  depth, 
  locations, 
  visuals, 
  selectedIds, 
  selectedFrontCellIds, 
  expandedIds, 
  onToggleExpand, 
  onSelect, 
  onSelectFrontCell, 
  setViewMode, 
  onUpdateNode, 
  onCloneNode,
  onNavigateToMapping,
  parentVisualId
}: any) {
  const isVisual = type === 'visual';
  const isSelected = isVisual ? selectedIds?.includes(node.id) : selectedFrontCellIds?.includes(node.id);
  const isExpanded = expandedIds?.includes(node.id);
  
  const linkedLocation = locations.find((l: any) => l.id === node.locationId);
  
  // Resolve children
  let children: any[] = [];
  if (isVisual) {
    // Top-view visual children
    const visualChildren = visuals.filter((v: any) => v.parentId === node.id);
    // Front-view structure children
    let structureChildren: any[] = [];
    if (node.structure) {
      const root = node.structure;
      const isTechnicalRoot = !root.displayLabel && (root.label === 'root' || root.id.includes('root'));
      if (isTechnicalRoot) {
        structureChildren = root.children || [];
      } else {
        structureChildren = [root];
      }
    }
    children = [...visualChildren, ...structureChildren];
  } else {
    // recursive structure children
    children = node.children || [];
  }

  const hasChildren = children.length > 0;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVisual) {
      onSelect(node.id);
      setViewMode(ViewMode.TOP_DOWN);
    } else {
      onSelect(parentVisualId);
      onSelectFrontCell([node.id]);
      setViewMode(ViewMode.FRONT);
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(node.id);
  };

  return (
    <div className="select-none">
      <div 
        onClick={handleSelect}
        className={`
          flex items-center gap-2 p-2 rounded-xl cursor-pointer group transition-all mb-0.5 border
          ${isSelected 
            ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.05)]' 
            : 'hover:bg-slate-800 text-slate-500 border-transparent hover:text-slate-200'}
          ${node.locked ? 'opacity-70' : ''}
        `}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <div 
          onClick={toggleExpand}
          className={`hover:text-white transition-colors p-0.5 rounded hover:bg-slate-700 ${!hasChildren && 'opacity-0 pointer-events-none'}`}
        >
           {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isVisual ? (
              <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center p-0.5 shrink-0 ${isSelected ? 'border-sky-500' : 'border-slate-700'}`}>
                <div className={`w-full h-full rounded-sm ${isSelected ? 'bg-sky-500' : 'bg-slate-700'}`} />
              </div>
            ) : (
              node.type === 'container' ? <LayoutIcon className="w-3.5 h-3.5 shrink-0" /> : <Square className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className={`text-[10px] font-black uppercase tracking-tight truncate ${isSelected ? 'text-white' : ''}`}>
              {isVisual ? node.label : (node.displayLabel || node.label)}
            </span>
            {node.locked && <Lock className="w-2.5 h-2.5 text-amber-500/70 shrink-0" />}
          </div>
          
          {linkedLocation && (
            <div className="flex items-center gap-1.5 mt-0.5 ml-5">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Linked →</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToMapping?.(linkedLocation);
                }}
                className="text-[8px] font-black text-sky-500 uppercase tracking-widest hover:text-sky-300 underline underline-offset-2 decoration-sky-500/30"
              >
                {linkedLocation.code}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isVisual && (
             <button 
               onClick={(e) => { e.stopPropagation(); onCloneNode?.(node.id); }}
               className="p-1 hover:bg-slate-700 rounded text-slate-600 hover:text-white"
               title="Clone"
             >
               <Copy className="w-3 h-3" />
             </button>
          )}
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (isVisual) {
                onUpdateNode?.(node.id, { locked: !node.locked });
              } else {
                // handle structure lock if supported
              }
            }}
            className={`p-1 rounded transition-colors ${node.locked ? 'text-amber-500' : 'text-slate-600 hover:text-white'}`}
          >
            {node.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
        </div>
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
              <UnifiedSidebarItem 
                key={child.id}
                node={child}
                type={child.nodeRole ? 'visual' : 'structure'}
                depth={depth + 1}
                locations={locations}
                visuals={visuals}
                selectedIds={selectedIds}
                selectedFrontCellIds={selectedFrontCellIds}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                onSelect={onSelect}
                onSelectFrontCell={onSelectFrontCell}
                setViewMode={setViewMode}
                onUpdateNode={onUpdateNode}
                onCloneNode={onCloneNode}
                onNavigateToMapping={onNavigateToMapping}
                parentVisualId={isVisual ? node.id : parentVisualId}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
