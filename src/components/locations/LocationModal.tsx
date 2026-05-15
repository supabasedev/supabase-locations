import React, { useState, useEffect } from 'react';
import { 
  X, Database, ChevronRight, ChevronDown, Info, Plus, Check, Maximize2, Scale, Tag, Trash2, Package, 
  Search as SearchIcon, Fingerprint, Construction, Layers, Server, Layout as LayoutIcon, Inbox, Truck, 
  RotateCcw, CheckSquare, ShieldAlert, Car, ShieldCheck, Triangle, Zap, Box, Monitor, MoreHorizontal, 
  LayoutDashboard, Factory, Settings2, ShieldCheck as ShieldCheckIcon, PackageOpen, AlertTriangle, 
  Layers3, Hash, Archive, Flag, Star, Heart, MapPin, Coffee, Briefcase, Key, Hammer, Move, History, Copy, Shield
} from 'lucide-react';
import { LOCATION_CATEGORIES, LocationCategoryDefinition } from '../../constants/locationCategories';

const ALL_ICONS: Record<string, any> = {
  Database, Layers, MapPin, Box, Inbox, Truck, RotateCcw, ShieldAlert, 
  CheckSquare, Server, Construction, Briefcase, Layout: LayoutIcon, Car, Flag,
  ArrowRightLeft: Move, Archive, Shield, Tag, Zap, Star, Heart, Coffee, 
  Key, Hammer, Scale, Maximize2, AlertCircle: ShieldAlert, Clock: History, ExternalLink: MoreHorizontal, 
  Copy, Trash2, Search: SearchIcon, Fingerprint, 
  ShieldCheck, Triangle, Package, Circle: Triangle
};

const IconRenderer = ({ name, className, color }: { name: string, className?: string, color?: string }) => {
  const IconComponent = ALL_ICONS[name] || Box;
  return <IconComponent className={className} color={color} />;
};

const CUSTOM_COLORS = [
  { name: 'Sky', value: 'text-sky-400', bg: 'bg-sky-500' },
  { name: 'Emerald', value: 'text-emerald-400', bg: 'bg-emerald-500' },
  { name: 'Rose', value: 'text-rose-400', bg: 'bg-rose-500' },
  { name: 'Amber', value: 'text-amber-400', bg: 'bg-amber-500' },
  { name: 'Violet', value: 'text-violet-400', bg: 'bg-violet-500' },
  { name: 'Orange', value: 'text-orange-400', bg: 'bg-orange-500' },
  { name: 'Indigo', value: 'text-indigo-400', bg: 'bg-indigo-500' },
  { name: 'Slate', value: 'text-slate-400', bg: 'bg-slate-500' },
];
import { motion, AnimatePresence } from 'motion/react';
import { LogicalLocation, LocationRole } from '../../types';

interface LocationModalProps {
  onClose: () => void;
  onSubmit: (data: Partial<LogicalLocation>) => void;
  locations: LogicalLocation[];
  initialData?: Partial<LogicalLocation>;
}

