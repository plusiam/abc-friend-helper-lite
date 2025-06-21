// src/pages/ResultsPage.js - 상담 결과 페이지
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  CheckCircleIcon,
  StarIcon,
  TrophyIcon,
  HeartIcon,
  LightBulbIcon,
  HandRaisedIcon,
  ChartBarIcon,
  ShareIcon,
  HomeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, addExperience, awardBadge } = useAuth();
  const [showConfetti, setShowConfetti] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (location.state?.result) {
      setResult(location.state.result);
      setShowConfetti(true);
      
      // 배지 획득 체크
      checkForNewBadges(location.state.result);
      
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      // 결과 데이터가 없으면 홈으로 리다이렉트
      navigate('/');
    }
  }, [location.state, navigate]);

  const checkForNewBadges = async (sessionResult) => {
    if (!userData) return;
    
    // 첫 상담 완료 배지
    if ((userData.stats?.totalSessions || 0) === 0) {
      await awardBadge('firstCounseling', '첫 상담 완료');
    }
    
    // 고점수 배지
    if (sessionResult.scores.empathy >= 90) {
      await awardBadge('empathyMaster', '공감 마스터');
    }
    
    // 상담 횟수 배지
    const totalSessions = (userData.stats?.totalSessions || 0) + 1;
    if (totalSessions === 5) {
      await awardBadge('counselor5', '상담사 신예');
    } else if (totalSessions === 10) {
      await awardBadge('counselor10', '대화의 달인');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    return 'D';
  };

  const getMotivationalMessage = (overallScore) => {
    if (overallScore >= 90) {
      return {
        title: '훌륭해요! 🎆',
        message: '당신은 이미 후련한 상담사예요! 친구들이 당신을 정말 많이 신뢰할 거예요.'
      };
    } else if (overallScore >= 80) {
      return {
        title: '잘하고 있어요! 🎉',
        message: '상담 실력이 많이 늘었어요. 조금만 더 연습하면 완벽해질 거예요!'
      };
    } else if (overallScore >= 70) {
      return {
        title: '좋은 시작이에요! 💪',
        message: '기본기는 잘 갖추었어요. 계속 연습하면 더 나아질 수 있어요!'
      };
    } else {
      return {
        title: '계속 노력해요! 🌱',
        message: '누구나 처음은 어려워요. 포기하지 말고 계속 연습해보세요!'
      };
    }
  };

  const handleShare = () => {
    const shareText = `ABC 친구 도우미에서 상담 연습을 했어요! \n공감: ${result.scores.empathy}점 \n문제해결: ${result.scores.problemSolving}점 \n격려: ${result.scores.encouragement}점`;
    
    if (navigator.share) {
      navigator.share({
        title: 'ABC 친구 도우미 상담 결과',
        text: shareText,
        url: window.location.origin
      });
    } else {
      navigator.clipboard.writeText(shareText + ` \n${window.location.origin}`);
      toast.success('결과가 클립보드에 복사되었어요!');
    }
  };

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-gray-500">
          결과를 불러오는 중...
        </div>
      </div>
    );
  }

  const overallScore = Math.round(
    (result.scores.empathy + result.scores.problemSolving + result.scores.encouragement) / 3
  );
  
  const motivationalMessage = getMotivationalMessage(overallScore);
  const duration = Math.round(result.duration / 60000); // 분 단위

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 콘피티 효과 */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -100, x: Math.random() * window.innerWidth, rotate: 0 }}
              animate={{ 
                y: window.innerHeight + 100, 
                rotate: 360,
                transition: { 
                  duration: 3,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }
              }}
              className="absolute text-2xl"
            >
              {['🎉', '🎆', '⭐', '🏆', '💫'][Math.floor(Math.random() * 5)]}
            </motion.div>
          ))}
        </div>
      )}

      {/* 메인 결과 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          상담 완료!
        </h1>
        <p className="text-lg text-gray-600">
          수고하셨습니다! 당신의 상담 결과를 확인해보세요.
        </p>
      </motion.div>

      {/* 전체 점수 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 text-white text-center"
      >
        <h2 className="text-2xl font-bold mb-4">종합 점수</h2>
        <div className="text-6xl font-bold mb-2">{overallScore}</div>
        <div className="text-2xl mb-4">{getScoreGrade(overallScore)} 등급</div>
        
        <div className="bg-white/20 rounded-lg p-4">
          <h3 className="font-bold mb-2">{motivationalMessage.title}</h3>
          <p className="text-white/90">{motivationalMessage.message}</p>
        </div>
      </motion.div>

      {/* 상세 점수 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-3 gap-6"
      >
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <HeartIcon className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">공감 표현</h3>
          <div className={`text-4xl font-bold mb-2 ${getScoreColor(result.scores.empathy)}`}>
            {result.scores.empathy}
          </div>
          <div className="text-sm text-gray-600">
            친구의 마음을 이해하고 공감하는 능력
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <LightBulbIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">문제 해결</h3>
          <div className={`text-4xl font-bold mb-2 ${getScoreColor(result.scores.problemSolving)}`}>
            {result.scores.problemSolving}
          </div>
          <div className="text-sm text-gray-600">
            체계적으로 문제를 분석하고 해결하는 능력
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <HandRaisedIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">격려하기</h3>
          <div className={`text-4xl font-bold mb-2 ${getScoreColor(result.scores.encouragement)}`}>
            {result.scores.encouragement}
          </div>
          <div className="text-sm text-gray-600">
            친구에게 희망과 힙을 주는 능력
          </div>
        </div>
      </motion.div>

      {/* 세션 정보 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <ChartBarIcon className="w-6 h-6 mr-2 text-blue-500" />
          세션 정보
        </h2>
        
        <div className="grid md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">{duration}분</div>
            <div className="text-sm text-blue-600">소요 시간</div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">{result.stepsCompleted}/4</div>
            <div className="text-sm text-green-600">완료 단계</div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">+25</div>
            <div className="text-sm text-purple-600">경험치</div>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 mb-1">+{Math.floor(overallScore / 10)}</div>
            <div className="text-sm text-yellow-600">스킬 포인트</div>
          </div>
        </div>
      </motion.div>

      {/* 개선 제안 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          💡 다음에는 이렇게 해보세요
        </h2>
        
        <div className="space-y-4">
          {result.scores.empathy < 80 && (
            <div className="p-4 bg-pink-50 rounded-lg border-l-4 border-pink-400">
              <h3 className="font-bold text-pink-800 mb-2">공감 표현 향상</h3>
              <p className="text-pink-700 text-sm">
                친구의 감정을 더 구체적으로 인정해주고, 비슷한 경험을 공유해보세요.
              </p>
            </div>
          )}
          
          {result.scores.problemSolving < 80 && (
            <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <h3 className="font-bold text-yellow-800 mb-2">문제 해결 능력 향상</h3>
              <p className="text-yellow-700 text-sm">
                ABC 모델을 더 체계적으로 활용하고, 구체적인 해결책을 제시해보세요.
              </p>
            </div>
          )}
          
          {result.scores.encouragement < 80 && (
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
              <h3 className="font-bold text-green-800 mb-2">격려 메시지 향상</h3>
              <p className="text-green-700 text-sm">
                친구의 장점을 구체적으로 언급하고, 미래에 대한 희망적인 메시지를 전해보세요.
              </p>
            </div>
          )}
          
          {overallScore >= 80 && (
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <h3 className="font-bold text-blue-800 mb-2">후련한 상담사네요!</h3>
              <p className="text-blue-700 text-sm">
                이제 더 어려운 상황의 친구들을 도와주거나, 다른 친구들에게 상담 방법을 알려주세요.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* 액션 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center space-x-4"
      >
        <button
          onClick={handleShare}
          className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <ShareIcon className="w-5 h-5 mr-2" />
          결과 공유하기
        </button>
        
        <button
          onClick={() => navigate('/practice')}
          className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <ArrowPathIcon className="w-5 h-5 mr-2" />
          다시 연습하기
        </button>
        
        <button
          onClick={() => navigate('/')}
          className="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <HomeIcon className="w-5 h-5 mr-2" />
          홈으로
        </button>
      </motion.div>
    </div>
  );
};

export default ResultsPage;