import './styles/globals.css';
import React from 'react';

function App() {
  return (
    <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: '#f0f9ff', height: '100vh', border: '10px solid #3b82f6' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1e40af' }}>
        🎉 설치 성공! 🎉
      </h1>
      <p style={{ marginTop: '1.5rem', fontSize: '1.2rem', color: '#1d4ed8' }}>
        프로젝트 실행에 필요한 기본 설정이 모두 완료되었습니다.
      </p>
      <p style={{ marginTop: '1rem', color: 'gray' }}>
        (오류를 해결하기 위해 pages, contexts 폴더 관련 코드를 임시로 제외한 화면입니다.)
      </p>
    </div>
  );
}

export default App;