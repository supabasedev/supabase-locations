# Interactive Location Map Preview

## Overview
The Interactive Location Map Preview is a read-only wayfinding and visualization system for AMBRA Locations. It allows warehouse operators and managers to bridge the gap between logical operational data (inventory locations) and physical visual representations (top-down maps and structural drawings).

The system is designed to be similar to indoor navigation tools (airport/mall maps), where a user can search for a location code and see exactly where it is physically situated in the warehouse.

---

## Technical Architecture

### Location ↔ Visual Resolution Model
The core of the system is the `LocationVisualResolution` model. It resolves a logical `locationId` to its physical representation in a workspace.

| Status | Description |
| :--- | :--- |
| **Top Down** | The location is linked directly to a physical object on the warehouse floor map (e.g., a specific Rack or Zone). |
| **Front Cell** | The location is mapped to a specific cell (Shelf, Bin, Position) within a vertical structure (Rack). |
| **Unmapped** | The location exists in the logical tree but has not been placed or assigned on the selected workspace. |
| **Duplicate** | The location has been assigned to multiple physical objects, indicating a mapping error that needs management attention. |

### Mapping States
- **Visual Only**: Node exists on the map for physical guidance (e.g., a pillar, wall, or unlabeled desk) but has no logical location assigned.
- **Broken Reference**: A physical object points to a location ID that no longer exists in the logical registry.

---

## Integration Points

### 1. Workspaces Dashboard
Users can launch a full-screen interactive preview for any workspace directly from the **Workspaces** gallery using the **Preview** button.

### 2. Locations Management
In the **Locations** tree view, users can click **Locate on Map** for any specific location. The system will automatically:
1. Identify the layout containing that location.
2. Open the preview.
3. Highlight the object on the floor map.
4. If applicable, open the front-view and highlight the specific shelf/bin.

---

## Implementation Details

### Files
- `src/lib/locationMappingResolver.ts`: Pure logical utilities for building mapping indices and resolving IDs.
- `src/components/locations/InteractiveLocationMapPreview.tsx`: The primary read-only UI component handling rendering and interaction.

### Strict Read-Only Rule
The Preview system is strictly **read-only**. 
- It **MUST NOT** mutate workspace data.
- It **MUST NOT** include editor tools (drag-and-drop, resize, split, delete).
- It uses own local state for UI transitions (selection, hover, zoom).

---

## Future Considerations
- **Units**: Adhere to **cm** for all physical calculations. The renderer handles screen scaling.
- **Renderer Decoupling**: If full editor-quality rendering is needed in the future, extract the rendering logic from `EditorCanvas` into a shared component without dragging in the editing handles and controls.
- **Data Integrity**: Use the "Broken Reference" and "Duplicate" states to guide managers in repairing the digital twin.
