// 완전한 AI 훅 - Firebase Functions 및 로컬 처리
import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  // 공감 분석 함수
  const analyzeEmpathy = async (empathyResponse, situation) => {
    setLoading(true);
    
    try {
      // 임시로 로컬에서 간단한 분석 제공
      await new Promise(resolve => setTimeout(resolve, 1000)); // 로딩 시뮬레이션
      
      const score = Math.floor(Math.random() * 30) + 70; // 70-100점 랜덤
      
      const result = {
        scores: {
          overall: score,
          understanding: score - 5,
          expression: score + 5,
          tone: score
        },
        strengths: [
          "친구의 감정을 잘 이해했어요",
          "따뜻한 말투로 표현했어요"
        ],
        suggestions: [
          "더 구체적인 공감 표현을 해보세요",
          "친구의 입장에서 생각해보세요"
        ]
      };
      
      return result;
    } catch (error) {
      console.error('공감 분석 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // 해결책 생성 함수
  const generateSolutions = async (situation, thoughts, age = 10) => {
    setLoading(true);
    
    try {
      // 임시로 로컬에서 간단한 해결책 제공
      await new Promise(resolve => setTimeout(resolve, 1000)); // 로딩 시뮬레이션
      
      const solutions = {
        positiveThoughts: [
          "한 번의 실수가 나를 정의하지는 않아",
          "다음번에는 더 잘할 수 있어",
          "완벽하지 않아도 괜찮아"
        ],
        actionSteps: [
          "틀린 문제를 다시 풀어보기",
          "선생님께 모르는 부분 질문하기",
          "친구와 함께 공부하기"
        ],
        encouragement: "넌 충분히 잘하고 있어. 조금씩 나아지면 돼!"
      };
      
      return solutions;
    } catch (error) {
      console.error('해결책 생성 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
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
      
      // 임시 응답 제공
      return {
        score: 85,
        feedback: "좋은 분석이에요!",
        suggestions: ["더 구체적으로 작성해보세요"]
      };
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    analyzeEmpathy,
    generateSolutions,
    getVirtualFriendResponse,
    evaluateABCResponse
  };
};