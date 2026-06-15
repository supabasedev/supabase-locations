/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Database, 
  Layers, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Box, 
  Search, 
  Filter, 
  Copy, 
  Package, 
  Layout as LayoutIcon, 
  Lock, 
  Unlock, 
  Link as LinkIcon, 
  Home,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { LogicalLocation, VisualNode, ViewMode, Layout } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  buildWorkspaceSemanticTree, 
  WorkspaceTreeNode 
} from '../../lib/workspaceTreeBuilder';
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
  onSelectFrontCell: (ids: string[]) => void;
  onUpdateNode?: (id: string, updates: Partial<VisualNode>) => void;
  onVisualizeLocation?: (locId: string) => void;
  onNavigateToMapping?: (location: LogicalLocation) => void;
}

export type Tab = 'locations' | 'presets' | 'layers';

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

function UnifiedTreeNodeRow({
  node,
  selectedId,
  selectedIds,
  selectedFrontCellIds,
  expandedIds,
  onToggleExpand,
  onSelectNode,
  onNavigateToMapping,
  onCloneNode,
  onUpdateNode,
  onVisualizeLocation
}: {
  node: WorkspaceTreeNode;
  selectedId: string | null;
  selectedIds: string[];
  selectedFrontCellIds: string[];
  expandedIds: string[];
  onToggleExpand: (id: string) => void;
  onSelectNode: (node: any) => void;
  onNavigateToMapping?: (location: LogicalLocation) => void;
  onCloneNode?: (id: string) => void;
  onUpdateNode?: (id: string, updates: Partial<VisualNode>) => void;
  onVisualizeLocation?: (locId: string) => void;
}) {
  const isExpanded = expandedIds.includes(node.id);
  const hasChildren = node.children && node.children.length > 0;

  // Determine selection states for Location half vs Visual half
  const isLocationSelected = node.location ? (selectedId === node.location.id || selectedIds.includes(node.location.id)) : false;
  
  let isVisualSelected = false;
  if (node.visual) {
    if (node.visual.mappingType === 'top_down' && node.visual.topDownVisualNode) {
      isVisualSelected = selectedId === node.visual.topDownVisualNode.id || selectedIds.includes(node.visual.topDownVisualNode.id);
    } else if (node.visual.mappingType === 'front_cell' && node.visual.frontStructureNode) {
      isVisualSelected = selectedFrontCellIds.includes(node.visual.frontStructureNode.id);
    } else if (node.visual.mappingType === 'generated') {
      isVisualSelected = selectedId === node.id || selectedIds.includes(node.id) || selectedFrontCellIds.includes(node.id);
    }
  } else if (node.type === 'visual') {
    isVisualSelected = selectedId === node.id || selectedIds.includes(node.id);
  } else if (node.type === 'structure') {
    isVisualSelected = selectedFrontCellIds.includes(node.id);
  }

  const isAnySelected = isLocationSelected || isVisualSelected;

  const getIndentLeft = (depth: number) => {
    if (depth === 0) return 0;
    if (depth === 1) return 10;
    if (depth === 2) return 18;
    return 24; // capped depth spacing
  };

  const padLeft = getIndentLeft(node.depth);

  const handleLocationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectNode({ ...node, clickTarget: 'location' });
  };

  const handleVisualClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectNode({ ...node, clickTarget: 'visual' });
  };

  return (
    <div className="select-none relative mb-2 group">
      <div 
        className={`
          rounded-2xl border transition-all flex flex-col overflow-hidden text-left bg-slate-900/60 backdrop-blur-md relative
          ${isAnySelected 
            ? 'border-sky-500/40 shadow-[0_0_15px_rgba(14,165,233,0.06)] bg-slate-900' 
            : 'border-slate-800 hover:border-slate-700/80 hover:bg-slate-900'}
        `}
        style={{ marginLeft: `${padLeft}px` }}
      >
        {/* Row 1: Location Layer (Top Half of Card) */}
        <div 
          onClick={handleLocationClick}
          className={`
            flex items-center gap-2 px-3 py-2 cursor-pointer transition-all border-b border-rose-955/5 border-dashed
            ${isLocationSelected ? 'bg-sky-500/10 text-sky-400' : 'hover:bg-slate-850/65 text-slate-300'}
          `}
        >
          {/* Collapse/Expand Arrow */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            className={`mr-1 text-slate-500 hover:text-white transition-colors p-1 rounded hover:bg-slate-800 shrink-0 ${!hasChildren && 'opacity-0 pointer-events-none'}`}
          >
             {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </div>

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <Box className={`w-3.5 h-3.5 shrink-0 ${node.location ? 'text-sky-450' : 'text-slate-600'}`} />
            
            <div className="flex-1 min-w-0 flex flex-col">
              <span className={`text-[10px] font-black uppercase tracking-tight truncate ${isLocationSelected ? 'text-white' : 'text-slate-200'}`}>
                {node.location ? node.location.name : "No Location Linked"}
              </span>
              {node.location && (
                <span className="text-[8px] font-mono text-slate-500 font-bold tracking-tight">
                  CODE: {node.location.code} • {node.location.role}
                </span>
              )}
            </div>
            
            {node.location && (
              <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 leading-none shrink-0 font-mono">
                LOC
              </span>
            )}
            {!node.location && (
              <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-500/5 text-rose-400/80 border border-rose-500/10 leading-none shrink-0 font-mono italic animate-pulse">
                Unlinked
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Visual Layer (Bottom Half of Card) */}
        <div 
          onClick={handleVisualClick}
          className={`
            flex items-center gap-2 px-3 py-2 cursor-pointer transition-all
            ${isVisualSelected ? 'bg-teal-500/10 text-teal-400' : 'hover:bg-slate-850/65 text-slate-400'}
          `}
        >
          {/* Spacer to align left of content with Row 1 content */}
          <div className="w-5 shrink-0" />

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <Layers className={`w-3.5 h-3.5 shrink-0 ${node.visual?.mappingType !== 'none' ? 'text-teal-400' : 'text-slate-600'}`} />
            
            <div className="flex-1 min-w-0 flex flex-col">
              {node.visual?.mappingType === 'top_down' && node.visual.topDownVisualNode && (
                <>
                  <span className={`text-[10px] font-black uppercase tracking-tight truncate ${isVisualSelected ? 'text-white' : 'text-slate-300'}`}>
                    {node.visual.topDownVisualNode.label}
                  </span>
                  <span className="text-[8px] font-mono text-slate-500 font-bold tracking-tight">
                    TOP DOWN VIEW MAPPED {node.visual.topDownVisualNode.supportsFrontView && "• FRONT READY"}
                  </span>
                </>
              )}
              {node.visual?.mappingType === 'front_cell' && node.visual.frontStructureNode && (
                <>
                  <span className={`text-[10px] font-black uppercase tracking-tight truncate ${isVisualSelected ? 'text-white' : 'text-slate-300'}`}>
                    {node.visual.frontStructureNode.label || node.visual.frontStructureNode.displayLabel || 'Shelving Cell'}
                  </span>
                  <span className="text-[8px] font-mono text-slate-500 font-bold tracking-tight">
                    FRONT VIEW CELL • {node.visual.topDownVisualNode?.label}
                  </span>
                </>
              )}
              {node.visual?.mappingType === 'generated' && node.visual.generatedVisualNode && (
                <>
                  <span className={`text-[10px] font-black uppercase tracking-tight truncate ${isVisualSelected ? 'text-white' : 'text-slate-300'}`}>
                    {node.visual.generatedVisualNode.label}
                  </span>
                  <span className="text-[8px] font-mono text-slate-500 font-bold tracking-tight">
                     GENERATED VISUAL-ONLY
                  </span>
                </>
              )}
              {(node.type === 'visual' || node.type === 'structure') && !node.visual && (
                <>
                  <span className={`text-[10px] font-black uppercase tracking-tight truncate ${isVisualSelected ? 'text-white' : 'text-slate-300'}`}>
                    {node.label}
                  </span>
                  <span className="text-[8px] font-mono text-slate-500 font-bold text-teal-400">
                     PHYSICAL PLACEMENT ONLY
                  </span>
                </>
              )}
              {(!node.visual || node.visual.mappingType === 'none') && node.type !== 'visual' && node.type !== 'structure' && (
                <>
                  <span className="text-[10px] font-bold text-slate-500 italic">No Visual Assigned</span>
                  <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest font-black leading-tight">Spatial mapping pending</span>
                </>
              )}
            </div>

            {/* Badges */}
            {node.visual?.mappingType === 'top_down' && (
              <span className="text-[7px] font-black uppercase px-1.5 py-0.5 bg-slate-950 text-teal-400 border border-slate-800 leading-none shrink-0 font-mono">
                TOP
              </span>
            )}
            {node.visual?.mappingType === 'front_cell' && (
              <span className="text-[7px] font-black uppercase px-1.5 py-0.5 bg-slate-950 text-teal-400 border border-slate-800 leading-none shrink-0 font-mono">
                FRONT
              </span>
            )}
            {(!node.visual || node.visual.mappingType === 'none') && node.type !== 'visual' && node.type !== 'structure' && (
              <span className="text-[7px] font-black uppercase px-1.5 py-0.5 bg-rose-950/25 text-rose-500/80 border border-rose-950/20 leading-none shrink-0 font-mono italic">
                 Unmapped
              </span>
            )}
          </div>
        </div>

        {/* Hover Actions Bar */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-slate-900/90 pl-2 py-0.5 rounded-lg border border-slate-800/80">
          {(!node.visual || node.visual.mappingType === 'none') && node.location && onVisualizeLocation && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onVisualizeLocation(node.location!.id);
              }}
              className="p-1 px-1.5 bg-sky-500 text-slate-950 hover:bg-sky-400 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1 transition-all"
              title="Add Physical Model"
            >
              <Plus className="w-2 h-2" /> Link Model
            </button>
          )}

          {node.type === 'visual' && onCloneNode && node.state !== 'broken_mapping' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onCloneNode(node.id);
              }}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              title="Clone Object"
            >
              <Copy className="w-3 h-3" />
            </button>
          )}

          {node.location && (node.visual?.mappingType === 'top_down' || node.visual?.mappingType === 'front_cell') && onNavigateToMapping && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToMapping(node.location!);
              }}
              className="p-1.5 rounded-lg text-sky-400 hover:bg-sky-500 hover:text-slate-950 transition-all"
              title="Locate visually"
            >
              <LinkIcon className="w-3 h-3" />
            </button>
          )}

          {node.visual?.topDownVisualNode && onUpdateNode && (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onUpdateNode(node.visual!.topDownVisualNode!.id, { locked: !node.visual!.topDownVisualNode!.locked });
              }}
              className={`p-1.5 rounded-lg transition-colors ${node.visual.topDownVisualNode.locked ? 'text-amber-500' : 'text-slate-400 hover:text-white'}`}
              title={node.visual.topDownVisualNode.locked ? "Unlock" : "Lock"}
            >
              {node.visual.topDownVisualNode.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden relative"
          >
            {/* Indent connector line */}
            <div 
              className="absolute top-0 bottom-4 w-px bg-slate-800/60 pointer-events-none" 
              style={{ left: `${padLeft + 14}px` }}
            />
            {node.children.map((child: any) => (
              <UnifiedTreeNodeRow 
                key={child.id}
                node={child}
                selectedId={selectedId}
                selectedIds={selectedIds}
                selectedFrontCellIds={selectedFrontCellIds}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                onSelectNode={onSelectNode}
                onNavigateToMapping={onNavigateToMapping}
                onCloneNode={onCloneNode}
                onUpdateNode={onUpdateNode}
                onVisualizeLocation={onVisualizeLocation}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  const [searchQuery, setSearchQuery] = useState('');

  // Unified Workspace Tree Generation
  const { workspaceTree, unlinkedStorageTree, contextObjects, brokenOrOutOfScope } = useMemo(() => {
    return buildWorkspaceSemanticTree({
      rootLocationId,
      locations,
      visuals
    });
  }, [rootLocationId, locations, visuals]);

  // Recursively gather all root IDs to expand them initially
  const initialExpandedIds = useMemo(() => {
    const ids: string[] = [];
    if (rootLocationId) ids.push(rootLocationId);
    workspaceTree.forEach(node => {
      ids.push(node.id);
      node.children.forEach(c => ids.push(c.id));
    });
    unlinkedStorageTree.forEach(node => ids.push(node.id));
    return ids;
  }, [rootLocationId, workspaceTree, unlinkedStorageTree]);

  const [expandedIds, setExpandedIds] = useState<string[]>(initialExpandedIds);

  const handleToggleExpand = (id: string) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Node Click Selection Synchronization
  const handleSelectNode = (node: any) => {
    const clickTarget = node.clickTarget || 'location';

    if (clickTarget === 'location') {
      if (node.location) {
        onSelect(node.location.id);
        onSelectFrontCell([]);
      } else {
        onSelect(node.id);
      }
    } else {
      if (node.visual) {
        const { mappingType, topDownVisualNode, frontStructureNode } = node.visual;
        
        if (mappingType === 'top_down' && topDownVisualNode) {
          onSelect(topDownVisualNode.id);
          onSelectFrontCell([]);
          setViewMode(ViewMode.TOP_DOWN);
        } else if (mappingType === 'front_cell' && frontStructureNode && topDownVisualNode) {
          onSelect(topDownVisualNode.id);
          onSelectFrontCell([frontStructureNode.id]);
          setViewMode(ViewMode.FRONT);
        } else if (mappingType === 'generated') {
          if (frontStructureNode && topDownVisualNode) {
            onSelect(topDownVisualNode.id);
            onSelectFrontCell([frontStructureNode.id]);
            setViewMode(ViewMode.FRONT);
          } else {
            onSelect(node.id);
            onSelectFrontCell([]);
            setViewMode(ViewMode.TOP_DOWN);
          }
        } else {
          if (node.location) {
            onSelect(node.location.id);
            onSelectFrontCell([]);
            setViewMode(ViewMode.TOP_DOWN);
          } else {
            onSelect(node.id);
          }
        }
      } else {
        onSelect(node.id);
        onSelectFrontCell([]);
      }
    }
  };

  // Filter helper
  function filterTreeNodes(nodes: WorkspaceTreeNode[], query: string): WorkspaceTreeNode[] {
    if (!query) return nodes;
    const q = query.toLowerCase();
    
    return nodes.map(node => {
      const labelMatch = node.label.toLowerCase().includes(q);
      const codeMatch = node.code?.toLowerCase().includes(q);
      const filteredChildren = filterTreeNodes(node.children, query);
      
      if (labelMatch || codeMatch || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren
        };
      }
      return null;
    }).filter((n): n is WorkspaceTreeNode => n !== null);
  }

  const filteredWorkspaceTree = useMemo(() => {
    return filterTreeNodes(workspaceTree, searchQuery);
  }, [workspaceTree, searchQuery]);

  const filteredUnlinkedStorage = useMemo(() => {
    return filterTreeNodes(unlinkedStorageTree, searchQuery);
  }, [unlinkedStorageTree, searchQuery]);

  const filteredContextObjects = useMemo(() => {
    return filterTreeNodes(contextObjects, searchQuery);
  }, [contextObjects, searchQuery]);

  const filteredBroken = useMemo(() => {
    return filterTreeNodes(brokenOrOutOfScope, searchQuery);
  }, [brokenOrOutOfScope, searchQuery]);

  const handleMainTabChange = (targetTab: Tab) => {
    onTabChange(targetTab);
  };

  return (
    <div className="w-68 bg-slate-950 border-r border-slate-800 flex flex-col z-30 flex-shrink-0">
      <div className="flex bg-slate-950 border-b border-slate-800">
        <TabBtn 
          icon={<Database />} 
          active={activeTab === 'locations'} 
          onClick={() => handleMainTabChange('locations')} 
          title="Workspace Tree" 
        />
        <TabBtn 
          icon={<Package />} 
          active={activeTab === 'presets'} 
          onClick={() => handleMainTabChange('presets')} 
          title="Preset Library" 
        />
        <TabBtn 
          icon={<Layers />} 
          active={activeTab === 'layers'} 
          onClick={() => handleMainTabChange('layers')} 
          title="Layers" 
        />
      </div>

      <div className="p-3 border-b border-slate-850 bg-slate-900/40">
         <div className="relative group">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500 transition-colors group-focus-within:text-sky-500" />
            <input 
              type="text" 
              placeholder="Filter workspace tree..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700/60 rounded text-[10px] font-black uppercase tracking-widest text-white placeholder-slate-700 focus:ring-1 focus:ring-sky-500 transition-all outline-none"
            />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none p-3 space-y-6">
        {activeTab === 'locations' && (
          <>
            {/* 1. Primary Workspace Tree */}
            <div className="space-y-1">
              <div className="px-2 mb-3 flex items-center justify-between">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Workspace Tree Node</p>
                {rootLocationId && (
                  <div className="flex items-center gap-1 text-[7px] font-black text-sky-400 uppercase tracking-widest bg-sky-500/5 px-1.5 py-0.5 rounded border border-sky-500/10">
                    <Home className="w-2.5 h-2.5" /> Scoped root
                  </div>
                )}
              </div>
              {filteredWorkspaceTree.length > 0 ? (
                filteredWorkspaceTree.map(node => (
                  <UnifiedTreeNodeRow 
                    key={node.id}
                    node={node}
                    selectedId={selectedId}
                    selectedIds={selectedIds}
                    selectedFrontCellIds={selectedFrontCellIds}
                    expandedIds={expandedIds}
                    onToggleExpand={handleToggleExpand}
                    onSelectNode={handleSelectNode}
                    onNavigateToMapping={onNavigateToMapping}
                    onCloneNode={onCloneNode}
                    onUpdateNode={onUpdateNode}
                    onVisualizeLocation={onVisualizeLocation}
                  />
                ))
              ) : (
                <div className="p-4 text-center rounded-2xl bg-slate-900 border border-slate-800 border-dashed">
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest">No matching locations found</p>
                </div>
              )}
            </div>

            {/* 2. Unlinked Visual Candidates */}
            <div className="space-y-1 pt-3 border-t border-slate-900">
              <div className="px-2 mb-3">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic font-mono">Unlinked Visual Candidates</p>
              </div>
              {filteredUnlinkedStorage.length > 0 ? (
                filteredUnlinkedStorage.map(node => (
                  <UnifiedTreeNodeRow 
                    key={node.id}
                    node={node}
                    selectedId={selectedId}
                    selectedIds={selectedIds}
                    selectedFrontCellIds={selectedFrontCellIds}
                    expandedIds={expandedIds}
                    onToggleExpand={handleToggleExpand}
                    onSelectNode={handleSelectNode}
                    onNavigateToMapping={onNavigateToMapping}
                    onCloneNode={onCloneNode}
                    onUpdateNode={onUpdateNode}
                    onVisualizeLocation={onVisualizeLocation}
                  />
                ))
              ) : !searchQuery && (
                <div className="p-3 text-center rounded-2xl bg-slate-900/20 text-[9px] text-slate-600 italic">
                  All storage objects linked
                </div>
              )}
            </div>

            {/* 3. Context Objects */}
            <div className="space-y-1 pt-3 border-t border-slate-900">
              <div className="px-2 mb-3">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic font-mono">Context Objects</p>
              </div>
              {filteredContextObjects.length > 0 ? (
                filteredContextObjects.map(node => (
                  <UnifiedTreeNodeRow 
                    key={node.id}
                    node={node}
                    selectedId={selectedId}
                    selectedIds={selectedIds}
                    selectedFrontCellIds={selectedFrontCellIds}
                    expandedIds={expandedIds}
                    onToggleExpand={handleToggleExpand}
                    onSelectNode={handleSelectNode}
                    onNavigateToMapping={onNavigateToMapping}
                    onCloneNode={onCloneNode}
                    onUpdateNode={onUpdateNode}
                    onVisualizeLocation={onVisualizeLocation}
                  />
                ))
              ) : !searchQuery && (
                <div className="p-3 text-center rounded-2xl bg-slate-900/20 text-[9px] text-slate-600 italic">
                  No pure context visuals defined
                </div>
              )}
            </div>

            {/* 4. Broken Mappings / Issues */}
            {filteredBroken.length > 0 && (
              <div className="space-y-1 pt-3 border-t border-rose-950/20">
                <div className="px-2 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-rose-455 shrink-0 animate-pulse" />
                  <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest italic font-mono">Broken / Out of Scope Mappings</p>
                </div>
                {filteredBroken.map(node => (
                  <UnifiedTreeNodeRow 
                    key={node.id}
                    node={node}
                    selectedId={selectedId}
                    selectedIds={selectedIds}
                    selectedFrontCellIds={selectedFrontCellIds}
                    expandedIds={expandedIds}
                    onToggleExpand={handleToggleExpand}
                    onSelectNode={handleSelectNode}
                    onNavigateToMapping={onNavigateToMapping}
                    onCloneNode={onCloneNode}
                    onUpdateNode={onUpdateNode}
                    onVisualizeLocation={onVisualizeLocation}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'presets' && (
          <div className="space-y-6">
             {PRESET_CATEGORIES.map(cat => (
                <div key={cat.name}>
                   <p className="text-[9px] font-black text-slate-650 uppercase tracking-widest px-2 mb-3 italic">{cat.name}</p>
                   <div className="grid grid-cols-1 gap-2">
                     {cat.items.map((item, idx) => (
                       <div 
                         key={idx}
                         onClick={() => onAddPreset(item)}
                         className="group p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/30 hover:bg-slate-850/30 transition-all cursor-grab active:cursor-grabbing flex items-center gap-3"
                       >
                          <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 text-slate-500 group-hover:text-sky-450 transition-colors">
                             <item.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-[10px] font-black uppercase tracking-tight text-slate-200 group-hover:text-white truncate">{item.label}</p>
                             <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                                {item.w/10}x{item.d/10}cm surface
                             </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                             <div className="w-6 h-6 rounded-lg bg-sky-500 text-slate-950 flex items-center justify-center shadow-md">
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

        {activeTab === 'layers' && (
           <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-30">
             <Layers className="w-10 h-10 text-slate-600 animate-pulse" />
             <p className="text-[10px] font-black uppercase tracking-widest italic">Layer stack coming soon</p>
           </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-850 bg-slate-950 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-650" />
            <span className="text-[9px] font-black text-slate-750 uppercase tracking-[0.2em] italic">Full scope paired</span>
         </div>
      </div>
    </div>
  );
}
