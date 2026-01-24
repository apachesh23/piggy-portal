'use client';

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  ScrollArea,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import {
  IconCircle,
  IconCircleCheckFilled,
  IconEdit,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerTrackNext,
} from '@tabler/icons-react';
import { useState } from 'react';

// Импорты типов из правильных мест
import type { IngestionMode, ModeStats, RecentActivityItem } from '../types';
import { RunDetailsDrawer } from './RunDetailsDrawer';

// Локальный тип Props для компонента
type Props = {
  onDetailsClick: () => void;
};

// Mock данные
const MOCK_STATS: Record<IngestionMode, ModeStats> = {
  raw: {
    lastRun: '2026-01-20 14:00:00',
    lastTrigger: 'cron',
    lastDuration: 134000,
    lastRows: 128342,
    lastError: null,
    status: 'success',
    cronStatus: 'running',
    cronSchedule: '0 */1 * * *',
    nextRun: '2026-01-20 15:00:00',
  },
  corrections: {
    lastRun: '2026-01-20 13:00:00',
    lastTrigger: 'manual',
    lastDuration: 89000,
    lastRows: 45123,
    lastError: null,
    status: 'success',
    cronStatus: 'paused',
    cronSchedule: '0 */2 * * *',
    nextRun: null,
  },
  defects: {
    lastRun: null,
    lastTrigger: null,
    lastDuration: null,
    lastRows: null,
    lastError: null,
    status: 'idle',
    cronStatus: 'paused',
    cronSchedule: '0 */3 * * *',
    nextRun: null,
  },
};

const MOCK_RECENT: RecentActivityItem[] = [
  { id: '1', time: '2026-01-20 14:00:00', mode: 'raw', trigger: 'cron' },
  { id: '2', time: '2026-01-20 13:00:00', mode: 'corrections', trigger: 'manual' },
  { id: '3', time: '2026-01-20 12:00:00', mode: 'raw', trigger: 'cron' },
  { id: '4', time: '2026-01-20 11:00:00', mode: 'raw', trigger: 'cron' },
  { id: '5', time: '2026-01-20 10:00:00', mode: 'corrections', trigger: 'cron' },
  { id: '6', time: '2026-01-20 09:00:00', mode: 'raw', trigger: 'cron' },
];

function statusBadge(status: ModeStats['status']) {
  switch (status) {
    case 'running':
      return (
        <Badge variant="light" style={{ color: 'var(--color-accent)', background: 'rgba(217, 29, 84, 0.10)' }}>
          Running
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="light" color="red">
          Error
        </Badge>
      );
    case 'success':
      return (
        <Badge variant="light" color="green">
          Success
        </Badge>
      );
    case 'idle':
    default:
      return (
        <Badge variant="light" style={{ color: 'var(--color-foreground-muted)' }}>
          Idle
        </Badge>
      );
  }
}

