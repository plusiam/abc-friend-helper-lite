// functions/index.js - Gemini AI 기반 Firebase Functions (ABC 모델 추가)
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {GoogleGenerativeAI, HarmCategory, HarmBlockThreshold} = require("@google/generative-ai");
const {RateLimiterMemory} = require("rate-limiter-flexible");
const cors = require("cors");

// Firebase Admin 초기화
admin.initializeApp();

// CORS 설정 - Vercel 도메인 포함
const corsOptions = {
  origin: [
    "http://localhost:3000",           // 로컬 개발
    "https://localhost:3000",          // 로컬 HTTPS
    /^https:\/\/.*\.vercel\.app$/,     // 모든 Vercel 배포 (프리뷰 포함)
    "https://abc-friend-helper.vercel.app",  // 프로덕션 (실제 도메인으로 변경)
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const corsMiddleware = cors(corsOptions);

// Gemini AI 초기화
const genAI = new GoogleGenerativeAI(functions.config().gemini.key);

// Rate Limiter 설정
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 100, // 요청 수
  duration: 3600, // 1시간
});

// 향상된 안전 설정
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

// 모델 설정
const getModel = (temperature = 0.7) => {
  return genAI.getGenerativeModel({
    model: "gemini-1.5-pro", // 최신 모델 사용
    safetySettings,
    generationConfig: {
      temperature,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  });
};

// 인증 검증 미들웨어
const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "인증 토큰이 필요합니다." });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("인증 검증 실패:", error);
    res.status(401).json({ error: "유효하지 않은 인증 토큰입니다." });
  }
};

// Rate limiting 미들웨어
const rateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({ 
      error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
      retryAfter: rejRes.msBeforeNext 
    });
  }
};

// =============================================================================
// ABC 모델 전용 AI 함수들 (새로 추가)
// =============================================================================

