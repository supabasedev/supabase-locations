/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Layout, VisualNode, LogicalLocation } from '../types';

export interface WorkspaceExportDataV1 {
  schemaVersion: 'ambra-workspace-export-v1';
  exportedAt: string;
  source: {
    workspaceId: string;
    workspaceName: string;
    branchId: string;
    appUnit: string;
  };
  layout: Layout;
  visuals: VisualNode[];
  referencedLocations: {
    id: string;
    code: string;
    name: string;
    parentId: string | null;
    locationType: string;
  }[];
}

export interface WorkspaceExportDataV2 {
  schemaVersion: 'ambra-workspace-export-v2';
  exportedAt: string;
  source: {
    workspaceId: string;
    workspaceName: string;
    branchId: string;
    appUnit: string;
  };
  layout: {
    id: string;
    branchId: string;
    rootLocationId: string | null;
    name: string;
    status: string;
    lastEdited: string;
    baseSurface: {
      sourceVisualId: string;
      type: string;
      label: string;
      width: number;
      depth: number;
      height: number;
      style: {
        fill: string;
        [key: string]: any;
      };
      [key: string]: any;
    };
  };
  locations: {
    id: string;
    code: string;
    name: string;
    parentId: string | null;
    locationCategory: string;
  }[];
  visualNodes: {
    id: string;
    sourceId: string;
    layoutId: string;
    locationId: string | null;
    visualizationType: string;
    label: string;
    x: number;
    y: number;
    z: number;
    rotation: number;
    width: number;
    height: number;
    depth: number;
    style: {
      fill: string;
      [key: string]: any;
    };
    viewType: string;
    parentVisualNodeId: string | null;
    supportsFrontView?: boolean;
    supportsInteriorView?: boolean;
    front?: {
      isConfigured: boolean;
      frontSide: string;
      frontViewId: string;
    };
    [key: string]: any;
  }[];
  frontViews: {
    id: string;
    sourceVisualId: string;
    visualNodeId: string;
    layoutId: string;
    frontSide: string;
    style: {
      cornerRadiusTopLeft?: number;
      cornerRadiusTopRight?: number;
      cornerRadiusBottomRight?: number;
      cornerRadiusBottomLeft?: number;
      isCornerRadiusLocked?: boolean;
      [key: string]: any;
    };
    root: any; // StructureNode but normalized
  }[];
  metadata: {
    counts: {
      visualNodes: number;
      baseSurface: number;
      frontViews: number;
      frontCells: number;
      dividers: number;
      frames: number;
      linkedLocations: number;
      visualOnlyObjects: number;
    };
    dimensionSemantics: {
      top_down: {
        horizontalAxis: string;
        verticalAxis: string;
        renderWidthField: string;
        renderDepthField: string;
        physicalHeightField: string;
      };
      front: {
        horizontalAxis: string;
        verticalAxis: string;
        renderWidthField: string;
        renderHeightField: string;
        physicalDepthField: string;
      };
    };
    notes?: string[];
  };
}

export type WorkspaceExportData = WorkspaceExportDataV1 | WorkspaceExportDataV2;

