import { Title, Text, Card, SimpleGrid } from '@mantine/core';

export default function StatisticsPage() {
  return (
    <div>
      <Title order={1} mb="lg">Statistics</Title>
      
      <SimpleGrid cols={3} spacing="lg">
        <Card shadow="sm" padding="lg" withBorder>
          <Text size="sm" c="dimmed" mb="xs">Tasks Completed</Text>
          <Title order={2}>1,234</Title>
        </Card>
        
        <Card shadow="sm" padding="lg" withBorder>
          <Text size="sm" c="dimmed" mb="xs">Current Rank</Text>
          <Title order={2}>Gold III</Title>
        </Card>
        
        <Card shadow="sm" padding="lg" withBorder>
          <Text size="sm" c="dimmed" mb="xs">Experience</Text>
          <Title order={2}>4,567 XP</Title>
        </Card>
      </SimpleGrid>
    </div>
  );
}