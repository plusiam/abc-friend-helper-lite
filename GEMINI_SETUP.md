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

```bash
cd functions
npm install @google/generative-ai
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

## 5. 테스트

```bash
# Firebase 에뮬레이터 시작
firebase emulators:start

# Functions 쉘에서 테스트
firebase functions:shell

# 함수 테스트
analyzeEmpathy({ response: "정말 속상했겠다", situation: "친구와 싸움" })
```

## 6. 프로덕션 체크리스트

- [ ] API 키 보안 설정 완료
- [ ] 안전 필터 설정 완료
- [ ] 비용 알림 설정 완료
- [ ] 에러 처리 구현 완료
- [ ] 로깅 설정 완료

---

문의사항이 있으시면 GitHub Issues에 남겨주세요!