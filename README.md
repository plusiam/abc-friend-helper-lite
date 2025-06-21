# 🌈 ABC 친구 도우미 - Gemini AI 기반 또래 상담 교육 플랫폼

초등학생을 위한 Google Gemini AI 기반 또래 상담 도구입니다. 공감, 경청, 문제해결 능력을 게임처럼 재미있게 배울 수 있습니다.

## ✨ 주요 특징

- 🤖 **Google Gemini AI 통합**: 안전하고 교육적인 AI 피드백
- 🎯 **4단계 상담 프로세스**: 체계적인 상담 교육
- 🎮 **게이미피케이션**: 스킬 포인트, 배지, 레벨업 시스템
- 🛡️ **아동 안전 보호**: 위험 신호 자동 감지 및 대응
- 📱 **반응형 디자인**: 모바일, 태블릿, PC 모두 지원

## 🚀 시작하기

### 1. 필수 요구사항

- Node.js 18.0 이상
- npm 또는 yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud 계정 (Gemini API 사용)
- Git

### 2. 프로젝트 설정

```bash
# 1. 저장소 클론
git clone https://github.com/plusiam/abc-friend-helper.git
cd abc-friend-helper

# 2. 의존성 설치
npm install

# 3. Functions 의존성 설치
cd functions
npm install
cd ..

# 4. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 Firebase 설정 정보 입력
```

### 3. Firebase 프로젝트 설정

#### 3.1 Firebase Console에서 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: abc-friend-helper)
4. Google Analytics 활성화 (선택사항)

#### 3.2 Firebase 서비스 활성화
Firebase Console에서 다음 서비스들을 활성화:
- Authentication (익명 로그인 활성화)
- Firestore Database
- Storage
- Functions (Blaze 요금제 필요)
- Hosting

#### 3.3 Firebase 설정 파일 가져오기
1. 프로젝트 설정 > 일반
2. "내 앱" 섹션에서 웹 앱 추가
3. Firebase SDK 구성 복사
4. `.env` 파일에 붙여넣기

### 4. Gemini AI 설정

#### 4.1 Google Cloud에서 API 키 생성
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. Firebase 프로젝트와 같은 프로젝트 선택
3. API 및 서비스 > 라이브러리 > "Generative Language API" 활성화
4. API 및 서비스 > 사용자 인증 정보 > API 키 생성

#### 4.2 Firebase Functions에 API 키 설정
```bash
# Gemini API 키 설정
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"

# 설정 확인
firebase functions:config:get
```

#### 4.3 로컬 개발용 환경 설정
```bash
# .runtimeconfig.json 생성 (functions 디렉토리)
cd functions
firebase functions:config:get > .runtimeconfig.json
cd ..
```

### 5. 로컬 개발

```bash
# 개발 서버 시작
npm start

# Firebase 에뮬레이터 시작 (별도 터미널)
firebase emulators:start

# Functions만 테스트
cd functions
npm run serve
```

### 6. 배포

