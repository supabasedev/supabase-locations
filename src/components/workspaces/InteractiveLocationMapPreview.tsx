import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  Search, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  ChevronRight, 
  ChevronDown, 
  Box, 
  Package, 
  Layout as LayoutIcon,
  ExternalLink,
  Info,
  Map as MapIcon,
  Grid,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layout, 
  VisualNode, 
  LogicalLocation, 
  SplitTreeEntry, 
  ViewType, 
  StructureNode 
} from '../../types';
import { Stage, Layer, Rect, Text, Line, Group } from 'react-konva';
import Konva from 'konva';
import { cn } from '@/lib/utils';
import { findNodeByLocationId, getFullPath } from '../../lib/structureUtils';

interface SearchResults {
  locations: LogicalLocation[];
  visuals: VisualNode[];
  splitNodes: { nodeId: string; splitTreeId: string; visualNodeId: string; }[];
}

interface InteractiveLocationMapPreviewProps {
  layout: Layout;
  locations: LogicalLocation[];
  visualNodes: VisualNode[];
  splitTrees: SplitTreeEntry[];
  initialLocationId?: string;
  initialVisualNodeId?: string;
  initialSplitNodeId?: string;
  compact?: boolean;
  embedded?: boolean;
  showOpenEditorButton?: boolean;
  onClose?: () => void;
  onOpenEditor?: (layoutId: string) => void;
}