export default function LocationModal({ onClose, onSubmit, locations, initialData }: LocationModalProps) {
  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    parentId: initialData?.parentId || '',
    role: initialData?.role || LocationRole.STORAGE,
    capabilities: initialData?.capabilities || {
        canStoreInventory: true,
        canReceive: true,
        canPick: true,
        canShip: false,
        canReserve: true,
        isVirtual: false,
        isTemporary: false
    },
    status: initialData?.status || 'active',
    icon: initialData?.icon || '',
    color: initialData?.color || '',
    physicalMetadata: initialData?.physicalMetadata || {
        width: 0,
        height: 0,
        depth: 0,
        weightCapacity: 0
    },
    assignment: initialData?.assignment || {
        defaultSKU: '',
        allowedCategories: []
    }
  });

  const [currentStep, setCurrentStep] = useState<'BASIC' | 'TYPE' | 'PHYSICAL'>('BASIC');

  const handleRoleSelect = (role: LocationRole) => {
    const category = LOCATION_CATEGORIES[role];
    if (!category) return;

    setFormData(prev => ({
        ...prev,
        role: role,
        capabilities: {
            ...prev.capabilities,
            canStoreInventory: category.defaults.canStoreInventory ?? true,
            canReceive: category.defaults.canReceive ?? true,
            canPick: category.defaults.canPick ?? true,
            canShip: category.defaults.canShip ?? false,
            canReserve: category.defaults.canReserve ?? true,
            isVirtual: category.defaults.isVirtual ?? false
        }
    }));
  };

  const getLocationPathString = (parentId: string) => {
    if (!parentId) return 'ROOT';
    const path: string[] = [];
    let current = locations.find(l => l.id === parentId);
    while(current) {
        path.unshift(current.code);
        current = locations.find(l => l.id === current?.parentId);
    }
    return 'ROOT / ' + path.join(' / ');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[900px]"
      >
        <div className="flex bg-slate-950/50 border-b border-slate-800 shrink-0">
           <div className="flex-1 p-6 flex items-center gap-4 border-r border-slate-800 bg-slate-900">
              <div className="p-2.5 rounded-xl border bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-[0_0_20px_rgba(56,189,248,0.1)]">
                 <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight">{initialData?.code ? 'Edit Location' : 'Create Logical Location'}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Path Preview:</p>
                  <p className="text-xs font-mono text-slate-400">{getLocationPathString(formData.parentId)} {formData.code && <span className="text-sky-400">/ {formData.code}</span>}</p>
                </div>
              </div>
           </div>
           <button onClick={onClose} className="p-6 text-slate-500 hover:text-white border-l border-slate-800 transition-colors">
              <X className="w-5 h-5" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 flex flex-col">
          
          {/* Header Tabs/Steps */}
          <div className="flex px-8 pt-6 border-b border-slate-800 bg-slate-900/50">
              <button 
                onClick={() => setCurrentStep('BASIC')}
                className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${currentStep === 'BASIC' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${currentStep === 'BASIC' ? 'bg-sky-500/10 border-sky-500' : 'border-slate-700 bg-slate-800'}`}>1</div>
                Identity
              </button>
              <button 
                onClick={() => setCurrentStep('TYPE')}
                className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${currentStep === 'TYPE' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${currentStep === 'TYPE' ? 'bg-sky-500/10 border-sky-500' : 'border-slate-700 bg-slate-800'}`}>2</div>
                Type & Capability
              </button>
              <button 
                onClick={() => setCurrentStep('PHYSICAL')}
                className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${currentStep === 'PHYSICAL' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${currentStep === 'PHYSICAL' ? 'bg-sky-500/10 border-sky-500' : 'border-slate-700 bg-slate-800'}`}>3</div>
                Operational Logic
              </button>
          </div>

          <div className="p-8 pb-10">
            <AnimatePresence mode="wait">
              {currentStep === 'BASIC' && (
                <motion.div 
                  key="basic"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="max-w-xl mx-auto space-y-8"
                >
                  <div className="bg-slate-800/20 p-8 rounded-3xl border border-slate-700/50 space-y-6">
                      <Input 
                          label="Location Code" 
                          placeholder="e.g. WH-A-01" 
                          value={formData.code}
                          onChange={(v) => setFormData({ ...formData, code: v })}
                      />
                      <Input 
                          label="Display Name" 
                          placeholder="e.g. Main Warehouse" 
                          value={formData.name}
                          onChange={(v) => setFormData({ ...formData, name: v })}
                      />
                      <Select 
                          label="Parent Selection"
                          options={[ { value: '', label: 'None (System Root)' }, ...locations.filter(l => l.id !== initialData?.id).map(l => ({ value: l.id, label: `${getLocationPathString(l.parentId)} / ${l.code}` }))] }
                          value={formData.parentId}
                          onChange={(v) => setFormData({ ...formData, parentId: v })}
                      />
                      <Input 
                          label="Description" 
                          placeholder="Define the operational purpose..." 
                          value={formData.description}
                          onChange={(v) => setFormData({ ...formData, description: v })}
                      />
                  </div>
                </motion.div>
              )}

              {currentStep === 'TYPE' && (
                <motion.div
                  key="type"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-12 gap-8"
                >
                  {/* Left: Type Tiles */}
                  <div className="col-span-7 space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Rich Categories</label>
                        <div className="grid grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                            {(Object.values(LOCATION_CATEGORIES) as LocationCategoryDefinition[]).map((cat) => {
                                const active = formData.role === cat.id;
                                return (
                                    <div 
                                        key={cat.id} 
                                        onClick={() => handleRoleSelect(cat.id)}
                                        className={`flex flex-col gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] ${
                                            active 
                                              ? 'bg-sky-500/10 border-sky-500 shadow-[0_0_20px_rgba(56,189,248,0.1)]' 
                                              : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                          <div className={`p-2 rounded-xl shrink-0 ${active ? 'bg-sky-500 text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-600'}`}>
                                              <IconRenderer name={cat.iconName} className="w-5 h-5" />
                                          </div>
                                          {active && <Check className="w-4 h-4 text-sky-400" />}
                                        </div>
                                        <div>
                                          <span className={`text-[11px] font-black uppercase tracking-widest block mb-0.5 ${active ? 'text-white' : 'text-slate-300'}`}>
                                              {cat.label}
                                          </span>
                                          <span className="text-[9.5px] text-slate-500 font-medium leading-relaxed block h-8 overflow-hidden line-clamp-2">
                                              {cat.description}
                                          </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                  </div>

                  {/* Right: Capability Overrides */}
                  <div className="col-span-5 space-y-6">
                      <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10 flex gap-3">
                         <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                            <Zap className="w-4 h-4 text-sky-400" />
                         </div>
                         <p className="text-[10px] text-sky-400/80 leading-relaxed font-bold uppercase tracking-tight">
                            Capabilities derived from <span className="text-sky-300">{LOCATION_CATEGORIES[formData.role]?.label}</span>. Manual overrides allowed.
                         </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <BehaviorToggle 
                            icon={<Database className="w-4 h-4" />} 
                            label="Allows Stock" 
                            checked={formData.capabilities.canStoreInventory} 
                            onChange={(v) => setFormData({ ...formData, capabilities: { ...formData.capabilities, canStoreInventory: v } })}
                        />
                        <BehaviorToggle 
                            icon={<Inbox className="w-4 h-4" />} 
                            label="Receivable" 
                            checked={formData.capabilities.canReceive} 
                            onChange={(v) => setFormData({ ...formData, capabilities: { ...formData.capabilities, canReceive: v } })}
                        />
                        <BehaviorToggle 
                            icon={<RotateCcw className="w-4 h-4" />} 
                            label="Pickable" 
                            checked={formData.capabilities.canPick} 
                            onChange={(v) => setFormData({ ...formData, capabilities: { ...formData.capabilities, canPick: v } })}
                        />
                        <BehaviorToggle 
                            icon={<ShieldCheckIcon className="w-4 h-4" />} 
                            label="Operational Only (Virtual)" 
                            checked={formData.capabilities.isVirtual} 
                            onChange={(v) => setFormData({ ...formData, capabilities: { ...formData.capabilities, isVirtual: v } })}
                        />
                      </div>

                      <div className="space-y-4 pt-6 mt-6 border-t border-slate-800">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Icon & Color Overrides</label>
                          <div className="flex flex-wrap gap-2">
                             {['Archive', 'Shield', 'Tag', 'Flag', 'Zap', 'Star', 'Heart', 'MapPin', 'Coffee', 'Briefcase', 'Key', 'Hammer'].map(iconName => (
                               <button
                                 key={iconName}
                                 onClick={() => setFormData({ ...formData, icon: formData.icon === iconName ? '' : iconName })}
                                 className={`p-2.5 rounded-xl border transition-all ${formData.icon === iconName ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-lg scale-110' : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'}`}
                               >
                                 <IconRenderer name={iconName} className="w-4 h-4" />
                               </button>
                             ))}
                          </div>

                          <div className="flex gap-2">
                             {['text-sky-400', 'text-emerald-400', 'text-rose-400', 'text-amber-400', 'text-violet-400', 'text-orange-400', 'text-indigo-400', 'text-slate-400'].map(c => (
                               <button
                                 key={c}
                                 onClick={() => setFormData({ ...formData, color: formData.color === c ? '' : c })}
                                 className={`w-7 h-7 rounded-full border-2 transition-all p-0.5 ${formData.color === c ? 'border-sky-500' : 'border-slate-800 hover:border-slate-600'}`}
                               >
                                  <div className={`w-full h-full rounded-full ${c.replace('text', 'bg').replace('-400', '-500')}`} />
                               </button>
                             ))}
                          </div>
                      </div>
                  </div>
                </motion.div>
              )}
              {currentStep === 'PHYSICAL' && (
                <motion.div
                   key="physical"
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.98 }}
                   className="grid grid-cols-2 gap-12 max-w-4xl mx-auto"
                >
                   {/* Physical Specs */}
                   <div className="space-y-8">
                      <div className="flex items-center gap-3 mb-2">
                        <Maximize2 className="w-4 h-4 text-sky-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Physical Specification</h3>
                      </div>
                      <div className="bg-slate-800/20 p-8 rounded-3xl border border-slate-700/50 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <Input label="Width (mm)" value={formData.physicalMetadata.width?.toString() || ''} onChange={(v) => setFormData({ ...formData, physicalMetadata: { ...formData.physicalMetadata, width: parseInt(v) || 0 }})} isNumber />
                          <Input label="Height (mm)" value={formData.physicalMetadata.height?.toString() || ''} onChange={(v) => setFormData({ ...formData, physicalMetadata: { ...formData.physicalMetadata, height: parseInt(v) || 0 }})} isNumber />
                          <Input label="Depth (mm)" value={formData.physicalMetadata.depth?.toString() || ''} onChange={(v) => setFormData({ ...formData, physicalMetadata: { ...formData.physicalMetadata, depth: parseInt(v) || 0 }})} isNumber />
                          <Input label="Weight Cap (kg)" value={formData.physicalMetadata.weightCapacity?.toString() || ''} onChange={(v) => setFormData({ ...formData, physicalMetadata: { ...formData.physicalMetadata, weightCapacity: parseInt(v) || 0 }})} isNumber />
                        </div>
                      </div>
                   </div>

                   {/* Logical Assignments */}
                   <div className="space-y-8">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckSquare className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Operational Assignments</h3>
                      </div>
                      <div className="bg-slate-800/20 p-8 rounded-3xl border border-slate-700/50 space-y-6">
                         <Input 
                            label="Default SKU Assignment" 
                            placeholder="e.g. SKU-1234-AX" 
                            value={formData.assignment.defaultSKU || ''} 
                            onChange={(v) => setFormData({ ...formData, assignment: { ...formData.assignment, defaultSKU: v }})} 
                         />
                         <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Allowed Categories</label>
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight mt-1 mb-3 italic">Coming soon: Advanced SKU matching</p>
                            <div className="flex flex-wrap gap-2 opacity-50 pointer-events-none">
                               <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-black text-slate-500 uppercase">Perishables</div>
                               <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-black text-slate-500 uppercase">Hazmat</div>
                               <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase">Standard</div>
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0 px-10">
           <div className="flex gap-4">
             {currentStep !== 'BASIC' && (
                <button 
                  onClick={() => setCurrentStep(currentStep === 'PHYSICAL' ? 'TYPE' : 'BASIC')}
                  className="px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition-all bg-slate-800 hover:bg-slate-700"
                >
                  Previous
                </button>
             )}
             <button 
               onClick={onClose}
               className="px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-all"
             >
               Discard
             </button>
           </div>

           <div className="flex gap-4">
             {currentStep !== 'PHYSICAL' ? (
                <button 
                  onClick={() => setCurrentStep(currentStep === 'BASIC' ? 'TYPE' : 'PHYSICAL')}
                  className="px-8 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-950 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95"
                >
                  Continue Steps <ChevronRight className="w-4 h-4" />
                </button>
             ) : (
                <button 
                  onClick={() => onSubmit(formData)}
                  className="px-10 py-3 rounded-2xl bg-sky-500 text-slate-950 font-black text-[10px] uppercase tracking-widest hover:bg-sky-400 transition-all shadow-[0_0_30px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95"
                >
                  {initialData?.code ? 'Update Entity' : 'Finalize Creation'}
                </button>
             )}
           </div>
        </div>
      </motion.div>
    </div>
  );
}

