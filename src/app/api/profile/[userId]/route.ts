import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();
    const { userId } = params;

    // Получаем публичные данные пользователя
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        discord_id,
        username,
        avatar_url,
        role,
        is_active,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Проверяем, активен ли пользователь
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'User profile is not available' },
        { status: 404 }
      );
    }

    // TODO: Добавить получение статистики пользователя
    // Например: количество задач, очки, ранг и т.д.
    
    // Возвращаем только публичную информацию
    const publicProfile = {
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      discord_link: user.discord_id, // Можно форматировать как username#discriminator
      role: user.role,
      created_at: user.created_at,
      // Заглушки для статистики - заменить на реальные данные
      stats: {
        rank: 'Gold III',
        total_points: 0,
        tasks_completed: 0,
        achievements: 0,
      },
    };

    return NextResponse.json(publicProfile);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}