export function serializeWorkspaceData(
  layout: Layout,
  visuals: VisualNode[],
  locations: LogicalLocation[]
): WorkspaceExportDataV2 {
  const layoutVisuals = visuals.filter(v => v.layoutId === layout.id);
  
  // Find base surface (the root node with parentId === null)
  const floorNode = layoutVisuals.find(v => v.parentId === null) || layoutVisuals[0];
  const otherVisuals = layoutVisuals.filter(v => v.id !== floorNode.id);
  
  // Find all location IDs referenced in these visuals
  const referencedLocationIds = new Set<string>();
  const collectLocationIds = (node: any) => {
    if (node.locationId) referencedLocationIds.add(node.locationId);
    if (node.structure) {
      const traverseStructure = (sNode: any) => {
        if (sNode.locationId) referencedLocationIds.add(sNode.locationId);
        if (sNode.children) {
          sNode.children.forEach(traverseStructure);
        }
      };
      traverseStructure(node.structure);
    }
  };
  layoutVisuals.forEach(collectLocationIds);
  
  const referencedLocations = locations
    .filter(l => referencedLocationIds.has(l.id))
    .map(l => ({
      id: l.id,
      code: l.code,
      name: l.name,
      parentId: l.parentId,
      locationCategory: l.locationType
    }));

  const frontViews: WorkspaceExportDataV2['frontViews'] = [];
  const counts = {
    visualNodes: 0,
    baseSurface: 1,
    frontViews: 0,
    frontCells: 0,
    dividers: 0,
    frames: 0,
    linkedLocations: referencedLocationIds.size,
    visualOnlyObjects: 0
  };

  const normalizeStructure = (sNode: any): any => {
    counts.frontCells++;
    if (sNode.dividers) {
      counts.dividers += sNode.dividers.filter((d: any) => d !== null).length;
    }
    if (sNode.frame) {
      if (sNode.frame.top) counts.frames++;
      if (sNode.frame.bottom) counts.frames++;
      if (sNode.frame.left) counts.frames++;
      if (sNode.frame.right) counts.frames++;
    }

    return {
      id: sNode.id,
      nodeKind: sNode.type,
      splitDirection: sNode.split,
      splitType: sNode.splitType,
      sizeMode: "ratio",
      sizeValue: sNode.size,
      label: sNode.label,
      displayLabel: sNode.displayLabel,
      locationId: sNode.locationId,
      color: sNode.color,
      skin: sNode.skin,
      locked: sNode.locked,
      dividers: sNode.dividers?.map((d: any) => d ? {
        id: d.id,
        dividerType: d.type,
        thickness: d.thickness,
        material: d.material,
        style: { fill: d.color, opacity: d.opacity, lineStyle: d.lineStyle },
        locked: d.locked,
        label: d.label
      } : null),
      frame: sNode.frame ? {
        top: sNode.frame.top ? { id: sNode.frame.top.id, dividerType: sNode.frame.top.type, thickness: sNode.frame.top.thickness, style: { fill: sNode.frame.top.color } } : undefined,
        bottom: sNode.frame.bottom ? { id: sNode.frame.bottom.id, dividerType: sNode.frame.bottom.type, thickness: sNode.frame.bottom.thickness, style: { fill: sNode.frame.bottom.color } } : undefined,
        left: sNode.frame.left ? { id: sNode.frame.left.id, dividerType: sNode.frame.left.type, thickness: sNode.frame.left.thickness, style: { fill: sNode.frame.left.color } } : undefined,
        right: sNode.frame.right ? { id: sNode.frame.right.id, dividerType: sNode.frame.right.type, thickness: sNode.frame.right.thickness, style: { fill: sNode.frame.right.color } } : undefined,
      } : undefined,
      children: sNode.children?.map(normalizeStructure)
    };
  };

  const normalizedVisuals = otherVisuals.map(v => {
    counts.visualNodes++;
    if (!v.locationId) counts.visualOnlyObjects++;
    if (v.supportsFrontView && v.structure) {
      counts.frontViews++;
      const fvId = `front-${v.id}`;
      frontViews.push({
        id: fvId,
        sourceVisualId: v.id,
        visualNodeId: v.id,
        layoutId: layout.id,
        frontSide: v.frontSide || 'bottom',
        style: v.style || {},
        root: normalizeStructure(v.structure)
      });
      
      return {
        ...mapVisualToV2(v, floorNode.id),
        front: {
          isConfigured: true,
          frontSide: v.frontSide || 'bottom',
          frontViewId: fvId
        }
      };
    }
    return mapVisualToV2(v, floorNode.id);
  });

  return {
    schemaVersion: 'ambra-workspace-export-v2',
    exportedAt: new Date().toISOString(),
    source: {
      workspaceId: layout.id,
      workspaceName: layout.name,
      branchId: layout.branchId,
      appUnit: 'cm'
    },
    layout: {
      id: layout.id,
      branchId: layout.branchId,
      rootLocationId: floorNode.locationId,
      name: layout.name,
      status: layout.status,
      lastEdited: layout.lastEdited,
      baseSurface: {
        sourceVisualId: floorNode.id,
        type: 'floor',
        label: floorNode.label,
        width: floorNode.width,
        depth: floorNode.depth,
        height: floorNode.height,
        style: { fill: floorNode.color }
      }
    },
    locations: referencedLocations,
    visualNodes: normalizedVisuals,
    frontViews: frontViews,
    metadata: {
      counts,
      dimensionSemantics: {
        top_down: {
          horizontalAxis: "x",
          verticalAxis: "y",
          renderWidthField: "width",
          renderDepthField: "depth",
          physicalHeightField: "height"
        },
        front: {
          horizontalAxis: "x",
          verticalAxis: "z",
          renderWidthField: "width",
          renderHeightField: "height",
          physicalDepthField: "depth"
        }
      }
    }
  };
}

