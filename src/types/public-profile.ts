// Типы для публичного профиля пользователя

export interface PublicUserProfile {
    id: string;
    username: string;
    avatar_url: string;
    discord_link: string;
    role: string;
    created_at: string;
    stats: UserStats;
  }
  
  export interface UserStats {
    rank: string;
    total_points: number;
    tasks_completed: number;
    achievements: number;
  }
  
  // Расширенная версия для будущего функционала
  export interface DetailedPublicProfile extends PublicUserProfile {
    badges?: Badge[];
    recent_activity?: Activity[];
    team?: TeamInfo;
  }
  
  export interface Badge {
    id: string;
    name: string;
    description: string;
    icon_url: string;
    earned_at: string;
  }
  
  export interface Activity {
    id: string;
    type: 'task_completed' | 'achievement_earned' | 'rank_up';
    description: string;
    timestamp: string;
  }
  
  export interface TeamInfo {
    id: string;
    name: string;
    role: 'member' | 'leader';
  }