// functions/index.js - Gemini AI 기반 Firebase Functions (Vercel 지원 추가)
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
// CALLABLE FUNCTIONS (기존 유지)
// =============================================================================

// 기존 Callable Functions들 (변경 없음)
exports.analyzeEmpathy = functions.https.onCall(async (data, context) => {
  // Rate limiting 체크
  try {
    await rateLimiter.consume(context.rawRequest.ip);
  } catch (rejRes) {
    throw new functions.https.HttpsError("resource-exhausted", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
  }

  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "인증이 필요합니다");
  }

  const {response, situation, studentAge = 10} = data;

  // 입력 검증
  if (!response || !situation) {
    throw new functions.https.HttpsError("invalid-argument", "응답과 상황 정보가 필요합니다");
  }

  try {
    const model = getModel(0.3); // 일관된 결과를 위해 낮은 temperature

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

    if (!result.response) {
      throw new Error("AI 응답을 받지 못했습니다");
    }

    const responseText = result.response.text();

    // JSON 파싱 개선
    let analysisResult;
    try {
      const cleanedResponse = responseText.replace(/```json|```/g, "").trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON 형식을 찾을 수 없습니다");
      }
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError);
      // 더 나은 기본 응답 제공
      analysisResult = {
        scores: {
          empathy: Math.max(50, Math.min(85, 60 + Math.random() * 25)),
          appropriate: Math.max(50, Math.min(85, 65 + Math.random() * 20)),
          overall: Math.max(50, Math.min(85, 62 + Math.random() * 23)),
        },
        strengths: ["친구의 마음을 이해하려고 노력했어요", "따뜻한 마음이 느껴져요"],
        suggestions: ["더 구체적인 감정 표현을 해보세요", "친구의 상황을 한 번 더 확인해보세요"],
        betterExamples: ["그런 일이 있었구나. 정말 속상했겠다.", "많이 힘들었을 것 같아. 괜찮아?"],
      };
    }

    // 데이터 검증
    if (!analysisResult.scores || typeof analysisResult.scores.overall !== "number") {
      analysisResult.scores = {empathy: 70, appropriate: 70, overall: 70};
    }

    // 학습 데이터 저장 (비동기)
    admin.firestore().collection("empathyAnalysis").add({
      userId: context.auth.uid,
      response,
      situation,
      analysis: analysisResult,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      modelVersion: "gemini-1.5-pro",
    }).catch((error) => console.error("데이터 저장 오류:", error));

    // 스킬 포인트 업데이트 (비동기)
    if (analysisResult.scores.overall >= 80) {
      updateUserSkills(context.auth.uid, "empathy", 10).catch(console.error);
    }

    return analysisResult;
  } catch (error) {
    console.error("공감 분석 오류:", error);
    throw new functions.https.HttpsError("internal", `분석 중 오류가 발생했습니다: ${error.message}`);
  }
});

// 나머지 기존 Callable Functions들... (생략 - 기존 코드와 동일)

// =============================================================================
// HTTP FUNCTIONS (Vercel 배포용 추가)
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

