'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      // Если авторизован - на главную страницу приложения
      router.push('/statistics');
    } else {
      // Если не авторизован - на логин
      router.push('/login');
    }
  }, [session, status, router]);

  // Показываем загрузку пока проверяем
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <p>Loading...</p>
    </div>
  );
}