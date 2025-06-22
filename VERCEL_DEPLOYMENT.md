# 🚀 Vercel 프론트엔드 + Firebase 백엔드 배포 가이드

이 가이드는 ABC 친구 도우미 프로젝트를 Vercel(프론트엔드)과 Firebase(백엔드)로 분리 배포하는 방법을 설명합니다.

## 📋 배포 아키텍처

```
┌─────────────────┐     HTTP API     ┌─────────────────┐
│   Vercel        │ ←─────────────→  │   Firebase      │
│   (Frontend)    │                  │   (Backend)     │
│                 │                  │                 │
│ ✓ React App     │                  │ ✓ Functions     │
│ ✓ Static Files  │                  │ ✓ Firestore     │
│ ✓ CDN           │                  │ ✓ Auth          │
│ ✓ Auto Deploy  │                  │ ✓ Storage       │
└─────────────────┘                  └─────────────────┘
```

## 🎯 장점

### Vercel 프론트엔드
- ⚡ 글로벌 CDN으로 빠른 로딩
- 🔄 Git push 시 자동 배포
- 🌍 브랜치별 프리뷰 환경
- 📊 성능 분석 및 최적화

### Firebase 백엔드
- 🤖 Gemini AI 안전한 통합
- 🔐 서버사이드 API 키 관리
- 📈 자동 스케일링
- 🛡️ 내장 보안 기능

## 📋 사전 준비사항

### 필수 도구
- Node.js 18.0 이상
- npm 또는 yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Vercel CLI (`npm install -g vercel`)
- Git

### 필수 계정
- Firebase 프로젝트
- Vercel 계정
- Google Cloud (Gemini API)

## 🔧 1단계: Firebase 백엔드 배포

### 1-1. Gemini API 키 설정
```bash
# Gemini API 키 설정
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"

# 설정 확인
firebase functions:config:get
```

### 1-2. Functions 배포
```bash
# Functions 디렉토리로 이동
cd functions

# 의존성 설치 (이미 cors 패키지 포함됨)
npm install

# Firebase에 배포
firebase deploy --only functions

# 특정 함수만 배포 (선택사항)
firebase deploy --only functions:analyzeEmpathyHTTP,functions:generateEmpathyHTTP
```

### 1-3. Functions URL 확인
배포 완료 후 다음과 같은 URL들이 생성됩니다:
```
✓ functions[analyzeEmpathyHTTP]: https://us-central1-your-project.cloudfunctions.net/analyzeEmpathyHTTP
✓ functions[generateEmpathyHTTP]: https://us-central1-your-project.cloudfunctions.net/generateEmpathyHTTP
✓ functions[generateSolutionsHTTP]: https://us-central1-your-project.cloudfunctions.net/generateSolutionsHTTP
✓ functions[checkSafetyHTTP]: https://us-central1-your-project.cloudfunctions.net/checkSafetyHTTP
✓ functions[checkConfigurationHTTP]: https://us-central1-your-project.cloudfunctions.net/checkConfigurationHTTP
```

**중요**: 베이스 URL `https://us-central1-your-project.cloudfunctions.net`를 기록해두세요.

## 🌐 2단계: Vercel 프론트엔드 배포

### 2-1. Vercel CLI 설정
```bash
# Vercel 설치 및 로그인
npm install -g vercel
vercel login
```

### 2-2. 프로젝트 초기 설정
```bash
# 프로젝트 루트에서
vercel

# 질문 응답:
# ? Set up and deploy "~/abc-friend-helper"? [Y/n] y
# ? Which scope do you want to deploy to? [Your Name]
# ? Link to existing project? [y/N] n
# ? What's your project's name? abc-friend-helper
# ? In which directory is your code located? ./
```

### 2-3. 환경변수 설정

#### 방법 1: Vercel CLI로 설정
```bash
# Firebase 설정
vercel env add REACT_APP_FIREBASE_API_KEY
vercel env add REACT_APP_FIREBASE_AUTH_DOMAIN
vercel env add REACT_APP_FIREBASE_PROJECT_ID
vercel env add REACT_APP_FIREBASE_STORAGE_BUCKET
vercel env add REACT_APP_FIREBASE_MESSAGING_SENDER_ID
vercel env add REACT_APP_FIREBASE_APP_ID

# Functions URL (1단계에서 확인한 베이스 URL)
vercel env add REACT_APP_FIREBASE_FUNCTIONS_URL

# 환경 구분
vercel env add REACT_APP_ENVIRONMENT production
```

#### 방법 2: Vercel 대시보드에서 설정
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택 > Settings > Environment Variables
3. 각 환경변수를 Production, Preview, Development에 설정

### 2-4. 프로덕션 배포
```bash
# 프로덕션 배포
vercel --prod

# 또는 package.json 스크립트 사용
npm run deploy:frontend
```

## 🔗 3단계: CORS 설정 업데이트

