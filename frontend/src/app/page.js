// app/page.js
'use client';

import { useState } from 'react';
import LoginModal from '../components/LoginModal';

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div>
      <h1>Добро пожаловать в Quantum Service!</h1>
      <p>Это информационная система для управления сервисным центром.</p>
      <button onClick={() => setIsLoginOpen(true)}>Открыть окно входа</button>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}