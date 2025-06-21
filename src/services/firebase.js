// src/services/firebase.js - Firebase 설정 및 초기화
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// 개발 환경에서 에뮬레이터 연결
if (process.env.NODE_ENV === 'development') {
  const isEmulatorConnected = {
    auth: false,
    firestore: false,
    storage: false,
    functions: false
  };

  // Auth 에뮬레이터 연결
  if (!isEmulatorConnected.auth) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      isEmulatorConnected.auth = true;
      console.log('🔐 Auth 에뮬레이터에 연결되었습니다.');
    } catch (error) {
      console.log('Auth 에뮬레이터 연결 실패:', error.message);
    }
  }

  // Firestore 에뮬레이터 연결
  if (!isEmulatorConnected.firestore) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      isEmulatorConnected.firestore = true;
      console.log('🗄️ Firestore 에뮬레이터에 연결되었습니다.');
    } catch (error) {
      console.log('Firestore 에뮬레이터 연결 실패:', error.message);
    }
  }

  // Storage 에뮬레이터 연결
  if (!isEmulatorConnected.storage) {
    try {
      connectStorageEmulator(storage, 'localhost', 9199);
      isEmulatorConnected.storage = true;
      console.log('📁 Storage 에뮬레이터에 연결되었습니다.');
    } catch (error) {
      console.log('Storage 에뮬레이터 연결 실패:', error.message);
    }
  }

  // Functions 에뮬레이터 연결
  if (!isEmulatorConnected.functions) {
    try {
      connectFunctionsEmulator(functions, 'localhost', 5001);
      isEmulatorConnected.functions = true;
      console.log('⚡ Functions 에뮬레이터에 연결되었습니다.');
    } catch (error) {
      console.log('Functions 에뮬레이터 연결 실패:', error.message);
    }
  }
}

// Firebase 앱 객체 export
export default app;

// Firebase 연결 상태 확인
export const checkFirebaseConnection = () => {
  console.log('🔥 Firebase 설정:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    environment: process.env.NODE_ENV
  });
};

// 환경변수 검증
if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
  console.log('📋 필요한 환경변수:');
  console.log('- REACT_APP_FIREBASE_API_KEY');
  console.log('- REACT_APP_FIREBASE_AUTH_DOMAIN');
  console.log('- REACT_APP_FIREBASE_PROJECT_ID');
  console.log('- REACT_APP_FIREBASE_STORAGE_BUCKET');
  console.log('- REACT_APP_FIREBASE_MESSAGING_SENDER_ID');
  console.log('- REACT_APP_FIREBASE_APP_ID');
}

// 개발용 로그
if (process.env.NODE_ENV === 'development') {
  checkFirebaseConnection();
}