배포 완료 후 실제 Vercel 도메인을 Firebase Functions CORS 설정에 추가해야 합니다.

### 3-1. Vercel 도메인 확인
배포 완료 후 다음과 같은 URL을 받게 됩니다:
- Production: `https://abc-friend-helper.vercel.app`
- Preview: `https://abc-friend-helper-git-branch.vercel.app`

### 3-2. Functions CORS 설정 업데이트
`functions/index.js` 파일의 CORS 설정을 실제 도메인으로 업데이트:

```javascript
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://localhost:3000",
    /^https:\/\/.*\.vercel\.app$/,
    "https://abc-friend-helper.vercel.app",  // 실제 도메인으로 변경
    "https://your-custom-domain.com",        // 커스텀 도메인 있다면 추가
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
```

### 3-3. Functions 재배포
```bash
firebase deploy --only functions
```

## 🧪 4단계: 배포 테스트

### 4-1. 기본 기능 테스트
1. Vercel 배포 URL 접속
2. 회원가입/로그인 테스트
3. AI 공감 분석 기능 테스트
4. Firebase 데이터 저장 확인

### 4-2. API 통신 테스트
브라우저 개발자 도구에서 Network 탭을 확인하여:
- ✅ HTTP Functions 호출 성공 (200 응답)
- ✅ CORS 에러 없음
- ✅ 인증 토큰 전송 확인

### 4-3. 에러 모니터링
- Vercel 대시보드: 프론트엔드 에러 확인
- Firebase Console: Functions 로그 확인

## 🔄 5단계: 자동 배포 설정

### 5-1. GitHub Actions (선택사항)
`.github/workflows/deploy.yml` 파일 생성:

```yaml
name: Deploy to Vercel and Firebase
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Deploy to Firebase
        run: |
          npm install -g firebase-tools
          firebase deploy --only functions --token ${{ secrets.FIREBASE_TOKEN }}
          
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

### 5-2. Vercel Git 통합
1. Vercel 대시보드에서 GitHub 연결
2. 자동 배포 활성화
3. 브랜치별 환경 설정

## 📊 6단계: 모니터링 및 최적화

### 6-1. 성능 모니터링
- **Vercel Analytics**: 페이지 로딩 속도, Core Web Vitals
- **Firebase Performance**: 백엔드 응답 시간
- **Firebase Analytics**: 사용자 행동 분석

### 6-2. 비용 모니터링
- **Vercel**: 대역폭 및 빌드 시간
- **Firebase**: Functions 호출 수, Firestore 읽기/쓰기
- **Google Cloud**: Gemini API 사용량

### 6-3. 최적화 팁
- **이미지 최적화**: Vercel의 자동 이미지 최적화 활용
- **캐싱 전략**: 정적 자산 캐싱 설정
- **Functions 최적화**: Cold start 최소화

## 🛠️ 개발 워크플로우

### 로컬 개발
```bash
# Firebase 에뮬레이터 시작
firebase emulators:start

# React 개발 서버 시작 (별도 터미널)
npm start
```

### 프리뷰 배포
```bash
# 브랜치별 프리뷰
git checkout -b feature/new-feature
git push origin feature/new-feature
# Vercel이 자동으로 프리뷰 URL 생성
```

### 프로덕션 배포
```bash
# 통합 배포 스크립트
npm run deploy

# 개별 배포
npm run deploy:backend  # Firebase Functions
npm run deploy:frontend # Vercel
```

## 🚨 문제 해결

### CORS 에러
```javascript
// 에러: Access to fetch at 'functions-url' from origin 'vercel-url' has been blocked by CORS policy

// 해결: functions/index.js에서 origin 확인
const corsOptions = {
  origin: [
    "https://your-actual-vercel-domain.vercel.app"  // 실제 도메인 추가
  ]
};
```

### 환경변수 문제
```bash
# 에러: Cannot read property 'REACT_APP_FIREBASE_API_KEY' of undefined

# 해결: Vercel 환경변수 확인
vercel env ls
vercel env add REACT_APP_FIREBASE_API_KEY
```

### Functions 호출 실패
```javascript
// 에러: 401 Unauthorized

// 해결: 인증 토큰 확인
import { getAuth } from 'firebase/auth';
const auth = getAuth();
const token = await auth.currentUser.getIdToken();
```

## 📞 지원 및 문의

- **Issues**: GitHub Issues로 버그 신고
- **Discussions**: 사용법 문의 및 아이디어 공유
- **Email**: yeohanki@naver.com

## 📝 참고 자료

- [Vercel 배포 가이드](https://vercel.com/docs)
- [Firebase Functions 문서](https://firebase.google.com/docs/functions)
- [CORS 설정 가이드](https://firebase.google.com/docs/functions/http-events#cors)
- [Gemini API 문서](https://ai.google.dev/docs)

---

Happy Deploying! 🎉