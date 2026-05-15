import React, { useState } from 'react';
import { 
  Warehouse, 
  Wrench, 
  DoorOpen, 
  Archive, 
  Store, 
  Briefcase, 
  Settings, 
  Layout as LayoutIcon,
  Link,
  Plus,
  ArrowRight,
  ArrowLeft,
  X,
  Maximize2,
  Box,
  Map,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LocationRole, LogicalLocation } from '../../types';

interface BlueprintSetupWizardProps {
  onClose: () => void;
  onConfirm: (data: WizardData) => void;
  locations: LogicalLocation[];
}

export interface WizardData {
  spaceType: string;
  startMode: 'empty' | 'linked';
  name: string;
  locationId?: string;
  width: number;
  depth: number;
  height?: number;
}

const SPACE_TYPES = [
  { 
    id: 'warehouse', 
    label: 'Warehouse', 
    description: 'Large operational storage space with zones, racks, and aisles.',
    icon: Warehouse,
    defaultSize: { w: 10, d: 10, h: 5 }
  },
  { 
    id: 'garage', 
    label: 'Garage', 
    description: 'Small storage or workshop space with cabinets and shelves.',
    icon: Warehouse, // Using Warehouse as fallback or something similar
    defaultSize: { w: 6, d: 5, h: 3 }
  },
  { 
    id: 'workshop', 
    label: 'Workshop', 
    description: 'Workspace with tools, benches, shelves, and parts storage.',
    icon: Wrench,
    defaultSize: { w: 10, d: 8, h: 4 }
  },
  { 
    id: 'storage-room', 
    label: 'Storage Room', 
    description: 'Compact room with shelves, cabinets, and bins.',
    icon: Archive,
    defaultSize: { w: 5, d: 4, h: 3 }
  },
  { 
    id: 'small-parts', 
    label: 'Small Parts Room', 
    description: 'Detailed storage room for bins, kuwetki, drawers, and small items.',
    icon: Box,
    defaultSize: { w: 8, d: 6, h: 3 }
  },
  { 
    id: 'retail', 
    label: 'Retail Backroom', 
    description: 'Back-of-house storage for retail inventory and supplies.',
    icon: Store,
    defaultSize: { w: 12, d: 8, h: 4 }
  },
  { 
    id: 'office', 
    label: 'Office Storage', 
    description: 'Storage area for files, office equipment, and stationery.',
    icon: Briefcase,
    defaultSize: { w: 4, d: 3, h: 2.5 }
  },
  { 
    id: 'custom', 
    label: 'Custom Space', 
    description: 'Start from a blank physical environment with custom rules.',
    icon: Settings,
    defaultSize: { w: 20, d: 15, h: 4 }
  }
];

