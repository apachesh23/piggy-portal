'use client';

import { Card, Code, Group, ScrollArea, Stack, Tabs, Text, Title } from '@mantine/core';

const LOGS = {
  ingest: [
    '[2026-01-17 02:00:00] start ingest (cron)',
    '[2026-01-17 02:00:04] fetched 128342 rows',
    '[2026-01-17 02:02:14] wrote raw_* tables',
    '[2026-01-17 02:02:14] done',
  ],
  recalc: [
    '[2026-01-17 02:05:00] start recalc (cron)',
    '[2026-01-17 02:05:09] error: missing raw partition',
  ],
  manual: [
    '[2026-01-16 20:00:00] start manual run (both)',
    '[2026-01-16 20:02:10] ingest: ok',
    '[2026-01-16 20:05:12] recalc: ok',
    '[2026-01-16 20:05:12] done',
  ],
} as const;

export function LogViewer() {
  return (
    <Card padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={3}>Log viewer</Title>
            <Text c="var(--color-foreground-muted)" size="sm" mt={4}>
              Просмотр коротких логов по джобам (пока моковые строки).
            </Text>
          </div>
        </Group>

        <Tabs defaultValue="ingest" variant="outline">
          <Tabs.List>
            <Tabs.Tab value="ingest">Ingest</Tabs.Tab>
            <Tabs.Tab value="recalc">Recalc</Tabs.Tab>
            <Tabs.Tab value="manual">Manual</Tabs.Tab>
          </Tabs.List>

          {(['ingest', 'recalc', 'manual'] as const).map((key) => (
            <Tabs.Panel key={key} value={key} pt="md">
              <ScrollArea h={160}>
                <Stack gap={6}>
                  {LOGS[key].map((line, idx) => (
                    <Code key={idx} block>
                      {line}
                    </Code>
                  ))}
                </Stack>
              </ScrollArea>
            </Tabs.Panel>
          ))}
        </Tabs>
      </Stack>
    </Card>
  );
}
