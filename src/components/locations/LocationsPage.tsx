import React, { useState } from 'react';
import { 
  LogicalLocation, 
  VisualNode, 
  LocationType, 
  MappingStatus,
  Layout
} from '../../types';
import { 
  Search, 
  Plus, 
  X,
  Filter, 
  MoreVertical, 
  MapPin, 
  Archive, 
  ChevronRight,
  ChevronDown,
  Box,
  Info,
  LayoutGrid,
  Database,
  Pencil,
  MoveUpRight,
  CornerDownRight,
  FileText,
  FileJson,
  Move,
  LayoutList,
  Columns,
  GripVertical,
  Check,
  Shield,
  Tag,
  Flag,
  Zap,
  Star,
  Heart,
  Coffee,
  Briefcase,
  Key,
  Hammer,
  Scale,
  Maximize2,
  AlertCircle,
  Clock,
  ExternalLink,
  Copy,
  Trash2,
  Search as SearchIcon,
  Fingerprint,
  Layers,
  Server,
  Layout as LayoutIcon,
  Inbox,
  Truck,
  RotateCcw,
  CheckSquare,
  ShieldAlert,
  Construction,
  Car,
  ShieldCheck,
  Triangle,
  Package,
  Circle,
  Activity
} from 'lucide-react';

import { LOCATION_CATEGORIES, LocationCategoryDefinition } from '../../constants/locationCategories';

const ALL_ICONS: Record<string, any> = {
  Database, Layers, MapPin, Box, Inbox, Truck, RotateCcw, ShieldAlert, 
  CheckSquare, Server, Construction, Briefcase, Layout: LayoutIcon, Car, Flag,
  ArrowRightLeft: Move, Archive, Shield, Tag, Zap, Star, Heart, Coffee, 
  Key, Hammer, Scale, Maximize2, AlertCircle, Clock, ExternalLink, 
  Copy, Trash2, Search: SearchIcon, Fingerprint, 
  ShieldCheck, Triangle, Package, Circle
};

const IconRenderer = ({ name, className, color }: { name: string, className?: string, color?: string }) => {
  const IconComponent = ALL_ICONS[name] || Box;
  return <IconComponent className={className} color={color} />;
};
import { motion, AnimatePresence } from 'motion/react';
import LocationModal from './LocationModal';
import { InteractiveLocationMapPreview } from './InteractiveLocationMapPreview';
import LocationExportDialog from './LocationExportDialog';
import WorkspaceHealthReportDialog from '../workspaces/WorkspaceHealthReportDialog';

interface LocationsPageProps {
  locations: LogicalLocation[];
  visuals: VisualNode[];
  layouts: Layout[];
  onCreateLocation: (loc: LogicalLocation) => void;
  onUpdateLocation?: (loc: Partial<LogicalLocation>) => void;
  onNavigateToWorkspace: (layoutId: string) => void;
}

