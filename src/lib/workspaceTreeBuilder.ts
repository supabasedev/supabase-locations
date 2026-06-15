/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogicalLocation, VisualNode, StructureNode } from '../types';

export type WorkspaceTreeNodeState =
  | 'location_only'            // Unmapped location
  | 'location_with_top_visual'   // Mapped to top-down visual node
  | 'location_with_front_visual' // Mapped to front-view cell/structure node
  | 'generated_visual_only'     // Visual structure node exists, but no locationId yet
  | 'context_visual'           // Context objects
  | 'broken_mapping'           // points to missing/deleted location
  | 'duplicate_mapping'         // points to location mapped multiple times
  | 'out_of_root';             // points to valid location outside root subtree scope

export interface WorkspaceTreeNode {
  id: string; // Unique ID (location.id, visual.id, or structure.id)
  parentId: string | null;
  label: string;
  code?: string;
  type: 'location' | 'visual' | 'structure';
  state: WorkspaceTreeNodeState;
  
  location: LogicalLocation | null;
  
  visual: {
    topDownVisualNode?: VisualNode;
    frontStructureNode?: StructureNode;
    generatedVisualNode?: VisualNode | StructureNode;
    mappingType: 'top_down' | 'front_cell' | 'generated' | 'none';
  } | null;
  
  children: WorkspaceTreeNode[];
  depth: number;
  locked?: boolean;
}

export interface WorkspaceTreeOutput {
  workspaceTree: WorkspaceTreeNode[];        // Rooted at layout.rootLocationId (including descendants)
  unlinkedStorageTree: WorkspaceTreeNode[];   // Storage visual items with locationId === null
  contextObjects: WorkspaceTreeNode[];         // Non-storage context visual items with locationId === null
  brokenOrOutOfScope: WorkspaceTreeNode[];    // Group of broken or out-of-root nodes
}

export interface StructureMapping {
  parentVisual: VisualNode;
  structureNode: StructureNode;
}

/**
 * Scan structure nodes recursively to collect maps of locationId -> { parentVisual, structureNode }
 */
export function scanStructureMappings(visuals: VisualNode[]): Map<string, StructureMapping[]> {
  const map = new Map<string, StructureMapping[]>();
  
  const scan = (v: VisualNode, sn: StructureNode) => {
    if (sn.locationId) {
      if (!map.has(sn.locationId)) {
        map.set(sn.locationId, []);
      }
      map.get(sn.locationId)!.push({ parentVisual: v, structureNode: sn });
    }
    if (sn.children) {
      sn.children.forEach(child => scan(v, child));
    }
  };

  visuals.forEach(v => {
    if (v.structure) {
      scan(v, v.structure);
    }
  });

  return map;
}

/**
 * Builds physical unlinked / generated cell representations recursively.
 */
function buildUnlinkedStructureSubtree(
  sn: StructureNode,
  parentVisual: VisualNode,
  depth: number,
  activeLocationsMap: Map<string, LogicalLocation>,
  structureMappings: Map<string, StructureMapping[]>
): WorkspaceTreeNode | null {
  // If it's linked to an active location that exists, it will be rendered as a location node.
  if (sn.locationId && activeLocationsMap.has(sn.locationId)) {
    return null; 
  }

  let state: WorkspaceTreeNodeState = 'generated_visual_only';
  if (sn.locationId && !activeLocationsMap.has(sn.locationId)) {
    state = 'broken_mapping';
  }

  // Build recursive unlinked descendants
  const childNodes: WorkspaceTreeNode[] = [];
  if (sn.children) {
    sn.children.forEach(child => {
      const childNode = buildUnlinkedStructureSubtree(child, parentVisual, depth + 1, activeLocationsMap, structureMappings);
      if (childNode) childNodes.push(childNode);
    });
  }

  return {
    id: sn.id,
    parentId: null,
    label: sn.label || sn.displayLabel || `Cell ${sn.id}`,
    code: sn.displayLabel || undefined,
    type: 'structure',
    state,
    location: null,
    visual: {
      frontStructureNode: sn,
      topDownVisualNode: parentVisual,
      generatedVisualNode: sn,
      mappingType: 'generated'
    },
    children: childNodes,
    depth,
    locked: sn.locked
  };
}

/**
 * Build semantic-spatial logical tree recursively.
 */
