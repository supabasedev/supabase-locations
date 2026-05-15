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

export enum LocationRole {
  WAREHOUSE = 'WAREHOUSE',
  ZONE = 'ZONE',
  AISLE = 'AISLE',
  RACK = 'RACK',
  SHELF = 'SHELF',
  BIN = 'BIN',
  STAGING = 'STAGING',
  RECEIVING = 'RECEIVING',
  SHIPPING = 'SHIPPING',
  RETURNS = 'RETURNS',
  QUARANTINE = 'QUARANTINE',
  TRANSIT = 'TRANSIT',
  ADJUSTMENT = 'ADJUSTMENT',
  VIRTUAL = 'VIRTUAL',
  STORAGE = 'STORAGE',
  OTHER = 'OTHER'
}

export interface LocationCapabilities {
  canStoreInventory: boolean;
  canReceive: boolean;
  canPick: boolean;
  canShip: boolean;
  canReserve: boolean;
  isVirtual: boolean;
  isTemporary: boolean;
}

export interface LogicalLocation {
  id: string;
  branchId: string;
  parentId: string | null;
  code: string;
  name: string;
  description?: string;
  pathCode: string;
  pathName: string;
  status: 'active' | 'inactive' | 'archived' | 'locked';
  role: LocationRole;
  capabilities: LocationCapabilities;
  physical?: {
    qrCode?: string;
    notes?: string;
  };
  // UI and legacy fields
  icon?: string;
  color?: string;
  isVirtual?: boolean;
  sortOrder?: number;
  physicalMetadata?: PhysicalMetadata;
  assignment?: LocationAssignment;
  stockCount?: number;
  skuCount?: number;
  warnings?: LocationWarning[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
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
export type ZoneType = 'no_access' | 'elevator' | 'stairs' | 'operational' | 'storage' | 'infrastructure' | 'quarantine';

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
