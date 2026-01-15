'use client';

import { Group, Box } from '@mantine/core';
import { Logo } from './Logo';
import { Navigation } from './Navigation';
import { NotificationButton } from './NotificationButton';
import { UserProfile } from './UserProfile';

export function Topbar() {
  return (
    <Box
      component="header"
      style={{
        height: 60,
        borderBottom: '1px solid var(--mantine-color-gray-3)',
        backgroundColor: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Group 
        h="100%" 
        px={60}  // ← Изменили с 200 на 80
        justify="space-between" 
        wrap="nowrap"
        style={{ position: 'relative' }}
      >
        {/* Logo слева */}
        <Box style={{ flexShrink: 0 }}>
          <Logo />
        </Box>

        {/* Navigation по центру */}
        <Box
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <Navigation />
        </Box>

        {/* Notification + UserProfile справа */}
        <Group gap={0} style={{ flexShrink: 0 }}>
          <NotificationButton />
          <UserProfile />
        </Group>
      </Group>
    </Box>
  );
}