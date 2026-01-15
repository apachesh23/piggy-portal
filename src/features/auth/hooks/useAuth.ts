'use client';

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import type { UserRole, PermissionLevel } from '@/lib/constants/roles';

export type AuthUser = {
  id: number;
  discord_id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  permission_level: PermissionLevel;
};

export function useAuth() {
  const { data: session, status } = useSession();

  const user: AuthUser | null = session?.user ? {
    id: session.user.id,
    discord_id: session.user.discord_id,
    username: session.user.username,
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image,
    role: session.user.role,
    permission_level: session.user.permission_level,
  } : null;

  const logout = async () => {
    await nextAuthSignOut({ callbackUrl: '/login' });
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading: status === 'loading',
    logout,
  };
}