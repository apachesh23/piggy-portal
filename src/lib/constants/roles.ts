export type UserRole = 'tangiblee_partner' | 'junior' | 'moderator' | 'supervisor' | 'super_bg' | 'teamleader' | 'admin';
export type PermissionLevel = 'tangiblee_partner' | 'moderator' | 'teamleader' | 'admin' | 'dev';

export const ROLES = {
  TANGIBLEE_PARTNER: 'tangiblee_partner' as UserRole,
  JUNIOR: 'junior' as UserRole,
  MODERATOR: 'moderator' as UserRole,
  SUPERVISOR: 'supervisor' as UserRole,
  SUPER_BG: 'super_bg' as UserRole,
  TEAMLEADER: 'teamleader' as UserRole,
  ADMIN: 'admin' as UserRole,
};

export const PERMISSIONS = {
  TANGIBLEE_PARTNER: 'tangiblee_partner' as PermissionLevel,
  MODERATOR: 'moderator' as PermissionLevel,
  TEAMLEADER: 'teamleader' as PermissionLevel,
  ADMIN: 'admin' as PermissionLevel,
  DEV: 'dev' as PermissionLevel,
};

// 🎨 ЦВЕТА ДЛЯ РОЛЕЙ (hex) - яркие для UI элементов
export const ROLE_COLORS = {
  admin: '#2ECC71',            // Зеленый
  teamleader: '#E74C3C',       // Красный
  supervisor: '#F1C40F',       // Желтый
  super_bg: '#607D8B',         // Серо-синий
  moderator: '#3498DB',        // Синий
  junior: '#9B59B6',           // Фиолетовый
  tangiblee_partner: '#26A69A', // Морская волна (teal)
} as const;

// 🎨 ПРИГЛУШЁННЫЕ ЦВЕТА ДЛЯ АВАТАРОВ - менее насыщенные версии
export const AVATAR_COLORS = {
  admin: '#5FAD6F',            // Приглушённый зелёный
  teamleader: '#C97B74',       // Приглушённый красный
  supervisor: '#D4B857',       // Приглушённый жёлтый
  super_bg: '#7A8F9C',         // Приглушённый серо-синий
  moderator: '#6BA5C8',        // Приглушённый синий
  junior: '#A87BB8',           // Приглушённый фиолетовый
  tangiblee_partner: '#5FA69F', // Приглушённый teal
} as const;

// 🎨 Mantine цвета (для компонентов Badge, Text и т.д.)
export const ROLE_MANTINE_COLORS = {
  admin: 'green',
  teamleader: 'red',
  supervisor: 'yellow',
  super_bg: 'gray',
  moderator: 'blue',
  junior: 'grape',
  tangiblee_partner: 'cyan',
} as const;

// Функция для получения HEX цвета роли (яркий для UI)
export function getRoleColor(role: UserRole): string {
  return ROLE_COLORS[role] || ROLE_COLORS.tangiblee_partner;
}

// Функция для получения приглушённого цвета для аватара
export function getAvatarColor(role: UserRole): string {
  return AVATAR_COLORS[role] || AVATAR_COLORS.tangiblee_partner;
}

// Функция для получения Mantine цвета
export function getRoleMantineColor(role: UserRole): string {
  return ROLE_MANTINE_COLORS[role] || 'gray';
}

// Получить инициалы из имени (первая буква заглавная)
export function getInitials(name: string): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

// Проверка прав доступа (иерархия)
export function hasPermission(
  userPermission: PermissionLevel, 
  requiredPermission: PermissionLevel
): boolean {
  const hierarchy = {
    'tangiblee_partner': 0,
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
    tangiblee_partner: 'Tangiblee Partner',
  };
  
  return labels[role] || role;
}