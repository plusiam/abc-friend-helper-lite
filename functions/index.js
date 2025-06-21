// functions/index.js - Gemini AI 기반 Firebase Functions
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const cors = require('cors')({ origin: true });

// Firebase Admin 초기화
admin.initializeApp();

// Gemini AI 초기화
const genAI = new GoogleGenerativeAI(functions.config().gemini.key);

// 안전 설정
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
];

// 공감 표현 분석
exports.analyzeEmpathy = functions.https.onCall(async (data, context) => {
  // 인증 체크
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다');
  }

  const { response, situation, studentAge = 10 } = data;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      safetySettings,
    });

    const prompt = `
당신은 초등학생 또래 상담 교육 전문가입니다.
${studentAge}세 학생이 작성한 공감 표현을 평가하고 피드백을 제공해주세요.

평가 기준:
1. 연령에 적절한 언어 사용 (30점)
2. 진정성 있는 공감 표현 (40점)
3. 비판단적이고 지지적인 태도 (30점)

상황: ${situation}
학생의 공감 표현: ${response}

다음 JSON 형식으로만 응답해주세요:
{
  "scores": {
    "empathy": (0-100 숫자),
    "appropriate": (0-100 숫자),
    "overall": (0-100 숫자)
  },
  "strengths": ["잘한 점1", "잘한 점2"],
  "suggestions": ["개선할 점1", "개선할 점2"],
  "betterExamples": ["더 나은 표현 예시1", "예시2"]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // JSON 파싱
    let analysisResult;
    try {
      // JSON 부분만 추출 (```json 태그 제거)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON 형식을 찾을 수 없습니다');
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      // 기본 응답 제공
      analysisResult = {
        scores: { empathy: 70, appropriate: 70, overall: 70 },
        strengths: ["친구의 마음을 이해하려고 노력했어요"],
        suggestions: ["더 구체적인 감정 표현을 해보세요"],
        betterExamples: ["그런 일이 있었구나. 정말 속상했겠다."]
      };
    }

    // 학습 데이터 저장
    await admin.firestore().collection('empathyAnalysis').add({
      userId: context.auth.uid,
      response,
      situation,
      analysis: analysisResult,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // 스킬 포인트 업데이트
    if (analysisResult.scores.overall >= 80) {
      await updateUserSkills(context.auth.uid, 'empathy', 10);
    }

    return analysisResult;

  } catch (error) {
    console.error('공감 분석 오류:', error);
    throw new functions.https.HttpsError('internal', '분석 중 오류가 발생했습니다');
  }
});

// 공감 표현 생성
exports.generateEmpathy = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다');
  }

  const { situation, emotions, studentAge = 10 } = data;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      safetySettings,
    });

    const prompt = `
${studentAge}세 초등학생이 친구에게 할 수 있는 자연스러운 공감 표현을 만들어주세요.

요구사항:
- 또래가 사용하는 일상적인 언어로
- 진심이 담긴 따뜻한 표현으로
- 너무 어른스럽지 않게
- ABC 구조를 포함하여 (A: 상황 인정, B: 감정 이해, C: 지지 표현)

상황: ${situation}
친구의 감정: ${emotions.join(', ')}

공감 표현을 만들어주세요:`;

    const result = await model.generateContent(prompt);
    const suggestion = result.response.text();

    return {
      suggestion: suggestion.trim(),
      tips: [
        "친구의 이야기를 끝까지 들어주세요",
        "조언보다는 마음을 이해한다는 표현을 해주세요",
        "비슷한 경험이 있다면 나눠주세요"
      ]
    };

  } catch (error) {
    console.error('공감 생성 오류:', error);
    throw new functions.https.HttpsError('internal', '생성 중 오류가 발생했습니다');
  }
});

