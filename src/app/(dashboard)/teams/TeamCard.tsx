'use client';

import { UnstyledButton, Group, Avatar, Text, Box } from '@mantine/core';
import { getRoleColor, getRoleLabel, type UserRole } from '@/lib/constants/roles';
import { useState } from 'react';

type TeamCardProps = {
  id: number;
  username: string;
  avatar?: string | null;
  role: UserRole;
};

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function TeamCard({ username, avatar, role }: TeamCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <UnstyledButton
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        padding: '8px 12px',
        borderRadius: '6px',
        backgroundColor: isHovered ? 'var(--mantine-color-gray-0)' : 'white',
        border: '1px solid var(--mantine-color-gray-3)',
        transition: 'background-color 0.2s ease',
        cursor: 'pointer',
      }}
    >
      <Group gap="sm" wrap="nowrap">
        <Avatar
          src={avatar}
          size={32}
          radius="md"
          alt={username}
          color={getRoleColor(role)}
          styles={{
            root: {
              backgroundColor: avatar ? undefined : getRoleColor(role),
              color: 'white',
            },
          }}
        >
          {!avatar && getInitials(username)}
        </Avatar>

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={500} style={{ lineHeight: 1.2 }} truncate>
            {username}
          </Text>
          
          <Group gap={4} mt={2}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: getRoleColor(role),
                flexShrink: 0,
              }}
            />
            <Text 
              size="xs" 
              style={{ 
                color: getRoleColor(role),
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              {getRoleLabel(role)}
            </Text>
          </Group>
        </Box>
      </Group>
    </UnstyledButton>
  );
}