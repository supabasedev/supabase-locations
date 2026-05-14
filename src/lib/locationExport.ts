/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogicalLocation, LocationType } from '../types';

export interface LocationExportSchema {
  schemaVersion: string;
  exportedAt: string;
  source: {
    branchId: string;
    rootLocationId?: string;
    appUnit: string;
  };
  locations: LogicalLocation[];
  tree: ExportTreeNode[];
  metadata: {
    counts: {
      totalLocations: number;
      rootLocations: number;
      leafLocations: number;
      storageCapableLocations: number;
      virtualLocations: number;
      pickableLocations: number;
      receivableLocations: number;
      withQrCode: number;
      withBarcode: number;
      withPhysicalMetadata: number;
      withWarnings: number;
    };
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    maxDepth: number;
  };
  diagnostics: {
    missingParents: string[];
    duplicateCodes: string[];
    circularReferences: string[];
    orphanedLocations: string[];
    invalidStockFlags: string[];
    parentAllowsStockWithChildren: string[];
    locationsWithoutCodes: string[];
    locationsWithoutNames: string[];
  };
  visualizationReadiness: {
    locationsEligibleForVisualization: string[];
    storageCapableLeafLocations: string[];
    containerLocations: string[];
    virtualLocationsExcludedFromVisualization: string[];
    suggestedWorkspaceRoots: string[];
  };
}

export interface ExportTreeNode {
  id: string;
  code: string;
  name: string;
  path: string;
  namePath: string;
  depth: number;
  parentId: string | null;
  locationType: LocationType;
  status: string;
  allowsStock: boolean;
  isReceivable: boolean;
  isPickable: boolean;
  isVirtual: boolean;
  children: ExportTreeNode[];
}