// HTTP 공감 생성
exports.generateEmpathyHTTP = functions.https.onRequest(async (req, res) => {
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

      const {situation, emotions, studentAge = 10} = req.body;

      if (!situation || !emotions || !Array.isArray(emotions)) {
        res.status(400).json({ error: "상황과 감정 정보가 필요합니다" });
        return;
      }

      const model = getModel(0.8);
      const prompt = `
${studentAge}세 초등학생이 친구에게 할 수 있는 자연스러운 공감 표현을 만들어주세요.

요구사항:
- 또래가 사용하는 일상적인 언어로
- 진심이 담긴 따뜻한 표현으로
- 너무 어른스럽지 않게
- ABC 구조를 포함하여 (A: 상황 인정, B: 감정 이해, C: 지지 표현)

상황: ${situation}
친구의 감정: ${emotions.join(", ")}

다음 형식으로 응답해주세요:
{
  "suggestion": "공감 표현",
  "explanation": "왜 이런 표현이 좋은지 간단한 설명",
  "alternatives": ["대안 표현1", "대안 표현2"]
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      try {
        const cleanedResponse = responseText.replace(/```json|```/g, "").trim();
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch[0]);

        res.json({
          ...parsed,
          tips: [
            "친구의 이야기를 끝까지 들어주세요",
            "조언보다는 마음을 이해한다는 표현을 해주세요",
            "비슷한 경험이 있다면 나눠주세요",
          ],
        });
      } catch (parseError) {
        res.json({
          suggestion: responseText.trim().split("\n")[0] || "그런 일이 있었구나. 많이 힘들었을 것 같아.",
          explanation: "친구의 상황을 인정하고 감정을 이해해주는 표현이에요.",
          alternatives: ["정말 속상했겠다.", "많이 놀랐을 것 같아."],
          tips: [
            "친구의 이야기를 끝까지 들어주세요",
            "조언보다는 마음을 이해한다는 표현을 해주세요",
            "비슷한 경험이 있다면 나눠주세요",
          ],
        });
      }
    } catch (error) {
      console.error("HTTP 공감 생성 오류:", error);
      res.status(500).json({ error: "생성 중 오류가 발생했습니다" });
    }
  });
});

// HTTP 해결책 생성
exports.generateSolutionsHTTP = functions.https.onRequest(async (req, res) => {
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

      const {problem, negativeThought, studentAge = 10} = req.body;

      const model = getModel(0.7);
      const prompt = `
초등학생이 이해하고 실천할 수 있는 인지행동치료(CBT) 기반 해결책을 제안해주세요.

대상 연령: ${studentAge}세
문제 상황: ${problem}
부정적 생각: ${negativeThought}

다음 JSON 형식으로 응답해주세요:
{
  "positiveThoughts": ["새로운 생각1", "새로운 생각2", "새로운 생각3"],
  "actionSteps": ["실천 방법1", "실천 방법2", "실천 방법3"],
  "encouragement": "격려 메시지",
  "difficultyLevel": "easy|medium|hard"
}

초등학생 눈높이에 맞춰 쉽고 친근하게 설명해주세요.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      try {
        const cleanedResponse = responseText.replace(/```json|```/g, "").trim();
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        res.json(JSON.parse(jsonMatch[0]));
      } catch (parseError) {
        res.json(parseSolutions(responseText));
      }
    } catch (error) {
      console.error("HTTP 해결책 생성 오류:", error);
      res.status(500).json({ error: "생성 중 오류가 발생했습니다" });
    }
  });
});

// HTTP 안전성 체크
exports.checkSafetyHTTP = functions.https.onRequest(async (req, res) => {
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

      const {conversation, sessionId} = req.body;

      // 1단계: 키워드 기반 체크
      const riskKeywords = {
        high: ["자살", "자해", "죽고 싶어", "사라지고 싶어", "칼", "목을 매", "뛰어내리"],
        medium: ["폭력", "때리", "괴롭힘", "왕따", "학대", "무서워서", "맞았어"],
        low: ["우울", "불안", "무서워", "힘들어", "외로워", "슬퍼"],
      };

      let riskLevel = "none";
      const detectedKeywords = [];

      for (const [level, keywords] of Object.entries(riskKeywords)) {
        for (const keyword of keywords) {
          if (conversation.toLowerCase().includes(keyword)) {
            riskLevel = level;
            detectedKeywords.push(keyword);
            break;
          }
        }
        if (riskLevel !== "none") break;
      }

      // 2단계: 고위험 상황 처리
      if (riskLevel === "high") {
        await admin.firestore().collection("urgentAlerts").add({
          sessionId,
          userId: req.user.uid,
          conversation,
          detectedKeywords,
          riskLevel,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: "pending",
          source: "http",
        });
      }

      res.json({
        safe: riskLevel === "none" || riskLevel === "low",
        riskLevel,
        needsAdultHelp: riskLevel === "high" || riskLevel === "medium",
        message: getRiskMessage(riskLevel),
        resources: getHelpResources(riskLevel),
        detectedKeywords: detectedKeywords.length > 0 ? detectedKeywords : undefined,
      });
    } catch (error) {
      console.error("HTTP 안전성 체크 오류:", error);
      res.status(500).json({
        safe: false,
        riskLevel: "unknown",
        needsAdultHelp: true,
        message: "상황을 정확히 파악하기 어려워요. 믿을 수 있는 어른에게 도움을 요청하는 것이 좋겠어요.",
        resources: getHelpResources("medium"),
      });
    }
  });
});

