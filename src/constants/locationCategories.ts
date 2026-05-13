import { LocationType } from '../types';

export type LocationCategoryDefinition = {
  id: LocationType;
  label: string;
  description: string;
  iconName: string;
  color?: string;
  defaults: {
    storesInventory?: boolean;
    pickable?: boolean;
    receivable?: boolean;
    virtual?: boolean;
  };
  suggestedChildren?: LocationType[];
};

export const LOCATION_CATEGORIES: Record<LocationType, LocationCategoryDefinition> = {
  [LocationType.WAREHOUSE]: {
    id: LocationType.WAREHOUSE,
    label: 'Warehouse',
    description: 'Primary organizational root location',
    iconName: 'Database',
    color: 'text-sky-400',
    defaults: { storesInventory: false, pickable: false, receivable: false, virtual: false },
    suggestedChildren: [LocationType.ZONE, LocationType.STAGING_AREA, LocationType.BULK_STORAGE]
  },
  [LocationType.ZONE]: {
    id: LocationType.ZONE,
    label: 'Zone',
    description: 'Broad warehouse area division',
    iconName: 'Layers',
    color: 'text-indigo-400',
    defaults: { storesInventory: false, pickable: false, receivable: false, virtual: false },
    suggestedChildren: [LocationType.AISLE, LocationType.RACK, LocationType.SHELF]
  },
  [LocationType.AISLE]: {
    id: LocationType.AISLE,
    label: 'Aisle',
    description: 'Passageway between storage structures',
    iconName: 'ArrowRightLeft',
    color: 'text-slate-400',
    defaults: { storesInventory: false, pickable: false, receivable: false, virtual: false },
    suggestedChildren: [LocationType.RACK, LocationType.SHELF]
  },
  [LocationType.RACK]: {
    id: LocationType.RACK,
    label: 'Rack',
    description: 'Physical vertical storage structure',
    iconName: 'Server',
    color: 'text-blue-400',
    defaults: { storesInventory: false, pickable: false, receivable: false, virtual: false },
    suggestedChildren: [LocationType.SHELF, LocationType.BIN]
  },
  [LocationType.SHELF]: {
    id: LocationType.SHELF,
    label: 'Shelf',
    description: 'Horizontal storage level',
    iconName: 'Layout',
    color: 'text-emerald-400',
    defaults: { storesInventory: true, pickable: true, receivable: true, virtual: false },
    suggestedChildren: [LocationType.BIN, LocationType.DRAWER]
  },
  [LocationType.BIN]: {
    id: LocationType.BIN,
    label: 'Bin',
    description: 'Precise stock storage location',
    iconName: 'Box',
    color: 'text-amber-400',
    defaults: { storesInventory: true, pickable: true, receivable: true, virtual: false }
  },
  [LocationType.DRAWER]: {
    id: LocationType.DRAWER,
    label: 'Drawer',
    description: 'Small compartmentalized storage',
    iconName: 'Archive',
    color: 'text-orange-400',
    defaults: { storesInventory: true, pickable: true, receivable: true, virtual: false }
  },
  [LocationType.PALLET_POSITION]: {
    id: LocationType.PALLET_POSITION,
    label: 'Pallet Position',
    description: 'Floor or rack space for a full pallet',
    iconName: 'MapPin',
    color: 'text-yellow-500',
    defaults: { storesInventory: true, pickable: true, receivable: true, virtual: false }
  },
  [LocationType.WORKBENCH]: {
    id: LocationType.WORKBENCH,
    label: 'Workbench',
    description: 'Station for assembly or processing',
    iconName: 'Construction',
    color: 'text-rose-400',
    defaults: { storesInventory: true, pickable: false, receivable: true, virtual: false }
  },
  [LocationType.RECEIVING]: {
    id: LocationType.RECEIVING,
    label: 'Receiving',
    description: 'Inbound inventory staging area',
    iconName: 'Inbox',
    color: 'text-emerald-500',
    defaults: { storesInventory: true, pickable: false, receivable: true, virtual: false }
  },
  [LocationType.SHIPPING]: {
    id: LocationType.SHIPPING,
    label: 'Shipping',
    description: 'Outbound dispatch staging area',
    iconName: 'Truck',
    color: 'text-blue-500',
    defaults: { storesInventory: true, pickable: true, receivable: false, virtual: false }
  },
  [LocationType.RETURNS]: {
    id: LocationType.RETURNS,
    label: 'Returns',
    description: 'Returned goods processing area',
    iconName: 'RotateCcw',
    color: 'text-purple-400',
    defaults: { storesInventory: true, pickable: false, receivable: true, virtual: false }
  },
  [LocationType.QC]: {
    id: LocationType.QC,
    label: 'QC',
    description: 'Quality control / inspection location',
    iconName: 'CheckSquare',
    color: 'text-cyan-400',
    defaults: { storesInventory: true, pickable: false, receivable: false, virtual: false }
  },
  [LocationType.QUARANTINE]: {
    id: LocationType.QUARANTINE,
    label: 'Quarantine',
    description: 'Restricted area for non-conforming goods',
    iconName: 'ShieldAlert',
    color: 'text-red-500',
    defaults: { storesInventory: true, pickable: false, receivable: false, virtual: false }
  },
  [LocationType.VIRTUAL]: {
    id: LocationType.VIRTUAL,
    label: 'Virtual',
    description: 'Non-physical operational location',
    iconName: 'Zap',
    color: 'text-fuchsia-400',
    defaults: { storesInventory: true, pickable: true, receivable: true, virtual: true }
  },
  [LocationType.VEHICLE]: {
    id: LocationType.VEHICLE,
    label: 'Vehicle',
    description: 'Mobile storage or transport unit',
    iconName: 'Car',
    color: 'text-slate-300',
    defaults: { storesInventory: true, pickable: true, receivable: true, virtual: false }
  },
  [LocationType.STAGING_AREA]: {
    id: LocationType.STAGING_AREA,
    label: 'Staging Area',
    description: 'Temporary material placement',
    iconName: 'Flag',
    color: 'text-lime-400',
    defaults: { storesInventory: true, pickable: true, receivable: true, virtual: false }
  },
  [LocationType.OFFICE_STORAGE]: {
    id: LocationType.OFFICE_STORAGE,
    label: 'Office Storage',
    description: 'Non-warehouse supply storage',
    iconName: 'Briefcase',
    color: 'text-stone-400',
    defaults: { storesInventory: true, pickable: true, receivable: true, virtual: false }
  },
  [LocationType.BULK_STORAGE]: {
    id: LocationType.BULK_STORAGE,
    label: 'Bulk Storage',
    description: 'Large scale un-racked inventory',
    iconName: 'Archive',
    color: 'text-amber-600',
    defaults: { storesInventory: true, pickable: true, receivable: true, virtual: false }
  },
  [LocationType.OTHER]: {
    id: LocationType.OTHER,
    label: 'Other',
    description: 'Miscellaneous location type',
    iconName: 'Box',
    color: 'text-slate-500',
    defaults: { storesInventory: true, pickable: true, receivable: true, virtual: false }
  }
};
