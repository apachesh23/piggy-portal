'use client';

import { Card, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import ReactECharts from 'echarts-for-react';

const DAYS = ['01-11', '01-12', '01-13', '01-14', '01-15', '01-16', '01-17'];

export function MetricsCharts() {
  const runsOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 16, top: 24, bottom: 24 },
    xAxis: { type: 'category', data: DAYS },
    yAxis: { type: 'value' },
    series: [{ name: 'Runs', type: 'bar', data: [2, 2, 3, 2, 4, 2, 3] }],
  };

  const rowsOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 16, top: 24, bottom: 24 },
    xAxis: { type: 'category', data: DAYS },
    yAxis: { type: 'value' },
    series: [
      { name: 'Rows', type: 'line', smooth: true, data: [80000, 92000, 105000, 98000, 120000, 99000, 128342] },
    ],
  };

  const durationOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 16, top: 24, bottom: 24 },
    xAxis: { type: 'category', data: DAYS },
    yAxis: { type: 'value' },
    series: [{ name: 'Duration (sec)', type: 'line', smooth: true, data: [110, 140, 125, 160, 150, 170, 134] }],
  };

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Metrics</Title>
        <Text c="var(--color-foreground-muted)" size="sm" mt={4}>
          Графики по запускам, объёму и длительности (пока моковые данные).
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Card padding="lg" radius="md" withBorder>
          <Title order={5} mb="xs">
            Runs per day
          </Title>
          <ReactECharts option={runsOption} style={{ height: 240 }} />
        </Card>

        <Card padding="lg" radius="md" withBorder>
          <Title order={5} mb="xs">
            Processed rows
          </Title>
          <ReactECharts option={rowsOption} style={{ height: 240 }} />
        </Card>
      </SimpleGrid>

      <Card padding="lg" radius="md" withBorder>
        <Title order={5} mb="xs">
          Duration trend
        </Title>
        <ReactECharts option={durationOption} style={{ height: 240 }} />
      </Card>
    </Stack>
  );
}