function buildLocationSubtree(
  loc: LogicalLocation,
  activeLocationsMap: Map<string, LogicalLocation>,
  childrenMap: Map<string, LogicalLocation[]>,
  visuals: VisualNode[],
  structureMappings: Map<string, StructureMapping[]>,
  depth: number
): WorkspaceTreeNode {
  const topDownVisuals = visuals.filter(v => v.locationId === loc.id);
  const structureVisuals = structureMappings.get(loc.id) || [];
  const totalMappings = topDownVisuals.length + structureVisuals.length;

  let state: WorkspaceTreeNodeState = 'location_only';
  let mappingType: 'top_down' | 'front_cell' | 'generated' | 'none' = 'none';
  let topDownVisualNode: VisualNode | undefined;
  let frontStructureNode: StructureNode | undefined;

  if (totalMappings > 1) {
    state = 'duplicate_mapping';
    // Duplicate mapping fallback
    if (topDownVisuals.length > 0) {
      topDownVisualNode = topDownVisuals[0];
      mappingType = 'top_down';
    } else if (structureVisuals.length > 0) {
      frontStructureNode = structureVisuals[0].structureNode;
      topDownVisualNode = structureVisuals[0].parentVisual;
      mappingType = 'front_cell';
    }
  } else if (topDownVisuals.length === 1) {
    topDownVisualNode = topDownVisuals[0];
    mappingType = 'top_down';
    state = 'location_with_top_visual';
  } else if (structureVisuals.length === 1) {
    frontStructureNode = structureVisuals[0].structureNode;
    topDownVisualNode = structureVisuals[0].parentVisual;
    mappingType = 'front_cell';
    state = 'location_with_front_visual';
  }

  // 1. Child location subtrees from the logical hierarchy
  const childLocs = childrenMap.get(loc.id) || [];
  const childNodes = childLocs.map(cl => 
    buildLocationSubtree(cl, activeLocationsMap, childrenMap, visuals, structureMappings, depth + 1)
  );

  // 2. Unlinked front cell structure children nested under this paired node
  const nestedUnlinkedStructures: WorkspaceTreeNode[] = [];
  if (mappingType === 'top_down' && topDownVisualNode?.structure) {
    // If we map top-down here and this node defines a front structure, look for unlinked cells
    const rootChildren = topDownVisualNode.structure.children || [];
    rootChildren.forEach(csn => {
      const childNode = buildUnlinkedStructureSubtree(csn, topDownVisualNode!, depth + 1, activeLocationsMap, structureMappings);
      if (childNode) {
        nestedUnlinkedStructures.push(childNode);
      }
    });
  } else if (mappingType === 'front_cell' && frontStructureNode) {
    // If we are mapped to a specific front structure cell, scan any of its nested children that are unlinked
    const subChildren = frontStructureNode.children || [];
    subChildren.forEach(csn => {
      const childNode = buildUnlinkedStructureSubtree(csn, topDownVisualNode || (visuals.find(v => v.structure && v.id === topDownVisualNode?.id) as any), depth + 1, activeLocationsMap, structureMappings);
      if (childNode) {
        nestedUnlinkedStructures.push(childNode);
      }
    });
  }

  return {
    id: loc.id,
    parentId: loc.parentId,
    label: loc.name,
    code: loc.code,
    type: 'location',
    state,
    location: loc,
    visual: {
      topDownVisualNode,
      frontStructureNode,
      mappingType
    },
    children: [...childNodes, ...nestedUnlinkedStructures],
    depth,
    locked: topDownVisualNode?.locked || frontStructureNode?.locked
  };
}

/**
 * Main semantic workspace tree compiler.
 */
