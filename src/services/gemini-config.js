// src/services/gemini-config.js - Gemini AI 설정
export const GEMINI_CONFIG = {
  // 모델 설정
  models: {
    default: 'gemini-pro',
    vision: 'gemini-pro-vision'
  },
  
  // 안전 설정
  safetySettings: {
    harassment: 'BLOCK_LOW_AND_ABOVE',
    hateSpeech: 'BLOCK_LOW_AND_ABOVE',
    sexuallyExplicit: 'BLOCK_LOW_AND_ABOVE',
    dangerous: 'BLOCK_LOW_AND_ABOVE'
  },
  
  // 생성 설정
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  },
  
  // 프롬프트 템플릿
  prompts: {
    empathyAnalysis: {
      system: '당신은 초등학생 또래 상담 교육 전문가입니다.',
      temperature: 0.7
    },
    solutionGeneration: {
      system: '당신은 아동 심리 전문가이며 CBT 기반 해결책을 제공합니다.',
      temperature: 0.8
    },
    safetyCheck: {
      system: '당신은 아동 안전 전문가입니다. 위험 신호를 감지하고 적절한 조치를 제안합니다.',
      temperature: 0.3
    }
  }
};