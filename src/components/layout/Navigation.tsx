import React, { useState, useRef, useEffect } from 'react';
import { Page } from '../../App';
import { Branch } from '../../types';
import { Box, Map, Database, LayoutGrid, ChevronDown, Bell, User, Check } from 'lucide-react';

interface NavigationProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  activeBranch: Branch;
  branches: Branch[];
  onBranchChange: (branch: Branch) => void;
}

export default function Navigation({ activePage, onNavigate, activeBranch, branches, onBranchChange }: NavigationProps) {
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsBranchMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b border-slate-700 bg-slate-900 flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('locations')}>
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
            <Box className="w-5 h-5 text-slate-900" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">AMBRA <span className="text-slate-500 font-light">Locations</span></span>
        </div>

        <nav className="flex items-center gap-1">
          <NavItem 
            icon={<Database className="w-4 h-4" />} 
            label="Locations" 
            active={activePage === 'locations'} 
            onClick={() => onNavigate('locations')} 
          />
          <NavItem 
            icon={<Map className="w-4 h-4" />} 
            label="Workspaces" 
            active={activePage === 'workspaces' || activePage === 'editor'} 
            onClick={() => onNavigate('workspaces')} 
          />
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={menuRef}>
          <div 
            onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors border border-slate-700 select-none"
          >
            <LayoutGrid className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">{activeBranch.name}</span>
            <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isBranchMenuOpen ? 'rotate-180' : ''}`} />
          </div>

          {isBranchMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-100 z-[60]">
               <div className="p-2 border-b border-slate-700/50">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">Switch Branch</span>
               </div>
               <div className="p-1">
                 {branches.map((branch) => (
                   <div 
                    key={branch.id}
                    onClick={() => {
                      onBranchChange(branch);
                      setIsBranchMenuOpen(false);
                    }}
                    className={`
                      flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors
                      ${activeBranch.id === branch.id ? 'bg-sky-500/10 text-sky-400' : 'text-slate-300 hover:bg-slate-700'}
                    `}
                   >
                     <span className="text-xs font-medium">{branch.name}</span>
                     {activeBranch.id === branch.id && <Check className="w-3.5 h-3.5" />}
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
          <button className="p-2 text-slate-400 hover:bg-slate-800 rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-sky-500 rounded-full border-2 border-slate-900"></span>
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 overflow-hidden">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all
        ${active 
          ? 'text-sky-400 bg-sky-500/10' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'}
      `}
    >
      {icon}
      {label}
    </button>
  );
}
