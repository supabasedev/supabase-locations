import React, { useState, useMemo } from 'react';
import { 
  Box,
  Package
} from 'lucide-react';
import { 
  Layout, 
  VisualNode, 
  LogicalLocation, 
  ViewType, 
  LocationType,
  SplitTreeEntry
} from '../../types';
import { getAllDividers, findNodeByLocationId, isLocationMapped } from '../../lib/structureUtils';
import EditorToolbar from './EditorToolbar';
import EditorSidebarLeft from './EditorSidebarLeft';
import EditorSidebarRight from './EditorSidebarRight';
import SelectionRibbon from './SelectionRibbon';
import ToolRibbon from './ToolRibbon';
import EditorCanvas from './EditorCanvas';
import FrontViewEditor from './FrontViewEditor';
import EditorRawData from './EditorRawData';
import AddObjectModal from './AddObjectModal';
import { motion, AnimatePresence } from 'motion/react';

interface EditorPageProps {
  layout: Layout;
  locations: LogicalLocation[];
  visuals: VisualNode[];
  splitTrees: SplitTreeEntry[];
  setVisuals: React.Dispatch<React.SetStateAction<VisualNode[]>>;
  setSplitTrees: React.Dispatch<React.SetStateAction<SplitTreeEntry[]>>;
  setLocations: React.Dispatch<React.SetStateAction<LogicalLocation[]>>;
  onBack: () => void;
}

export type EditorTool = 'select' | 'pan' | 'add' | 'measure' | 'split';

