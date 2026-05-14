import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, Upload, AlertCircle } from 'lucide-react';
import { VisualNode, Layout, LogicalLocation, SplitTreeEntry, PreviewPayload } from '../../types';

interface EditorRawDataProps {
  layout: Layout;
  locations: LogicalLocation[];
  visuals: VisualNode[];
  splitTrees: SplitTreeEntry[];
  onImport: (payload: PreviewPayload) => void;
}

export default function EditorRawData({ layout, locations, visuals, splitTrees, onImport }: EditorRawDataProps) {
  const [dataString, setDataString] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const payload: PreviewPayload = {
      layout,
      locations,
      visualNodes: visuals.filter(v => (v.visualizationType as string) !== 'floor'),
      splitTrees
    };
    setDataString(JSON.stringify(payload, null, 2));
  }, [layout, locations, visuals, splitTrees]);

  const handleCopy = () => {
    navigator.clipboard.writeText(dataString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(dataString);
      if (!parsed.layout || !parsed.locations || !parsed.visualNodes) {
        throw new Error('Invalid payload structure. Expected layout, locations, and visualNodes.');
      }
      onImport(parsed);
      setError(null);
      alert('Data imported successfully!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            Workspace Raw Data
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
            Layout ID: {layout.id}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:border-slate-600 transition-all shadow-xl"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy All'}
          </button>
          
          <button 
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-400 transition-all shadow-xl"
          >
            <Upload className="w-4 h-4" />
            Apply Changes
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
          <AlertCircle className="w-5 h-5" />
          <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="flex-1 relative group">
        <textarea 
          value={dataString}
          onChange={(e) => setDataString(e.target.value)}
          className="w-full h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 font-mono text-[11px] text-sky-400/90 focus:outline-none focus:border-sky-500/30 focus:ring-1 focus:ring-sky-500/20 transition-all resize-none shadow-inner"
          spellCheck={false}
        />
        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <div className="px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest backdrop-blur">
             JSON Format
           </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <DataMetaBox label="Node Count" value={visuals.length.toString()} />
        <DataMetaBox label="Mapped Locations" value={visuals.filter(v => v.locationId).length.toString()} />
        <DataMetaBox label="Payload Size" value={`${(dataString.length / 1024).toFixed(2)} KB`} />
      </div>
    </div>
  );
}

function DataMetaBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">{label}</p>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  );
}
