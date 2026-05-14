# AMBRA Locations: Technical Architecture & Core Systems Report

## 1. Overview
AMBRA Locations is a warehouse virtualization and inventory management platform. It bridges the gap between **Logical Operational Truth** (Inventory Locations) and **Physical Visual Representations** (Interactive Maps & Structural Views).

The system consists of two primary subsystems that are linked via unique identifiers:
1.  **Logical Location System**: A hierarchical tree representing the warehouse organization (Zones, Racks, Shelves, Bins).
2.  **Workspace Visualization System**: A 2D/3D layout engine that renders physical representations of the warehouse floor and equipment.

---

## 2. Logical Location System (`Logic`)

### Data Model: `LogicalLocation`
Defined in `src/types.ts`, this system manages the "where" of inventory.

*   **Structure**: Recursive tree. Each location can have a `parentId`.
*   **Unique Identifiers**: Every location has a permanent `id` and a human-readable `code` (e.g., `WH/A1/R02/S3/B1`).
*   **Types**: Defined by `LocationType` enum:
    *   `warehouse`: Root container.
    *   `zone`: Large area (e.g., Receiving, Bulk).
    *   `rack`: Vertical storage structures.
    *   `shelf`: Horizontal levels.
    *   `bin`: Individual storage compartments.
    *   `position`: High-precision slots.
*   **Operational Flags**: 
    *   `allowsStock`: Boolean for inventory eligibility.
    *   `isPickable`, `isReceivable`, `isVirtual`.
*   **Status Management**: `active`, `inactive`, `locked`, `full`.

### Key Utilities
*   `findLocationById` and `findLocationByCode`: Recursive search functions.
*   `getFullPath`: Generates the breadcrumb trail for a specific location.

---

## 3. Workspace Visualization System (`Visual`)

The visualization system handles the spatial aspect of the warehouse.

### A. The Layout Entity
A `Layout` is a container for a "Workspace". It consists of:
*   `baseSurface`: Dimensions of the floor/area (cm).
*   `nodes`: Primary visual components.
*   `branchId`: Link to the organizational branch.

### B. Visual Nodes (`VisualNode`)
These are the building blocks of the map.
*   **Geometry**: `x`, `y`, `width`, `depth` (footprint), `height` (vertical elevation).
*   **Orientation**: `rotation` (degrees) and `frontSide` (which edge faces the operator).
*   **Visual Logic**:
    *   `viewMode`: `top_down` or `front`.
    *   `symbol`: `rect`, `circle`, `rack`, `pillar`, etc.
    *   `style`: Custom colors, corner radii, and skins.

### C. Internal Structure (`StructureNode`)
For complex objects like Racks, the "Front View" is managed by a recursive `StructureNode` tree.
*   **Type**: `cell` (leaf) or `container` (branch).
*   **Splits**: `horizontal` (Rows/Shelves) or `vertical` (Columns).
*   **Dividers**: Physical thickness and material of dividers between cells.
*   **Skins**: Visual presets (e.g., Metal Rack, Plastic Bin, Pallet).

---

## 4. The "Bridge": Connection Logic

The link between the Logical and Visual systems is established via the `locationId` field.

### Mapping Strategy
1.  **Node-Level Mapping**: A `VisualNode` (e.g., a Rack object on the map) can be linked to a `LogicalLocation` (e.g., Rack R02).
2.  **Structural Mapping**: Inside a `VisualNode.structure`, individual `StructureNode` (cells) are linked to leaf `LogicalLocation` objects (Shelves/Bins).
3.  **Inheritance**: Mapping a cell often involves selecting a subset of child locations from the parent location linked to the root node.

### Coordinate & Scaling System
*   **Unit of Truth**: Centimeters (**cm**).
*   **Canvas Scaling**: 
    *   `scale = 0.1` is used as base (mapping 1cm to 1px effectively if 1mm = 0.1px).
    *   Coordinates are stored as world units (cm) and rendered using SVG/Canvas transforms.

---

## 5. UI/UX Interaction Modules

### `EditorCanvas.tsx` (Top-Down Editor)
*   **Engine**: Konva.js (HTML5 Canvas).
*   **Interactions**: Drag-and-drop placement, rotation, multi-selection, snapping to grid.
*   **Z-Index**: Managed by the `parentId` / nesting in the visual nodes list.

### `FrontViewEditor.tsx` (Structural Editor)
*   **Engine**: React + Tailwind + Portals.
*   **Wizard**: 5-step initialization for defining height, orientation, and templates.
*   **Grid Tooling**: Advanced cell splitting (horizontal/vertical) with automatic label generation.
*   **Batch Mapping**: Automated logic to bind unmapped logical locations to empty visual cells.

### `LocationsPage.tsx` (Management)
*   **Engine**: Custom Tree View.
*   **Interactions**: Reordering via drag-and-drop, inline editing, and modal-based creation.

---

## 6. Data Flows

### Export/Import Contract (`V2`)
The system supports a sanitized JSON export for workspace portability.
*   **Schema**: `ambra-workspace-export-v2`.
*   **Normalization**: Extracts `baseSurface`, `visualNodes`, and `frontViews` into a flat, serializable format.
*   **Mapping Stability**: Preserves `locationId` links ensuring the relationship between world-data and view-data is restored upon import.

---

## 7. Developer Notes & Architecture Decisions

1.  **Immutability**: React state (useState/useMemo) is the core driver. No complex state machines or external stores are used, keeping the data flow predictable.
2.  **Performance**: `ResizeObserver` and debounced updates prevent layout thrashing on the canvas.
3.  **Units**: Strict adherence to **cm** for all storage. Visual scaling is strictly handled in the rendering layer.
4.  **Security**: Rule-based locking (`VisualNode.locked`) prevents accidental map modifications.

---
*Report Generated: ${new Date().toISOString()}*
