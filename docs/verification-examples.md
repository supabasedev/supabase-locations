# AMBRA VERIFICATION EXAMPLES (CANONICAL)

These examples represent the verified output format of the AMBRA systems using the Canonical Mock Data.

## 1. Workspace Export V2 (Serialized Package)
Source: `src/lib/workspaceTransfer.ts` -> `serializeWorkspaceData()`

```json
{
  "schemaVersion": "ambra-workspace-export-v2",
  "exportedAt": "2026-05-14T16:00:00Z",
  "source": {
    "workspaceId": "lay-simple-wh",
    "workspaceName": "Berlin DC - Main Floor",
    "branchId": "b1",
    "appUnit": "cm"
  },
  "layout": {
    "id": "lay-simple-wh",
    "branchId": "b1",
    "rootLocationId": "wh-01",
    "name": "Berlin DC - Main Floor",
    "status": "published",
    "lastEdited": "2026-05-14T12:00:00Z",
    "baseSurface": {
      "sourceVisualId": "v-floor",
      "type": "floor",
      "label": "Berlin Hub Floor",
      "width": 5000,
      "depth": 3000,
      "height": 10,
      "style": { "fill": "#1e293b" }
    }
  },
  "visualNodes": [
    {
      "id": "v-rack-1",
      "sourceId": "v-rack-1",
      "locationId": "wh-01-z1-r01",
      "visualizationType": "rack",
      "sourceVisualizationType": "industrial",
      "label": "Rack A-01",
      "x": 500,
      "y": 0,
      "z": 2,
      "rotation": 0,
      "width": 300,
      "height": 250,
      "depth": 100,
      "style": { "fill": "#cbd5e1" },
      "viewType": "top_down",
      "parentVisualNodeId": null,
      "supportsFrontView": true,
      "front": {
        "isConfigured": true,
        "frontSide": "bottom",
        "frontViewId": "front-v-rack-1"
      }
    }
  ],
  "frontViews": [
    {
      "id": "front-v-rack-1",
      "sourceVisualId": "v-rack-1",
      "visualNodeId": "v-rack-1",
      "frontSide": "bottom",
      "root": {
        "id": "root-struct",
        "nodeKind": "container",
        "splitDirection": "horizontal",
        "sizeValue": 1,
        "children": [
          { "id": "shelf-1", "nodeKind": "cell", "locationId": "wh-01-z1-r01-s1", "label": "Shelf 01" }
        ]
      }
    }
  ],
  "metadata": {
    "counts": {
      "visualNodes": 1,
      "baseSurface": 1,
      "frontViews": 1,
      "frontCells": 2,
      "linkedLocations": 2
    },
    "dimensionSemantics": {
       "top_down": { "horizontalAxis": "x", "verticalAxis": "y" },
       "front": { "horizontalAxis": "x", "verticalAxis": "z" }
    }
  }
}
```

## 2. Location Export V1 (Serialized Package)
Source: `src/lib/locationExport.ts` -> `generateLocationExport()`

```json
{
  "schemaVersion": "ambra-location-tree-export-v1",
  "exportedAt": "2026-05-14T16:00:00Z",
  "source": { "branchId": "b1", "appUnit": "cm" },
  "locations": [
    {
      "id": "wh-01-z1-r01-s1",
      "code": "A-R01-S1",
      "codePath": "WH-BERLIN/WH-01-ZONE-A/A-R01/A-R01-S1",
      "name": "Shelf 01",
      "locationType": "shelf",
      "allowsStock": true,
      "isLeaf": true,
      "depth": 3
    }
  ],
  "tree": [
    {
      "id": "wh-01",
      "code": "WH-BERLIN",
      "children": [
         { "id": "wh-01-z1", "code": "WH-01-ZONE-A", "children": [] }
      ]
    }
  ],
  "diagnostics": {
     "duplicateCodes": [],
     "missingParents": []
  }
}
```

## 3. Mapping Health Report
Generated for `workspace_invalid_diagnostics.json`

```json
{
  "summary": {
    "totalLocations": 5,
    "mappedLocations": 2,
    "brokenMappings": 1,
    "duplicateMappings": 1,
    "outOfScopeMappings": 1
  },
  "details": {
    "brokenMappings": [
      { "visualNodeId": "v-broken", "locationId": "NON-EXISTENT-ID", "source": "top-down" }
    ],
    "duplicateMappings": [
      { "locationId": "wh-01-z1-r01-s1-b01", "occurrences": ["v-duplicate-1", "v-duplicate-2"] }
    ],
    "outOfScopeMappings": [
      { "visualNodeId": "v-out-of-scope", "locationId": "wh-02", "source": "top-down" }
    ]
  }
}
```

## 4. Interactive Preview Resolution Output
Resolver Input: `wh-01-z1-r01-s1-b01` (Bin 01)

```json
{
  "status": "front_cell",
  "locationId": "wh-01-z1-r01-s1-b01",
  "parentVisualNodeId": "v-adv-rack",
  "structureNodeId": "cell-1-1",
  "structurePath": ["s-root", "col-1", "cell-1-1"],
  "label": "Bin A-R01-S1-01"
}
```

## 5. Duplicate Mapping Diagnostic
Example of visual alert trigger:
> "CRITICAL: Location A-R01-S1-01 is assigned to both [Rack Main] and [Rack Overflow]. Spatial queries will return non-deterministic results."

## 6. Cross-Boundary Diagnostic
Example:
> "WARNING: Workspace 'Berlin Floor' contains mapping to 'Paris Warehouse'. This will be excluded from Berlin pick-path optimizations."