// ABC 단계별 분석 및 가이드 제공 (HTTP)
exports.analyzeABCStepHTTP = functions.https.onRequest(async (req, res) => {
  corsMiddleware(req, res, async () => {
    if (req.method === "OPTIONS") {
      res.status(200).send();
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "POST 메서드만 지원됩니다." });
      return;
    }

    try {
      await new Promise((resolve, reject) => {
        verifyAuth(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const { step, userInput, scenario, studentAge = 10 } = req.body;

      if (!step || !scenario) {
        res.status(400).json({ error: "단계와 시나리오 정보가 필요합니다" });
        return;
      }

      const model = getModel(0.7);
      const result = await generateABCStepGuide(model, step, userInput, scenario, studentAge);

      // 학습 데이터 저장
      admin.firestore().collection("abcAnalysis").add({
        userId: req.user.uid,
        step,
        userInput,
        scenario: scenario.id,
        analysis: result,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        modelVersion: "gemini-1.5-pro",
        source: "http",
      }).catch((error) => console.error("ABC 데이터 저장 오류:", error));

      res.json(result);
    } catch (error) {
      console.error("ABC 분석 오류:", error);
      res.status(500).json({ error: "분석 중 오류가 발생했습니다." });
    }
  });
});

// ABC 단계별 가이드 생성 함수
async function generateABCStepGuide(model, step, userInput, scenario, studentAge) {
  switch (step) {
    case 'B':
      return await generateBeliefAnalysis(model, userInput, scenario, studentAge);
    case 'B_prime':
      return await generateNewBeliefGuide(model, userInput, scenario, studentAge);
    case 'C_prime':
      return await generateActionPlanGuide(model, userInput, scenario, studentAge);
    default:
      throw new Error(`지원하지 않는 단계입니다: ${step}`);
  }
}

// B 단계: 부정적 생각 분석
async function generateBeliefAnalysis(model, userInput, scenario, studentAge) {
  const prompt = `
당신은 초등학생 인지행동치료 교육 전문가입니다.
${studentAge}세 학생이 작성한 부정적 생각을 분석하고 피드백을 제공해주세요.

시나리오: ${scenario.situation}
학생이 입력한 부정적 생각: ${userInput}

다음 JSON 형식으로 응답해주세요:
{
  "analysis": {
    "thinkingType": "흑백사고|과잉일반화|마음읽기|파국화|최소화|감정적추론",
    "intensity": "낮음|보통|높음",
    "realistic": true/false
  },
  "guidance": {
    "explanation": "이런 생각이 생기는 이유를 아이 눈높이로 설명",
    "questions": ["생각을 바꿔볼 질문1", "질문2", "질문3"],
    "encouragement": "공감하는 격려 메시지"
  },
  "nextStepHint": "다음 단계(B')로 넘어가기 위한 힌트"
}

요구사항:
- ${studentAge}세 아이가 이해할 수 있는 쉬운 언어 사용
- 비판적이지 않고 이해하는 톤으로
- 인지적 오류 유형을 아이 친화적으로 설명
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedResponse = responseText.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("JSON 형식을 찾을 수 없습니다");
    }
  } catch (parseError) {
    // 기본 응답
    return {
      analysis: {
        thinkingType: "파국화",
        intensity: "보통",
        realistic: false
      },
      guidance: {
        explanation: "힘든 상황에서는 이런 생각이 들 수 있어요. 이해할 수 있어요.",
        questions: [
          "정말 그럴까요? 다른 가능성은 없을까요?",
          "친구라면 나에게 뭐라고 말해줄까요?",
          "이 상황이 영원히 계속될까요?"
        ],
        encouragement: "힘든 마음이 이해가 되어요. 함께 다른 관점에서 생각해볼까요?"
      },
      nextStepHint: "이제 이 생각을 다른 관점에서 바라보는 연습을 해봐요."
    };
  }
}

// B' 단계: 새로운 생각 가이드
async function generateNewBeliefGuide(model, userInput, scenario, studentAge) {
  const prompt = `
${studentAge}세 학생이 부정적 생각을 긍정적이고 현실적인 생각으로 바꾸는 것을 도와주세요.

원래 부정적 생각: ${scenario.commonBeliefs ? scenario.commonBeliefs[0] : '부정적 생각'}
학생이 시도한 새로운 생각: ${userInput}

다음 JSON 형식으로 응답해주세요:
{
  "evaluation": {
    "positivityScore": 0-100,
    "realismScore": 0-100,
    "helpfulness": 0-100,
    "overall": 0-100
  },
  "feedback": {
    "strengths": ["잘한 점1", "잘한 점2"],
    "improvements": ["개선할 점1", "개선할 점2"],
    "betterVersions": ["더 나은 표현1", "더 나은 표현2", "더 나은 표현3"]
  },
  "cognitiveTools": {
    "technique": "증거찾기|관점바꾸기|균형잡기|미래상상하기",
    "explanation": "이 기법이 왜 도움되는지 설명",
    "examples": ["기법 활용 예시1", "예시2"]
  },
  "encouragement": "격려 메시지와 다음 단계 안내"
}

요구사항:
- 아이의 시도를 인정하고 격려
- 더 균형잡히고 현실적인 사고로 발전시키기
- 구체적이고 실용적인 피드백
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedResponse = responseText.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("JSON 형식을 찾을 수 없습니다");
    }
  } catch (parseError) {
    return {
      evaluation: {
        positivityScore: 75,
        realismScore: 70,
        helpfulness: 80,
        overall: 75
      },
      feedback: {
        strengths: ["긍정적으로 생각하려고 노력했어요", "균형잡힌 관점을 찾고 있어요"],
        improvements: ["더 구체적으로 표현해보세요", "실현 가능한 방법을 포함해보세요"],
        betterVersions: [
          "이런 일도 있지만, 좋은 일도 있을 거야",
          "처음엔 어렵지만, 조금씩 나아질 수 있어",
          "완벽하지 않아도 괜찮아, 최선을 다하는 것만으로도 충분해"
        ]
      },
      cognitiveTools: {
        technique: "균형잡기",
        explanation: "좋은 면과 어려운 면을 함께 보는 연습이에요",
        examples: ["힘들지만 극복할 수 있어", "실수했지만 배울 기회야"]
      },
      encouragement: "정말 잘하고 있어요! 이제 이 생각으로 어떤 행동을 할지 계획해볼까요?"
    };
  }
}

