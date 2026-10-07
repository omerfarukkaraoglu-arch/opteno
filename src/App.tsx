import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { SuperAdminDash } from './components/dashboards/SuperAdminDash';
import { InstitutionAdminDash } from './components/dashboards/InstitutionAdminDash';
import { ExamCreateBuilder } from './components/exam/ExamCreateBuilder';
import { OMRGenerator } from './components/omr-generator/OMRGenerator';
import { ExamsList } from './components/exam/ExamsList';
import { CameraScanner } from './components/camera/CameraScanner';
import { InstitutionManagement } from './components/management/InstitutionManagement';
import { ExamResultsList } from './components/results/ExamResultsList';
import { LoginForm } from './components/auth/LoginForm';
import { Footer } from './components/layout/Footer';

import { storageService, initStorage } from './services/storageService';
import { getStoredTheme, applyTheme, toggleTheme, Theme } from './services/themeService';
import { User } from './types';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    try {
      // Apply saved theme on mount
      applyTheme(theme);

      // Initialize mock data and storage on first load
      initStorage();
      const user = storageService.getSessionUser();
      setCurrentUser(user);
    } catch (err) {
      console.error('Initialization error in App:', err);
    } finally {
      setIsReady(true);
    }

    // PWA Install Prompt handling
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = toggleTheme();
    setTheme(nextTheme);
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleLogout = () => {
    storageService.logoutUser();
    setCurrentUser(null);
  };

  const handleNavigateToOMR = (examId?: string) => {
    if (examId) {
      setSelectedExamId(examId);
    }
    setActiveTab('generate-omr');
  };

  if (!isReady) {
    return <div className="flex h-screen items-center justify-center text-white bg-slate-950 font-bold">Yükleniyor...</div>;
  }

  // If not logged in, show modern Login Screen
  if (!currentUser) {
    return (
      <LoginForm
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab('dashboard');
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between pb-24 md:pb-0 transition-colors">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        deferredPrompt={deferredPrompt}
        installApp={handleInstallApp}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="animate-fade-in max-w-7xl mx-auto px-4 flex-1 w-full">
        {/* Dashboard Rendering based on Role */}
        {activeTab === 'dashboard' && currentUser.role === 'SUPER_ADMIN' && <SuperAdminDash currentUser={currentUser} />}
        {activeTab === 'dashboard' && (currentUser.role === 'INSTITUTION_ADMIN' || currentUser.role === 'TEACHER') && (
          <div className="mx-auto max-w-6xl py-2"><InstitutionAdminDash setActiveTab={setActiveTab} /></div>
        )}

        {/* 1. Sınav Oluşturma Paneli */}
        {activeTab === 'create-exam' && (
          <ExamCreateBuilder
            currentUser={currentUser}
            onNavigateToOMR={(examId) => handleNavigateToOMR(examId)}
            onNavigateToExams={() => setActiveTab('exams')}
          />
        )}

        {/* 2. Optik Üret Paneli */}
        {(activeTab === 'generate-omr' || activeTab === 'generator') && (
          <OMRGenerator
            initialExamId={selectedExamId}
            onNavigateToExams={() => setActiveTab('exams')}
            onNavigateToCreateExam={() => setActiveTab('create-exam')}
          />
        )}

        {/* 3. Sınavlar Listesi Paneli */}
        {activeTab === 'exams' && (
          <ExamsList
            currentUser={currentUser}
            highlightedExamId={selectedExamId}
            onNavigateToCreateExam={() => setActiveTab('create-exam')}
            onNavigateToOMR={(examId) => handleNavigateToOMR(examId)}
            onNavigateToScan={() => setActiveTab('scan')}
            onNavigateToResults={(examId) => {
              setSelectedExamId(examId);
              setActiveTab('results');
            }}
          />
        )}
        
        {/* Management Tab */}
        {activeTab === 'management' && currentUser.role === 'SUPER_ADMIN' && <SuperAdminDash currentUser={currentUser} />}
        {activeTab === 'management' && currentUser.role !== 'SUPER_ADMIN' && <InstitutionManagement />}

        {/* Camera Scan Tab */}
        {activeTab === 'scan' && (
          <CameraScanner
            onScanComplete={(result) => {
              setSelectedExamId(result.examId);
              setActiveTab('exams');
            }}
          />
        )}

        {/* Results Tab */}
        {activeTab === 'results' && <ExamResultsList initialExamId={selectedExamId} />}
      </main>

      {/* Sayfa Alt Bilgi (Footer) */}
      <Footer />
    </div>
  );
}

export default App;
