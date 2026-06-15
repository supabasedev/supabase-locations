import React, { useState, useMemo } from 'react';
import { 
  Box,
  Package,
  AlertTriangle
} from 'lucide-react';
import { 
  Layout, 
  VisualNode, 
  LogicalLocation, 
  ViewMode, 
  LocationRole,
  VisualNodeRole
} from '../../types';
import { getAllDividers } from '../../lib/structureUtils';
import EditorToolbar from './EditorToolbar';
import EditorSidebarLeft, { Tab } from './EditorSidebarLeft';
import EditorSidebarRight from './EditorSidebarRight';
import SelectionRibbon from './SelectionRibbon';
import ToolRibbon from './ToolRibbon';
import EditorCanvas from './EditorCanvas';
import FrontViewEditor from './FrontViewEditor';
import AddObjectModal from './AddObjectModal';
import WorkspaceDataDialog from './WorkspaceDataDialog';
import { motion, AnimatePresence } from 'motion/react';

interface EditorPageProps {
  layout: Layout;
  locations: LogicalLocation[];
  visuals: VisualNode[];
  setVisuals: React.Dispatch<React.SetStateAction<VisualNode[]>>;
  setLocations: React.Dispatch<React.SetStateAction<LogicalLocation[]>>;
  onBack: () => void;
}

export type EditorTool = 'select' | 'pan' | 'add' | 'measure' | 'split';