function BehaviorToggle({ icon, label, checked, onChange }: { icon: React.ReactNode, label: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <div 
            onClick={() => onChange(!checked)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                checked 
                  ? 'bg-emerald-500/5 border-emerald-500/30' 
                  : 'bg-slate-800/20 border-slate-800 hover:border-slate-700'
            }`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${checked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-600'}`}>
                    {icon}
                </div>
                <h4 className={`text-[11px] font-black uppercase tracking-widest ${checked ? 'text-emerald-50' : 'text-slate-400'}`}>{label}</h4>
            </div>
            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-700'}`}>
               <div className={`w-3 h-3 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
        </div>
    )
}

function Input({ label, placeholder, value, onChange, isNumber }: { label: string, placeholder?: string, value: string, onChange: (v: string) => void, isNumber?: boolean }) {
  return (
    <div className="space-y-2 relative">
       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{label}</label>
       <input 
         type={isNumber ? "number" : "text"} 
         placeholder={placeholder}
         value={value}
         onChange={(e) => onChange(e.target.value)}
         className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs font-bold text-white focus:ring-1 focus:ring-sky-500/50 outline-none transition-all placeholder:text-slate-700 placeholder:font-normal"
       />
    </div>
  );
}

function Select({ label, options, value, onChange }: { label: string, options: string[] | {value: string, label: string}[], value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2 relative">
       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{label}</label>
       <select 
         value={value}
         onChange={(e) => onChange(e.target.value)}
         className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs font-bold text-white focus:ring-1 focus:ring-sky-500/50 outline-none transition-all appearance-none cursor-pointer"
       >
         {options.map((opt: any) => (
           <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
             {typeof opt === 'string' ? opt : opt.label}
           </option>
         ))}
       </select>
       <div className="absolute right-4 top-[35px] pointer-events-none">
          <ChevronDown className="w-4 h-4 text-slate-600" />
       </div>
    </div>
  );
}