```bash
# 빌드
npm run build

# Firebase에 배포
firebase deploy

# 특정 서비스만 배포
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## 📁 프로젝트 구조

```
abc-friend-helper/
├── public/              # 정적 파일
├── src/
│   ├── components/      # React 컴포넌트
│   │   ├── common/      # 공통 컴포넌트
│   │   ├── counseling/  # 상담 관련 컴포넌트
│   │   ├── practice/    # 연습 모드 컴포넌트
│   │   └── ai/          # AI 도우미 컴포넌트
│   ├── contexts/        # React Context
│   ├── hooks/           # 커스텀 훅
│   │   └── useAI.js     # Gemini AI 훅
│   ├── pages/           # 페이지 컴포넌트
│   ├── services/        # Firebase, API 서비스
│   │   └── gemini-config.js # Gemini 설정
│   ├── utils/           # 유틸리티 함수
│   │   └── gemini-helpers.js # Gemini 헬퍼
│   └── styles/          # 스타일 파일
├── functions/           # Cloud Functions
│   ├── index.js         # Gemini AI 통합 함수들
│   └── package.json     # Gemini AI 의존성
├── firebase.json        # Firebase 설정
├── firestore.rules      # Firestore 보안 규칙
├── GEMINI_SETUP.md      # 상세 설정 가이드
└── package.json         # 프로젝트 의존성
```

## 🔧 주요 기능

### 1. 실전 상담 모드
- **4단계 상담 프로세스**: 감정 인식 → 공감 표현 → 해결책 찾기 → 격려
- **AI 공감 분석**: Gemini AI가 공감 표현의 진정성과 적절성 평가
- **실시간 피드백**: 상담 진행 중 즉시 개선점 제안
- **상담 결과 저장**: 학습 진도와 성장 기록 추적

### 2. 연습 모드
- **가상 친구 시뮬레이션**: 다양한 성격의 AI 친구들과 상담 연습
  - 수줍음 많은 친구
  - 활발하고 말 많은 친구
  - 감정이 풍부한 친구
- **실시간 품질 평가**: 상담 기법의 효과성 즉시 측정
- **맞춤형 힌트**: 상황에 맞는 상담 팁 제공

### 3. AI 도우미 시스템
- **공감 표현 생성**: 상황에 맞는 공감 문장 자동 생성
- **해결책 제안**: CBT 기반 문제해결 방법 제시
- **안전성 체크**: 위험 신호 자동 감지 및 어른 도움 안내
- **격려 메시지**: 상황별 맞춤 격려 문구 생성

### 4. 게이미피케이션
- **스킬 포인트 시스템**: 공감, 경청, 문제해결 능력별 점수
- **배지 시스템**: 다양한 상담 업적 달성 시 배지 부여
- **레벨업 시스템**: 경험치 누적으로 상담사 레벨 향상
- **일일 팁**: 매일 새로운 상담 기법 학습

### 5. 안전 보호 시스템
- **키워드 감지**: 자해, 폭력 등 위험 신호 실시간 모니터링
- **AI 심층 분석**: Gemini AI를 통한 대화 내용 위험도 평가
- **즉시 알림**: 고위험 상황 시 관리자 및 보호자 알림
- **도움 자원 안내**: 청소년 상담 전화, 학교 상담실 정보 제공

## 🤖 Gemini AI 활용

### 교육적 AI 응답
- 초등학생 수준에 맞는 언어로 피드백 제공
- 발달 단계를 고려한 상담 기법 교육
- 안전하고 건전한 내용만 생성

### 실시간 분석
- 공감 표현의 진정성 평가
- 상담 기법의 적절성 분석
- 개선점과 강점 동시 피드백

### 안전성 우선
- 강화된 콘텐츠 필터링
- 아동 보호 정책 준수
- 부적절한 내용 차단

## 🔐 보안 및 안전

- **데이터 암호화**: 모든 사용자 데이터 암호화 저장
- **익명 로그인**: 개인정보 없이 안전한 이용
- **COPPA 준수**: 13세 미만 아동 보호법 준수
- **실시간 모니터링**: 위험 상황 자동 감지
- **부모/교사 대시보드**: 학습 진도 모니터링 (선택사항)

## 💰 비용 정보

### Gemini AI 무료 티어
- **월간 30,000회 요청 무료**
- **일일 1,500회 요청 무료**
- **분당 60회 요청 무료**

### 예상 운영 비용
- 소규모 학급(30명): **무료**
- 중규모 학교(300명): **월 $10-30**
- 대규모 활용(1000명): **월 $50-100**

## 🛠️ 기술 스택

- **Frontend**: React 18, JavaScript, Tailwind CSS, Framer Motion
- **Backend**: Firebase (Auth, Firestore, Functions, Storage)
- **AI**: Google Gemini Pro API
- **배포**: Firebase Hosting
- **모니터링**: Firebase Analytics, Cloud Logging

## 📚 추가 문서

- [Gemini AI 설정 가이드](GEMINI_SETUP.md)
- [API 문서](functions/README.md)
- [배포 가이드](docs/DEPLOYMENT.md)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원 및 문의

- **Issues**: GitHub Issues를 통한 버그 신고 및 기능 요청
- **Discussions**: 사용법 문의 및 아이디어 공유
- **Email**: yeohanki@naver.com

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

Made with ❤️ for young counselors learning empathy and problem-solving skills