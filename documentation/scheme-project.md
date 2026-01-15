piggy-portal/
├── src/
│   ├── app/                          # App Router (Next.js 13+)
│   │   ├── (auth)/                   
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/              
│   │   │   ├── statistics/
│   │   │   │   └── page.tsx
│   │   │   ├── leaderboard/
│   │   │   │   └── page.tsx
│   │   │   ├── teams/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (teamleader)/             
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── time-worked/
│   │   │   │   └── page.tsx
│   │   │   ├── weekend/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (admin)/                  
│   │   │   ├── panel/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dev)/                    
│   │   │   ├── system/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/                      
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   ├── users/
│   │   │   ├── statistics/
│   │   │   ├── leaderboard/
│   │   │   ├── notifications/
│   │   │   └── cron/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── features/                     # Фичи с их логикой
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   └── LoginForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── statistics/
│   │   │   ├── components/
│   │   │   │   ├── RankProgress.tsx
│   │   │   │   ├── AchievementsList.tsx
│   │   │   │   └── StatsCharts.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useStatistics.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── leaderboard/
│   │   │   ├── components/
│   │   │   │   ├── TopThreeBanner.tsx
│   │   │   │   └── LeaderboardTable.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useLeaderboard.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── teams/
│   │   │   ├── components/
│   │   │   │   └── TeamTree.tsx
│   │   │   └── types.ts
│   │   │
│   │   ├── admin/
│   │   │   ├── components/
│   │   │   │   ├── UserTable.tsx
│   │   │   │   └── UserForm.tsx
│   │   │   └── types.ts
│   │   │
│   │   ├── teamleader/
│   │   │   ├── components/
│   │   │   │   ├── TeamSelector.tsx
│   │   │   │   ├── TimeWorkedTable.tsx
│   │   │   │   └── WeekendCalendar.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useTeamData.ts
│   │   │   └── types.ts
│   │   │
│   │   └── notifications/
│   │       ├── components/
│   │       │   ├── NotificationPanel.tsx
│   │       │   └── NotificationItem.tsx
│   │       ├── hooks/
│   │       │   └── useNotifications.ts
│   │       └── types.ts
│   │
│   ├── shared/                       # Общие компоненты/утилиты
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── AppShell.tsx
│   │   │   │   ├── Topbar.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── UserAvatar.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── usePermissions.ts
│   │   │   └── useUser.ts
│   │   │
│   │   └── ui/                       # Только если нужны кастомные обертки над Mantine
│   │       └── CustomChart.tsx
│   │
│   ├── lib/                          # Утилиты и конфигурации
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── types.ts
│   │   ├── discord/
│   │   │   └── auth.ts
│   │   ├── google-calendar/
│   │   │   └── api.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── date.ts
│   │   └── constants/
│   │       ├── roles.ts
│   │       ├── achievements.ts
│   │       └── ranks.ts
│   │
│   ├── services/                     # API сервисы
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   ├── statistics.service.ts
│   │   ├── leaderboard.service.ts
│   │   ├── notifications.service.ts
│   │   └── cron.service.ts
│   │
│   ├── styles/                       
│   │   ├── globals.css
│   │   └── theme.ts                  # Mantine theme customization
│   │
│   ├── i18n/                         
│   │   ├── locales/
│   │   │   ├── en/
│   │   │   │   ├── common.json
│   │   │   │   ├── statistics.json
│   │   │   │   ├── leaderboard.json
│   │   │   │   ├── admin.json
│   │   │   │   └── teamleader.json
│   │   │   ├── ru/
│   │   │   └── ua/
│   │   └── config.ts
│   │
│   └── middleware.ts                 
│
├── public/                           
│   ├── images/
│   │   ├── ranks/
│   │   ├── achievements/
│   │   └── default-avatar.png
│   └── locales/                      # Если i18next требует public folder
│
├── supabase/                         
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   ├── functions/                    
│   │   ├── calculate-daily-stats/
│   │   ├── calculate-weekly-stats/
│   │   └── send-notifications/
│   └── seed.sql
│
├── scripts/                          
│   └── generate-supabase-types.ts
│
├── .env.local
├── .env.example
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md