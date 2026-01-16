'use client';

import { useMemo } from 'react';
import { SimpleGrid, Card, Group, Avatar, Text, Box, Center } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { getAvatarColor, getRoleColor, getRoleLabel, getInitials, type UserRole } from '@/lib/constants/roles';

type User = {
  id: number;
  username: string;
  discord_avatar?: string | null;
  role: UserRole;
  permission_level: string;
  teamleader_id: number | null;
  is_active: boolean;
};

type FilteredViewProps = {
  users: User[];
  highlightedUserId?: number | null;
};

export function FilteredView({ users, highlightedUserId }: FilteredViewProps) {
  const router = useRouter();

  const handleUserClick = (userId: number) => {
    router.push(`/profile/${userId}`);
  };

  if (users.length === 0) {
    return (
      <Center h="100%" style={{ 
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        backgroundColor: '#fff',
      }}>
        <Text c="dimmed" size="lg">
          No users found for this role
        </Text>
      </Center>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      overflow: 'auto',
      backgroundColor: '#fff',
      padding: '24px',
    }}>
      <SimpleGrid cols={2} spacing="md">
        {users.map((user) => (
          <Card
            key={user.id}
            padding="md"
            radius="md"
            withBorder
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: highlightedUserId === user.id 
                ? `3px solid ${getRoleColor(user.role)}` 
                : '1px solid #dee2e6',
              boxShadow: highlightedUserId === user.id 
                ? `0 0 12px ${getRoleColor(user.role)}40` 
                : undefined,
            }}
            onMouseEnter={(e) => {
              if (highlightedUserId !== user.id) {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (highlightedUserId !== user.id) {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
            onClick={() => handleUserClick(user.id)}
          >
            <Group gap="md" wrap="nowrap">
              {/* Avatar */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: user.discord_avatar ? '#e9ecef' : getAvatarColor(user.role),
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '18px',
                  backgroundImage: user.discord_avatar ? `url(${user.discord_avatar})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!user.discord_avatar && getInitials(user.username)}
              </div>

              {/* User Info */}
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="md" fw={600} style={{ lineHeight: 1.3 }} truncate>
                  {user.username}
                </Text>
                
                <Group gap={6} mt={6}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getRoleColor(user.role),
                      flexShrink: 0,
                    }}
                  />
                  <Text 
                    size="sm" 
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
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    </div>
  );
}