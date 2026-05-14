/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum LocationType {
  WAREHOUSE = 'warehouse',
  ZONE = 'zone',
  AISLE = 'aisle',
  RACK = 'rack',
  SHELF = 'shelf',
  BIN = 'bin',
  DRAWER = 'drawer',
  POSITION = 'position',
  PALLET_POSITION = 'pallet_position',
  WORKBENCH = 'workbench',
  RECEIVING = 'receiving',
  SHIPPING = 'shipping',
  RETURNS = 'returns',
  QC = 'qc',
  QUARANTINE = 'quarantine',
  VIRTUAL = 'virtual',
  VEHICLE = 'vehicle',
  STAGING_AREA = 'staging_area',
  OFFICE_STORAGE = 'office_storage',
  BULK_STORAGE = 'bulk_storage',
  OTHER = 'other'
}

export enum MappingStatus {
  UNMAPPED = 'unmapped',
  MAPPED = 'mapped',
  PARTIAL = 'partially_mapped'
}

export enum ViewType {
  TOP_DOWN = 'top_down',
  FRONT = 'front',
  INTERIOR = 'interior',
  DATA = 'data'
}

export interface DimensionsMm {
  widthMm: number;
  heightMm: number;
  depthMm: number;
}

export interface BaseSurface {
  type: 'floor';
  label: string;
  widthMm: number;
  depthMm: number;
  style: {
    fill: string;
    gridColor?: string;
  };
  background?: string;
  gridSizeMm: number;
}

export interface Branch {
  id: string;
  name: string;
}

export interface PhysicalMetadata {
  widthMm?: number;
  heightMm?: number;
  depthMm?: number;
  weightCapacityKg?: number;
  // Legacy fields for compatibility
  width?: number;
  height?: number;
  depth?: number;
  weightCapacity?: number;
}

export interface LocationAssignment {
  defaultSKU?: string;
  allowedCategories?: string[];
  preferredItems?: string[];
}

export interface LocationWarning {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  code: string;
  title: string;
  description?: string;
}

export interface LogicalLocation {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentId: string | null;
  locationCategory: LocationType;
  locationType?: LocationType; // Added for compatibility
  status: 'active' | 'inactive' | 'archived';
  canStoreInventory: boolean;
  isReceivable: boolean;
  isPickable: boolean;
  isVirtual: boolean;
  qrCodeValue?: string;
  barcodeValue?: string;
  sortOrder?: number;
  stockCount?: number;
  skuCount?: number;
  icon?: string;
  color?: string;
  physicalMetadata?: PhysicalMetadata;
  assignment?: LocationAssignment;
  warnings?: LocationWarning[];
  mappedVisualizationCount?: number;
}

export interface LayoutSplitDivider {
  id: string;
  type: 'solid' | 'gap' | 'frame';
  thicknessMm: number; // mm
  thickness?: number; // legacy cm
  color?: string;
  opacity?: number;
  material?: 'wood' | 'metal' | 'plastic' | 'empty' | 'custom';
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  locked?: boolean;
  label?: string;
}

export interface StructureNode {
  id: string;
  nodeKind: 'container' | 'cell';
  type?: 'container' | 'cell'; // Added for compatibility
  splitDirection?: 'horizontal' | 'vertical'; // split direction for containers
  splitType?: 'rows' | 'columns' | 'shelves' | 'bins' | 'drawers' | 'positions';
  sizeValue: number; // relative weight/ratio
  sizeMode?: 'ratio' | 'fixed'; // Added for compatibility
  size?: number; // Added for compatibility
  children?: StructureNode[];
  locationId?: string | null;
  label?: string; // Full structural name
  displayLabel?: string; // Short code (R1, K05, etc)
  color?: string;
  skin?: string;
  locked?: boolean;
  dividers?: (LayoutSplitDivider | null)[]; // N-1 dividers between N children
  frame?: {
    top?: LayoutSplitDivider | null;
    bottom?: LayoutSplitDivider | null;
    left?: LayoutSplitDivider | null;
    right?: LayoutSplitDivider | null;
    thicknessMm?: number;
  };
  widthMm?: number;
  heightMm?: number;
  depthMm?: number;
  width?: number; // legacy
  height?: number; // legacy
  depth?: number; // legacy
}

export type ZonePattern = 'solid' | 'stripes-thin' | 'stripes-wide' | 'dots' | 'grid' | 'diagonal-thin' | 'diagonal-wide';
export type ZoneType = 'no_access' | 'elevator' | 'stairs' | 'operational' | 'storage' | 'infrastructure';

export interface VisualNodeStyle {
  fill: string;
  secondaryFill?: string;
  variant?: string;
  opacity?: number;
  secondaryOpacity?: number;
  cornerRadiusTopLeft?: number;
  cornerRadiusTopRight?: number;
  cornerRadiusBottomRight?: number;
  cornerRadiusBottomLeft?: number;
  isCornerRadiusLocked?: boolean;
}

export interface FrontConfiguration {
  isConfigured: boolean;
  splitTreeId?: string; // Reference to a splitTree
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export interface VisualNode {
  id: string;
  layoutId: string;
  locationId: string | null; // Link to LogicalLocation
  visualizationType: 'rectangle' | 'circle' | 'industrial' | 'zone' | 'pillar' | 'dock' | 'workbench' | 'rack' | 'cabinet' | 'shelf' | 'bin' | 'desk';
  label: string;
  type?: 'rectangle' | 'circle' | 'industrial' | 'zone' | 'pillar' | 'dock' | 'workbench' | 'rack' | 'cabinet' | 'shelf' | 'bin' | 'desk'; // legacy
  xMm: number;
  yMm: number;
  zMm: number;
  rotationDeg: number;
  rotation?: number; // legacy
  widthMm: number;
  heightMm: number;
  depthMm: number;
  width?: number; // legacy
  height?: number; // legacy
  depth?: number; // legacy
  viewType: ViewType;
  parentId?: string | null; // Restore parentId
  parentVisualNodeId: string | null;
  color?: string; // Direct color access
  secondaryColor?: string;
  opacity?: number;
  primaryOpacity?: number;
  secondaryOpacity?: number;
  style: VisualNodeStyle;
  front?: FrontConfiguration;
  structure?: StructureNode; // Add back for legacy
  supportsInteriorView?: boolean;
  supportsFrontView?: boolean; // Add back
  frontSetupDone?: boolean; // Add back
  zonePattern?: ZonePattern;
  blockPlacement?: boolean;
  zoneType?: ZoneType;
  locked?: boolean;
}

export interface SplitTreeEntry {
  id: string;
  layoutId: string;
  parentVisualNodeId: string;
  viewType: ViewType;
  root: StructureNode;
}

export interface Layout {
  id: string;
  branchId: string;
  rootLocationId: string | null;
  name: string;
  status: 'draft' | 'published';
  lastEdited: string;
  thumbnail?: string;
  baseSurface: BaseSurface;
}

export interface PreviewPayload {
  layout: Layout;
  locations: LogicalLocation[];
  visualNodes: VisualNode[];
  splitTrees: SplitTreeEntry[];
}
