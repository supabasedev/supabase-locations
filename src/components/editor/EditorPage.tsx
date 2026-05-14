import React, { useState, useMemo } from 'react';
import { 
  Box,
  Package
} from 'lucide-react';
import { 
  Layout, 
  VisualNode, 
  LogicalLocation, 
  ViewMode, 
  LocationType 
} from '../../types';
import { getAllDividers } from '../../lib/structureUtils';
import EditorToolbar from './EditorToolbar';
import EditorSidebarLeft from './EditorSidebarLeft';
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
  const [selectedTool, setSelectedTool] = useState<EditorTool>('select');
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedFrontCellIds, setSelectedFrontCellIds] = useState<string[]>([]);
  const [selectedFrontDividerIds, setSelectedFrontDividerIds] = useState<string[]>([]);
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
  
  const isFrontDisabled = useMemo(() => {
    if (selectedNodeIds.length !== 1) return true;
    const node = layoutVisuals.find(v => v.id === selectedNodeIds[0]);
    if (!node) return true;
    // Floor (root) has parentId === null. Zones have type === 'zone'.
    return node.parentId === null || node.type === 'zone';
  }, [selectedNodeIds, layoutVisuals]);

  const selectedNode = useMemo(() => 
    layoutVisuals.find(v => v.id === selectedNodeId) || null
  , [layoutVisuals, selectedNodeId]);

  const selectedNodes = useMemo(() => 
    layoutVisuals.filter(v => selectedNodeIds.includes(v.id))
  , [layoutVisuals, selectedNodeIds]);

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
    setVisuals(prev => prev.map(v => v.id === nodeId ? { ...v, locationId: null } : v));
  };

  const handleRemoveVisual = (nodeId: string) => {
    setVisuals(prev => prev.filter(v => v.id !== nodeId));
    setSelectedNodeIds(prev => prev.filter(id => id !== nodeId));
  };

  const handleAddObject = (data: any) => {
    // Logic for adding visual, location, or both
    const newId = `new-${Date.now()}`;
    const rootVisual = layoutVisuals.find(v => v.parentId === null);
    
    if (data.type === 'visual' || data.type === 'both') {
        const newVisual: VisualNode = {
            id: `v-${newId}`,
            layoutId: layout.id,
            locationId: data.type === 'both' ? `l-${newId}` : null,
            type: 'rectangle',
            label: data.label || 'New Object',
            x: rootVisual ? rootVisual.width / 10 : 50,
            y: rootVisual ? rootVisual.depth / 10 : 30,
            z: 0,
            rotation: 0,
            width: 100,
            height: 200,
            depth: 100,
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
            code: data.code || `NEW-${newId.slice(-4)}`,
            name: data.name || data.label || 'New Location',
            parentId: null,
            locationType: data.locationType || LocationType.RACK,
            allowsStock: true,
            isReceivable: true,
            isPickable: true,
            isVirtual: false,
            status: 'active'
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
              locations={locations}
              visuals={layoutVisuals}
              selectedId={selectedNodeId}
              selectedIds={selectedNodeIds}
              onSelect={(id) => setSelectedNodeIds(id ? [id] : [])}
              onSelectMultiple={setSelectedNodeIds}
              onCloneNode={handleCloneNode}
              onAddPreset={handleAddPreset}
              viewMode={viewMode}
              setViewMode={setViewMode}
              selectedFrontCellIds={selectedFrontCellIds}
              onSelectFrontCell={setSelectedFrontCellIds}
              onUpdateNode={handleUpdateNode}
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
              onCreateLocation={() => {
                if (selectedNode) {
                    const newLocId = `l-gen-${Date.now()}`;
                    setLocations(prev => [...prev, {
                        id: newLocId,
                        code: `LOC-${selectedNode.label.toUpperCase()}`,
                        name: selectedNode.label,
                        parentId: null,
                        locationType: LocationType.RACK,
                        allowsStock: true,
                        isReceivable: true,
                        isPickable: true,
                        isVirtual: false,
                        status: 'active'
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
                          code: `LOC-${selectedNode.label.toUpperCase()}`,
                          name: selectedNode.label,
                          parentId: null,
                          locationType: LocationType.RACK,
                          allowsStock: true,
                          isReceivable: true,
                          isPickable: true,
                          isVirtual: false,
                          status: 'active'
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
            onClose={() => setIsAddModalOpen(false)} 
            onSubmit={handleAddObject}
            locations={locations}
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
      </AnimatePresence>
    </div>
  );
}