function fmtDuration(ms: number | null) {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

export function DataIngestionCard({ onDetailsClick }: Props) {
  const [mode, setMode] = useState<IngestionMode>('raw');
  const [manualFrom, setManualFrom] = useState<string | null>(null);
  const [manualTo, setManualTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cronLoading, setCronLoading] = useState(false);
  const [detailsOpened, setDetailsOpened] = useState(false);

  // Track cron status per mode (mutable state for UI demo)
  const [cronStatuses, setCronStatuses] = useState<Record<IngestionMode, 'running' | 'paused'>>({
    raw: MOCK_STATS.raw.cronStatus,
    corrections: MOCK_STATS.corrections.cronStatus,
    defects: MOCK_STATS.defects.cronStatus,
  });

  const stats = MOCK_STATS[mode];
  const currentCronStatus = cronStatuses[mode];

  async function runManual() {
    if (!manualFrom || !manualTo) return;
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      console.log('Running manual:', { mode, manualFrom, manualTo });
    } finally {
      setLoading(false);
    }
  }

  async function toggleCron() {
    setCronLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      // Toggle the cron status for current mode
      setCronStatuses((prev) => ({
        ...prev,
        [mode]: prev[mode] === 'running' ? 'paused' : 'running',
      }));
      console.log('Toggle cron:', { mode, newStatus: currentCronStatus === 'running' ? 'paused' : 'running' });
    } finally {
      setCronLoading(false);
    }
  }

  const canRunManual = Boolean(manualFrom && manualTo);

  return (
    <>
      <Card padding="lg" radius="md" withBorder style={{ maxWidth: 1200, height: 540, overflow: 'hidden' }}>
        <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
          {/* Left Column: Controls */}
          <Stack gap="md" style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
            <div>
              <Group gap="sm" align="center">
                <Title order={4} style={{ color: 'var(--color-foreground)' }}>
                  Data Ingestion
                </Title>
                {statusBadge(stats.status)}
              </Group>
              <Text c="var(--color-foreground-muted)" size="sm" mt={6}>
                Забирает сырые данные и пишет их в raw-таблицы.
              </Text>
            </div>

            <SegmentedControl
              value={mode}
              onChange={(value) => setMode(value as IngestionMode)}
              size="xl"
              data={[
                {
                  label: (
                    <Group gap={6} wrap="nowrap">
                      {cronStatuses.raw === 'running' ? (
                        <IconCircleCheckFilled size={16} style={{ color: 'var(--color-accent)' }} />
                      ) : (
                        <IconCircle size={16} style={{ color: 'var(--color-foreground-muted)' }} />
                      )}
                      <Text size="sm">Raw</Text>
                    </Group>
                  ),
                  value: 'raw',
                },
                {
                  label: (
                    <Group gap={6} wrap="nowrap">
                      {cronStatuses.corrections === 'running' ? (
                        <IconCircleCheckFilled size={16} style={{ color: 'var(--color-accent)' }} />
                      ) : (
                        <IconCircle size={16} style={{ color: 'var(--color-foreground-muted)' }} />
                      )}
                      <Text size="sm">Corrections</Text>
                    </Group>
                  ),
                  value: 'corrections',
                },
                {
                  label: (
                    <Group gap={6} wrap="nowrap">
                      {cronStatuses.defects === 'running' ? (
                        <IconCircleCheckFilled size={16} style={{ color: 'var(--color-accent)' }} />
                      ) : (
                        <IconCircle size={16} style={{ color: 'var(--color-foreground-muted)' }} />
                      )}
                      <Text size="sm">Defects</Text>
                    </Group>
                  ),
                  value: 'defects',
                },
              ]}
              fullWidth
            />

            {stats.lastError ? (
              <Text size="xs" c="red">
                {stats.lastError}
              </Text>
            ) : null}

            <SimpleGrid cols={2} spacing="xs">
              <div>
                <Text size="xs" c="var(--color-foreground-muted)">
                  Last run
                </Text>
                <Group gap={8}>
                  <Text fw={600} size="sm" style={{ color: 'var(--color-foreground)' }}>
                    {stats.lastRun ?? '—'}
                  </Text>
                  {stats.lastTrigger ? (
                    <Badge size="xs" variant="light" style={{ color: 'var(--color-foreground-muted)' }}>
                      {stats.lastTrigger}
                    </Badge>
                  ) : null}
                </Group>
              </div>

              <div>
                <Text size="xs" c="var(--color-foreground-muted)">
                  Next schedule
                </Text>
                <Text fw={600} size="sm" style={{ color: 'var(--color-foreground)' }}>
                  {stats.nextRun ?? '—'}
                </Text>
              </div>

              <div>
                <Text size="xs" c="var(--color-foreground-muted)">
                  Last rows processed
                </Text>
                <Text fw={600} size="sm" style={{ color: 'var(--color-foreground)' }}>
                  {stats.lastRows?.toLocaleString() ?? '—'}
                </Text>
              </div>

              <div>
                <Text size="xs" c="var(--color-foreground-muted)">
                  Last duration
                </Text>
                <Text fw={600} size="sm" style={{ color: 'var(--color-foreground)' }}>
                  {fmtDuration(stats.lastDuration)}
                </Text>
              </div>
            </SimpleGrid>

            <Divider />

            <div>
              <Group justify="space-between" align="flex-start" mb="sm">
                <Group gap="xs">
                  <Text fw={600} size="sm" style={{ color: 'var(--color-foreground)' }}>
                    Cron status
                  </Text>
                  <Badge
                    size="xs"
                    variant="light"
                    style={{
                      color: currentCronStatus === 'running' ? 'var(--color-accent)' : 'var(--color-foreground-muted)',
                    }}
                  >
                    {currentCronStatus}
                  </Badge>
                </Group>
                
                <Group gap={8}>
                  <Text size="xs" c="var(--color-foreground-muted)">
                    {stats.cronSchedule}
                  </Text>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    style={{ color: 'var(--color-foreground-muted)' }}
                    onClick={() => console.log('Edit schedule for', mode)}
                  >
                    <IconEdit size={14} />
                  </ActionIcon>
                </Group>
              </Group>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                loading={cronLoading}
                leftSection={
                  currentCronStatus === 'running' ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />
                }
                onClick={toggleCron}
                style={{
                  borderColor: 'var(--color-accent)',
                  color: 'var(--color-accent)',
                }}
              >
                {currentCronStatus === 'running' ? 'Pause cron' : 'Resume cron'}
              </Button>
            </div>

            <Divider />

            <div>
              <Text fw={600} size="sm" mb="sm" style={{ color: 'var(--color-foreground)' }}>
                Manual run
              </Text>
              <Group gap="sm" mb="sm" align="flex-start">
                <DateTimePicker
                  label="From"
                  placeholder="Pick date & time"
                  value={manualFrom}
                  onChange={setManualFrom}
                  clearable
                  size="sm"
                  style={{ flex: 1 }}
                  styles={{ label: { color: 'var(--color-foreground-muted)' } }}
                />
                <DateTimePicker
                  label="To"
                  placeholder="Pick date & time"
                  value={manualTo}
                  onChange={setManualTo}
                  clearable
                  size="sm"
                  style={{ flex: 1 }}
                  styles={{ label: { color: 'var(--color-foreground-muted)' } }}
                />
              </Group>
              <Button
                variant="filled"
                size="sm"
                fullWidth
                disabled={!canRunManual}
                loading={loading}
                leftSection={<IconPlayerTrackNext size={16} />}
                onClick={runManual}
                style={{
                  ...(canRunManual
                    ? { backgroundColor: 'var(--color-accent)', color: 'white' }
                    : {}),
                }}
              >
                Run manual
              </Button>
            </div>
          </Stack>

          {/* Vertical Divider */}
          <Divider orientation="vertical" />

          {/* Right Column: Recent Activity Table */}
          <Stack
            gap="md"
            style={{
              width: 450,
              paddingLeft: 24,
              height: '100%',
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <Title order={4} style={{ color: 'var(--color-foreground)' }}>
              Recent activity
            </Title>

            <ScrollArea offsetScrollbars scrollbarSize={4} style={{ flex: 1, minHeight: 0 }}>
              <Table striped highlightOnHover withTableBorder withColumnBorders stickyHeader style={{ fontSize: '12px' }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Time</Table.Th>
                    <Table.Th>Mode</Table.Th>
                    <Table.Th>Trigger</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {MOCK_RECENT.map((item) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <Text size="xs">{item.time}</Text>
                      </Table.Td>

                      <Table.Td>
                        <Badge size="xs" variant="light" style={{ color: 'var(--color-accent)' }}>
                          {item.mode}
                        </Badge>
                      </Table.Td>

                      <Table.Td>
                        <Badge size="xs" variant="light" style={{ color: 'var(--color-foreground-muted)' }}>
                          {item.trigger}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Button
              variant="subtle"
              size="sm"
              fullWidth
              onClick={() => setDetailsOpened(true)}
              style={{ flexShrink: 0, color: 'var(--color-accent)' }}
            >
              Details
            </Button>
          </Stack>
        </div>
      </Card>

      <RunDetailsDrawer
        opened={detailsOpened}
        onClose={() => setDetailsOpened(false)}
        title="Data Ingestion Details"
        pipeline="ingest"
      />
    </>
  );
}