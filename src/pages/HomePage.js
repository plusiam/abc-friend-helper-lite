// src/pages/HomePage.js - 메인 홈페이지
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  HeartIcon, 
  UserGroupIcon, 
  AcademicCapIcon,
  TrophyIcon,
  PlayIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, userData, signInAnonymous } = useAuth();

  const handleGetStarted = async () => {
    if (!user) {
      await signInAnonymous();
    }
    navigate('/counseling');
  };

  const handlePractice = async () => {
    if (!user) {
      await signInAnonymous();
    }
    navigate('/practice');
  };

  const features = [
    {
      icon: HeartIcon,
      title: '공감 능력 향상',
      description: '친구의 마음을 이해하고 공감하는 방법을 배워보세요',
      color: 'text-pink-500'
    },
    {
      icon: ChatBubbleLeftEllipsisIcon,
      title: '대화 기술 연습',
      description: '어려운 상황에서도 자연스럽게 대화하는 방법을 연습합니다',
      color: 'text-blue-500'
    },
    {
      icon: AcademicCapIcon,
      title: '문제 해결 능력',
      description: '친구의 고민을 함께 해결하는 체계적인 방법을 배워보세요',
      color: 'text-green-500'
    },
    {
      icon: TrophyIcon,
      title: '성장 추적',
      description: '내 상담 실력을 숫자로 확인하고 다양한 배지를 얻어보세요',
      color: 'text-yellow-500'
    }
  ];

  const quickActions = [
    {
      title: '실전 상담',
      description: '진짜 친구의 고민을 들어주고 도와주세요',
      icon: UserGroupIcon,
      action: handleGetStarted,
      gradient: 'from-purple-500 to-pink-500',
      disabled: false
    },
    {
      title: '연습 모드',
      description: 'AI 친구와 함께 안전하게 연습해보세요',
      icon: PlayIcon,
      action: handlePractice,
      gradient: 'from-blue-500 to-cyan-500',
      disabled: false
    }
  ];

  return (
    <div className="min-h-screen">
      {/* 히어로 섹션 */}
      <section className="relative py-20 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
            🌈 <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ABC 친구 도우미
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            또래 상담을 재미있게 배워보세요! 👥
          </p>
          <p className="text-lg text-gray-500 mb-12">
            공감, 경청, 문제해결 능력을 게임처럼 즐겁게 배워보세요
          </p>
          
          {userData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 shadow-lg mb-8 max-w-md mx-auto"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                환영합니다, {userData.nickname}님! 👋
              </h3>
              <div className="flex justify-between text-sm text-gray-600">
                <span>레벨 {userData.level}</span>
                <span>경험치 {userData.experience}</span>
                <span>상담 {userData.stats.totalSessions}회</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* 빠른 시작 버튼 */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.action}
                disabled={action.disabled}
                className={`
                  relative overflow-hidden rounded-xl p-8 text-white
                  bg-gradient-to-r ${action.gradient}
                  shadow-lg hover:shadow-xl transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <div className="flex items-center space-x-4">
                  <action.icon className="w-12 h-12" />
                  <div className="text-left">
                    <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                    <p className="text-white/90">{action.description}</p>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full transform translate-x-8 -translate-y-8" />
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              왜 ABC 친구 도우미일까요? 🤔
            </h2>
            <p className="text-lg text-gray-600">
              어린이들이 자연스럽게 또래 상담 능력을 기를 수 있도록 도와드립니다
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow"
              >
                <feature.icon className={`w-12 h-12 ${feature.color} mx-auto mb-4`} />
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-4">
            지금 바로 시작해보세요! 🚀
          </h2>
          <p className="text-xl mb-8 text-white/90">
            친구들을 도와주는 상담사가 되어보세요
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              실전 상담 시작하기
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePractice}
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white hover:text-purple-600 transition-colors"
            >
              연습모드 체험하기
            </motion.button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;