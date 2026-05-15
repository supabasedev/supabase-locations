/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  MOCK_LOCATIONS, 
  MOCK_LAYOUTS, 
  MOCK_VISUALS, 
  MOCK_BRANCHES 
} from './constants';
import { 
  LogicalLocation, 
  Layout, 
  VisualNode, 
  Branch, 
  ViewMode,
  VisualNodeRole 
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
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);

  // Scoped data for general views
  const branchLocations = useMemo(() => 
    locations.filter(l => l.branchId === activeBranch.id)
  , [locations, activeBranch.id]);

  const branchLayouts = useMemo(() => 
    layouts.filter(l => l.branchId === activeBranch.id)
  , [layouts, activeBranch.id]);

  const branchVisuals = useMemo(() => 
    visuals.filter(v => {
      const layout = layouts.find(lay => lay.id === v.layoutId);
      return layout?.branchId === activeBranch.id;
    })
  , [visuals, layouts, activeBranch.id]);

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

  const handleBranchChange = (branch: Branch) => {
    setActiveBranch(branch);
    // Reset selection/active page states when switching branches if needed
    if (currentPage === 'editor') {
        setCurrentPage('workspaces');
        setActiveLayoutId(null);
    }
  };

  const handleCreateLayout = (data: WizardData) => {
    const layoutId = `lay${Date.now()}`;
    const newLayout: Layout = {
      id: layoutId,
      branchId: activeBranch.id,
      rootLocationId: data.locationId || null,
      name: data.name || `Workspace ${layouts.length + 1}`,
      status: 'draft',
      lastEdited: 'Just now'
    };

    // Create the root visual container (Room/Warehouse footprint)
    const rootNode: VisualNode = {
      id: `vis-root-${Date.now()}`,
      layoutId: layoutId,
      locationId: data.locationId || null,
      type: 'zone', // Using zone as the base for the room footprint
      label: data.name || 'Main footprint',
      x: 0,
      y: 0,
      z: 0,
      rotation: 0,
      width: Math.round(data.width * 100), // convert meter to cm
      height: Math.round((data.height || 4) * 100), 
      depth: Math.round(data.depth * 100), 
      color: 'rgba(14, 165, 233, 0.05)', // Sky 500 at low opacity
      viewMode: ViewMode.TOP_DOWN,
      parentId: null,
      nodeRole: VisualNodeRole.LOCATION_REPRESENTATION
    };

    setLayouts(prev => [...prev, newLayout]);
    setVisuals(prev => [...prev, rootNode]);
    setActiveLayoutId(newLayout.id);
    setCurrentPage('editor');
  };

  const handleCreateLocation = (locationData: LogicalLocation) => {
    setLocations(prev => [...prev, { ...locationData, branchId: activeBranch.id }]);
  };

  return (
    <div className="flex flex-col h-screen bg-surface text-slate-200 font-sans selection:bg-sky-500/30">
      <Navigation 
        activePage={currentPage} 
        onNavigate={setCurrentPage} 
        activeBranch={activeBranch}
        branches={MOCK_BRANCHES}
        onBranchChange={handleBranchChange}
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
                locations={branchLocations} 
                visuals={branchVisuals} 
                layouts={branchLayouts}
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
                layouts={branchLayouts} 
                visuals={branchVisuals} 
                locations={branchLocations}
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
                locations={branchLocations}
                visuals={visuals.filter(v => v.layoutId === activeLayout.id)}
                setVisuals={setVisuals}
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
