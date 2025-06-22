// functions/index.js - Gemini AI 기반 Firebase Functions (ABC 모델 최적화)
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
// ABC 모델 전용 AI 함수들 (최적화된 버전)
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

      const result = await generateABCStepGuide(step, userInput, scenario, studentAge);

      // 학습 데이터 저장 (AI를 사용한 단계만)
      if (step !== 'B') {
        admin.firestore().collection("abcAnalysis").add({
          userId: req.user.uid,
          step,
          userInput,
          scenario: scenario.id,
          analysis: result,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          modelVersion: step === 'B' ? 'self-reflection' : 'gemini-1.5-pro',
          source: "http",
        }).catch((error) => console.error("ABC 데이터 저장 오류:", error));
      }

      res.json(result);
    } catch (error) {
      console.error("ABC 분석 오류:", error);
      res.status(500).json({ error: "분석 중 오류가 발생했습니다." });
    }
  });
});

// ABC 단계별 가이드 생성 함수 (최적화된 버전)
async function generateABCStepGuide(step, userInput, scenario, studentAge) {
  switch (step) {
    case 'B':
      // ✅ AI 없이 자기 성찰 가이드만 제공
      return generateSelfReflectionGuide(userInput, scenario, studentAge);
    case 'B_prime':
      // ✅ AI가 새로운 관점 제시
      const model1 = getModel(0.7);
      return await generateNewBeliefGuide(model1, userInput, scenario, studentAge);
    case 'C_prime':
      // ✅ AI가 행동 계획 도움
      const model2 = getModel(0.7);
      return await generateActionPlanGuide(model2, userInput, scenario, studentAge);
    default:
      throw new Error(`지원하지 않는 단계입니다: ${step}`);
  }
}

// B 단계: AI 없이 자기 성찰 가이드 (새로 추가)
function generateSelfReflectionGuide(userInput, scenario, studentAge) {
  // AI 호출 없이 구조화된 가이드만 제공
  return {
    guidance: {
      selfCheck: {
        questions: [
          "이 생각이 정말 사실일까요?",
          "다른 사람이라면 어떻게 생각할까요?",
          "이 생각이 나에게 도움이 될까요?",
          "더 균형잡힌 생각은 무엇일까요?"
        ],
        thinkingPatterns: [
          "흑백사고: 좋거나 나쁘거나만 생각하기",
          "과잉일반화: 한 번 일어난 일이 계속 일어날 거라고 생각하기", 
          "파국화: 최악의 상황만 상상하기",
          "마음읽기: 다른 사람의 생각을 추측하기"
        ],
        encouragement: `${studentAge}세 친구도 이런 생각이 들 수 있어요. 중요한 건 이 생각이 나를 도와주는지 확인해보는 거예요.`
      },
      nextStepPrompt: "이제 이 생각을 다른 관점에서 바라보는 새로운 생각을 써보세요.",
      tips: [
        "완벽하지 않아도 괜찮아요",
        "조금씩 바뀌는 것도 큰 성장이에요",
        "친구에게 해줄 말을 나에게도 해보세요"
      ]
    },
    educationalContent: {
      ageAppropriate: true,
      selfDirected: true,
      noJudgment: true,
      aiAssisted: false
    }
  };
}

// B' 단계: 새로운 생각 가이드 (프롬프트 개선)
async function generateNewBeliefGuide(model, userInput, scenario, studentAge) {
  const prompt = `
당신은 ${studentAge}세 아이가 더 균형잡힌 사고를 할 수 있도록 도와주는 조력자입니다.
비판하지 말고, 더 도움이 되는 생각을 제안해주세요.

학생이 써본 새로운 생각: "${userInput}"

다음 JSON 형식으로 응답해주세요:
{
  "encouragement": "시도를 인정하고 격려하는 메시지",
  "alternativeThoughts": [
    "더 도움이 될 수 있는 생각1",
    "더 도움이 될 수 있는 생각2", 
    "더 도움이 될 수 있는 생각3"
  ],
  "cognitiveStrategy": {
    "name": "증거찾기|관점바꾸기|균형잡기|미래희망",
    "explanation": "이 방법이 왜 도움되는지 쉽게 설명",
    "practiceExample": "실제로 써볼 수 있는 예시"
  },
  "nextStepGuide": "이제 이 생각으로 어떤 행동을 할지 생각해볼 시간이에요!"
}

중요:
- 판단하지 말고 더 나은 대안 제시
- ${studentAge}세가 이해할 수 있는 언어
- 희망적이고 현실적인 관점 제공
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
      encouragement: "새로운 생각을 써보려고 노력한 것만으로도 훌륭해요!",
      alternativeThoughts: [
        "힘들지만 조금씩 나아질 수 있어",
        "완벽하지 않아도 최선을 다하는 것만으로 충분해",
        "도움을 요청하는 것도 용기 있는 행동이야"
      ],
      cognitiveStrategy: {
        name: "균형잡기",
        explanation: "어려운 면과 희망적인 면을 함께 보는 연습이에요",
        practiceExample: "시험이 어렵지만, 열심히 준비하면 내 실력을 보여줄 수 있어"
      },
      nextStepGuide: "정말 잘했어요! 이제 이 생각으로 어떤 행동을 할지 계획해볼까요?"
    };
  }
}

// C' 단계: 행동 계획 가이드 (프롬프트 개선)
async function generateActionPlanGuide(model, userInput, scenario, studentAge) {
  const prompt = `
${studentAge}세 아이가 세운 행동 계획을 더 구체적이고 실현가능하게 발전시켜주세요.

학생의 행동 계획: "${userInput}"

다음 JSON 형식으로 응답해주세요:
{
  "encouragement": "계획을 세운 것을 격려하는 메시지",
  "practicalSteps": [
    "실제로 할 수 있는 구체적 단계1",
    "단계2",
    "단계3"
  ],
  "successTips": {
    "preparation": "미리 준비할 것",
    "timing": "언제 하면 좋을지",
    "backup": "계획대로 안 되면 어떻게 할지"
  },
  "motivationBoost": {
    "whyItMatters": "이 행동이 왜 도움될지",
    "visualizeSuccess": "성공했을 때 어떤 기분일지",
    "smallStart": "아주 작게라도 시작하는 방법"
  },
  "support": "도움받을 수 있는 방법들"
}

중요:
- ${studentAge}세가 실제로 할 수 있는 현실적 방법
- 단계별로 구체적인 가이드
- 실패해도 괜찮다는 안전감 제공
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
      encouragement: "행동 계획을 세운 것이 정말 대단해요!",
      practicalSteps: [
        "마음의 준비를 하고",
        "좋은 기회를 찾아서",
        "용기내어 한 걸음씩 실행해보기"
      ],
      successTips: {
        preparation: "무슨 말을 할지 미리 한 번 생각해보기",
        timing: "마음이 편안하고 충분한 시간이 있을 때",
        backup: "잘 안 되어도 시도한 것만으로 성장한 거예요"
      },
      motivationBoost: {
        whyItMatters: "작은 행동도 큰 변화의 시작이 될 수 있어요",
        visualizeSuccess: "해낸 후에는 정말 뿌듯하고 자신감이 생길 거예요",
        smallStart: "한 번에 다 하려고 하지 말고, 오늘은 한 가지만 해봐요"
      },
      support: "가족이나 친구, 선생님께 응원받으세요"
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
- 학생이 스스로 B단계를 성찰한 것을 특별히 칭찬
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
          modelVersion: "optimized-abc-v1.0",
          source: "http",
        }).catch((error) => console.error("ABC 완료 데이터 저장 오류:", error));

        // 스킬 포인트 업데이트 (자기 성찰 보너스 추가)
        const basePoints = Math.round(summaryResult.summary.overall / 10);
        const selfReflectionBonus = 2; // B단계 자기 성찰 보너스
        const totalPoints = basePoints + selfReflectionBonus;
        
        updateUserSkills(req.user.uid, "cognitiveRestructuring", totalPoints).catch(console.error);

        res.json(summaryResult);
      } catch (parseError) {
        // 기본 응답
        res.json({
          summary: {
            cognitiveGrowth: 85,
            emotionalRegulation: 80,
            problemSolving: 82,
            overall: 82
          },
          highlights: {
            bestAspect: "스스로 부정적 생각을 인식하고 새로운 관점으로 생각하려고 노력한 점",
            improvementArea: "더 구체적인 행동 계획 세우기",
            keyLearning: "생각을 바꾸면 기분도 행동도 달라질 수 있다는 것을 스스로 깨달았어요"
          },
          personalizedAdvice: {
            strengthsToKeep: ["스스로 생각하는 능력", "긍정적으로 바꾸려는 의지"],
            skillsToImprove: ["더 다양한 관점에서 생각하기", "구체적인 계획 세우기"],
            nextChallenges: ["다른 시나리오에도 ABC 모델 적용해보기", "일상에서 실제로 실천해보기"]
          },
          motivationalMessage: "정말 훌륭하게 해냈어요! 특히 스스로 생각을 분석한 것이 대단해요. 이제 실제 상황에서도 이렇게 생각해볼 수 있을 거예요.",
          progressBadge: {
            name: "자기 성찰 탐험가",
            description: "스스로 생각을 돌아보고 새로운 관점을 찾았어요",
            icon: "🧠✨"
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