// 해결책 생성
exports.generateSolutions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다');
  }

  const { problem, negativeThought, studentAge = 10 } = data;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      safetySettings,
    });

    const prompt = `
초등학생이 이해하고 실천할 수 있는 인지행동치료(CBT) 기반 해결책을 제안해주세요.

대상 연령: ${studentAge}세
문제 상황: ${problem}
부정적 생각: ${negativeThought}

다음 형식으로 답변해주세요:

1. 새로운 생각 (3가지):
- 부정적 사고를 긍정적으로 바꾸는 방법

2. 실천 방법 (3가지):
- 실제로 할 수 있는 구체적인 행동

3. 격려 메시지:
- 따뜻하고 희망적인 메시지

초등학생 눈높이에 맞춰 쉽고 친근하게 설명해주세요.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // 구조화된 응답으로 파싱
    const solutions = parseSolutions(responseText);

    return solutions;

  } catch (error) {
    console.error('해결책 생성 오류:', error);
    throw new functions.https.HttpsError('internal', '생성 중 오류가 발생했습니다');
  }
});

// 안전성 체크
exports.checkSafety = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다');
  }

  const { conversation, sessionId } = data;

  try {
    // 1단계: 키워드 기반 체크
    const riskKeywords = {
      high: ['자살', '자해', '죽고 싶어', '사라지고 싶어'],
      medium: ['폭력', '때리', '괴롭힘', '왕따', '학대'],
      low: ['우울', '불안', '무서워', '힘들어']
    };

    let riskLevel = 'none';
    let detectedKeywords = [];

    for (const [level, keywords] of Object.entries(riskKeywords)) {
      for (const keyword of keywords) {
        if (conversation.includes(keyword)) {
          riskLevel = level;
          detectedKeywords.push(keyword);
          break;
        }
      }
      if (riskLevel !== 'none') break;
    }

    // 2단계: Gemini AI를 통한 심층 분석
    if (riskLevel !== 'none') {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-pro",
        safetySettings,
      });

      const prompt = `
다음 대화 내용을 분석하여 아동의 안전 위험도를 평가해주세요.

대화 내용: ${conversation}

다음 JSON 형식으로 응답해주세요:
{
  "riskLevel": "none" | "low" | "medium" | "high",
  "concerns": ["우려사항1", "우려사항2"],
  "immediateActionNeeded": true/false,
  "recommendedActions": ["권장사항1", "권장사항2"]
}`;

      const result = await model.generateContent(prompt);
      const aiAnalysis = JSON.parse(result.response.text());

      // AI 분석 결과가 더 높은 위험도를 나타내면 업데이트
      if (getRiskPriority(aiAnalysis.riskLevel) > getRiskPriority(riskLevel)) {
        riskLevel = aiAnalysis.riskLevel;
      }

      // 고위험 상황 처리
      if (riskLevel === 'high' || aiAnalysis.immediateActionNeeded) {
        await admin.firestore().collection('urgentAlerts').add({
          sessionId,
          userId: context.auth.uid,
          conversation,
          detectedKeywords,
          riskLevel,
          aiAnalysis,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: 'pending'
        });
      }
    }

    return {
      safe: riskLevel === 'none' || riskLevel === 'low',
      riskLevel,
      needsAdultHelp: riskLevel === 'high' || riskLevel === 'medium',
      message: getRiskMessage(riskLevel),
      resources: getHelpResources(riskLevel)
    };

  } catch (error) {
    console.error('안전성 체크 오류:', error);
    // 오류 시 안전을 위해 도움 요청
    return {
      safe: false,
      riskLevel: 'unknown',
      needsAdultHelp: true,
      message: "상황을 정확히 파악하기 어려워요. 믿을 수 있는 어른에게 도움을 요청하는 것이 좋겠어요.",
      resources: getHelpResources('medium')
    };
  }
});

// 연습 모드 가상 친구 응답
exports.virtualFriendResponse = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다');
  }

  const { 
    personality, // 'shy', 'talkative', 'emotional'
    problem,
    counselorMessage,
    conversationHistory = []
  } = data;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      safetySettings,
    });

    const systemPrompt = getPersonalityPrompt(personality);
    
    // 대화 히스토리 구성
    let conversationContext = conversationHistory.map(msg => 
      `${msg.role === 'counselor' ? '상담자' : '친구'}: ${msg.content}`
    ).join('\n');

    const prompt = `
