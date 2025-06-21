// src/components/common/LoadingScreen.js - 로딩 화면 컴포넌트
import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  const logoVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const textVariants = {
    initial: { y: 20, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        delay: 0.3,
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const dotsVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2,
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  };

  const dotVariants = {
    initial: { y: 0 },
    animate: {
      y: -10,
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        {/* 로고 애니메이션 */}
        <motion.div
          variants={logoVariants}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <div className="text-8xl mb-4">🌈</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ABC 친구 도우미
          </h1>
        </motion.div>

        {/* 로딩 메시지 */}
        <motion.div
          variants={textVariants}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <p className="text-lg text-gray-600 mb-2">
            또래 상담을 위한 준비를 하고 있어요
          </p>
          <p className="text-sm text-gray-500">
            잠시만 기다려주세요...
          </p>
        </motion.div>

        {/* 스피너 */}
        <motion.div
          variants={spinnerVariants}
          animate="animate"
          className="inline-block mb-6"
        >
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
        </motion.div>

        {/* 점 애니메이션 */}
        <motion.div
          variants={dotsVariants}
          initial="initial"
          animate="animate"
          className="flex justify-center space-x-2"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              variants={dotVariants}
              className="w-3 h-3 bg-purple-400 rounded-full"
            />
          ))}
        </motion.div>

        {/* 로딩 팁 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-8 max-w-md mx-auto"
        >
          <div className="bg-white/80 backdrop-blur rounded-lg p-4 shadow-lg">
            <h3 className="font-bold text-purple-700 mb-2">💡 상담 팁</h3>
            <p className="text-sm text-gray-600">
              좋은 상담의 첫 번째는 친구의 이야기를 끝까지 들어주는 것이에요!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;