// C' 단계: 긍정적 행동 계획 가이드
async function generateActionPlanGuide(model, userInput, scenario, studentAge) {
  const prompt = `
${studentAge}세 학생이 새로운 생각을 바탕으로 세운 행동 계획을 평가하고 개선하도록 도와주세요.

시나리오: ${scenario.situation}
학생의 행동 계획: ${userInput}

다음 JSON 형식으로 응답해주세요:
{
  "evaluation": {
    "feasibilityScore": 0-100,
    "specificityScore": 0-100,
    "positiveImpactScore": 0-100,
    "overall": 0-100
  },
  "feedback": {
    "strengths": ["계획의 좋은 점1", "좋은 점2"],
    "suggestions": ["개선 제안1", "개선 제안2"],
    "stepByStep": ["구체적 실행 단계1", "단계2", "단계3"]
  },
  "practicalTips": {
    "timing": "언제 실행하면 좋은지",
    "preparation": "미리 준비할 것들",
    "obstacles": "예상되는 어려움과 대처법",
    "support": "도움받을 수 있는 사람이나 방법"
  },
  "encouragement": "실행을 격려하는 메시지",
  "followUp": "실행 후 어떻게 점검할지"
}

요구사항:
- 아이가 실제로 실행할 수 있는 현실적인 계획
- 단계별로 구체적인 가이드
- 긍정적 결과에 대한 기대감 조성
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedResponse = responseText.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("JSON 형식을 찾을 수 없습니다");
    }
  } catch (parseError) {
    return {
      evaluation: {
        feasibilityScore: 80,
        specificityScore: 70,
        positiveImpactScore: 85,
        overall: 78
      },
      feedback: {
        strengths: ["실천 가능한 좋은 계획이에요", "긍정적인 변화를 만들 수 있을 것 같아요"],
        suggestions: ["더 구체적인 방법을 추가해보세요", "작은 단계부터 시작해보세요"],
        stepByStep: [
          "마음의 준비를 하고",
          "적절한 때를 선택해서",
          "용기내어 실행해보기"
        ]
      },
      practicalTips: {
        timing: "마음이 편안할 때, 충분한 시간이 있을 때",
        preparation: "무슨 말을 할지 미리 생각해보기",
        obstacles: "거절당할 수도 있지만, 그래도 시도한 것만으로도 성장이에요",
        support: "가족이나 친한 친구에게 응원받기"
      },
      encouragement: "훌륭한 계획이에요! 작은 걸음부터 시작해보세요. 할 수 있어요!",
      followUp: "실행 후에 어떤 기분이었는지, 무엇을 배웠는지 되돌아보기"
    };
  }
}

// ABC 전체 결과 요약 생성 (HTTP)
exports.generateABCSummaryHTTP = functions.https.onRequest(async (req, res) => {
  corsMiddleware(req, res, async () => {
    if (req.method === "OPTIONS") {
      res.status(200).send();
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "POST 메서드만 지원됩니다." });
      return;
    }

    try {
      await new Promise((resolve, reject) => {
        verifyAuth(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const { responses, scenario, studentAge = 10 } = req.body;

      if (!responses || !responses.A || !responses.B || !responses.B_prime || !responses.C_prime) {
        res.status(400).json({ error: "모든 ABC 단계 응답이 필요합니다" });
        return;
      }

      const model = getModel(0.7);
      const prompt = `
${studentAge}세 학생이 ABC 모델을 완성했습니다. 전체적인 분석과 피드백을 제공해주세요.

상황 (A): ${responses.A}
부정적 생각 (B): ${responses.B}
새로운 생각 (B'): ${responses.B_prime}
긍정적 행동 (C'): ${responses.C_prime}

다음 JSON 형식으로 응답해주세요:
{
  "summary": {
    "cognitiveGrowth": "인지적 성장 정도 (0-100)",
    "emotionalRegulation": "감정 조절 능력 (0-100)",
    "problemSolving": "문제해결 능력 (0-100)",
    "overall": "전체 점수 (0-100)"
  },
  "highlights": {
    "bestAspect": "가장 잘한 부분",
    "improvementArea": "더 발전시킬 부분",
    "keyLearning": "핵심 학습 포인트"
  },
  "personalizedAdvice": {
    "strengthsToKeep": ["계속 유지할 강점1", "강점2"],
    "skillsToImprove": ["향상시킬 기술1", "기술2"],
    "nextChallenges": ["다음에 도전해볼 것1", "것2"]
  },
  "motivationalMessage": "격려와 동기부여 메시지",
  "progressBadge": {
    "name": "획득한 배지 이름",
    "description": "배지 설명",
    "icon": "이모지"
  }
}

요구사항:
- 성취감을 느낄 수 있는 격려적 톤
- 구체적이고 개인화된 피드백
- 다음 학습을 위한 동기부여
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      try {
        const cleanedResponse = responseText.replace(/```json|```/g, "").trim();
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        const summaryResult = JSON.parse(jsonMatch[0]);

        // 전체 ABC 결과 저장
        admin.firestore().collection("abcCompletions").add({
          userId: req.user.uid,
          scenario: scenario.id,
          responses,
          summary: summaryResult,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          modelVersion: "gemini-1.5-pro",
          source: "http",
        }).catch((error) => console.error("ABC 완료 데이터 저장 오류:", error));

        // 스킬 포인트 업데이트
        const skillPoints = Math.round(summaryResult.summary.overall / 10);
        updateUserSkills(req.user.uid, "cognitiveRestructuring", skillPoints).catch(console.error);

        res.json(summaryResult);
      } catch (parseError) {
        // 기본 응답
        res.json({
          summary: {
            cognitiveGrowth: 80,
            emotionalRegulation: 75,
            problemSolving: 82,
            overall: 79
          },
          highlights: {
            bestAspect: "새로운 관점으로 생각하려고 노력한 점",
            improvementArea: "더 구체적인 행동 계획 세우기",
            keyLearning: "생각을 바꾸면 기분도 행동도 달라질 수 있다는 것"
          },
          personalizedAdvice: {
            strengthsToKeep: ["긍정적으로 생각하려는 노력", "문제를 해결하려는 의지"],
            skillsToImprove: ["더 다양한 관점에서 생각하기", "구체적인 계획 세우기"],
            nextChallenges: ["다른 시나리오에도 ABC 모델 적용해보기", "일상에서 실제로 실천해보기"]
          },
          motivationalMessage: "정말 훌륭하게 해냈어요! ABC 모델을 잘 이해하고 적용했네요. 이제 실제 상황에서도 이렇게 생각해볼 수 있을 거예요.",
          progressBadge: {
            name: "사고력 탐험가",
            description: "새로운 관점으로 생각하는 방법을 배웠어요",
            icon: "🧠"
          }
        });
      }
    } catch (error) {
      console.error("ABC 요약 생성 오류:", error);
      res.status(500).json({ error: "요약 생성 중 오류가 발생했습니다." });
    }
  });
});

