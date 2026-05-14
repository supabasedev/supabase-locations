import { VisualNode, ViewType, SplitTreeEntry } from '../types';

export const RICH_SPLIT_TREES: SplitTreeEntry[] = [
  {
    id: 'st-rack-a1-r01',
    layoutId: 'lay-rich-01',
    parentVisualNodeId: 'v-rack-a1-r01-rich',
    viewType: ViewType.FRONT,
    root: {
      id: 's-rack-a1-r01',
      nodeKind: 'container',
      splitDirection: 'vertical',
      splitType: 'shelves',
      sizeValue: 1,
      sizeMode: 'ratio',
      children: [
        {
          id: 's-shelf-1',
          nodeKind: 'cell',
          sizeValue: 1,
          sizeMode: 'ratio',
          locationId: 'l-shelf-a1-r01-s1',
          label: 'A1-R01-S1',
          displayLabel: 'S1'
        },
        {
          id: 's-shelf-2',
          nodeKind: 'cell',
          sizeValue: 1,
          sizeMode: 'ratio',
          locationId: 'l-shelf-a1-r01-s2',
          label: 'A1-R01-S2',
          displayLabel: 'S2'
        }
      ]
    }
  },
  {
    id: 'st-rack-a2-r01',
    layoutId: 'lay-rich-01',
    parentVisualNodeId: 'v-rack-a2-r01-rich',
    viewType: ViewType.FRONT,
    root: {
      id: 's-rack-a2-r01',
      nodeKind: 'container',
      splitDirection: 'vertical',
      splitType: 'shelves',
      sizeValue: 1,
      sizeMode: 'ratio',
      children: [
        {
          id: 's-shelf-a2-r01-s1',
          nodeKind: 'cell',
          sizeValue: 1,
          sizeMode: 'ratio',
          locationId: 'l-shelf-a2-r01-s1',
          label: 'A2-R01-S1',
          displayLabel: 'S1'
        }
      ]
    }
  },
  {
    id: 'st-rack-a2-r02',
    layoutId: 'lay-rich-01',
    parentVisualNodeId: 'v-rack-a2-r02-rich',
    viewType: ViewType.FRONT,
    root: {
      id: 's-rack-a2-r02',
      nodeKind: 'container',
      splitDirection: 'vertical',
      splitType: 'shelves',
      sizeValue: 1,
      sizeMode: 'ratio',
      children: [
        {
          id: 's-shelf-a2-r02-s1',
          nodeKind: 'container',
          splitDirection: 'horizontal',
          splitType: 'bins',
          sizeValue: 1,
          sizeMode: 'ratio',
          label: 'Shelf S1',
          displayLabel: 'S1',
          locationId: 'l-shelf-a2-r02-s1',
          children: [
            {
              id: 's-bin-a2-r02-s1-b1',
              nodeKind: 'cell',
              sizeValue: 1,
              sizeMode: 'ratio',
              locationId: 'l-bin-a2-r02-s1-b1',
              label: 'B1',
              displayLabel: 'B1'
            },
            {
              id: 's-bin-a2-r02-s1-b2',
              nodeKind: 'cell',
              sizeValue: 1,
              sizeMode: 'ratio',
              locationId: 'l-bin-a2-r02-s1-b2',
              label: 'B2',
              displayLabel: 'B2'
            },
            {
              id: 's-bin-a2-r02-s1-b3',
              nodeKind: 'cell',
              sizeValue: 1,
              sizeMode: 'ratio',
              locationId: 'l-bin-a2-r02-s1-b3',
              label: 'B3',
              displayLabel: 'B3'
            }
          ]
        }
      ]
    }
  }
];

