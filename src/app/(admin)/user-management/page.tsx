'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Title,
  Text,
  Button,
  Group,
  Select,
  Table,
  TextInput,
  Stack,
  Paper,
  ActionIcon,
  ScrollArea,
  Checkbox,
  Skeleton,
} from '@mantine/core';
import { IconPlus, IconTrash, IconDeviceFloppy, IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getRoleColor, type UserRole, type PermissionLevel } from '@/lib/constants/roles';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';

import { UserRow } from './UserRow';

type UserRowData = {
  id: number | null;
  username: string;
  discord_id: string;
  role: UserRole;
  permission_level: PermissionLevel;
  teamleader_id: number | null;
  is_active: boolean;
  isNew?: boolean;
};

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRowData[]>([]);
  const [originalUsers, setOriginalUsers] = useState<UserRowData[]>([]);
  const [teamleaders, setTeamleaders] = useState<{ value: string; label: string }[]>([]);
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterTeamleader, setFilterTeamleader] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [showDisabled, setShowDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setInitialLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users);
      setOriginalUsers(data.users);
      
      const tls = data.users
        .filter((u: UserRowData) => u.permission_level === 'teamleader')
        .map((u: UserRowData) => ({
          value: u.id!.toString(),
          label: u.username,
        }));
      
      setTeamleaders([{ value: '', label: 'No Teamleader' }, ...tls]);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load users',
        color: 'red',
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAddUser = () => {
    const newUser: UserRowData = {
      id: null,
      username: '',
      discord_id: '',
      role: 'moderator',
      permission_level: 'moderator',
      teamleader_id: null,
      is_active: true,
      isNew: true,
    };
    setUsers([...users, newUser]);
  };

  const handleRemoveUser = useCallback((userId: number | null) => {
    setUsers(users => users.filter((u) => u.id !== userId));
  }, []);

  const handleDeleteUser = useCallback(async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
  
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) throw new Error('Failed to delete');
  
      notifications.show({
        title: 'Success',
        message: 'User deleted successfully',
        color: 'green',
      });
  
      setUsers(users => users.filter((u) => u.id !== userId));
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete user',
        color: 'red',
      });
    }
  }, []);

  const handleChange = useCallback((userId: number | null, field: keyof UserRowData, value: any) => {
    setUsers(users => users.map((user) => {
      if (user.id === userId || (userId === null && user.isNew && user.id === null)) {
        const updatedUser = { ...user, [field]: value };
        
        if (field === 'role') {
          if (value === 'tangiblee_partner') {
            updatedUser.permission_level = 'tangiblee_partner';
          } else if (value === 'junior' || value === 'moderator' || value === 'supervisor' || value === 'super_bg') {
            updatedUser.permission_level = 'moderator';
          } else if (value === 'teamleader') {
            updatedUser.permission_level = 'teamleader';
          } else if (value === 'admin') {
            updatedUser.permission_level = 'admin';
          }
        }
        
        return updatedUser;
      }
      return user;
    }));
  }, []);

  const handleToggleAllDisabled = (checked: boolean) => {
    const newUsers = users.map((user) => {
      if (filteredUsers.some(fu => fu.id === user.id)) {
        return { ...user, is_active: !checked };
      }
      return user;
    });
    setUsers(newUsers);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users }),
      });

      if (!response.ok) throw new Error('Failed to save');

      const data = await response.json();

      notifications.show({
        title: 'Success',
        message: 'Users saved successfully',
        color: 'green',
      });

      await loadUsers();

      if (data.disabledUserIds?.includes(currentUser?.id)) {
        notifications.show({
          title: 'Warning',
          message: 'Your account was disabled. Logging out...',
          color: 'orange',
        });
        
        setTimeout(() => {
          window.location.href = '/api/auth/signout?callbackUrl=/login';
        }, 2000);
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save users',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const originalUser = originalUsers.find(ou => ou.id === user.id);
      const originalIsActive = originalUser ? originalUser.is_active : user.is_active;
      
      if (showDisabled) {
        if (originalIsActive) return false;
      } else {
        if (!originalIsActive && !user.isNew) return false;
      }
      
      if (filterRole && user.role !== filterRole) return false;
      
      if (filterTeamleader) {
        if (filterTeamleader === 'none') {
          if (user.teamleader_id !== null) return false;
        } else {
          if (user.teamleader_id?.toString() !== filterTeamleader) return false;
        }
      }
      
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchUsername = user.username.toLowerCase().includes(query);
        const matchDiscordId = user.discord_id.toLowerCase().includes(query);
        if (!matchUsername && !matchDiscordId) return false;
      }
      
      return true;
    });
  }, [users, originalUsers, showDisabled, filterRole, filterTeamleader, debouncedSearch]);

  const roleOptions = useMemo(() => [
    { value: 'tangiblee_partner', label: 'Tangiblee Partner' },
    { value: 'junior', label: 'Junior' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'super_bg', label: 'Super BG' },
    { value: 'teamleader', label: 'Team Leader' },
    { value: 'admin', label: 'Admin' },
  ], []);

  const teamleaderFilterOptions = [
    { value: '', label: 'All Teamleaders' },
    { value: 'none', label: `No Teamleader (${users.filter(u => u.teamleader_id === null && u.role !== 'teamleader' && u.role !== 'admin').length})` },
    ...users
      .filter((u) => u.permission_level === 'teamleader')
      .map((u) => ({
        value: u.id!.toString(),
        label: `${u.username} (${users.filter(user => user.teamleader_id === u.id).length})`,
      })),
  ];

  return (
    <Stack gap="lg" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Шапка с кнопкой Save */}
      <Group justify="space-between">
        <div>
          <Title order={1}>User Management</Title>
          <Text c="var(--color-foreground-muted)" size="sm" mt={4}>
            Manage team members, their roles, and permissions
          </Text>
        </div>
        <Button
          leftSection={!loading && <IconDeviceFloppy size={18} />}
          size="md"
          loading={loading}
          loaderProps={{ type: 'dots' }}
          onClick={handleSave}
          w={180}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Group>

      {/* Панель фильтров */}
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          {/* Фильтр по роли */}
          <Select
            placeholder="Filter by role"
            data={[
              { value: '', label: 'All Roles' },
              ...roleOptions.map(role => ({
                ...role,
                label: `${role.label} (${users.filter(u => u.role === role.value).length})`
              }))
            ]}
            value={filterRole}
            onChange={(value) => setFilterRole(value || '')}
            w={200}
            allowDeselect={false}
            clearable
            leftSection={
              filterRole && filterRole !== '' && (
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: getRoleColor(filterRole as UserRole),
                  }}
                />
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
                      backgroundColor: getRoleColor(option.value as UserRole),
                    }}
                  />
                )}
                <Text size="sm">{option.label}</Text>
              </Group>
            )}
          />

          {/* Фильтр по куратору */}
          <Select
            placeholder="Filter by teamleader"
            data={teamleaderFilterOptions}
            value={filterTeamleader}
            onChange={(value) => setFilterTeamleader(value || '')}
            w={220}
            clearable
            leftSection={
              filterTeamleader && filterTeamleader !== '' && filterTeamleader !== 'none' && (
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: getRoleColor('teamleader'),
                  }}
                />
              )
            }
            renderOption={({ option }) => (
              <Group gap="xs">
                {option.value !== '' && option.value !== 'none' && (
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: getRoleColor('teamleader'),
                    }}
                  />
                )}
                <Text size="sm">{option.label}</Text>
              </Group>
            )}
          />

          {/* Поиск с debounce */}
          <TextInput
            placeholder="Search by username or Discord ID"
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            w={280}
            rightSection={
              searchQuery && (
                <ActionIcon
                  size="sm"
                  variant="transparent"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </ActionIcon>
              )
            }
          />

          {/* Чекбокс "Show disabled" */}
          <Checkbox
            label="Show disabled"
            checked={showDisabled}
            onChange={(e) => setShowDisabled(e.currentTarget.checked)}
          />
        </Group>

        <Group gap="sm">
          <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} shown
          </Text>
          <Button leftSection={<IconPlus size={16} />} onClick={handleAddUser} variant="light">
            Add User
          </Button>
        </Group>
      </Group>

      {/* Таблица со скроллом */}
      <Paper 
        withBorder 
        style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Заголовок таблицы - ФИКСИРОВАННЫЙ */}
        <Table striped>
          <Table.Thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white' }}>
            <Table.Tr>
              <Table.Th w={80} style={{ textAlign: 'center' }}>ID</Table.Th>
              <Table.Th w={200} style={{ textAlign: 'center' }}>Username</Table.Th>
              <Table.Th w={200} style={{ textAlign: 'center' }}>Discord ID</Table.Th>
              <Table.Th w={150} style={{ textAlign: 'center' }}>Role</Table.Th>
              <Table.Th w={200} style={{ textAlign: 'center' }}>Teamleader</Table.Th>
              <Table.Th w={100} style={{ textAlign: 'center' }}>
                <Group gap="xs" justify="center">
                  <Text size="sm" fw={700}>Disabled</Text>
                  <Checkbox
                    size="xs"
                    onChange={(e) => handleToggleAllDisabled(e.currentTarget.checked)}
                  />
                </Group>
              </Table.Th>
              <Table.Th w={60} style={{ textAlign: 'center' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
        </Table>

        {/* Тело таблицы - СКРОЛЛИТСЯ */}
        <ScrollArea style={{ flex: 1 }}>
          {initialLoading ? (
            <Table>
              <Table.Tbody>
                {Array(20).fill(0).map((_, i) => (
                  <Table.Tr key={i}>
                    <Table.Td colSpan={7}>
                      <Skeleton height={45} radius="sm" animate />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Table striped highlightOnHover>
              <Table.Tbody>
                {filteredUsers.map((user) => (
                  <UserRow
                    key={user.id || `new-${user.username}`}
                    user={user}
                    roleOptions={roleOptions}
                    teamleaders={teamleaders}
                    onChange={handleChange}
                    onRemove={handleRemoveUser}
                    onDelete={handleDeleteUser}
                  />
                ))}
              </Table.Tbody>
            </Table>
          )}
        </ScrollArea>
      </Paper>
    </Stack>
  );
}