export function buildWorkspaceSemanticTree({
  rootLocationId,
  locations,
  visuals
}: {
  rootLocationId: string | null | undefined;
  locations: LogicalLocation[];
  visuals: VisualNode[];
}): WorkspaceTreeOutput {
  const activeLocations = locations.filter(l => l.status !== 'archived' && !l.deletedAt);
  const activeLocationsMap = new Map<string, LogicalLocation>();
  const childrenMap = new Map<string, LogicalLocation[]>();

  activeLocations.forEach(l => {
    activeLocationsMap.set(l.id, l);
    if (l.parentId) {
      if (!childrenMap.has(l.parentId)) {
        childrenMap.set(l.parentId, []);
      }
      childrenMap.get(l.parentId)!.push(l);
    }
  });

  const structureMappings = scanStructureMappings(visuals);

  // Compile active descendants scope
  let primaryRoots: LogicalLocation[] = [];
  const scopeSet = new Set<string>();

  const gatherDescendants = (id: string) => {
    scopeSet.add(id);
    const kids = childrenMap.get(id) || [];
    kids.forEach(k => {
      if (!scopeSet.has(k.id)) {
        gatherDescendants(k.id);
      }
    });
  };

  if (rootLocationId && activeLocationsMap.has(rootLocationId)) {
    const rootLoc = activeLocationsMap.get(rootLocationId)!;
    primaryRoots = [rootLoc];
    gatherDescendants(rootLocationId);
  } else {
    // Collect top-most locations (no parent) and scope them
    primaryRoots = activeLocations.filter(l => !l.parentId);
    primaryRoots.forEach(rootLoc => {
      gatherDescendants(rootLoc.id);
    });
  }

  // --- 1. Paired Semantic-Spatial Tree ---
  const workspaceTree = primaryRoots.map(rl => 
    buildLocationSubtree(rl, activeLocationsMap, childrenMap, visuals, structureMappings, 0)
  );

  // --- 2. Unlinked Visual Candidates ---
  const unlinkedStorageTree: WorkspaceTreeNode[] = [];
  visuals.forEach(v => {
    if (!v.locationId && v.nodeRole === 'unassigned_storage') {
      const childrenNodes: WorkspaceTreeNode[] = [];
      if (v.structure) {
        const rootKids = v.structure.children || [];
        rootKids.forEach(csn => {
          const sNode = buildUnlinkedStructureSubtree(csn, v, 1, activeLocationsMap, structureMappings);
          if (sNode) childrenNodes.push(sNode);
        });
      }
      
      unlinkedStorageTree.push({
        id: v.id,
        parentId: null,
        label: v.label,
        type: 'visual',
        state: 'generated_visual_only',
        location: null,
        visual: {
          topDownVisualNode: v,
          generatedVisualNode: v,
          mappingType: 'generated'
        },
        children: childrenNodes,
        depth: 0,
        locked: v.locked
      });
    }
  });

  // --- 3. Context Objects ---
  const contextObjects: WorkspaceTreeNode[] = [];
  visuals.forEach(v => {
    if (!v.locationId && v.nodeRole !== 'unassigned_storage') {
      contextObjects.push({
        id: v.id,
        parentId: null,
        label: v.label,
        type: 'visual',
        state: 'context_visual',
        location: null,
        visual: {
          topDownVisualNode: v,
          mappingType: 'none'
        },
        children: [],
        depth: 0,
        locked: v.locked
      });
    }
  });

  // --- 4. Broken or Out-of-Scope Mappings ---
  const brokenOrOutOfScope: WorkspaceTreeNode[] = [];
  visuals.forEach(v => {
    if (v.locationId) {
      if (!activeLocationsMap.has(v.locationId)) {
        brokenOrOutOfScope.push({
          id: `broken-top-${v.id}`,
          parentId: null,
          label: v.label,
          type: 'visual',
          state: 'broken_mapping',
          location: null,
          visual: {
            topDownVisualNode: v,
            mappingType: 'top_down'
          },
          children: [],
          depth: 0,
          locked: v.locked
        });
      } else if (!scopeSet.has(v.locationId)) {
        const loc = activeLocationsMap.get(v.locationId)!;
        brokenOrOutOfScope.push({
          id: `out-top-${v.id}`,
          parentId: null,
          label: `${v.label} (Out of Scope)`,
          code: loc.code,
          type: 'visual',
          state: 'out_of_root',
          location: loc,
          visual: {
            topDownVisualNode: v,
            mappingType: 'top_down'
          },
          children: [],
          depth: 0,
          locked: v.locked
        });
      }
    }

    const checkBrokenStructure = (s: StructureNode) => {
      if (s.locationId) {
        if (!activeLocationsMap.has(s.locationId)) {
          brokenOrOutOfScope.push({
            id: `broken-front-${s.id}`,
            parentId: null,
            label: s.label || s.displayLabel || `Cell ${s.id}`,
            type: 'structure',
            state: 'broken_mapping',
            location: null,
            visual: {
              topDownVisualNode: v,
              frontStructureNode: s,
              mappingType: 'front_cell'
            },
            children: [],
            depth: 0,
            locked: s.locked
          });
        } else if (!scopeSet.has(s.locationId)) {
          const loc = activeLocationsMap.get(s.locationId)!;
          brokenOrOutOfScope.push({
            id: `out-front-${s.id}`,
            parentId: null,
            label: `${s.label || s.displayLabel || `Cell ${s.id}`} (Out of Scope)`,
            code: loc.code,
            type: 'structure',
            state: 'out_of_root',
            location: loc,
            visual: {
              topDownVisualNode: v,
              frontStructureNode: s,
              mappingType: 'front_cell'
            },
            children: [],
            depth: 0,
            locked: s.locked
          });
        }
      }
      if (s.children) {
        s.children.forEach(checkBrokenStructure);
      }
    };

    if (v.structure) {
      checkBrokenStructure(v.structure);
    }
  });

  return {
    workspaceTree,
    unlinkedStorageTree,
    contextObjects,
    brokenOrOutOfScope
  };
}