export const RICH_VISUAL_NODES: VisualNode[] = [
  {
    id: 'v-zone-pick-rich',
    layoutId: 'lay-rich-01',
    locationId: 'l-zone-pick',
    visualizationType: 'zone',
    label: 'Picking Area',
    xMm: 1000,
    yMm: 1000,
    zMm: 10,
    rotationDeg: 0,
    widthMm: 8000,
    heightMm: 50,
    depthMm: 13000,
    style: { fill: 'rgba(14, 165, 233, 0.1)' },
    viewType: ViewType.TOP_DOWN,
    parentVisualNodeId: null,
    zoneType: 'operational'
  },
  {
    id: 'v-rack-a1-r01-rich',
    layoutId: 'lay-rich-01',
    locationId: 'l-rack-a1-r01',
    visualizationType: 'rack',
    label: 'Rack A1-R01',
    xMm: 1500,
    yMm: 2000,
    zMm: 0,
    rotationDeg: 0,
    widthMm: 2500,
    heightMm: 4000,
    depthMm: 1000,
    style: { fill: '#334155', variant: 'industrial' },
    viewType: ViewType.TOP_DOWN,
    parentVisualNodeId: 'v-zone-pick-rich',
    front: {
      isConfigured: true,
      splitTreeId: 'st-rack-a1-r01'
    }
  },
  {
    id: 'v-rack-a1-r02-rich',
    layoutId: 'lay-rich-01',
    locationId: 'l-rack-a1-r02',
    visualizationType: 'rack',
    label: 'Rack A1-R02 (Top-Only)',
    xMm: 4500,
    yMm: 2000,
    zMm: 0,
    rotationDeg: 0,
    widthMm: 2500,
    heightMm: 4000,
    depthMm: 1000,
    style: { fill: '#334155', variant: 'industrial' },
    viewType: ViewType.TOP_DOWN,
    parentVisualNodeId: 'v-zone-pick-rich'
  },
  {
    id: 'v-rack-a2-r01-rich',
    layoutId: 'lay-rich-01',
    locationId: null,
    visualizationType: 'rack',
    label: 'Rack A2-R01 (Unassigned)',
    xMm: 1500,
    yMm: 6000,
    zMm: 0,
    rotationDeg: 0,
    widthMm: 2500,
    heightMm: 6000,
    depthMm: 1000,
    style: { fill: '#334155', variant: 'industrial' },
    viewType: ViewType.TOP_DOWN,
    parentVisualNodeId: 'v-zone-pick-rich',
    front: {
      isConfigured: true,
      splitTreeId: 'st-rack-a2-r01'
    }
  },
  {
    id: 'v-rack-a2-r02-rich',
    layoutId: 'lay-rich-01',
    locationId: 'l-rack-a2-r02',
    visualizationType: 'rack',
    label: 'Rack A2-R02 (Hybrid Link)',
    xMm: 4500,
    yMm: 6000,
    zMm: 0,
    rotationDeg: 0,
    widthMm: 2500,
    heightMm: 8000,
    depthMm: 1000,
    style: { fill: '#334155', variant: 'industrial' },
    viewType: ViewType.TOP_DOWN,
    parentVisualNodeId: 'v-zone-pick-rich',
    front: {
      isConfigured: true,
      splitTreeId: 'st-rack-a2-r02'
    }
  },
  {
    id: 'v-zone-store-rich',
    layoutId: 'lay-rich-01',
    locationId: 'l-zone-store',
    visualizationType: 'zone',
    label: 'Bulk Storage Area',
    xMm: 10000,
    yMm: 1000,
    zMm: 10,
    rotationDeg: 0,
    widthMm: 8000,
    heightMm: 50,
    depthMm: 13000,
    style: { fill: 'rgba(234, 179, 8, 0.1)' },
    viewType: ViewType.TOP_DOWN,
    parentVisualNodeId: null,
    zoneType: 'storage'
  },
  {
    id: 'v-zone-office-rich',
    layoutId: 'lay-rich-01',
    locationId: 'l-wh-01-offices',
    visualizationType: 'zone',
    label: 'Logistics Offices',
    xMm: 10000,
    yMm: 15500,
    zMm: 0,
    rotationDeg: 0,
    widthMm: 8000,
    heightMm: 3000,
    depthMm: 4000,
    style: { fill: 'rgba(248, 250, 252, 0.5)' },
    viewType: ViewType.TOP_DOWN,
    parentVisualNodeId: null,
    zoneType: 'operational'
  },
  {
    id: 'v-desk-rich',
    layoutId: 'lay-rich-01',
    locationId: 'l-off-d1',
    visualizationType: 'desk',
    label: 'Ops Manager Desk',
    xMm: 11000,
    yMm: 16500,
    zMm: 0,
    rotationDeg: 0,
    widthMm: 1800,
    heightMm: 750,
    depthMm: 800,
    style: { fill: '#78350f' },
    viewType: ViewType.TOP_DOWN,
    parentVisualNodeId: 'v-zone-office-rich'
  }
];
