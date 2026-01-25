'use client';

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Loader,
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
  IconRefresh,
} from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';

import type { RecalcMode } from '../types';
import { RunDetailsDrawer } from './RunDetailsDrawer';

// ===========================================
// Типы
// ===========================================

type Props = {
  onDetailsClick: () => void;
};

type ModeStats = {
  pipeline: 'recalc';
  mode: RecalcMode;
  last_run: string | null;
  last_trigger: 'cron' | 'manual' | null;
  last_status: 'running' | 'success' | 'error' | null;
  last_duration_ms: number | null;
  last_rows: number | null;
  last_error: string | null;
  cron_enabled: boolean;
  cron_schedule: string;
  is_running: boolean;
  running_since: string | null;
};

type RecentRun = {
  id: string;
  started_at: string;
  mode: string;
  trigger: 'cron' | 'manual';
  status: 'running' | 'success' | 'error';
};

// ===========================================
// Хелперы
// ===========================================

function statusBadge(stats: ModeStats | null) {
  if (!stats) {
    return (
      <Badge variant="light" style={{ color: 'var(--color-foreground-muted)' }}>
        Loading
      </Badge>
    );
  }

  if (stats.is_running) {
    return (
      <Badge variant="light" style={{ color: 'var(--color-accent)', background: 'rgba(217, 29, 84, 0.10)' }}>
        Running
      </Badge>
    );
  }

  switch (stats.last_status) {
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

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  return iso.replace('T', ' ').replace('Z', '').slice(0, 19);
}

// ===========================================
// Компонент
// ===========================================

export function RecalcCard({ onDetailsClick }: Props) {
  const [mode, setMode] = useState<RecalcMode>('aggregate');
  const [manualFrom, setManualFrom] = useState<string | null>(null);
  const [manualTo, setManualTo] = useState<string | null>(null);

  // API state
  const [statsMap, setStatsMap] = useState<Record<RecalcMode, ModeStats | null>>({
    aggregate: null,
    corrections: null,
  });
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);

  // Action loading states
  const [runLoading, setRunLoading] = useState(false);
  const [cronLoading, setCronLoading] = useState(false);

  // Drawer
  const [detailsOpened, setDetailsOpened] = useState(false);

  // ===========================================
  // Fetch functions
  // ===========================================

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/pipelines/stats?pipeline=recalc', { cache: 'no-store' });
      const json = await res.json();

      if (json.ok && Array.isArray(json.data)) {
        const map: Record<RecalcMode, ModeStats | null> = {
          aggregate: null,
          corrections: null,
        };
        for (const item of json.data) {
          if (item.mode === 'aggregate' || item.mode === 'corrections') {
            map[item.mode as RecalcMode] = item;
          }
        }
        setStatsMap(map);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchRecentRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/pipelines/runs?pipeline=recalc&limit=10', { cache: 'no-store' });
      const json = await res.json();

      if (json.ok && Array.isArray(json.data)) {
        setRecentRuns(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch recent runs:', err);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    setStatsLoading(true);
    setRecentLoading(true);
    fetchStats();
    fetchRecentRuns();
  }, [fetchStats, fetchRecentRuns]);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchRecentRuns();
  }, [fetchStats, fetchRecentRuns]);

  // ===========================================
  // Actions
  // ===========================================

  async function runManual() {
    if (!manualFrom || !manualTo) return;

    setRunLoading(true);
    try {
      // manualFrom/manualTo это строки вида "2026-01-01T00:00:00"
      // Добавляем Z чтобы сервер воспринял как UTC
      const rangeFrom = manualFrom.endsWith('Z') ? manualFrom : `${manualFrom}Z`;
      const rangeTo = manualTo.endsWith('Z') ? manualTo : `${manualTo}Z`;

      const res = await fetch('/api/pipelines/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipeline: 'recalc',
          mode,
          trigger: 'manual',
          range_from: rangeFrom,
          range_to: rangeTo,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        console.error('Run failed:', json.error);
      }

      // Refresh data
      refreshAll();
    } catch (err) {
      console.error('Run error:', err);
    } finally {
      setRunLoading(false);
    }
  }

  async function toggleCron() {
    const currentStats = statsMap[mode];
    if (!currentStats) return;

    setCronLoading(true);
    try {
      const res = await fetch('/api/pipelines/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipeline: 'recalc',
          mode,
          cron_enabled: !currentStats.cron_enabled,
        }),
      });

      const json = await res.json();

      if (json.ok) {
        setStatsMap((prev) => ({
          ...prev,
          [mode]: {
            ...prev[mode]!,
            cron_enabled: !currentStats.cron_enabled,
          },
        }));
      } else {
        console.error('Toggle failed:', json.error);
      }
    } catch (err) {
      console.error('Toggle error:', err);
    } finally {
      setCronLoading(false);
    }
  }

  // ===========================================
  // Derived state
  // ===========================================

  const stats = statsMap[mode];
  const cronEnabled = stats?.cron_enabled ?? false;
  const canRunManual = Boolean(manualFrom && manualTo) && !runLoading && !stats?.is_running;

  // ===========================================
  // Render
  // ===========================================

  return (
    <>
      <Card padding="lg" radius="md" withBorder style={{ maxWidth: 1200, height: 540, overflow: 'hidden' }}>
        <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
          {/* Left Column: Controls */}
          <Stack gap="md" style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
            <div>
              <Group gap="sm" align="center">
                <Title order={4} style={{ color: 'var(--color-foreground)' }}>
                  Recalc / Aggregate
                </Title>
                {statusBadge(stats)}
                {statsLoading && <Loader size="xs" />}
              </Group>
              <Text c="var(--color-foreground-muted)" size="sm" mt={6}>
                Считает статистику по raw-данным и сохраняет результат.
              </Text>
            </div>

            <SegmentedControl
              value={mode}
              onChange={(value) => setMode(value as RecalcMode)}
              size="xl"
              data={[
                {
                  label: (
                    <Group gap={6} wrap="nowrap">
                      {statsMap.aggregate?.cron_enabled ? (
                        <IconCircleCheckFilled size={16} style={{ color: 'var(--color-accent)' }} />
                      ) : (
                        <IconCircle size={16} style={{ color: 'var(--color-foreground-muted)' }} />
                      )}
                      <Text size="sm">Aggregate</Text>
                    </Group>
                  ),
                  value: 'aggregate',
                },
                {
                  label: (
                    <Group gap={6} wrap="nowrap">
                      {statsMap.corrections?.cron_enabled ? (
                        <IconCircleCheckFilled size={16} style={{ color: 'var(--color-accent)' }} />
                      ) : (
                        <IconCircle size={16} style={{ color: 'var(--color-foreground-muted)' }} />
                      )}
                      <Text size="sm">Corrections</Text>
                    </Group>
                  ),
                  value: 'corrections',
                },
              ]}
              fullWidth
            />

            {stats?.last_error ? (
              <Text size="xs" c="red">
                {stats.last_error}
              </Text>
            ) : null}

            <SimpleGrid cols={2} spacing="xs">
              <div>
                <Text size="xs" c="var(--color-foreground-muted)">
                  Last run
                </Text>
                <Group gap={8}>
                  <Text fw={600} size="sm" style={{ color: 'var(--color-foreground)' }}>
                    {fmtTime(stats?.last_run ?? null)}
                  </Text>
                  {stats?.last_trigger ? (
                    <Badge size="xs" variant="light" style={{ color: 'var(--color-foreground-muted)' }}>
                      {stats.last_trigger}
                    </Badge>
                  ) : null}
                </Group>
              </div>

              <div>
                <Text size="xs" c="var(--color-foreground-muted)">
                  Next schedule
                </Text>
                <Text fw={600} size="sm" style={{ color: 'var(--color-foreground)' }}>
                  {cronEnabled ? stats?.cron_schedule ?? '—' : '—'}
                </Text>
              </div>

              <div>
                <Text size="xs" c="var(--color-foreground-muted)">
                  Last rows processed
                </Text>
                <Text fw={600} size="sm" style={{ color: 'var(--color-foreground)' }}>
                  {stats?.last_rows?.toLocaleString() ?? '—'}
                </Text>
              </div>

              <div>
                <Text size="xs" c="var(--color-foreground-muted)">
                  Last duration
                </Text>
                <Text fw={600} size="sm" style={{ color: 'var(--color-foreground)' }}>
                  {fmtDuration(stats?.last_duration_ms ?? null)}
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
                      color: cronEnabled ? 'var(--color-accent)' : 'var(--color-foreground-muted)',
                    }}
                  >
                    {cronEnabled ? 'running' : 'paused'}
                  </Badge>
                </Group>

                <Group gap={8}>
                  <Text size="xs" c="var(--color-foreground-muted)">
                    {stats?.cron_schedule ?? '—'}
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
                leftSection={cronEnabled ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                onClick={toggleCron}
                style={{
                  borderColor: 'var(--color-accent)',
                  color: 'var(--color-accent)',
                }}
              >
                {cronEnabled ? 'Pause cron' : 'Resume cron'}
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
                loading={runLoading}
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
            <Group justify="space-between" align="center">
              <Title order={4} style={{ color: 'var(--color-foreground)' }}>
                Recent activity
              </Title>
              <ActionIcon variant="subtle" size="sm" onClick={refreshAll} loading={recentLoading}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Group>

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
                  {recentRuns.length === 0 && !recentLoading ? (
                    <Table.Tr>
                      <Table.Td colSpan={3}>
                        <Text size="xs" c="dimmed" ta="center">
                          No runs yet
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    recentRuns.map((item) => (
                      <Table.Tr key={item.id}>
                        <Table.Td>
                          <Text size="xs">{fmtTime(item.started_at)}</Text>
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
                    ))
                  )}
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
        title="Recalc / Aggregate Details"
        pipeline="recalc"
      />
    </>
  );
}