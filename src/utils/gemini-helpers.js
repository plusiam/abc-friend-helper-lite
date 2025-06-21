// src/utils/gemini-helpers.js - Gemini 관련 유틸리티 함수
export const formatGeminiResponse = (response) => {
  // Gemini 응답에서 JSON 추출
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('JSON 파싱 오류:', error);
  }
  
  return response;
};

export const sanitizeGeminiInput = (input) => {
  // 특수 문자 이스케이프
  return input
    .replace(/[<>]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const validateGeminiResponse = (response, expectedFormat) => {
  // 응답 형식 검증
  if (expectedFormat === 'json') {
    try {
      JSON.parse(response);
      return true;
    } catch {
      return false;
    }
  }
  
  return response && response.length > 0;
};