export default function InteractiveLocationMapPreview({
  layout,
  locations,
  visualNodes,
  splitTrees,
  initialLocationId,
  initialVisualNodeId,
  initialSplitNodeId,
  compact = false,
  embedded = false,
  showOpenEditorButton = true,
  onClose,
  onOpenEditor
}: InteractiveLocationMapPreviewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialVisualNodeId || null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(initialLocationId || null);
  const [selectedSplitNodeId, setSelectedSplitNodeId] = useState<string | null>(initialSplitNodeId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [viewType, setViewType] = useState<ViewType>(ViewType.TOP_DOWN);
  const [fitTrigger, setFitTrigger] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const scale = 0.1; // 1mm = 0.1px

  // Update selection when initial IDs change
  useEffect(() => {
    if (initialVisualNodeId) setSelectedNodeId(initialVisualNodeId);
    if (initialLocationId) setSelectedLocationId(initialLocationId);
    if (initialSplitNodeId) setSelectedSplitNodeId(initialSplitNodeId);
  }, [initialVisualNodeId, initialLocationId, initialSplitNodeId]);

  // Dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Filter visuals for current mode
  const currentVisuals = useMemo(() => 
    visualNodes.filter(v => v.layoutId === layout.id && v.viewType === ViewType.TOP_DOWN)
  , [visualNodes, layout.id]);

  // Derived selections
  const selectedNode = useMemo(() => 
    currentVisuals.find(v => v.id === selectedNodeId) || null
  , [currentVisuals, selectedNodeId]);

  const selectedLocation = useMemo(() => 
    locations.find(l => l.id === selectedLocationId) || null
  , [locations, selectedLocationId]);

  const selectedSplitTree = useMemo(() => {
    if (!selectedNode?.front?.splitTreeId) return null;
    return splitTrees.find(st => st.id === selectedNode.front?.splitTreeId) || null;
  }, [selectedNode, splitTrees]);

  // Fit to screen
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      const padding = 40;
      const availableWidth = dimensions.width - padding * 2;
      const availableHeight = dimensions.height - padding * 2;
      
      const floorWidthPx = layout.baseSurface.widthMm * scale;
      const floorHeightPx = layout.baseSurface.depthMm * scale;
      
      const targetZoom = Math.min(
        availableWidth / floorWidthPx,
        availableHeight / floorHeightPx
      );
      
      const clampedZoom = Math.max(0.1, Math.min(5, targetZoom));
      setZoomLevel(clampedZoom);
      setPos({
        x: (dimensions.width - floorWidthPx * clampedZoom) / 2,
        y: (dimensions.height - floorHeightPx * clampedZoom) / 2
      });
    }
  }, [dimensions, layout.baseSurface.widthMm, layout.baseSurface.depthMm, fitTrigger]);

  // Search
  const searchResults = useMemo<SearchResults | null>(() => {
    if (!searchQuery || searchQuery.length < 2) return null;
    const q = searchQuery.toLowerCase();
    
    const matchedLocations = locations.filter(l => 
        l.code.toLowerCase().includes(q) || l.name.toLowerCase().includes(q)
    );

    const matchedVisuals = visualNodes.filter(v => 
        v.label.toLowerCase().includes(q)
    );

    // Deep search in split trees
    const matchedSplitNodes: { nodeId: string, splitTreeId: string, visualNodeId: string }[] = [];
    splitTrees.forEach(st => {
      const findInTree = (node: StructureNode) => {
        if ((node.label && node.label.toLowerCase().includes(q)) || 
            (node.displayLabel && node.displayLabel.toLowerCase().includes(q))) {
            matchedSplitNodes.push({ nodeId: node.id, splitTreeId: st.id, visualNodeId: st.parentVisualNodeId });
        }
        node.children?.forEach(findInTree);
      };
      findInTree(st.root);
    });

    return { locations: matchedLocations, visuals: matchedVisuals, splitNodes: matchedSplitNodes };
  }, [searchQuery, locations, visualNodes, splitTrees]);

  const handleSelectLocation = (locId: string) => {
    setSelectedLocationId(locId);
    
    // Find visual representation
    const visual = currentVisuals.find(v => v.locationId === locId);
    if (visual) {
        setSelectedNodeId(visual.id);
        setSelectedSplitNodeId(null);
        return;
    }

    // Try finding in split trees
    for (const st of splitTrees) {
        const found = findNodeByLocationId(st.root, locId);
        if (found) {
            setSelectedNodeId(st.parentVisualNodeId);
            setSelectedSplitNodeId(found.id);
            return;
        }
    }

    // Otherwise it's unmapped
    setSelectedNodeId(null);
    setSelectedSplitNodeId(null);
  };

  const handleSelectVisualNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    const node = visualNodes.find(v => v.id === nodeId);
    if (node?.locationId) {
        setSelectedLocationId(node.locationId);
    } else {
        setSelectedLocationId(null);
    }
    setSelectedSplitNodeId(null);
  };

  return (
    <div className={cn(
        "flex flex-col bg-slate-950 text-slate-200 overflow-hidden",
        embedded ? "h-full w-full" : "fixed inset-0 z-[100]"
    )}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-white/5 shadow-2xl relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
            <LayoutIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white uppercase">{layout.name}</h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <span className="text-sky-500 opacity-80">Interactive Preview</span>
              <span>·</span>
              <span>Ref: {layout.id}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
              <input 
                type="text"
                placeholder="Search locations, racks, structures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:bg-slate-800 transition-all placeholder:text-slate-600"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
           </div>
        </div>

        <div className="flex items-center gap-3">
          {showOpenEditorButton && onOpenEditor && (
            <button 
              onClick={() => onOpenEditor(layout.id)}
              className="flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs border border-white/5 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Open Editor
            </button>
          )}
          {!embedded && onClose && (
            <button 
              onClick={onClose}
              className="p-2.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-xl border border-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Browse & Search */}
        {!compact && (
          <div className="w-80 bg-slate-900 border-r border-white/5 flex flex-col shadow-xl">
             <div className="p-4 border-b border-white/5 bg-slate-900/50">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inventory Map</h3>
                   <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[9px] font-bold text-slate-400">
                     {locations.length} Locations
                   </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                   <button className="flex flex-col gap-1 p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 text-sky-400 hover:bg-sky-500/10 transition-all text-left">
                      <Package className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Mapped</span>
                   </button>
                   <button className="flex flex-col gap-1 p-3 rounded-xl bg-slate-800/50 border border-white/5 text-slate-400 hover:bg-slate-800 transition-all text-left">
                      <Grid className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Visual Only</span>
                   </button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                {searchQuery ? (
                   <div className="space-y-4">
                      {searchResults.locations && searchResults.locations.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 mb-2">Locations</p>
                          {searchResults.locations.map(loc => (
                            <button 
                              key={loc.id}
                              onClick={() => handleSelectLocation(loc.id)}
                              className={cn(
                                "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all group",
                                selectedLocationId === loc.id ? "bg-sky-500/20 text-sky-400" : "hover:bg-slate-800 text-slate-400"
                              )}
                            >
                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
                                <Package className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{loc.code}</p>
                                <p className="text-[10px] opacity-60 truncate">{loc.name}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchResults.visuals && searchResults.visuals.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 mb-2">Objects</p>
                          {searchResults.visuals.map(v => (
                            <button 
                              key={v.id}
                              onClick={() => handleSelectVisualNode(v.id)}
                              className={cn(
                                "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all group",
                                selectedNodeId === v.id ? "bg-sky-500/20 text-sky-400" : "hover:bg-slate-800 text-slate-400"
                              )}
                            >
                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                                <Box className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{v.label}</p>
                                <p className="text-[10px] opacity-60 truncate capitalize">{v.visualizationType}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchResults.splitNodes && searchResults.splitNodes.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 mb-2">Storage Units / Slots</p>
                          {searchResults.splitNodes.map(sn => {
                            const visualNode = visualNodes.find(v => v.id === sn.visualNodeId);
                            return (
                              <button 
                                key={sn.nodeId}
                                onClick={() => {
                                  setSelectedNodeId(sn.visualNodeId);
                                  setSelectedSplitNodeId(sn.nodeId);
                                  // If it has a locationId, we should also select that
                                  const st = splitTrees.find(s => s.id === sn.splitTreeId);
                                  if (st) {
                                    const node = findInTree(st.root, sn.nodeId);
                                    if (node?.locationId) setSelectedLocationId(node.locationId);
                                    else setSelectedLocationId(null);
                                  }
                                }}
                                className={cn(
                                  "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all group",
                                  selectedSplitNodeId === sn.nodeId ? "bg-sky-500/20 text-sky-400" : "hover:bg-slate-800 text-slate-400"
                                )}
                              >
                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                                  <Layers className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate">Slot in {visualNode?.label || 'Object'}</p>
                                  <p className="text-[10px] opacity-60 truncate">Interior Ref: {sn.nodeId}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      
                      {!searchResults.locations?.length && !searchResults.visuals?.length && !searchResults.splitNodes?.length && (
                        <div className="py-12 text-center">
                          <p className="text-slate-500 text-xs">No matching results found</p>
                        </div>
                      )}
                   </div>
                ) : (
                  <div className="space-y-6">
                    {/* Simplified Tree View */}
                    <div>
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 mb-2">Visual Objects</p>
                      {currentVisuals.map(v => (
                        <button 
                          key={v.id}
                          onClick={() => handleSelectVisualNode(v.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all",
                            selectedNodeId === v.id ? "bg-sky-500/20 text-sky-400 shadow-lg shadow-sky-500/5 ring-1 ring-sky-500/30" : "hover:bg-slate-800/50 text-slate-400"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                            selectedNodeId === v.id ? "bg-sky-500/20 text-sky-400" : "bg-slate-800 text-slate-500"
                          )}>
                            <Box className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{v.label}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                               <span className="text-[9px] font-medium opacity-50 capitalize">{v.visualizationType}</span>
                               {v.locationId ? (
                                 <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                               ) : (
                                 <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                               )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Unmapped Locations */}
                    <div className="pt-4">
                       <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 mb-2">Unmapped Locations</p>
                       {locations.filter(l => {
                          // Check if mapped to a top-down visual
                          const isTopDownMapped = visualNodes.some(v => v.locationId === l.id);
                          if (isTopDownMapped) return false;
                          
                          // Check if mapped to a split tree
                          const isSplitMapped = splitTrees.some(st => findNodeByLocationId(st.root, l.id) !== null);
                          return !isSplitMapped;
                       }).map(loc => (
                          <button 
                            key={loc.id}
                            onClick={() => handleSelectLocation(loc.id)}
                            className={cn(
                              "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all opacity-60 hover:opacity-100",
                              selectedLocationId === loc.id ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "hover:bg-slate-800 text-slate-500"
                            )}
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center">
                              <Package className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate">{loc.code}</p>
                              <p className="text-[9px] opacity-60 truncate">Not on map</p>
                            </div>
                          </button>
                       ))}
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Center Canvas */}
        <div className="flex-1 bg-[#020617] relative flex flex-col group/canvas">
           {/* Canvas Controls */}
           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-white/5 rounded-2xl p-1.5 shadow-2xl opacity-60 group-hover/canvas:opacity-100 transition-opacity">
              <button onClick={() => setZoomLevel(prev => Math.min(5, prev * 1.2))} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
                <ZoomIn className="w-5 h-5" />
              </button>
              <div className="px-3 text-[10px] font-black text-slate-500 cursor-default min-w-[50px] text-center">
                {Math.round(zoomLevel * 100)}%
              </div>
              <button onClick={() => setZoomLevel(prev => Math.max(0.1, prev / 1.2))} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
                <ZoomOut className="w-5 h-5" />
              </button>
              <div className="w-px h-4 bg-white/10 mx-1"></div>
              <button onClick={() => setFitTrigger(t => t + 1)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all" title="Fit to Screen">
                <Maximize2 className="w-5 h-5" />
              </button>
           </div>

           <div ref={containerRef} className="flex-1 cursor-grab active:cursor-grabbing">
              <Stage 
                width={dimensions.width} 
                height={dimensions.height}
                scaleX={zoomLevel}
                scaleY={zoomLevel}
                x={pos.x}
                y={pos.y}
                draggable
                onDragEnd={(e) => setPos({ x: e.target.x(), y: e.target.y() })}
                onWheel={(e) => {
                  e.evt.preventDefault();
                  const stage = stageRef.current;
                  if (!stage) return;
                  const oldScale = stage.scaleX();
                  const pointer = stage.getPointerPosition();
                  if (!pointer) return;

                  const mousePointTo = {
                    x: (pointer.x - stage.x()) / oldScale,
                    y: (pointer.y - stage.y()) / oldScale,
                  };

                  const direction = e.evt.deltaY > 0 ? -1 : 1;
                  const newScale = direction > 0 ? oldScale * 1.1 : oldScale / 1.1;
                  const clampedScale = Math.max(0.1, Math.min(5, newScale));

                  const newPos = {
                    x: pointer.x - mousePointTo.x * clampedScale,
                    y: pointer.y - mousePointTo.y * clampedScale,
                  };

                  setZoomLevel(clampedScale);
                  setPos(newPos);
                }}
                ref={stageRef}
              >
                <Layer>
                   {/* Floor */}
                   <Rect 
                     width={layout.baseSurface.widthMm * scale}
                     height={layout.baseSurface.depthMm * scale}
                     fill={layout.baseSurface.style.fill}
                     shadowBlur={40 * scale}
                     shadowColor="rgba(0,0,0,0.5)"
                   />

                   {/* Background Grid */}
                   <Group opacity={0.1}>
                      {Array.from({ length: Math.ceil(layout.baseSurface.widthMm / layout.baseSurface.gridSizeMm) + 1 }).map((_, i) => (
                        <Line 
                          key={`v-${i}`}
                          points={[i * layout.baseSurface.gridSizeMm * scale, 0, i * layout.baseSurface.gridSizeMm * scale, layout.baseSurface.depthMm * scale]}
                          stroke={layout.baseSurface.style.gridColor || "#475569"}
                          strokeWidth={2 * scale}
                        />
                      ))}
                      {Array.from({ length: Math.ceil(layout.baseSurface.depthMm / layout.baseSurface.gridSizeMm) + 1 }).map((_, i) => (
                        <Line 
                          key={`h-${i}`}
                          points={[0, i * layout.baseSurface.gridSizeMm * scale, layout.baseSurface.widthMm * scale, i * layout.baseSurface.gridSizeMm * scale]}
                          stroke={layout.baseSurface.style.gridColor || "#475569"}
                          strokeWidth={2 * scale}
                        />
                      ))}
                   </Group>

                   {/* Visual Objects */}
                   {currentVisuals.map(v => (
                     <Group 
                        key={v.id}
                        x={(v.xMm + v.widthMm / 2) * scale}
                        y={(v.yMm + v.depthMm / 2) * scale}
                        offsetX={(v.widthMm * scale) / 2}
                        offsetY={(v.depthMm * scale) / 2}
                        rotation={v.rotationDeg}
                        onClick={() => handleSelectVisualNode(v.id)}
                        onTap={() => handleSelectVisualNode(v.id)}
                     >
                       <Rect 
                         width={v.widthMm * scale}
                         height={v.depthMm * scale}
                         fill={selectedNodeId === v.id ? "#0ea5e922" : v.style.fill}
                         stroke={selectedNodeId === v.id ? "#38bdf8" : "#475569"}
                         strokeWidth={selectedNodeId === v.id ? (2 / zoomLevel) : (1 / zoomLevel)}
                         cornerRadius={v.visualizationType === 'rack' ? 0 : 2 / zoomLevel}
                         opacity={v.visualizationType === 'zone' ? (v.style.opacity ?? 0.3) : 1}
                       />
                       
                       {selectedNodeId === v.id && (
                         <Rect 
                            width={v.widthMm * scale}
                            height={v.depthMm * scale}
                            stroke="#38bdf8"
                            strokeWidth={4 / zoomLevel}
                            opacity={0.3}
                            listening={false}
                         />
                       )}

                       {/* Front Side Indicator */}
                       {v.front?.isConfigured && (
                          <Line 
                            points={[0, v.depthMm * scale, v.widthMm * scale, v.depthMm * scale]}
                            stroke="#38bdf8"
                            strokeWidth={3 / zoomLevel}
                            opacity={0.8}
                          />
                       )}

                       <Text 
                         text={v.label}
                         width={v.widthMm * scale}
                         align="center"
                         y={v.depthMm * scale + (5 / zoomLevel)}
                         fontSize={10 / zoomLevel}
                         fill={selectedNodeId === v.id ? "#38bdf8" : "#64748b"}
                         fontStyle="bold"
                       />
                     </Group>
                   ))}
                </Layer>
              </Stage>
           </div>
        </div>

        {/* Right Details Panel */}
        <div className="w-96 bg-slate-900 border-l border-white/5 flex flex-col shadow-2xl relative z-10 overflow-y-auto custom-scrollbar">
           {selectedNode || selectedLocation ? (
             <div className="flex-1 flex flex-col min-h-0">
               {/* Details Header */}
               <div className="p-6 space-y-4 border-b border-white/5 bg-slate-900/50">
                  <div className="flex items-center justify-between">
                     <span className={cn(
                       "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                       selectedLocation ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                     )}>
                       {selectedLocation ? "Location Details" : "Visual Object"}
                     </span>
                     {selectedNode?.locked && (
                        <span className="text-slate-500 text-[10px] flex items-center gap-1 font-bold">
                           <LayoutIcon className="w-3 h-3" /> Locked
                        </span>
                     )}
                  </div>

                  <div>
                     <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">
                        {selectedLocation ? selectedLocation.code : selectedNode?.label}
                     </h3>
                     <p className="text-slate-400 text-sm mt-1">
                        {selectedLocation ? selectedLocation.name : `Unassigned ${selectedNode?.visualizationType}`}
                     </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                     <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/5 flex items-center gap-2">
                        <Info className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Active</span>
                     </div>
                     {selectedLocation?.isPickable && (
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                           <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">Pickable</span>
                        </div>
                     )}
                  </div>
               </div>

               {/* Stats / Geometry */}
               <div className="p-6 grid grid-cols-2 gap-4 border-b border-white/5">
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Dimensions (mm)</p>
                     <p className="text-sm font-bold text-slate-300">
                        {selectedNode ? `${selectedNode.widthMm} × ${selectedNode.depthMm} × ${selectedNode.heightMm}` : "-"}
                     </p>
                  </div>
                  <div className="space-y-1 text-right">
                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Category</p>
                     <p className="text-sm font-bold text-slate-300 capitalize">
                        {selectedLocation ? selectedLocation.locationCategory : selectedNode?.visualizationType}
                     </p>
                  </div>
               </div>

               {/* Front Preview Region */}
               <div className="flex-1 flex flex-col p-6 min-h-[300px]">
                  <div className="flex items-center justify-between mb-4">
                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Front View / Structure</h4>
                     {selectedNode?.front?.isConfigured && (
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[9px] font-bold border border-sky-500/20">
                          Structured
                        </span>
                     )}
                  </div>

                  {selectedNode?.front?.isConfigured && selectedSplitTree ? (
                     <div className="flex-1 bg-slate-950 rounded-2xl border border-white/5 overflow-hidden flex flex-col relative group/front min-h-[200px]">
                        <FrontPreviewCanvas 
                           node={selectedNode}
                           splitTree={selectedSplitTree}
                           selectedSplitNodeId={selectedSplitNodeId}
                           onSelectCell={(id) => {
                             setSelectedSplitNodeId(id);
                             const stNode = findInTree(selectedSplitTree.root, id);
                             if (stNode?.locationId) setSelectedLocationId(stNode.locationId);
                           }}
                        />
                        <div className="absolute top-3 right-3 opacity-0 group-hover/front:opacity-100 transition-opacity">
                           <div className="px-2 py-1 bg-slate-900/90 backdrop-blur rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest border border-white/10">
                              Read Only
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="flex-1 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-700">
                           <MapIcon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No Structure</p>
                           <p className="text-[10px] text-slate-600">This object has no interior configuration defined.</p>
                        </div>
                     </div>
                  )}

                  {/* Selected Cell Detail */}
                  <AnimatePresence>
                    {selectedSplitNodeId && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-4 p-4 bg-sky-500/5 border border-sky-500/20 rounded-2xl space-y-2 shadow-lg"
                      >
                         <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest">Internal Selection</span>
                            <button onClick={() => setSelectedSplitNodeId(null)} className="text-sky-500/50 hover:text-sky-400">
                               <X className="w-3 h-3" />
                            </button>
                         </div>
                         {(() => {
                            const stNode = findInTree(selectedSplitTree!.root, selectedSplitNodeId);
                            const linkedLoc = locations.find(l => l.id === stNode?.locationId);
                            return (
                               <>
                                 <p className="text-xs font-bold text-slate-200">{stNode?.label || stNode?.displayLabel || 'Unnamed Cell'}</p>
                                 {linkedLoc ? (
                                   <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/10">
                                      <CheckCircle2 className="w-3 h-3" />
                                      {linkedLoc.code}
                                   </div>
                                 ) : (
                                   <p className="text-[10px] text-slate-500 italic">Visual only cell (unassigned)</p>
                                 )}
                               </>
                            )
                         })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-700 shadow-inner">
                   <Info className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-lg font-bold text-white uppercase tracking-tight">Interactive Map</h3>
                   <p className="text-slate-500 text-sm leading-relaxed">
                      Select any object on the map or search to view properties, sub-structures, and connected logical locations.
                   </p>
                </div>
                <div className="w-full pt-6 space-y-3">
                   <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-800/30 border border-white/5">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Total Nodes</span>
                      <span className="text-xs font-bold text-slate-300">{currentVisuals.length}</span>
                   </div>
                   <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-800/30 border border-white/5">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Mapped</span>
                      <span className="text-xs font-bold text-emerald-500">{currentVisuals.filter(v => v.locationId).length}</span>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

// Sub-component for Front Preview
function FrontPreviewCanvas({ 
  node, 
  splitTree, 
  selectedSplitNodeId,
  onSelectCell 
}: { 
  node: VisualNode, 
  splitTree: SplitTreeEntry, 
  selectedSplitNodeId: string | null,
  onSelectCell: (id: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }
  }, []);

  const renderRecursive = (stNode: StructureNode, x: number, y: number, w: number, h: number): React.ReactNode => {
    const isSelected = selectedSplitNodeId === stNode.id;
    
    if (stNode.nodeKind === 'cell' || !stNode.children || stNode.children.length === 0) {
      return (
        <Group key={stNode.id}>
          <Rect 
            x={x} y={y} width={w} height={h}
            fill={isSelected ? "rgba(14, 165, 233, 0.2)" : "rgba(15, 23, 42, 0.8)"}
            stroke={isSelected ? "#38bdf8" : "#334155"}
            strokeWidth={1}
            onClick={() => onSelectCell(stNode.id)}
          />
          {w > 30 && h > 15 && (
            <Text 
              x={x} y={y + h/2 - 4} width={w} align="center"
              text={stNode.displayLabel || stNode.label || ''}
              fontSize={8} fill={isSelected ? "#38bdf8" : "#64748b"}
              fontStyle="bold"
            />
          )}
        </Group>
      );
    }

    // Container split logic
    const results: React.ReactNode[] = [];
    const totalWeight = stNode.children.reduce((acc, c) => acc + (c.sizeValue || 1), 0);
    let currentPos = 0;

    stNode.children.forEach(child => {
      const weight = child.sizeValue || 1;
      const ratio = weight / totalWeight;

      if (stNode.splitDirection === 'horizontal') {
        const childH = h * ratio;
        results.push(renderRecursive(child, x, y + currentPos, w, childH));
        currentPos += childH;
      } else {
        const childW = w * ratio;
        results.push(renderRecursive(child, x + currentPos, y, childW, h));
        currentPos += childW;
      }
    });

    return <Group key={stNode.id}>{results}</Group>;
  };

  const canvasWidth = node.widthMm * 0.05;
  const canvasHeight = node.heightMm * 0.05;
  const aspect = canvasWidth / canvasHeight;

  let drawW = dimensions.width - 40;
  let drawH = drawW / aspect;
  if (drawH > dimensions.height - 40) {
    drawH = dimensions.height - 40;
    drawW = drawH * aspect;
  }

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center p-4">
      <Stage width={drawW} height={drawH}>
        <Layer>
           {renderRecursive(splitTree.root, 0, 0, drawW, drawH)}
        </Layer>
      </Stage>
    </div>
  );
}

function findInTree(node: StructureNode, id: string): StructureNode | null {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findInTree(child, id);
      if (found) return found;
    }
  }
  return null;
}

function CheckCircle2(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="m9 11 3 3L22 4" />
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74" />
    </svg>
  );
}
