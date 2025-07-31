import React, { useState, useEffect } from 'react';
import { TourProvider, useTour, StepType } from '@reactour/tour';

const tourSteps: StepType[] = [
  {
    selector: '[data-tour="sidebar"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold text-[#9a674a] mb-2">Welcome to BlessedMusic! 🎵</h3>
        <p className="text-sm text-gray-700 mb-3">
          This is your <strong>sidebar</strong> where you can:
        </p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• View selected song details</li>
          <li>• Customize display settings</li>
          <li>• Manage song collections</li>
          <li>• Change themes and layouts</li>
        </ul>
      </div>
    ),
  },
  {
    selector: '[data-tour="header-controls"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold text-[#9a674a] mb-2">Header Controls 🎛️</h3>
        <p className="text-sm text-gray-700 mb-3">
          Your command center for:
        </p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Search</strong> - Find songs quickly</li>
          <li>• <strong>View modes</strong> - Switch between table and list</li>
          <li>• <strong>Actions</strong> - Edit, present, or create songs</li>
          <li>• <strong>Directory</strong> - Select your songs folder</li>
        </ul>
      </div>
    ),
  },
  {
    selector: '[data-tour="song-list"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold text-[#9a674a] mb-2">Song Collection 📚</h3>
        <p className="text-sm text-gray-700 mb-3">
          Your songs are displayed here in columns:
        </p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Single click</strong> - Select a song</li>
          <li>• <strong>Double click</strong> - Present immediately</li>
          <li>• Songs auto-organize into responsive columns</li>
          <li>• Switch between table and card views</li>
        </ul>
        <div className="mt-3 p-2 bg-[#faeed1] rounded text-xs text-[#9a674a]">
          💡 <strong>Tip:</strong> Use the search bar to quickly find songs, or browse collections in the sidebar!
        </div>
      </div>
    ),
  },
];

const TourButton: React.FC = () => {
  const { setIsOpen } = useTour();
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
    const tourSeen = localStorage.getItem('blessedmusic-tour-seen');
    if (!tourSeen) {
      // Automatically start tour for first-time users after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setHasSeenTour(true);
    }
  }, [setIsOpen]);

  const startTour = () => {
    setIsOpen(true);
  };

  return (
    <button
      onClick={startTour}
      className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[#9a674a] to-[#b8805c] text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-sm font-medium"
      title="Take a tour of BlessedMusic"
    >
      <span>🎵</span>
      <span>{hasSeenTour ? 'Take Tour Again' : 'Take Tour'}</span>
    </button>
  );
};

interface AppTourProps {
  children: React.ReactNode;
}

const AppTour: React.FC<AppTourProps> = ({ children }) => {
  return (
    <TourProvider
      steps={tourSteps}
      afterOpen={() => {
        localStorage.setItem('blessedmusic-tour-seen', 'true');
      }}
      styles={{
        popover: (base) => ({
          ...base,
          '--reactour-accent': '#9a674a',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          border: '2px solid #faeed1',
          boxShadow: '0 10px 40px rgba(154, 103, 74, 0.15)',
          fontFamily: 'Georgia, serif',
        }),
        maskArea: (base) => ({
          ...base,
          rx: 8,
        }),
        badge: (base) => ({
          ...base,
          left: 'auto',
          right: '10px',
          backgroundColor: '#9a674a',
          color: '#faeed1',
          fontSize: '12px',
          fontWeight: 'bold',
        }),
        button: (base) => ({
          ...base,
          backgroundColor: '#9a674a',
          color: '#faeed1',
          border: 'none',
          borderRadius: '6px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }),
      }}
      showNavigation={true}
      showBadge={true}
      showCloseButton={true}
      disableDotsNavigation={false}
      className="tour-popover"
      scrollSmooth={true}
      padding={{
        mask: 5,
        popover: [10, 10],
      }}
      onClickMask={({ setIsOpen }) => setIsOpen(false)}
    >
      {children}
      <TourButton />
    </TourProvider>
  );
};

export default AppTour; 