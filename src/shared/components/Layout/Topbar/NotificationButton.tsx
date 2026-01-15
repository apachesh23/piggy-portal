'use client';

import { ActionIcon, Indicator } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import classes from './Topbar.module.css';

export function NotificationButton() {
  const hasNotifications = false; // Потом подключишь реальные уведомления

  return (
    <Indicator 
      inline 
      size={8} 
      offset={8} 
      position="top-end" 
      color="red" 
      disabled={!hasNotifications}
      withBorder
    >
      <ActionIcon 
        variant="subtle" 
        size={60} 
        className={classes.notificationButton}
        onClick={() => console.log('Notifications clicked')}
      >
        <IconBell size={20} stroke={1.5} />
      </ActionIcon>
    </Indicator>
  );
}