function mapVisualToV2(v: VisualNode, floorId: string): any {
  // If parentId pointed to floor, set parentVisualNodeId to null in export.
  const parentId = v.parentId === floorId ? null : v.parentId;
  
  return {
    id: v.id,
    sourceId: v.id,
    layoutId: v.layoutId,
    locationId: v.locationId,
    visualizationType: v.type,
    label: v.label,
    x: v.x,
    y: v.y,
    z: v.z,
    rotation: v.rotation,
    width: v.width,
    height: v.height,
    depth: v.depth,
    style: { fill: v.color, ...(v.style || {}) },
    viewType: v.viewMode,
    parentVisualNodeId: parentId,
    supportsFrontView: v.supportsFrontView,
    supportsInteriorView: v.supportsInteriorView,
    zoneType: v.zoneType,
    zonePattern: v.zonePattern
  };
}

export interface WorkspaceSummary {
  workspaceName: string;
  topViewObjectsCount: number;
  frontViewsCount: number;
  splitNodesCount: number;
  dividersCount: number;
  locationLinksCount: number;
  unresolvedLocationLinksCount: number;
  unit: string;
  // V2 specific
  baseSurfaceCount?: number;
  framesCount?: number;
  visualOnlyCount?: number;
}

export function summarizeWorkspaceData(
  data: WorkspaceExportData,
  currentLocations: LogicalLocation[]
): WorkspaceSummary {
  if (data.schemaVersion === 'ambra-workspace-export-v2') {
    const counts = data.metadata.counts;
    return {
      workspaceName: data.layout.name,
      topViewObjectsCount: counts.visualNodes,
      frontViewsCount: counts.frontViews,
      splitNodesCount: counts.frontCells,
      dividersCount: counts.dividers,
      locationLinksCount: counts.linkedLocations,
      unresolvedLocationLinksCount: counts.linkedLocations, 
      unit: data.source.appUnit,
      baseSurfaceCount: counts.baseSurface,
      framesCount: counts.frames,
      visualOnlyCount: counts.visualOnlyObjects
    };
  }

  // Fallback for V1
  let frontViewsCount = 0;
  let splitNodesCount = 0;
  let dividersCount = 0;
  let locationLinksCount = 0;
  
  const currentLocationIds = new Set(currentLocations.map(l => l.id));
  const unresolvedLocationLinks = new Set<string>();

  const processLocationId = (id: string | null | undefined) => {
    if (!id) return;
    locationLinksCount++;
    if (!currentLocationIds.has(id)) {
      unresolvedLocationLinks.add(id);
    }
  };

  const traverseStructure = (sNode: any) => {
    splitNodesCount++;
    processLocationId(sNode.locationId);
    if (sNode.dividers) {
      dividersCount += sNode.dividers.filter((d: any) => d !== null).length;
    }
    if (sNode.children) {
      sNode.children.forEach(traverseStructure);
    }
  };

  const v1Data = data as WorkspaceExportDataV1;
  v1Data.visuals.forEach(v => {
    processLocationId(v.locationId);
    if (v.supportsFrontView && v.structure) {
      frontViewsCount++;
      traverseStructure(v.structure);
    }
  });

  return {
    workspaceName: v1Data.layout.name,
    topViewObjectsCount: v1Data.visuals.length,
    frontViewsCount,
    splitNodesCount,
    dividersCount,
    locationLinksCount,
    unresolvedLocationLinksCount: unresolvedLocationLinks.size,
    unit: v1Data.source.appUnit
  };
}

