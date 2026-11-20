import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ChatView } from './components/chat/ChatView';
import { CatalogView } from './components/catalog/CatalogView';
import { ComparisonView } from './components/comparison/ComparisonView';
import { VariantAnalyzerView } from './components/variants/VariantAnalyzerView';
import { AdminView } from './components/admin/AdminView';
import { DocumentUploadModal } from './components/admin/DocumentUploadModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState('chat');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeVehicleId, setActiveVehicleId] = useState(null);
  const [isGlobalUploadOpen, setIsGlobalUploadOpen] = useState(false);
  const [chatResetKey, setChatResetKey] = useState(0);

  const handleChatWithVehicle = (vehicleId) => {
    setActiveVehicleId(vehicleId);
    setCurrentTab('chat');
  };

  const handleNewChat = () => {
    setActiveVehicleId(null);
    setChatResetKey((prev) => prev + 1);
    setCurrentTab('chat');
  };

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-navy-950 font-sans selection:bg-accent-cyan/30 selection:text-accent-cyan">
        {/* Main Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
          {/* Persistent Header */}
          <Header
            currentTab={currentTab}
            onOpenMobile={() => setIsMobileOpen(true)}
            onNewChat={handleNewChat}
            onOpenUpload={() => setIsGlobalUploadOpen(true)}
          />

          {/* Dynamic Module Viewport */}
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {currentTab === 'chat' && (
              <ChatView
                key={chatResetKey}
                activeVehicleId={activeVehicleId}
                onSelectVehicle={(vId) => setActiveVehicleId(vId)}
              />
            )}

            {currentTab === 'catalog' && (
              <CatalogView onChatWithVehicle={handleChatWithVehicle} />
            )}

            {currentTab === 'comparison' && (
              <ComparisonView onChatWithVehicle={handleChatWithVehicle} />
            )}

            {currentTab === 'variants' && <VariantAnalyzerView />}

            {currentTab === 'admin' && <AdminView />}
          </main>
        </div>

        {/* Global Upload Brochure Modal */}
        <DocumentUploadModal
          isOpen={isGlobalUploadOpen}
          onClose={() => setIsGlobalUploadOpen(false)}
          vehicles={[]}
          onUploadSuccess={() => {
            // If in admin view or catalog, refreshed automatically
          }}
        />
      </div>
    </ToastProvider>
  );
}
