import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css'; // ← Добавили стили
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'Piggy Portal',
  description: 'Team management portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <MantineProvider>
            <Notifications position="bottom-right" zIndex={1000} /> {/* ← Добавили position */}
            {children}
          </MantineProvider>
        </Providers>
      </body>
    </html>
  );
}