export function validateWorkspaceImport(jsonStr: string): { valid: boolean; error?: string; data?: WorkspaceExportData } {
  try {
    const data = JSON.parse(jsonStr) as WorkspaceExportData;
    
    if (data.schemaVersion === 'ambra-workspace-export-v2') {
      if (!data.layout || !data.layout.baseSurface) return { valid: false, error: 'Missing layout or baseSurface' };
      if (!Array.isArray(data.visualNodes)) return { valid: false, error: 'visualNodes must be an array' };
      if (!Array.isArray(data.frontViews)) return { valid: false, error: 'frontViews must be an array' };
      return { valid: true, data };
    }
    
    if (data.schemaVersion === 'ambra-workspace-export-v1') {
      if (!data.layout || !data.visuals || !Array.isArray(data.visuals)) {
        return { valid: false, error: 'Missing core workspace data' };
      }
      return { valid: true, data };
    }
    
    return { valid: false, error: 'Invalid schema version' };
  } catch (e) {
    return { valid: false, error: 'Invalid JSON format' };
  }
}

export function prepareImportData(
  data: WorkspaceExportData,
  targetLayoutId: string
): VisualNode[] {
  if (data.schemaVersion === 'ambra-workspace-export-v1') {
    return prepareImportFromV1(data, targetLayoutId);
  }
  return prepareImportFromV2(data as WorkspaceExportDataV2, targetLayoutId);
}

function prepareImportFromV1(data: WorkspaceExportDataV1, targetLayoutId: string): VisualNode[] {
  const oldToNewIdMap = new Map<string, string>();
  data.visuals.forEach(v => {
    oldToNewIdMap.set(v.id, `v-imp-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`);
  });

  return data.visuals.map(v => {
    const newId = oldToNewIdMap.get(v.id)!;
    const newParentId = v.parentId ? (oldToNewIdMap.get(v.parentId) || null) : null;
    
    const newNode: VisualNode = {
      ...v,
      id: newId,
      layoutId: targetLayoutId,
      parentId: newParentId,
    };
    if (newNode.structure) newNode.structure = remapStructureNodeIds(newNode.structure);
    return newNode;
  });
}

function prepareImportFromV2(data: WorkspaceExportDataV2, targetLayoutId: string): VisualNode[] {
  const oldToNewIdMap = new Map<string, string>();
  
  // Base Surface (Floor)
  const floorId = `v-imp-floor-${targetLayoutId}-${Date.now()}`;
  oldToNewIdMap.set(data.layout.baseSurface.sourceVisualId, floorId);
  
  const floorNode: VisualNode = {
    id: floorId,
    layoutId: targetLayoutId,
    locationId: data.layout.rootLocationId,
    type: 'rectangle', // Fallback to rectangle as it's the standard for floors in mock
    label: data.layout.baseSurface.label,
    x: 0,
    y: 0,
    z: 0,
    rotation: 0,
    width: data.layout.baseSurface.width,
    height: data.layout.baseSurface.height,
    depth: data.layout.baseSurface.depth,
    color: data.layout.baseSurface.style.fill,
    viewMode: 'top-down' as any,
    parentId: null
  };

  // Visual Nodes
  data.visualNodes.forEach(v => {
    oldToNewIdMap.set(v.sourceId, `v-imp-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`);
  });

  const imports = data.visualNodes.map(v => {
    const newId = oldToNewIdMap.get(v.sourceId)!;
    let newParentId = v.parentVisualNodeId ? (oldToNewIdMap.get(v.parentVisualNodeId) || null) : floorId;

    const vNode: VisualNode = {
      id: newId,
      layoutId: targetLayoutId,
      locationId: v.locationId,
      type: v.visualizationType as any,
      label: v.label,
      x: v.x,
      y: v.y,
      z: v.z,
      rotation: v.rotation,
      width: v.width,
      height: v.height,
      depth: v.depth,
      color: v.style.fill,
      viewMode: v.viewType as any,
      parentId: newParentId,
      supportsFrontView: v.supportsFrontView,
      supportsInteriorView: v.supportsInteriorView,
      style: {
        cornerRadiusTopLeft: v.style?.cornerRadiusTopLeft,
        cornerRadiusTopRight: v.style?.cornerRadiusTopRight,
        cornerRadiusBottomRight: v.style?.cornerRadiusBottomRight,
        cornerRadiusBottomLeft: v.style?.cornerRadiusBottomLeft,
        isCornerRadiusLocked: v.style?.isCornerRadiusLocked,
      },
      zoneType: v.zoneType,
      zonePattern: v.zonePattern
    };

    if (v.front && v.front.isConfigured) {
      const fv = data.frontViews.find(f => f.id === v.front!.frontViewId);
      if (fv) {
        vNode.frontSide = fv.frontSide as any;
        vNode.structure = denormalizeStructure(fv.root);
        vNode.frontSetupDone = true;
      }
    }

    return vNode;
  });

  return [floorNode, ...imports];
}

