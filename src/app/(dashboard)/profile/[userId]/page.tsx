import { notFound } from 'next/navigation';
import { Card, Avatar, Title, Text, Group, Stack, Badge, Button } from '@mantine/core';
import { IconBrandDiscord } from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/server';

interface PublicProfilePageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const supabase = await createClient();
  const { userId } = await params;
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user || !user.is_active) {
    notFound();
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card shadow="sm" padding="xl" radius="md" withBorder>
        <Stack gap="xl">
          <Group align="flex-start" gap="xl">
            <Avatar
              src={user.discord_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
              size={120}
              radius="md"
            />
            
            <Stack gap="sm" style={{ flex: 1 }}>
              <div>
                <Title order={2}>{user.username}</Title>
                <Text c="dimmed" size="sm">ID: {user.id}</Text>
              </div>
              
              <Group gap="xs">
                <Badge color="blue">{user.role}</Badge>
                {user.permission_level !== 'guest' && (
                  <Badge color="grape">{user.permission_level}</Badge>
                )}
              </Group>

              {user.discord_username && (
                <Button
                  variant="light"
                  color="indigo"
                  leftSection={<IconBrandDiscord size={18} />}
                  component="a"
                  href={`https://discord.com/users/${user.discord_id}`}
                  target="_blank"
                  size="sm"
                  style={{ width: 'fit-content' }}
                >
                  {user.discord_username}
                </Button>
              )}
            </Stack>
          </Group>

          <div>
            <Title order={4} mb="md">Statistics</Title>
            <Text c="dimmed" size="sm">
              Detailed statistics coming soon...
            </Text>
          </div>
        </Stack>
      </Card>
    </div>
  );
}