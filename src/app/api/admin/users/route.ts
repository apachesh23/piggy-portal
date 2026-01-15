import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - получить всех пользователей
export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 });
  }
}

// POST - сохранить/обновить пользователей
export async function POST(request: Request) {
  try {
    const { users } = await request.json();

    for (const user of users) {
      if (user.isNew && user.id === null) {
        // Создание нового пользователя
        const { error } = await supabase.from('users').insert({
          username: user.username,
          discord_id: user.discord_id,
          role: user.role,
          permission_level: user.permission_level,
          teamleader_id: user.teamleader_id,
          is_active: user.is_active,
        });

        if (error) throw error;
      } else {
        // Обновление существующего
        const { error } = await supabase
          .from('users')
          .update({
            username: user.username,
            discord_id: user.discord_id,
            role: user.role,
            permission_level: user.permission_level,
            teamleader_id: user.teamleader_id,
            is_active: user.is_active,
          })
          .eq('id', user.id);

        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save users error:', error);
    return NextResponse.json({ error: 'Failed to save users' }, { status: 500 });
  }
}