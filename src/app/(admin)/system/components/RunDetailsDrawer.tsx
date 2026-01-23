'use client';

import { Badge, Drawer, Group, Loader, ScrollArea, Table, Text, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';

type RunRow = {
  id: string;
  pipeline: 'ingest' | 'recalc';
  trigger: 'cron' | 'manual';
  status: 'running' | 'success' | 'error';
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  rows_processed: number | null;
  error_message: string | null;
  meta: any;
  range_from: string | null;
  range_to: string | null;
  mode?: string | null;
};

type Props = {
  opened: boolean;
  onClose: () => void;

  /** e.g. "Data Ingestion Details" / "Recalc / Aggregate Details" */
  title: string;

  /** Optional: filter runs by pipeline */
  pipeline?: RunRow['pipeline'];
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

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/system/runs?limit=200', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) setRows(json.data ?? []);
      else console.error(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!opened) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const filteredRows = useMemo(() => {
    if (!pipeline) return rows;
    return rows.filter((r) => r.pipeline === pipeline);
  }, [rows, pipeline]);

  return (
    <Drawer opened={opened} onClose={onClose} title={title} position="bottom" size="xl">
      <Group justify="space-between" align="flex-end" mb="sm">
        <div>
          <Title order={4}>Activity</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Полная история запусков cron/manual из system_runs.
          </Text>
        </div>
        {loading ? <Loader size="sm" /> : null}
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
                    {r.id}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}

            {!loading && filteredRows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={10}>
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    No runs yet
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Drawer>
  );
}
