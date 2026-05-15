import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Stage, Layer, Rect, Text, Line, Group } from 'react-konva';
import { VisualNode, ViewMode } from '../../types';
import { EditorTool } from './EditorPage';
import Konva from 'konva';

interface CanvasProps {
  visuals: VisualNode[];
  viewMode: ViewMode;
  tool: EditorTool;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showRulers: boolean;
  selectedNodeIds: string[];
  onSelectNodes: (ids: string[]) => void;
  onUpdateNode: (id: string, updates: Partial<VisualNode>) => void;
  onUpdateNodes: (updates: { id: string, updates: Partial<VisualNode> }[]) => void;
  fitTrigger?: number;
}

export default function EditorCanvas({ 
  visuals, 
  viewMode, 
  tool,
  zoomLevel, 
  setZoomLevel,
  showGrid, 
  snapToGrid,
  gridSize,
  showRulers,
  selectedNodeIds, 
  onSelectNodes,
  onUpdateNode,
  onUpdateNodes,
  fitTrigger = 0
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef<{ x: number, y: number } | null>(null);
  const [previewSelectedIds, setPreviewSelectedIds] = useState<string[]>([]);
  const lastMarqueeSelectionTime = useRef(0);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{ x1: number, y1: number, x2: number, y2: number, mode: 'enclose' | 'intersect' } | null>(null);

  const scale = 0.1; // 1mm = 0.1px

  const getRelativePointerPosition = (stage: Konva.Stage) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const transform = stage.getAbsoluteTransform().copy().invert();
    return transform.point(pointer);
  };

  // Helper to check if a node ID is selected
  const isSelected = (id: string) => selectedNodeIds?.includes(id);

  // Update dimensions on resize
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
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Track Ctrl/Cmd key state globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setIsCtrlPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setIsCtrlPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', () => setIsCtrlPressed(false)); // Reset on blur
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', () => setIsCtrlPressed(false));
    };
  }, []);

  // Update selection mode while dragging if Ctrl is pressed/released
  useEffect(() => {
    if (selectionRect) {
      const mode: 'enclose' | 'intersect' = isCtrlPressed ? 'intersect' : 'enclose';
      if (selectionRect.mode !== mode) {
        setSelectionRect(prev => prev ? { ...prev, mode } : null);
        setPreviewSelectedIds(getSelectedIdsInRect(selectionRect, mode === 'enclose'));
      }
    }
  }, [isCtrlPressed, selectionRect?.x1, selectionRect?.x2]);

  const rootVisual = useMemo(() => visuals.find(v => v.parentId === null), [visuals]);
  const currentVisuals = useMemo(() => visuals.filter(v => v.viewMode === viewMode && v.parentId !== null), [visuals, viewMode]);

  // Handle box selection logic
  const handleBoxSelectionStart = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool !== 'select' || e.evt.button !== 0) return;
    
    // Marquee can start on stage, floor, or any locked object
    // If it starts on an unlocked object, we don't start marquee (likely a drag)
    const isStage = e.target === e.target.getStage();
    const isFloor = rootVisual && (e.target.id() === rootVisual.id || e.target.name() === 'floor');
    
    // Find the visual node associated with the click target
    const targetId = e.target.id() || e.target.getParent()?.id();
    const targetVisual = visuals.find(v => v.id === targetId);
    const isLocked = targetVisual?.locked;
    
    if (!isStage && !isFloor && !isLocked) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pointer = getRelativePointerPosition(stage);
    if (!pointer) return;
    
    const mode: 'enclose' | 'intersect' = e.evt.ctrlKey || e.evt.metaKey ? 'intersect' : 'enclose';
    setSelectionRect({ 
      x1: pointer.x, 
      y1: pointer.y, 
      x2: pointer.x, 
      y2: pointer.y, 
      mode 
    });
  };

  const handleBoxSelectionMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!selectionRect) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pointer = getRelativePointerPosition(stage);
    if (!pointer) return;
    
    const mode: 'enclose' | 'intersect' = e.evt.ctrlKey || e.evt.metaKey ? 'intersect' : 'enclose';
    const newRect = { ...selectionRect, x2: pointer.x, y2: pointer.y, mode };
    setSelectionRect(newRect);
    
    // Calculate current preview selection
    setPreviewSelectedIds(getSelectedIdsInRect(newRect, mode === 'enclose'));
  };

  const getSelectedIdsInRect = (rect: { x1: number, y1: number, x2: number, y2: number }, isEncloseMode: boolean) => {
    const x = Math.min(rect.x1, rect.x2);
    const y = Math.min(rect.y1, rect.y2);
    const width = Math.abs(rect.x1 - rect.x2);
    const height = Math.abs(rect.y1 - rect.y2);

    if (width < 0.1 && height < 0.1) return [];

    const selectionCandidates = [...currentVisuals];
    if (rootVisual) selectionCandidates.push(rootVisual);

    return selectionCandidates
      .filter(v => !v.locked)
      .filter(v => {
        // Calculate rotated corners in pixel space
        const rad = (v.rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const cx = (v.x + v.width / 2) * scale;
        const cy = (v.y + v.depth / 2) * scale;
        const hW = (v.width / 2) * scale;
        const hD = (v.depth / 2) * scale;

        // Corners: TL, TR, BR, BL
        const corners = [
          { x: cx - hW * cos + hD * sin, y: cy - hW * sin - hD * cos },
          { x: cx + hW * cos + hD * sin, y: cy + hW * sin - hD * cos },
          { x: cx + hW * cos - hD * sin, y: cy + hW * sin + hD * cos },
          { x: cx - hW * cos - hD * sin, y: cy - hW * sin + hD * cos },
        ];

        if (isEncloseMode) {
          // Every corner must be contained
          return corners.every(c => c.x >= x && c.x <= x + width && c.y >= y && c.y <= y + height);
        } else {
          // Intersect mode: Any corner inside OR any marquee corner inside OR SAT intersection
          // For simplicity and common feel, we use AABB intersection check combined with corner check
          const isAnyCornerInside = corners.some(c => c.x >= x && c.x <= x + width && c.y >= y && c.y <= y + height);
          if (isAnyCornerInside) return true;

          // AABB of object intersection (approximation for "touch")
          const absCos = Math.abs(cos);
          const absSin = Math.abs(sin);
          const rw = v.width * absCos + v.depth * absSin;
          const rh = v.width * absSin + v.depth * absCos;
          const vx = (v.x + v.width / 2 - rw / 2) * scale;
          const vy = (v.y + v.depth / 2 - rh / 2) * scale;
          const vWidth = rw * scale;
          const vHeight = rh * scale;
          
          return (
            vx < x + width &&
            vx + vWidth > x &&
            vy < y + height &&
            vy + vHeight > y
          );
        }
      }).map(v => v.id);
  };

  const handleBoxSelectionEnd = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!selectionRect) return;
    
    const isEnclose = !(e.evt.ctrlKey || e.evt.metaKey);
    const finalSelectedIds = getSelectedIdsInRect(selectionRect, isEnclose);

    if (finalSelectedIds.length > 0) {
      if (e.evt.shiftKey) {
        onSelectNodes([...new Set([...selectedNodeIds, ...finalSelectedIds])]);
      } else {
        onSelectNodes(finalSelectedIds);
      }
    } else {
        if (!e.evt.shiftKey) onSelectNodes([]);
    }

    setSelectionRect(null);
    setPreviewSelectedIds([]);
    lastMarqueeSelectionTime.current = Date.now();
  };

  // Fit to screen effect
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      const padding = 60;
      const availableWidth = dimensions.width - padding * 2;
      const availableHeight = dimensions.height - padding * 2;
      
      let targetWidthCm = 0;
      let targetHeightCm = 0;
      let offsetXCm = 0;
      let offsetYCm = 0;

      if (viewMode === ViewMode.TOP_DOWN && rootVisual) {
        targetWidthCm = rootVisual.width;
        targetHeightCm = rootVisual.depth;
        offsetXCm = 0;
        offsetYCm = 0;
      } else {
        // Calculate bounding box of all or current visuals in this view
        const nodesToFit = currentVisuals.length > 0 ? currentVisuals : (rootVisual ? [rootVisual] : []);
        if (nodesToFit.length === 0) return;

        let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
        nodesToFit.forEach(v => {
          const vWidth = v.width;
          const vHeight = viewMode === ViewMode.TOP_DOWN ? v.depth : v.height;
          minX = Math.min(minX, v.x);
          minY = Math.min(minY, v.y);
          maxX = Math.max(maxX, v.x + vWidth);
          maxY = Math.max(maxY, v.y + vHeight);
        });

        targetWidthCm = maxX - minX;
        targetHeightCm = maxY - minY;
        offsetXCm = minX;
        offsetYCm = minY;
      }

      if (targetWidthCm <= 0 || targetHeightCm <= 0) return;

      const targetWidthPx = targetWidthCm * scale;
      const targetHeightPx = targetHeightCm * scale;
      
      const targetZoom = Math.min(
        availableWidth / targetWidthPx,
        availableHeight / targetHeightPx
      );
      
      const clampedZoom = Math.max(0.01, Math.min(5, targetZoom));
      
      const newX = (dimensions.width - targetWidthPx * clampedZoom) / 2 - (offsetXCm * scale * clampedZoom);
      const newY = (dimensions.height - targetHeightPx * clampedZoom) / 2 - (offsetYCm * scale * clampedZoom);
      
      setZoomLevel(clampedZoom);
      setPos({ x: newX, y: newY });
    }
  }, [fitTrigger, viewMode, rootVisual?.id, rootVisual?.width, rootVisual?.depth, rootVisual?.height, dimensions.width, dimensions.height, currentVisuals.length]);

  const handleDragStart = (id: string) => {
    if (!isSelected(id)) {
        onSelectNodes([id]);
    }
    // Record initial positions of all selected nodes for multi-drag
    const positions: Record<string, { x: number, y: number }> = {};
    visuals.filter(v => selectedNodeIds?.includes(v.id)).forEach(v => {
      positions[v.id] = { x: v.x, y: v.y };
    });
    // We'll store this in a ref or local state if needed, but for now we'll use delta calculation in handleDragMove
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    const node = e.target;
    const visual = visuals.find(v => v.id === id);
    if (!visual) return;

    // Calculate delta in cm based on the dragged node's new position
    const currentCenterX = node.x() / scale;
    const currentCenterY = node.y() / scale;
    
    let dx = currentCenterX - (visual.x + visual.width / 2);
    let dy = currentCenterY - (visual.y + visual.depth / 2);

    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;

    // Blocking check for all selected nodes
    const blockingZones = visuals.filter(v => v.type === 'zone' && v.blockPlacement && !selectedNodeIds?.includes(v.id));
    
    // Function to find the max allowed delta given a direction
    const getMaxDelta = (propDx: number, propDy: number) => {
      let allowedDx = propDx;
      let allowedDy = propDy;

      // Check each selected node
      for (const selId of selectedNodeIds) {
        const v = visuals.find(node => node.id === selId);
        if (!v) continue;

        const rad = (v.rotation || 0) * Math.PI / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        const rw = v.width * cos + v.depth * sin;
        const rh = v.width * sin + v.depth * cos;
        const cx = v.x + v.width / 2 + allowedDx;
        const cy = v.y + v.depth / 2 + allowedDy;

        const nextBBox = {
          x1: cx - rw / 2,
          x2: cx + rw / 2,
          y1: cy - rh / 2,
          y2: cy + rh / 2
        };

        // Floor Bounds
        if (rootVisual) {
          if (nextBBox.x1 < 0) allowedDx -= nextBBox.x1;
          if (nextBBox.x2 > rootVisual.width) allowedDx -= (nextBBox.x2 - rootVisual.width);
          if (nextBBox.y1 < 0) allowedDy -= nextBBox.y1;
          if (nextBBox.y2 > rootVisual.depth) allowedDy -= (nextBBox.y2 - rootVisual.depth);
        }

        // Zone Collisions (Sliding)
        blockingZones.forEach(zone => {
          const zRad = (zone.rotation || 0) * Math.PI / 180;
          const zCos = Math.abs(Math.cos(zRad));
          const zSin = Math.abs(Math.sin(zRad));
          const zrw = zone.width * zCos + zone.depth * zSin;
          const zrh = zone.width * zSin + zone.depth * zCos;
          const zcx = zone.x + zone.width / 2;
          const zcy = zone.y + zone.depth / 2;

          const vx1 = cx - rw / 2;
          const vx2 = cx + rw / 2;
          const vy1 = cy - rh / 2;
          const vy2 = cy + rh / 2;

          const zx1 = zcx - zrw / 2;
          const zx2 = zcx + zrw / 2;
          const zy1 = zcy - zrh / 2;
          const zy2 = zcy + zrh / 2;

          // If overlapping
          if (!(vx2 <= zx1 || vx1 >= zx2 || vy2 <= zy1 || vy1 >= zy2)) {
             // We hit a zone. Determine which edge we hit based on movement direction
             const overlapX = Math.min(vx2 - zx1, zx2 - vx1);
             const overlapY = Math.min(vy2 - zy1, zy2 - vy1);

             if (overlapX < overlapY) {
               // Resolve X
               if (allowedDx > 0) allowedDx -= overlapX;
               else allowedDx += overlapX;
             } else {
               // Resolve Y
               if (allowedDy > 0) allowedDy -= overlapY;
               else allowedDy += overlapY;
             }
          }
        });
      }
      return { dx: allowedDx, dy: allowedDy };
    };

    // First try the full move, then resolve collisions
    const finalDelta = getMaxDelta(dx, dy);
    
    // Update all selected nodes by the allowed delta
    if (Math.abs(finalDelta.dx) > 0.001 || Math.abs(finalDelta.dy) > 0.001) {
      const updates = selectedNodeIds.map(selectedId => {
        const v = visuals.find(node => node.id === selectedId);
        if (!v) return null;
        return { 
          id: selectedId, 
          updates: { 
            x: Math.round(v.x + finalDelta.dx), 
            y: Math.round(v.y + finalDelta.dy) 
          } 
        };
      }).filter((u): u is { id: string, updates: any } => u !== null);

      onUpdateNodes(updates);
    }

    // Sync the dragged node's visual position to the state-derived position
    // to prevent it from moving independently of the validation logic
    const syncedVisual = visuals.find(v => v.id === id);
    if (syncedVisual) {
      node.x((syncedVisual.x + syncedVisual.width / 2) * scale);
      node.y((syncedVisual.y + syncedVisual.depth / 2) * scale);
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    // No-op or minor cleanup as movement is handled in real-time in handleDragMove
  };

  const getDragBoundFunc = (visualId: string) => {
    return function(this: Konva.Node, posArg: Konva.Vector2d) {
      if (!rootVisual || !stageRef.current) return posArg;
      
      const visual = visuals.find(v => v.id === visualId);
      if (!visual) return posArg;

      const stage = stageRef.current;
      const sX = stage.x();
      const sY = stage.y();
      const sScale = stage.scaleX();

      let localCenterX = (posArg.x - sX) / sScale;
      let localCenterY = (posArg.y - sY) / sScale;

      const rad = (visual.rotation || 0) * Math.PI / 180;
      const wPx = visual.width * scale;
      const hPx = visual.depth * scale;
      
      const boundingHw = (Math.abs(wPx * Math.cos(rad)) + Math.abs(hPx * Math.sin(rad))) / 2;
      const boundingHh = (Math.abs(wPx * Math.sin(rad)) + Math.abs(hPx * Math.cos(rad))) / 2;

      const minCenterX = boundingHw;
      const minCenterY = boundingHh;
      const maxCenterX = rootVisual.width * scale - boundingHw;
      const maxCenterY = rootVisual.depth * scale - boundingHh;

      localCenterX = Math.max(minCenterX, Math.min(maxCenterX, localCenterX));
      localCenterY = Math.max(minCenterY, Math.min(maxCenterY, localCenterY));

      return { 
        x: localCenterX * sScale + sX, 
        y: localCenterY * sScale + sY 
      };
    };
  };

  // Helper to render zone pattern
  const ZonePatternLayer = ({ node }: { node: VisualNode }) => {
    if (node.type !== 'zone' || !node.zonePattern || node.zonePattern === 'solid') return null;
    
    const w = node.width * scale;
    const d = node.depth * scale;
    const lines = [];
    const secondary = node.secondaryColor || '#ffffff';
    const sOpacity = node.secondaryOpacity ?? 0.3;

    if (node.zonePattern.startsWith('stripes') || node.zonePattern.startsWith('diagonal')) {
      const isWide = node.zonePattern.includes('wide');
      const isDiagonal = node.zonePattern.startsWith('diagonal');
      const spacing = (isWide ? 25 : 8) * scale;
      const strokeWidth = (isWide ? 15 : 4) * scale;

      if (isDiagonal) {
        for (let i = -d; i < w + d; i += spacing * 2) {
            lines.push(
              <Line
                key={i}
                points={[i, 0, i + d, d]}
                stroke={secondary}
                strokeWidth={strokeWidth}
                opacity={sOpacity}
              />
            );
          }
      } else {
        // Vertical stripes
        for (let i = 0; i < w + spacing; i += spacing * 2) {
            lines.push(
                <Rect 
                    key={i}
                    x={i} y={0} width={strokeWidth} height={d}
                    fill={secondary}
                    opacity={sOpacity}
                />
            );
        }
      }
    } else if (node.zonePattern === 'dots') {
       const spacing = 12 * scale;
       for (let ix = spacing; ix < w; ix += spacing * 2) {
         for (let iy = spacing; iy < d; iy += spacing * 2) {
            lines.push(
              <Rect 
                key={`${ix}-${iy}`}
                x={ix} y={iy} width={2 * scale} height={2 * scale}
                fill={secondary}
                opacity={sOpacity}
              />
            );
         }
       }
    } else if (node.zonePattern === 'grid') {
      const spacing = 30 * scale;
      for (let x = 0; x <= w; x += spacing) {
        lines.push(<Line key={`gx-${x}`} points={[x, 0, x, d]} stroke={secondary} strokeWidth={0.5 / zoomLevel} opacity={sOpacity} />);
      }
      for (let y = 0; y <= d; y += spacing) {
        lines.push(<Line key={`gy-${y}`} points={[0, y, w, y]} stroke={secondary} strokeWidth={0.5 / zoomLevel} opacity={sOpacity} />);
      }
    }

    return <Group clipFunc={(ctx) => ctx.rect(0, 0, w, d)}>{lines}</Group>;
  };

  // Generate grid lines
  const gridLines = useMemo(() => {
    if (!showGrid || !rootVisual) return [];
    const lines = [];
    
    const stroke = "#2e3b52";
    const strokeWidth = 1 / zoomLevel;

    // Vertical lines
    for (let x = 0; x <= rootVisual.width; x += gridSize) {
      lines.push(
        <Line 
          key={`v-${x}`}
          points={[x * scale, 0, x * scale, rootVisual.depth * scale]}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={x % 100 === 0 ? 0.8 : 0.3}
        />
      );
    }
    // Horizontal lines
    for (let y = 0; y <= rootVisual.depth; y += gridSize) {
      lines.push(
        <Line 
          key={`h-${y}`}
          points={[0, y * scale, rootVisual.width * scale, y * scale]}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={y % 100 === 0 ? 0.8 : 0.3}
        />
      );
    }
    return lines;
  }, [showGrid, rootVisual, gridSize, zoomLevel]);

  // DOM rulers
  const Ruler = ({ orientation }: { orientation: 'horizontal' | 'horizontal-bottom' | 'vertical' | 'vertical-right' }) => {
    if (!showRulers || !rootVisual) return null;

    const isHorizontal = orientation.startsWith('horizontal');
    const isBottom = orientation === 'horizontal-bottom';
    const isRight = orientation === 'vertical-right';
    
    const majorStep = 100; // 1m
    const minorStep = 10;  // 10cm
    
    const ticks = [];
    
    // Bounds for world coordinates in cm
    const startWorldCm = (0 - (isHorizontal ? pos.x : pos.y)) / (zoomLevel * scale);
    const endWorldCm = ((isHorizontal ? dimensions.width : dimensions.height) - (isHorizontal ? pos.x : pos.y)) / (zoomLevel * scale);
    
    const startTick = Math.max(0, Math.floor(startWorldCm / minorStep) * minorStep);
    const endTick = Math.min(isHorizontal ? rootVisual.width : rootVisual.depth, Math.ceil(endWorldCm / minorStep) * minorStep);

    for (let cm = startTick; cm <= endTick; cm += minorStep) {
       const isMajor = cm % majorStep === 0;
       const px = (cm * scale * zoomLevel) + (isHorizontal ? pos.x : pos.y);
       
       ticks.push(
         <div 
           key={cm}
           className={`absolute ${isMajor ? 'bg-slate-500' : 'bg-slate-700'}`}
           style={{
             left: isHorizontal ? px : undefined,
             top: !isHorizontal ? px : undefined,
             [isHorizontal ? 'width' : 'height']: '1.5px',
             [isHorizontal ? 'height' : 'width']: isMajor ? '100%' : '30%',
             [isHorizontal ? (isBottom ? 'top' : 'bottom') : (isRight ? 'left' : 'right')]: 0,
           }}
         >
           {isMajor && (
             <span 
               className={`absolute text-[8px] font-bold text-slate-400 whitespace-nowrap ${isHorizontal ? 'left-1 top-0' : 'top-1 left-0'}`}
               style={{ 
                 transform: !isHorizontal ? (isRight ? 'rotate(90deg)' : 'rotate(-90deg)') : undefined, 
                 transformOrigin: !isHorizontal ? (isRight ? 'top left' : 'top right') : undefined 
               }}
             >
               {cm / 100}m
             </span>
           )}
         </div>
       );
    }

    return (
      <div 
        className={`absolute bg-[#0f172a] border-slate-800/50 backdrop-blur-sm ${isHorizontal ? 'left-0 right-0 h-[22px]' : 'top-0 bottom-0 w-6'} z-30`}
        style={{ 
          top: isHorizontal && !isBottom ? 0 : undefined,
          bottom: isBottom ? 0 : undefined,
          left: !isHorizontal && !isRight ? 0 : undefined,
          right: isRight ? 0 : undefined,
          borderTopWidth: isBottom ? '1px' : 0,
          borderBottomWidth: (isHorizontal && !isBottom) ? '1px' : 0,
          borderLeftWidth: isRight ? '1px' : 0,
          borderRightWidth: (!isHorizontal && !isRight) ? '1px' : 0,
          borderStyle: 'solid'
        }}
      >
        {ticks}
      </div>
    );
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return;
    // Don't trigger stage click if we just finished a marquee selection
    if (Date.now() - lastMarqueeSelectionTime.current < 100) return;

    // Only deselect if we didn't just perform a marquee selection 
    const isStage = e.target === e.target.getStage();
    const isLockedFloor = rootVisual?.locked && (e.target.id() === rootVisual.id || e.target.name() === 'floor');
    
    if (isStage || isLockedFloor) {
      if (!e.evt.shiftKey) onSelectNodes([]);
    }
  };

  const cursorClass = useMemo(() => {
    if (isPanning) return 'cursor-grabbing';
    if (tool === 'pan') return 'cursor-grab';
    if (tool === 'select') return 'cursor-default';
    return 'cursor-default';
  }, [isPanning, tool]);

  return (
    <div ref={containerRef} className={`w-full h-full bg-[#020617] relative overflow-hidden ${cursorClass}`}>
      {/* HUD Rulers */}
      {showRulers && (
        <>
          <Ruler orientation="horizontal" />
          <Ruler orientation="horizontal-bottom" />
          <Ruler orientation="vertical" />
          <Ruler orientation="vertical-right" />
        </>
      )}

      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        draggable={false}
        onMouseDown={(e) => {
          if (e.evt.button === 0) {
            if (tool === 'pan') {
              setIsPanning(true);
              lastMousePos.current = { x: e.evt.clientX, y: e.evt.clientY };
            } else {
              handleBoxSelectionStart(e);
            }
          } else if (e.evt.button === 1) {
            e.evt.preventDefault();
            setIsPanning(true);
            lastMousePos.current = { x: e.evt.clientX, y: e.evt.clientY };
          }
        }}
        onMouseMove={(e) => {
          if (selectionRect) {
            handleBoxSelectionMove(e);
          } else if (isPanning && lastMousePos.current) {
            const dx = e.evt.clientX - lastMousePos.current.x;
            const dy = e.evt.clientY - lastMousePos.current.y;
            
            setPos(prev => ({
              x: prev.x + dx,
              y: prev.y + dy
            }));
            
            lastMousePos.current = { x: e.evt.clientX, y: e.evt.clientY };
          }
        }}
        onMouseUp={(e) => {
          if (selectionRect) {
            handleBoxSelectionEnd(e);
          }
          setIsPanning(false);
          lastMousePos.current = null;
        }}
        onMouseLeave={() => {
          setIsPanning(false);
          lastMousePos.current = null;
        }}
        onClick={handleStageClick}
        scaleX={zoomLevel}
        scaleY={zoomLevel}
        x={pos.x}
        y={pos.y}
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

            stage.scale({ x: newScale, y: newScale });
            const newPos = {
              x: pointer.x - mousePointTo.x * newScale,
              y: pointer.y - mousePointTo.y * newScale,
            };
            stage.position(newPos);
            setZoomLevel(newScale);
            setPos(newPos);
          }}
      >
        <Layer>
            {/* The Floor */}
            {rootVisual && (
                <Rect 
                  id={rootVisual.id}
                  name="floor"
                  x={0}
                  y={0}
                  width={rootVisual.width * scale}
                  height={(viewMode === ViewMode.TOP_DOWN ? rootVisual.depth : rootVisual.height) * scale}
                  fill={isSelected(rootVisual.id) || previewSelectedIds?.includes(rootVisual.id) ? "#1e293b" : "#111827"}
                  stroke={isSelected(rootVisual.id) || previewSelectedIds?.includes(rootVisual.id) ? (previewSelectedIds?.includes(rootVisual.id) ? "#38bdf8" : "#0ea5e9") : "#334155"}
                  strokeWidth={(isSelected(rootVisual.id) || previewSelectedIds?.includes(rootVisual.id)) ? (2 / zoomLevel) : (1 / zoomLevel)}
                  onClick={(e) => {
                    if (e.evt.button !== 0) return;
                    if (rootVisual.locked) return; // Prevent selection if locked
                    e.cancelBubble = true;
                    if (e.evt.shiftKey) {
                        onSelectNodes(isSelected(rootVisual.id) 
                          ? selectedNodeIds.filter(id => id !== rootVisual.id)
                          : [...selectedNodeIds, rootVisual.id]
                        );
                    } else {
                        onSelectNodes([rootVisual.id]);
                    }
                  }}
                />
            )}

            {/* Grid */}
            {gridLines}

            {/* Visual Objects */}
            {currentVisuals.map(v => (
                <Group 
                  key={v.id}
                  x={(v.x + v.width / 2) * scale}
                  y={(v.y + (viewMode === ViewMode.TOP_DOWN ? v.depth : v.height) / 2) * scale}
                  offsetX={(v.width * scale) / 2}
                  offsetY={((viewMode === ViewMode.TOP_DOWN ? v.depth : v.height) * scale) / 2}
                  rotation={v.rotation}
                  opacity={v.type === 'zone' ? (v.opacity ?? 1) : 1}
                  draggable={!v.locked}
                  dragBoundFunc={getDragBoundFunc(v.id)}
                  onDragStart={() => handleDragStart(v.id)}
                  onDragMove={(e) => handleDragMove(e, v.id)}
                  onDragEnd={(e) => handleDragEnd(e, v.id)}
                  onClick={(e) => {
                      if (e.evt.button !== 0) return;
                      if (v.locked) return; // Prevent selection of locked objects
                      e.cancelBubble = true;
                      if (e.evt.shiftKey) {
                          onSelectNodes(isSelected(v.id) 
                            ? selectedNodeIds.filter(id => id !== v.id)
                            : [...selectedNodeIds, v.id]
                          );
                      } else {
                          onSelectNodes([v.id]);
                      }
                  }}
                >
                    <Rect 
                      width={v.width * scale}
                      height={(viewMode === ViewMode.TOP_DOWN ? v.depth : v.height) * scale}
                      fill={v.type === 'zone' 
                        ? (isSelected(v.id) || previewSelectedIds?.includes(v.id)
                            ? `${v.color}${Math.round((v.primaryOpacity ?? 0.6) * 255).toString(16).padStart(2, '0')}` 
                            : `${v.color}${Math.round((v.primaryOpacity ?? 0.3) * 255).toString(16).padStart(2, '0')}`)
                        : (isSelected(v.id) || previewSelectedIds?.includes(v.id) ? (previewSelectedIds?.includes(v.id) ? "rgba(56, 189, 248, 0.2)" : "#0ea5e922") : "#1e293b")}
                      stroke={isSelected(v.id) || previewSelectedIds?.includes(v.id) ? (v.type === 'zone' ? v.color : (previewSelectedIds?.includes(v.id) ? "#38bdf8" : "#0ea5e9")) : (v.type === 'zone' ? `${v.color}44` : "#475569")}
                      strokeWidth={(isSelected(v.id) || previewSelectedIds?.includes(v.id)) ? (2 / zoomLevel) : (v.type === 'industrial' ? (2 / zoomLevel) : (1 / zoomLevel))}
                      cornerRadius={v.type === 'industrial' ? (0) : (2 / zoomLevel)}
                      dash={v.type === 'zone' ? [5 / zoomLevel, 5 / zoomLevel] : []}
                    />
                    
                    {/* Subtle selection/preview overlay for modern look */}
                    {(isSelected(v.id) || previewSelectedIds?.includes(v.id)) && (
                      <Rect 
                        width={v.width * scale}
                        height={(viewMode === ViewMode.TOP_DOWN ? v.depth : v.height) * scale}
                        fill={previewSelectedIds?.includes(v.id) ? "rgba(14, 165, 233, 0.15)" : "rgba(14, 165, 233, 0.05)"}
                        cornerRadius={v.type === 'industrial' ? 0 : 2 / zoomLevel}
                        listening={false}
                      />
                    )}
                    
                    {v.type === 'zone' && <ZonePatternLayer node={v} />}

                    {v.type === 'industrial' && (
                       <Rect 
                         width={v.width * scale}
                         height={(viewMode === ViewMode.TOP_DOWN ? v.depth : v.height) * scale}
                         fill="transparent"
                         stroke={isSelected(v.id) ? "#38bdf8" : "#94a3b8"}
                         strokeWidth={0.5 / zoomLevel}
                         opacity={0.3}
                       />
                    )}
                    
                    {/* Front Side Indicator */}
                    {v.frontSide && (
                      <Line 
                        points={
                          v.frontSide === 'top' ? [0, 0, v.width * scale, 0] :
                          v.frontSide === 'bottom' ? [0, v.depth * scale, v.width * scale, v.depth * scale] :
                          v.frontSide === 'left' ? [0, 0, 0, v.depth * scale] :
                          v.frontSide === 'right' ? [v.width * scale, 0, v.width * scale, v.depth * scale] :
                          []
                        }
                        stroke="#38bdf8"
                        strokeWidth={4 / zoomLevel}
                        lineCap="round"
                        opacity={0.8}
                      />
                    )}

                    <Text 
                       text={v.label}
                       fontSize={10 / zoomLevel}
                       fill={isSelected(v.id) ? "#7dd3fc" : "#94a3b8"}
                       y={(viewMode === ViewMode.TOP_DOWN ? v.depth : v.height) * scale + (4 / zoomLevel)}
                       width={v.width * scale}
                       align="center"
                       fontStyle="bold"
                    />
                </Group>
            ))}

            {/* Selection Rectangle */}
            {selectionRect && (
                <Rect 
                  x={Math.min(selectionRect.x1, selectionRect.x2)}
                  y={Math.min(selectionRect.y1, selectionRect.y2)}
                  width={Math.abs(selectionRect.x1 - selectionRect.x2)}
                  height={Math.abs(selectionRect.y1 - selectionRect.y2)}
                  fill="rgba(14, 165, 233, 0.1)"
                  stroke="#0ea5e9"
                  strokeWidth={1 / zoomLevel}
                  dash={selectionRect.mode === 'enclose' ? [] : [4 / zoomLevel, 2 / zoomLevel]}
                />
            )}
        </Layer>
      </Stage>
    </div>
  );
}