export default function LocationsPage({ 
  locations, 
  visuals, 
  layouts,
  onCreateLocation,
  onUpdateLocation,
  onNavigateToWorkspace
}: LocationsPageProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(locations[0]?.id || null);
  const [expandedIds, setExpandedIds] = useState<string[]>(['l1', 'l2']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState(false);
  const [isTreeLocked, setIsTreeLocked] = useState(true);
  const [isTreeActionsOpen, setIsTreeActionsOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'info' | 'inventory'>('info');
  
  // New States
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [locationToMove, setLocationToMove] = useState<string | null>(null);
  const [moveTargetId, setMoveTargetId] = useState<string | 'ROOT'>('ROOT');
  const [childListDensity, setChildListDensity] = useState<'COMFORTABLE' | 'COMPACT'>('COMFORTABLE');
  
  const [previewLayoutId, setPreviewLayoutId] = useState<string | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [healthReportLayoutId, setHealthReportLayoutId] = useState<string | null>(null);

  const selectedLocation = locations.find(l => l.id === selectedLocationId) || null;

  const handleCopyPath = () => {
      if (!selectedLocation) return;
      const pathNames = getLocationPath(selectedLocation.id).map(l => l.code);
      const pathString = pathNames.join('/');
      navigator.clipboard.writeText(pathString);
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
  };

  const getLocationPath = (locId: string): LogicalLocation[] => {
      const path: LogicalLocation[] = [];
      let current = locations.find(l => l.id === locId);
      while(current) {
          path.unshift(current);
          current = locations.find(l => l.id === current?.parentId);
      }
      return path;
  }

  const getMappingStatus = (locId: string): MappingStatus => {
    const isMapped = visuals.some(v => v.locationId === locId);
    return isMapped ? MappingStatus.MAPPED : MappingStatus.UNMAPPED;
  };

  const handleEditLocation = (data: Partial<LogicalLocation>) => {
      if(onUpdateLocation && selectedLocation) {
          onUpdateLocation({...data, id: selectedLocation.id});
      } else {
        console.log('Update location (no-op prototype):', data);
      }
      setIsEditModalOpen(false);
  };

  const handleAddLocation = (data: Partial<LogicalLocation>) => {
    const newId = `l-${Date.now()}`;
    const newLoc: LogicalLocation = {
        id: newId,
        code: data.code || `NEW-${newId.slice(-4)}`,
        name: data.name || 'New Location',
        description: data.description || '',
        parentId: data.parentId === 'ROOT-SYS' || data.parentId === '' ? null : data.parentId || null,
        locationType: data.locationType || LocationType.BIN,
        allowsStock: data.allowsStock ?? true,
        isReceivable: data.isReceivable ?? true,
        isPickable: data.isPickable ?? true,
        isVirtual: data.isVirtual ?? false,
        status: data.status || 'active',
        icon: data.icon,
        color: data.color
    };
    onCreateLocation(newLoc);
    setIsAddModalOpen(false);
    
    // Auto-expand parent
    if (newLoc.parentId && !expandedIds.includes(newLoc.parentId)) {
        setExpandedIds(prev => [...prev, newLoc.parentId!]);
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
      if (isTreeLocked) return;
      e.stopPropagation();
      setDraggedId(id);
      e.dataTransfer.effectAllowed = 'move';
      
      const row = (e.currentTarget as HTMLElement).closest('.tree-row-wrapper');
      if (row) {
          e.dataTransfer.setDragImage(row, 20, 15);
          setTimeout(() => row.classList.add('opacity-50'), 0);
      } else {
          setTimeout(() => e.target && (e.target as HTMLElement).classList.add('opacity-50'), 0);
      }
  };

  const handleDragEnd = (e: React.DragEvent) => {
      e.stopPropagation();
      setDraggedId(null);
      setDragOverId(null);
      
      const row = (e.currentTarget as HTMLElement).closest('.tree-row-wrapper');
      if (row) {
          row.classList.remove('opacity-50');
      } else {
          e.target && (e.target as HTMLElement).classList.remove('opacity-50');
      }
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      if(draggedId && draggedId !== id && !getLocationPath(id).some(l => l.id === draggedId)) {
        e.dataTransfer.dropEffect = 'move';
        if (dragOverId !== id) setDragOverId(id);
      } else {
        e.dataTransfer.dropEffect = 'none';
      }
  };

  const handleDragLeave = (e: React.DragEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (dragOverId === id) setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverId(null);
      if(draggedId && draggedId !== targetId && !getLocationPath(targetId).some(l => l.id === draggedId)) {
          // Open confirmation modal instead of applying directly
          setLocationToMove(draggedId);
          setMoveTargetId(targetId);
          setIsMoveModalOpen(true);
      }
  };

  const executeMove = () => {
      if (locationToMove && onUpdateLocation) {
          onUpdateLocation({ id: locationToMove, parentId: moveTargetId === 'ROOT' ? null : moveTargetId });
      }
      setIsMoveModalOpen(false);
      setLocationToMove(null);
  };

  const handleExpandAll = () => {
    const allIds = locations.map(l => l.id);
    setExpandedIds(allIds);
    setIsTreeActionsOpen(false);
  };

  const handleCollapseAll = () => {
    setExpandedIds([]);
    setIsTreeActionsOpen(false);
  };

  const filteredLocations = locations.filter(l => 
    searchQuery === '' || 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-expand parents when searching
  React.useEffect(() => {
    if (searchQuery.trim() !== '') {
        const parentsToExpand = new Set<string>();
        filteredLocations.forEach(loc => {
            const path = getLocationPath(loc.id);
            path.forEach(p => {
                if(p.id !== loc.id) parentsToExpand.add(p.id);
            });
        });
        setExpandedIds(Array.from(parentsToExpand));
    }
  }, [searchQuery]);

  const renderTreeItem = (location: LogicalLocation, depth: number = 0) => {
    // If searching, we only render items that match or are parents of matches
    if (searchQuery !== '') {
        const pathIds = getLocationPath(location.id).map(l => l.id);
        const hasMatchingChild = filteredLocations.some(fl => getLocationPath(fl.id).map(l => l.id).includes(location.id));
        const isMatch = filteredLocations.some(fl => fl.id === location.id);
        if (!isMatch && !hasMatchingChild) return null;
    }

    const children = locations.filter(l => l.parentId === location.id).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.includes(location.id) || searchQuery !== '';
    const isSelected = selectedLocationId === location.id;

    const category = LOCATION_CATEGORIES[location.locationType];
    const iconName = location.icon || category?.iconName || 'Box';
    const iconColorClass = location.color || (isSelected ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-400');
    
    // Operational signals for tree
    const mappedCount = visuals.filter(v => v.locationId === location.id).length;
    const hasStock = (location.stockCount || 0) > 0;
    const warningCount = (location.warnings || []).filter(w => w.severity === 'warning' || w.severity === 'critical').length;

    return (
      <div key={location.id} className="relative">
        <div 
          onClick={() => setSelectedLocationId(location.id)}
          onDragOver={(e) => handleDragOver(e, location.id)}
          onDragLeave={(e) => handleDragLeave(e, location.id)}
          onDrop={(e) => handleDrop(e, location.id)}
          className={`group tree-row-wrapper flex items-center justify-between py-1 px-2 rounded-lg cursor-pointer transition-colors border border-transparent ${
            dragOverId === location.id
              ? 'bg-sky-500/20 border-sky-500/60 shadow-[inset_0_0_0_2px_rgba(56,189,248,0.5)]'
              : isSelected 
                ? 'border-sky-500/30' 
                : 'hover:bg-slate-800/50 hover:border-slate-700/50'
          } relative`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {isSelected && (
              <motion.div
                layoutId="activeLocation"
                className="absolute inset-0 bg-sky-500/10 rounded-lg pointer-events-none"
                transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
              />
          )}
          <div className="flex items-center gap-2 overflow-hidden relative z-10 flex-1">
            <div 
              className={`w-4 h-4 shrink-0 flex items-center justify-center rounded cursor-pointer transition-colors ${hasChildren ? 'hover:bg-slate-700' : 'opacity-0'}`}
              onClick={(e) => hasChildren && toggleExpand(location.id, e)}
            >
              {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
            </div>
            
            <div className="flex items-center gap-2 overflow-hidden flex-1">
                 <IconRenderer name={iconName} className={`w-3 h-3 shrink-0 ${iconColorClass}`} />
                 <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-sky-400' : 'text-slate-200'}`}>
                   {location.name}
                 </span>
                 <span className="text-[10px] text-slate-500 uppercase tracking-tight truncate group-hover:text-slate-400 transition-colors hidden sm:block">
                    {location.code}
                 </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 relative z-10">
            {/* Visual Signals */}
            <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
               {mappedCount > 0 && <span title={`Mapped to ${mappedCount} layout(s)`}><LayoutGrid className="w-2.5 h-2.5 text-sky-400" /></span>}
               {hasStock && (
                 <div className="flex items-center gap-0.5" title={`${location.stockCount} items in stock`}>
                    <Package className="w-2.5 h-2.5 text-emerald-400" />
                    <span className="text-[8px] font-mono font-bold text-emerald-500/80">{location.stockCount}</span>
                 </div>
               )}
               {warningCount > 0 && <span title={`${warningCount} active warnings`}><AlertCircle className="w-2.5 h-2.5 text-amber-500" /></span>}
            </div>

            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              {!isTreeLocked && (
                <div 
                   className="p-1 text-slate-500 hover:text-white hover:bg-slate-700 rounded cursor-grab active:cursor-grabbing transition-colors" 
                   draggable={true}
                   onDragStart={(e) => handleDragStart(e, location.id)}
                   onDragEnd={handleDragEnd}
                   title="Drag to move"
                >
                    <GripVertical className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="mt-0.5 relative">
            {/* Tree branch line */}
            <div className="absolute left-[16px] top-0 bottom-3 w-px bg-slate-800" style={{ marginLeft: `${depth * 16}px` }}></div>
            {children.map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootLocations = locations.filter(l => !l.parentId).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const handleLocateOnMap = () => {
    if (!selectedLocation) return;
    // Find layout where this location is mapped
    const targetLayoutId = findRelevantLayoutId(selectedLocation.id);
    setPreviewLayoutId(targetLayoutId);
  };

  const handleAnalyzeMapping = () => {
    if (!selectedLocation) return;
    const targetLayoutId = findRelevantLayoutId(selectedLocation.id);
    setHealthReportLayoutId(targetLayoutId);
  };

  const findRelevantLayoutId = (locId: string): string | null => {
    // Find layout where this location is mapped
    const layoutWithMapping = layouts.find(layout => 
      visuals.some(v => v.layoutId === layout.id && (
        v.locationId === locId || 
        (v.structure && hasLocationIdInStructure(v.structure, locId))
      ))
    );
    
    if (layoutWithMapping) return layoutWithMapping.id;

    // If no direct mapping, try to find mapping for any ancestor
    const path = getLocationPath(locId);
    for (let i = path.length - 2; i >= 0; i--) {
       const ancestor = path[i];
       const ancestorLayout = layouts.find(layout => 
         visuals.some(v => v.layoutId === layout.id && (
           v.locationId === ancestor.id || 
           (v.structure && hasLocationIdInStructure(v.structure, ancestor.id))
         ))
       );
       if (ancestorLayout) {
          return ancestorLayout.id;
       }
    }

    return layouts[0]?.id || null;
  };

  function hasLocationIdInStructure(root: any, locId: string): boolean {
    if (root.locationId === locId) return true;
    if (root.children) {
      return root.children.some((c: any) => hasLocationIdInStructure(c, locId));
    }
    return false;
  }

  return (
    <div className="h-full flex px-6 py-6 gap-6 bg-slate-950 font-sans">
      <AnimatePresence>
        {previewLayoutId && (
          <InteractiveLocationMapPreview 
            layout={layouts.find(l => l.id === previewLayoutId)!}
            visualNodes={visuals.filter(v => v.layoutId === previewLayoutId)}
            locations={locations}
            initialLocationId={selectedLocationId || undefined}
            onClose={() => setPreviewLayoutId(null)}
            canEdit={true}
            onOpenEditor={() => {
              onNavigateToWorkspace(previewLayoutId);
              setPreviewLayoutId(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar: Location Tree */}
      <div className="w-[360px] bg-slate-900 border border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative z-10 shrink-0">
        <div className="p-4 border-b border-slate-800 bg-slate-900/30 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <input 
                type="text" 
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2 pl-8 pr-4 text-[11px] text-white placeholder-slate-700 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all font-bold tracking-tight"
              />
            </div>
            <button 
                onClick={() => { setSelectedLocationId(null); setIsAddModalOpen(true); }}
                className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer border border-sky-500/20 shadow-lg shadow-sky-500/5 shrink-0"
                title="Add New Entity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className={`flex-1 overflow-y-auto p-4 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800 relative transition-colors ${dragOverId === 'ROOT' ? 'bg-sky-500/5 ring-2 ring-inset ring-sky-500/30' : ''}`}
            onDragOver={(e) => handleDragOver(e, 'ROOT')}
            onDragLeave={(e) => handleDragLeave(e, 'ROOT')}
            onDrop={(e) => handleDrop(e, 'ROOT')}
        >
          {rootLocations.map(loc => renderTreeItem(loc))}
          {rootLocations.length === 0 && (
             <div className="text-center p-8">
               <Database className="w-8 h-8 text-slate-700 mx-auto mb-3" />
               <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">No Locations</p>
             </div>
          )}
        </div>

        <div className="p-2 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center justify-between bg-slate-950/50 rounded-xl p-1 border border-slate-800/50">
            <div className="flex items-center gap-1">
              <button 
                onClick={handleExpandAll}
                className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-slate-800 transition-all"
                title="Expand All"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={handleCollapseAll}
                className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-slate-800 transition-all"
                title="Collapse All"
              >
                <Triangle className="w-3.5 h-3.5 rotate-180" />
              </button>
              <div className="w-px h-4 bg-slate-800 mx-1" />
              <button 
                onClick={() => setIsTreeLocked(!isTreeLocked)}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-2 ${!isTreeLocked ? 'bg-amber-500/10 text-amber-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                title={isTreeLocked ? "Enable Reordering" : "Lock Reordering"}
              >
                {isTreeLocked ? <Key className="w-3.5 h-3.5" /> : <Move className="w-3.5 h-3.5" />}
                <span className="text-[9px] font-black uppercase tracking-tighter">{isTreeLocked ? 'Locked' : 'Edit Mode'}</span>
              </button>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsTreeActionsOpen(!isTreeActionsOpen)}
                className={`p-1.5 rounded-lg transition-all ${isTreeActionsOpen ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
              
              <AnimatePresence>
                {isTreeActionsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsTreeActionsOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden py-1"
                    >
                       <button className="w-full px-4 py-2 text-left text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-2">
                         <Filter className="w-3.5 h-3.5" /> Filter by Type
                       </button>
                       <button className="w-full px-4 py-2 text-left text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-2">
                         <LayoutGrid className="w-3.5 h-3.5" /> Smart Layout
                       </button>
                       <div className="border-t border-slate-800 my-1" />
                       <button 
                         onClick={() => { setIsCompactMode(v => !v); setIsTreeActionsOpen(false); }}
                         className="w-full px-4 py-2 text-left text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                       >
                         {isCompactMode ? <LayoutList className="w-3.5 h-3.5" /> : <Columns className="w-3.5 h-3.5" />}
                         {isCompactMode ? 'Standard View' : 'Compact View'}
                       </button>
                       <div className="border-t border-slate-800 my-1" />
                       <button 
                         onClick={() => { 
                           if (selectedLocation) {
                             handleAnalyzeMapping();
                           } else if (layouts.length > 0) {
                             setHealthReportLayoutId(layouts[0].id);
                           }
                           setIsTreeActionsOpen(false); 
                         }}
                         className="w-full px-4 py-2 text-left text-[10px] font-bold text-emerald-400 hover:text-white hover:bg-emerald-500/10 flex items-center gap-2"
                       >
                         <Activity className="w-3.5 h-3.5" /> Analyze Workspace Mapping
                       </button>
                       <div className="border-t border-slate-800 my-1" />
                       <button 
                         onClick={() => { setIsExportDialogOpen(true); setIsTreeActionsOpen(false); }}
                         className="w-full px-4 py-2 text-left text-[10px] font-bold text-sky-400 hover:text-white hover:bg-sky-500/10 flex items-center gap-2"
                       >
                         <FileJson className="w-3.5 h-3.5" /> Export Location Data
                       </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Location Detail */}
      <div className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
          
          <AnimatePresence mode="wait">
            {selectedLocation ? (
              <motion.div 
                key={selectedLocation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full relative z-10"
              >
                {/* Detail Header */}
                <div className="px-8 py-5 border-b border-slate-800/60 bg-slate-800/20 backdrop-blur-md relative z-10 shrink-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                           <IconRenderer name={selectedLocation.icon || LOCATION_CATEGORIES[selectedLocation.locationType]?.iconName || 'Database'} className={`w-6 h-6 ${selectedLocation.color || 'text-sky-400'}`} />
                           {selectedLocation.name}
                        </h1>
                        <div className="px-2 py-0.5 rounded items-center justify-center bg-slate-800 border border-slate-700 text-[9px] font-black text-slate-400 uppercase tracking-widest flex gap-1.5 mt-1">
                          <IconRenderer name={LOCATION_CATEGORIES[selectedLocation.locationType]?.iconName || 'Box'} className={`w-3 h-3 ${selectedLocation.color || 'text-slate-500'}`} />
                          {LOCATION_CATEGORIES[selectedLocation.locationType]?.label || selectedLocation.locationType}
                        </div>
                      </div>
                      <div className="flex items-center mt-2 inline-flex">
                        {getLocationPath(selectedLocation.id).map((pathLoc, i, arr) => (
                            <React.Fragment key={pathLoc.id}>
                                <span 
                                  onClick={() => setSelectedLocationId(pathLoc.id)}
                                  className={`text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${
                                    i === arr.length - 1 ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                    {pathLoc.code}
                                </span>
                                {i < arr.length - 1 && <span className="text-slate-700 text-[10px] font-bold">/</span>}
                            </React.Fragment>
                        ))}
                        <button 
                            onClick={handleCopyPath}
                            className="ml-2 p-1 rounded-md hover:bg-slate-800 text-slate-500 hover:text-sky-400 transition-colors"
                            title="Copy path"
                        >
                            {copiedPath ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  <div className="flex gap-2">
                       <div className="flex items-center gap-1 bg-slate-950/50 rounded-xl p-1 border border-slate-800 mr-2">
                         <button 
                           onClick={() => setIsCompactMode(false)}
                           className={`p-2 rounded-lg transition-all ${!isCompactMode ? 'bg-sky-500/10 text-sky-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] border border-sky-500/20' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
                           title="Bento Grid View"
                         >
                           <LayoutGrid className="w-4 h-4" />
                         </button>
                         <button 
                           onClick={() => setIsCompactMode(true)}
                           className={`p-2 rounded-lg transition-all ${isCompactMode ? 'bg-sky-500/10 text-sky-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] border border-sky-500/20' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
                           title="Streamlined View"
                         >
                           <LayoutList className="w-4 h-4" />
                         </button>
                       </div>
                       <button 
                         onClick={() => setIsEditModalOpen(true)}
                         className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-300 transition-all shadow-xl"
                       >
                         <Pencil className="w-4 h-4" />
                         Edit
                       </button>
                     </div>
                   </div>
                </div>

                {/* SUB-HEADER: TABS & QUICK ACTIONS RIBBON (Moved outside) */}
                <div className="px-8 py-3 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 relative z-20">
                    {/* Tabs */}
                    <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/50 backdrop-blur shrink-0">
                      <button 
                        onClick={() => setActiveTab('info')}
                        className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center ${activeTab === 'info' ? 'bg-slate-800 text-sky-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        <Info className="w-3.5 h-3.5" />
                        Information
                      </button>
                      <button 
                        onClick={() => setActiveTab('inventory')}
                        className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center ${activeTab === 'inventory' ? 'bg-slate-800 text-emerald-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        <Package className="w-3.5 h-3.5" />
                        Inventory
                      </button>
                    </div>

                    {/* Ribbon Actions */}
                    <div className="flex items-center gap-1.5 bg-slate-950/30 p-1 rounded-xl border border-slate-800/40">
                       <RibbonAction icon={<Plus className="w-3 h-3" />} onClick={() => setIsAddModalOpen(true)} title="Quick Add Child" />
                       <RibbonAction icon={<Copy className="w-3 h-3" />} onClick={() => console.log('Duplicate')} title="Duplicate" />
                       <RibbonAction icon={<SearchIcon className="w-3 h-3" />} onClick={handleLocateOnMap} title="Locate on Map" />
                       <RibbonAction icon={<Activity className="w-3 h-3" />} onClick={handleAnalyzeMapping} title="Analyze Mapping Health" />
                       <RibbonAction icon={<MoveUpRight className="w-3 h-3" />} onClick={() => { setLocationToMove(selectedLocation.id); setIsMoveModalOpen(true); }} title="Move Location" />
                       <div className="w-px h-4 bg-slate-800 mx-1" />
                       <RibbonAction icon={<Trash2 className="w-3 h-3" />} onClick={() => console.log('Archive')} title="Archive" variant="danger" />
                    </div>
                </div>

                {/* Detail Content */}
                <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-slate-800 pb-32">
                   <AnimatePresence mode="wait">
                   {activeTab === 'info' ? (
                    <motion.div 
                      key="info-tab"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-8"
                    >
                       {/* TOP LEVEL STATUS: Health & Quick Stats (Only in Information Tab) */}
                       {!isCompactMode && (
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            <div className="lg:col-span-2 flex flex-wrap gap-3">
                               {/* Location Status Indicators */}
                               <div className="flex items-center gap-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 shadow-sm flex-1 min-w-[200px]">
                                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-500 shadow-inner">
                                     <ShieldCheck className="w-6 h-6" />
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Functional Health</p>
                                     <div className="flex items-center gap-2">
                                        <span className="text-xl font-black text-white">94%</span>
                                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-400/10">STABLE</span>
                                     </div>
                                  </div>
                               </div>
                               
                               {/* Warnings Summary */}
                               <div className="flex items-center gap-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 shadow-sm flex-1 min-w-[200px]">
                                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors ${
                                    (selectedLocation.warnings?.length || 0) > 0 || getMappingStatus(selectedLocation.id) === MappingStatus.UNMAPPED
                                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                      : 'bg-slate-800 border-slate-700 text-slate-500 opacity-40'
                                  }`}>
                                     <AlertCircle className="w-6 h-6" />
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Active Alerts</p>
                                     <p className="text-xl font-black text-white">
                                       {((selectedLocation.warnings?.length || 0) + (getMappingStatus(selectedLocation.id) === MappingStatus.UNMAPPED ? 1 : 0)) || 0}
                                     </p>
                                  </div>
                               </div>
                            </div>

                            {/* Health Detail Inline */}
                            <div className="lg:col-span-1 space-y-2">
                                {getMappingStatus(selectedLocation.id) === MappingStatus.UNMAPPED && (
                                   <HealthWarning severity="warning" title="Unmapped Entity" />
                                )}
                                {(selectedLocation.warnings || []).slice(0, 1).map(w => (
                                   <HealthWarning key={w.id} severity={w.severity} title={w.title} />
                                ))}
                            </div>
                         </div>
                       )}

                      <div className={`grid gap-6 ${isCompactMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
                      
                    {/* Identity & Commands Column */}
                    <div className={`${isCompactMode ? 'flex flex-col gap-4' : 'lg:col-span-1 space-y-6'}`}>
                      {/* Location Role Card */}
                      <div className={`${isCompactMode ? 'bg-slate-900/30 border border-slate-800 flex items-center justify-between p-3 rounded-xl' : 'bg-slate-900/50 rounded-2xl border border-slate-700 shadow-xl overflow-hidden'}`}>
                        {!isCompactMode && (
                          <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/40 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Location Role</span>
                            <Fingerprint className="w-4 h-4 text-slate-600" />
                          </div>
                        )}
                        <div className={isCompactMode ? 'flex items-center gap-4' : 'p-6'}>
                          <div className={isCompactMode ? 'flex items-center gap-3' : 'flex items-start gap-4 mb-4'}>
                            <div className={isCompactMode ? `p-2 rounded-lg bg-slate-800 border border-slate-700 ${LOCATION_CATEGORIES[selectedLocation.locationType]?.color || 'text-sky-400'}` : `p-4 rounded-2xl bg-slate-800 border border-slate-700 ${LOCATION_CATEGORIES[selectedLocation.locationType]?.color || 'text-sky-400'}`}>
                              <IconRenderer name={LOCATION_CATEGORIES[selectedLocation.locationType]?.iconName || 'Database'} className={isCompactMode ? 'w-4 h-4' : 'w-6 h-6'} />
                            </div>
                            <div>
                              <h3 className={isCompactMode ? 'text-xs font-black text-white uppercase' : 'text-lg font-black text-white tracking-tight'}>
                                {LOCATION_CATEGORIES[selectedLocation.locationType]?.label}
                              </h3>
                              {!isCompactMode && (
                                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                                  {LOCATION_CATEGORIES[selectedLocation.locationType]?.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {!isCompactMode && <DetailItem label="Full Path Code" value={getLocationPath(selectedLocation.id).map(p => p.code).join(' / ')} isMono />}
                        </div>
                        {isCompactMode && (
                          <div className="flex items-center gap-6">
                             <div className="text-right">
                               <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">ID Path</p>
                               <p className="text-[10px] font-mono font-bold text-sky-500/70">{getLocationPath(selectedLocation.id).map(p => p.code).join(' / ')}</p>
                             </div>
                             <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                               <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                               <span className="text-[10px] font-black text-emerald-500">NOMINAL</span>
                             </div>
                          </div>
                        )}
                      </div>

                      {/* Documents & SOPs Card (Hidden/Simplified in Compact) */}
                      {!isCompactMode ? (
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col min-h-[160px]">
                          <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/40 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Documents & SOPs</span>
                            <FileText className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative group">
                            <div className="absolute inset-0 bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-30"></div>
                            <div className="relative z-10 space-y-3">
                              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto opacity-40 group-hover:opacity-100 group-hover:bg-slate-700 transition-all">
                                <FileText className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                              </div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-400 transition-colors">No operational notes</p>
                              <button className="mt-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-[10px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                                Add Document
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-500">
                                <FileText className="w-4 h-4" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operational SOPs</span>
                           </div>
                           <span className="text-[10px] font-bold text-slate-600 italic">None attached</span>
                        </div>
                      )}
                    </div>

                    {/* Operational Intelligence Column */}
                    <div className={isCompactMode ? 'bg-slate-900/30 border border-slate-800 rounded-xl p-3 grid grid-cols-2 md:grid-cols-4 gap-4' : 'lg:col-span-1 space-y-6'}>
                      {!isCompactMode && (
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
                          <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/40 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Operational Behavior</span>
                            <Construction className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="p-6">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Functional Capabilities</p>
                            <div className="grid grid-cols-2 gap-3">
                              <BehaviorIndicator label="Stores Inventory" active={selectedLocation.allowsStock} icon={<Database className="w-3.5 h-3.5" />} />
                              <BehaviorIndicator label="Pickable" active={selectedLocation.isPickable} icon={<RotateCcw className="w-3.5 h-3.5" />} />
                              <BehaviorIndicator label="Receivable" active={selectedLocation.isReceivable} icon={<Inbox className="w-3.5 h-3.5" />} />
                              <BehaviorIndicator label="Virtual" active={selectedLocation.isVirtual} icon={<Zap className="w-3.5 h-3.5" />} />
                            </div>
                          </div>
                        </div>
                      )}

                      {isCompactMode && (
                        <>
                          <CompactIndicator label="Stockable" active={selectedLocation.allowsStock} icon={<Database className="w-3 h-3" />} />
                          <CompactIndicator label="Pickable" active={selectedLocation.isPickable} icon={<RotateCcw className="w-3 h-3" />} />
                          <CompactIndicator label="Receivable" active={selectedLocation.isReceivable} icon={<Inbox className="w-3 h-3" />} />
                          <CompactIndicator label="Virtual" active={selectedLocation.isVirtual} icon={<Zap className="w-3 h-3" />} />
                        </>
                      )}

                      {!isCompactMode && (
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
                          <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/40 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Capacity & Assignment</span>
                            <CheckSquare className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="p-6 space-y-6">
                            <DetailItem label="Assigned Default SKU" value={selectedLocation.assignment?.defaultSKU || 'No assignment rules defined.'} isMono={!!selectedLocation.assignment?.defaultSKU} />
                            <DetailItem label="Allowed Categories" value={selectedLocation.assignment?.allowedCategories?.join(', ') || 'ALL'} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Physical & Spatial Column */}
                    <div className={isCompactMode ? 'bg-slate-900/30 border border-slate-800 rounded-xl p-3 flex items-center justify-between' : 'lg:col-span-1 space-y-6'}>
                      {!isCompactMode && (
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
                          <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/40 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Physical Metadata</span>
                            <Maximize2 className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="p-6">
                            {selectedLocation.physicalMetadata ? (
                              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                <DetailItem label="Width" value={`${selectedLocation.physicalMetadata.width} mm`} isMono />
                                <DetailItem label="Height" value={`${selectedLocation.physicalMetadata.height} mm`} isMono />
                                <DetailItem label="Depth" value={`${selectedLocation.physicalMetadata.depth} mm`} isMono />
                                <DetailItem label="Weight Cap." value={`${selectedLocation.physicalMetadata.weightCapacity} kg`} isMono />
                              </div>
                            ) : (
                              <div className="py-4 text-center">
                                <p className="text-[11px] text-slate-600 font-bold uppercase tracking-widest italic">No physical metadata defined.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {isCompactMode && (
                        <div className="flex items-center justify-between w-full">
                           <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-500">
                                <Maximize2 className="w-4 h-4" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Spatial Dim.</span>
                           </div>
                           <div className="flex items-center gap-4">
                             {selectedLocation.physicalMetadata ? (
                               <span className="text-[10px] font-mono font-bold text-slate-400">
                                 {selectedLocation.physicalMetadata.width}x{selectedLocation.physicalMetadata.height}x{selectedLocation.physicalMetadata.depth}mm
                               </span>
                             ) : (
                               <span className="text-[10px] font-bold text-slate-700">NA</span>
                             )}
                             <MappingBadge count={visuals.filter(v => v.locationId === selectedLocation.id).length} />
                           </div>
                        </div>
                      )}
                    </div>
                  </div>

                      {/* Mapping Card */}
                      <div className="bg-slate-900/50 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/40 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Visualization Mapping</span>
                          <LayoutGrid className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="p-5">
                          {getMappingStatus(selectedLocation.id) === MappingStatus.UNMAPPED ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">Not Visualized</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">This location is not represented in any layout.</p>
                                </div>
                              </div>
                              <button className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all">
                                Create Visualization
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">Visualized</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">Linked to {visuals.filter(v => v.locationId === selectedLocation.id).length} workspace layouts.</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <button className="w-full py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[10px] font-black uppercase tracking-widest text-sky-400 hover:bg-sky-500 hover:text-slate-950 transition-all">
                                  Open Visualizations
                                </button>
                                <button className="w-full py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-all">
                                  Create Additional Visual
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Location Health Ledger Card */}
                      <div className="bg-slate-900/50 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/40 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Health Ledger</span>
                          <ShieldAlert className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="p-5 space-y-3">
                          {getMappingStatus(selectedLocation.id) === MappingStatus.UNMAPPED && (
                            <HealthWarning severity="warning" title="No Spatial Data" description="Not mapped to any layouts." />
                          )}
                          {(selectedLocation.warnings || []).map(w => (
                            <HealthWarning key={w.id} severity={w.severity} title={w.title} description={w.description} />
                          ))}
                          {(!selectedLocation.warnings || selectedLocation.warnings.length === 0) && getMappingStatus(selectedLocation.id) === MappingStatus.MAPPED && (
                            <div className="text-center py-4">
                              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">System parameters nominal</p>
                            </div>
                          )}
                        </div>
                      </div>

                  {/* FULL WIDTH COLUMN: CHILD LOCATIONS */}
                  <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative w-full block">
                        <div className="px-8 py-5 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                              <LayoutList className="w-4 h-4 text-sky-500" />
                              Child Inventory Structure
                            </h3>
                            <span className="text-[10px] bg-slate-950 text-slate-500 px-3 py-1 rounded-full border border-slate-800 font-mono font-bold">
                              {locations.filter(l => l.parentId === selectedLocation.id).length} ENTITIES
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                             <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <button 
                                  onClick={() => setChildListDensity('COMFORTABLE')}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${childListDensity === 'COMFORTABLE' ? 'bg-slate-800 text-sky-400' : 'text-slate-600 hover:text-slate-400'}`}
                                >
                                  Comfortable
                                </button>
                                <button 
                                  onClick={() => setChildListDensity('COMPACT')}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${childListDensity === 'COMPACT' ? 'bg-slate-800 text-sky-400' : 'text-slate-600 hover:text-slate-400'}`}
                                >
                                  Compact
                                </button>
                             </div>
                             <div className="w-px h-6 bg-slate-800" />
                             <button 
                               onClick={() => setIsAddModalOpen(true)}
                               className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer border border-sky-500/20"
                               title="Add Child Location"
                             >
                                <Plus className="w-4 h-4" />
                             </button>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-slate-900/50">
                          {locations.filter(l => l.parentId === selectedLocation.id).length > 0 ? (
                            <div className={childListDensity === 'COMFORTABLE' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-1"}>
                              {locations.filter(l => l.parentId === selectedLocation.id).map(child => (
                                childListDensity === 'COMFORTABLE' ? (
                                  <div key={child.id} onClick={() => setSelectedLocationId(child.id)} className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/20 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/40 transition-all cursor-pointer group shadow-sm">
                                    <div className="flex items-center gap-4">
                                      <div className={`w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 ${LOCATION_CATEGORIES[child.locationType]?.color || 'text-slate-500'}`}>
                                         <IconRenderer name={child.icon || LOCATION_CATEGORIES[child.locationType]?.iconName || 'Box'} className="w-6 h-6" />
                                      </div>
                                      <div className="overflow-hidden">
                                        <p className="text-xs font-black text-white truncate">{child.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <p className="text-[10px] font-mono font-bold text-sky-400/80 uppercase truncate">{child.code}</p>
                                          {getMappingStatus(child.id) === MappingStatus.MAPPED && <LayoutGrid className="w-2.5 h-2.5 text-sky-500/40" />}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                           <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">{child.stockCount || 0} stocks</span>
                                           <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{LOCATION_CATEGORIES[child.locationType]?.label}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-sky-500 transition-colors shrink-0" />
                                  </div>
                                ) : (
                                  <div key={child.id} onClick={() => setSelectedLocationId(child.id)} className="flex items-center justify-between py-1.5 px-4 rounded-lg bg-slate-950/30 border border-transparent hover:border-slate-800 hover:bg-slate-800/40 transition-all cursor-pointer group">
                                     <div className="flex items-center gap-4 flex-1">
                                        <div className="flex items-center gap-2 w-48 shrink-0">
                                           <IconRenderer name={child.icon || LOCATION_CATEGORIES[child.locationType]?.iconName || 'Box'} className={`w-3.5 h-3.5 ${LOCATION_CATEGORIES[child.locationType]?.color || 'text-slate-600'}`} />
                                           <span className="text-[11px] font-bold text-slate-200 truncate group-hover:text-white transition-colors">{child.name}</span>
                                        </div>
                                        <span className="w-24 text-[10px] font-mono font-bold text-sky-500/70 group-hover:text-sky-400 transition-colors uppercase truncate">{child.code}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 w-32">{LOCATION_CATEGORIES[child.locationType]?.label}</span>
                                        <div className="flex items-center gap-1.5 w-24">
                                           <Package className="w-3 h-3 text-slate-700" />
                                           <span className="text-[10px] font-mono text-slate-500">{child.stockCount || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-1 justify-end opacity-40 group-hover:opacity-100 transition-opacity">
                                           {getMappingStatus(child.id) === MappingStatus.MAPPED ? <LayoutGrid className="w-3.5 h-3.5 text-sky-500" /> : <Triangle className="w-3.5 h-3.5 text-slate-800" />}
                                           {(child.warnings?.length || 0) > 0 && <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                                        </div>
                                     </div>
                                     <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                       <button className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white"><Pencil className="w-3 h-3" /></button>
                                       <button className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white"><Copy className="w-3 h-3" /></button>
                                     </div>
                                  </div>
                                )
                              ))}
                            </div>
                          ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-center">
                              <Box className="w-12 h-12 text-slate-800 mb-4" />
                              <p className="text-xs font-black text-slate-600 uppercase tracking-[0.2em]">Structure Empty</p>
                              <p className="text-[10px] text-slate-700 font-medium mt-2">No nested child locations found for this entity.</p>
                              <button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="mt-6 px-6 py-2 rounded-xl border border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:border-sky-500/50 hover:text-sky-400 transition-all"
                              >
                            Initial Seed
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="inventory-tab"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* INVENTORY TAB CONTENT */}
                  <div className={`grid gap-6 ${isCompactMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                    {/* Inventory Stats Card */}
                    <div className={`${isCompactMode ? 'bg-slate-900/30 border border-slate-800 flex items-center justify-between p-4 rounded-xl' : 'bg-slate-900/50 rounded-2xl border border-slate-700 shadow-xl overflow-hidden'}`}>
                      {!isCompactMode && (
                        <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/40 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Inventory Presence</span>
                          <Package className="w-4 h-4 text-slate-600" />
                        </div>
                      )}
                      <div className={isCompactMode ? 'flex items-center gap-12 w-full' : 'p-8 grid grid-cols-2 gap-6'}>
                        <div className={isCompactMode ? 'flex items-center gap-4 flex-1' : 'space-y-2'}>
                           <div className={isCompactMode ? 'w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500' : ''}>
                              {isCompactMode && <Package className="w-5 h-5" />}
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Stock</p>
                              <div className="flex items-baseline gap-2">
                                <p className={isCompactMode ? 'text-lg font-black text-white' : 'text-4xl font-black text-white'}>{selectedLocation.stockCount?.toString() || '0'}</p>
                                {isCompactMode && <span className="text-[9px] font-bold text-slate-600 uppercase">UNITS</span>}
                              </div>
                           </div>
                        </div>
                        <div className={isCompactMode ? 'flex items-center gap-4 flex-1' : 'space-y-2'}>
                           <div className={isCompactMode ? 'w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400' : ''}>
                              {isCompactMode && <Layers className="w-5 h-5" />}
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active SKUs</p>
                              <div className="flex items-baseline gap-2">
                                <p className={isCompactMode ? 'text-lg font-black text-sky-400' : 'text-4xl font-black text-sky-400'}>{selectedLocation.skuCount?.toString() || '0'}</p>
                                {isCompactMode && <span className="text-[9px] font-bold text-slate-600 uppercase">UNIQUE</span>}
                              </div>
                           </div>
                        </div>
                        {isCompactMode && (
                          <div className="flex-1 flex justify-end">
                            <button className="px-4 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-[10px] font-black text-slate-300 hover:text-white transition-all uppercase tracking-widest">
                               View Detailed Ledger
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recent Activity Card */}
                    {!isCompactMode ? (
                      <div className="bg-slate-900/50 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/40 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Recent Movements</span>
                            <Clock className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4 opacity-40">
                                <Layers className="w-5 h-5 text-slate-600" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">No activity recorded</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-500">
                               <Clock className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recent Activity</span>
                         </div>
                         <span className="text-[10px] font-bold text-slate-600 italic">No recent movements in ledger</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex flex-col items-center justify-center relative z-10 opacity-50"
        >
          <Database className="w-16 h-16 text-slate-700 mb-6" />
          <p className="text-sm font-bold text-slate-300">Select a location to view details</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>

  <AnimatePresence>
    {isAddModalOpen && (
      <LocationModal 
        onClose={() => setIsAddModalOpen(false)} 
        onSubmit={handleAddLocation}
        locations={locations}
        initialData={selectedLocation ? { parentId: selectedLocation.id } : undefined}
      />
    )}
    {isEditModalOpen && selectedLocation && (
      <LocationModal 
        onClose={() => setIsEditModalOpen(false)} 
        onSubmit={handleEditLocation}
        locations={locations}
        initialData={selectedLocation}
      />
    )}
    
    {/* Move Location Confirmation Modal */}
    {isMoveModalOpen && locationToMove && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="p-6 border-b border-slate-800 bg-slate-950/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                            <Move className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Move Location</h3>
                            <p className="text-xs text-slate-400 mt-1">Confirm hierarchy reorganization</p>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <p className="text-xs text-slate-300 font-medium">You are about to move a location. This logically reorganizes the hierarchy but does not automatically un-map workspaces or physically move stock.</p>
                        
                        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-4">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Old Hierarchy Path</p>
                                <div className="flex items-center gap-1.5 flex-wrap px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                                    {getLocationPath(locationToMove).map((l, i, arr) => (
                                        <React.Fragment key={l.id}>
                                            <span className={`text-[10px] font-mono ${i === arr.length - 1 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>{l.code}</span>
                                            {i < arr.length - 1 && <span className="text-slate-700 font-bold text-[10px]">/</span>}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-1.5">New Hierarchy Path</p>
                                <div className="flex items-center gap-1.5 flex-wrap px-2 py-1.5 rounded-lg bg-slate-900 border border-emerald-500/20">
                                    {moveTargetId !== 'ROOT' && getLocationPath(moveTargetId).map(l => (
                                        <React.Fragment key={l.id}>
                                            <span className="text-[10px] font-mono text-emerald-400/70">{l.code}</span>
                                            <span className="text-slate-700 font-bold text-[10px]">/</span>
                                        </React.Fragment>
                                    ))}
                                    {moveTargetId === 'ROOT' && <span className="text-[10px] font-mono text-emerald-400/70">ROOT / </span>}
                                    <span className="text-[10px] font-mono font-bold text-emerald-400">{locations.find(l=>l.id===locationToMove)?.code || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3">
                    <button 
                        onClick={() => { setIsMoveModalOpen(false); setLocationToMove(null); }}
                        className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={executeMove}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                    >
                        Confirm Move
                    </button>
                </div>
            </motion.div>
        </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExportDialogOpen && (
          <LocationExportDialog 
            locations={locations}
            layouts={layouts}
            onClose={() => setIsExportDialogOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {healthReportLayoutId && layouts.find(l => l.id === healthReportLayoutId) && (
          <WorkspaceHealthReportDialog 
            layout={layouts.find(l => l.id === healthReportLayoutId)!}
            visuals={visuals.filter(v => v.layoutId === healthReportLayoutId)}
            locations={locations}
            scopeLocationId={selectedLocationId || undefined}
            onClose={() => setHealthReportLayoutId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CompactIndicator({ label, active, icon }: { label: string, active: boolean, icon: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-2 transition-all ${active ? 'text-emerald-400' : 'text-slate-700'}`}>
      {icon}
      <span className={`text-[10px] font-black uppercase tracking-widest ${active ? '' : 'line-through opacity-30'}`}>{label}</span>
    </div>
  );
}

function MappingBadge({ count }: { count: number }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
      count > 0 ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
    }`}>
      {count > 0 ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
      <span className="text-[9px] font-black uppercase tracking-widest">{count > 0 ? 'MAPPED' : 'UNMAPPED'}</span>
    </div>
  );
}

function DetailItem({ label, value, isMono, isBadge }: { label: string, value: string | React.ReactNode, isMono?: boolean, isBadge?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{label}</p>
      {isBadge ? (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${
          value === 'Allowed' || value === 'Yes' || value === 'Stores Inventory' || value === 'Pickable' || value === 'Receivable' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          {value}
        </span>
      ) : (
        <p className={`text-slate-200 truncate ${isMono ? 'font-mono text-[11px] uppercase' : 'text-sm font-medium'}`}>{value}</p>
      )}
    </div>
  );
}

function ActionButton({ icon, label, onClick, variant }: { icon: React.ReactNode, label: string, onClick: () => void, variant?: 'danger' }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all hover:scale-[1.02] ${
        variant === 'danger' 
          ? 'bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500/20' 
          : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function RibbonAction({ icon, onClick, title, variant }: { icon: React.ReactNode, onClick: () => void, title: string, variant?: 'danger' }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-all border ${
        variant === 'danger' 
          ? 'border-red-500/20 text-red-500 hover:bg-red-500/10' 
          : 'border-transparent text-slate-500 hover:text-sky-400 hover:bg-slate-800/50'
      }`}
    >
      {icon}
    </button>
  );
}

function BehaviorIndicator({ label, active, icon }: { label: string, active: boolean, icon: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      active 
        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
        : 'bg-slate-800/10 border-slate-800/50 text-slate-600 opacity-40'
    }`}>
      <div className={`p-1.5 rounded-lg ${active ? 'bg-emerald-500/20' : 'bg-slate-900'}`}>
        {icon}
      </div>
      <div className="flex-1 flex items-center justify-between">
         <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
         {active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      </div>
    </div>
  );
}

interface HealthWarningProps {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description?: string;
}

const HealthWarning: React.FC<HealthWarningProps> = ({ severity, title, description }) => {
  const styles: Record<string, string> = {
    info: 'bg-sky-500/5 border-sky-500/20 text-sky-400',
    warning: 'bg-amber-500/5 border-amber-500/20 text-amber-500',
    critical: 'bg-red-500/5 border-red-500/20 text-red-500'
  };

  return (
    <div className={`p-3 rounded-xl border ${styles[severity]} flex items-start gap-3`}>
       {severity === 'info' && <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
       {severity === 'warning' && <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
       {severity === 'critical' && <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
       <div>
         <p className="text-[10px] font-black uppercase tracking-widest">{title}</p>
         {description && <p className="text-[9px] font-medium mt-0.5 opacity-80">{description}</p>}
       </div>
    </div>
  );
}
