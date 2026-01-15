export type UserRole = 'junior' | 'moderator' | 'supervisor' | 'super_bg' | 'teamleader' | 'admin';
export type PermissionLevel = 'guest' | 'moderator' | 'teamleader' | 'admin' | 'dev';

export const ROLES = {
  JUNIOR: 'junior' as UserRole,
  MODERATOR: 'moderator' as UserRole,
  SUPERVISOR: 'supervisor' as UserRole,
  SUPER_BG: 'super_bg' as UserRole,
  TEAMLEADER: 'teamleader' as UserRole,
  ADMIN: 'admin' as UserRole,
};

export const PERMISSIONS = {
  GUEST: 'guest' as PermissionLevel,
  MODERATOR: 'moderator' as PermissionLevel,
  TEAMLEADER: 'teamleader' as PermissionLevel,
  ADMIN: 'admin' as PermissionLevel,
  DEV: 'dev' as PermissionLevel,
};

// 🎨 ЦВЕТА ДЛЯ РОЛЕЙ (hex)
export const ROLE_COLORS = {
  admin: '#2ECC71',      // Зеленый
  teamleader: '#E74C3C', // Красный
  supervisor: '#F1C40F', // Желтый
  super_bg: '#607D8B',   // Серо-синий
  moderator: '#3498DB',  // Синий
  junior: '#9B59B6',     // Фиолетовый
  guest: '#BDC3C7',      // Светло-серый
} as const;

// 🎨 Mantine цвета (для компонентов Badge, Text и т.д.)
export const ROLE_MANTINE_COLORS = {
  admin: 'green',
  teamleader: 'red',
  supervisor: 'yellow',
  super_bg: 'gray',
  moderator: 'blue',
  junior: 'grape',
  guest: 'gray',
} as const;

// Функция для получения HEX цвета роли
export function getRoleColor(role: UserRole): string {
  return ROLE_COLORS[role] || ROLE_COLORS.guest;
}

// Функция для получения Mantine цвета
export function getRoleMantineColor(role: UserRole): string {
  return ROLE_MANTINE_COLORS[role] || 'gray';
}

// Проверка прав доступа (иерархия)
export function hasPermission(
  userPermission: PermissionLevel, 
  requiredPermission: PermissionLevel
): boolean {
  const hierarchy = {
    'guest': 0,
    'moderator': 1,
    'teamleader': 2,
    'admin': 3,
    'dev': 4,
  };
  
  return hierarchy[userPermission] >= hierarchy[requiredPermission];
}

// Проверка: является ли пользователь dev
export function isDev(permission: PermissionLevel): boolean {
  return permission === 'dev';
}

// Получить читаемое название роли
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'Admin',
    teamleader: 'Team Leader',
    supervisor: 'Supervisor',
    super_bg: 'Super BG',
    moderator: 'Moderator',
    junior: 'Junior',
  };
  
  return labels[role] || role;
}