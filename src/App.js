import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CounselingProvider } from './contexts/CounselingContext';

// 페이지 컴포넌트
import HomePage from './pages/HomePage';
import PracticeMode from './pages/PracticeMode';
import CounselingMode from './pages/CounselingMode';
import ResultsPage from './pages/ResultsPage';
import ABCResultsPage from './pages/ABCResultsPage';

// 공통 컴포넌트
import Navigation from './components/common/Navigation';

// 스타일
import './styles/globals.css';

function App() {
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
                <Route path="/abc/result" element={<ABCResultsPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </Router>
      </CounselingProvider>
    </AuthProvider>
  );
}

export default App;