// src/pages/AchievementsPage.js - 업적 및 배지 페이지
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  TrophyIcon,
  StarIcon,
  HeartIcon,
  LightBulbIcon,
  UserGroupIcon,
  ChatBubbleLeftEllipsisIcon,
  AcademicCapIcon,
  FireIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import {
  TrophyIcon as TrophyIconSolid,
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';

const AchievementsPage = () => {
  const { userData } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (!userData) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-gray-500">
          로그인이 필요합니다.
        </div>
      </div>
    );
  }

  // 전체 배지 정의
  const allBadges = {
    // 기본 배지
    firstLogin: {
      name: '첫 방문',
      description: 'ABC 친구 도우미에 처음 오신 것을 환영해요!',
      icon: '👋',
      category: 'basic',
      rarity: 'common',
      condition: () => true
    },
    firstCounseling: {
      name: '첫 상담 완료',
      description: '첫 번째 상담을 완료했어요. 훌륭한 시작이에요!',
      icon: '🌱',
      category: 'counseling',
      rarity: 'common',
      condition: () => (userData.stats?.totalSessions || 0) >= 1
    },
    firstPractice: {
      name: '첫 연습',
      description: '연습 모드를 처음 시도해보셨네요!',
      icon: '🎯',
      category: 'practice',
      rarity: 'common',
      condition: () => true // 연습 데이터가 있을 때
    },

    // 상담 배지
    counselor5: {
      name: '상담사 신예',
      description: '5회 상담을 완료했어요!',
      icon: '🎆',
      category: 'counseling',
      rarity: 'common',
      condition: () => (userData.stats?.totalSessions || 0) >= 5
    },
    counselor10: {
      name: '대화의 달인',
      description: '10회 상담을 완료했어요!',
      icon: '🌙',
      category: 'counseling',
      rarity: 'uncommon',
      condition: () => (userData.stats?.totalSessions || 0) >= 10
    },
    counselor25: {
      name: '대화의 마스터',
      description: '25회 상담을 완료했어요!',
      icon: '🌠',
      category: 'counseling',
      rarity: 'rare',
      condition: () => (userData.stats?.totalSessions || 0) >= 25
    },

    // 스킬 배지
    empathyMaster: {
      name: '공감 마스터',
      description: '공감 스킬 100포인트를 달성했어요!',
      icon: '💖',
      category: 'skill',
      rarity: 'uncommon',
      condition: () => (userData.skills?.empathy || 0) >= 100
    },
    listeningExpert: {
      name: '경청 전문가',
      description: '경청 스킬 100포인트를 달성했어요!',
      icon: '👂',
      category: 'skill',
      rarity: 'uncommon',
      condition: () => (userData.skills?.listening || 0) >= 100
    },
    problemSolver: {
      name: '문제 해결사',
      description: '문제해결 스킬 100포인트를 달성했어요!',
      icon: '💡',
      category: 'skill',
      rarity: 'uncommon',
      condition: () => (userData.skills?.problemSolving || 0) >= 100
    },
    encouragementGuru: {
      name: '격려 구루',
      description: '격려 스킬 100포인트를 달성했어요!',
      icon: '🙌',
      category: 'skill',
      rarity: 'uncommon',
      condition: () => (userData.skills?.encouragement || 0) >= 100
    },

    // 성취 배지
    helpingHand: {
      name: '도움의 손길',
      description: '10명의 친구를 도와주었어요!',
      icon: '🤝',
      category: 'achievement',
      rarity: 'uncommon',
      condition: () => (userData.stats?.helpedFriends || 0) >= 10
    },
    speedCounselor: {
      name: '빠른 상담사',
      description: '하루에 5회 상담을 완료했어요!',
      icon: '⚡',
      category: 'achievement',
      rarity: 'rare',
      condition: () => false // 일일 데이터 필요
    },
    perfectScore: {
      name: '완벽한 점수',
      description: '상담에서 100점을 받았어요!',
      icon: '🎆',
      category: 'achievement',
      rarity: 'epic',
      condition: () => false // 점수 데이터 필요
    },

    // 특별 배지
    earlyBird: {
      name: '이른 새',
      description: '오전 6시 전에 상담을 완료했어요!',
      icon: '🐦',
      category: 'special',
      rarity: 'rare',
      condition: () => false
    },
    nightOwl: {
      name: '올븼이',
      description: '오후 10시 이후에 상담을 완료했어요!',
      icon: '🦉',
      category: 'special',
      rarity: 'rare',
      condition: () => false
    },
    weekendWarrior: {
      name: '주말 전사',
      description: '주말에도 상담 활동을 했어요!',
      icon: '🏆',
      category: 'special',
      rarity: 'rare',
      condition: () => false
    }
  };

  const categories = [
    { id: 'all', name: '전체', icon: TrophyIcon },
    { id: 'basic', name: '기본', icon: StarIcon },
    { id: 'counseling', name: '상담', icon: ChatBubbleLeftEllipsisIcon },
    { id: 'skill', name: '스킬', icon: AcademicCapIcon },
    { id: 'achievement', name: '성취', icon: ChartBarIcon },
    { id: 'special', name: '특별', icon: FireIcon }
  ];

  const rarityConfig = {
    common: { color: 'gray', label: '일반' },
    uncommon: { color: 'green', label: '고급' },
    rare: { color: 'blue', label: '희귀' },
    epic: { color: 'purple', label: '전설' },
    legendary: { color: 'yellow', label: '신화' }
  };

  const isEarned = (badgeId) => {
    return userData.badges && userData.badges[badgeId];
  };

  const canEarn = (badge) => {
    return !isEarned && badge.condition();
  };

  const filteredBadges = Object.entries(allBadges).filter(([_, badge]) => {
    return selectedCategory === 'all' || badge.category === selectedCategory;
  });

  const earnedCount = Object.keys(userData.badges || {}).length;
  const totalCount = Object.keys(allBadges).length;
  const completionRate = Math.round((earnedCount / totalCount) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🏆 내 업적 및 배지
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          상담 활동을 통해 다양한 배지를 획득해보세요!
        </p>
        
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
          <div className="text-4xl font-bold text-purple-600 mb-2">
            {earnedCount}/{totalCount}
          </div>
          <div className="text-gray-600 mb-4">배지 획득률</div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
          <div className="text-sm text-gray-500 mt-2">{completionRate}% 완료</div>
        </div>
      </motion.div>

      {/* 카테고리 필터 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div className="flex space-x-1">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    flex items-center px-4 py-2 rounded-lg transition-all
                    ${selectedCategory === category.id
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* 배지 그리드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {filteredBadges.map(([badgeId, badge]) => {
          const earned = isEarned(badgeId);
          const available = canEarn(badge);
          const rarity = rarityConfig[badge.rarity];
          
          return (
            <motion.div
              key={badgeId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              className={`
                relative p-6 rounded-lg shadow-lg transition-all
                ${earned
                  ? `bg-gradient-to-br from-${rarity.color}-50 to-${rarity.color}-100 border-2 border-${rarity.color}-300`
                  : available
                    ? 'bg-yellow-50 border-2 border-yellow-300'
                    : 'bg-gray-50 border-2 border-gray-200'
                }
              `}
            >
              {/* 레어리티 표시 */}
              <div className={`
                absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium
                bg-${rarity.color}-100 text-${rarity.color}-700
              `}>
                {rarity.label}
              </div>
              
              {/* 배지 아이콘 */}
              <div className="text-center mb-4">
                <div className={`
                  text-6xl mb-2 transition-all
                  ${!earned ? 'grayscale opacity-50' : ''}
                `}>
                  {badge.icon}
                </div>
                
                {earned && (
                  <div className="flex justify-center">
                    <TrophyIconSolid className={`w-6 h-6 text-${rarity.color}-500`} />
                  </div>
                )}
                
                {available && !earned && (
                  <div className="flex justify-center">
                    <StarIconSolid className="w-6 h-6 text-yellow-500 animate-pulse" />
                  </div>
                )}
              </div>
              
              {/* 배지 정보 */}
              <div className="text-center">
                <h3 className={`
                  font-bold mb-2
                  ${earned ? `text-${rarity.color}-800` : 'text-gray-600'}
                `}>
                  {badge.name}
                </h3>
                
                <p className={`
                  text-sm
                  ${earned ? `text-${rarity.color}-600` : 'text-gray-500'}
                `}>
                  {badge.description}
                </p>
                
                {earned && userData.badges[badgeId]?.awardedAt && (
                  <div className="mt-3 text-xs text-gray-500">
                    획득일: {new Date(userData.badges[badgeId].awardedAt).toLocaleDateString()}
                  </div>
                )}
                
                {available && !earned && (
                  <div className="mt-3">
                    <div className="text-xs text-yellow-600 font-medium">
                      획득 가능! 🎆
                    </div>
                  </div>
                )}
              </div>
              
              {/* 잠금 효과 */}
              {!earned && !available && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                  <div className="text-gray-400 text-4xl">🔒</div>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* 업적 통계 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-lg p-8"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          통계 및 진행률
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.slice(1).map((category) => {
            const categoryBadges = Object.entries(allBadges).filter(
              ([_, badge]) => badge.category === category.id
            );
            const earnedInCategory = categoryBadges.filter(
              ([badgeId, _]) => isEarned(badgeId)
            ).length;
            const progress = Math.round((earnedInCategory / categoryBadges.length) * 100);
            const Icon = category.icon;
            
            return (
              <div key={category.id} className="text-center p-4 bg-gray-50 rounded-lg">
                <Icon className="w-8 h-8 mx-auto mb-3 text-purple-500" />
                <h3 className="font-bold text-gray-800 mb-2">{category.name}</h3>
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {earnedInCategory}/{categoryBadges.length}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="bg-purple-500 h-2 rounded-full"
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{progress}%</div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default AchievementsPage;