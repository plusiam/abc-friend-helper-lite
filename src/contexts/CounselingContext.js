// src/contexts/CounselingContext.js - 상담 세션 관리 컨텍스트
import React, { createContext, useContext, useState, useReducer } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const CounselingContext = createContext();

export const useCounseling = () => {
  const context = useContext(CounselingContext);
  if (!context) {
    throw new Error('useCounseling must be used within a CounselingProvider');
  }
  return context;
};

// 상담 세션 상태 관리를 위한 리듀서
const counselingReducer = (state, action) => {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        sessionType: action.payload.type,
        currentStep: 1,
        startTime: new Date(),
        isActive: true
      };
    
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: state.currentStep + 1
      };
    
    case 'PREVIOUS_STEP':
      return {
        ...state,
        currentStep: Math.max(1, state.currentStep - 1)
      };
    
    case 'UPDATE_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          ...action.payload
        }
      };
    
    case 'COMPLETE_SESSION':
      return {
        ...state,
        isActive: false,
        completedAt: new Date(),
        result: action.payload
      };
    
    case 'RESET_SESSION':
      return initialState;
    
    default:
      return state;
  }
};

const initialState = {
  sessionId: null,
  sessionType: null, // 'real' | 'practice'
  currentStep: 1,
  startTime: null,
  completedAt: null,
  isActive: false,
  data: {
    // 1단계: 상황 파악
    situation: '',
    emotions: [],
    severity: 1,
    
    // 2단계: 공감 표현
    empathyResponse: '',
    empathyScore: null,
    empathyFeedback: null,
    
    // 3단계: 해결책 찾기  
    abc: {
      a: '', // 사실 (Actual event)
      b: '', // 생각 (Belief)
      c: ''  // 결과 (Consequence)
    },
    solutions: {
      newThinking: [],
      actionSteps: [],
      selectedSolution: null
    },
    
    // 4단계: 격려하기
    encouragement: {
      personal: '',
      future: '',
      support: ''
    }
  },
  result: null
};

export const CounselingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(counselingReducer, initialState);
  const { user, addExperience, addSkillPoints } = useAuth();
  const [practiceMode, setPracticeMode] = useState({
    isActive: false,
    friendPersonality: null,
    conversationHistory: []
  });

  // 새 상담 세션 시작
  const startSession = async (type = 'real') => {
    try {
      const sessionData = {
        userId: user?.uid,
        type,
        startTime: new Date(),
        status: 'active'
      };
      
      const docRef = await addDoc(collection(db, 'counselingSessions'), sessionData);
      
      dispatch({
        type: 'START_SESSION',
        payload: {
          sessionId: docRef.id,
          type
        }
      });
      
      toast.success(
        type === 'practice' 
          ? '연습 모드를 시작합니다! 🎯' 
          : '실전 상담을 시작합니다! 💪'
      );
      
      return docRef.id;
    } catch (error) {
      console.error('세션 시작 오류:', error);
      toast.error('세션을 시작할 수 없습니다.');
      throw error;
    }
  };

  // 다음 단계로 이동
  const nextStep = () => {
    if (state.currentStep < 4) {
      dispatch({ type: 'NEXT_STEP' });
    }
  };

  // 이전 단계로 이동
  const previousStep = () => {
    if (state.currentStep > 1) {
      dispatch({ type: 'PREVIOUS_STEP' });
    }
  };

  // 데이터 업데이트
  const updateData = (newData) => {
    dispatch({
      type: 'UPDATE_DATA',
      payload: newData
    });
  };

  // 1단계: 상황 설정
  const setSituation = (situation, emotions, severity) => {
    updateData({
      situation,
      emotions,
      severity
    });
  };

  // 2단계: 공감 표현 설정
  const setEmpathyResponse = (response, score, feedback) => {
    updateData({
      empathyResponse: response,
      empathyScore: score,
      empathyFeedback: feedback
    });
    
    // 스킬 포인트 추가
    if (score && score >= 80) {
      addSkillPoints('empathy', 10);
    }
  };

  // 3단계: ABC 모델 및 해결책 설정
  const setABCAndSolutions = (abc, solutions) => {
    updateData({
      abc,
      solutions
    });
    
    if (solutions.selectedSolution) {
      addSkillPoints('problemSolving', 15);
    }
  };

  // 4단계: 격려 메시지 설정
  const setEncouragement = (encouragement) => {
    updateData({ encouragement });
    addSkillPoints('encouragement', 10);
  };

  // 세션 완료
  const completeSession = async () => {
    if (!state.sessionId) return;
    
    try {
      const sessionResult = {
        completedAt: new Date(),
        duration: new Date() - state.startTime,
        stepsCompleted: state.currentStep,
        data: state.data,
        scores: {
          empathy: state.data.empathyScore || 0,
          problemSolving: state.data.solutions.selectedSolution ? 85 : 0,
          encouragement: state.data.encouragement.personal ? 90 : 0
        }
      };
      
      // Firestore에 결과 저장
      await updateDoc(doc(db, 'counselingSessions', state.sessionId), {
        ...sessionResult,
        status: 'completed'
      });
      
      // 경험치 추가
      const expGain = Math.floor(sessionResult.duration / 60000) * 5 + 20;
      await addExperience(expGain, '상담 세션 완료');
      
      dispatch({
        type: 'COMPLETE_SESSION',
        payload: sessionResult
      });
      
      toast.success('상담 세션이 완료되었습니다! 🎉');
      return sessionResult;
    } catch (error) {
      console.error('세션 완료 오류:', error);
      toast.error('세션 완료 중 오류가 발생했습니다.');
      throw error;
    }
  };

  // 세션 초기화
  const resetSession = () => {
    dispatch({ type: 'RESET_SESSION' });
    setPracticeMode({
      isActive: false,
      friendPersonality: null,
      conversationHistory: []
    });
  };

  // 연습 모드 설정
  const startPracticeMode = (friendPersonality) => {
    setPracticeMode({
      isActive: true,
      friendPersonality,
      conversationHistory: []
    });
    startSession('practice');
  };

  // 연습 모드 대화 추가
  const addPracticeMessage = (message) => {
    setPracticeMode(prev => ({
      ...prev,
      conversationHistory: [...prev.conversationHistory, message]
    }));
  };

  // 상담 진행률 계산
  const getProgress = () => {
    const totalSteps = 4;
    return Math.round((state.currentStep / totalSteps) * 100);
  };

  // 현재 단계 제목 가져오기
  const getCurrentStepTitle = () => {
    const stepTitles = {
      1: '상황 파악하기',
      2: '공감 표현하기',
      3: '해결책 찾기',
      4: '격려하기'
    };
    return stepTitles[state.currentStep] || '';
  };

  const value = {
    // 상태
    ...state,
    practiceMode,
    
    // 액션
    startSession,
    nextStep,
    previousStep,
    updateData,
    setSituation,
    setEmpathyResponse,
    setABCAndSolutions,
    setEncouragement,
    completeSession,
    resetSession,
    startPracticeMode,
    addPracticeMessage,
    
    // 유틸리티
    getProgress,
    getCurrentStepTitle
  };

  return (
    <CounselingContext.Provider value={value}>
      {children}
    </CounselingContext.Provider>
  );
};