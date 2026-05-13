import { 
  LogicalLocation, 
  LocationType, 
  Layout, 
  VisualNode, 
  ViewMode 
} from './types';

export const MOCK_BRANCHES = [
  { id: 'b1', name: 'Main Logistics Center' },
  { id: 'b2', name: 'Workshop Garage B' }
];

export const MOCK_LOCATIONS: LogicalLocation[] = [
  {
    id: 'l1',
    code: 'WH-MAIN',
    name: 'Main Warehouse',
    parentId: null,
    locationType: LocationType.WAREHOUSE,
    allowsStock: false,
    isReceivable: false,
    isPickable: false,
    isVirtual: false,
    status: 'active'
  },
  {
    id: 'l2',
    code: 'ZONE-A',
    name: 'High Density Zone',
    parentId: 'l1',
    locationType: LocationType.ZONE,
    allowsStock: false,
    isReceivable: false,
    isPickable: false,
    isVirtual: false,
    status: 'active'
  },
  {
    id: 'l3',
    code: 'C-01',
    name: 'Tool Cabinet 01',
    parentId: 'l2',
    locationType: LocationType.RACK,
    allowsStock: true,
    isReceivable: true,
    isPickable: true,
    isVirtual: false,
    status: 'active',
    stockCount: 45,
    skuCount: 12
  },
  {
    id: 'l4',
    code: 'S-01',
    name: 'Shelf A1',
    parentId: 'l3',
    locationType: LocationType.SHELF,
    allowsStock: true,
    isReceivable: true,
    isPickable: true,
    isVirtual: false,
    status: 'active',
    stockCount: 12,
    skuCount: 3
  },
  {
    id: 'l5',
    code: 'B-01',
    name: 'Bin X1',
    parentId: 'l4',
    locationType: LocationType.BIN,
    allowsStock: true,
    isReceivable: true,
    isPickable: true,
    isVirtual: false,
    status: 'active',
    stockCount: 200,
    skuCount: 1
  },
  {
    id: 'l6',
    code: 'WH-REC',
    name: 'Receiving Dock',
    parentId: 'l1',
    locationType: LocationType.RECEIVING,
    allowsStock: true,
    isReceivable: true,
    isPickable: false,
    isVirtual: false,
    status: 'active'
  }
];

export const MOCK_LAYOUTS: Layout[] = [
  {
    id: 'lay1',
    branchId: 'b1',
    name: 'Regional DC - Hall A',
    status: 'published',
    lastEdited: '2024-05-08 10:30'
  },
  {
    id: 'lay2',
    branchId: 'b2',
    name: 'Precision Gear Workshop',
    status: 'draft',
    lastEdited: '2024-05-08 11:05'
  }
];

export const MOCK_VISUALS: VisualNode[] = [
  // LAYOUT 1: Regional DC (15m x 12m)
  {
    id: 'v1-floor',
    layoutId: 'lay1',
    locationId: 'l1',
    type: 'rectangle',
    label: 'Main Floor Hall A',
    x: 0,
    y: 0,
    z: 0,
    rotation: 0,
    width: 1500,
    height: 500,
    depth: 1200,
    color: '#111827',
    viewMode: ViewMode.TOP_DOWN,
    parentId: null
  },
  {
    id: 'v1-zone-a',
    layoutId: 'lay1',
    locationId: 'l2',
    type: 'zone',
    label: 'Aisle 01 - Receiving',
    x: 50,
    y: 50,
    z: 0,
    rotation: 0,
    width: 400,
    height: 10,
    depth: 1100,
    color: 'rgba(56, 189, 248, 0.05)',
    viewMode: ViewMode.TOP_DOWN,
    parentId: 'v1-floor'
  },
  {
    id: 'v1-rack-1',
    layoutId: 'lay1',
    locationId: 'l3',
    type: 'rectangle',
    label: 'Rack R-A1-01',
    x: 100,
    y: 100,
    z: 0,
    rotation: 0,
    width: 250,
    height: 400,
    depth: 100,
    color: '#334155',
    viewMode: ViewMode.TOP_DOWN,
    parentId: 'v1-zone-a',
    supportsFrontView: true,
    supportsInteriorView: true
  },
  {
    id: 'v1-rack-2',
    layoutId: 'lay1',
    locationId: null,
    type: 'rectangle',
    label: 'Rack R-A1-02',
    x: 100,
    y: 250,
    z: 0,
    rotation: 0,
    width: 250,
    height: 400,
    depth: 100,
    color: '#334155',
    viewMode: ViewMode.TOP_DOWN,
    parentId: 'v1-zone-a',
    supportsFrontView: true,
    supportsInteriorView: true
  },
  {
    id: 'v1-rack-3',
    layoutId: 'lay1',
    locationId: null,
    type: 'rectangle',
    label: 'Rack R-A1-03',
    x: 100,
    y: 400,
    z: 0,
    rotation: 0,
    width: 250,
    height: 400,
    depth: 100,
    color: '#334155',
    viewMode: ViewMode.TOP_DOWN,
    parentId: 'v1-zone-a',
    supportsFrontView: true,
    supportsInteriorView: true
  },

  // LAYOUT 2: Precision Workshop (8m x 6m)
  {
    id: 'v2-floor',
    layoutId: 'lay2',
    locationId: null,
    type: 'rectangle',
    label: 'Workshop Floor',
    x: 0,
    y: 0,
    z: 0,
    rotation: 0,
    width: 800,
    height: 300,
    depth: 600,
    color: '#111827',
    viewMode: ViewMode.TOP_DOWN,
    parentId: null
  },
  {
    id: 'v2-bench-1',
    layoutId: 'lay2',
    locationId: null,
    type: 'rectangle',
    label: 'Assembly Bench 01',
    x: 50,
    y: 50,
    z: 0,
    rotation: 0,
    width: 200,
    height: 90,
    depth: 80,
    color: '#475569',
    viewMode: ViewMode.TOP_DOWN,
    parentId: 'v2-floor'
  },
  {
    id: 'v2-cabinet-1',
    layoutId: 'lay2',
    locationId: 'l3',
    type: 'rectangle',
    label: 'Tool Cabinet A',
    x: 300,
    y: 50,
    z: 0,
    rotation: 0,
    width: 120,
    height: 210,
    depth: 60,
    color: '#1e293b',
    viewMode: ViewMode.TOP_DOWN,
    parentId: 'v2-floor',
    supportsFrontView: true,
    supportsInteriorView: true
  }
];
