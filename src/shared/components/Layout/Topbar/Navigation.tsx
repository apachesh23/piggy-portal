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
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  if (!user) {
    return (
      <Group gap={0} h="100%" align="stretch">
        <Link 
          href="/statistics" 
          className={`${classes.link} ${pathname === '/statistics' ? classes.active : ''}`}
        >
          Statistics
        </Link>
        <Link 
          href="/leaderboard" 
          className={`${classes.link} ${pathname === '/leaderboard' ? classes.active : ''}`}
        >
          Leaderboard
        </Link>
        <Link 
          href="/teams" 
          className={`${classes.link} ${pathname === '/teams' ? classes.active : ''}`}
        >
          Teams
        </Link>
      </Group>
    );
  }

  // Проверяем активность выпадающих меню
  const isTeamleaderActive = teamleaderLinks.some(link => pathname.startsWith(link.href));
  const isAdminActive = adminLinks.some(link => pathname.startsWith(link.href));

  const renderSubLinks = (links: typeof teamleaderLinks) => {
    return (
      <Group gap="md" wrap="nowrap">
        {links.map((item) => (
          <Link href={item.href} key={item.title} style={{ textDecoration: 'none' }}>
            <UnstyledButton className={classes.subLink}>
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <ThemeIcon size={34} variant="light" radius="md" color="var(--color-accent)">
                  <item.icon size={22} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={500} c="var(--color-foreground)">
                    {item.title}
                  </Text>
                  <Text size="xs" c="var(--color-foreground-muted)">
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
      <Link 
        href="/statistics" 
        className={`${classes.link} ${pathname === '/statistics' ? classes.active : ''}`}
      >
        Statistics
      </Link>
      <Link 
        href="/leaderboard" 
        className={`${classes.link} ${pathname === '/leaderboard' ? classes.active : ''}`}
      >
        Leaderboard
      </Link>
      <Link 
        href="/teams" 
        className={`${classes.link} ${pathname === '/teams' ? classes.active : ''}`}
      >
        Teams
      </Link>

      {hasPermission(user.permission_level, PERMISSIONS.TEAMLEADER) && (
        <HoverCard width="auto" position="bottom" radius="md" shadow="md" withinPortal>
          <HoverCard.Target>
            <a href="#" className={`${classes.link} ${isTeamleaderActive ? classes.active : ''}`}>
              <Center inline>
                <Box component="span" mr={5}>
                  Teamleader
                </Box>
                <IconChevronDown size={16} />
              </Center>
            </a>
          </HoverCard.Target>

          <HoverCard.Dropdown style={{ padding: '16px' }}>
            <Text fw={500} mb="sm" c="var(--color-foreground)">
              Teamleader Tools
            </Text>
            <Divider mb="md" />
            {renderSubLinks(teamleaderLinks)}
          </HoverCard.Dropdown>
        </HoverCard>
      )}

      {hasPermission(user.permission_level, PERMISSIONS.ADMIN) && (
        <HoverCard width="auto" position="bottom" radius="md" shadow="md" withinPortal>
          <HoverCard.Target>
            <a href="#" className={`${classes.link} ${isAdminActive ? classes.active : ''}`}>
              <Center inline>
                <Box component="span" mr={5}>
                  Admin
                </Box>
                <IconChevronDown size={16} />
              </Center>
            </a>
          </HoverCard.Target>

          <HoverCard.Dropdown style={{ padding: '16px' }}>
            <Text fw={500} mb="sm" c="var(--color-foreground)">
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