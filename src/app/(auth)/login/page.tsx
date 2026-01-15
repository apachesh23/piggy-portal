'use client';

import { Button, Card, Stack, Title, Text } from '@mantine/core';
import { IconBrandDiscord } from '@tabler/icons-react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn('discord', { callbackUrl: '/statistics' });
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

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