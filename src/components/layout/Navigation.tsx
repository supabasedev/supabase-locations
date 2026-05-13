import React from 'react';
import { Page } from '../../App';
import { Branch } from '../../types';
import { Box, Map, Database, LayoutGrid, ChevronDown, Bell, Search, User } from 'lucide-react';

interface NavigationProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  activeBranch: Branch;
}

export default function Navigation({ activePage, onNavigate, activeBranch }: NavigationProps) {
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
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors border border-slate-700">
          <LayoutGrid className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-300">{activeBranch.name}</span>
          <ChevronDown className="w-3 h-3 text-slate-500" />
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