export function generateLocationExport(
  locations: LogicalLocation[],
  branchId: string = 'unknown'
): LocationExportSchema {
  const exportedAt = new Date().toISOString();
  
  // Helpers
  const getLocationById = (id: string) => locations.find(l => l.id === id);
  
  const getAncestors = (loc: LogicalLocation): LogicalLocation[] => {
    const ancestors: LogicalLocation[] = [];
    let currentId = loc.parentId;
    const visited = new Set<string>();
    
    while (currentId && !visited.has(currentId)) {
      const parent = getLocationById(currentId);
      if (!parent) break;
      ancestors.unshift(parent);
      visited.add(currentId);
      currentId = parent.parentId;
    }
    return ancestors;
  };

  const getCodePath = (loc: LogicalLocation) => {
    const ancestors = getAncestors(loc);
    return [...ancestors.map(a => a.code), loc.code].join('/');
  };

  const getNamePath = (loc: LogicalLocation) => {
    const ancestors = getAncestors(loc);
    return [...ancestors.map(a => a.name), loc.name].join(' / ');
  };

  const isLeaf = (locId: string) => !locations.some(l => l.parentId === locId);

  // Map locations to include extra inspection info
  const locationsWithPaths = locations.map(l => {
    const ancestors = getAncestors(l);
    return {
      ...l,
      codePath: getCodePath(l),
      namePath: getNamePath(l),
      ancestorIds: ancestors.map(a => a.id),
      depth: ancestors.length,
      isLeaf: isLeaf(l.id)
    };
  });

  // Build Tree
  const buildTree = (parentId: string | null, depth: number = 0): ExportTreeNode[] => {
    return locationsWithPaths
      .filter(l => l.parentId === parentId)
      .map(l => ({
        id: l.id,
        code: l.code,
        name: l.name,
        path: l.codePath,
        namePath: l.namePath,
        depth: l.depth,
        parentId: l.parentId,
        locationType: l.locationType,
        status: l.status,
        allowsStock: l.allowsStock,
        isReceivable: l.isReceivable,
        isPickable: l.isPickable,
        isVirtual: l.isVirtual,
        children: buildTree(l.id, depth + 1)
      }));
  };

  const tree = buildTree(null);

  // Metadata & Counts
  const counts = {
    totalLocations: locations.length,
    rootLocations: locations.filter(l => !l.parentId).length,
    leafLocations: locationsWithPaths.filter(l => l.isLeaf).length,
    storageCapableLocations: locations.filter(l => l.allowsStock).length,
    virtualLocations: locations.filter(l => l.isVirtual).length,
    pickableLocations: locations.filter(l => l.isPickable).length,
    receivableLocations: locations.filter(l => l.isReceivable).length,
    withQrCode: locations.filter(l => !!l.qrCodeValue).length,
    withBarcode: locations.filter(l => !!l.barcodeValue).length,
    withPhysicalMetadata: locations.filter(l => !!l.physicalMetadata).length,
    withWarnings: locations.filter(l => (l.warnings?.length || 0) > 0).length,
  };

  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let maxDepth = 0;

  locationsWithPaths.forEach(l => {
    byType[l.locationType] = (byType[l.locationType] || 0) + 1;
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    if (l.depth > maxDepth) maxDepth = l.depth;
  });

  // Diagnostics
  const codes = locations.map(l => l.code);
  const duplicateCodes = Array.from(new Set(codes.filter((item, index) => codes.indexOf(item) !== index)));
  
  const missingParents = locations
    .filter(l => l.parentId !== null && !getLocationById(l.parentId))
    .map(l => l.id);

  const circularReferences: string[] = [];
  locationsWithPaths.forEach(l => {
    if (l.ancestorIds.includes(l.id)) {
      circularReferences.push(l.id);
    }
  });

  const parentAllowsStockWithChildren = locationsWithPaths
    .filter(l => l.allowsStock && !l.isLeaf)
    .map(l => l.id);

  // Visualization Readiness
  const storageCapableLeafLocations = locationsWithPaths
    .filter(l => l.allowsStock && l.isLeaf)
    .map(l => l.id);

  const containerTypes = [LocationType.RACK, LocationType.SHELF, LocationType.AISLE, LocationType.ZONE, LocationType.WAREHOUSE];
  const containerLocations = locations
    .filter(l => containerTypes.includes(l.locationType))
    .map(l => l.id);

  const visualizationEligibleTypes = [
    LocationType.WAREHOUSE, LocationType.ZONE, LocationType.AISLE, 
    LocationType.RACK, LocationType.SHELF, LocationType.BIN,
    LocationType.PALLET_POSITION, LocationType.WORKBENCH,
    LocationType.BULK_STORAGE, LocationType.STAGING_AREA
  ];
  
  const locationsEligibleForVisualization = locations
    .filter(l => !l.isVirtual && visualizationEligibleTypes.includes(l.locationType))
    .map(l => l.id);

  return {
    schemaVersion: 'ambra-location-tree-export-v1',
    exportedAt,
    source: {
      branchId,
      appUnit: 'cm'
    },
    locations: locationsWithPaths as any,
    tree,
    metadata: {
      counts,
      byType,
      byStatus,
      maxDepth
    },
    diagnostics: {
      missingParents,
      duplicateCodes,
      circularReferences,
      orphanedLocations: missingParents, // In this context same as missing parents
      invalidStockFlags: [], // Placeholder for future rules
      parentAllowsStockWithChildren,
      locationsWithoutCodes: locations.filter(l => !l.code).map(l => l.id),
      locationsWithoutNames: locations.filter(l => !l.name).map(l => l.id),
    },
    visualizationReadiness: {
      locationsEligibleForVisualization,
      storageCapableLeafLocations,
      containerLocations,
      virtualLocationsExcludedFromVisualization: locations.filter(l => l.isVirtual).map(l => l.id),
      suggestedWorkspaceRoots: locations.filter(l => l.locationType === LocationType.WAREHOUSE).map(l => l.id)
    }
  };
}
