import NextAuth, { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email',
        },
      },
    }),
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 дней
    updateAge: 10 * 60, // 10 минут
  },

  callbacks: {
    async signIn({ account, profile }: any) {
      if (account?.provider === 'discord') {
        try {
          const discordId = account.providerAccountId.toString();
          const discordDisplayName = (profile as any)?.global_name || (profile as any)?.username || 'Unknown';
          const discordAvatar = (profile as any)?.avatar 
            ? `https://cdn.discordapp.com/avatars/${discordId}/${(profile as any).avatar}.png` 
            : null;
    
          // Проверяем существует ли пользователь
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('discord_id', discordId)
            .single();
    
          if (existingUser) {
            // Проверка is_active
            if (!existingUser.is_active) {
              console.log(`❌ Login blocked: User ${existingUser.username} is disabled`);
              return false;
            }
    
            console.log('✅ User found:', existingUser.username);
            
            // ✅ ИСПРАВЛЕНО: Обновляем только Discord-данные, НЕ трогаем username!
            await supabase
              .from('users')
              .update({ 
                discord_username: discordDisplayName,
                discord_avatar: discordAvatar,
                last_login_at: new Date().toISOString()
              })
              .eq('discord_id', discordId);
            
            return true;
          }
    
          // Новый пользователь - используем Discord имя как начальное username
          console.log('🆕 Creating new user:', discordDisplayName);
          const { error } = await supabase.from('users').insert({
            discord_id: discordId,
            username: discordDisplayName,
            discord_username: discordDisplayName,
            discord_avatar: discordAvatar,
            role: 'junior',
            permission_level: 'tangiblee_partner',
            is_active: true,
          });
    
          if (error) throw error;
          return true;
        } catch (error) {
          console.error('❌ SignIn error:', error);
          return false;
        }
      }
      return true;
    },
    
    async session({ session, token }: any) {
      console.log('🔄 Session callback called!');
    
      if (session.user) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('discord_id', token.sub)
            .single();
    
          console.log('👤 User from DB:', userData?.username, 'is_active:', userData?.is_active);
    
          if (userData) {
            // Проверка is_active
            if (!userData.is_active) {
              console.log(`❌ Session blocked: User ${userData.username} is disabled`);
              return null;
            }
    
            session.user = {
              id: userData.id,
              discord_id: userData.discord_id,
              username: userData.username,
              name: userData.username,
              email: session.user.email || '',
              image: userData.discord_avatar || session.user.image || '',
              role: userData.role,
              permission_level: userData.permission_level,
              is_active: userData.is_active,
            };
          }
        } catch (error) {
          console.error('❌ Session error:', error);
          return null;
        }
      }
      return session;
    },
    
    async jwt({ token, account }: any) {
      if (account) {
        token.sub = account.providerAccountId;
        
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('permission_level, role, is_active')
            .eq('discord_id', account.providerAccountId.toString())
            .single();
          
          if (userData) {
            token.permission_level = userData.permission_level;
            token.role = userData.role;
            token.is_active = userData.is_active;
          }
        } catch (error) {
          console.error('❌ JWT error:', error);
        }
      }
      return token;
    },
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };