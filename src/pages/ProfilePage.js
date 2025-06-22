// src/pages/ProfilePage.js - 프로필 페이지
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  UserIcon,
  CogIcon,
  ChartBarIcon,
  TrophyIcon,
  HeartIcon,
  MegaphoneIcon,
  LightBulbIcon,
  HandRaisedIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { userData, updateUserData, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: userData?.nickname || '',
    preferences: {
      notifications: userData?.preferences?.notifications ?? true,
      soundEffects: userData?.preferences?.soundEffects ?? true,
      difficulty: userData?.preferences?.difficulty || 'beginner'
    }
  });

  if (!userData) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-gray-500">
          로그인이 필요합니다.
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    try {
      await updateUserData({
        nickname: editForm.nickname,
        preferences: editForm.preferences
      });
      setIsEditing(false);
      toast.success('프로필이 업데이트되었습니다!');
    } catch (error) {
      toast.error('프로필 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('정말 로그아웃 하시겠습니까?')) {
      await signOut();
    }
  };

  const skillIcons = {
    empathy: { icon: HeartIcon, color: 'text-pink-500', name: '공감' },
    listening: { icon: MegaphoneIcon, color: 'text-blue-500', name: '경청' },
    problemSolving: { icon: LightBulbIcon, color: 'text-yellow-500', name: '문제해결' },
    encouragement: { icon: HandRaisedIcon, color: 'text-green-500', name: '격려' }
  };

  const getSkillLevel = (points) => {
    if (points >= 200) return { level: '전문가', color: 'purple' };
    if (points >= 100) return { level: '숙련자', color: 'blue' };
    if (points >= 50) return { level: '중급자', color: 'green' };
    return { level: '초보자', color: 'gray' };
  };

  const badgeCount = Object.keys(userData.badges || {}).length;
  const totalSessions = userData.stats?.totalSessions || 0;
  const successRate = totalSessions > 0 
    ? Math.round((userData.stats?.successfulSessions || 0) / totalSessions * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 프로필 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <UserIcon className="w-12 h-12" />
            </div>
            
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                  className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/70"
                  placeholder="닉네임"
                />
              ) : (
                <h1 className="text-3xl font-bold mb-2">{userData.nickname}</h1>
              )}
              
              <div className="flex items-center space-x-4 text-white/90">
                <span>레벨 {userData.level}</span>
                <span>•</span>
                <span>경험치 {userData.experience}</span>
                <span>•</span>
                <span>가입일: {new Date(userData.createdAt?.seconds * 1000 || userData.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveProfile}
                  className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  저장
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="border border-white text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  취소
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                편집
              </button>
            )}
          </div>
        </div>
        
        {/* 경험치 프로그레스 바 */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>레벨 {userData.level} 경험치</span>
            <span>{userData.experience % 100}/100</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(userData.experience % 100)}%` }}
              className="bg-white h-2 rounded-full"
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 메인 스탯 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 스탬 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <ChartBarIcon className="w-6 h-6 mr-2 text-blue-500" />
                내 상담 스탬
              </h2>
              <div className="text-sm text-gray-500">
                총 {totalSessions}회 상담
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {totalSessions}
                </div>
                <div className="text-sm text-blue-600">상담 횟수</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {successRate}%
                </div>
                <div className="text-sm text-green-600">성공률</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {Math.floor((userData.stats?.practiceHours || 0) / 60)}h
                </div>
                <div className="text-sm text-yellow-600">연습 시간</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {userData.stats?.helpedFriends || 0}
                </div>
                <div className="text-sm text-purple-600">도운 친구</div>
              </div>
            </div>
          </motion.div>

          {/* 스킬 레벨 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              상담 스킬 레벨
            </h2>
            
            <div className="space-y-4">
              {Object.entries(skillIcons).map(([skill, config]) => {
                const points = userData.skills?.[skill] || 0;
                const skillLevel = getSkillLevel(points);
                const Icon = config.icon;
                
                return (
                  <div key={skill} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-6 h-6 ${config.color}`} />
                      <div>
                        <div className="font-medium text-gray-800">
                          {config.name}
                        </div>
                        <div className={`text-sm text-${skillLevel.color}-600`}>
                          {skillLevel.level}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-gray-800">
                        {points}포인트
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (points % 50) * 2)}%` }}
                          className={`bg-${skillLevel.color}-500 h-2 rounded-full`}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* 설정 */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <CogIcon className="w-6 h-6 mr-2 text-gray-500" />
                설정
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">알림 받기</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.preferences.notifications}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          notifications: e.target.checked
                        }
                      }))}
                      className="sr-only"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">소리 효과</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.preferences.soundEffects}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          soundEffects: e.target.checked
                        }
                      }))}
                      className="sr-only"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">난이도</label>
                  <select
                    value={editForm.preferences.difficulty}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        difficulty: e.target.value
                      }
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="beginner">초보자</option>
                    <option value="intermediate">중급자</option>
                    <option value="advanced">고급자</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 배지 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <TrophyIcon className="w-5 h-5 mr-2 text-yellow-500" />
              내 배지 ({badgeCount})
            </h3>
            
            {badgeCount > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(userData.badges || {}).map(([badgeId, badge]) => (
                  <div
                    key={badgeId}
                    className="p-3 bg-yellow-50 rounded-lg text-center"
                  >
                    <div className="text-2xl mb-1">🏆</div>
                    <div className="text-xs font-medium text-yellow-700">
                      {badge.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <TrophyIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">아직 배지가 없어요</p>
                <p className="text-xs">상담 활동을 하면 배지를 얻을 수 있어요!</p>
              </div>
            )}
          </motion.div>

          {/* 최근 활동 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              최근 활동
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">마지막 로그인</span>
                <span className="text-gray-800">
                  {new Date(userData.lastLoginAt?.seconds * 1000 || userData.lastLoginAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">마지막 상담</span>
                <span className="text-gray-800">
                  {userData.lastSessionAt 
                    ? new Date(userData.lastSessionAt?.seconds * 1000 || userData.lastSessionAt).toLocaleDateString()
                    : '아직 없음'
                  }
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">오늘 활동</span>
                <span className="text-green-600 font-medium">
                  활동 중 🟢
                </span>
              </div>
            </div>
          </motion.div>

          {/* 로그아웃 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={handleSignOut}
              className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              로그아웃
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;