export default function EditorPage({ 
  layout, 
  locations, 
  visuals, 
  splitTrees,
  setVisuals, 
  setSplitTrees,
  setLocations,
  onBack 
}: EditorPageProps) {
  const [viewType, setViewType] = useState<ViewType>(ViewType.TOP_DOWN);
  const [selectedTool, setSelectedTool] = useState<EditorTool>('select');
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedFrontCellIds, setSelectedFrontCellIds] = useState<string[]>([]);
  const [selectedFrontDividerIds, setSelectedFrontDividerIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  const handleSelectSelection = (id: string | null) => {
    if (!id) {
      setSelectedNodeIds([]);
      setSelectedFrontCellIds([]);
      return;
    }

    // Check if ID is a visual node
    const isVisual = layoutVisuals.some(v => v.id === id);
    if (isVisual) {
      setSelectedNodeIds([id]);
      setSelectedFrontCellIds([]);
      return;
    }

    // Check if ID is a logical location
    const location = locations.find(l => l.id === id);
    if (location) {
      // Find if any visual node is directly linked to this location
      const linkedVisual = layoutVisuals.find(v => v.locationId === id);
      if (linkedVisual) {
        setSelectedNodeIds([linkedVisual.id]);
        setSelectedFrontCellIds([]);
        setViewType(ViewType.TOP_DOWN);
        return;
      }

      // Find if any visual node's structure has a cell linked to this location
      for (const visual of layoutVisuals) {
        if (visual.front?.splitTreeId) {
          const splitTree = splitTrees.find(st => st.id === visual.front?.splitTreeId);
          if (splitTree) {
            const foundNode = findNodeByLocationId(splitTree.root, id);
            if (foundNode) {
              setSelectedNodeIds([visual.id]);
              setSelectedFrontCellIds([foundNode.id]);
              setViewType(ViewType.FRONT);
              return;
            }
          }
        }
      }
    }
  };

  const handleAssignLocation = (locId: string | null) => {
    if (!selectedNodeId || !locId) return;

    // Check for "Multiple links to single logical location should not be allowed"
    if (isLocationMapped(layoutVisuals, locId, { nodeId: selectedNodeId })) {
      const location = locations.find(l => l.id === locId);
      alert(`Location ${location?.code || locId} is already mapped elsewhere in this layout.`);
      return;
    }

    setVisuals(prev => prev.map(v => v.id === selectedNodeId ? { ...v, locationId: locId } : v));
  };

  const rootVisual = useMemo(() => 
    layoutVisuals.find(v => v.parentId === null) || null
  , [layoutVisuals]);

  const handleFitScreen = () => {
    setFitTrigger(prev => prev + 1);
  };

  const selectedNodeId = selectedNodeIds[0] || null;
  
  const isFrontDisabled = useMemo(() => {
    if (selectedNodeIds.length !== 1) return true;
    const node = layoutVisuals.find(v => v.id === selectedNodeIds[0]);
    if (!node) return true;
    // Floor is now part of layout and not a node.
    return node.visualizationType === 'zone' || node.visualizationType === 'pillar';
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
            visualizationType: 'rectangle',
            label: data.label || 'New Object',
            xMm: layout.baseSurface.widthMm / 10,
            yMm: layout.baseSurface.depthMm / 10,
            zMm: 0,
            rotationDeg: 0,
            widthMm: 1000,
            heightMm: 2000,
            depthMm: 1000,
            style: { fill: '#cbd5e1' },
            viewType: viewType,
            parentVisualNodeId: null
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
            locationCategory: data.locationCategory || LocationType.RACK,
            canStoreInventory: true,
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
    
    // Default position at 1/10th of the surface size
    const defaultX = layout.baseSurface.widthMm / 10;
    const defaultY = layout.baseSurface.depthMm / 10;

    const newVisual: VisualNode = {
      id: `v-${newId}`,
      layoutId: layout.id,
      locationId: null,
      visualizationType: preset.type as any,
      label: preset.label,
      xMm: defaultX, 
      yMm: defaultY,
      zMm: 0,
      rotationDeg: 0,
      widthMm: preset.widthMm, 
      heightMm: preset.heightMm,
      depthMm: preset.depthMm,
      style: { 
        fill: preset.color,
        secondaryFill: preset.secondaryColor
      },
      viewType: ViewType.TOP_DOWN,
      parentVisualNodeId: null,
      front: preset.supportsFrontView ? {
         isConfigured: !!preset.structure,
         splitTreeId: preset.structure ? `st-gen-${Date.now()}` : undefined
      } : undefined,
      zonePattern: preset.zonePattern,
      blockPlacement: preset.blockPlacement,
      zoneType: preset.zoneType
    };

    if (newVisual.front?.splitTreeId && preset.structure) {
       setSplitTrees(prev => [...prev, {
          id: newVisual.front!.splitTreeId!,
          layoutId: layout.id,
          root: preset.structure,
          parentVisualNodeId: newVisual.id,
          viewType: ViewType.FRONT
       }]);
    }

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
    
    // Position slightly offset to make it visible
    clonedNode.xMm += 200;
    clonedNode.yMm += 200;

    // Handle split tree cloning if it exists
    if (clonedNode.front?.splitTreeId) {
      const originalTree = splitTrees.find(st => st.id === clonedNode.front!.splitTreeId);
      if (originalTree) {
        const newTreeId = `st-clone-${Date.now()}`;
        setSplitTrees(prev => [...prev, {
          ...JSON.parse(JSON.stringify(originalTree)),
          id: newTreeId
        }]);
        clonedNode.front.splitTreeId = newTreeId;
      }
    }

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
        viewMode={viewType}
        setViewMode={setViewType}
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
      />

      <div className="flex-1 flex overflow-hidden">
        {viewType !== ViewType.DATA && (
          <div onClick={(e) => e.stopPropagation()} className="h-full flex">
              <EditorSidebarLeft 
                locations={locations}
                visuals={layoutVisuals}
                splitTrees={splitTrees}
                selectedId={selectedNodeId}
                selectedIds={selectedNodeIds}
                onSelect={handleSelectSelection}
                onSelectMultiple={setSelectedNodeIds}
                onCloneNode={handleCloneNode}
                onAddPreset={handleAddPreset}
                viewMode={viewType}
                setViewMode={setViewType}
                selectedFrontCellIds={selectedFrontCellIds}
                onSelectFrontCell={setSelectedFrontCellIds}
                onUpdateNode={handleUpdateNode}
                onUpdateSplitTree={(newTree) => {
                  if (selectedNode?.front?.splitTreeId) {
                    setSplitTrees(prev => prev.map(st => st.id === selectedNode.front?.splitTreeId ? { ...st, root: newTree } : st));
                  }
                }}
              />
              <ToolRibbon 
                selectedTool={selectedTool}
                setSelectedTool={setSelectedTool}
                onAdd={() => setIsAddModalOpen(true)}
                isFrontMode={viewType === ViewType.FRONT}
                onSelectAllDividers={(type) => {
                  const splitTree = splitTrees.find(st => st.id === selectedNode?.front?.splitTreeId);
                  if (splitTree) {
                    const dividerIds = getAllDividers(splitTree.root, type);
                    setSelectedFrontDividerIds(dividerIds);
                    setSelectedFrontCellIds([]);
                  }
                }}
              />
          </div>
        )}

        <div className="flex-1 relative bg-[#020617] flex flex-col">
           {viewType === ViewType.TOP_DOWN ? (
            <EditorCanvas 
              layout={layout}
              visuals={layoutVisuals}
              viewMode={viewType}
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
          ) : viewType === ViewType.DATA ? (
            <EditorRawData 
              layout={layout}
              locations={locations}
              visuals={layoutVisuals}
              splitTrees={splitTrees}
              onImport={(payload) => {
                // In a real app, we might update the Layout as well via onUpdateLayout
                // For now, we update the other state pieces
                setLocations(payload.locations);
                setVisuals(prev => [
                   ...prev.filter(v => v.layoutId !== layout.id),
                   ...payload.visualNodes.map(v => ({ ...v, layoutId: layout.id }))
                ]);
                setSplitTrees(payload.splitTrees);
              }}
            />
          ) : viewType === ViewType.FRONT && selectedNode && selectedNode.front?.isConfigured ? (
            <FrontViewEditor 
              node={selectedNode}
              splitTree={splitTrees.find(st => st.id === selectedNode.front?.splitTreeId) || null}
              locations={locations}
              onUpdateNode={handleUpdateNode}
              onUpdateSplitTree={(newTree) => {
                setSplitTrees(prev => prev.map(st => st.id === selectedNode.front?.splitTreeId ? { ...st, root: newTree } : st));
              }}
              selectedCellIds={selectedFrontCellIds}
              onSelectCells={setSelectedFrontCellIds}
              selectedDividerIds={selectedFrontDividerIds}
              onSelectDividers={setSelectedFrontDividerIds}
              tool={selectedTool}
              triggerSplit={frontSplitDirection}
              onClearSplitTrigger={() => setFrontSplitDirection(null)}
              triggerBatchMap={batchMapTrigger}
              onClearBatchMapTrigger={() => setBatchMapTrigger(false)}
              onCancel={() => setViewType(ViewType.TOP_DOWN)}
              onDeselect={handleClearSelection}
              fitTrigger={fitTrigger}
            />
          ) : (
            <EditorCanvas 
              layout={layout}
              visuals={layoutVisuals}
              viewMode={viewType}
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
           {viewType === ViewType.FRONT && (!selectedNode || !selectedNode.front?.isConfigured) && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px]">
               <div className="max-w-md p-8 bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl text-center space-y-4">
                 <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto text-sky-400">
                   <Box className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold text-white uppercase tracking-tight">Front View Setup</h3>
                 <p className="text-slate-400 text-sm leading-relaxed">
                   {selectedNode ? "This visual node does not have a front view configured." : "Select a cabinet, rack, or shelf unit to edit its front view."}
                 </p>
                 <div className="flex flex-col gap-2">
                   {!selectedNode?.front && (
                     <button 
                        onClick={() => {
                          if (selectedNode) {
                            handleUpdateNode(selectedNode.id, { 
                              front: { isConfigured: true, splitTreeId: `st-new-${Date.now()}` } 
                            });
                            // Create empty tree
                            setSplitTrees(prev => [...prev, {
                               id: `st-new-${Date.now()}`,
                               layoutId: layout.id,
                               parentVisualNodeId: selectedNode.id,
                               viewType: ViewType.FRONT,
                               root: { id: `root-${Date.now()}`, type: 'cell', size: 1, label: selectedNode.label, nodeKind: 'cell', sizeValue: 1 }
                            }]);
                          }
                        }}
                        className="px-6 py-2.5 bg-sky-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-400 transition-all shadow-xl shadow-sky-500/10"
                      >
                        Initialize Structure
                      </button>
                   )}
                   <button 
                     onClick={() => setViewType(ViewType.TOP_DOWN)}
                     className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                   >
                     Return to Top-Down
                   </button>
                 </div>
               </div>
             </div>
           )}
        </div>

          <div className={`flex bg-slate-900 border-l border-slate-800 h-full overflow-visible ${viewType === ViewType.DATA ? 'hidden' : ''}`} onClick={(e) => e.stopPropagation()}>
            <SelectionRibbon 
              viewMode={viewType}
              selectedNode={selectedNode}
              selectedNodes={selectedNodes}
              splitTree={splitTrees.find(st => st.id === selectedNode?.front?.splitTreeId) || null}
              selectedLocation={selectedLocation}
              selectedFrontCellIds={selectedFrontCellIds}
              onSetViewMode={setViewType}
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
                        locationCategory: LocationType.RACK,
                        canStoreInventory: true,
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
              splitTrees={splitTrees}
              viewMode={viewType}
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
              onUpdateSplitTree={(newTree) => {
                 if (selectedNode?.front?.splitTreeId) {
                    setSplitTrees(prev => prev.map(st => st.id === selectedNode.front?.splitTreeId ? { ...st, root: newTree } : st));
                 }
              }}
              onSetViewMode={setViewType}
              isLinking={isLinking}
              setIsLinking={setIsLinking}
              onAssignLocation={handleAssignLocation}
              onCreateLocationFromVisual={() => {
                  if (selectedNode) {
                      const newLocId = `l-gen-${Date.now()}`;
                      setLocations(prev => [...prev, {
                          id: newLocId,
                          code: `LOC-${selectedNode.label.toUpperCase()}`,
                          name: selectedNode.label,
                          parentId: null,
                          locationCategory: LocationType.RACK,
                          canStoreInventory: true,
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
      </AnimatePresence>
    </div>
  );
}
