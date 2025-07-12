// 간소화된 AI 훅 - Firebase Functions 호출만 담당
import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  // 가상 친구 응답 (로컬에서 처리)
  const getVirtualFriendResponse = async (character, message, step) => {
    setLoading(true);
    
    // 간단한 로컬 응답 생성
    const responses = {
      shy: "음... 그래... (작은 목소리로)",
      energetic: "와! 정말? 대박이다! 😄",
      emotional: "그런 일이 있었구나... (눈물을 글썽이며)",
      logical: "그 상황을 분석해보면..."
    };
    
    setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return responses[character] || "응, 그렇구나...";
  };
  
  // ABC 평가 요청
  const evaluateABCResponse = async (abcData) => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }
    
    setLoading(true);
    try {
      const functions = getFunctions();
      const evaluate = httpsCallable(functions, 'evaluateABC');
      
      const result = await evaluate({
        affect: abcData.affect,
        behavior: abcData.behavior,
        cognition: abcData.cognition,
        scenario: abcData.scenario
      });
      
      return result.data;
    } catch (error) {
      console.error('평가 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    getVirtualFriendResponse,
    evaluateABCResponse
  };
};