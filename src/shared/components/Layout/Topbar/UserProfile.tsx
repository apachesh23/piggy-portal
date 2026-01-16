'use client';

import { UnstyledButton, Group, Avatar, Text, Menu, Box, Divider } from '@mantine/core';
import { IconSettings, IconLogout, IconChevronRight } from '@tabler/icons-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getRoleColor, getRoleLabel } from '@/lib/constants/roles';
import { useState } from 'react';
import classes from './Topbar.module.css';

export function UserProfile() {
  const { user, logout } = useAuth();
  const [opened, setOpened] = useState(false);

  if (!user) return null;

  return (
    <Menu 
      position="bottom-end" 
      offset={0} 
      width={200}
      opened={opened}
      onChange={setOpened}
    >
      <Menu.Target>
        <UnstyledButton className={classes.userProfile}>
          <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
            <Avatar src={user.avatar} radius="sm" size={36} />
            
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={500} style={{ lineHeight: 1.2 }} truncate>
                {user.username}
              </Text>
              
              {/* Роль с цветным кружочком и цветным текстом */}
              <Group gap={4} mt={2}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: getRoleColor(user.role),
                    flexShrink: 0,
                  }}
                />
                <Text 
                  size="xs" 
                  style={{ 
                    color: getRoleColor(user.role),
                    fontWeight: 500,
                    lineHeight: 1,
                  }}
                >
                  {getRoleLabel(user.role)}
                </Text>
              </Group>
            </Box>

            {/* Стрелка с анимацией */}
            <IconChevronRight 
              size={14} 
              stroke={1.5} 
              style={{ 
                flexShrink: 0,
                transform: opened ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 200ms ease',
              }} 
            />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
          {/* Account header */}
          <Box px="sm" py="xs">
            <Text size="xs" fw={500} className={classes.accountMenuHeader}>
              Account
            </Text>
          </Box>
          
          <Divider />

          {/* Settings */}
          <Menu.Item
            className={classes.accountMenuItem}
            leftSection={<IconSettings size={16} stroke={1.5} />}
            onClick={() => console.log('Settings clicked')}
          >
            Settings
          </Menu.Item>

          {/* Logout */}
          <Menu.Item
            className={classes.accountMenuItem}
            leftSection={<IconLogout size={16} stroke={1.5} />}
            onClick={logout}
          >
            Logout
          </Menu.Item>
        </Menu.Dropdown>
    </Menu>
  );
}