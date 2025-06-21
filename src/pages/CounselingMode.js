// src/pages/CounselingMode.js - 실전 상담 모드 페이지
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCounseling } from '../contexts/CounselingContext';
import { useAI } from '../hooks/useAI';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  HeartIcon,
  LightBulbIcon,
  ChatBubbleLeftEllipsisIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CounselingMode = () => {
  const navigate = useNavigate();
  const { user, signInAnonymous } = useAuth();
  const {
    isActive,
    currentStep,
    data,
    startSession,
    nextStep,
    previousStep,
    setSituation,
    setEmpathyResponse,
    setABCAndSolutions,
    setEncouragement,
    completeSession,
    getProgress,
    getCurrentStepTitle
  } = useCounseling();
  const { analyzeEmpathy, generateSolutions, loading } = useAI();

  const [formData, setFormData] = useState({
    // 1단계: 상황 파악
    situation: '',
    emotions: [],
    severity: 3,
    
    // 2단계: 공감 표현
    empathyResponse: '',
    
    // 3단계: ABC 모델
    abc: { a: '', b: '', c: '' },
    selectedSolution: null,
    
    // 4단계: 격려
    encouragement: { personal: '', future: '', support: '' }
  });

  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const emotionOptions = [
    { id: 'sad', label: '슬픈', emoji: '😢', color: 'blue' },
    { id: 'angry', label: '화난', emoji: '😡', color: 'red' },
    { id: 'anxious', label: '불안한', emoji: '😰', color: 'yellow' },
    { id: 'scared', label: '무서운', emoji: '😨', color: 'purple' },
    { id: 'disappointed', label: '실망한', emoji: '😔', color: 'gray' },
    { id: 'confused', label: '혼란스러운', emoji: '😕', color: 'orange' },
    { id: 'lonely', label: '외로운', emoji: '🙁', color: 'indigo' },
    { id: 'embarrassed', label: '부끄러운', emoji: '😳', color: 'pink' }
  ];

  useEffect(() => {
    const initSession = async () => {
      if (!user) {
        await signInAnonymous();
      }
      
      if (!isActive) {
        try {
          await startSession('real');
        } catch (error) {
          console.error('세션 시작 오류:', error);
        }
      }
    };
    
    initSession();
  }, [user, isActive, startSession, signInAnonymous]);

  // 다음 단계로 이동
  const handleNext = async () => {
    switch (currentStep) {
      case 1:
        if (!formData.situation.trim() || formData.emotions.length === 0) {
          toast.error('상황과 감정을 모두 선택해주세요!');
          return;
        }
        setSituation(formData.situation, formData.emotions, formData.severity);
        nextStep();
        break;
        
      case 2:
        if (!formData.empathyResponse.trim()) {
          toast.error('공감 표현을 작성해주세요!');
          return;
        }
        
        try {
          const analysis = await analyzeEmpathy(
            formData.empathyResponse,
            formData.situation
          );
          setAnalysisResult(analysis);
          setEmpathyResponse(
            formData.empathyResponse,
            analysis.scores.overall,
            analysis
          );
          nextStep();
        } catch (error) {
          toast.error('공감 분석 중 오류가 발생했습니다.');
        }
        break;
        
      case 3:
        if (!formData.abc.a || !formData.abc.b || !formData.abc.c) {
          toast.error('ABC 모델을 모두 작성해주세요!');
          return;
        }
        
        try {
          const solutions = await generateSolutions(
            formData.situation,
            formData.abc.b,
            10
          );
          setAiSuggestions(solutions);
          setABCAndSolutions(
            formData.abc,
            { ...solutions, selectedSolution: formData.selectedSolution }
          );
          nextStep();
        } catch (error) {
          toast.error('해결책 생성 중 오류가 발생했습니다.');
        }
        break;
        
      case 4:
        if (!formData.encouragement.personal) {
          toast.error('격려 메시지를 작성해주세요!');
          return;
        }
        
        setEncouragement(formData.encouragement);
        const result = await completeSession();
        navigate('/counseling/result', { state: { result } });
        break;
    }
  };

  const handleEmotionToggle = (emotionId) => {
    setFormData(prev => ({
      ...prev,
      emotions: prev.emotions.includes(emotionId)
        ? prev.emotions.filter(id => id !== emotionId)
        : [...prev.emotions, emotionId]
    }));
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedFormData = (parentField, childField, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <HeartIcon className="w-16 h-16 text-pink-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          친구의 상황을 들어보세요 👂
        </h2>
        <p className="text-gray-600">
          친구가 어떤 일로 힘들어하고 있는지 자세히 적어보세요
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          친구가 말한 상황은 무엇인가요?
        </label>
        <textarea
          value={formData.situation}
          onChange={(e) => updateFormData('situation', e.target.value)}
          placeholder="예: '오늘 수학 시험을 망쳐서 너무 속상해. 부모님이 얼마나 실망하실지 생각하니 부끄러워.'"
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows={4}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          친구가 느끼고 있는 감정을 선택해주세요 (여러 개 가능)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {emotionOptions.map((emotion) => (
            <motion.button
              key={emotion.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEmotionToggle(emotion.id)}
              className={`
                p-3 rounded-lg border-2 transition-all
                ${formData.emotions.includes(emotion.id)
                  ? `border-${emotion.color}-500 bg-${emotion.color}-50`
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="text-2xl mb-1">{emotion.emoji}</div>
              <div className="text-sm font-medium">{emotion.label}</div>
            </motion.button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          상황의 심각성은 어느 정도인가요? ({formData.severity}/5)
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={formData.severity}
          onChange={(e) => updateFormData('severity', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>가므움</span>
          <span>보통</span>
          <span>심각함</span>
        </div>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <ChatBubbleLeftEllipsisIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          공감 표현을 해보세요 🤗
        </h2>
        <p className="text-gray-600">
          친구의 마음을 이해한다는 것을 표현해보세요
        </p>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h3 className="font-medium text-gray-800 mb-2">친구의 상황</h3>
        <p className="text-gray-600 text-sm">{data.situation}</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          친구에게 어떻게 말하고 싶은가요?
        </label>
        <textarea
          value={formData.empathyResponse}
          onChange={(e) => updateFormData('empathyResponse', e.target.value)}
          placeholder="예: '시험을 망쳐서 정말 속상했겠다. 나도 비슷한 경험이 있어서 네 마음을 알 것 같아. 혹시 이야기하고 싶어?'"
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows={4}
        />
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">💡 공감 표현 팁</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 친구의 감정을 인정하고 이해한다는 것을 표현해주세요</li>
          <li>• 비슷한 경험이 있다면 공유해주세요</li>
          <li>• 조급하게 조언하지 말고 들어주는 자세를 보여주세요</li>
        </ul>
      </div>
      
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 p-4 rounded-lg"
        >
          <h4 className="font-medium text-green-800 mb-2">
            🎉 공감 분석 결과 (${analysisResult.scores.overall}점)
          </h4>
          <div className="text-sm text-green-700 space-y-1">
            <div>장점: {analysisResult.strengths.join(', ')}</div>
            <div>개선점: {analysisResult.suggestions.join(', ')}</div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <LightBulbIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          해결책을 찾아보세요 💡
        </h2>
        <p className="text-gray-600">
          ABC 모델로 문제를 분석하고 해결방법을 찾아보세요
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            A (사실): 무슨 일이 일어났나요?
          </label>
          <textarea
            value={formData.abc.a}
            onChange={(e) => updateNestedFormData('abc', 'a', e.target.value)}
            placeholder="예: 수학 시험에서 60점을 받았다"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            B (생각): 어떤 생각을 했나요?
          </label>
          <textarea
            value={formData.abc.b}
            onChange={(e) => updateNestedFormData('abc', 'b', e.target.value)}
            placeholder="예: 나는 바보다. 부모님이 실망하실 거다"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            C (결과): 어떤 기분이 들었나요?
          </label>
          <textarea
            value={formData.abc.c}
            onChange={(e) => updateNestedFormData('abc', 'c', e.target.value)}
            placeholder="예: 속상하고 부끄러웠다"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>
      </div>
      
      {aiSuggestions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 p-6 rounded-lg"
        >
          <h4 className="font-medium text-blue-800 mb-4">
            🤖 AI 추천 해결책
          </h4>
          
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-blue-700 mb-2">💭 새로운 생각:</h5>
              <ul className="text-sm text-blue-600 space-y-1">
                {aiSuggestions.positiveThoughts?.map((thought, index) => (
                  <li key={index}>• {thought}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-blue-700 mb-2">🎯 실천 방법:</h5>
              <ul className="text-sm text-blue-600 space-y-1">
                {aiSuggestions.actionSteps?.map((step, index) => (
                  <li key={index}>• {step}</li>
                ))}
              </ul>
            </div>
            
            {aiSuggestions.encouragement && (
              <div className="bg-white p-3 rounded border border-blue-200">
                <p className="text-blue-700 text-sm">
                  🎆 {aiSuggestions.encouragement}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <HandRaisedIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          친구를 격려해주세요 🎆
        </h2>
        <p className="text-gray-600">
          따뜻한 격려의 말로 친구에게 힘을 주세요
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            개인적인 격려 메시지
          </label>
          <textarea
            value={formData.encouragement.personal}
            onChange={(e) => updateNestedFormData('encouragement', 'personal', e.target.value)}
            placeholder="예: '너는 정말 열심히 하는 친구야. 이번에 좋지 않았다고 해서 네가 바보는 게 아니야.'"
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            미래에 대한 희망 메시지
          </label>
          <textarea
            value={formData.encouragement.future}
            onChange={(e) => updateNestedFormData('encouragement', 'future', e.target.value)}
            placeholder="예: '다음에는 분명 더 잘할 수 있을 거야. 지금까지 노력한 걸 보면 말이야.'"
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            지지와 도움 메시지
          </label>
          <textarea
            value={formData.encouragement.support}
            onChange={(e) => updateNestedFormData('encouragement', 'support', e.target.value)}
            placeholder="예: '언제든 내가 여기 있으니까 힘들면 언제든 말해. 함께 해결해보자.'"
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-800 mb-2">💡 격려 팁</h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• 친구의 장점과 노력을 인정해주세요</li>
          <li>• 미래에 대한 희망적인 메시지를 전해주세요</li>
          <li>• 언제든 도와줄 준비가 되어있다는 것을 알려주세요</li>
        </ul>
      </div>
    </motion.div>
  );

  const steps = [
    { number: 1, title: '상황 파악', icon: HeartIcon, component: renderStep1() },
    { number: 2, title: '공감 표현', icon: ChatBubbleLeftEllipsisIcon, component: renderStep2() },
    { number: 3, title: '해결책 찾기', icon: LightBulbIcon, component: renderStep3() },
    { number: 4, title: '격려하기', icon: HandRaisedIcon, component: renderStep4() }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* 진행률 표시 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            💪 실전 상담 모드
          </h1>
          <div className="text-sm text-gray-600">
            {currentStep}/4 단계 ({getProgress()}%)
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${getProgress()}%` }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
            transition={{ duration: 0.5 }}
          />
        </div>
        
        <div className="flex justify-between mt-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex flex-col items-center space-y-2 ${
                currentStep >= step.number ? 'text-purple-600' : 'text-gray-400'
              }`}
            >
              <div className={`
                w-10 h-10 rounded-full border-2 flex items-center justify-center
                ${currentStep >= step.number 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-300'
                }
              `}>
                {currentStep > step.number ? (
                  <CheckCircleIcon className="w-6 h-6 text-purple-500" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <span className="text-xs text-center">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 단계별 컨텐츠 */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <AnimatePresence mode="wait">
          {steps.find(step => step.number === currentStep)?.component}
        </AnimatePresence>
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between">
        <button
          onClick={previousStep}
          disabled={currentStep === 1}
          className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          이전
        </button>
        
        <button
          onClick={handleNext}
          disabled={loading}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              처리 중...
            </>
          ) : (
            <>
              {currentStep === 4 ? '완료' : '다음'}
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CounselingMode;