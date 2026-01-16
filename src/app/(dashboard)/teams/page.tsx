'use client';

import { useState, useEffect, useMemo } from 'react';
import { Title, Text, Group, Loader, Center, Alert, Select, TextInput, Badge, Autocomplete } from '@mantine/core';
import { IconAlertCircle, IconSearch, IconUsers, IconX } from '@tabler/icons-react';
import { TeamTree } from './TeamTree';
import { FilteredView } from './FilteredView';
import { getRoleLabel, getRoleColor, type UserRole } from '@/lib/constants/roles';

type User = {
  id: number;
  username: string;
  discord_avatar?: string | null;
  role: UserRole;
  permission_level: string;
  teamleader_id: number | null;
  is_active: boolean;
};

// Все доступные роли для фильтра
const ALL_ROLES: UserRole[] = [
  'admin',
  'teamleader',
  'supervisor',
  'moderator',
  'super_bg',
  'junior',
  'tangiblee_partner',
];

export default function TeamsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Фильтры
  const [filterRole, setFilterRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusUserId, setFocusUserId] = useState<number | null>(null);

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

  // Фильтрация пользователей
  const filteredUsers = useMemo(() => {
    let result = users;

    // Фильтр по роли
    if (filterRole && filterRole !== '') {
      result = result.filter((u) => u.role === filterRole);
    } else {
      // Если фильтр не выбран, скрываем tangiblee_partner из основного дерева
      result = result.filter((u) => u.role !== 'tangiblee_partner');
    }

    return result;
  }, [users, filterRole]);

  // Обработка поиска
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFocusUserId(null);
      return;
    }

    // Ищем пользователя по имени
    const foundUser = users.find((u) =>
      u.username.toLowerCase() === query.toLowerCase()
    );

    if (foundUser) {
      setFocusUserId(foundUser.id);
    } else {
      setFocusUserId(null);
    }
  };

  // Автокомплит данные для поиска
  const autocompleteData = useMemo(() => {
    return users.map((u) => u.username);
  }, [users]);

  // Опции для Select фильтра ролей
  const roleOptions = useMemo(() => {
    const allUsersCount = users.filter(u => u.role !== 'tangiblee_partner').length;
    
    return [
      { value: '', label: `All Roles (${allUsersCount})` },
      ...ALL_ROLES.map((role) => {
        const count = users.filter((u) => u.role === role).length;
        return {
          value: role,
          label: `${getRoleLabel(role)} (${count})`,
          color: getRoleColor(role),
        };
      }).filter((option) => {
        // Показываем только роли, у которых есть пользователи
        const count = users.filter((u) => u.role === option.value).length;
        return count > 0;
      }),
    ];
  }, [users]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Group justify="space-between" mb="md" wrap="nowrap">
        <div>
          <Title order={1}>Team Structure</Title>
          <Text c="dimmed" size="sm" mt={4}>
            View the organizational hierarchy and team composition
          </Text>
        </div>

        {/* Правая часть: Фильтры + Поиск + Счётчик */}
        <Group gap="sm" wrap="nowrap">
          {/* Фильтр по роли */}
          <Select
            placeholder="Filter by role"
            data={roleOptions}
            value={filterRole}
            onChange={(value) => setFilterRole(value || '')}
            w={220}
            clearable
            leftSection={
              filterRole && filterRole !== '' ? (
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: getRoleColor(filterRole as UserRole),
                  }}
                />
              ) : (
                <IconUsers size={16} />
              )
            }
            renderOption={({ option }) => (
              <Group gap="xs">
                {option.value !== '' && (
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: (option as any).color || getRoleColor(option.value as UserRole),
                    }}
                  />
                )}
                <Text size="sm">{option.label}</Text>
              </Group>
            )}
          />

          {/* Поиск по имени с автокомплитом */}
          <Autocomplete
            placeholder="Search user..."
            data={autocompleteData}
            value={searchQuery}
            onChange={handleSearch}
            w={260}
            leftSection={<IconSearch size={16} />}
            rightSection={
              searchQuery ? (
                <IconX
                  size={16}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSearchQuery('');
                    setFocusUserId(null);
                  }}
                />
              ) : null
            }
            limit={5}
          />

          {/* Счётчик команды */}
          <Badge
            size="lg"
            variant="light"
            color="blue"
            leftSection={<IconUsers size={14} />}
          >
            {filteredUsers.length} {filteredUsers.length === 1 ? 'member' : 'members'}
          </Badge>
        </Group>
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
          <>
            {filterRole && filterRole !== '' ? (
              // Показываем сетку для отфильтрованных ролей
              <FilteredView 
                users={filteredUsers}
                highlightedUserId={focusUserId}
              />
            ) : (
              // Показываем дерево для всех ролей
              <TeamTree 
                users={filteredUsers} 
                focusUserId={focusUserId}
                onFocusComplete={() => setFocusUserId(null)}
              />
            )}
          </>
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