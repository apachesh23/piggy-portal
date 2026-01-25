'use client';

import { Badge, Drawer, Group, Loader, ScrollArea, Table, Text, Title, ActionIcon } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type RunRow = {
  id: string;
  pipeline: 'ingest' | 'recalc';
  mode: string;
  trigger: 'cron' | 'manual';
  status: 'running' | 'success' | 'error';
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  rows_processed: number | null;
  error_message: string | null;
  range_from: string | null;
  range_to: string | null;
  meta: Record<string, unknown>;
};

type Props = {
  opened: boolean;
  onClose: () => void;
  title: string;
  pipeline?: 'ingest' | 'recalc';
};

function resultBadge(status: RunRow['status']) {
  if (status === 'success') {
    return (
      <Badge variant="light" style={{ color: 'var(--color-accent)', background: 'rgba(217, 29, 84, 0.10)' }}>
        success
      </Badge>
    );
  }

  if (status === 'running') {
    return (
      <Badge variant="light" style={{ color: 'var(--color-foreground-muted)' }}>
        running
      </Badge>
    );
  }

  return (
    <Badge variant="light" color="red">
      error
    </Badge>
  );
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

export function RunDetailsDrawer({ opened, onClose, title, pipeline }: Props) {
  const [rows, setRows] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Используем новый API endpoint
      const params = new URLSearchParams({ limit: '200' });
      if (pipeline) {
        params.set('pipeline', pipeline);
      }

      const res = await fetch(`/api/pipelines/runs?${params}`, { cache: 'no-store' });
      const json = await res.json();

      if (json.ok) {
        setRows(json.data ?? []);
      } else {
        console.error('Failed to load runs:', json.error);
      }
    } catch (err) {
      console.error('Error loading runs:', err);
    } finally {
      setLoading(false);
    }
  }, [pipeline]);

  useEffect(() => {
    if (!opened) return;
    load();
  }, [opened, load]);

  const filteredRows = useMemo(() => {
    // Фильтрация уже происходит на сервере, но оставим на всякий случай
    if (!pipeline) return rows;
    return rows.filter((r) => r.pipeline === pipeline);
  }, [rows, pipeline]);

  return (
    <Drawer opened={opened} onClose={onClose} title={title} position="bottom" size="xl">
      <Group justify="space-between" align="flex-end" mb="sm">
        <div>
          <Title order={4}>Activity</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Полная история запусков cron/manual из pipeline_runs.
          </Text>
        </div>
        <Group gap="xs">
          {loading && <Loader size="sm" />}
          <ActionIcon variant="subtle" onClick={load} loading={loading}>
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>
      </Group>

      <ScrollArea h="calc(100vh - 180px)">
        <Table striped highlightOnHover withTableBorder withColumnBorders stickyHeader verticalSpacing="sm" horizontalSpacing="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Time</Table.Th>
              <Table.Th>Range (UTC)</Table.Th>
              <Table.Th>Pipeline</Table.Th>
              <Table.Th>Mode</Table.Th>
              <Table.Th>Trigger</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Duration</Table.Th>
              <Table.Th>Rows</Table.Th>
              <Table.Th>Error</Table.Th>
              <Table.Th>ID</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {filteredRows.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>
                  <Text size="sm">{fmtTime(r.started_at)}</Text>
                </Table.Td>

                <Table.Td>
                  <Text size="sm">
                    {r.range_from && r.range_to ? `${fmtTime(r.range_from)} → ${fmtTime(r.range_to)}` : '—'}
                  </Text>
                </Table.Td>

                <Table.Td>
                  <Badge size="xs" variant="light" style={{ color: 'var(--color-accent)' }}>
                    {r.pipeline}
                  </Badge>
                </Table.Td>

                <Table.Td>
                  <Badge size="xs" variant="light" style={{ color: 'var(--color-accent)' }}>
                    {r.mode ?? '—'}
                  </Badge>
                </Table.Td>

                <Table.Td>
                  <Badge size="xs" variant="light" style={{ color: 'var(--color-foreground-muted)' }}>
                    {r.trigger}
                  </Badge>
                </Table.Td>

                <Table.Td>{resultBadge(r.status)}</Table.Td>

                <Table.Td>
                  <Text size="sm">{fmtDuration(r.duration_ms)}</Text>
                </Table.Td>

                <Table.Td>
                  <Text size="sm">{(r.rows_processed ?? 0).toLocaleString()}</Text>
                </Table.Td>

                <Table.Td>
                  <Text size="xs" c={r.status === 'error' ? 'red' : 'dimmed'} lineClamp={2}>
                    {r.error_message ?? '—'}
                  </Text>
                </Table.Td>

                <Table.Td>
                  <Text size="xs" c="dimmed">
                    {r.id.slice(0, 8)}...
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}

            {!loading && filteredRows.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={10}>
                  <Text size="sm" c="dimmed" ta="center" py="xl">
                    No runs found
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Drawer>
  );
}