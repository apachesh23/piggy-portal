import 'next-auth';
import { UserRole, PermissionLevel } from '@/lib/constants/roles';

declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      discord_id: string;
      username: string;
      name: string;
      email: string;
      image: string;
      role: UserRole;
      permission_level: PermissionLevel;
      is_active: boolean; // ← Добавили
    };
  }

  interface User {
    id: number;
    discord_id: string;
    username: string;
    role: UserRole;
    permission_level: PermissionLevel;
    is_active: boolean; // ← Добавили
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub: string;
    permission_level: PermissionLevel;
    role: UserRole;
    is_active: boolean; // ← Добавили
  }
}