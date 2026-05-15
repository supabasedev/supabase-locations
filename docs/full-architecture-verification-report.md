# AMBRA ARCHITECTURE VERIFICATION REPORT

**Date:** 2026-05-14
**Status:** VERIFIED

## 1. VERIFIED ARCHITECTURE DIAGRAM

```mermaid
graph TD
    subgraph Logical Domain
        LL[Logical Location] -->|parentId| LL
        LL -->|LocationType| LT[Warehouse, Zone, Aisle, Rack, Bin...]
    end

    subgraph Spatial Domain
        L[Layout/Workspace] -->|rootLocationId| LL
        L -->|contains| VN[Visual Node]
        VN -->|locationId| LL
        VN -->|parentId| VN
        VN -->|frontView| SN[Structure Node]
    end

    subgraph Mapping Domain
        SN -->|locationId| LL
        R[Resolver] -->|index| LL mapping
        R -->|identify| D[Duplicates]
        R -->|identify| B[Broken References]
    end

    subgraph Preview Domain
        P[Preview System] -->|highlight| VN
        P -->|highlight| SN
        P -->|resolve| LL
    end
```

## 2. VERIFIED DATA FLOW

1. **Logical Location Defined**: Hierarchy created (Whse > Zone > Aisle > Rack > Shelf > Bin).
2. **Workspace Created**: Scoped to a specific root (e.g., 'Hall A').
3. **Visual Node Placed**: A physical representation (e.g., "Rack 01") is added to the map.
4. **Mapping Established**: 
    - **Top-Down**: Visual Node `locationId` points to the Rack logical ID.
    - **Front-View**: Structure Nodes (Bins) within the rack point to Bin logical IDs.
5. **Preview Resolver**: 
    - Input: `locationId`.
    - Output: `{ visualNodeId, structurePath }`.
6. **Interactive Highlight**: Canvas or Front-View component highlights the resolved target.

## 3. IDENTIFIED RISKS

| Risk Area | Description | Severity | Mitigation |
| :--- | :--- | :--- | :--- |
| **Duplicate Mappings** | The same Logical Location ID used by multiple Visual Nodes or Structure Cells. | High | Mapping Health Report detects and flags these for manual correction. |
| **Orphaned Locations** | Location IDs in physical visuals that do not exist in the Logical system. | Medium | Resolver flags `unresolvedReferences`. |
| **Scope Boundary Leaks** | A workspace scoped to `Site A` mapping to locations in `Site B`. | Low | `outOfScopeMappings` logic in Health Report. |
| **Unit Inconsistency** | Accidental conversion between `cm` and `m` in rendering. | Medium | Strictly enforced `cm` in standard types via audit. |
| **Stale Roles** | `VisualNodeRole` missing on legacy data. | Low | Heuristic fallback in `analyzeWorkspaceMappingHealth.ts`. |

## 4. SAFE VS UNSAFE OPERATIONS

### SAFE
- Adding new mappings to unmapped locations.
- Creating infrastructure objects (Pillars, Walls) with `nodeRole: infrastructure`.
- Recursive structure splitting (Horiz/Vert) within Front Views.
- Scaling visuals (width/height/depth) in `cm`.

### UNSAFE
- **Changing `rootLocationId` on an existing layout**: Can make all existing mappings "Out of Scope" overnight.
- **Deleting Logical Locations**: Creates broken references in all associated workspaces.
- **Bulk Renaming Logic Codes**: Breaks direct `id` comparisons if IDs are derived from codes (though system uses UUIDs mostly).

## 5. ARCHITECTURAL RULES

- **RULE 1**: A StructureNode location SHOULD belong to the subtree of its parent VisualNode's location.
- **RULE 2**: Infrastructure nodes MUST have `nodeRole: 'infrastructure'` to be excluded from health coverage requirements.
- **RULE 3**: Workspace `rootLocationId` defines the hard boundary for "local" inventory relevance.
- **RULE 4**: All spatial coordinates (x, y, z, width, height, depth) MUST be stored in **centimeters (cm)**.
- **RULE 5**: Dividers in front-views MUST be stored as an array of `N-1` elements for `N` children to maintain structural parity.