${systemPrompt}

현재 고민: ${problem}

대화 내용:
${conversationContext}
상담자: ${counselorMessage}

위 상담자의 말에 대한 10살 초등학생 친구의 자연스러운 반응을 작성해주세요.
성격에 맞게 반응하되, 상담이 진전될 수 있도록 해주세요.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // 상담 품질 평가
    const quality = await evaluateCounselingQuality(counselorMessage, problem);

    return {
      friendResponse: response.trim(),
      counselingQuality: quality,
      hints: quality.score < 70 ? getHints(problem, personality) : null
    };

  } catch (error) {
    console.error('가상 친구 응답 오류:', error);
    throw new functions.https.HttpsError('internal', '응답 생성 중 오류가 발생했습니다');
  }
});

// 상담 세션 완료 처리
exports.completeSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다');
  }

  const { sessionId, sessionData } = data;

  try {
    // 세션 데이터 저장
    await admin.firestore().collection('completedSessions').doc(sessionId).set({
      ...sessionData,
      userId: context.auth.uid,
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 통계 업데이트
    await updateUserStats(context.auth.uid, sessionData);

    // 배지 확인 및 부여
    const newBadges = await checkAndAwardBadges(context.auth.uid);

    // 상담 품질 분석
    const analysis = await analyzeSessionQuality(sessionData);

    return {
      success: true,
      analysis,
      newBadges,
      totalSessions: await getTotalSessions(context.auth.uid)
    };

  } catch (error) {
    console.error('세션 완료 처리 오류:', error);
    throw new functions.https.HttpsError('internal', '세션 완료 처리 중 오류가 발생했습니다');
  }
});

// 일일 상담 팁 생성 (Scheduled Function)
exports.generateDailyTips = functions.pubsub.schedule('every day 09:00').onRun(async (context) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      safetySettings,
    });

    const categories = ['공감', '경청', '격려', '문제해결'];
    const category = categories[Math.floor(Math.random() * categories.length)];

    const prompt = `
초등학생 또래 상담자를 위한 오늘의 ${category} 팁을 만들어주세요.

요구사항:
- 초등학생이 이해하기 쉬운 언어로
- 실제로 활용할 수 있는 구체적인 팁
- 50자 이내로 간단명료하게
- 긍정적이고 격려하는 톤으로

팁을 작성해주세요:`;

    const result = await model.generateContent(prompt);
    const tip = result.response.text().trim();

    // Firestore에 저장
    await admin.firestore().collection('dailyTips').add({
      tip,
      category,
      date: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('일일 팁 생성 완료:', tip);

  } catch (error) {
    console.error('일일 팁 생성 오류:', error);
  }
});

// 격려 메시지 생성
exports.generateEncouragement = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다');
  }

  const { situation, emotion, previousMessages = [] } = data;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      safetySettings,
    });

    const prompt = `
친구를 위한 따뜻한 격려 메시지를 만들어주세요.

상황: ${situation}
친구의 감정: ${emotion}
이미 사용한 메시지: ${previousMessages.join(', ')}

요구사항:
- 초등학생이 친구에게 전할 수 있는 자연스러운 메시지
- 진심이 담긴 따뜻한 표현
- 희망적이고 긍정적인 내용
- 30자 내외로 간단하게
- 이전 메시지와 중복되지 않게

격려 메시지:`;

    const result = await model.generateContent(prompt);
    const message = result.response.text().trim();

    return {
      message,
      category: categorizeEncouragement(message)
    };

  } catch (error) {
    console.error('격려 메시지 생성 오류:', error);
    throw new functions.https.HttpsError('internal', '메시지 생성 중 오류가 발생했습니다');
  }
});

