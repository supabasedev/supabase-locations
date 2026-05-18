/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  SearchX, 
  X, 
  ArrowLeft,
  ChevronRight,
  Info,
  Maximize2,
  Edit2,
  Box,
  Layers,
  MapPin,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  VisualNode, 
  StructureNode, 
  LogicalLocation, 
  Layout, 
  ViewMode 
} from '../../types';
import { 
  buildLocationMappingIndex, 
  resolveLocationVisual, 
  searchLocationsAndVisuals,
  LocationVisualResolution,
  MappingIndex
} from '../../lib/locationMappingResolver';
import { cn } from '../../lib/utils';

export interface InteractiveLocationMapPreviewProps {
  layout: Layout;
  visualNodes: VisualNode[];
  locations: LogicalLocation[];
  initialLocationId?: string;
  compact?: boolean;
  embedded?: boolean;
  onClose?: () => void;
  onOpenEditor?: () => void;
  canEdit?: boolean;
}

interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}

export function InteractiveLocationMapPreview({
  layout,
  visualNodes,
  locations,
  initialLocationId,
  compact = false,
  embedded = false,
  onClose,
  onOpenEditor,
  canEdit = false
}: InteractiveLocationMapPreviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(initialLocationId || null);
  const [selectedVisualNodeId, setSelectedVisualNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [expandedLocationIds, setExpandedLocationIds] = useState<Set<string>>(new Set());

  // Transforms
  const [topDownTransform, setTopDownTransform] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });
  const [frontTransform, setFrontTransform] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });

  const topDownContainerRef = useRef<HTMLDivElement>(null);
  const frontContainerRef = useRef<HTMLDivElement>(null);

  // When location changes, clear direct visual selection
  useEffect(() => {
    if (selectedLocationId) setSelectedVisualNodeId(null);
  }, [selectedLocationId]);

  // Build mapping index
  const index = useMemo(() => buildLocationMappingIndex(visualNodes, locations), [visualNodes, locations]);

  // Resolve selected location
  const resolution = useMemo(() => {
    if (!selectedLocationId) return null;
    return resolveLocationVisual(selectedLocationId, visualNodes, index);
  }, [selectedLocationId, visualNodes, index]);

  // Handle derived selections from resolution
  const activeVisualNodeId = useMemo(() => {
    if (!resolution) return null;
    if (resolution.status === 'top_down') return resolution.visualNodeId;
    if (resolution.status === 'front_cell') return resolution.parentVisualNodeId;
    return null;
  }, [resolution]);

  const activeStructureNodeId = useMemo(() => {
    if (resolution?.status === 'front_cell') return resolution.structureNodeId;
    return null;
  }, [resolution]);

  // Hierarchical Location Tree Data
  const locationTree = useMemo(() => {
    const map = new Map<string | null, LogicalLocation[]>();
    locations.forEach(loc => {
      const parentId = loc.parentId;
      if (!map.has(parentId)) map.set(parentId, []);
      map.get(parentId)!.push(loc);
    });
    return map;
  }, [locations]);

  // Filtered nodes that should be visible (due to search)
  const visibleLocationIds = useMemo(() => {
    if (!searchQuery) return null;
    const ids = new Set<string>();
    const query = searchQuery.toLowerCase();
    
    locations.forEach(loc => {
      const matches = loc.code.toLowerCase().includes(query) || 
                      loc.name.toLowerCase().includes(query) ||
                      loc.pathCode.toLowerCase().includes(query);
      
      if (matches) {
        ids.add(loc.id);
        // Expand ancestors
        let parentId = loc.parentId;
        while (parentId) {
          ids.add(parentId);
          const parent = locations.find(l => l.id === parentId);
          parentId = parent?.parentId || null;
        }
      }
    });
    return ids;
  }, [searchQuery, locations]);

  // Apply search expansion
  useEffect(() => {
    if (visibleLocationIds) {
      setExpandedLocationIds(prev => {
        const next = new Set(prev);
        visibleLocationIds.forEach(id => next.add(id));
        return next;
      });
    }
  }, [visibleLocationIds]);

  // Initial fit to view
  const fitTopDown = useCallback(() => {
    if (!topDownContainerRef.current || visualNodes.length === 0) return;
    const container = topDownContainerRef.current;
    const { width, height } = container.getBoundingClientRect();
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    visualNodes.forEach(v => {
      minX = Math.min(minX, v.x);
      minY = Math.min(minY, v.y);
      maxX = Math.max(maxX, v.x + v.width);
      maxY = Math.max(maxY, v.y + v.depth);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const padding = 100;
    
    const scale = Math.min(
      (width - padding) / contentWidth,
      (height - padding) / contentHeight
    ) || 1;

    setTopDownTransform({
      x: (width - contentWidth * scale) / 2 - minX * scale,
      y: (height - contentHeight * scale) / 2 - minY * scale,
      scale
    });
  }, [visualNodes]);

  const fitFront = useCallback(() => {
    if (!frontContainerRef.current || !activeVisualNodeId) return;
    const node = visualNodes.find(n => n.id === activeVisualNodeId);
    if (!node) return;

    const container = frontContainerRef.current;
    const { width, height } = container.getBoundingClientRect();
    
    const contentWidth = node.width;
    const contentHeight = node.height;
    const padding = 60;
    
    const scale = Math.min(
      (width - padding) / contentWidth,
      (height - padding) / contentHeight
    ) || 1;

    setFrontTransform({
      x: (width - contentWidth * scale) / 2,
      y: (height - contentHeight * scale) / 2,
      scale
    });
  }, [activeVisualNodeId, visualNodes]);

  useEffect(() => {
    fitTopDown();
  }, [fitTopDown]);

  useEffect(() => {
    if (activeVisualNodeId) fitFront();
  }, [activeVisualNodeId, fitFront]);

  // Pan to selected node
  useEffect(() => {
    if (activeVisualNodeId && topDownContainerRef.current) {
      const node = visualNodes.find(v => v.id === activeVisualNodeId);
      if (node) {
        const { width, height } = topDownContainerRef.current.getBoundingClientRect();
        setTopDownTransform(prev => ({
          ...prev,
          x: width / 2 - (node.x + node.width / 2) * prev.scale,
          y: height / 2 - (node.y + node.depth / 2) * prev.scale
        }));
      }
    }
  }, [activeVisualNodeId, visualNodes]);

  const toggleExpand = (id: string) => {
    setExpandedLocationIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedLoc = locations.find(l => l.id === selectedLocationId);

  return (
    <div className={cn(
      "flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden font-sans",
      !embedded && "fixed inset-0 z-50",
      embedded && "relative rounded-xl border border-slate-800"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm z-30">
        <div className="flex items-center gap-3">
          {!embedded && onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-semibold tracking-tight leading-none text-white">{layout.name}</h1>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 block">Interactive Map Preview</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && onOpenEditor && (
            <button 
              onClick={onOpenEditor}
              className="flex items-center gap-2 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-sky-500/20"
            >
              <Edit2 className="w-4 h-4" />
              <span className="hidden sm:inline">Open Editor</span>
            </button>
          )}
          {!embedded && onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Location Tree */}
        <div className={cn(
          "w-80 border-r border-slate-800 flex flex-col bg-slate-900/30 overflow-hidden",
          compact && "w-64"
        )}>
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <LocationTree 
              locations={locationTree.get(layout.rootLocationId || null) || []}
              treeMap={locationTree}
              selectedId={selectedLocationId}
              onSelect={setSelectedLocationId}
              expandedIds={expandedLocationIds}
              onToggleExpand={toggleExpand}
              visibleIds={visibleLocationIds}
              index={index}
              visualNodes={visualNodes}
            />
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col relative bg-slate-950 overflow-hidden">
          {/* Top-Down Map Layer */}
          <div className="flex-1 relative overflow-hidden" ref={topDownContainerRef}>
            <PanZoomContainer 
              transform={topDownTransform} 
              onTransformChange={setTopDownTransform}
              className="w-full h-full"
            >
              <PreviewTopDownMap 
                visuals={visualNodes}
                selectedNodeId={activeVisualNodeId || selectedVisualNodeId}
                onSelectNode={(node) => {
                  if (node.locationId) setSelectedLocationId(node.locationId);
                  else {
                    setSelectedLocationId(null);
                    setSelectedVisualNodeId(node.id);
                  }
                }}
                hoveredNodeId={hoveredNodeId}
                onHoverNode={setHoveredNodeId}
                transform={topDownTransform}
              />
            </PanZoomContainer>

            {/* Float Controls Top-Down */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-1 shadow-2xl flex flex-col gap-1">
                <button onClick={() => setTopDownTransform(t => ({ ...t, scale: t.scale * 1.2 }))} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white" title="Zoom In">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button onClick={() => setTopDownTransform(t => ({ ...t, scale: t.scale / 1.2 }))} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white" title="Zoom Out">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <div className="h-px bg-slate-800 mx-1" />
                <button onClick={fitTopDown} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white" title="Fit to View">
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Front View Panel */}
          <AnimatePresence>
            {activeVisualNodeId && visualNodes.find(n => n.id === activeVisualNodeId)?.structure && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute inset-x-0 bottom-0 h-[45%] bg-slate-900 border-t border-slate-800 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-20 flex flex-col"
              >
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/30 border-b border-slate-800 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-sky-500/10 rounded-lg border border-sky-500/20">
                      <Layers className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <span className="text-sm font-bold tracking-tight text-white block">
                        {visualNodes.find(n => n.id === activeVisualNodeId)?.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Front View Structure</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-950/50 p-1 rounded-lg border border-slate-800 mr-2">
                      <button onClick={() => setFrontTransform(t => ({ ...t, scale: t.scale * 1.2 }))} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 transition-colors">
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setFrontTransform(t => ({ ...t, scale: t.scale / 1.2 }))} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 transition-colors">
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={fitFront} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 transition-colors">
                        <Maximize className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button 
                      onClick={() => setSelectedLocationId(null)}
                      className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-hidden relative bg-slate-950/80" ref={frontContainerRef}>
                  <PanZoomContainer 
                    transform={frontTransform}
                    onTransformChange={setFrontTransform}
                    className="w-full h-full"
                  >
                    <PreviewFrontView 
                      node={visualNodes.find(n => n.id === activeVisualNodeId || n.id === selectedVisualNodeId)!}
                      selectedStructureNodeId={activeStructureNodeId}
                      onSelectCell={(cell) => {
                        if (cell.locationId) setSelectedLocationId(cell.locationId);
                        else {
                          setSelectedLocationId(null);
                          setSelectedVisualNodeId(activeVisualNodeId);
                        }
                      }}
                    />
                  </PanZoomContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Details Panel */}
        <div className="w-80 border-l border-slate-800 bg-slate-900/30 flex flex-col z-30">
          <div className="p-5 border-b border-slate-800 bg-slate-900/50">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
              <Info className="w-3.5 h-3.5" />
              Location Details
            </h2>
            
            {resolution && selectedLoc ? (
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-[10px] font-black text-sky-400 mb-2 uppercase tracking-widest">
                    {selectedLoc.role}
                  </div>
                  <div className="text-3xl font-bold tracking-tight text-white mb-1">
                    {selectedLoc.code}
                  </div>
                  <div className="text-sm font-medium text-slate-400">
                    {selectedLoc.name}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Physical Path</p>
                    <div className="text-xs font-mono text-slate-300 break-all bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                      {selectedLoc.pathCode}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Workspace</p>
                    <div className="text-xs font-medium text-slate-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      {layout.name}
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "p-4 rounded-xl border bg-slate-950/50 relative overflow-hidden",
                  resolution.status === 'top_down' && "border-emerald-500/30 shadow-[0_0_20px_-10px_rgba(16,185,129,0.3)]",
                  resolution.status === 'front_cell' && "border-sky-500/30 shadow-[0_0_20px_-10px_rgba(14,165,233,0.3)]",
                  resolution.status === 'unmapped' && "border-slate-800",
                  resolution.status === 'duplicate' && "border-amber-500/30"
                )}>
                  <div className="flex items-center gap-2 mb-3 relative z-10">
                    <MapPin className={cn(
                      "w-4 h-4",
                      resolution.status === 'top_down' && "text-emerald-400",
                      resolution.status === 'front_cell' && "text-sky-400",
                      resolution.status === 'unmapped' && "text-slate-500",
                      resolution.status === 'duplicate' && "text-amber-400"
                    )} />
                    <span className={cn(
                      "text-xs font-black uppercase tracking-widest",
                      resolution.status === 'top_down' && "text-emerald-400",
                      resolution.status === 'front_cell' && "text-sky-400",
                      resolution.status === 'unmapped' && "text-slate-400",
                      resolution.status === 'duplicate' && "text-amber-400"
                    )}>
                      {resolution.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="text-[11px] text-slate-400 leading-relaxed relative z-10">
                    {resolution.status === 'top_down' && <p>Mapped to physical object <span className="text-slate-200">"{resolution.visualNode.label}"</span> on top-down view.</p>}
                    {resolution.status === 'front_cell' && <p>Mapped to <span className="text-slate-200 font-bold">{resolution.structureNode.displayLabel || resolution.structureNode.label}</span> inside <span className="text-slate-200">"{resolution.parentVisualNode.label}"</span>.</p>}
                    {resolution.status === 'unmapped' && (
                      <p>This logical location has no physical representation on the map yet.</p>
                    )}
                    {resolution.status === 'duplicate' && (
                      <p>Warning: This location code is mapped to multiple physical nodes.</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-4">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2">Capabilities</p>
                     <div className="flex flex-wrap gap-1.5">
                       {Object.entries(selectedLoc.capabilities).map(([key, val]) => (
                         val && (
                           <div key={key} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-300 uppercase tracking-tight">
                             {key.replace(/([A-Z])/g, ' $1').trim()}
                           </div>
                         )
                       ))}
                     </div>
                   </div>

                  <div className="flex flex-col gap-2">
                    <button className="flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-colors w-full group">
                      <span className="flex items-center gap-2 group-hover:text-white">
                        <Box className="w-3.5 h-3.5" />
                        View Inventory
                      </span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center px-8">
                <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
                  <MapPin className="w-8 h-8 text-slate-700" />
                </div>
                <p className="text-sm text-slate-500 italic leading-relaxed">Select a location from the explorer to view physical mapping details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Internal Helper Components ---

function PanZoomContainer({ 
  children, 
  transform, 
  onTransformChange, 
  className 
}: { 
  children: React.ReactNode; 
  transform: ViewTransform;
  onTransformChange: (t: ViewTransform) => void;
  className?: string;
}) {
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    onTransformChange({
      ...transform,
      x: transform.x + dx,
      y: transform.y + dy
    });
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [transform, onTransformChange]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const delta = -e.deltaY * zoomSpeed;
    const newScale = Math.min(Math.max(transform.scale + delta, 0.1), 10);
    
    // Zoom toward mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleRatio = newScale / transform.scale;
    const dx = (mouseX - transform.x) * (1 - scaleRatio);
    const dy = (mouseY - transform.y) * (1 - scaleRatio);

    onTransformChange({
      x: transform.x + dx,
      y: transform.y + dy,
      scale: newScale
    });
  }, [transform, onTransformChange]);

  return (
    <div 
      className={cn("cursor-grab active:cursor-grabbing select-none overflow-hidden", className)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div 
        style={{ 
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0'
        }}
        className="w-full h-full transform-gpu transition-transform duration-75 ease-out"
      >
        {children}
      </div>
    </div>
  );
}

function LocationTree({ 
  locations, 
  treeMap, 
  selectedId, 
  onSelect, 
  expandedIds, 
  onToggleExpand, 
  visibleIds,
  index,
  visualNodes,
  depth = 0 
}: {
  locations: LogicalLocation[];
  treeMap: Map<string | null, LogicalLocation[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  visibleIds: Set<string> | null;
  index: MappingIndex;
  visualNodes: VisualNode[];
  depth?: number;
}) {
  return (
    <div className="space-y-0.5">
      {locations
        .filter(loc => !visibleIds || visibleIds.has(loc.id))
        .sort((a, b) => a.code.localeCompare(b.code))
        .map(loc => {
          const children = treeMap.get(loc.id) || [];
          const isExpanded = expandedIds.has(loc.id);
          const isSelected = selectedId === loc.id;
          const resolution = resolveLocationVisual(loc.id, visualNodes, index);

          return (
            <div key={loc.id}>
              <button
                onClick={() => onSelect(loc.id)}
                className={cn(
                  "w-full text-left p-1.5 rounded-lg flex items-center gap-2 group relative transition-all",
                  isSelected ? "bg-sky-500/15 text-white" : "hover:bg-slate-800/50 text-slate-400"
                )}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
              >
                {depth > 0 && (
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-800 pointer-events-none" style={{ left: `${depth * 12 - 4}px` }} />
                )}
                
                {children.length > 0 && (
                  <div 
                    onClick={(e) => { e.stopPropagation(); onToggleExpand(loc.id); }}
                    className="p-0.5 hover:bg-slate-700 rounded transition-colors"
                  >
                    <ChevronDown className={cn("w-3 h-3 transition-transform", !isExpanded && "-rotate-90")} />
                  </div>
                )}
                {children.length === 0 && <div className="w-4" />}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <span className={cn(
                      "text-[10px] font-mono leading-none truncate",
                      isSelected ? "text-sky-300" : "text-slate-500"
                    )}>
                      {loc.code}
                    </span>
                    <span className={cn(
                      "text-[9px] font-black uppercase px-1 rounded-sm shrink-0",
                      resolution.status === 'top_down' && "bg-emerald-500/20 text-emerald-400",
                      resolution.status === 'front_cell' && "bg-sky-500/20 text-sky-400",
                      resolution.status === 'unmapped' && "bg-slate-800 text-slate-600",
                      resolution.status === 'duplicate' && "bg-amber-500/20 text-amber-400"
                    )}>
                      {resolution.status === 'top_down' && 'TOP'}
                      {resolution.status === 'front_cell' && 'FRNT'}
                      {resolution.status === 'unmapped' && 'NO'}
                      {resolution.status === 'duplicate' && 'DUP'}
                    </span>
                  </div>
                  <div className={cn(
                    "text-[11px] truncate leading-tight mt-0.5",
                    isSelected ? "text-white" : "text-slate-300 group-hover:text-white"
                  )}>
                    {loc.name}
                  </div>
                </div>
              </button>

              {isExpanded && children.length > 0 && (
                <LocationTree 
                  locations={children}
                  treeMap={treeMap}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  expandedIds={expandedIds}
                  onToggleExpand={onToggleExpand}
                  visibleIds={visibleIds}
                  index={index}
                  visualNodes={visualNodes}
                  depth={depth + 1}
                />
              )}
            </div>
          );
        })}
    </div>
  );
}

function PreviewTopDownMap({ 
  visuals, 
  selectedNodeId, 
  onSelectNode,
  hoveredNodeId,
  onHoverNode,
  transform
}: {
  visuals: VisualNode[];
  selectedNodeId: string | null;
  onSelectNode: (node: VisualNode) => void;
  hoveredNodeId: string | null;
  onHoverNode: (id: string | null) => void;
  transform: ViewTransform;
}) {
  // Use a fixed virtual coordinate space
  const viewSize = 10000; 

  return (
    <div className="w-full h-full relative">
      <svg
        width={viewSize}
        height={viewSize}
        viewBox={`0 0 ${viewSize} ${viewSize}`}
        className="overflow-visible"
      >
        <defs>
          <pattern id="previewGrid" width="200" height="200" patternUnits="userSpaceOnUse">
            <path d="M 200 0 L 0 0 0 200" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-800/30" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={viewSize} height={viewSize} fill="url(#previewGrid)" />

        {visuals.map(node => {
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNodeId === node.id;
          const isVisualOnly = !node.locationId;

          return (
            <g 
              key={node.id} 
              className="group pointer-events-auto"
              onClick={(e) => { e.stopPropagation(); onSelectNode(node); }}
              onMouseEnter={() => onHoverNode(node.id)}
              onMouseLeave={() => onHoverNode(null)}
              transform={`rotate(${node.rotation}, ${node.x + node.width / 2}, ${node.y + node.depth / 2})`}
            >
              {isSelected && (
                <rect 
                  x={node.x - 8 / transform.scale} y={node.y - 8 / transform.scale} 
                  width={node.width + 16 / transform.scale} height={node.depth + 16 / transform.scale}
                  fill="none" 
                  stroke="#0ea5e9" 
                  strokeWidth={4 / transform.scale} 
                  rx={8 / transform.scale}
                  className="animate-pulse"
                />
              )}
              
              <rect 
                x={node.x} y={node.y} 
                width={node.width} height={node.depth}
                fill={isVisualOnly ? '#334155' : node.color}
                fillOpacity={isVisualOnly ? 0.2 : 0.8}
                stroke={isSelected ? '#0ea5e9' : isHovered ? '#fff' : 'rgba(255,255,255,0.05)'}
                strokeWidth={isSelected ? 4 / transform.scale : 1 / transform.scale}
                rx={4 / transform.scale}
                className="transition-colors duration-200"
              />

              {(node.width * transform.scale > 50 && node.depth * transform.scale > 30) && (
                <text 
                  x={node.x + node.width / 2} 
                  y={node.y + node.depth / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isVisualOnly ? '#64748b' : '#fff'}
                  className="font-black select-none pointer-events-none uppercase tracking-tighter"
                  style={{ 
                    fontSize: `${Math.max(10, 12 / transform.scale)}px`,
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)' 
                  }}
                >
                  {node.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PreviewFrontView({ 
  node, 
  selectedStructureNodeId, 
  onSelectCell 
}: { 
  node: VisualNode;
  selectedStructureNodeId: string | null;
  onSelectCell: (node: StructureNode) => void;
}) {
  if (!node.structure) return null;

  return (
    <div 
      className="bg-slate-900 border-4 border-slate-700 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden"
      style={{
        width: `${node.width}px`,
        height: `${node.height}px`,
      }}
    >
      <StructureRenderer 
        node={node.structure} 
        selectedId={selectedStructureNodeId}
        onSelect={onSelectCell}
      />
    </div>
  );
}

function StructureRenderer({ 
  node, 
  selectedId, 
  onSelect 
}: { 
  node: StructureNode; 
  selectedId: string | null;
  onSelect: (node: StructureNode) => void;
}) {
  const isSelected = selectedId === node.id;

  if (node.type === 'container' && node.children) {
    const isHorizontal = node.split === 'horizontal';
    return (
      <div 
        className={cn(
          "w-full h-full flex",
          isHorizontal ? "flex-col" : "flex-row"
        )}
      >
        {node.children.map((child, idx) => (
          <div 
            key={child.id}
            style={{ flex: child.size }}
            className={cn(
              "relative",
              idx < node.children!.length - 1 && (isHorizontal ? "border-b border-slate-700/80" : "border-r border-slate-700/80")
            )}
          >
            <StructureRenderer node={child} selectedId={selectedId} onSelect={onSelect} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <button 
      onClick={() => onSelect(node)}
      className={cn(
        "w-full h-full flex items-center justify-center transition-all group overflow-hidden relative",
        isSelected ? "bg-sky-500/20 z-10" : "hover:bg-white/5",
        !node.locationId && "bg-slate-900/30"
      )}
    >
      {isSelected && (
        <div className="absolute inset-0 border-[3px] border-sky-400 z-10 shadow-[inset_0_0_20px_rgba(14,165,233,0.3)]" />
      )}
      
      <div className="flex flex-col items-center gap-1 p-2 relative z-10">
        <span className={cn(
          "text-xs font-bold leading-none truncate max-w-full uppercase tracking-tight",
          isSelected ? "text-white" : node.locationId ? "text-slate-400 group-hover:text-white" : "text-slate-700"
        )}>
          {node.displayLabel || node.label}
        </span>
        {isSelected && (
          <motion.div 
            layoutId="active-indicator"
            className="w-1.5 h-1.5 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.8)]" 
          />
        )}
      </div>

      {!node.locationId && (
        <div className="absolute top-1 right-1 opacity-20">
           <AlertTriangle className="w-3 h-3 text-slate-400" />
        </div>
      )}
    </button>
  );
}
