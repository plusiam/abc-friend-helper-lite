// src/components/common/Navigation.js - 네비게이션 컴포넌트
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  PlayIcon,
  UserIcon,
  TrophyIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Navigation = () => {
  const { user, userData, signInAnonymous } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: '홈', href: '/', icon: HomeIcon },
    { name: '실전 상담', href: '/counseling', icon: UserGroupIcon },
    { name: '연습 모드', href: '/practice', icon: PlayIcon },
    { name: '내 업적', href: '/achievements', icon: TrophyIcon },
    { name: '프로필', href: '/profile', icon: UserIcon }
  ];

  const handleNavClick = async (href) => {
    if (!user && href !== '/') {
      await signInAnonymous();
    }
    navigate(href);
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 font-bold text-xl text-gray-800 hover:text-purple-600 transition-colors"
          >
            <span className="text-2xl">🌈</span>
            <span>ABC 친구 도우미</span>
          </Link>

          {/* 데스크탑 메뉴 */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${isActive(item.href)
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.name}
                </button>
              );
            })}
          </div>

          {/* 사용자 정보 */}
          <div className="hidden md:flex items-center space-x-4">
            {user && userData ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-800">
                    {userData.nickname}
                  </div>
                  <div className="text-xs text-gray-500">
                    레벨 {userData.level} • {userData.experience}XP
                  </div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                  {userData.nickname.charAt(0)}
                </div>
              </div>
            ) : (
              <button
                onClick={signInAnonymous}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                시작하기
              </button>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.href)}
                    className={`
                      w-full flex items-center px-3 py-3 rounded-lg text-left transition-all
                      ${isActive(item.href)
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </button>
                );
              })}
              
              {/* 모바일 사용자 정보 */}
              {user && userData ? (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex items-center space-x-3 px-3 py-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                      {userData.nickname.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {userData.nickname}
                      </div>
                      <div className="text-xs text-gray-500">
                        레벨 {userData.level} • {userData.experience}XP
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <button
                    onClick={() => {
                      signInAnonymous();
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    시작하기
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;