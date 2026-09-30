import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import ComplaintForm from './components/ComplaintForm';
import TrackComplaint from './components/TrackComplaint';
import ApiKeyModal from './components/ApiKeyModal';
import Footer from './components/Footer';
import { getAllComplaints } from './services/complaintService';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [trackInitialId, setTrackInitialId] = useState('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Synchronize with URL hash on load and hash changes
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (!hash) return;

      if (hash.startsWith('track')) {
        const parts = hash.split('/');
        const idFromHash = parts[1] ? decodeURIComponent(parts[1]).trim() : '';
        navigateToTab('track', idFromHash);
      } else if (hash.startsWith('report')) {
        navigateToTab('report');
      } else if (hash.startsWith('home')) {
        navigateToTab('home');
      }
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const navigateToTab = (tab, complaintId = '') => {
    let resolvedId = complaintId;

    if (tab === 'track') {
      // If no ID passed explicitly, attempt to get the latest complaint from localStorage
      if (!resolvedId) {
        try {
          const stored = getAllComplaints();
          if (stored && stored.length > 0) {
            resolvedId = stored[0].id;
          }
        } catch (e) {
          console.warn('Could not read stored complaints for track initialId:', e);
        }
      }

      setTrackInitialId(resolvedId || '');
      setActiveTab('track');
      window.location.hash = resolvedId ? `track/${encodeURIComponent(resolvedId)}` : 'track';
    } else {
      setActiveTab(tab);
      window.location.hash = tab;
    }

    // Ensure page scrolls to top smoothly upon navigation
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      {/* Navigation Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onNavigate={navigateToTab}
        onOpenApiKeyModal={() => setIsKeyModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === 'home' && (
          <LandingHero 
            onGetStarted={() => navigateToTab('report')} 
            onTrack={() => navigateToTab('track')} 
          />
        )}
        {activeTab === 'report' && (
          <ComplaintForm 
            onNavigateToTrack={(id) => navigateToTab('track', id)} 
            onOpenApiKeyModal={() => setIsKeyModalOpen(true)}
          />
        )}
        {activeTab === 'track' && (
          <TrackComplaint 
            initialId={trackInitialId} 
            onNavigateToReport={() => navigateToTab('report')} 
          />
        )}
      </main>

      {/* In-App Gemini API Key Dialog */}
      <ApiKeyModal 
        isOpen={isKeyModalOpen} 
        onClose={() => setIsKeyModalOpen(false)} 
      />

      {/* Civic Footer */}
      <Footer />

    </div>
  );
}
