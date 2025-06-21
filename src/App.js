import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CounselingProvider } from './contexts/CounselingContext';

// 페이지 컴포넌트
import HomePage from './pages/HomePage';
import PracticeMode from './pages/PracticeMode';
import CounselingMode from './pages/CounselingMode';
import ProfilePage from './pages/ProfilePage';
import AchievementsPage from './pages/AchievementsPage';
import ResultsPage from './pages/ResultsPage';

// 공통 컴포넌트
import Navigation from './components/common/Navigation';
import AIFloatingHelper from './components/ai/AIFloatingHelper';
import LoadingScreen from './components/common/LoadingScreen';

// 스타일
import './styles/globals.css';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 로딩
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <AuthProvider>
      <CounselingProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
            <Navigation />
            
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/practice" element={<PracticeMode />} />
                <Route path="/counseling" element={<CounselingMode />} />
                <Route path="/counseling/result" element={<ResultsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            
            <AIFloatingHelper />
            <Toaster position="top-right" />
          </div>
        </Router>
      </CounselingProvider>
    </AuthProvider>
  );
}

export default App;