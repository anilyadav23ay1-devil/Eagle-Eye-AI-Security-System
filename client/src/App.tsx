import React, { useState } from 'react';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import { Header } from './components/common/Header';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { LiveDashboard } from './components/dashboard/LiveDashboard';
import { InteractiveFloorMap } from './components/map/InteractiveFloorMap';
import { PersonTrackingView } from './components/tracking/PersonTrackingView';
import { DailyAppearanceVault } from './components/appearance/DailyAppearanceVault';
import { SecurityRulesManager } from './components/rules/SecurityRulesManager';
import { CameraMatrixView } from './components/cameras/CameraMatrixView';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { BlueprintStudio } from './components/blueprint/BlueprintStudio';
import { EnrollmentModal } from './components/enrollment/EnrollmentModal';
import { ConnectCameraModal } from './components/cameras/ConnectCameraModal';
import { ChecklistModal } from './components/common/ChecklistModal';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const { isChecklistOpen, setIsChecklistOpen, activePersona } = useSecurity();

  return (
    <div className="min-h-screen bg-cyber-dark text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Cyber Command Header with Persona Switcher */}
      <Header />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Main Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/60">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'dashboard' && <LiveDashboard setActiveTab={setActiveTab} />}
            {activeTab === 'map' && <InteractiveFloorMap onSelectPerson={() => setActiveTab('tracking')} onOpenStudio={() => setActiveTab('blueprint')} />}
            {activeTab === 'blueprint' && <BlueprintStudio />}
            {activeTab === 'tracking' && <PersonTrackingView />}
            {activeTab === 'appearance' && <DailyAppearanceVault />}
            {activeTab === 'enrollment' && (
              <div className="space-y-6">
                <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-center space-y-4">
                  <h2 className="text-xl font-bold text-white">Person Enrollment & Visitor Portal</h2>
                  <p className="text-sm text-slate-400 max-w-lg mx-auto">
                    Register first-time visitors, permanent employees, or contractors. Biometric optical vectors and track IDs are generated automatically.
                  </p>
                </div>
                <EnrollmentModal />
              </div>
            )}
            {activeTab === 'rules' && <SecurityRulesManager />}
            {activeTab === 'cameras' && <CameraMatrixView />}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <EnrollmentModal />
      <ConnectCameraModal />
      <ChecklistModal isOpen={isChecklistOpen} onClose={() => setIsChecklistOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <SecurityProvider>
      <AppContent />
    </SecurityProvider>
  );
}

export default App;
