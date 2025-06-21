// src/pages/PracticeMode.js - 연습 모드 페이지
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useCounseling } from '../contexts/CounselingContext';
import { useAI } from '../hooks/useAI';
import {
  UserIcon,
  ChatBubbleBottomCenterTextIcon,
  FaceSmileIcon,
  PlayIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PracticeMode = () => {
  const navigate = useNavigate();
  const { user, signInAnonymous } = useAuth();
  const { startPracticeMode, practiceMode, addPracticeMessage } = useCounseling();
  const { getVirtualFriendResponse, loading } = useAI();
  const [selectedPersonality, setSelectedPersonality] = useState(null);
  const [currentProblem, setCurrentProblem] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [isStarted, setIsStarted] = useState(false);

  const personalities = [
    {
      id: 'shy',
      name: '수줍은 친구',
      description: '말을 잘 안하고 내성적이에요',
      icon: '😳',
      traits: ['말을 자주 말아요', '감정 표현을 어려워해요', '시간이 필요해요'],
      tip: '인내심을 가지고 천천히 들어주세요'
    },
    {
      id: 'talkative',
      name: '활발한 친구',
      description: '말이 많고 감정 표현이 풍부해요',
      icon: '😄',
      traits: ['이야기를 자세히 해요', '감정을 솔직하게 말해요', '주제가 자주 바뀔어요'],
      tip: '핑심을 파악하고 집중하도록 도와주세요'
    },
    {
      id: 'emotional',
      name: '감정적인 친구',
      description: '감정의 기복이 심하고 울기도 해요',
      icon: '😢',
      traits: ['감정이 격해요', '울거나 화낼 수 있어요', '공감을 받으면 진정돼요'],
      tip: '감정을 인정하고 따뜻하게 대해주세요'
    }
  ];

  const sampleProblems = [
    '친구들이 나를 따돼해서 너무 속상해',
    '시험을 망쳐서 부모님이 화내셨어',
    '좋아하는 친구가 나를 싫어하는 것 같아',
    '형/누나와 자꾸 싸워서 집에서 스트레스받아',
    '새 학교에 전학 와서 친구가 한 명도 없어'
  ];

  const handleStartPractice = async () => {
    if (!user) {
      await signInAnonymous();
    }
    
    if (!selectedPersonality || !currentProblem.trim()) {
      toast.error('친구 성격과 문제 상황을 선택해주세요!');
      return;
    }

    startPracticeMode(selectedPersonality);
    setIsStarted(true);
    
    // 첫 번째 AI 친구 메시지 생성
    try {
      const response = await getVirtualFriendResponse({
        personality: selectedPersonality,
        problem: currentProblem,
        counselorMessage: '안녕! 무슨 일이야? 너 잘릾 기분이 안 좋아 보이는데...',
        conversationHistory: []
      });
      
      addPracticeMessage({
        role: 'friend',
        content: currentProblem,
        timestamp: new Date()
      });
      
      setTimeout(() => {
        addPracticeMessage({
          role: 'friend',
          content: response.friendResponse,
          timestamp: new Date()
        });
      }, 1000);
    } catch (error) {
      toast.error('연습 시작 중 오류가 발생했습니다.');
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;
    
    // 사용자 메시지 추가
    addPracticeMessage({
      role: 'counselor',
      content: userMessage,
      timestamp: new Date()
    });
    
    const messageToSend = userMessage;
    setUserMessage('');
    
    try {
      const response = await getVirtualFriendResponse({
        personality: selectedPersonality,
        problem: currentProblem,
        counselorMessage: messageToSend,
        conversationHistory: practiceMode.conversationHistory
      });
      
      // AI 친구 응답 추가
      setTimeout(() => {
        addPracticeMessage({
          role: 'friend',
          content: response.friendResponse,
          timestamp: new Date(),
          quality: response.counselingQuality
        });
        
        // 피드백 메시지
        if (response.counselingQuality && response.counselingQuality.score < 70) {
          toast.error(`상담 품질: ${response.counselingQuality.score}점. 개선해보세요!`);
        } else if (response.counselingQuality) {
          toast.success(`훌륭한 상담이에요! ${response.counselingQuality.score}점`);
        }
      }, 1500);
    } catch (error) {
      toast.error('메시지 전송 중 오류가 발생했습니다.');
    }
  };

  if (!isStarted) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            🎯 연습 모드
          </h1>
          <p className="text-lg text-gray-600">
            AI 친구와 함께 안전하게 상담 연습을 해보세요
          </p>
        </motion.div>

        {/* 친구 성격 선택 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            1단계: 어떤 친구와 연습할까요? 🤔
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {personalities.map((personality) => (
              <motion.button
                key={personality.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPersonality(personality.id)}
                className={`
                  p-6 rounded-lg border-2 transition-all
                  ${selectedPersonality === personality.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                  }
                `}
              >
                <div className="text-4xl mb-3">{personality.icon}</div>
                <h3 className="font-bold text-lg mb-2">{personality.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{personality.description}</p>
                
                <div className="space-y-1">
                  {personality.traits.map((trait, index) => (
                    <div key={index} className="text-xs text-gray-500">
                      • {trait}
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                  💡 {personality.tip}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* 문제 상황 선택 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            2단계: 친구가 어떤 문제를 가지고 있을까요? 😔
          </h2>
          
          <div className="space-y-3 mb-4">
            {sampleProblems.map((problem, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.01 }}
                onClick={() => setCurrentProblem(problem)}
                className={`
                  w-full p-3 text-left rounded-lg border transition-all
                  ${currentProblem === problem
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                  }
                `}
              >
                {problem}
              </motion.button>
            ))}
          </div>
          
          <div className="relative">
            <textarea
              value={currentProblem}
              onChange={(e) => setCurrentProblem(e.target.value)}
              placeholder="또는 직접 입력해주세요..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        </motion.section>

        {/* 시작 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={handleStartPractice}
            disabled={!selectedPersonality || !currentProblem.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          >
            <PlayIcon className="w-5 h-5 inline mr-2" />
            연습 시작하기
          </button>
        </motion.div>
      </div>
    );
  }

  // 연습 진행 화면
  return (
    <div className="max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            setIsStarted(false);
            setSelectedPersonality(null);
            setCurrentProblem('');
          }}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          다시 선택하기
        </button>
        
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">
            {personalities.find(p => p.id === selectedPersonality)?.name}
          </h1>
          <p className="text-sm text-gray-600">연습 중...</p>
        </div>
        
        <div className="w-20" /> {/* 공간 맞춤용 */}
      </div>

      {/* 대화창 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 h-96 overflow-y-auto">
        <div className="space-y-4">
          {practiceMode.conversationHistory.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'counselor' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-xs lg:max-w-md px-4 py-2 rounded-lg
                ${message.role === 'counselor'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-800'
                }
              `}>
                <div className="flex items-center mb-1">
                  {message.role === 'counselor' ? (
                    <UserIcon className="w-4 h-4 mr-2" />
                  ) : (
                    <span className="text-lg mr-2">
                      {personalities.find(p => p.id === selectedPersonality)?.icon}
                    </span>
                  )}
                  <span className="text-xs opacity-75">
                    {message.role === 'counselor' ? '나' : '친구'}
                  </span>
                </div>
                <p>{message.content}</p>
                
                {message.quality && (
                  <div className="mt-2 text-xs opacity-75">
                    상담 품질: {message.quality.score}점
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 메시지 입력 */}
      <div className="flex space-x-4">
        <input
          type="text"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="친구에게 할 말을 입력하세요..."
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <button
          onClick={handleSendMessage}
          disabled={!userMessage.trim() || loading}
          className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          전송
        </button>
      </div>
    </div>
  );
};

export default PracticeMode;