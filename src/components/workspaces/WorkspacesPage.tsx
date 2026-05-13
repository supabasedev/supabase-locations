import React from 'react';
import { Layout, VisualNode, LogicalLocation } from '../../types';
import { 
  Plus, 
  Map as MapIcon, 
  Clock, 
  Layers, 
  MoreVertical, 
  Copy, 
  Trash2, 
  FileText,
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BlueprintSetupWizard, { WizardData } from './BlueprintSetupWizard';

interface WorkspacesPageProps {
  layouts: Layout[];
  visuals: VisualNode[];
  locations: LogicalLocation[];
  onOpenLayout: (id: string) => void;
  onCreateLayout: (data: WizardData) => void;
}

export default function WorkspacesPage({ layouts, visuals, locations, onOpenLayout, onCreateLayout }: WorkspacesPageProps) {
  const [isWizardOpen, setIsWizardOpen] = React.useState(false);

  return (
    <div className="flex-1 overflow-y-auto bg-surface p-10 scrollbar-thin scrollbar-thumb-slate-700">
      <AnimatePresence>
        {isWizardOpen && (
          <BlueprintSetupWizard 
            onClose={() => setIsWizardOpen(false)}
            onConfirm={(data) => {
              onCreateLayout(data);
              setIsWizardOpen(false);
            }}
            locations={locations}
          />
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Workspaces</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and edit your warehouse layout plans.</p>
          </div>
          <button 
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-sky-500 text-slate-900 rounded-xl font-bold text-sm hover:bg-sky-400 shadow-xl shadow-sky-500/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            New Workspace
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {layouts.map((layout, index) => (
            <LayoutCard 
              key={layout.id} 
              layout={layout} 
              visuals={visuals.filter(v => v.layoutId === layout.id)}
              onOpen={() => onOpenLayout(layout.id)}
              index={index}
            />
          ))}

          {/* Add Placeholder */}
          <div 
            onClick={() => setIsWizardOpen(true)}
            className="rounded-2xl border-2 border-dashed border-slate-800 hover:border-slate-700 transition-all flex flex-col items-center justify-center p-10 group cursor-pointer space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-700 group-hover:text-sky-500 group-hover:bg-slate-800 transition-all">
              <Plus className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-500 group-hover:text-slate-300 transition-all uppercase tracking-widest text-xs">Create Blueprint</p>
              <p className="text-slate-600 text-[10px] mt-1">Start from an empty workspace</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LayoutCardProps {
  key?: React.Key;
  layout: Layout;
  visuals: VisualNode[];
  onOpen: () => void;
  index: number;
}

function LayoutCard({ layout, visuals, onOpen, index }: LayoutCardProps) {
  const mappedCount = visuals.filter(v => v.locationId !== null).length;
  const unassignedCount = visuals.filter(v => v.locationId === null).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="bg-slate-900/50 rounded-2xl border border-slate-700 shadow-xl overflow-hidden cursor-pointer group"
      onClick={onOpen}
    >
      <div className="aspect-video bg-slate-800 relative flex items-center justify-center overflow-hidden border-b border-slate-700">
         <div className="absolute inset-0 bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:15px:15px] opacity-20"></div>
         <MapIcon className="w-12 h-12 text-slate-700 group-hover:text-sky-500/50 transition-colors duration-500" />
         <div className="absolute top-4 right-4 flex gap-2">
           <span className="px-3 py-1 rounded bg-slate-900/80 backdrop-blur text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-700">
             {layout.status || 'Active'}
           </span>
         </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors uppercase tracking-tight">{layout.name}</h3>
            <p className="text-slate-500 text-xs mt-1 italic">Last edited {layout.lastEdited}</p>
          </div>
          <button className="p-2 text-slate-500 hover:text-white transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Stocked</p>
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs">{mappedCount} nodes</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Unassigned</p>
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs">{unassignedCount} items</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-sky-500 hover:text-slate-900 border border-slate-700 group-hover:border-sky-500 transition-all font-bold text-sm text-slate-300">
            <ExternalLink className="w-4 h-4" />
            Open Workspace
          </button>
        </div>
      </div>
    </motion.div>
  );
}
