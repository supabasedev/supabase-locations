/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  MOCK_LOCATIONS, 
  MOCK_LAYOUTS, 
  MOCK_VISUALS, 
  MOCK_BRANCHES,
  MOCK_SPLIT_TREES
} from './constants';
import { 
  LogicalLocation, 
  Layout, 
  VisualNode, 
  Branch, 
  ViewType,
  SplitTreeEntry 
} from './types';
import Navigation from './components/layout/Navigation';
import LocationsPage from './components/locations/LocationsPage';
import WorkspacesPage from './components/workspaces/WorkspacesPage';
import EditorPage from './components/editor/EditorPage';
import { AnimatePresence, motion } from 'motion/react';
import { WizardData } from './components/workspaces/BlueprintSetupWizard';

export type Page = 'locations' | 'workspaces' | 'editor';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('locations');
  const [activeBranch, setActiveBranch] = useState<Branch>(MOCK_BRANCHES[0]);
  const [locations, setLocations] = useState<LogicalLocation[]>(MOCK_LOCATIONS);
  const [layouts, setLayouts] = useState<Layout[]>(MOCK_LAYOUTS);
  const [visuals, setVisuals] = useState<VisualNode[]>(MOCK_VISUALS);
  const [splitTrees, setSplitTrees] = useState<SplitTreeEntry[]>(MOCK_SPLIT_TREES);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);

  const activeLayout = useMemo(() => 
    layouts.find(l => l.id === activeLayoutId) || null
  , [layouts, activeLayoutId]);

  const handleOpenEditor = (layoutId: string) => {
    setActiveLayoutId(layoutId);
    setCurrentPage('editor');
  };

  const handleBackToWorkspaces = () => {
    setCurrentPage('workspaces');
    setActiveLayoutId(null);
  };

  const handleCreateLayout = (data: WizardData) => {
    const layoutId = `lay${Date.now()}`;
    const newLayout: Layout = {
      id: layoutId,
      branchId: activeBranch.id,
      rootLocationId: data.locationId || null,
      name: data.name || `Workspace ${layouts.length + 1}`,
      status: 'draft',
      lastEdited: 'Just now',
      baseSurface: {
        type: 'floor',
        label: data.name || 'Main footprint',
        widthMm: Math.round(data.width * 1000), // convert meter to mm
        depthMm: Math.round(data.depth * 1000), 
        style: { fill: '#0f172a' },
        gridSizeMm: 1000
      }
    };

    setLayouts([...layouts, newLayout]);
    setActiveLayoutId(newLayout.id);
    setCurrentPage('editor');
  };

  const handleCreateLocation = (locationData: LogicalLocation) => {
    setLocations([...locations, locationData]);
  };

  return (
    <div className="flex flex-col h-screen bg-surface text-slate-200 font-sans selection:bg-sky-500/30">
      <Navigation 
        activePage={currentPage} 
        onNavigate={setCurrentPage} 
        activeBranch={activeBranch}
      />
      
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {currentPage === 'locations' && (
            <motion.div
              key="locations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <LocationsPage 
                locations={locations} 
                visuals={visuals} 
                layouts={layouts}
                onNavigateToWorkspace={handleOpenEditor}
                onCreateLocation={handleCreateLocation}
                onUpdateLocation={(locData) => {
                  setLocations(prev => prev.map(l => l.id === locData.id ? { ...l, ...locData } : l));
                }}
              />
            </motion.div>
          )}

          {currentPage === 'workspaces' && (
            <motion.div
              key="workspaces"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <WorkspacesPage 
                layouts={layouts} 
                visuals={visuals} 
                locations={locations}
                splitTrees={splitTrees}
                onOpenLayout={handleOpenEditor}
                onCreateLayout={handleCreateLayout}
              />
            </motion.div>
          )}

          {currentPage === 'editor' && activeLayout && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <EditorPage 
                layout={activeLayout} 
                locations={locations}
                visuals={visuals}
                splitTrees={splitTrees}
                setVisuals={setVisuals}
                setSplitTrees={setSplitTrees}
                setLocations={setLocations}
                onBack={handleBackToWorkspaces}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
