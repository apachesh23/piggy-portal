'use client';

import { Title, Text, Paper, Group, Avatar, Box, Stack, Select, Switch, Divider } from '@mantine/core';
import { IconWorld, IconBell, IconMail, IconMessageCircle } from '@tabler/icons-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getRoleColor, getRoleLabel } from '@/lib/constants/roles';
import { useState } from 'react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [language, setLanguage] = useState('en');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [taskUpdates, setTaskUpdates] = useState(true);
  const [teamUpdates, setTeamUpdates] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div>
      {/* Заголовок страницы */}
      <div>
        <Title order={1}>Settings</Title>
        <Text c="var(--color-foreground-muted)" size="sm" mt={4}>
          Manage your account preferences and profile information
        </Text>
      </div>

      {/* Информация о пользователе - ГОРИЗОНТАЛЬНО */}
      <Paper 
        withBorder 
        p="xl" 
        mt="xl" 
        radius="md"
        style={{
          backgroundColor: 'white',
        }}
      >
        <Group align="center" wrap="nowrap">
          {/* Avatar */}
          <Avatar 
            src={user.avatar} 
            size={80} 
            radius="md"
            styles={{
              root: {
                flexShrink: 0,
              }
            }}
          />

          {/* Username */}
          <Box style={{ flex: 1 }}>
            <Text size="xs" fw={500} c="var(--color-foreground-muted)" mb={4}>
              Display Username
            </Text>
            <Text size="lg" fw={600}>
              {user.username}
            </Text>
          </Box>

          {/* Role */}
          <Box style={{ flex: 1 }}>
            <Text size="xs" fw={500} c="var(--color-foreground-muted)" mb={4}>
              Role
            </Text>
            <Group gap={8}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: getRoleColor(user.role),
                  flexShrink: 0,
                }}
              />
              <Text 
                size="md" 
                fw={600}
                style={{ 
                  color: getRoleColor(user.role),
                }}
              >
                {getRoleLabel(user.role)}
              </Text>
            </Group>
          </Box>

          {/* User ID */}
          <Box style={{ flex: 1 }}>
            <Text size="xs" fw={500} c="var(--color-foreground-muted)" mb={4}>
              User ID
            </Text>
            <Text size="md" c="var(--color-foreground)">
              #{user.id}
            </Text>
          </Box>

          {/* Discord ID */}
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" fw={500} c="var(--color-foreground-muted)" mb={4}>
              Discord ID
            </Text>
            <Text size="md" c="var(--color-foreground)" truncate>
              {user.discord_id}
            </Text>
          </Box>
        </Group>
      </Paper>

      {/* Language Settings */}
      <Paper 
        withBorder 
        p="xl" 
        mt="xl" 
        radius="md"
        style={{
          backgroundColor: 'white',
        }}
      >
        <Group gap="md" mb="lg">
          <IconWorld size={24} color="var(--color-accent)" />
          <div>
            <Text size="lg" fw={600}>
              Language
            </Text>
            <Text size="sm" c="var(--color-foreground-muted)">
              Choose your preferred language
            </Text>
          </div>
        </Group>

        <Box style={{ maxWidth: '300px' }}>
          <Select
            value={language}
            onChange={(value) => setLanguage(value || 'en')}
            data={[
              { value: 'en', label: '🇺🇸 English' },
              { value: 'ru', label: '🇷🇺 Русский' },
              { value: 'ua', label: '🇺🇦 Українська' },
            ]}
            placeholder="Select language"
          />
        </Box>
      </Paper>

      {/* Notifications Settings */}
      <Paper 
        withBorder 
        p="xl" 
        mt="xl" 
        radius="md"
        style={{
          backgroundColor: 'white',
        }}
      >
        <Group gap="md" mb="lg">
          <IconBell size={24} color="var(--color-accent)" />
          <div>
            <Text size="lg" fw={600}>
              Notifications
            </Text>
            <Text size="sm" c="var(--color-foreground-muted)">
              Manage how you receive notifications
            </Text>
          </div>
        </Group>

        <Stack gap="lg">
          {/* Email Notifications */}
          <Group justify="space-between" wrap="nowrap">
            <Box>
              <Group gap="xs" mb={4}>
                <IconMail size={18} color="var(--color-foreground-muted)" />
                <Text size="md" fw={500}>
                  Email Notifications
                </Text>
              </Group>
              <Text size="sm" c="var(--color-foreground-muted)">
                Receive email updates about your activity
              </Text>
            </Box>
            <Switch
              checked={emailNotifications}
              onChange={(event) => setEmailNotifications(event.currentTarget.checked)}
              color="var(--color-accent)"
              size="md"
            />
          </Group>

          <Divider />

          {/* Push Notifications */}
          <Group justify="space-between" wrap="nowrap">
            <Box>
              <Group gap="xs" mb={4}>
                <IconBell size={18} color="var(--color-foreground-muted)" />
                <Text size="md" fw={500}>
                  Push Notifications
                </Text>
              </Group>
              <Text size="sm" c="var(--color-foreground-muted)">
                Get push notifications in your browser
              </Text>
            </Box>
            <Switch
              checked={pushNotifications}
              onChange={(event) => setPushNotifications(event.currentTarget.checked)}
              color="var(--color-accent)"
              size="md"
            />
          </Group>

          <Divider />

          {/* Task Updates */}
          <Group justify="space-between" wrap="nowrap">
            <Box>
              <Group gap="xs" mb={4}>
                <IconMessageCircle size={18} color="var(--color-foreground-muted)" />
                <Text size="md" fw={500}>
                  Task Updates
                </Text>
              </Group>
              <Text size="sm" c="var(--color-foreground-muted)">
                Notifications about task assignments and updates
              </Text>
            </Box>
            <Switch
              checked={taskUpdates}
              onChange={(event) => setTaskUpdates(event.currentTarget.checked)}
              color="var(--color-accent)"
              size="md"
            />
          </Group>

          <Divider />

          {/* Team Updates */}
          <Group justify="space-between" wrap="nowrap">
            <Box>
              <Group gap="xs" mb={4}>
                <IconMessageCircle size={18} color="var(--color-foreground-muted)" />
                <Text size="md" fw={500}>
                  Team Updates
                </Text>
              </Group>
              <Text size="sm" c="var(--color-foreground-muted)">
                Notifications about team announcements and changes
              </Text>
            </Box>
            <Switch
              checked={teamUpdates}
              onChange={(event) => setTeamUpdates(event.currentTarget.checked)}
              color="var(--color-accent)"
              size="md"
            />
          </Group>
        </Stack>
      </Paper>
    </div>
  );
}