// 유틸리티 함수들
function parseSolutions(response) {
  try {
    // 응답을 섹션별로 분리
    const sections = response.split(/\d\.\s+/);
    
    const positiveThoughts = [];
    const actionSteps = [];
    let encouragement = '';
    
    sections.forEach(section => {
      if (section.includes('새로운 생각') || section.includes('긍정적')) {
        const thoughts = section.match(/[-•]\s*(.+)/g) || [];
        positiveThoughts.push(...thoughts.map(t => t.replace(/[-•]\s*/, '').trim()));
      } else if (section.includes('실천') || section.includes('행동')) {
        const actions = section.match(/[-•]\s*(.+)/g) || [];
        actionSteps.push(...actions.map(a => a.replace(/[-•]\s*/, '').trim()));
      } else if (section.includes('격려')) {
        encouragement = section.replace(/격려.*?:/, '').trim();
      }
    });

    return {
      positiveThoughts: positiveThoughts.slice(0, 3),
      actionSteps: actionSteps.slice(0, 3),
      encouragement: encouragement || '너는 충분히 잘하고 있어! 힘내! 🌟'
    };
  } catch (error) {
    console.error('솔루션 파싱 오류:', error);
    return {
      positiveThoughts: ['실수해도 괜찮아, 다시 시도하면 돼'],
      actionSteps: ['깊게 숨을 쉬어보기', '믿을 수 있는 사람과 이야기하기'],
      encouragement: '너는 충분히 잘하고 있어! 🌟'
    };
  }
}

function getPersonalityPrompt(personality) {
  const prompts = {
    shy: `당신은 수줍음이 많은 10살 초등학생입니다. 
      - 말을 조금씩, 짧게 합니다
      - 감정 표현을 어려워합니다
      - "음...", "그런가..." 같은 표현을 자주 사용합니다
      - 상담자가 친절하면 조금씩 마음을 엽니다`,
    
    talkative: `당신은 활발하고 말이 많은 10살 초등학생입니다.
      - 감정을 솔직하게 표현합니다
      - 이야기를 자세히 설명합니다
      - "진짜로!", "완전!" 같은 표현을 자주 사용합니다
      - 때로는 주제에서 벗어난 이야기도 합니다`,
    
    emotional: `당신은 감정이 풍부한 10살 초등학생입니다.
      - 울거나 화내는 것을 자주 표현합니다
      - "너무 속상해", "정말 화나" 같은 감정 표현을 많이 사용합니다
      - 공감을 받으면 진정됩니다
      - 감정이 격해지면 말이 빨라집니다`
  };

  return prompts[personality] || prompts.talkative;
}

