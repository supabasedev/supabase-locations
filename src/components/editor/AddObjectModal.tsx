import React, { useState } from 'react';
import { 
  X, 
  Box, 
  MapPin, 
  Link as LinkIcon, 
  Layers, 
  ChevronRight,
  Database,
  Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LocationType, LogicalLocation } from '../../types';

interface AddObjectModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  locations: LogicalLocation[];
  forceMode?: Mode;
}

type Mode = 'visual' | 'location' | 'both';

export default function AddObjectModal({ onClose, onSubmit, locations, forceMode }: AddObjectModalProps) {
  const [mode, setMode] = useState<Mode>(forceMode || 'visual');
  const [formData, setFormData] = useState({
    label: '',
    code: '',
    name: '',
    locationType: LocationType.RACK,
    parentId: '',
    dimensions: { width: 100, height: 200, depth: 60 } // These are now in CM
  });

  const handleSubmit = () => {
    // Convert CM back to MM for internal state
    const submittedData = {
      ...formData,
      dimensions: {
        width: Math.round(formData.dimensions.width) * 10,
        height: Math.round(formData.dimensions.height) * 10,
        depth: Math.round(formData.dimensions.depth) * 10
      },
      type: mode
    };
    onSubmit(submittedData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* HeaderTabs */}
        <div className="flex bg-slate-950/50 border-b border-slate-800">
           {!forceMode ? (
             <>
               <TabItem 
                 active={mode === 'visual'} 
                 onClick={() => setMode('visual')} 
                 icon={<Layers />} 
                 label="Visual Object" 
                 description="Plan spatially"
               />
               <TabItem 
                 active={mode === 'location'} 
                 onClick={() => setMode('location')} 
                 icon={<Database />} 
                 label="Location" 
                 description="Logic entity"
               />
               <TabItem 
                 active={mode === 'both'} 
                 onClick={() => setMode('both')} 
                 icon={<LinkIcon />} 
                 label="Linked Object" 
                 description="Unified entry"
               />
             </>
           ) : (
             <div className="flex-1 p-6 flex items-center gap-3">
                <Database className="w-5 h-5 text-sky-500" />
                <span className="text-sm font-bold text-white uppercase tracking-widest">Create Location Entity</span>
             </div>
           )}
           <button onClick={onClose} className="p-6 text-slate-500 hover:text-white border-l border-slate-800 transition-colors">
              <X className="w-5 h-5" />
           </button>
        </div>

        <div className="p-8 space-y-8 flex-1 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-slate-800 font-sans">
           
           {mode === 'visual' && (
              <ModeBanner 
                text="Spatial planning active. You can bind logical anchors to this primitive later." 
                icon={<Layers className="w-4 h-4" />}
                color="sky"
              />
           )}
           {mode === 'location' && (
              <ModeBanner 
                text="Synthesizing logical inventory unit. This will exist independently of plan visualization." 
                icon={<Database className="w-4 h-4" />}
                color="sky"
              />
           )}
           {mode === 'both' && (
              <ModeBanner 
                text="Creating unified node: Logical twin and visual representation linked at source." 
                icon={<LinkIcon className="w-4 h-4" />}
                color="sky"
              />
           )}

           <div className="grid grid-cols-2 gap-6">
              {(mode === 'visual' || mode === 'both') && (
                <div className="col-span-2 space-y-4">
                   <Input 
                     label="Node Label" 
                     placeholder="e.g. CABINET_01" 
                     value={formData.label}
                     onChange={(v) => setFormData({ ...formData, label: v })}
                   />
                </div>
              )}

              {(mode === 'location' || mode === 'both') && (
                 <>
                    <Input 
                      label="Identity Code" 
                      placeholder="e.g. WH-A-01" 
                      value={formData.code}
                      onChange={(v) => setFormData({ ...formData, code: v })}
                    />
                    <Input 
                      label="Unit Description" 
                      placeholder="e.g. High-density rack" 
                      value={formData.name}
                      onChange={(v) => setFormData({ ...formData, name: v })}
                    />
                    <Select 
                      label="Location Type"
                      options={Object.values(LocationType)}
                      value={formData.locationType}
                      onChange={(v) => setFormData({ ...formData, locationType: v as LocationType })}
                    />
                    <Select 
                      label="Parent Node Anchor"
                      options={['ROOT-SYS', ...locations.map(l => l.code)]}
                      value={formData.parentId}
                      onChange={(v) => setFormData({ ...formData, parentId: v })}
                    />
                 </>
              )}

              <div className="col-span-2 grid grid-cols-3 gap-6 pt-6 border-t border-slate-800">
                 <div className="col-span-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 italic">Physical Geometry (CM)</div>
                 <Input label="Width" value={formData.dimensions.width} unit="cm" onChange={(v) => setFormData({ ...formData, dimensions: { ...formData.dimensions, width: Number(v) }})} />
                 <Input label="Height" value={formData.dimensions.height} unit="cm" onChange={(v) => setFormData({ ...formData, dimensions: { ...formData.dimensions, height: Number(v) }})} />
                 <Input label="Depth" value={formData.dimensions.depth} unit="cm" onChange={(v) => setFormData({ ...formData, dimensions: { ...formData.dimensions, depth: Number(v) }})} />
              </div>
           </div>
        </div>

        <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest italic opacity-40">
              <Grid className="w-4 h-4" />
              <span>Center-point alignment ready</span>
           </div>
           <div className="flex gap-4">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition-all"
              >
                Abort
              </button>
              <button 
                onClick={handleSubmit}
                className="px-8 py-2.5 rounded-xl bg-sky-500 text-slate-950 font-black text-[10px] uppercase tracking-widest hover:bg-sky-400 shadow-xl shadow-sky-500/10 transition-all"
              >
                Assemble {mode === 'both' ? 'Unified Node' : mode === 'location' ? 'Entity' : 'Object'}
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

function TabItem({ active, onClick, icon, label, description }: { active: boolean, onClick: () => void, icon: React.ReactElement, label: string, description: string }) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex-1 p-6 text-left border-r border-slate-800 transition-all relative
        ${active ? 'bg-slate-900' : 'bg-transparent grayscale opacity-30 hover:opacity-60 hover:grayscale-0'}
      `}
    >
      <div className="flex items-center gap-3 mb-1">
         <div className={`p-1.5 rounded-lg border transition-all ${active ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-slate-800 text-slate-500 border-transparent'}`}>
            {React.cloneElement(icon, { className: 'w-3.5 h-3.5' } as any)}
         </div>
         <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
      </div>
      <p className="text-[10px] font-medium text-slate-600 italic">{description}</p>
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 shadow-[0_-2px_8px_rgba(56,189,248,0.5)]"></div>}
    </button>
  );
}

function ModeBanner({ text, icon, color = 'sky' }: { text: string, icon: React.ReactNode, color?: 'sky' | 'amber' }) {
  const styles = {
    sky: 'bg-sky-500/5 text-sky-400 border-sky-500/20',
    amber: 'bg-amber-500/5 text-amber-500 border-amber-500/20'
  };

  return (
    <div className={`p-4 rounded-2xl border flex items-center gap-4 ${styles[color]}`}>
       <div className="w-10 h-10 rounded-xl bg-slate-950 border border-current/10 flex items-center justify-center shrink-0">
          {icon}
       </div>
       <p className="text-[10px] font-bold tracking-widest leading-relaxed uppercase italic opacity-80">{text}</p>
    </div>
  );
}

function Input({ label, placeholder, value, unit, onChange }: { label: string, placeholder?: string, value: any, unit?: string, onChange?: (v: string) => void }) {
  return (
    <div className="space-y-2">
       <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">{label}</label>
       <div className="relative group">
          <input 
            type="text" 
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full bg-slate-800 border border-slate-750 rounded-xl py-3 px-4 text-xs font-bold text-white focus:ring-1 focus:ring-sky-500/50 outline-none transition-all placeholder:text-slate-750 placeholder:font-normal"
          />
          {unit && (
            <span className="absolute right-4 top-3.5 text-[9px] font-black text-slate-700 uppercase tracking-widest">{unit}</span>
          )}
       </div>
    </div>
  );
}

function Select({ label, options, value, onChange }: { label: string, options: string[], value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
       <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">{label}</label>
       <div className="relative group">
          <select 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-750 rounded-xl py-3 px-4 text-xs font-bold text-white focus:ring-1 focus:ring-sky-500/50 outline-none transition-all appearance-none cursor-pointer"
          >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <div className="absolute right-4 top-4 pointer-events-none text-slate-600 group-hover:text-sky-500 transition-colors">
             <ChevronRight className="w-3.5 h-3.5 rotate-90" />
          </div>
       </div>
    </div>
  );
}
