import { LogicalLocation } from '../types';

/**
 * Calculates current pathCode and pathName for a location based on its ancestry.
 */
export function calculateLocationPaths(
  location: LogicalLocation,
  allLocations: LogicalLocation[]
): { pathCode: string; pathName: string } {
  const ancestry: LogicalLocation[] = [location];
  let currentParentId = location.parentId;

  while (currentParentId) {
    const parent = allLocations.find((l) => l.id === currentParentId);
    if (!parent || ancestry.includes(parent)) break; // Prevent cycles
    ancestry.unshift(parent);
    currentParentId = parent.parentId;
  }

  return {
    pathCode: ancestry.map((l) => l.code).join('/'),
    pathName: ancestry.map((l) => l.name).join(' / '),
  };
}

/**
 * Recursively updates paths for a location and all its descendants.
 */
export function updateLocationPathsRecursive(
  locationId: string,
  allLocations: LogicalLocation[]
): LogicalLocation[] {
  const updatedLocations = [...allLocations];
  const processQueue = [locationId];
  const processed = new Set<string>();

  while (processQueue.length > 0) {
    const currentId = processQueue.shift()!;
    if (processed.has(currentId)) continue;
    processed.add(currentId);

    const index = updatedLocations.findIndex((l) => l.id === currentId);
    if (index === -1) continue;

    const loc = updatedLocations[index];
    const { pathCode, pathName } = calculateLocationPaths(loc, updatedLocations);
    
    updatedLocations[index] = {
      ...loc,
      pathCode,
      pathName,
      updatedAt: new Date().toISOString(),
    };

    // Add children to queue
    const children = updatedLocations.filter((l) => l.parentId === currentId);
    processQueue.push(...children.map((c) => c.id));
  }

  return updatedLocations;
}