export default function BlueprintSetupWizard({ onClose, onConfirm, locations }: BlueprintSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    spaceType: 'warehouse',
    startMode: 'empty',
    name: '',
    width: 10,
    depth: 10,
    height: 5
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const selectedType = SPACE_TYPES.find(t => t.id === data.spaceType);

  const filterRecommendedLocations = (locs: LogicalLocation[]) => {
    // Recommend locations that can act as physical roots
    const validRoles = [
      LocationRole.WAREHOUSE,
      LocationRole.ZONE,
      LocationRole.STAGING,
      LocationRole.OTHER
    ];
    return locs.filter(l => validRoles.includes(l.role));
  };

  const handleCreate = () => {
    onConfirm(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-10">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
               <LayoutIcon className="w-5 h-5" />
            </div>
            <div>
               <h2 className="text-xl font-bold text-white tracking-tight">Create Blueprint</h2>
               <p className="text-slate-400 text-xs">Set up the physical space before opening the editor.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex h-1.5 bg-slate-800">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s}
              className={`flex-1 transition-all duration-500 ${s <= step ? 'bg-sky-500' : 'bg-transparent'}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-slate-700">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">What physical space are you planning?</h3>
                  <p className="text-slate-500 text-sm mt-2">Choose the type of environment you want to model.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {SPACE_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setData({ 
                          ...data, 
                          spaceType: type.id,
                          width: type.defaultSize.w,
                          depth: type.defaultSize.d,
                          height: type.defaultSize.h
                        });
                        nextStep();
                      }}
                      className={`p-6 rounded-2xl border transition-all text-left group ${
                        data.spaceType === type.id 
                          ? 'bg-sky-500/10 border-sky-500 shadow-lg shadow-sky-500/10' 
                          : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-all ${
                        data.spaceType === type.id ? 'bg-sky-500 text-slate-900' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600 group-hover:text-slate-200'
                      }`}>
                        <type.icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-2 group-hover:text-sky-400">{type.label}</h4>
                      <p className="text-slate-500 text-[10px] leading-relaxed group-hover:text-slate-400">{type.description}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">How do you want to start?</h3>
                  <p className="text-slate-500 text-sm mt-2">Decide if you want to link this blueprint to a logical location.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => {
                      setData({ ...data, startMode: 'empty' });
                      nextStep();
                    }}
                    className={`p-8 rounded-2xl border transition-all text-left flex gap-6 ${
                      data.startMode === 'empty' 
                        ? 'bg-sky-500/10 border-sky-500 shadow-lg shadow-sky-500/10' 
                        : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-500 shrink-0">
                      <Plus className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white uppercase tracking-widest text-sm mb-2">Start with empty space</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Use this when you want to create the spatial layout first, without logical locations.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setData({ ...data, startMode: 'linked' });
                      nextStep();
                    }}
                    className={`p-8 rounded-2xl border transition-all text-left flex gap-6 ${
                      data.startMode === 'linked' 
                        ? 'bg-sky-500/10 border-sky-500 shadow-lg shadow-sky-500/10' 
                        : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-500 shrink-0">
                      <Link className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white uppercase tracking-widest text-sm mb-2">Link to existing location</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Use this when you already have a logical location like WH-MAIN and want the blueprint to represent that location.
                      </p>
                    </div>
                  </button>

                  <div className="p-8 rounded-2xl border border-slate-800/50 bg-slate-950/20 text-left flex gap-6 opacity-40 cursor-not-allowed">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-700 shrink-0">
                      <Map className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                         <h4 className="font-bold text-slate-600 uppercase tracking-widest text-xs">Start from template</h4>
                         <span className="text-[8px] font-black bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase">Coming Soon</span>
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed mt-2">
                        Fast starting point like garage, small warehouse, storage room, etc.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Configure Your Space</h3>
                  <p className="text-slate-500 text-sm mt-2">Define the dimensions and properties of your blueprint.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Blueprint Name</label>
                      <input 
                        type="text" 
                        value={data.name}
                        onChange={e => setData({ ...data, name: e.target.value })}
                        placeholder={data.startMode === 'linked' ? 'Select location to generate name' : 'e.g. Main Warehouse Plan'}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-bold placeholder:text-slate-600"
                      />
                    </div>

                    {data.startMode === 'linked' && (
                      <div className="space-y-4">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Link to Logical Root</label>
                        <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
                           <p className="text-[10px] text-slate-500 leading-relaxed italic mb-4">
                             Choose a location that represents a whole physical space. Smaller storage objects can be added inside the blueprint later.
                           </p>
                           <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                             {filterRecommendedLocations(locations).map(loc => (
                               <button
                                 key={loc.id}
                                 onClick={() => setData({ ...data, locationId: loc.id, name: `${loc.name} Blueprint` })}
                                 className={`w-full p-3 rounded-lg border flex items-center justify-between group transition-all ${
                                   data.locationId === loc.id 
                                     ? 'bg-sky-500/10 border-sky-500 shadow-md shadow-sky-500/5' 
                                     : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                                 }`}
                               >
                                 <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${loc.color || 'bg-slate-700 text-slate-400'}`}>
                                      <Warehouse className="w-4 h-4" />
                                   </div>
                                   <div className="text-left">
                                      <p className="text-[10px] font-black text-white group-hover:text-sky-400 uppercase tracking-tight">{loc.name}</p>
                                      <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{loc.code}</p>
                                   </div>
                                 </div>
                                 {data.locationId === loc.id && <CheckCircle2 className="w-4 h-4 text-sky-500" />}
                               </button>
                             ))}
                           </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Width (m)</label>
                        <input 
                          type="number" 
                          value={data.width}
                          onChange={e => setData({ ...data, width: Number(e.target.value) })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-sky-500 transition-all font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Depth (m)</label>
                        <input 
                          type="number" 
                          value={data.depth}
                          onChange={e => setData({ ...data, depth: Number(e.target.value) })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-sky-500 transition-all font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:flex flex-col items-center justify-center p-10 bg-slate-950/40 border border-slate-800 border-dashed rounded-3xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
                      <div 
                        className="relative bg-sky-500/10 border-2 border-sky-500 rounded shadow-[0_0_50px_rgba(14,165,233,0.15)] flex items-center justify-center overflow-hidden group"
                        style={{ 
                          width: Math.min(240, data.width * 5), 
                          height: Math.min(240, data.depth * 5),
                          maxWidth: '240px',
                          maxHeight: '240px'
                        }}
                      >
                         <div className="absolute inset-0 bg-sky-500/5 animate-pulse"></div>
                         <Maximize2 className="w-8 h-8 text-sky-500/40 group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <p className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] relative z-10">Space Preview</p>
                      <div className="mt-2 flex gap-4 text-[10px] font-mono font-bold text-sky-500/60 relative z-10">
                        <span>W: {data.width}m</span>
                        <span>D: {data.depth}m</span>
                      </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/5">
                     <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">Ready to create!</h3>
                    <p className="text-slate-500 text-sm mt-2">Review your blueprint settings before entering the workspace.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                      <div className="px-5 py-4 border-b border-slate-700 bg-slate-700/30">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Blueprint Identity</span>
                      </div>
                      <div className="p-6 space-y-4">
                         <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Name</p>
                            <p className="text-white font-bold mt-1 uppercase tracking-tight">{data.name || 'Untitled Blueprint'}</p>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="flex-1">
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Physical Space</p>
                               <p className="text-slate-300 font-bold mt-1 flex items-center gap-2">
                                  {selectedType?.icon && <selectedType.icon className="w-3.5 h-3.5" />}
                                  {selectedType?.label}
                               </p>
                            </div>
                            <div className="flex-1">
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Starting Mode</p>
                               <p className="text-sky-400 font-bold mt-1 flex items-center gap-2">
                                  {data.startMode === 'empty' ? <Plus className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
                                  {data.startMode === 'empty' ? 'Spatial-First' : 'Location-Linked'}
                                </p>
                            </div>
                         </div>
                         {data.startMode === 'linked' && (
                           <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Linked Root Location</p>
                              <div className="mt-2 p-3 rounded-xl bg-slate-900 border border-slate-700 flex items-center gap-3">
                                 <Warehouse className="w-4 h-4 text-emerald-500" />
                                 <span className="text-xs font-bold text-slate-300">{locations.find(l => l.id === data.locationId)?.name}</span>
                              </div>
                           </div>
                         )}
                      </div>
                   </div>

                   <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                      <div className="px-5 py-4 border-b border-slate-700 bg-slate-700/30">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Spatial Geometry</span>
                      </div>
                      <div className="p-6 space-y-4">
                         <div className="flex items-center gap-4">
                            <div className="flex-1">
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Width</p>
                               <p className="text-white font-mono font-bold mt-1 text-lg">{data.width} m</p>
                            </div>
                            <div className="flex-1">
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Depth</p>
                               <p className="text-white font-mono font-bold mt-1 text-lg">{data.depth} m</p>
                            </div>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Shape</p>
                            <p className="text-slate-300 font-bold mt-1">Rectangle (Standard Footprint)</p>
                         </div>
                         <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                            <p className="text-[10px] text-amber-500 leading-relaxed font-medium">
                               You will enter the workspace editor with a bounded room. You can place visual objects, create from templates, or assign logical locations.
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-white/5 bg-slate-950/40 flex items-center justify-between">
          <button 
            onClick={step === 1 ? onClose : prevStep}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <button 
            onClick={step === 4 ? handleCreate : nextStep}
            disabled={step === 3 && (!data.name || (data.startMode === 'linked' && !data.locationId))}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-xl ${
              step === 3 && (!data.name || (data.startMode === 'linked' && !data.locationId))
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-sky-500 text-slate-900 hover:bg-sky-400 shadow-sky-500/20'
            }`}
          >
            {step === 4 ? 'Create Blueprint' : 'Next Step'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
