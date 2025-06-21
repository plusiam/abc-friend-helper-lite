// src/components/ai/AIFloatingHelper.js - AI 플로팅 도우미 컴포넌트
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChatBubbleLeftEllipsisIcon,
  LightBulbIcon,
  HeartIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const AIFloatingHelper = () => {
  const { userData } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentTip, setCurrentTip] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // 페이지별 도움말 정의
  const helpContent = {
    '/': {
      title: '시작하기',
      tips: [
        '처음이신가요? 연습 모드부터 시작해보세요!',
        '실전 상담은 진짜 친구의 고민을 들어줄 때 사용해요.',
        '레벨이 올라가면 더 많은 기능을 사용할 수 있어요.'
      ],
      icon: HeartIcon
    },
    '/practice': {
      title: '연습 모드 도움말',
      tips: [
        'AI 친구와 안전하게 상담 연습을 할 수 있어요.',
        '친구의 성격에 맞춰 대화 방식을 바꿔보세요.',
        '실수해도 괜찮아요! 연습이니까요.'
      ],
      icon: LightBulbIcon
    },
    '/counseling': {
      title: '실전 상담 도움말',
      tips: [
        '4단계로 체계적인 상담을 진행해보세요.',
        '친구의 감정을 먼저 인정해주는 것이 중요해요.',
        'ABC 모델로 문제를 분석하면 해결책을 찾기 쉬워요.'
      ],
      icon: ChatBubbleLeftEllipsisIcon
    },
    '/profile': {
      title: '프로필 도움말',
      tips: [
        '상담 스킬을 확인하고 성장을 추적해보세요.',
        '배지를 모으면서 재미있게 실력을 늘려보세요.',
        '설정에서 알림과 난이도를 조정할 수 있어요.'
      ],
      icon: HeartIcon
    },
    '/achievements': {
      title: '업적 도움말',
      tips: [
        '다양한 배지를 모으면서 성취감을 느껴보세요.',
        '각 배지마다 특별한 의미가 있어요.',
        '친구들과 배지를 비교해보는 것도 재미있어요!'
      ],
      icon: LightBulbIcon
    }
  };

  // 현재 페이지의 도움말 가져오기
  const getCurrentHelp = () => {
    const currentPath = location.pathname;
    return helpContent[currentPath] || helpContent['/'];
  };

  // 랜덤 팁 선택
  useEffect(() => {
    const help = getCurrentHelp();
    const randomTip = help.tips[Math.floor(Math.random() * help.tips.length)];
    setCurrentTip(randomTip);
  }, [location.pathname]);

  // 일정 시간마다 팁 변경
  useEffect(() => {
    const interval = setInterval(() => {
      const help = getCurrentHelp();
      const randomTip = help.tips[Math.floor(Math.random() * help.tips.length)];
      setCurrentTip(randomTip);
    }, 15000); // 15초마다 변경

    return () => clearInterval(interval);
  }, [location.pathname]);

  const help = getCurrentHelp();
  const Icon = help.icon;

  // 특정 페이지에서는 숨기기
  if (location.pathname === '/counseling/result') {
    return null;
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-40"
      >
        {!isOpen && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="relative">
              <Icon className="w-6 h-6" />
              {/* 알림 점 */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
            </div>
          </motion.button>
        )}
      </motion.div>

      {/* 도움말 패널 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 400, y: 20 }}
            className="fixed bottom-6 right-6 w-80 bg-white rounded-lg shadow-2xl z-50 overflow-hidden"
          >
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className="w-5 h-5" />
                  <h3 className="font-bold">{help.title}</h3>
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    {isMinimized ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 콘텐츠 */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="p-4"
                >
                  {/* AI 아바타 */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-lg">
                      🤖
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">AI 도우미</h4>
                      <p className="text-xs text-gray-500">상담 도움이</p>
                    </div>
                  </div>

                  {/* 현재 팁 */}
                  <div className="bg-purple-50 p-3 rounded-lg mb-4">
                    <div className="flex items-start space-x-2">
                      <div className="text-purple-500 mt-0.5">💡</div>
                      <p className="text-sm text-purple-700 leading-relaxed">
                        {currentTip}
                      </p>
                    </div>
                  </div>

                  {/* 사용자 레벨 정보 */}
                  {userData && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">현재 레벨</span>
                        <span className="font-bold text-gray-800">레벨 {userData.level}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(userData.experience % 100)}%` }}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          transition={{ duration: 1 }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {userData.experience % 100}/100 XP
                      </div>
                    </div>
                  )}

                  {/* 빠른 액션 */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-bold text-gray-700">빠른 도움말</h5>
                    {help.tips.slice(0, 2).map((tip, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentTip(tip)}
                        className="w-full text-left p-2 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
                      >
                        • {tip}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIFloatingHelper;