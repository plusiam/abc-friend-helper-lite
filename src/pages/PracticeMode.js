// src/pages/PracticeMode.js - ABC 모델 기반 연습 모드
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useCounseling } from '../contexts/CounselingContext';
import { useAI } from '../hooks/useAI';
import {
  UserIcon,
  ChatBubbleBottomCenterTextIcon,
  FaceSmileIcon,
  PlayIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PracticeMode = () => {
  const navigate = useNavigate();
  const { user, signInAnonymous } = useAuth();
  const { startPracticeMode, practiceMode, addPracticeMessage } = useCounseling();
  const { getVirtualFriendResponse, loading } = useAI();
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [currentStep, setCurrentStep] = useState('A'); // A -> B -> B' -> C'
  const [responses, setResponses] = useState({
    A: '', // 상황
    B: '', // 부정적 생각
    B_prime: '', // 새로운 생각
    C_prime: '' // 긍정적 결과
  });

  // ABC 기반 시나리오 - 교육적 가치 극대화
  const abcScenarios = [
    {
      id: 'friendship_conflict',
      title: '🤝 친구 관계 갈등',
      description: '친구와의 오해로 인한 갈등 상황',
      situation: '가장 친한 친구가 나의 비밀을 다른 친구들에게 말했다는 걸 알게 되었어.',
      commonBeliefs: [
        '친구가 나를 배신했어',
        '더 이상 믿을 수 없어',
        '모든 친구들이 나를 비웃고 있을 거야'
      ],
      guidedQuestions: [
        '다른 관점에서 생각해볼 수는 없을까?',
        '친구의 입장은 어땠을까?',
        '이 상황을 해결할 방법은 무엇일까?'
      ],
      newBeliefExamples: [
        '친구도 실수할 수 있어',
        '직접 대화해서 오해를 풀어보자',
        '우정은 한 번의 실수로 끝나지 않아'
      ],
      positiveOutcomes: [
        '친구와 솔직한 대화 나누기',
        '더 깊은 신뢰 관계 만들기',
        '갈등 해결 능력 키우기'
      ]
    },
    {
      id: 'academic_failure',
      title: '📚 학업 실패',
      description: '시험이나 과제에서 실패한 상황',
      situation: '열심히 공부했는데도 시험 점수가 생각보다 많이 낮게 나왔어.',
      commonBeliefs: [
        '난 정말 바보인가봐',
        '아무리 노력해도 소용없어',
        '부모님이 실망하실 거야'
      ],
      guidedQuestions: [
        '이번 실패에서 배울 점은 무엇일까?',
        '노력 자체에도 의미가 있지 않을까?',
        '다음엔 어떻게 다르게 접근할 수 있을까?'
      ],
      newBeliefExamples: [
        '실패는 성장의 기회야',
        '공부 방법을 바꿔보자',
        '노력하는 과정 자체가 의미있어'
      ],
      positiveOutcomes: [
        '새로운 학습 전략 시도하기',
        '선생님께 도움 요청하기',
        '꾸준한 노력 계속하기'
      ]
    },
    {
      id: 'family_conflict',
      title: '👨‍👩‍👧‍👦 가족 갈등',
      description: '부모님이나 형제자매와의 갈등',
      situation: '부모님이 게임 시간을 제한하시면서 자꾸 공부만 하라고 하셔.',
      commonBeliefs: [
        '부모님이 나를 이해하지 못해',
        '너무 불공평해',
        '내 의견은 중요하지 않나봐'
      ],
      guidedQuestions: [
        '부모님의 마음은 어떨까?',
        '서로의 입장을 이해할 방법은?',
        '좋은 해결책을 함께 찾을 수 있을까?'
      ],
      newBeliefExamples: [
        '부모님도 나를 사랑해서 그러시는 거야',
        '서로 대화하면 해결될 수 있어',
        '규칙도 필요하지만 타협도 가능해'
      ],
      positiveOutcomes: [
        '가족 회의 제안하기',
        '균형잡힌 시간표 만들기',
        '서로의 마음 이해하기'
      ]
    }
  ];

  const stepTitles = {
    A: '📍 1단계: 상황 파악하기',
    B: '💭 2단계: 부정적 생각 찾기', 
    B_prime: '✨ 3단계: 새로운 관점 찾기',
    C_prime: '🌟 4단계: 긍정적 행동 계획하기'
  };

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario);
    setCurrentStep('A');
    setResponses({
      A: scenario.situation,
      B: '',
      B_prime: '',
      C_prime: ''
    });
  };

  const handleStepComplete = (step, value) => {
    setResponses(prev => ({ ...prev, [step]: value }));
    
    // 다음 단계로 자동 진행
    const steps = ['A', 'B', 'B_prime', 'C_prime'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const renderStepContent = () => {
    const scenario = selectedScenario;
    
    switch (currentStep) {
      case 'A':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-blue-800 mb-3">
                📍 상황 (A - Activating Event)
              </h3>
              <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                <p className="text-gray-800">{scenario.situation}</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                이 상황을 잘 이해했나요? 다음 단계로 넘어가서 어떤 생각이 드는지 알아보겠습니다.
              </p>
              <button 
                onClick={() => setCurrentStep('B')}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                다음 단계로 →
              </button>
            </div>
          </div>
        );

      case 'B':
        return (
          <div className="space-y-6">
            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-red-800 mb-3">
                💭 부정적 생각 찾기 (B - Belief)
              </h3>
              <p className="text-red-700 mb-4">
                이런 상황에서 어떤 부정적인 생각이 들까요?
              </p>
              
              {/* 일반적인 부정적 생각들 예시 */}
              <div className="grid md:grid-cols-2 gap-3 mb-4">
                {scenario.commonBeliefs.map((belief, index) => (
                  <button
                    key={index}
                    onClick={() => setResponses(prev => ({ ...prev, B: belief }))}
                    className={`
                      p-3 text-left rounded border transition-all
                      ${responses.B === belief 
                        ? 'border-red-500 bg-red-100' 
                        : 'border-gray-200 bg-white hover:border-red-300'
                      }
                    `}
                  >
                    💭 {belief}
                  </button>
                ))}
              </div>
              
              {/* 직접 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  또는 직접 입력해주세요:
                </label>
                <textarea
                  value={responses.B}
                  onChange={(e) => setResponses(prev => ({ ...prev, B: e.target.value }))}
                  placeholder="이 상황에서 드는 부정적인 생각을 써보세요..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>
            </div>
            
            {responses.B && (
              <div className="text-center">
                <button 
                  onClick={() => setCurrentStep('B_prime')}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  새로운 관점 찾기 →
                </button>
              </div>
            )}
          </div>
        );

      case 'B_prime':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-green-800 mb-3">
                ✨ 새로운 관점 찾기 (B' - New Belief)
              </h3>
              
              {/* 부정적 생각 다시 보여주기 */}
              <div className="bg-red-100 p-3 rounded mb-4">
                <p className="text-red-800">
                  <span className="font-medium">부정적 생각:</span> {responses.B}
                </p>
              </div>
              
              <p className="text-green-700 mb-4">
                이제 이 생각을 다른 관점에서 바라보겠습니다. 다음 질문들을 생각해보세요:
              </p>
              
              {/* 가이드 질문들 */}
              <div className="space-y-2 mb-4">
                {scenario.guidedQuestions.map((question, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-green-600">❓</span>
                    <p className="text-gray-700">{question}</p>
                  </div>
                ))}
              </div>
              
              {/* 새로운 생각 예시들 */}
              <div className="grid md:grid-cols-2 gap-3 mb-4">
                {scenario.newBeliefExamples.map((belief, index) => (
                  <button
                    key={index}
                    onClick={() => setResponses(prev => ({ ...prev, B_prime: belief }))}
                    className={`
                      p-3 text-left rounded border transition-all
                      ${responses.B_prime === belief 
                        ? 'border-green-500 bg-green-100' 
                        : 'border-gray-200 bg-white hover:border-green-300'
                      }
                    `}
                  >
                    ✨ {belief}
                  </button>
                ))}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  나만의 새로운 생각:
                </label>
                <textarea
                  value={responses.B_prime}
                  onChange={(e) => setResponses(prev => ({ ...prev, B_prime: e.target.value }))}
                  placeholder="더 긍정적이고 현실적인 새로운 생각을 써보세요..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>
            </div>
            
            {responses.B_prime && (
              <div className="text-center">
                <button 
                  onClick={() => setCurrentStep('C_prime')}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                >
                  행동 계획 세우기 →
                </button>
              </div>
            )}
          </div>
        );

      case 'C_prime':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-purple-800 mb-3">
                🌟 긍정적 행동 계획 (C' - New Consequence)
              </h3>
              
              {/* 변화 과정 요약 */}
              <div className="space-y-3 mb-6">
                <div className="bg-red-100 p-3 rounded">
                  <p className="text-red-800">
                    <span className="font-medium">이전 생각:</span> {responses.B}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-2xl">⬇️</span>
                </div>
                <div className="bg-green-100 p-3 rounded">
                  <p className="text-green-800">
                    <span className="font-medium">새로운 생각:</span> {responses.B_prime}
                  </p>
                </div>
              </div>
              
              <p className="text-purple-700 mb-4">
                새로운 생각을 바탕으로 어떤 긍정적인 행동을 할 수 있을까요?
              </p>
              
              {/* 긍정적 행동 예시들 */}
              <div className="grid md:grid-cols-2 gap-3 mb-4">
                {scenario.positiveOutcomes.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setResponses(prev => ({ ...prev, C_prime: action }))}
                    className={`
                      p-3 text-left rounded border transition-all
                      ${responses.C_prime === action 
                        ? 'border-purple-500 bg-purple-100' 
                        : 'border-gray-200 bg-white hover:border-purple-300'
                      }
                    `}
                  >
                    🌟 {action}
                  </button>
                ))}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  나만의 행동 계획:
                </label>
                <textarea
                  value={responses.C_prime}
                  onChange={(e) => setResponses(prev => ({ ...prev, C_prime: e.target.value }))}
                  placeholder="구체적으로 어떤 행동을 할지 계획해보세요..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>
            </div>
            
            {responses.C_prime && (
              <div className="text-center space-y-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2">🎉 ABC 분석 완성!</h3>
                  <p>문제 상황을 새로운 관점으로 바라보고 긍정적인 해결책을 찾았습니다.</p>
                </div>
                
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => setSelectedScenario(null)}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    새로운 시나리오
                  </button>
                  <button 
                    onClick={() => {/* 결과 저장 로직 */}}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    결과 저장하기
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!selectedScenario) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            🧠 ABC 사고 모델 연습
          </h1>
          <p className="text-lg text-gray-600">
            문제 상황을 새로운 관점에서 바라보고 긍정적인 해결책을 찾아보세요
          </p>
        </motion.div>

        {/* ABC 모델 설명 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📚 ABC 모델이란?</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">A</div>
              <h3 className="font-bold text-blue-600">상황</h3>
              <p className="text-sm text-gray-600">어떤 일이 일어났나요?</p>
            </div>
            <div className="text-center">
              <div className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">B</div>
              <h3 className="font-bold text-red-600">부정적 생각</h3>
              <p className="text-sm text-gray-600">어떤 생각이 들었나요?</p>
            </div>
            <div className="text-center">
              <div className="bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">B'</div>
              <h3 className="font-bold text-green-600">새로운 생각</h3>
              <p className="text-sm text-gray-600">다른 관점은 없을까요?</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">C'</div>
              <h3 className="font-bold text-purple-600">긍정적 행동</h3>
              <p className="text-sm text-gray-600">어떻게 행동할까요?</p>
            </div>
          </div>
        </div>

        {/* 시나리오 선택 */}
        <div className="grid md:grid-cols-3 gap-6">
          {abcScenarios.map((scenario) => (
            <motion.button
              key={scenario.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleScenarioSelect(scenario)}
              className="bg-white border-2 border-gray-200 hover:border-purple-300 p-6 rounded-lg text-left transition-all"
            >
              <div className="text-2xl mb-3">{scenario.title}</div>
              <p className="font-medium text-gray-800 mb-2">{scenario.description}</p>
              <p className="text-sm text-gray-600">{scenario.situation.slice(0, 60)}...</p>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 진행 상황 표시 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {selectedScenario.title}
          </h1>
          <button 
            onClick={() => setSelectedScenario(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            ← 다른 시나리오 선택
          </button>
        </div>
        
        {/* 단계 진행 바 */}
        <div className="flex items-center space-x-4">
          {['A', 'B', 'B_prime', 'C_prime'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold
                ${currentStep === step || responses[step] 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-200 text-gray-500'
                }
              `}>
                {step === 'B_prime' ? "B'" : step === 'C_prime' ? "C'" : step}
              </div>
              {index < 3 && (
                <div className={`w-8 h-1 mx-2 ${
                  responses[step] ? 'bg-purple-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <h2 className="text-lg font-medium text-gray-700 mt-4">
          {stepTitles[currentStep]}
        </h2>
      </div>

      {/* 단계별 내용 */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        {renderStepContent()}
      </motion.div>
    </div>
  );
};

export default PracticeMode;