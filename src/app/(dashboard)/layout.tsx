'use client';

import { Topbar } from '@/shared/components/Layout/Topbar';
import { Container } from '@mantine/core';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ✅ Проверка session на клиенте
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      console.log('🚫 No session, redirecting to login');
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Topbar />
      <main style={{ 
        flex: 1, 
        overflow: 'hidden', 
        padding: '20px 20px 40px 20px'
      }}>
        <Container 
          size={1200} 
          style={{ 
            maxWidth: '1200px', 
            width: '100%', 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </Container>
      </main>
    </div>
  );
}