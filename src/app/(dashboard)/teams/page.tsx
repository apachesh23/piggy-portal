'use client';

import { useState, useEffect } from 'react';
import { Title, Text, Group, Loader, Center, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { TeamTree } from './TeamTree';
import type { UserRole } from '@/lib/constants/roles';

type User = {
  id: number;
  username: string;
  discord_avatar?: string | null;
  role: UserRole;
  permission_level: string;
  teamleader_id: number | null;
  is_active: boolean;
};

export default function TeamsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      const activeUsers = data.users.filter((u: User) => u.is_active);
      setUsers(activeUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Team Structure</Title>
          <Text c="dimmed" size="sm" mt={4}>
            View the organizational hierarchy and team composition
          </Text>
        </div>
      </Group>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {loading && (
          <Center h="100%">
            <Loader size="lg" />
          </Center>
        )}

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error loading team data"
            color="red"
            variant="light"
          >
            {error}
          </Alert>
        )}

        {!loading && !error && users.length > 0 && (
          <TeamTree users={users} />
        )}

        {!loading && !error && users.length === 0 && (
          <Center h="100%">
            <Text c="dimmed" size="lg">
              No users found
            </Text>
          </Center>
        )}
      </div>
    </div>
  );
}