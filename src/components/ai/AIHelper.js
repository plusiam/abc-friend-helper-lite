// src/components/ai/AIHelper.js - AI 도우미 컴포넌트
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAI } from '../../hooks/useAI';
import { useCounseling } from '../../contexts/CounselingContext';
import toast from 'react-hot-toast';

const AIHelper = ({ step, onSuggestion }) => {
  const { generateEmpathySuggestion, generateSolutions, loading } = useAI();
  const { counselingData } = useCounseling();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const handleGetHelp = async () => {
    try {
      let result;
      
      switch (step) {
        case 2: // 공감 표현 단계
          result = await generateEmpathySuggestion(
            counselingData.situation,
            counselingData.emotions
          );
          setSuggestion(result.suggestion);
          if (onSuggestion) {
            onSuggestion(result.suggestion);
          }
          break;
          
        case 3: // 해결책 단계
          result = await generateSolutions(
            counselingData.situation,
            counselingData.abc.b,
            10 // 나이
          );
          setSuggestion(result);
          break;
          
        default:
          break;
      }
      
      toast.success('AI가 도움을 준비했어요!');
    } catch (error) {
      toast.error('도움을 가져오는 중 오류가 발생했습니다');
    }
  };

  return (
    <>
      {/* AI 도우미 버튼 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-6 bg-purple-500 text-white rounded-full p-3 shadow-lg"
      >
        <span className="text-xl">🤖</span>
      </motion.button>

      {/* AI 도우미 패널 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-36 right-6 w-80 bg-white rounded-lg shadow-xl p-4"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-purple-700">AI 도우미</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {!suggestion ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-3">
                  {step === 2 && "공감 표현을 만드는 데 도움이 필요하신가요?"}
                  {step === 3 && "해결책을 찾는 데 도움이 필요하신가요?"}
                </p>
                <button
                  onClick={handleGetHelp}
                  disabled={loading}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50"
                >
                  {loading ? '생각 중...' : '도움 받기'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-purple-50 p-3 rounded-lg">
                  {typeof suggestion === 'string' ? (
                    <p className="text-sm">{suggestion}</p>
                  ) : (
                    <div className="space-y-2">
                      {suggestion.positiveThoughts && (
                        <div>
                          <p className="font-bold text-purple-700 text-sm">💭 새로운 생각:</p>
                          <ul className="text-sm list-disc list-inside">
                            {suggestion.positiveThoughts.map((thought, idx) => (
                              <li key={idx}>{thought}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {suggestion.actionSteps && (
                        <div>
                          <p className="font-bold text-purple-700 text-sm">🎯 실천 방법:</p>
                          <ul className="text-sm list-disc list-inside">
                            {suggestion.actionSteps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleGetHelp}
                  className="w-full bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 text-sm"
                >
                  다른 제안 받기
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIHelper;