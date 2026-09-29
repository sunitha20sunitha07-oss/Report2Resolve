import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import ComplaintForm from './components/ComplaintForm';
import Footer from './components/Footer';
import ApiKeyModal from './components/ApiKeyModal';
import { isApiKeyConfigured } from './services/aiService';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isKeyConfiguredState, setIsKeyConfiguredState] = useState(false);

  const checkKeyStatus = () => {
    setIsKeyConfiguredState(isApiKeyConfigured());
  };

  useEffect(() => {
    checkKeyStatus();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      {/* Navigation Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenApiKeyModal={() => setIsKeyModalOpen(true)}
        isKeyConfigured={isKeyConfiguredState}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === 'home' ? (
          <LandingHero onGetStarted={() => setActiveTab('report')} />
        ) : (
          <ComplaintForm onOpenApiKeyModal={() => setIsKeyModalOpen(true)} />
        )}
      </main>

      {/* Civic Footer */}
      <Footer />

      {/* API Key Manager Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeySaved={checkKeyStatus}
      />

    </div>
  );
}
