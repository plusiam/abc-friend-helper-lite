// src/contexts/AuthContext.js - 사용자 인증 컨텍스트
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInAnonymously, 
  onAuthStateChanged,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 사용자 데이터 초기화
  const initializeUserData = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // 새 사용자 데이터 생성
        const newUserData = {
          uid,
          createdAt: new Date(),
          nickname: `상담자${Math.floor(Math.random() * 1000)}`,
          level: 1,
          experience: 0,
          skills: {
            empathy: 0,
            listening: 0,
            problemSolving: 0,
            encouragement: 0
          },
          stats: {
            totalSessions: 0,
            successfulSessions: 0,
            practiceHours: 0,
            helpedFriends: 0
          },
          badges: {},
          achievements: [],
          preferences: {
            notifications: true,
            soundEffects: true,
            difficulty: 'beginner'
          },
          lastLoginAt: new Date()
        };
        
        await setDoc(userRef, newUserData);
        setUserData(newUserData);
        toast.success('환영합니다! 새로운 또래 상담자가 되셨어요! 🎉');
      } else {
        // 기존 사용자 데이터 로드
        const existingData = userSnap.data();
        await updateDoc(userRef, { lastLoginAt: new Date() });
        setUserData(existingData);
        toast.success(`다시 오신 것을 환영합니다, ${existingData.nickname}님! 👋`);
      }
    } catch (error) {
      console.error('사용자 데이터 초기화 오류:', error);
      toast.error('사용자 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 익명 로그인
  const signInAnonymous = async () => {
    try {
      setLoading(true);
      const result = await signInAnonymously(auth);
      await initializeUserData(result.user.uid);
      return result.user;
    } catch (error) {
      console.error('로그인 오류:', error);
      toast.error('로그인 중 오류가 발생했습니다.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserData(null);
      toast.success('안전하게 로그아웃되었습니다.');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  };

  // 사용자 데이터 업데이트
  const updateUserData = async (updates) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      setUserData(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('사용자 데이터 업데이트 오류:', error);
      toast.error('데이터 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 경험치 추가
  const addExperience = async (amount, reason) => {
    if (!userData) return;
    
    const newExp = userData.experience + amount;
    const newLevel = Math.floor(newExp / 100) + 1;
    const levelUp = newLevel > userData.level;
    
    await updateUserData({
      experience: newExp,
      level: newLevel
    });
    
    if (levelUp) {
      toast.success(`레벨 업! 🎉 레벨 ${newLevel}이 되었습니다!`);
    } else {
      toast.success(`+${amount} 경험치! (${reason})`);
    }
  };

  // 스킬 포인트 추가
  const addSkillPoints = async (skill, points) => {
    if (!userData) return;
    
    const currentPoints = userData.skills[skill] || 0;
    const newPoints = currentPoints + points;
    
    await updateUserData({
      [`skills.${skill}`]: newPoints
    });
    
    toast.success(`${skill} 스킬 +${points}포인트!`);
  };

  // 배지 획득
  const awardBadge = async (badgeId, badgeName) => {
    if (!userData || userData.badges[badgeId]) return;
    
    await updateUserData({
      [`badges.${badgeId}`]: {
        name: badgeName,
        awardedAt: new Date()
      }
    });
    
    toast.success(`새 배지 획득! 🏆 ${badgeName}`);
  };

  // 인증 상태 변화 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await initializeUserData(firebaseUser.uid);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userData,
    loading,
    signInAnonymous,
    signOut,
    updateUserData,
    addExperience,
    addSkillPoints,
    awardBadge
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};