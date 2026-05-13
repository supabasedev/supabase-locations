import { 
  Box, 
  Package, 
  Square, 
  DoorOpen, 
  Wind,
  Warehouse,
  LayoutGrid,
  Columns,
  Rows,
  Database
} from 'lucide-react';
import { StructureNode, VisualNode } from '../types';

export const PRESET_CATEGORIES = [
  {
    name: 'Standard Storage',
    items: [
      { 
        type: 'industrial', 
        label: 'Heavy Duty Rack', 
        icon: Box, 
        w: 2700, d: 1100, h: 4500, 
        color: '#334155', 
        supportsFrontView: true,
        structure: {
          id: 'root-HD',
          type: 'container',
          split: 'horizontal',
          splitType: 'shelves',
          size: 1,
          frame: {
            top: { thickness: 50, material: 'metal', color: '#1e293b' },
            bottom: { thickness: 50, material: 'metal', color: '#1e293b' },
            left: { thickness: 50, material: 'metal', color: '#1e293b' },
            right: { thickness: 50, material: 'metal', color: '#1e293b' },
          },
          children: [
            { id: 'hd-s1', type: 'cell', size: 1, label: 'Shelf 1', displayLabel: 'L1', skin: 'shelf-unit' },
            { id: 'hd-s2', type: 'cell', size: 1, label: 'Shelf 2', displayLabel: 'L2', skin: 'shelf-unit' },
            { id: 'hd-s3', type: 'cell', size: 1, label: 'Shelf 3', displayLabel: 'L3', skin: 'shelf-unit' },
            { id: 'hd-s4', type: 'cell', size: 1, label: 'Shelf 4', displayLabel: 'L4', skin: 'shelf-unit' }
          ]
        }
      },
      { 
        type: 'industrial', 
        label: 'Narrow Aisle Rack', 
        icon: Columns, 
        w: 1350, d: 800, h: 6500, 
        color: '#1e293b', 
        supportsFrontView: true,
        structure: {
          id: 'root-NA',
          type: 'container',
          split: 'horizontal',
          splitType: 'shelves',
          size: 1,
          frame: {
            left: { thickness: 40, material: 'metal', color: '#0f172a' },
            right: { thickness: 40, material: 'metal', color: '#0f172a' },
          },
          children: [
            { id: 'na-s1', type: 'cell', size: 1, label: 'Level 1', displayLabel: 'L1', skin: 'shelf-unit' },
            { id: 'na-s2', type: 'cell', size: 1, label: 'Level 2', displayLabel: 'L2', skin: 'shelf-unit' },
            { id: 'na-s3', type: 'cell', size: 1, label: 'Level 3', displayLabel: 'L3', skin: 'shelf-unit' },
            { id: 'na-s4', type: 'cell', size: 1, label: 'Level 4', displayLabel: 'L4', skin: 'shelf-unit' },
            { id: 'na-s5', type: 'cell', size: 1, label: 'Level 5', displayLabel: 'L5', skin: 'shelf-unit' }
          ]
        }
      },
      { 
        type: 'rectangle', 
        label: 'Shelf Cupboard', 
        icon: Rows, 
        w: 1000, d: 600, h: 2100, 
        color: '#451a03', 
        supportsFrontView: true,
        structure: {
          id: 'root-SC',
          type: 'container',
          split: 'horizontal',
          splitType: 'shelves',
          size: 1,
          frame: {
            top: { thickness: 20, material: 'wood', color: '#78350f' },
            bottom: { thickness: 20, material: 'wood', color: '#78350f' },
            left: { thickness: 20, material: 'wood', color: '#78350f' },
            right: { thickness: 20, material: 'wood', color: '#78350f' },
          },
          children: [
            { id: 'sc-1', type: 'cell', size: 1, label: 'Top Shelf', skin: 'wood' },
            { id: 'sc-2', type: 'cell', size: 1, label: 'Mid Shelf', skin: 'wood' },
            { id: 'sc-3', type: 'cell', size: 1, label: 'Bottom Shelf', skin: 'wood' }
          ]
        }
      },
      { 
        type: 'rectangle', 
        label: 'Column Cupboard', 
        icon: Columns, 
        w: 1200, d: 500, h: 1950, 
        color: '#334155', 
        supportsFrontView: true,
        structure: {
          id: 'root-CC',
          type: 'container',
          split: 'vertical',
          splitType: 'columns',
          size: 1,
          frame: {
            top: { thickness: 15, material: 'metal', color: '#475569' },
            bottom: { thickness: 15, material: 'metal', color: '#475569' },
            left: { thickness: 15, material: 'metal', color: '#475569' },
            right: { thickness: 15, material: 'metal', color: '#475569' },
          },
          children: [
            { id: 'cc-c1', type: 'cell', size: 1, label: 'Column 1', skin: 'metal' },
            { id: 'cc-c2', type: 'cell', size: 1, label: 'Column 2', skin: 'metal' },
            { id: 'cc-c3', type: 'cell', size: 1, label: 'Column 3', skin: 'metal' }
          ]
        }
      }
    ]
  },
  {
    name: 'Small Parts',
    items: [
      { 
        type: 'rectangle', 
        label: 'Wall Bins (L)', 
        icon: LayoutGrid, 
        w: 200, d: 30, h: 150, 
        color: '#0369a1', 
        supportsFrontView: true,
        structure: {
          id: 'root-WB',
          type: 'container',
          split: 'horizontal',
          splitType: 'bins',
          size: 1,
          children: [
            {
              id: 'wb-r1',
              type: 'container',
              split: 'vertical',
              size: 1,
              children: [
                { id: 'wb-r1-c1', type: 'cell', size: 1, skin: 'plastic-box' },
                { id: 'wb-r1-c2', type: 'cell', size: 1, skin: 'plastic-box' },
                { id: 'wb-r1-c3', type: 'cell', size: 1, skin: 'plastic-box' },
                { id: 'wb-r1-c4', type: 'cell', size: 1, skin: 'plastic-box' }
              ]
            },
            {
              id: 'wb-r2',
              type: 'container',
              split: 'vertical',
              size: 1,
              children: [
                { id: 'wb-r2-c1', type: 'cell', size: 1, skin: 'plastic-box' },
                { id: 'wb-r2-c2', type: 'cell', size: 1, skin: 'plastic-box' },
                { id: 'wb-r2-c3', type: 'cell', size: 1, skin: 'plastic-box' },
                { id: 'wb-r2-c4', type: 'cell', size: 1, skin: 'plastic-box' }
              ]
            }
          ]
        }
      }
    ]
  },
  {
    name: 'Zones',
    items: [
      { 
        type: 'zone', 
        label: 'No Access Zone', 
        icon: Square, 
        w: 200, d: 200, h: 0, 
        color: '#f43f5e', 
        secondaryColor: '#9f1239',
        zonePattern: 'stripes' as const,
        zoneType: 'no_access' as const,
        blockPlacement: true,
        supportsFrontView: false 
      },
      { 
        type: 'zone', 
        label: 'Elevator Shaft', 
        icon: Database, 
        w: 300, d: 300, h: 0, 
        color: '#475569', 
        secondaryColor: '#1e293b',
        zonePattern: 'grid' as const,
        zoneType: 'elevator' as const,
        blockPlacement: true,
        supportsFrontView: false 
      },
      { 
        type: 'zone', 
        label: 'Staircase', 
        icon: Rows, 
        w: 150, d: 400, h: 0, 
        color: '#475569', 
        secondaryColor: '#334155',
        zonePattern: 'stripes' as const,
        zoneType: 'stairs' as const,
        blockPlacement: true,
        supportsFrontView: false 
      },
      { 
        type: 'zone', 
        label: 'Quality Control', 
        icon: Square, 
        w: 400, d: 300, h: 0, 
        color: '#a855f7', 
        zonePattern: 'dots' as const,
        zoneType: 'operational' as const,
        supportsFrontView: false 
      },
      { 
        type: 'zone', 
        label: 'Packing Station', 
        icon: Package, 
        w: 200, d: 150, h: 0, 
        color: '#eab308', 
        zoneType: 'operational' as const,
        supportsFrontView: false 
      }
    ]
  },
  {
    name: 'Infrastructure',
    items: [
      { type: 'rectangle', label: 'Support Pillar', icon: Square, w: 60, d: 60, h: 1000, color: '#475569', supportsFrontView: false },
      { type: 'rectangle', label: 'Industrial Door', icon: DoorOpen, w: 250, d: 20, h: 400, color: '#64748b', supportsFrontView: false },
      { type: 'rectangle', label: 'Office Wall', icon: Square, w: 10, d: 500, h: 300, color: '#f8fafc', supportsFrontView: false }
    ]
  }
];
