'use client';

import { ScrollArea, Stack, Text, Title } from '@mantine/core';
import { useState } from 'react';

import { DataIngestionCard } from './components/DataIngestionCard';
import { HealthPanel } from './components/HealthPanel';
import { LogViewer } from './components/LogViewer';
import { MetricsCharts } from './components/MetricsCharts';
import { RecalcCard } from './components/RecalcCard';
import { RunDetailsDrawer } from './components/RunDetailsDrawer';

export default function SystemPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const [details, setDetails] = useState<{
    opened: boolean;
    title: string;
    pipeline: 'ingest' | 'recalc';
  }>({
    opened: false,
    title: '',
    pipeline: 'ingest',
  });

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  function openDetails(title: string, pipeline: 'ingest' | 'recalc') {
    setDetails({ opened: true, title, pipeline });
  }

  function closeDetails() {
    setDetails((prev) => ({ ...prev, opened: false }));
  }

  return (
    <ScrollArea h="calc(100vh - 140px)" type="auto" offsetScrollbars scrollbarSize={4}>
      <Stack gap="xl" pr="md">
        <HealthPanel />

        <Stack gap="md">
          <div>
            <Title order={3} style={{ color: 'var(--color-foreground)' }}>
              Pipelines
            </Title>
            <Text c="var(--color-foreground-muted)" size="sm" mt={4}>
              Управление процессами получения и обработки данных.
            </Text>
          </div>

          <DataIngestionCard onDetailsClick={() => openDetails('Data Ingestion Details', 'ingest')} />
          <RecalcCard onDetailsClick={() => openDetails('Recalc / Aggregate Details', 'recalc')} />
        </Stack>

        {/* <LogViewer />
        <MetricsCharts /> */}
      </Stack>

      <RunDetailsDrawer opened={details.opened} onClose={closeDetails} title={details.title} pipeline={details.pipeline} />
    </ScrollArea>
  );
}
