/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  AlertCircle,
  FileJson,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  serializeWorkspaceData, 
  validateWorkspaceImport, 
  summarizeWorkspaceData,
  prepareImportData,
  WorkspaceExportData,
  WorkspaceSummary
} from '../../lib/workspaceTransfer';
import { Layout, VisualNode, LogicalLocation } from '../../types';

interface WorkspaceDataDialogProps {
  layout: Layout;
  visuals: VisualNode[];
  locations: LogicalLocation[];
  onImport: (newVisuals: VisualNode[]) => void;
  onClose: () => void;
}

export default function WorkspaceDataDialog({
  layout,
  visuals,
  locations,
  onImport,
  onClose
}: WorkspaceDataDialogProps) {
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string; data?: WorkspaceExportData } | null>(null);
  const [importSummary, setImportSummary] = useState<WorkspaceSummary | null>(null);

  const exportData = serializeWorkspaceData(layout, visuals, locations);
  const exportJson = JSON.stringify(exportData, null, 2);
  const exportSummary = summarizeWorkspaceData(exportData, locations);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ambra-workspace-${layout.id}-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleValidate = () => {
    const result = validateWorkspaceImport(importJson);
    setValidationResult(result);
    if (result.valid && result.data) {
      setImportSummary(summarizeWorkspaceData(result.data, locations));
    } else {
      setImportSummary(null);
    }
  };

  const isEmpty = visuals.length === 0;

  const handleDoImport = () => {
    if (validationResult?.valid && validationResult.data) {
      const newVisuals = prepareImportData(validationResult.data, layout.id);
      onImport(newVisuals);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="h-16 border-b border-slate-700 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center text-sky-400">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Workspace Data</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Export / Import Inspection</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-950/50 p-1 border-b border-slate-800 shrink-0">
          <button 
            onClick={() => setTab('export')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${tab === 'export' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Export JSON
          </button>
          <button 
            onClick={() => setTab('import')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${tab === 'import' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Import JSON
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {tab === 'export' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryItem label="Objects" value={exportSummary.topViewObjectsCount} />
                <SummaryItem label="Base Surface" value={exportSummary.baseSurfaceCount || 1} />
                <SummaryItem label="Front Views" value={exportSummary.frontViewsCount} />
                <SummaryItem label="Split Cells" value={exportSummary.splitNodesCount} />
                <SummaryItem label="Dividers" value={exportSummary.dividersCount} />
                <SummaryItem label="Frames" value={exportSummary.framesCount || 0} />
                <SummaryItem label="Links" value={exportSummary.locationLinksCount} />
                <SummaryItem label="Visual Only" value={exportSummary.visualOnlyCount || 0} />
                <SummaryItem label="Unresolved" value={exportSummary.unresolvedLocationLinksCount} color="text-amber-400" />
                <SummaryItem label="Unit" value={exportSummary.unit} color="text-sky-400" />
                <SummaryItem label="Status" value="Ready" color="text-emerald-400" />
                <SummaryItem label="Version" value="v2" color="text-sky-400" />
              </div>

              <div className="relative">
                <div className="absolute right-4 top-4 flex gap-2">
                  <button 
                    onClick={handleCopy}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight shadow-lg border border-slate-600 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight shadow-lg border border-slate-600 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
                <textarea 
                  readOnly 
                  value={exportJson}
                  className="w-full h-[300px] bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono text-[11px] text-slate-400 focus:outline-none focus:border-sky-500/50 transition-colors"
                />
              </div>

              <div className="bg-sky-500/5 border border-sky-500/20 rounded-2xl p-4 flex gap-4">
                <div className="shrink-0 text-sky-400 pt-1">
                  <Info className="w-5 h-5" />
                </div>
                <p className="text-xs text-sky-200/60 leading-relaxed">
                  Export preserves current units exactly. It does not convert dimensions. 
                  This backup contains all visual layout data and physical parameters of objects and their front-view setup.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Paste Workspace JSON</label>
                <textarea 
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='{ "schemaVersion": "ambra-workspace-export-v1", ... }'
                  className="w-full h-[200px] bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono text-[11px] text-slate-400 focus:outline-none focus:border-sky-500 transition-colors placeholder:text-slate-700"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleValidate}
                  disabled={!importJson.trim()}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-slate-700 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Validate JSON
                </button>
              </div>

              {validationResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border ${validationResult.valid ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}
                >
                  <div className="flex items-center gap-3">
                    {validationResult.valid ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className={`text-xs font-bold ${validationResult.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                      {validationResult.valid ? 'Valid Workspace Data' : validationResult.error}
                    </span>
                  </div>

                  {importSummary && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                      <SummaryMini label="Objects" value={importSummary.topViewObjectsCount} />
                      <SummaryMini label="Front Views" value={importSummary.frontViewsCount} />
                      <SummaryMini label="Split Cells" value={importSummary.splitNodesCount} />
                      <SummaryMini label="Links" value={importSummary.locationLinksCount} />
                      <SummaryMini label="Unresolved" value={importSummary.unresolvedLocationLinksCount} color="text-amber-400" />
                      <SummaryMini label="Unit" value={importSummary.unit} />
                    </div>
                  )}
                </motion.div>
              )}

              {!isEmpty && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-4">
                  <div className="shrink-0 text-amber-400 pt-1">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-amber-200/60 leading-relaxed">
                    This workspace already contains <strong>{visuals.length}</strong> objects. 
                    Import into non-empty workspace is disabled in this version for safety.
                  </p>
                </div>
              )}

              <button 
                onClick={handleDoImport}
                disabled={!validationResult?.valid || !isEmpty}
                className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-sky-500/10 ${(!validationResult?.valid || !isEmpty) ? 'bg-slate-800 text-slate-500 grayscale cursor-not-allowed opacity-50' : 'bg-sky-500 text-slate-900 hover:bg-sky-400'}`}
              >
                <Upload className="w-5 h-5" />
                Import into Empty Workspace
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function SummaryItem({ label, value, color = 'text-white' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-slate-950/50 border border-slate-800/50 p-4 rounded-2xl flex flex-col items-center justify-center space-y-1">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <span className={`text-xl font-bold ${color}`}>{value}</span>
    </div>
  );
}

function SummaryMini({ label, value, color = 'text-slate-300' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[8px] font-black uppercase tracking-tight text-slate-500 leading-none mb-1">{label}</span>
      <span className={`text-xs font-bold leading-none ${color}`}>{value}</span>
    </div>
  );
}
