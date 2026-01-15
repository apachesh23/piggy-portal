'use client';

import {
  Group,
  HoverCard,
  UnstyledButton,
  ThemeIcon,
  Text,
  Divider,
  Center,
  Box,
  useMantineTheme,
} from '@mantine/core';
import {
  IconChevronDown,
  IconUsers,
  IconClock,
  IconCalendar,
  IconUserCog,
  IconSettings,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // ← Добавь этот импорт
import { useAuth } from '@/features/auth/hooks/useAuth';
import { hasPermission, PERMISSIONS } from '@/lib/constants/roles';
import classes from './Topbar.module.css';

const teamleaderLinks = [
  {
    icon: IconUsers,
    title: 'Reports',
    description: 'View team performance reports',
    href: '/reports',
  },
  {
    icon: IconClock,
    title: 'Time Worked',
    description: 'Track team working hours',
    href: '/time-worked',
  },
  {
    icon: IconCalendar,
    title: 'Weekend Schedule',
    description: 'Manage team weekends',
    href: '/weekend',
  },
];

const adminLinks = [
  {
    icon: IconUserCog,
    title: 'User Management',
    description: 'Manage users and permissions',
    href: '/user-management',
  },
  {
    icon: IconSettings,
    title: 'System',
    description: 'System settings and logs',
    href: '/system',
  },
];

export function Navigation() {
  const { user } = useAuth();
  const theme = useMantineTheme();
  const pathname = usePathname(); // ← Получаем текущий путь

  // Проверка типа для TypeScript
  if (!user) {
    return (
      <Group gap={0} h="100%" align="stretch">
        <Link href="/statistics" className={classes.link}>
          Statistics
        </Link>
        <Link href="/leaderboard" className={classes.link}>
          Leaderboard
        </Link>
        <Link href="/teams" className={classes.link}>
          Teams
        </Link>
      </Group>
    );
  }

  const renderSubLinks = (links: typeof teamleaderLinks) => {
    return (
      <Group gap="md" wrap="nowrap">
        {links.map((item) => (
          <Link href={item.href} key={item.title} style={{ textDecoration: 'none' }}>
            <UnstyledButton className={classes.subLink}>
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <ThemeIcon size={34} variant="default" radius="md">
                  <item.icon size={22} color={theme.colors.blue[6]} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={500}>
                    {item.title}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {item.description}
                  </Text>
                </div>
              </Group>
            </UnstyledButton>
          </Link>
        ))}
      </Group>
    );
  };

  return (
    <Group gap={0} h="100%" align="stretch">
      {/* Доступно всем авторизованным */}
      <Link href="/statistics" className={classes.link}>
        Statistics
      </Link>
      <Link href="/leaderboard" className={classes.link}>
        Leaderboard
      </Link>
      <Link href="/teams" className={classes.link}>
        Teams
      </Link>

    {/* Только для Teamleader и выше */}
    {hasPermission(user.permission_level, PERMISSIONS.TEAMLEADER) && (
        <HoverCard width="auto" position="bottom" radius="md" shadow="md" withinPortal>
          <HoverCard.Target>
            <a href="#" className={classes.link}>
              <Center inline>
                <Box component="span" mr={5}>
                  Teamleader
                </Box>
                <IconChevronDown size={16} color={theme.colors.blue[6]} />
              </Center>
            </a>
          </HoverCard.Target>

          <HoverCard.Dropdown style={{ padding: '16px' }}>
            <Text fw={500} mb="sm">
              Teamleader Tools
            </Text>
            <Divider mb="md" />
            {renderSubLinks(teamleaderLinks)}
          </HoverCard.Dropdown>
        </HoverCard>
      )}

      {/* Только для Admin и Dev */}
      {hasPermission(user.permission_level, PERMISSIONS.ADMIN) && (
        <HoverCard width="auto" position="bottom" radius="md" shadow="md" withinPortal>
          <HoverCard.Target>
            <a href="#" className={classes.link}>
              <Center inline>
                <Box component="span" mr={5}>
                  Admin
                </Box>
                <IconChevronDown size={16} color={theme.colors.blue[6]} />
              </Center>
            </a>
          </HoverCard.Target>

          <HoverCard.Dropdown style={{ padding: '16px' }}>
            <Text fw={500} mb="sm">
              Admin Panel
            </Text>
            <Divider mb="md" />
            {renderSubLinks(adminLinks)}
          </HoverCard.Dropdown>
        </HoverCard>
      )}
    </Group>
  );
}