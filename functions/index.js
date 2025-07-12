// functions/index.js - 최소화된 AI 평가 함수
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {GoogleGenerativeAI, HarmCategory, HarmBlockThreshold} = require("@google/generative-ai");
const cors = require("cors");

// Firebase Admin 초기화
admin.initializeApp();

// CORS 설정 - Firebase Hosting만 허용
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5000",
    /^https:\/\/.*\.web\.app$/,
    /^https:\/\/.*\.firebaseapp\.com$/
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const corsMiddleware = cors(corsOptions);

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

// 간단한 일일 사용량 제한 체크
const checkDailyLimit = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  const docRef = admin.firestore().collection('usage').doc(`${userId}_${today}`);
  
  const doc = await docRef.get();
  const current = doc.exists ? doc.data().count : 0;
  
  if (current >= 5) { // 일일 5회 제한
    return { exceeded: true, count: current };
  }
  
  await docRef.set({ count: current + 1, lastUsed: new Date() });
  return { exceeded: false, count: current + 1 };
};

// ABC 평가 함수 (최소화)
exports.evaluateABC = functions.https.onRequest(async (req, res) => {
  corsMiddleware(req, res, async () => {
    try {
      // POST 요청만 허용
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // 인증 확인
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "인증이 필요합니다." });
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      // 일일 제한 확인
      const limit = await checkDailyLimit(userId);
      if (limit.exceeded) {
        return res.status(429).json({ 
          error: "오늘의 평가 횟수(5회)를 모두 사용했습니다. 내일 다시 시도해주세요.",
          remainingCount: 0
        });
      }

      const { affect, behavior, cognition, scenario } = req.body;

      // 입력 검증
      if (!affect || !behavior || !cognition) {
        return res.status(400).json({ error: "모든 ABC 항목을 입력해주세요." });
      }

      // Gemini 모델 설정
      const model = genAI.getGenerativeModel({
        model: "gemini-pro",
        safetySettings,
        generationConfig: {
          temperature: 0.3, // 일관성 있는 평가를 위해 낮은 온도
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512, // 비용 절감을 위해 출력 제한
        },
      });

      // 간단한 평가 프롬프트
      const prompt = `초등학생의 ABC 공감 표현을 평가해주세요.

상황: ${scenario || "친구가 어려움을 겪고 있습니다."}

학생의 답변:
A (감정 인식): ${affect}
B (공감 행동): ${behavior}
C (격려/인지): ${cognition}

다음 형식으로만 답변해주세요:
{
  "totalScore": 점수(1-10),
  "scores": {
    "affect": A점수(1-10),
    "behavior": B점수(1-10), 
    "cognition": C점수(1-10)
  },
  "feedback": "전체적인 평가 한 문장",
  "improvements": ["개선점 1", "개선점 2"]
}`;

      // AI 평가 요청
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // JSON 파싱
      let evaluation;
      try {
        // JSON 블록 추출
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        evaluation = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error("JSON 파싱 오류:", parseError);
        // 기본 응답
        evaluation = {
          totalScore: 7,
          scores: { affect: 7, behavior: 7, cognition: 7 },
          feedback: "공감 표현이 적절합니다. 계속 연습해보세요.",
          improvements: ["감정을 더 구체적으로 표현해보세요.", "친구의 입장에서 더 생각해보세요."]
        };
      }

      // 평가 기록 저장
      await admin.firestore().collection('evaluations').add({
        userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        abcResponses: { affect, behavior, cognition },
        evaluation,
        remainingCount: 5 - limit.count
      });

      // 응답
      res.status(200).json({
        success: true,
        evaluation,
        remainingCount: 5 - limit.count,
        message: `오늘 남은 평가 횟수: ${5 - limit.count}회`
      });

    } catch (error) {
      console.error("평가 오류:", error);
      res.status(500).json({ 
        error: "평가 중 오류가 발생했습니다.", 
        details: error.message 
      });
    }
  });
});

// 사용량 조회 함수
exports.getUsageStatus = functions.https.onRequest(async (req, res) => {
  corsMiddleware(req, res, async () => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "인증이 필요합니다." });
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      const today = new Date().toISOString().split('T')[0];
      const docRef = admin.firestore().collection('usage').doc(`${userId}_${today}`);
      const doc = await docRef.get();
      
      const count = doc.exists ? doc.data().count : 0;
      
      res.status(200).json({
        dailyLimit: 5,
        usedCount: count,
        remainingCount: Math.max(0, 5 - count),
        date: today
      });

    } catch (error) {
      console.error("사용량 조회 오류:", error);
      res.status(500).json({ error: "사용량 조회 중 오류가 발생했습니다." });
    }
  });
});