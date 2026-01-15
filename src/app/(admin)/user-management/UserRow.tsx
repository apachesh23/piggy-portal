import { memo } from 'react';
import { Table, TextInput, Select, Checkbox, ActionIcon, Group, Text } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { getRoleColor, type UserRole } from '@/lib/constants/roles';

type UserRowData = {
  id: number | null;
  username: string;
  discord_id: string;
  role: UserRole;
  teamleader_id: number | null;
  is_active: boolean;
  isNew?: boolean;
};

type UserRowProps = {
  user: UserRowData;
  roleOptions: { value: string; label: string }[];
  teamleaders: { value: string; label: string }[];
  onChange: (userId: number | null, field: keyof UserRowData, value: any) => void;
  onRemove: (userId: number | null) => void;
  onDelete: (userId: number) => void;
};

export const UserRow = memo(function UserRow({
  user,
  roleOptions,
  teamleaders,
  onChange,
  onRemove,
  onDelete,
}: UserRowProps) {
  console.log('🔄 Rendering row:', user.id || 'new', user.username);  // ← Добавь это!
  return (
    <Table.Tr>
      <Table.Td w={80}>
        <TextInput
          value={user.id?.toString() || 'New'}
          disabled
          size="xs"
          styles={{ input: { textAlign: 'center' } }}
        />
      </Table.Td>

      <Table.Td w={200}>
        <TextInput
          value={user.username}
          onChange={(e) => onChange(user.id, 'username', e.target.value)}
          placeholder="username"
          size="xs"
        />
      </Table.Td>

      <Table.Td w={200}>
        <TextInput
          value={user.discord_id}
          onChange={(e) => onChange(user.id, 'discord_id', e.target.value)}
          placeholder="123456789012345678"
          size="xs"
        />
      </Table.Td>

      <Table.Td w={150}>
        <Select
          value={user.role}
          onChange={(value) => onChange(user.id, 'role', value)}
          data={roleOptions}
          size="xs"
          renderOption={({ option }) => (
            <Group gap="xs">
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: getRoleColor(option.value as UserRole),
                }}
              />
              <Text size="sm">{option.label}</Text>
            </Group>
          )}
          leftSection={
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: getRoleColor(user.role),
              }}
            />
          }
        />
      </Table.Td>

      <Table.Td w={200}>
        {user.role === 'teamleader' || user.role === 'admin' ? (
          <TextInput
            value="—"
            disabled
            size="xs"
            styles={{ input: { textAlign: 'center', color: 'gray' } }}
          />
        ) : (
          <Select
            value={user.teamleader_id?.toString() || ''}
            onChange={(value) =>
              onChange(user.id, 'teamleader_id', value ? parseInt(value) : null)
            }
            data={teamleaders}
            size="xs"
            leftSection={
              user.teamleader_id && (
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
                {option.value !== '' && (
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
        )}
      </Table.Td>

      <Table.Td w={100}>
        <Group justify="center">
          <Checkbox
            checked={!user.is_active}
            onChange={(e) => onChange(user.id, 'is_active', !e.currentTarget.checked)}
          />
        </Group>
      </Table.Td>

      <Table.Td w={60}>
        {user.isNew ? (
          <ActionIcon 
            color="red" 
            onClick={() => onRemove(user.id)} 
            size="sm"
            variant="subtle"
          >
            <IconTrash size={16} />
          </ActionIcon>
        ) : (
          <ActionIcon
            color="red"
            onClick={() => onDelete(user.id!)}
            size="sm"
            variant="subtle"
          >
            <IconTrash size={16} />
          </ActionIcon>
        )}
      </Table.Td>
    </Table.Tr>
  );
});