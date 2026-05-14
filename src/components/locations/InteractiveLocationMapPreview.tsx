/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Map as MapIcon, 
  Layout as LayoutIcon, 
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
  AlertTriangle
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
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

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

  // Filtered locations for sidebar
  const filteredResults = useMemo(() => {
    if (!searchQuery) {
      // Show all locations by default or some limited list
      return locations.map(loc => ({
        type: 'location',
        id: loc.id,
        code: loc.code,
        name: loc.name,
        resolution: resolveLocationVisual(loc.id, visualNodes, index)
      }));
    }
    return searchLocationsAndVisuals(searchQuery, locations, visualNodes);
  }, [searchQuery, locations, visualNodes, index]);

  return (
    <div className={cn(
      "flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden",
      !embedded && "fixed inset-0 z-50",
      embedded && "relative rounded-xl border border-slate-800"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
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
            <h1 className="text-lg font-semibold tracking-tight leading-none">{layout.name}</h1>
            <span className="text-xs text-slate-400 font-mono mt-1 block">Interactive Map Preview</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && onOpenEditor && (
            <button 
              onClick={onOpenEditor}
              className="flex items-center gap-2 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-sm font-medium transition-all"
            >
              <Edit2 className="w-4 h-4" />
              <span className="hidden sm:inline">Open Editor</span>
            </button>
          )}
          {!embedded && onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "w-80 border-r border-slate-800 flex flex-col bg-slate-900/30",
          compact && "w-64"
        )}>
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Search location code/name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 px-4 text-center">
                <SearchX className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">No locations found matching your search.</p>
              </div>
            ) : (
              filteredResults.map((result: any) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    if (result.type === 'location') {
                      setSelectedLocationId(result.id);
                    } else if (result.type === 'visual_node') {
                      if (result.locationId) setSelectedLocationId(result.locationId);
                    } else if (result.type === 'structure_cell') {
                      if (result.locationId) setSelectedLocationId(result.locationId);
                    }
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all group relative",
                    selectedLocationId === (result.type === 'location' ? result.id : result.locationId)
                      ? "bg-sky-500/10 border-sky-500/50 border shadow-[0_0_15px_-5px_rgba(14,165,233,0.3)]"
                      : "hover:bg-slate-800/50 border border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-slate-400 truncate max-w-[70%]">
                      {result.code || result.displayLabel || 'UNLINKED'}
                    </span>
                    {result.resolution && (
                      <span className={cn(
                        "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                        result.resolution.status === 'top_down' && "bg-emerald-500/20 text-emerald-400",
                        result.resolution.status === 'front_cell' && "bg-sky-500/20 text-sky-400",
                        result.resolution.status === 'unmapped' && "bg-slate-800 text-slate-500",
                        result.resolution.status === 'duplicate' && "bg-amber-500/20 text-amber-400"
                      )}>
                        {result.resolution.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-sm text-slate-200 line-clamp-1">
                    {result.name || result.label}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col relative bg-slate-950 overflow-hidden">
          {/* Map Layer */}
          <div className="flex-1 relative overflow-hidden">
            <PreviewTopDownMap 
              visuals={visualNodes}
              selectedNodeId={activeVisualNodeId}
              onSelectNode={(node) => {
                if (node.locationId) setSelectedLocationId(node.locationId);
              }}
              hoveredNodeId={hoveredNodeId}
              onHoverNode={setHoveredNodeId}
            />

            {/* Float Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg p-1 shadow-xl">
                <button className="p-2 hover:bg-slate-800 rounded-md transition-colors" title="Zoom In">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Front View Panel (Slide up) */}
          <AnimatePresence>
            {activeVisualNodeId && visualNodes.find(n => n.id === activeVisualNodeId)?.structure && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute inset-x-0 bottom-0 h-1/2 bg-slate-900 border-t border-slate-700 shadow-2xl z-20 flex flex-col"
              >
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span className="text-sm font-semibold tracking-tight">
                      {visualNodes.find(n => n.id === activeVisualNodeId)?.label} - Front View
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedLocationId(null)}
                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden p-6 bg-slate-950/50 relative">
                  <PreviewFrontView 
                    node={visualNodes.find(n => n.id === activeVisualNodeId)!}
                    selectedStructureNodeId={activeStructureNodeId}
                    onSelectCell={(cell) => {
                      if (cell.locationId) setSelectedLocationId(cell.locationId);
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Details Panel */}
        <div className="w-72 border-l border-slate-800 bg-slate-900/30 flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Info className="w-3.5 h-3.5" />
              Selection Details
            </h2>
            
            {resolution ? (
              <div className="space-y-6">
                {/* Location Info */}
                <div>
                  <div className="text-2xl font-bold tracking-tight text-white mb-1">
                    {locations.find(l => l.id === selectedLocationId)?.code || 'Unknown'}
                  </div>
                  <div className="text-sm text-slate-400">
                    {locations.find(l => l.id === selectedLocationId)?.name || 'Logical Location'}
                  </div>
                </div>

                {/* Mapping Status Card */}
                <div className={cn(
                  "p-4 rounded-xl border",
                  resolution.status === 'top_down' && "bg-emerald-500/5 border-emerald-500/20",
                  resolution.status === 'front_cell' && "bg-sky-500/5 border-sky-500/20",
                  resolution.status === 'unmapped' && "bg-slate-800/50 border-slate-700",
                  resolution.status === 'duplicate' && "bg-amber-500/5 border-amber-500/20"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className={cn(
                      "w-4 h-4",
                      resolution.status === 'top_down' && "text-emerald-400",
                      resolution.status === 'front_cell' && "text-sky-400",
                      resolution.status === 'unmapped' && "text-slate-500",
                      resolution.status === 'duplicate' && "text-amber-400"
                    )} />
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {resolution.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {resolution.status === 'top_down' && "Placed directly on the warehouse floor map."}
                    {resolution.status === 'front_cell' && `Located inside ${resolution.parentVisualNode.label} structure.`}
                    {resolution.status === 'unmapped' && "This location exists in the system but has no visual representation on this workspace."}
                    {resolution.status === 'duplicate' && "Found multiple visual representations for this location."}
                  </p>
                </div>

                {/* Actions Placeholder */}
                <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
                  <button className="flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors">
                    <span>View Inventory</span>
                    <ChevronRight className="w-3 h-3 opacity-50" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <Box className="w-12 h-12 mb-4 opacity-10 text-slate-400" />
                <p className="text-sm text-slate-500 italic">Select a location to view its physical mapping and details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components (Internal to this file for now) ---

function PreviewTopDownMap({ 
  visuals, 
  selectedNodeId, 
  onSelectNode,
  hoveredNodeId,
  onHoverNode
}: {
  visuals: VisualNode[];
  selectedNodeId: string | null;
  onSelectNode: (node: VisualNode) => void;
  hoveredNodeId: string | null;
  onHoverNode: (id: string | null) => void;
}) {
  // Simple SVG renderer for read-only preview
  // Calculate viewbox from visuals
  const bounds = useMemo(() => {
    if (visuals.length === 0) return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    visuals.forEach(v => {
      minX = Math.min(minX, v.x);
      minY = Math.min(minY, v.y);
      maxX = Math.max(maxX, v.x + v.width);
      maxY = Math.max(maxY, v.y + v.depth);
    });
    // Add margin
    const margin = 200;
    return {
      minX: minX - margin,
      minY: minY - margin,
      width: (maxX - minX) + margin * 2,
      height: (maxY - minY) + margin * 2
    };
  }, [visuals]);

  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden">
      <svg
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
        className="w-full h-full transform-gpu"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background Grid - Optional for flavor */}
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-800/50" />
          </pattern>
        </defs>
        <rect x={bounds.minX} y={bounds.minY} width={bounds.width} height={bounds.height} fill="url(#grid)" />

        {/* Visual Nodes */}
        {visuals.map(node => {
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNodeId === node.id;
          const isVisualOnly = !node.locationId;

          return (
            <g 
              key={node.id} 
              className="cursor-pointer group"
              onClick={() => onSelectNode(node)}
              onMouseEnter={() => onHoverNode(node.id)}
              onMouseLeave={() => onHoverNode(null)}
              transform={`rotate(${node.rotation}, ${node.x + node.width / 2}, ${node.y + node.depth / 2})`}
            >
              {/* Highlight Ring */}
              {isSelected && (
                <rect 
                  x={node.x - 4} y={node.y - 4} 
                  width={node.width + 8} height={node.depth + 8}
                  fill="none" 
                  stroke="#0ea5e9" 
                  strokeWidth="4" 
                  rx="6"
                  className="animate-pulse"
                />
              )}
              
              {/* Main Shape */}
              <rect 
                x={node.x} y={node.y} 
                width={node.width} height={node.depth}
                fill={isVisualOnly ? '#334155' : node.color}
                fillOpacity={isVisualOnly ? 0.3 : 0.8}
                stroke={isSelected ? '#0ea5e9' : isHovered ? '#fff' : 'rgba(255,255,255,0.1)'}
                strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                rx="4"
                className="transition-all duration-200"
              />

              {/* Label */}
              {(node.width > 30 && node.depth > 20) && (
                <text 
                  x={node.x + node.width / 2} 
                  y={node.y + node.depth / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isVisualOnly ? '#64748b' : '#fff'}
                  className="text-[10px] font-bold select-none pointer-events-none uppercase tracking-tighter"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
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
    <div className="w-full h-full flex items-center justify-center">
      <div 
        className="relative bg-slate-900 border-2 border-slate-700 shadow-2xl rounded"
        style={{
          width: 'min(90%, 800px)',
          aspectRatio: `${node.width} / ${node.height}`,
        }}
      >
        <StructureRenderer 
          node={node.structure} 
          selectedId={selectedStructureNodeId}
          onSelect={onSelectCell}
        />
      </div>
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
  const isCell = node.type === 'cell';

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
              idx < node.children!.length - 1 && (isHorizontal ? "border-b border-slate-700/50" : "border-r border-slate-700/50")
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
        !node.locationId && "bg-slate-900/50"
      )}
    >
      {isSelected && (
        <div className="absolute inset-0 border-2 border-sky-400 inset-shadow-sky-500/20 animate-in fade-in zoom-in-95 duration-200" />
      )}
      
      <div className="flex flex-col items-center gap-0.5 p-1">
        <span className={cn(
          "text-[10px] font-bold font-mono tracking-tighter truncate max-w-full",
          isSelected ? "text-sky-300" : node.locationId ? "text-slate-400" : "text-slate-600"
        )}>
          {node.displayLabel || node.label}
        </span>
        {isSelected && (
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="w-1 h-1 bg-sky-400 rounded-full" 
          />
        )}
      </div>

      {!node.locationId && (
        <div className="absolute top-0.5 right-0.5">
           <AlertTriangle className="w-2.5 h-2.5 text-slate-700" />
        </div>
      )}
    </button>
  );
}
