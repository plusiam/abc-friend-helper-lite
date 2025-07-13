// src/hooks/useAI.js - Gemini AI 기능 훅
import { useState, useCallback } from 'react';
import { functions } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 공감 표현 분석
  const analyzeEmpathy = useCallback(async (response, situation) => {
    setLoading(true);
    setError(null);
    
    try {
      const analyzeFunction = httpsCallable(functions, 'analyzeEmpathy');
      const result = await analyzeFunction({ response, situation });
      
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 공감 표현 제안
  const generateEmpathySuggestion = useCallback(async (situation, emotions) => {
    setLoading(true);
    setError(null);
    
    try {
      const suggestFunction = httpsCallable(functions, 'generateEmpathy');
      const result = await suggestFunction({ situation, emotions });
      
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 해결책 생성
  const generateSolutions = useCallback(async (problem, negativeThought, age) => {
    setLoading(true);
    setError(null);
    
    try {
      const solutionFunction = httpsCallable(functions, 'generateSolutions');
      const result = await solutionFunction({ problem, negativeThought, studentAge: age });
      
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 안전성 체크
  const checkSafety = useCallback(async (conversation, sessionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const safetyFunction = httpsCallable(functions, 'checkSafety');
      const result = await safetyFunction({ conversation, sessionId });
      
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 격려 메시지 생성
  const generateEncouragement = useCallback(async (situation, emotion, previousMessages = []) => {
    setLoading(true);
    setError(null);
    
    try {
      const encouragementFunction = httpsCallable(functions, 'generateEncouragement');
      const result = await encouragementFunction({ 
        situation, 
        emotion,
        previousMessages 
      });
      
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 가상 친구 응답
  const getVirtualFriendResponse = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const virtualFriendFunction = httpsCallable(functions, 'virtualFriendResponse');
      const result = await virtualFriendFunction(params);
      
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analyzeEmpathy,
    generateEmpathySuggestion,
    generateSolutions,
    checkSafety,
    generateEncouragement,
    getVirtualFriendResponse,
    loading,
    error
  };
};