import { Card, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconActivity, IconCloudUp, IconDatabase, IconGitCommit } from '@tabler/icons-react';

const ITEMS = [
  { title: 'DB', value: 'Connected', hint: 'Latency: 34ms', icon: IconDatabase },
  { title: 'Workers', value: 'OK', hint: 'Queue: 0', icon: IconActivity },
  { title: 'Ingest endpoint', value: 'Reachable', hint: 'Last check: 2m ago', icon: IconCloudUp },
  { title: 'Version', value: 'staging', hint: 'Commit: a1b2c3d', icon: IconGitCommit },
];

export function HealthPanel() {
  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Health</Title>
        <Text c="var(--color-foreground-muted)" size="sm" mt={4}>
          Быстрые индикаторы состояния окружения.
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        {ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} padding="lg" radius="md" withBorder>
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <div>
                  <Text size="xs" c="var(--color-foreground-muted)">
                    {item.title}
                  </Text>
                  <Text fw={700} mt={4} style={{ color: 'var(--color-foreground)' }}>
                    {item.value}
                  </Text>
                  <Text size="xs" c="var(--color-foreground-muted)" mt={6}>
                    {item.hint}
                  </Text>
                </div>
                <Icon size={18} style={{ color: 'var(--color-accent)' }} />
              </Group>
            </Card>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
