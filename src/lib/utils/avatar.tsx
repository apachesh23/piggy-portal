import { Avatar as MantineAvatar, AvatarProps } from '@mantine/core';
import { getRoleColor } from '@/lib/constants/roles';
import type { UserRole } from '@/lib/constants/roles';

type UserAvatarProps = Omit<AvatarProps, 'children' | 'color'> & {
  src?: string | null;
  username: string;
  role: UserRole;
};

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

/**
 * Универсальный компонент аватара пользователя
 * Если нет src - показывает заглушку с первой буквой имени цвета роли
 */
export function UserAvatar({ src, username, role, ...props }: UserAvatarProps) {
  return (
    <MantineAvatar
      src={src}
      color={getRoleColor(role)}
      {...props}
      styles={{
        root: {
          backgroundColor: src ? undefined : getRoleColor(role),
          color: 'white',
          fontWeight: 600,
        },
        ...props.styles,
      }}
    >
      {!src && getInitials(username)}
    </MantineAvatar>
  );
}