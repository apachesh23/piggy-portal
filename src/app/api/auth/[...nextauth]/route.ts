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
  
  // ✅ ДОБАВЬ ЭТОТ БЛОК:
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 дней - сколько живет session
    updateAge: 10 * 60,          // 5 минут - как часто обновляется
  },

  callbacks: {
    async signIn({ account, profile }: any) {
      if (account?.provider === 'discord') {
        try {
          const discordId = account.providerAccountId.toString();
          const username = (profile as any)?.global_name || (profile as any)?.username || 'Unknown';
    
          // Проверяем существует ли пользователь
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('discord_id', discordId)
            .single();
    
          if (existingUser) {
            // ✅ НОВОЕ: Проверка is_active
            if (!existingUser.is_active) {
              console.log(`❌ Login blocked: User ${existingUser.username} is disabled`);
              return false; // Блокируем вход!
            }
    
            console.log('✅ User found:', existingUser.username);
            
            // Обновляем username если изменился
            if (existingUser.username !== username) {
              await supabase
                .from('users')
                .update({ username })
                .eq('discord_id', discordId);
            }
            
            return true;
          }
    
          // Новый пользователь
          console.log('🆕 Creating new user:', username);
          const { error } = await supabase.from('users').insert({
            discord_id: discordId,
            username: username,
            role: 'junior',
            permission_level: 'guest',
            is_active: true, // ← Добавили для новых юзеров
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
      console.log('🔄 Session callback called!'); // Для проверки
    
      if (session.user) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('discord_id', token.sub)
            .single();
    
          console.log('👤 User from DB:', userData?.username, 'is_active:', userData?.is_active);
    
          if (userData) {
            // ✅ ДОБАВИЛИ ПРОВЕРКУ!
            if (!userData.is_active) {
              console.log(`❌ Session blocked: User ${userData.username} is disabled`);
              return null; // ← Убиваем сессию!
            }
    
            session.user = {
              id: userData.id,
              discord_id: userData.discord_id,
              username: userData.username,
              name: userData.username,
              email: session.user.email || '',
              image: session.user.image || '',
              role: userData.role,
              permission_level: userData.permission_level,
              is_active: userData.is_active,
            };
          }
        } catch (error) {
          console.error('❌ Session error:', error);
          return null; // ← При ошибке тоже убиваем
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
            .select('permission_level, role, is_active') // ← Добавили is_active
            .eq('discord_id', account.providerAccountId.toString())
            .single();
          
          if (userData) {
            token.permission_level = userData.permission_level;
            token.role = userData.role;
            token.is_active = userData.is_active; // ← Добавили
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