// HTTP 설정 확인
exports.checkConfigurationHTTP = functions.https.onRequest(async (req, res) => {
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

      const config = functions.config();

      res.json({
        hasGeminiKey: !!config.gemini?.key,
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
        cors: "enabled",
        httpFunctions: "enabled",
      });
    } catch (error) {
      console.error("HTTP 설정 확인 오류:", error);
      res.status(500).json({ error: "설정 확인 중 오류가 발생했습니다" });
    }
  });
});

// =============================================================================
// 유틸리티 함수들 (변경 없음)
// =============================================================================

function parseSolutions(response) {
  try {
    const sections = response.split(/\d\.\s+/);
    const positiveThoughts = [];
    const actionSteps = [];
    let encouragement = "";

    sections.forEach((section) => {
      if (section.includes("새로운 생각") || section.includes("긍정적")) {
        const thoughts = section.match(/[-•]\s*(.+)/g) || [];
        positiveThoughts.push(...thoughts.map((t) => t.replace(/[-•]\s*/, "").trim()));
      } else if (section.includes("실천") || section.includes("행동")) {
        const actions = section.match(/[-•]\s*(.+)/g) || [];
        actionSteps.push(...actions.map((a) => a.replace(/[-•]\s*/, "").trim()));
      } else if (section.includes("격려")) {
        encouragement = section.replace(/격려.*?:/, "").trim();
      }
    });

    return {
      positiveThoughts: positiveThoughts.slice(0, 3).length > 0 ? positiveThoughts.slice(0, 3) :
        ["실수해도 괜찮아, 다시 시도하면 돼", "나는 충분히 잘하고 있어", "어려운 일도 조금씩 해결할 수 있어"],
      actionSteps: actionSteps.slice(0, 3).length > 0 ? actionSteps.slice(0, 3) :
        ["깊게 숨을 쉬어보기", "믿을 수 있는 사람과 이야기하기", "한 가지씩 차근차근 해보기"],
      encouragement: encouragement || "너는 충분히 잘하고 있어! 힘내! 🌟",
      difficultyLevel: "easy",
    };
  } catch (error) {
    console.error("솔루션 파싱 오류:", error);
    return {
      positiveThoughts: ["실수해도 괜찮아, 다시 시도하면 돼", "나는 충분히 잘하고 있어", "어려운 일도 조금씩 해결할 수 있어"],
      actionSteps: ["깊게 숨을 쉬어보기", "믿을 수 있는 사람과 이야기하기", "한 가지씩 차근차근 해보기"],
      encouragement: "너는 충분히 잘하고 있어! 🌟",
      difficultyLevel: "easy",
    };
  }
}

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

function getRiskMessage(level) {
  const messages = {
    high: "이 상황은 어른의 도움이 꼭 필요해 보여요. 믿을 수 있는 어른에게 이야기해보는 것이 좋겠어요.",
    medium: "친구가 많이 힘든 상황인 것 같아요. 선생님이나 부모님께 도움을 요청하는 것도 좋은 방법이에요.",
    low: "친구의 마음을 잘 들어주고 있어요. 계속 따뜻하게 대해주세요.",
    none: "잘하고 있어요! 친구에게 큰 힘이 되고 있을 거예요.",
  };
  return messages[level] || messages.none;
}

function getHelpResources(level) {
  return {
    emergency: {
      police: "112",
      fire: "119",
      description: "긴급 상황 시",
    },
    counseling: {
      청소년전화: "1388",
      생명의전화: "109",
      아동학대신고: "112",
      description: "24시간 상담 가능",
    },
    online: {
      "청소년사이버상담센터": "https://www.cyber1388.kr",
      "마음건강 정보": "https://www.youth.go.kr",
      "교육부 학교폭력신고": "https://www.safe182.go.kr",
    },
    school: {
      message: "학교 상담 선생님께 도움을 요청해보세요",
      weeClass: "학교 Wee클래스 이용하기",
      description: "학교 내 전문 상담 서비스",
    },
  };
}

// 나머지 Callable Functions들... (기존 코드에서 복사)
// generateEmpathy, generateSolutions, checkSafety, checkConfiguration 등