export default function EditorPage({ 
  layout, 
  locations, 
  visuals, 
  setVisuals, 
  setLocations,
  onBack 
}: EditorPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.TOP_DOWN);
  const [activeTab, setActiveTab ] = useState<Tab>('locations');
  const [selectedTool, setSelectedTool ] = useState<EditorTool>('select');
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedFrontCellIds, setSelectedFrontCellIds] = useState<string[]>([]);
  const [selectedFrontDividerIds, setSelectedFrontDividerIds] = useState<string[]>([]);
  
  // Warning modal state
  const [activeWarning, setActiveWarning] = useState<{
    type: 'delete_visual' | 'unlink_visual';
    nodes: string[];
    title: string;
    message: string;
    subLocations?: string[];
  } | null>(null);

  // ... rest of state ...
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDataDialogOpen, setIsDataDialogOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(10);
  const [showRulers, setShowRulers] = useState(true);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [frontSplitDirection, setFrontSplitDirection] = useState<'horizontal' | 'vertical' | null>(null);
  const [batchMapTrigger, setBatchMapTrigger] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [visualizeLocId, setVisualizeLocId] = useState<string | null>(null);

  // Sync tab when viewMode changes
  React.useEffect(() => {
    setActiveTab('locations');
  }, [viewMode]);

  // Selection synchronization cleanup helper to avoid stale settings
  React.useEffect(() => {
    setSelectedFrontCellIds([]);
    setSelectedFrontDividerIds([]);
  }, [selectedNodeIds]);

  const getNestedMappedLocations = (node: VisualNode): string[] => {
    const locCodes: string[] = [];
    if (node.locationId) {
      const loc = locations.find(l => l.id === node.locationId);
      if (loc) locCodes.push(loc.code);
    }
    const scanStructure = (s: any) => {
      if (s.locationId) {
        const loc = locations.find(l => l.id === s.locationId);
        if (loc) locCodes.push(loc.code);
      }
      if (s.children) {
        s.children.forEach(scanStructure);
      }
    };
    if (node.structure) {
      scanStructure(node.structure);
    }
    return locCodes;
  };

  const handleNavigateToMapping = (location: LogicalLocation) => {
    // 1. Check Top-Down Mapping
    const topDownNode = visuals.find(v => v.locationId === location.id);
    if (topDownNode) {
      setSelectedNodeIds([topDownNode.id]);
      setActiveTab('locations');
      setViewMode(ViewMode.TOP_DOWN);
      return;
    }

    // 2. Check Front-View Mapping
    const findsInStructure = (node: any, targetId: string): string | null => {
      if (node.locationId === targetId) return node.id;
      if (node.children) {
        for (const child of node.children) {
          const result = findsInStructure(child, targetId);
          if (result) return result;
        }
      }
      return null;
    };

    const parentNode = visuals.find(v => v.structure && findsInStructure(v.structure, location.id));
    if (parentNode) {
      const cellId = findsInStructure(parentNode.structure, location.id);
      setSelectedNodeIds([parentNode.id]);
      if (cellId) setSelectedFrontCellIds([cellId]);
      setViewMode(ViewMode.FRONT);
      setActiveTab('locations');
      return;
    }
    
    // Unmapped - just select the location and stay on locations tab
    setSelectedNodeIds([location.id]);
    setActiveTab('locations');
  };

  // Derived state
  const layoutVisuals = useMemo(() => 
    visuals.filter(v => v.layoutId === layout.id)
  , [visuals, layout.id]);

  const rootVisual = useMemo(() => 
    layoutVisuals.find(v => v.parentId === null) || null
  , [layoutVisuals]);

  const handleFitScreen = () => {
    setFitTrigger(prev => prev + 1);
  };

  const handleImport = (newVisuals: VisualNode[]) => {
    // Clear existing visuals for this layout and add new ones
    setVisuals(prev => [
      ...prev.filter(v => v.layoutId !== layout.id),
      ...newVisuals
    ]);
  };
  
  const selectedNodeId = selectedNodeIds[0] || null;
  
  const selectedNode = useMemo(() => {
    // 1. Direct match with visual node
    const directVisual = layoutVisuals.find(v => v.id === selectedNodeId);
    if (directVisual) return directVisual;

    // 2. Resolve via selected Location ID
    if (selectedNodeId) {
      // Find top-down visual node mapped to this location
      const topDown = layoutVisuals.find(v => v.locationId === selectedNodeId);
      if (topDown) return topDown;

      // Find if this is mapped to a cell in some visual's front structure
      const findsInStructure = (n: any, tId: string): string | null => {
        if (n.locationId === tId) return n.id;
        if (n.children) {
          for (const c of n.children) {
            const found = findsInStructure(c, tId);
            if (found) return found;
          }
        }
        return null;
      };

      const cellParent = layoutVisuals.find(v => v.structure && findsInStructure(v.structure, selectedNodeId));
      if (cellParent) return cellParent;
    }
    return null;
  }, [layoutVisuals, selectedNodeId]);

  const isFrontDisabled = useMemo(() => {
    if (!selectedNode) return true;
    // Floor (root) has parentId === null. Zones have type === 'zone'.
    return selectedNode.parentId === null || selectedNode.type === 'zone' || !selectedNode.supportsFrontView;
  }, [selectedNode]);

  const selectedNodes = useMemo(() => {
    if (selectedNodeIds.length === 1 && selectedNode) {
      return [selectedNode];
    }
    return layoutVisuals.filter(v => selectedNodeIds?.includes(v.id));
  }, [layoutVisuals, selectedNodeIds, selectedNode]);

  const selectedLocation = useMemo(() => {
    // If a node is selected, try to find its linked location
    if (selectedNode?.locationId) {
      return locations.find(l => l.id === selectedNode.locationId) || null;
    }
    // Otherwise, maybe we selected a location directly from the tree
    if (selectedNodeId && layoutVisuals.every(v => v.id !== selectedNodeId)) {
        return locations.find(l => l.id === selectedNodeId) || null;
    }
    return null;
  }, [selectedNode, selectedNodeId, locations, layoutVisuals]);

  const handleUnlink = (nodeId: string) => {
    const node = visuals.find(v => v.id === nodeId);
    if (node) {
      const mappedLocs = getNestedMappedLocations(node);
      if (mappedLocs.length > 0) {
        setActiveWarning({
          type: 'unlink_visual',
          nodes: [nodeId],
          title: "Unlink Mapped Visual Node",
          message: `Unlinking objects will sever the physical bridge connection for the following logical locations. They will return to unmapped status.`,
          subLocations: mappedLocs
        });
        return;
      }
    }
    setVisuals(prev => prev.map(v => v.id === nodeId ? { ...v, locationId: null } : v));
  };

  const handleRemoveVisual = (nodeId: string) => {
    const node = visuals.find(v => v.id === nodeId);
    if (node) {
      const mappedLocs = getNestedMappedLocations(node);
      if (mappedLocs.length > 0) {
        setActiveWarning({
          type: 'delete_visual',
          nodes: [nodeId],
          title: "Delete Physical Visual Node",
          message: `Permanently deleting will destroy the physical placement model mapping for following locations:`,
          subLocations: mappedLocs
        });
        return;
      }
    }
    setVisuals(prev => prev.filter(v => v.id !== nodeId));
    setSelectedNodeIds(prev => prev.filter(id => id !== nodeId));
  };

  const handleVisualizeLocation = (locId: string) => {
    setVisualizeLocId(locId);
    setIsAddModalOpen(true);
  };

  const handleAddObject = (data: any) => {
    // Logic for adding visual, location, or both
    const newId = `new-${Date.now()}`;
    const rootVisual = layoutVisuals.find(v => v.parentId === null);
    
    if (data.type === 'visual' || data.type === 'both' || data.type === 'existing') {
        const newVisual: VisualNode = {
            id: `v-${newId}`,
            layoutId: layout.id,
            locationId: data.type === 'both' ? `l-${newId}` : (data.type === 'existing' ? data.locationId : null),
            type: 'rectangle',
            label: data.label || 'New Object',
            nodeRole: (data.type === 'both' || data.type === 'existing') 
                ? VisualNodeRole.LOCATION_REPRESENTATION 
                : VisualNodeRole.UNASSIGNED_STORAGE,
            x: rootVisual ? rootVisual.width / 10 : 50,
            y: rootVisual ? rootVisual.depth / 10 : 30,
            z: 0,
            rotation: 0,
            width: data.dimensions?.width || 1000,
            height: data.dimensions?.height || 2000,
            depth: data.dimensions?.depth || 600,
            color: '#cbd5e1',
            viewMode: viewMode,
            parentId: rootVisual?.id || null
        };
        setVisuals(prev => [...prev, newVisual]);
        setSelectedNodeIds([newVisual.id]);
    }

    if (data.type === 'location' || data.type === 'both') {
        const newLoc: LogicalLocation = {
            id: `l-${newId}`,
            branchId: layout.branchId,
            code: data.code || `NEW-${newId.slice(-4)}`,
            name: data.name || data.label || 'New Location',
            parentId: data.parentId === 'ROOT-SYS' ? null : (data.parentId || null),
            role: data.role || LocationRole.STORAGE,
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
            pathCode: data.code || `NEW-${newId.slice(-4)}`,
            pathName: data.name || data.label || 'New Location',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setLocations(prev => [...prev, newLoc]);
    }

    setIsAddModalOpen(false);
  };

  const handleAddPreset = (preset: any) => {
    const newId = `preset-${Date.now()}`;
    const rootVisual = layoutVisuals.find(v => v.parentId === null);
    
    // Default position at 1/10th of the room size
    const defaultX = rootVisual ? rootVisual.width / 10 : 100;
    const defaultY = rootVisual ? rootVisual.depth / 10 : 100;

    const newVisual: VisualNode = {
      id: `v-${newId}`,
      layoutId: layout.id,
      locationId: null,
      type: preset.type as any,
      label: preset.label,
      x: defaultX, 
      y: defaultY,
      z: 0,
      rotation: 0,
      width: preset.w,
      height: preset.h,
      depth: preset.d,
      color: preset.color,
      viewMode: ViewMode.TOP_DOWN,
      parentId: rootVisual?.id || null,
      supportsFrontView: preset.supportsFrontView,
      structure: preset.structure,
      zonePattern: preset.zonePattern,
      secondaryColor: preset.secondaryColor,
      blockPlacement: preset.blockPlacement,
      zoneType: preset.zoneType
    };

    setVisuals(prev => [...prev, newVisual]);
    setSelectedNodeIds([newVisual.id]);
  };

  const handleUpdateNode = (id: string, updates: Partial<VisualNode>) => {
    setVisuals(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const handleUpdateNodes = (nodeUpdates: { id: string, updates: Partial<VisualNode> }[]) => {
    setVisuals(prev => prev.map(v => {
      const update = nodeUpdates.find(u => u.id === v.id);
      return update ? { ...v, ...update.updates } : v;
    }));
  };

  const handleCloneNode = (id: string) => {
    const nodeToClone = visuals.find(v => v.id === id);
    if (!nodeToClone) return;

    const newId = `v-clone-${Date.now()}`;
    const clonedNode: VisualNode = JSON.parse(JSON.stringify(nodeToClone));
    
    clonedNode.id = newId;
    clonedNode.label = `${nodeToClone.label} Copy`;
    
    // Position slightly offset if it's the same parent, to make it visible
    clonedNode.x += 20;
    clonedNode.y += 20;

    setVisuals(prev => [...prev, clonedNode]);
    setSelectedNodeIds([newId]);
  };

  const handleClearSelection = () => {
    setSelectedNodeIds([]);
    setSelectedFrontCellIds([]);
    setSelectedFrontDividerIds([]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      <EditorToolbar 
        layoutName={layout.name}
        viewMode={viewMode}
        setViewMode={setViewMode}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        snapToGrid={snapToGrid}
        setSnapToGrid={setSnapToGrid}
        gridSize={gridSize}
        setGridSize={setGridSize}
        showRulers={showRulers}
        setShowRulers={setShowRulers}
        selectedNodeId={selectedNodeId}
        isFrontDisabled={isFrontDisabled}
        onBack={onBack}
        onFitScreen={handleFitScreen}
        onOpenData={() => setIsDataDialogOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <div onClick={(e) => e.stopPropagation()} className="h-full flex">
            <EditorSidebarLeft 
              layout={layout}
              locations={locations}
              visuals={layoutVisuals}
              selectedId={selectedNodeId}
              selectedIds={selectedNodeIds}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onSelect={(id) => setSelectedNodeIds(id ? [id] : [])}
              onSelectMultiple={setSelectedNodeIds}
              onCloneNode={handleCloneNode}
              onAddPreset={handleAddPreset}
              viewMode={viewMode}
              setViewMode={setViewMode}
              selectedFrontCellIds={selectedFrontCellIds}
              onSelectFrontCell={setSelectedFrontCellIds}
              onUpdateNode={handleUpdateNode}
              onVisualizeLocation={handleVisualizeLocation}
              onNavigateToMapping={handleNavigateToMapping}
            />
            <ToolRibbon 
              selectedTool={selectedTool}
              setSelectedTool={setSelectedTool}
              onAdd={() => setIsAddModalOpen(true)}
              isFrontMode={viewMode === ViewMode.FRONT}
              onSelectAllDividers={(type) => {
                if (selectedNode?.structure) {
                  const dividerIds = getAllDividers(selectedNode.structure, type);
                  setSelectedFrontDividerIds(dividerIds);
                  setSelectedFrontCellIds([]);
                }
              }}
            />
        </div>

        <div className="flex-1 relative bg-[#020617] flex flex-col">
           {viewMode === ViewMode.TOP_DOWN ? (
            <EditorCanvas 
              visuals={layoutVisuals}
              viewMode={viewMode}
              tool={selectedTool}
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
              showGrid={showGrid}
              snapToGrid={snapToGrid}
              gridSize={gridSize}
              showRulers={showRulers}
              selectedNodeIds={selectedNodeIds}
              onSelectNodes={setSelectedNodeIds}
              onUpdateNode={handleUpdateNode}
              onUpdateNodes={handleUpdateNodes}
              fitTrigger={fitTrigger}
            />
          ) : viewMode === ViewMode.FRONT && selectedNode && selectedNode.supportsFrontView ? (
            <FrontViewEditor 
              node={selectedNode}
              locations={locations}
              onUpdateNode={handleUpdateNode}
              selectedCellIds={selectedFrontCellIds}
              onSelectCells={setSelectedFrontCellIds}
              selectedDividerIds={selectedFrontDividerIds}
              onSelectDividers={setSelectedFrontDividerIds}
              tool={selectedTool}
              triggerSplit={frontSplitDirection}
              onClearSplitTrigger={() => setFrontSplitDirection(null)}
              triggerBatchMap={batchMapTrigger}
              onClearBatchMapTrigger={() => setBatchMapTrigger(false)}
              onCancel={() => setViewMode(ViewMode.TOP_DOWN)}
              onDeselect={handleClearSelection}
              fitTrigger={fitTrigger}
            />
          ) : (
            <EditorCanvas 
              visuals={layoutVisuals}
              viewMode={viewMode}
              tool={selectedTool}
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
              showGrid={showGrid}
              snapToGrid={snapToGrid}
              gridSize={gridSize}
              showRulers={showRulers}
              selectedNodeIds={selectedNodeIds}
              onSelectNodes={setSelectedNodeIds}
              onUpdateNode={handleUpdateNode}
              onUpdateNodes={handleUpdateNodes}
              fitTrigger={fitTrigger}
            />
          )}

           {/* Contextual Empty States */}
           {viewMode === ViewMode.FRONT && (!selectedNode || !selectedNode.supportsFrontView) && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px]">
               <div className="max-w-md p-8 bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl text-center space-y-4">
                 <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto text-sky-400">
                   <Box className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold text-white uppercase tracking-tight">Front Context</h3>
                 <p className="text-slate-400 text-sm leading-relaxed">
                   Select a cabinet, rack, shelf unit, or wall storage object to edit its front view.
                 </p>
                 <button 
                   onClick={() => setViewMode(ViewMode.TOP_DOWN)}
                   className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                 >
                   Return to Top
                 </button>
               </div>
             </div>
           )}
        </div>

          <div className="flex bg-slate-900 border-l border-slate-800 h-full overflow-visible" onClick={(e) => e.stopPropagation()}>
            <SelectionRibbon 
              viewMode={viewMode}
              selectedNode={selectedNode}
              selectedNodes={selectedNodes}
              selectedLocation={selectedLocation}
              selectedFrontCellIds={selectedFrontCellIds}
              onSetViewMode={setViewMode}
              onClone={() => selectedNode && handleCloneNode(selectedNode.id)}
              onRemove={() => selectedNodeIds.forEach(handleRemoveVisual)}
              onLink={() => setIsLinking(true)}
              onUnlink={() => selectedNode && handleUnlink(selectedNode.id)}
              onFrontSplit={setFrontSplitDirection}
              onBatchMap={() => setBatchMapTrigger(true)}
              onVisualizeLocation={handleVisualizeLocation}
              onCreateLocation={() => {
                if (selectedNode) {
                    const newLocId = `l-gen-${Date.now()}`;
                    setLocations(prev => [...prev, {
                        id: newLocId,
                        branchId: layout.branchId,
                        code: `LOC-${selectedNode.label.toUpperCase()}`,
                        name: selectedNode.label,
                        parentId: null,
                        role: LocationRole.STORAGE,
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
                        pathCode: `LOC-${selectedNode.label.toUpperCase()}`,
                        pathName: selectedNode.label,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }]);
                    setVisuals(prev => prev.map(v => v.id === selectedNode.id ? { ...v, locationId: newLocId } : v));
                }
              }}
            />
            <EditorSidebarRight 
              layout={layout}
              selectedNode={selectedNode}
              selectedNodes={selectedNodes}
              selectedLocation={selectedLocation}
              locations={locations}
              visuals={layoutVisuals}
              viewMode={viewMode}
              selectedFrontCellIds={selectedFrontCellIds}
              selectedFrontDividerIds={selectedFrontDividerIds}
              onSelectFrontCell={setSelectedFrontCellIds}
              onSelectFrontDividers={setSelectedFrontDividerIds}
              onFrontSplit={setFrontSplitDirection}
              onBatchMap={() => setBatchMapTrigger(true)}
              onUnlink={handleUnlink}
              onRemoveVisual={handleRemoveVisual}
              onUpdateNode={handleUpdateNode}
              onUpdateNodes={handleUpdateNodes}
              onSetViewMode={setViewMode}
              isLinking={isLinking}
              setIsLinking={setIsLinking}
              onAssignLocation={(locId) => {
                  if (selectedNodeId) {
                      setVisuals(prev => prev.map(v => v.id === selectedNodeId ? { ...v, locationId: locId } : v));
                  }
              }}
              onCreateLocationFromVisual={() => {
                  if (selectedNode) {
                      const newLocId = `l-gen-${Date.now()}`;
                      setLocations(prev => [...prev, {
                          id: newLocId,
                          branchId: layout.branchId,
                          code: `LOC-${selectedNode.label.toUpperCase()}`,
                          name: selectedNode.label,
                          parentId: null,
                          role: LocationRole.STORAGE,
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
                          pathCode: `LOC-${selectedNode.label.toUpperCase()}`,
                          pathName: selectedNode.label,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                      }]);
                      setVisuals(prev => prev.map(v => v.id === selectedNode.id ? { ...v, locationId: newLocId } : v));
                  }
              }}
            />
         </div>
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <AddObjectModal 
            onClose={() => {
              setIsAddModalOpen(false);
              setVisualizeLocId(null);
            }} 
            onSubmit={handleAddObject}
            locations={locations}
            initialLocationId={visualizeLocId || undefined}
          />
        )}
        {isDataDialogOpen && (
          <WorkspaceDataDialog 
            layout={layout}
            visuals={layoutVisuals}
            locations={locations}
            onImport={handleImport}
            onClose={() => setIsDataDialogOpen(false)}
          />
        )}
        {activeWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="max-w-md w-full p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start gap-3 text-amber-500 bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">{activeWarning.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{activeWarning.message}</p>
                </div>
              </div>

              {activeWarning.subLocations && activeWarning.subLocations.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic px-1">Affected Locations:</p>
                  <div className="max-h-32 overflow-y-auto bg-slate-950 rounded-xl p-3 border border-slate-850 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {activeWarning.subLocations.map((loc, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        {loc}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setActiveWarning(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const idsToChange = activeWarning.nodes;
                    if (activeWarning.type === 'delete_visual') {
                      setVisuals(prev => prev.filter(v => !idsToChange.includes(v.id)));
                      setSelectedNodeIds(prev => prev.filter(id => !idsToChange.includes(id)));
                    } else if (activeWarning.type === 'unlink_visual') {
                      setVisuals(prev => prev.map(v => idsToChange.includes(v.id) ? { ...v, locationId: null } : v));
                    }
                    setActiveWarning(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all border border-rose-500/20"
                >
                  Confirm Action
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