// =============================================================================
// 기존 HTTP FUNCTIONS (유지)
// =============================================================================

// HTTP 공감 분석
exports.analyzeEmpathyHTTP = functions.https.onRequest(async (req, res) => {
  corsMiddleware(req, res, async () => {
    // OPTIONS 요청 처리
    if (req.method === "OPTIONS") {
      res.status(200).send();
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "POST 메서드만 지원됩니다." });
      return;
    }

    try {
      // 미들웨어 적용
      await new Promise((resolve, reject) => {
        rateLimitMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      await new Promise((resolve, reject) => {
        verifyAuth(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const {response, situation, studentAge = 10} = req.body;

      // 입력 검증
      if (!response || !situation) {
        res.status(400).json({ error: "응답과 상황 정보가 필요합니다" });
        return;
      }

      // Callable Function과 동일한 로직 실행
      const model = getModel(0.3);
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

      let analysisResult;
      try {
        const cleanedResponse = responseText.replace(/```json|```/g, "").trim();
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        analysisResult = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        analysisResult = {
          scores: {empathy: 70, appropriate: 70, overall: 70},
          strengths: ["친구의 마음을 이해하려고 노력했어요", "따뜻한 마음이 느껴져요"],
          suggestions: ["더 구체적인 감정 표현을 해보세요", "친구의 상황을 한 번 더 확인해보세요"],
          betterExamples: ["그런 일이 있었구나. 정말 속상했겠다.", "많이 힘들었을 것 같아. 괜찮아?"],
        };
      }

      // 학습 데이터 저장 (비동기)
      admin.firestore().collection("empathyAnalysis").add({
        userId: req.user.uid,
        response,
        situation,
        analysis: analysisResult,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        modelVersion: "gemini-1.5-pro",
        source: "http",
      }).catch((error) => console.error("데이터 저장 오류:", error));

      res.json(analysisResult);
    } catch (error) {
      console.error("HTTP 공감 분석 오류:", error);
      res.status(500).json({ error: "분석 중 오류가 발생했습니다." });
    }
  });
});

// =============================================================================
// 유틸리티 함수들
// =============================================================================

async function updateUserSkills(userId, skill, points) {
  try {
    const userRef = admin.firestore().collection("users").doc(userId);
    await userRef.update({
      [`skills.${skill}`]: admin.firestore.FieldValue.increment(points),
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
      [`skillHistory.${Date.now()}`]: {
        skill,
        points,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("스킬 업데이트 오류:", error);
  }
}
