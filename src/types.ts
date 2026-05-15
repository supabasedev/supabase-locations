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

export enum ViewMode {
  TOP_DOWN = 'top-down',
  FRONT = 'front'
}

export enum VisualNodeRole {
  LOCATION_REPRESENTATION = 'location_representation',
  UNASSIGNED_STORAGE = 'unassigned_storage',
  INFRASTRUCTURE = 'infrastructure',
  ANNOTATION = 'annotation',
  OBSTACLE = 'obstacle'
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export interface PhysicalMetadata {
  width?: number; // cm
  height?: number; // cm
  depth?: number; // cm
  weightCapacity?: number; // kg
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
  locationType: LocationType;
  status: 'active' | 'inactive' | 'archived';
  allowsStock: boolean;
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
  thickness: number; // cm
  color?: string;
  opacity?: number;
  material?: 'wood' | 'metal' | 'plastic' | 'empty' | 'custom';
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  locked?: boolean;
  label?: string;
}

export interface StructureNode {
  id: string;
  type: 'container' | 'cell';
  split?: 'horizontal' | 'vertical'; // split direction for containers
  splitType?: 'rows' | 'columns' | 'shelves' | 'bins' | 'drawers' | 'positions';
  size: number; // relative weight/ratio
  children?: StructureNode[];
  locationId?: string | null;
  label?: string; // Full structural name
  displayLabel?: string; // Short code (R1, K05, etc)
  color?: string;
  skin?: string;
  locked?: boolean;
  dividers?: (LayoutSplitDivider | null)[]; // N-1 dividers between N children
  frame?: {
    top?: LayoutSplitDivider;
    bottom?: LayoutSplitDivider;
    left?: LayoutSplitDivider;
    right?: LayoutSplitDivider;
  };
}

export type ZonePattern = 'solid' | 'stripes-thin' | 'stripes-wide' | 'dots' | 'grid' | 'diagonal-thin' | 'diagonal-wide';
export type ZoneType = 'no_access' | 'elevator' | 'stairs' | 'operational' | 'storage' | 'infrastructure';

export interface VisualNodeStyle {
  cornerRadiusTopLeft?: number;
  cornerRadiusTopRight?: number;
  cornerRadiusBottomRight?: number;
  cornerRadiusBottomLeft?: number;
  isCornerRadiusLocked?: boolean;
}

export interface VisualNode {
  id: string;
  layoutId: string;
  locationId: string | null; // Link to LogicalLocation
  type: 'rectangle' | 'circle' | 'industrial' | 'zone';
  label: string;
  x: number; // cm
  y: number; // cm
  z: number; // cm
  rotation: number;
  width: number; // cm
  height: number; // cm
  depth: number; // cm
  color: string;
  viewMode: ViewMode;
  parentId: string | null; // For nested visuals like bins in a cabinet
  supportsFrontView?: boolean;
  frontSetupDone?: boolean;
  frontSide?: 'top' | 'bottom' | 'left' | 'right';
  structure?: StructureNode;
  style?: VisualNodeStyle;
  supportsInteriorView?: boolean;
  zonePattern?: ZonePattern;
  secondaryColor?: string;
  primaryOpacity?: number;
  secondaryOpacity?: number;
  blockPlacement?: boolean;
  zoneType?: ZoneType;
  opacity?: number;
  locked?: boolean;
  nodeRole?: VisualNodeRole;
}

export interface Layout {
  id: string;
  branchId: string;
  rootLocationId?: string | null;
  name: string;
  status: 'draft' | 'published';
  lastEdited: string;
  thumbnail?: string;
}

export interface Branch {
  id: string;
  name: string;
}
