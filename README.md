# 🌈 ABC 친구 도우미 - React + Firebase 버전

초등학생을 위한 AI 기반 또래 상담 도구입니다.

## 🚀 시작하기

### 1. 필수 요구사항

- Node.js 18.0 이상
- npm 또는 yarn
- Firebase CLI (`npm install -g firebase-tools`)
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

#### 3.4 OpenAI API 키 설정
```bash
# Functions 환경 변수 설정
firebase functions:config:set openai.key="your-openai-api-key"
```

### 4. 로컬 개발

```bash
# 개발 서버 시작
npm start

# Firebase 에뮬레이터 시작 (별도 터미널)
firebase emulators:start

# Functions만 테스트
cd functions
npm run serve
```

### 5. 배포

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
│   ├── pages/           # 페이지 컴포넌트
│   ├── services/        # Firebase, API 서비스
│   ├── utils/           # 유틸리티 함수
│   └── styles/          # 스타일 파일
├── functions/           # Cloud Functions
│   ├── ai/              # AI 관련 함수
│   └── safety/          # 안전 체크 함수
├── firebase.json        # Firebase 설정
├── firestore.rules      # Firestore 보안 규칙
└── package.json         # 프로젝트 의존성
```

## 🔧 주요 기능

### 1. 실전 상담 모드
- 4단계 상담 프로세스 (감정 인식 → 공감 표현 → 해결책 찾기 → 격려)
- 실시간 AI 피드백
- 상담 결과 저장 및 공유

### 2. 연습 모드
- AI 가상 친구와 상담 연습
- 다양한 성격의 가상 친구 (수줍은 친구, 활발한 친구 등)
- 실시간 상담 품질 평가

### 3. AI 도우미
- 공감 표현 자동 생성 및 평가
- 해결책 제안
- 안전성 체크 (위험 신호 감지)

### 4. 게이미피케이션
- 스킬 레벨 시스템
- 배지 및 업적
- 일일 상담 팁

## 🔐 보안 및 안전

- 모든 사용자 데이터는 암호화되어 저장
- 위험 키워드 자동 감지 및 알림
- 익명 로그인으로 개인정보 보호
- COPPA 준수 (13세 미만 아동 보호)

## 🛠️ 기술 스택

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Functions, Storage)
- **AI**: OpenAI GPT-3.5 Turbo
- **배포**: Firebase Hosting
- **모니터링**: Firebase Analytics

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

Made with ❤️ for helping young counselors