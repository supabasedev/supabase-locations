/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Copy, 
  Download, 
  Check, 
  FileJson, 
  Info,
  Database,
  Search,
  LayoutGrid,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { generateLocationExport, LocationExportSchema } from '../../lib/locationExport';
import { LogicalLocation, Layout } from '../../types';

interface LocationExportDialogProps {
  locations: LogicalLocation[];
  layouts: Layout[];
  onClose: () => void;
}

export default function LocationExportDialog({ locations, layouts, onClose }: LocationExportDialogProps) {
  const [copied, setCopied] = useState(false);
  const branchId = layouts[0]?.branchId || 'unknown';
  
  const exportData = React.useMemo(() => generateLocationExport(locations, branchId), [locations, branchId]);
  const jsonString = JSON.stringify(exportData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ambra-locations-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <FileJson className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">Location Data Export</h2>
              <p className="text-xs text-slate-500 font-bold tracking-widest mt-0.5">SCHEMA VERSION: {exportData.schemaVersion}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Summary Sidebar */}
          <div className="w-80 border-r border-slate-800 p-8 overflow-y-auto bg-slate-950/20 scrollbar-thin scrollbar-thumb-slate-800 space-y-8">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" />
                Export Summary
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <SummaryStat label="Total Nodes" value={exportData.metadata.counts.totalLocations} />
                <SummaryStat label="Leaf Nodes" value={exportData.metadata.counts.leafLocations} />
                <SummaryStat label="Max Depth" value={exportData.metadata.maxDepth} />
                <SummaryStat label="Root Nodes" value={exportData.metadata.counts.rootLocations} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                Diagnostics
              </h3>
              <div className="space-y-2">
                <DiagnosticItem 
                  label="Duplicate Codes" 
                  count={exportData.diagnostics.duplicateCodes.length} 
                  severity={exportData.diagnostics.duplicateCodes.length > 0 ? 'warning' : 'ok'} 
                />
                <DiagnosticItem 
                  label="Missing Parents" 
                  count={exportData.diagnostics.missingParents.length} 
                  severity={exportData.diagnostics.missingParents.length > 0 ? 'critical' : 'ok'} 
                />
                <DiagnosticItem 
                  label="Invalid Codes" 
                  count={exportData.diagnostics.locationsWithoutCodes.length} 
                  severity={exportData.diagnostics.locationsWithoutCodes.length > 0 ? 'critical' : 'ok'} 
                />
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <LayoutGrid className="w-3.5 h-3.5" />
                Mapping Eligibility
              </h3>
              <div className="space-y-2">
                <MappingFact label="Visual Eligible" count={exportData.visualizationReadiness.locationsEligibleForVisualization.length} />
                <MappingFact label="Storage Ready" count={exportData.visualizationReadiness.storageCapableLeafLocations.length} />
                <MappingFact label="Workspace Roots" count={exportData.visualizationReadiness.suggestedWorkspaceRoots.length} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
               <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                 <span className="font-bold text-slate-400">Notice:</span> This export represents the current operational truth of the Location system. It is used to audit structural health and sync with workspace visualizations.
               </p>
            </div>
          </div>

          {/* JSON View */}
          <div className="flex-1 flex flex-col min-w-0">
             <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live JSON Payload</span>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={handleCopy}
                     className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 hover:text-white transition-all border border-slate-700 flex-shrink-0"
                   >
                     {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                     {copied ? 'Copied!' : 'Copy JSON'}
                   </button>
                   <button 
                     onClick={handleDownload}
                     className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-[10px] font-bold text-sky-400 transition-all border border-sky-500/20 flex-shrink-0"
                   >
                     <Download className="w-3 h-3" />
                     Download
                   </button>
                </div>
             </div>
             <div className="flex-1 overflow-auto p-8 font-mono text-[11px] bg-slate-950/40 scrollbar-thin scrollbar-thumb-slate-800">
               <pre className="text-slate-400 leading-relaxed whitespace-pre font-mono">
                 {jsonString}
               </pre>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">
            Read-Only. No modifications will be applied to the database.
          </p>
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-black text-[10px] uppercase tracking-widest text-white transition-all border border-slate-700"
          >
            Finished Inspection
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string, value: number }) {
  return (
    <div className="bg-slate-800/30 border border-slate-800 p-3 rounded-xl">
      <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
}

function DiagnosticItem({ label, count, severity }: { label: string, count: number, severity: 'ok' | 'warning' | 'critical' }) {
  const styles = {
    ok: 'text-emerald-500/50',
    warning: 'text-amber-500 font-bold',
    critical: 'text-rose-500 font-bold'
  };
  
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className={styles[severity]}>{count === 0 ? 'None' : count}</span>
    </div>
  );
}

function MappingFact({ label, count }: { label: string, count: number }) {
  return (
    <div className="flex items-center justify-between text-[10px]">
      <div className="flex items-center gap-2">
         <ChevronRight className="w-2.5 h-2.5 text-slate-700" />
         <span className="text-slate-400 font-bold tracking-tight">{label}</span>
      </div>
      <span className="font-mono text-slate-500">{count}</span>
    </div>
  );
}
