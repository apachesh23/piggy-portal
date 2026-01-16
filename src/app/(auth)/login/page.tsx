'use client';

import { Button, Card, Stack, Title, Text } from '@mantine/core';
import { IconBrandDiscord } from '@tabler/icons-react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  // ✅ Проверка сессии - если авторизован, редиректим на /statistics
  useEffect(() => {
    if (status === 'loading') return; // Ждем загрузки сессии
    
    if (session) {
      console.log('✅ User already authenticated, redirecting to /statistics');
      router.push('/statistics');
    }
  }, [session, status, router]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn('discord', { callbackUrl: '/statistics' });
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  // Показываем загрузку пока проверяем сессию
  if (status === 'loading') {
    return (
      <Card shadow="md" padding="xl" radius="md" withBorder style={{ width: '400px' }}>
        <Stack align="center" gap="lg">
          <Title order={1}>🐷 Piggy Portal</Title>
          <Text c="dimmed">Checking authentication...</Text>
        </Stack>
      </Card>
    );
  }

  // Если уже авторизован, не показываем форму (редирект произойдет в useEffect)
  if (session) {
    return null;
  }

  return (
    <Card shadow="md" padding="xl" radius="md" withBorder style={{ width: '400px' }}>
      <Stack align="center" gap="lg">
        <Title order={1}>🐷 Piggy Portal</Title>
        <Text c="dimmed" ta="center">
          Team Management System
        </Text>
        
        <Button 
          leftSection={<IconBrandDiscord size={20} />}
          variant="filled" 
          color="indigo"
          size="lg"
          fullWidth
          onClick={handleLogin}
          loading={loading}
        >
          Войти через Discord
        </Button>

        <Text size="xs" c="dimmed" ta="center">
          Доступ только для участников whitelist
        </Text>
      </Stack>
    </Card>
  );
}