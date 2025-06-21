# 🤖 Gemini AI 설정 가이드

## 1. Google Cloud 프로젝트 설정

### 1.1 Google Cloud Console 접속
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. Firebase 프로젝트와 동일한 프로젝트 선택

### 1.2 Gemini API 활성화
```bash
# Google Cloud CLI 설치 후
gcloud services enable generativelanguage.googleapis.com
```

또는 Console에서:
1. API 및 서비스 > 라이브러리
2. "Generative Language API" 검색
3. 활성화 클릭

### 1.3 API 키 생성
1. API 및 서비스 > 사용자 인증 정보
2. "+ 사용자 인증 정보 만들기" > API 키
3. API 키 제한:
   - 애플리케이션 제한: HTTP 참조자
   - API 제한: Generative Language API만 선택

## 2. Firebase Functions 설정

### 2.1 Gemini API 키 설정
```bash
# Firebase Functions 환경 변수 설정
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"

# 설정 확인
firebase functions:config:get
```

### 2.2 로컬 개발 환경 설정
```bash
# .runtimeconfig.json 파일 생성 (functions 디렉토리)
cd functions
firebase functions:config:get > .runtimeconfig.json
```

### 2.3 .gitignore에 추가
```
functions/.runtimeconfig.json
```

## 3. 패키지 설치

### 3.1 Functions 디렉토리에서
```bash
cd functions
npm install @google/generative-ai
```

### 3.2 버전 확인
```json
// package.json
{
  "dependencies": {
    "@google/generative-ai": "^0.1.3"
  }
}
```

## 4. 무료 사용량 및 요금

### 4.1 Gemini Pro 무료 티어
- **무료 할당량**: 
  - 분당 60회 요청
  - 일일 1,500회 요청
  - 월간 30,000회 요청

### 4.2 요금 (무료 할당량 초과 시)
- **입력**: $0.00025 / 1K characters
- **출력**: $0.0005 / 1K characters
- GPT-3.5보다 약 60% 저렴

### 4.3 예상 비용 계산
```javascript
// 예시: 일일 100명 사용자, 각 10회 상담
// 총 요청: 1,000회/일 (무료 티어 내)
// 예상 월 비용: $0 (무료)

// 확장 시나리오: 일일 500명, 각 20회
// 총 요청: 10,000회/일
// 예상 월 비용: 약 $50-100
```

## 5. 안전 설정

### 5.1 콘텐츠 필터링
```javascript
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
```

### 5.2 아동 보호 강화
- 모든 프롬프트에 연령 적절성 명시
- 위험 키워드 사전 필터링
- 응답 후처리로 추가 검증

## 6. 성능 최적화

### 6.1 캐싱 전략
```javascript
// Firestore에 자주 사용되는 응답 캐시
const cacheKey = `empathy_${situation}_${emotion}`;
const cached = await getCachedResponse(cacheKey);

if (cached && isRecent(cached.timestamp)) {
  return cached.response;
}

// 새로운 응답 생성 및 캐시
const newResponse = await generateWithGemini(prompt);
await cacheResponse(cacheKey, newResponse);
```

### 6.2 배치 처리
```javascript
// 여러 요청을 모아서 처리
const batchPrompts = collectPrompts();
const responses = await Promise.all(
  batchPrompts.map(prompt => model.generateContent(prompt))
);
```

## 7. 모니터링 및 로깅

### 7.1 Cloud Logging 설정
```javascript
const { Logging } = require('@google-cloud/logging');
const logging = new Logging();
const log = logging.log('gemini-usage');

// 사용량 로깅
const metadata = {
  resource: { type: 'cloud_function' },
  severity: 'INFO',
};

const entry = log.entry(metadata, {
  userId: context.auth.uid,
  promptLength: prompt.length,
  responseLength: response.length,
  model: 'gemini-pro',
  timestamp: new Date(),
});

await log.write(entry);
```

### 7.2 비용 알림 설정
1. Cloud Console > 예산 및 알림
2. 새 예산 만들기
3. 월 $50 초과 시 이메일 알림

## 8. 테스트

### 8.1 로컬 테스트
```bash
# Firebase 에뮬레이터 시작
firebase emulators:start

# Functions 쉘
firebase functions:shell

# 함수 테스트
analyzeEmpathy({ response: "정말 속상했겠다", situation: "친구와 싸움" })
```

### 8.2 통합 테스트
```javascript
// test/gemini.test.js
const test = require('firebase-functions-test')();
const functions = require('../index');

describe('Gemini AI Functions', () => {
  it('should analyze empathy correctly', async () => {
    const wrapped = test.wrap(functions.analyzeEmpathy);
    const data = {
      response: '많이 힘들었겠구나',
      situation: '시험을 망쳤어'
    };
    
    const result = await wrapped(data, { auth: { uid: 'test123' } });
    expect(result.scores.empathy).toBeGreaterThan(70);
  });
});
```

## 9. 문제 해결

### 9.1 일반적인 오류

**오류: "API key not valid"**
```bash
# API 키 재설정
firebase functions:config:unset gemini
firebase functions:config:set gemini.key="NEW_KEY"
firebase deploy --only functions
```

**오류: "Rate limit exceeded"**
- 요청 속도 제한 구현
- 캐싱 강화
- 유료 플랜 고려

### 9.2 디버깅
```javascript
// 상세 로깅 활성화
const DEBUG = functions.config().app.debug === 'true';

if (DEBUG) {
  console.log('Prompt:', prompt);
  console.log('Response:', response);
}
```

## 10. 프로덕션 체크리스트

- [ ] API 키 보안 설정 완료
- [ ] 안전 필터 설정 완료
- [ ] 비용 알림 설정 완료
- [ ] 캐싱 구현 완료
- [ ] 에러 처리 구현 완료
- [ ] 로깅 설정 완료
- [ ] 백업 계획 수립 (API 장애 시)
- [ ] 사용량 모니터링 대시보드 구성

## 🎯 다음 단계

1. **MVP 테스트**: 소규모 사용자 그룹으로 시작
2. **피드백 수집**: AI 응답 품질 평가
3. **파인튜닝**: 프롬프트 최적화
4. **확장**: 필요시 Vertex AI로 마이그레이션

---

문의사항이 있으시면 GitHub Issues에 남겨주세요!