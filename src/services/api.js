// API 클라이언트 - Vercel 프론트엔드 + Firebase Functions 백엔드
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Firebase Functions URL 설정
const FUNCTIONS_BASE_URL = process.env.REACT_APP_FIREBASE_FUNCTIONS_URL || 
                          'http://localhost:5001/your-project/us-central1';

// HTTP Functions를 위한 Axios 인스턴스 생성
const httpClient = axios.create({
  baseURL: FUNCTIONS_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Firebase Functions 인스턴스 (Callable Functions용)
const functions = getFunctions();

// 인증 토큰 자동 추가 인터셉터 (HTTP Functions용)
httpClient.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('토큰 가져오기 실패:', error);
    }
  }
  
  return config;
});

// 응답 인터셉터 - 에러 처리
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API 에러:', error);
    
    if (error.response?.status === 401) {
      // 인증 실패 시 로그아웃 처리
      const auth = getAuth();
      auth.signOut();
    }
    
    return Promise.reject(error);
  }
);

// 환경에 따른 API 호출 방식 결정
const isProduction = process.env.REACT_APP_ENVIRONMENT === 'production';
const useHTTPFunctions = isProduction; // 프로덕션에서는 HTTP Functions 사용

// API 함수들 - 두 가지 방식 지원
export const geminiAPI = {
  // 공감 분석
  analyzeEmpathy: async (response, situation, studentAge = 10) => {
    if (useHTTPFunctions) {
      // HTTP Functions 사용 (Vercel 배포 시)
      const apiResponse = await httpClient.post('/analyzeEmpathy', {
        response,
        situation,
        studentAge,
      });
      return apiResponse.data;
    } else {
      // Callable Functions 사용 (로컬 개발 시)
      const analyzeEmpathy = httpsCallable(functions, 'analyzeEmpathy');
      const result = await analyzeEmpathy({ response, situation, studentAge });
      return result.data;
    }
  },

  // 공감 표현 생성
  generateEmpathy: async (situation, emotions, studentAge = 10) => {
    if (useHTTPFunctions) {
      const apiResponse = await httpClient.post('/generateEmpathy', {
        situation,
        emotions,
        studentAge,
      });
      return apiResponse.data;
    } else {
      const generateEmpathy = httpsCallable(functions, 'generateEmpathy');
      const result = await generateEmpathy({ situation, emotions, studentAge });
      return result.data;
    }
  },

  // 해결책 생성
  generateSolutions: async (problem, negativeThought, studentAge = 10) => {
    if (useHTTPFunctions) {
      const apiResponse = await httpClient.post('/generateSolutions', {
        problem,
        negativeThought,
        studentAge,
      });
      return apiResponse.data;
    } else {
      const generateSolutions = httpsCallable(functions, 'generateSolutions');
      const result = await generateSolutions({ problem, negativeThought, studentAge });
      return result.data;
    }
  },

  // 안전성 체크
  checkSafety: async (conversation, sessionId) => {
    if (useHTTPFunctions) {
      const apiResponse = await httpClient.post('/checkSafety', {
        conversation,
        sessionId,
      });
      return apiResponse.data;
    } else {
      const checkSafety = httpsCallable(functions, 'checkSafety');
      const result = await checkSafety({ conversation, sessionId });
      return result.data;
    }
  },

  // 설정 확인
  checkConfiguration: async () => {
    if (useHTTPFunctions) {
      const apiResponse = await httpClient.post('/checkConfiguration');
      return apiResponse.data;
    } else {
      const checkConfiguration = httpsCallable(functions, 'checkConfiguration');
      const result = await checkConfiguration();
      return result.data;
    }
  },
};

// 에러 처리 유틸리티
export const handleAPIError = (error) => {
  if (error.response) {
    // HTTP 에러 응답
    const status = error.response.status;
    const message = error.response.data?.message || error.response.data?.error || '서버 오류가 발생했습니다.';
    
    switch (status) {
      case 401:
        return '인증이 필요합니다. 다시 로그인해주세요.';
      case 403:
        return '권한이 없습니다.';
      case 429:
        return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      case 500:
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      default:
        return message;
    }
  } else if (error.code) {
    // Firebase Functions 에러
    switch (error.code) {
      case 'functions/unauthenticated':
        return '인증이 필요합니다. 다시 로그인해주세요.';
      case 'functions/permission-denied':
        return '권한이 없습니다.';
      case 'functions/resource-exhausted':
        return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      case 'functions/internal':
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      default:
        return error.message || '알 수 없는 오류가 발생했습니다.';
    }
  } else {
    // 네트워크 에러 등
    return error.message || '연결에 문제가 있습니다. 네트워크를 확인해주세요.';
  }
};

export default httpClient;