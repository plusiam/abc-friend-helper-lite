// src/pages/ABCResultsPage.js - ABC 모델 전용 결과 페이지
import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRightIcon,
  LightBulbIcon,
  HeartIcon,
  ChartBarIcon,
  ShareIcon,
  HomeIcon,
  ArrowPathIcon,
  SparklesIcon,
  CheckCircleIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ABCResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, awardBadge } = useAuth();
  const [showCelebration, setShowCelebration] = useState(false);
  const [result, setResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const checkForABCBadges = useCallback(async (abcResult) => {
    if (!userData || !abcResult.summary) return;
    
    const { summary } = abcResult;
    
    // 첫 ABC 완료 배지
    if ((userData.stats?.abcCompletions || 0) === 0) {
      await awardBadge('firstABC', '🧠 사고력 새싹', 'ABC 모델을 처음 완성했어요!');
    }
    
    // 인지적 성장 배지
    if (summary.cognitiveGrowth >= 90) {
      await awardBadge('cognitiveExcellence', '🌟 인지 마스터', '뛰어난 사고 전환 능력을 보여줬어요!');
    }
    
    // 감정 조절 배지
    if (summary.emotionalRegulation >= 85) {
      await awardBadge('emotionalWisdom', '💙 감정 지혜자', '감정을 잘 조절하는 방법을 터득했어요!');
    }
    
    // 문제해결 배지
    if (summary.problemSolving >= 85) {
      await awardBadge('solutionMaker', '🎯 해결사', '창의적인 문제해결 능력이 뛰어나요!');
    }
    
    // 전체 우수 배지
    if (summary.overall >= 90) {
      await awardBadge('abcExpert', '🏆 ABC 전문가', 'ABC 모델을 완벽하게 마스터했어요!');
    }
    
    // 연속 완료 배지
    const streak = userData.stats?.currentStreak || 0;
    if (streak >= 3) {
      await awardBadge('consistent', '🔥 꾸준한 학습자', '3일 연속으로 ABC 연습을 완료했어요!');
    }
  }, [userData, awardBadge]);

  useEffect(() => {
    if (location.state?.abcResult) {
      setResult(location.state.abcResult);
      setShowCelebration(true);
      
      // ABC 배지 획득 체크
      checkForABCBadges(location.state.abcResult);
      
      // 단계별 애니메이션
      const timer = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < 3) return prev + 1;
          clearInterval(timer);
          return prev;
        });
      }, 1000);
      
      setTimeout(() => setShowCelebration(false), 4000);
      
      return () => clearInterval(timer);
    } else {
      navigate('/practice');
    }
  }, [location.state, navigate, checkForABCBadges]);

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getChangeIntensity = (beforeScore, afterScore) => {
    const improvement = afterScore - beforeScore;
    if (improvement >= 30) return { level: 'excellent', label: '큰 변화', color: 'text-green-600' };
    if (improvement >= 20) return { level: 'good', label: '좋은 변화', color: 'text-blue-600' };
    if (improvement >= 10) return { level: 'moderate', label: '적절한 변화', color: 'text-yellow-600' };
    return { level: 'small', label: '작은 변화', color: 'text-gray-600' };
  };

  const handleShare = () => {
    const { summary } = result;
    const shareText = `ABC 사고 모델 연습 완료! 🧠\n\n✨ 인지적 성장: ${summary.cognitiveGrowth}점\n💙 감정 조절: ${summary.emotionalRegulation}점\n🎯 문제해결: ${summary.problemSolving}점\n🏆 종합: ${summary.overall}점\n\n#ABC친구도우미 #사고력훈련`;
    
    if (navigator.share) {
      navigator.share({
        title: 'ABC 사고 모델 연습 결과',
        text: shareText,
        url: window.location.origin
      });
    } else {
      navigator.clipboard.writeText(shareText + `\n${window.location.origin}`);
      toast.success('결과가 클립보드에 복사되었어요! 📋');
    }
  };

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-gray-500">결과를 불러오는 중...</div>
      </div>
    );
  }

  const { responses, summary, highlights, progressBadge, personalizedAdvice } = result;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 축하 애니메이션 */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -100, x: Math.random() * window.innerWidth, opacity: 1 }}
              animate={{ 
                y: window.innerHeight + 100,
                x: Math.random() * window.innerWidth,
                rotate: 720,
                transition: { 
                  duration: 4,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }
              }}
              className="absolute text-3xl"
            >
              {['🧠', '✨', '🌟', '🎯', '💙', '🏆', '🎉'][Math.floor(Math.random() * 7)]}
            </motion.div>
          ))}
        </div>
      )}

      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-8xl mb-4">🎉</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          ABC 모델 완성!
        </h1>
        <p className="text-xl text-gray-600">
          생각을 바꾸고 긍정적인 행동을 계획하는 과정을 성공적으로 완료했어요!
        </p>
      </motion.div>

      {/* ABC 변화 과정 시각화 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
          🔄 당신의 변화 과정
        </h2>
        
        <div className="space-y-8">
          {/* A → B */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: currentStep >= 1 ? 1 : 0.3 }}
            className="flex items-center space-x-4"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
              A
            </div>
            <ArrowRightIcon className="w-6 h-6 text-gray-400" />
            <div className="flex-shrink-0 w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
              B
            </div>
            <div className="flex-1">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-blue-800 mb-2">상황 → 부정적 생각</h3>
                <p className="text-sm text-gray-600 mb-2">{responses.A}</p>
                <p className="text-sm text-red-700 bg-red-50 p-2 rounded">
                  "{responses.B}"
                </p>
              </div>
            </div>
          </motion.div>

          {/* B → B' */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: currentStep >= 2 ? 1 : 0.3 }}
            className="flex items-center space-x-4"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
              B
            </div>
            <ArrowRightIcon className="w-6 h-6 text-gray-400" />
            <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
              B'
            </div>
            <div className="flex-1">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-green-800 mb-2">사고 전환 ✨</h3>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-red-600">이전: </span>
                    <span className="text-gray-600">"{responses.B}"</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-green-600">새로운: </span>
                    <span className="text-green-800 bg-green-50 p-2 rounded">
                      "{responses.B_prime}"
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* B' → C' */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: currentStep >= 3 ? 1 : 0.3 }}
            className="flex items-center space-x-4"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
              B'
            </div>
            <ArrowRightIcon className="w-6 h-6 text-gray-400" />
            <div className="flex-shrink-0 w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
              C'
            </div>
            <div className="flex-1">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-purple-800 mb-2">긍정적 행동 계획 🎯</h3>
                <p className="text-purple-800 bg-purple-50 p-2 rounded text-sm">
                  "{responses.C_prime}"
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* 종합 점수 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-white text-center"
      >
        <h2 className="text-3xl font-bold mb-6">🏆 종합 평가</h2>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white/20 rounded-lg p-4">
            <LightBulbIcon className="w-8 h-8 mx-auto mb-2" />
            <div className="text-3xl font-bold mb-1">{summary.cognitiveGrowth}</div>
            <div className="text-sm opacity-90">인지적 성장</div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-4">
            <HeartIcon className="w-8 h-8 mx-auto mb-2" />
            <div className="text-3xl font-bold mb-1">{summary.emotionalRegulation}</div>
            <div className="text-sm opacity-90">감정 조절</div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-4">
            <ChartBarIcon className="w-8 h-8 mx-auto mb-2" />
            <div className="text-3xl font-bold mb-1">{summary.problemSolving}</div>
            <div className="text-sm opacity-90">문제 해결</div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-4 ring-2 ring-white">
            <TrophyIcon className="w-8 h-8 mx-auto mb-2" />
            <div className="text-4xl font-bold mb-1">{summary.overall}</div>
            <div className="text-sm opacity-90">종합 점수</div>
          </div>
        </div>
      </motion.div>

      {/* 성취 및 하이라이트 */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* 주요 성취 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <SparklesIcon className="w-6 h-6 mr-2 text-yellow-500" />
            주요 성취
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">가장 잘한 점</span>
              </div>
              <p className="text-green-700 text-sm">{highlights.bestAspect}</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center mb-2">
                <LightBulbIcon className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-800">핵심 학습</span>
              </div>
              <p className="text-blue-700 text-sm">{highlights.keyLearning}</p>
            </div>
            
            {progressBadge && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{progressBadge.icon}</span>
                  <span className="font-medium text-purple-800">새 배지 획득!</span>
                </div>
                <div className="font-bold text-purple-700">{progressBadge.name}</div>
                <p className="text-purple-600 text-sm">{progressBadge.description}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* 개인화된 조언 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            💡 맞춤형 조언
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-green-800 mb-2">계속 유지할 강점</h4>
              <ul className="text-sm text-green-700 space-y-1">
                {personalizedAdvice.strengthsToKeep.map((strength, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-800 mb-2">향상시킬 기술</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {personalizedAdvice.skillsToImprove.map((skill, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-purple-800 mb-2">다음 도전</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                {personalizedAdvice.nextChallenges.map((challenge, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    {challenge}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 액션 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="flex justify-center space-x-4"
      >
        <button
          onClick={handleShare}
          className="flex items-center px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
        >
          <ShareIcon className="w-5 h-5 mr-2" />
          성과 공유하기
        </button>
        
        <button
          onClick={() => navigate('/practice')}
          className="flex items-center px-8 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-lg"
        >
          <ArrowPathIcon className="w-5 h-5 mr-2" />
          새 시나리오 도전
        </button>
        
        <button
          onClick={() => navigate('/')}
          className="flex items-center px-8 py-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-lg"
        >
          <HomeIcon className="w-5 h-5 mr-2" />
          홈으로
        </button>
      </motion.div>
    </div>
  );
};

export default ABCResultsPage;