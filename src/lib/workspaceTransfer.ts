/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Layout, VisualNode, LogicalLocation } from '../types';

export interface WorkspaceExportData {
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

export function serializeWorkspaceData(
  layout: Layout,
  visuals: VisualNode[],
  locations: LogicalLocation[]
): WorkspaceExportData {
  const layoutVisuals = visuals.filter(v => v.layoutId === layout.id);
  
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
      locationType: l.locationType
    }));

  return {
    schemaVersion: 'ambra-workspace-export-v1',
    exportedAt: new Date().toISOString(),
    source: {
      workspaceId: layout.id,
      workspaceName: layout.name,
      branchId: layout.branchId,
      appUnit: 'cm' // The app currently uses cm (verified in types.ts and App.tsx)
    },
    layout: { ...layout },
    visuals: layoutVisuals.map(v => ({ ...v })),
    referencedLocations
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
}

export function summarizeWorkspaceData(
  data: WorkspaceExportData,
  currentLocations: LogicalLocation[]
): WorkspaceSummary {
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

  data.visuals.forEach(v => {
    processLocationId(v.locationId);
    if (v.supportsFrontView && v.structure) {
      frontViewsCount++;
      traverseStructure(v.structure);
    }
  });

  return {
    workspaceName: data.layout.name,
    topViewObjectsCount: data.visuals.length,
    frontViewsCount,
    splitNodesCount,
    dividersCount,
    locationLinksCount,
    unresolvedLocationLinksCount: unresolvedLocationLinks.size,
    unit: data.source.appUnit
  };
}

export function validateWorkspaceImport(jsonStr: string): { valid: boolean; error?: string; data?: WorkspaceExportData } {
  try {
    const data = JSON.parse(jsonStr) as WorkspaceExportData;
    
    if (data.schemaVersion !== 'ambra-workspace-export-v1') {
      return { valid: false, error: 'Invalid schema version' };
    }
    
    if (!data.layout || !data.visuals || !Array.isArray(data.visuals)) {
      return { valid: false, error: 'Missing core workspace data' };
    }
    
    // Basic validation of visuals
    for (const v of data.visuals) {
      if (typeof v.id !== 'string' || typeof v.x !== 'number' || typeof v.width !== 'number') {
        return { valid: false, error: `Invalid data in visual object: ${v.id || 'unknown'}` };
      }
    }
    
    return { valid: true, data };
  } catch (e) {
    return { valid: false, error: 'Invalid JSON format' };
  }
}

export function prepareImportData(
  data: WorkspaceExportData,
  targetLayoutId: string
): VisualNode[] {
  const oldToNewIdMap = new Map<string, string>();
  
  // First pass: generate new IDs for all visuals
  data.visuals.forEach(v => {
    oldToNewIdMap.set(v.id, `v-imp-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`);
  });

  // Second pass: map visuals with new IDs and update parent/layout references
  return data.visuals.map(v => {
    const newId = oldToNewIdMap.get(v.id)!;
    const newParentId = v.parentId ? (oldToNewIdMap.get(v.parentId) || null) : null;
    
    const newNode: VisualNode = {
      ...v,
      id: newId,
      layoutId: targetLayoutId,
      parentId: newParentId,
    };

    // We also need to regenerate IDs inside the structure if we want total safety,
    // but StructureNode IDs (cells) are mostly local to the visual.
    // However, if the app tracks them globally, we should remap them too.
    // Looking at the code, cell IDs are used for selection.
    
    if (newNode.structure) {
      newNode.structure = remapStructureNodeIds(newNode.structure);
    }

    return newNode;
  });
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