function denormalizeStructure(sNode: any): any {
  const newNode = {
    id: `s-imp-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
    type: sNode.nodeKind,
    split: sNode.splitDirection,
    splitType: sNode.splitType,
    size: sNode.sizeValue,
    label: sNode.label,
    displayLabel: sNode.displayLabel,
    locationId: sNode.locationId,
    color: sNode.color,
    skin: sNode.skin,
    locked: sNode.locked,
    dividers: sNode.dividers?.map((d: any) => d ? {
      id: d.id,
      type: d.dividerType,
      thickness: d.thickness,
      material: d.material,
      color: d.style?.fill,
      opacity: d.style?.opacity,
      lineStyle: d.style?.lineStyle,
      locked: d.locked,
      label: d.label
    } : null),
    frame: sNode.frame ? {
      top: sNode.frame.top ? { id: sNode.frame.top.id, type: sNode.frame.top.dividerType, thickness: sNode.frame.top.thickness, color: sNode.frame.top.style?.fill } : undefined,
      bottom: sNode.frame.bottom ? { id: sNode.frame.bottom.id, type: sNode.frame.bottom.dividerType, thickness: sNode.frame.bottom.thickness, color: sNode.frame.bottom.style?.fill } : undefined,
      left: sNode.frame.left ? { id: sNode.frame.left.id, type: sNode.frame.left.dividerType, thickness: sNode.frame.left.thickness, color: sNode.frame.left.style?.fill } : undefined,
      right: sNode.frame.right ? { id: sNode.frame.right.id, type: sNode.frame.right.dividerType, thickness: sNode.frame.right.thickness, color: sNode.frame.right.style?.fill } : undefined,
    } : undefined,
    children: sNode.children?.map(denormalizeStructure)
  };
  return newNode;
}

function remapStructureNodeIds(node: any): any {
  const newNode = { ...node, id: `s-imp-${Math.random().toString(36).substr(2, 9)}-${Date.now()}` };
  
  if (newNode.dividers) {
    newNode.dividers = newNode.dividers.map((d: any) => {
      if (!d) return d;
      return { ...d, id: `d-imp-${Math.random().toString(36).substr(2, 9)}-${Date.now()}` };
    });
  }
  
  if (newNode.frame) {
    const newFrame: any = {};
    if (newNode.frame.top) newFrame.top = { ...newNode.frame.top, id: `d-imp-${Math.random().toString(36).substr(2, 9)}-${Date.now()}` };
    if (newNode.frame.bottom) newFrame.bottom = { ...newNode.frame.bottom, id: `d-imp-${Math.random().toString(36).substr(2, 9)}-${Date.now()}` };
    if (newNode.frame.left) newFrame.left = { ...newNode.frame.left, id: `d-imp-${Math.random().toString(36).substr(2, 9)}-${Date.now()}` };
    if (newNode.frame.right) newFrame.right = { ...newNode.frame.right, id: `d-imp-${Math.random().toString(36).substr(2, 9)}-${Date.now()}` };
    newNode.frame = newFrame;
  }

  if (newNode.children) {
    newNode.children = newNode.children.map(remapStructureNodeIds);
  }
  
  return newNode;
}