async function updateUserSkills(userId, skill, points) {
  const userRef = admin.firestore().collection('users').doc(userId);
  
  await userRef.update({
    [`skills.${skill}`]: admin.firestore.FieldValue.increment(points),
    lastActivityAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function evaluateCounselingQuality(message, problem) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      safetySettings,
    });

    const prompt = `
다음 상담 메시지의 품질을 평가해주세요.

문제 상황: ${problem}
상담자 메시지: ${message}

평가 기준:
1. 공감 표현 (40점)
2. 경청 자세 (30점)
3. 적절한 질문 (30점)

JSON 형식으로 응답:
{
  "score": 0-100,
  "strengths": ["강점1", "강점2"],
  "improvements": ["개선점1", "개선점2"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch[0]);
    } catch {
      return {
        score: 75,
        strengths: ["친구의 마음을 이해하려고 노력했어요"],
        improvements: ["더 구체적인 질문을 해보세요"]
      };
    }
  } catch (error) {
    console.error('품질 평가 오류:', error);
    return { score: 70, strengths: [], improvements: [] };
  }
}

async function checkAndAwardBadges(userId) {
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data() || {};
  const newBadges = [];

  const badges = {
    firstCounseling: {
      condition: (userData.totalSessions || 0) >= 1,
      name: "첫 상담 완료",
      icon: "🌱"
    },
    empathyMaster: {
      condition: (userData.skills?.empathy || 0) >= 100,
      name: "공감 마스터",
      icon: "💝"
    },
    helpingHand: {
      condition: (userData.totalSessions || 0) >= 10,
      name: "도움의 손길",
      icon: "🤝"
    },
    problemSolver: {
      condition: (userData.skills?.problemSolving || 0) >= 100,
      name: "문제 해결사",
      icon: "💡"
    }
  };

  const userRef = admin.firestore().collection('users').doc(userId);

  for (const [key, badge] of Object.entries(badges)) {
    if (badge.condition && !userData.badges?.[key]) {
      newBadges.push(badge);
      await userRef.update({
        [`badges.${key}`]: true,
        [`badgeTimestamps.${key}`]: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  return newBadges;
}

async function updateUserStats(userId, sessionData) {
  const userRef = admin.firestore().collection('users').doc(userId);
  
  await userRef.update({
    totalSessions: admin.firestore.FieldValue.increment(1),
    lastSessionAt: admin.firestore.FieldValue.serverTimestamp(),
    [`sessionHistory.${Date.now()}`]: {
      completedAt: new Date(),
      situation: sessionData.situation
    }
  });
}

async function analyzeSessionQuality(sessionData) {
  // 간단한 품질 분석
  const quality = {
    empathyScore: sessionData.empathyResponse ? 80 : 0,
    solutionScore: sessionData.solutions?.newThinking ? 85 : 0,
    encouragementScore: sessionData.encouragement?.personal ? 90 : 0
  };

  quality.overall = Math.round(
    (quality.empathyScore + quality.solutionScore + quality.encouragementScore) / 3
  );

  return quality;
}

async function getTotalSessions(userId) {
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  return userDoc.data()?.totalSessions || 0;
}

function getRiskPriority(level) {
  const priorities = { none: 0, low: 1, medium: 2, high: 3 };
  return priorities[level] || 0;
}

function getRiskMessage(level) {
  const messages = {
    high: "이 상황은 어른의 도움이 꼭 필요해 보여요. 믿을 수 있는 어른에게 이야기해보는 것이 좋겠어요.",
    medium: "친구가 많이 힘든 상황인 것 같아요. 선생님이나 부모님께 도움을 요청하는 것도 좋은 방법이에요.",
    low: "친구의 마음을 잘 들어주고 있어요. 계속 따뜻하게 대해주세요.",
    none: "잘하고 있어요! 친구에게 큰 힘이 되고 있을 거예요."
  };
  
  return messages[level] || messages.none;
}

function getHelpResources(level) {
  return {
    phone: {
      청소년전화: "1388",
      생명의전화: "109",
      description: "24시간 상담 가능"
    },
    online: {
      "청소년사이버상담센터": "https://www.cyber1388.kr",
      "마음건강 정보": "https://www.youth.go.kr"
    },
    school: {
      message: "학교 상담 선생님께 도움을 요청해보세요",
      weeClass: "학교 Wee클래스 이용하기"
    }
  };
}

function getHints(problem, personality) {
  const hints = {
    shy: [
      "천천히 기다려주세요",
      "예/아니오로 대답할 수 있는 질문을 해보세요",
      "친구가 편안함을 느낄 수 있도록 해주세요"
    ],
    talkative: [
      "친구의 이야기를 정리해서 다시 말해주세요",
      "핵심 감정에 집중해보세요",
      "적절한 타이밍에 질문을 해보세요"
    ],
    emotional: [
      "감정을 인정하고 받아주세요",
      "진정할 시간을 주세요",
      "함께 심호흡을 해보세요"
    ]
  };

  return hints[personality] || hints.talkative;
}

function categorizeEncouragement(message) {
  if (message.includes('힘') || message.includes('할 수 있')) return 'strength';
  if (message.includes('함께') || message.includes('혼자')) return 'support';
  if (message.includes('괜찮') || message.includes('걱정')) return 'comfort';
  return 'general';
}

// Firebase 환경 설정
// firebase functions:config:set gemini.key="your-gemini-api-key"